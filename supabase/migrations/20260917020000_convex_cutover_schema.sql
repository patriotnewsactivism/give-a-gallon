-- Give a Gallon: Convex -> Supabase initial schema
-- Production data is imported separately from the protected Convex backup.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  legacy_id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text,
  name text,
  role text not null default 'user' check (role in ('admin','user')),
  stripe_customer_id text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email)) where email is not null;

create table if not exists public.creators (
  id text primary key,
  user_legacy_id text not null references public.profiles(legacy_id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  bio text,
  category text,
  location text,
  cover_url text,
  avatar_url text,
  cover_storage_path text,
  avatar_storage_path text,
  social_links jsonb not null default '{}'::jsonb,
  total_gallons numeric not null default 0,
  total_amount_cents bigint not null default 0,
  total_donations integer not null default 0,
  goal numeric,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  featured_note text,
  network_source text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','community','journalist','organization','platform_verified')),
  balance_cents bigint not null default 0,
  disbursed_cents bigint not null default 0,
  paypal_email text,
  stripe_connect_account_id text,
  referral_code text unique,
  referral_count integer not null default 0,
  referral_gallons numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creators_user_idx on public.creators(user_legacy_id);
create index if not exists creators_active_idx on public.creators(is_active);
create index if not exists creators_featured_idx on public.creators(is_featured);
create index if not exists creators_verification_idx on public.creators(verification_status);

create table if not exists public.donations (
  id text primary key,
  creator_id text not null references public.creators(id) on delete cascade,
  donor_auth_user_id uuid references auth.users(id) on delete set null,
  donor_name text,
  donor_email text,
  gallons numeric not null default 0,
  amount_cents bigint not null default 0,
  net_cents bigint,
  platform_fee_cents bigint not null default 0,
  is_anonymous boolean not null default false,
  status text not null check (status in ('pending','completed','failed')),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create index if not exists donations_creator_created_idx
  on public.donations(creator_id, created_at desc);
create index if not exists donations_status_created_idx
  on public.donations(status, created_at desc);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(id) on delete cascade,
  provider text not null check (provider in ('paypal','stripe')),
  amount_cents bigint not null,
  recipient text not null,
  status text not null check (status in ('pending','processing','success','failed')),
  payout_batch_id text,
  payout_item_id text,
  error_message text,
  retry_count integer not null default 0,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verification_audits (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.creators(id) on delete cascade,
  previous_tier text not null,
  new_tier text not null,
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  reason text not null,
  automated boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_deduplications (
  event_key text primary key,
  provider text not null,
  processed_at timestamptz not null default now()
);

create table if not exists public.platform_stats (
  key text primary key default 'global',
  total_creators integer not null default 0,
  total_donors integer not null default 0,
  total_gallons numeric not null default 0,
  total_donations_cents bigint not null default 0,
  total_campaigns integer not null default 0,
  successful_campaigns integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Catch-all archive for any non-auth Convex collection that does not yet have a
-- normalized Supabase table. This guarantees source data can be preserved during cutover.
create table if not exists public.legacy_convex_documents (
  collection text not null,
  convex_id text not null,
  creation_time_ms numeric,
  payload jsonb not null,
  imported_at timestamptz not null default now(),
  primary key (collection, convex_id)
);

-- Link a Supabase Auth account to a migrated profile by email. New accounts get
-- a Supabase-native profile automatically.
create or replace function public.link_profile_to_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set auth_user_id = new.id,
         name = coalesce(name, new.raw_user_meta_data ->> 'name'),
         updated_at = now()
   where auth_user_id is null
     and email is not null
     and lower(email) = lower(new.email);

  if not found then
    insert into public.profiles (
      legacy_id, auth_user_id, email, name, email_verified_at
    ) values (
      'supabase:' || new.id::text,
      new.id,
      new.email,
      new.raw_user_meta_data ->> 'name',
      case when new.email_confirmed_at is null then null else new.email_confirmed_at end
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_link_profile on auth.users;
create trigger on_auth_user_link_profile
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute function public.link_profile_to_auth_user();

alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.donations enable row level security;
alter table public.payouts enable row level security;
alter table public.verification_audits enable row level security;
alter table public.webhook_deduplications enable row level security;
alter table public.platform_stats enable row level security;
alter table public.legacy_convex_documents enable row level security;

drop policy if exists "profile owner read" on public.profiles;
create policy "profile owner read" on public.profiles
for select to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "profile owner update" on public.profiles;
create policy "profile owner update" on public.profiles
for update to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "public active creators read" on public.creators;
create policy "public active creators read" on public.creators
for select to anon, authenticated
using (is_active = true or exists (
  select 1 from public.profiles p
  where p.legacy_id = creators.user_legacy_id
    and p.auth_user_id = auth.uid()
));

drop policy if exists "creator owner insert" on public.creators;
create policy "creator owner insert" on public.creators
for insert to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.legacy_id = creators.user_legacy_id
    and p.auth_user_id = auth.uid()
));

drop policy if exists "creator owner update" on public.creators;
create policy "creator owner update" on public.creators
for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.legacy_id = creators.user_legacy_id
    and p.auth_user_id = auth.uid()
))
with check (exists (
  select 1 from public.profiles p
  where p.legacy_id = creators.user_legacy_id
    and p.auth_user_id = auth.uid()
));

-- Raw donations remain private. Public pages use the safe view below.
drop policy if exists "creator owner donations read" on public.donations;
create policy "creator owner donations read" on public.donations
for select to authenticated
using (exists (
  select 1
    from public.creators c
    join public.profiles p on p.legacy_id = c.user_legacy_id
   where c.id = donations.creator_id
     and p.auth_user_id = auth.uid()
));

drop policy if exists "public platform stats read" on public.platform_stats;
create policy "public platform stats read" on public.platform_stats
for select to anon, authenticated using (true);

create or replace view public.public_donations as
select
  id,
  creator_id,
  case when is_anonymous then 'Anonymous' else coalesce(donor_name, 'Anonymous') end as donor_name,
  gallons,
  amount_cents,
  status,
  is_anonymous,
  created_at
from public.donations
where status = 'completed';

grant select on public.public_donations to anon, authenticated;
grant select on public.platform_stats to anon, authenticated;
grant select on public.creators to anon, authenticated;

-- Creator image storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creator-media',
  'creator-media',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public creator media read" on storage.objects;
create policy "public creator media read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'creator-media');

drop policy if exists "users upload own creator media" on storage.objects;
create policy "users upload own creator media" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'creator-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own creator media" on storage.objects;
create policy "users update own creator media" on storage.objects
for update to authenticated
using (
  bucket_id = 'creator-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'creator-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users delete own creator media" on storage.objects;
create policy "users delete own creator media" on storage.objects
for delete to authenticated
using (
  bucket_id = 'creator-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
