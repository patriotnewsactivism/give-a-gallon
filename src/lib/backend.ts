import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Id<T extends string = string> = string & { readonly __table?: T };
type BackendFn = (args?: any) => Promise<any>;

let revision = 0;
const dataListeners = new Set<() => void>();
function invalidate() {
  revision += 1;
  for (const listener of dataListeners) listener();
}
function subscribeData(listener: () => void) {
  dataListeners.add(listener);
  return () => dataListeners.delete(listener);
}

export function useQuery(fn: BackendFn | "skip" | null | undefined, args?: any) {
  const rev = useSyncExternalStore(subscribeData, () => revision, () => revision);
  const [value, setValue] = useState<any>(undefined);
  const argKey = args === "skip" ? "skip" : JSON.stringify(args ?? {});

  useEffect(() => {
    if (!fn || fn === "skip" || args === "skip") {
      setValue(undefined);
      return;
    }
    let active = true;
    fn(args ?? {})
      .then(result => {
        if (active) setValue(result);
      })
      .catch(error => {
        console.error("Backend query failed", error);
        if (active) setValue(null);
      });
    return () => {
      active = false;
    };
  }, [fn, argKey, rev]);

  return value;
}

export function useMutation(fn: BackendFn) {
  return useCallback(
    async (args?: any) => {
      const result = await fn(args ?? {});
      invalidate();
      return result;
    },
    [fn],
  );
}

export const useAction = useMutation;

let authSnapshot = { isLoading: true, isAuthenticated: false };
const authListeners = new Set<() => void>();
function publishAuth(next: typeof authSnapshot) {
  authSnapshot = next;
  for (const listener of authListeners) listener();
  invalidate();
}
function subscribeAuth(listener: () => void) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

void supabase.auth.getSession().then(({ data }) => {
  publishAuth({ isLoading: false, isAuthenticated: !!data.session });
});
supabase.auth.onAuthStateChange((_event, session) => {
  publishAuth({ isLoading: false, isAuthenticated: !!session });
});

export function useConvexAuth() {
  return useSyncExternalStore(subscribeAuth, () => authSnapshot, () => authSnapshot);
}

export function useAuthActions() {
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (_provider: string, formData: FormData) => {
    const flow = String(formData.get("flow") ?? "signIn");
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    if (flow === "signUp") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      return data;
    }
    if (flow === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=1`,
      });
      if (error) throw error;
      return { sent: true };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  return { signIn, signOut };
}

function num(value: any) {
  return Number(value ?? 0);
}
function ms(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}
function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
function throwIf(error: any) {
  if (error) throw new Error(error.message ?? String(error));
}

function mapProfile(row: any) {
  if (!row) return null;
  return {
    _id: row.legacy_id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: ms(row.created_at),
    lastLoginAt: ms(row.last_login_at),
  };
}
function mapCreator(row: any) {
  if (!row) return null;
  return {
    _id: row.id,
    userId: row.user_legacy_id,
    slug: row.slug,
    displayName: row.display_name,
    bio: row.bio,
    category: row.category,
    location: row.location,
    urgency: row.urgency,
    coverUrl: row.cover_url,
    avatarUrl: row.avatar_url,
    socialLinks: row.social_links ?? {},
    totalGallons: num(row.total_gallons),
    totalAmountCents: num(row.total_amount_cents),
    totalCentsRaised: num(row.total_amount_cents),
    totalDonations: num(row.total_donations),
    goal: row.goal == null ? undefined : num(row.goal),
    isActive: !!row.is_active,
    isFeatured: !!row.is_featured,
    featuredNote: row.featured_note,
    networkSource: row.network_source,
    verificationStatus: row.verification_status ?? "unverified",
    balanceCents: num(row.balance_cents),
    disbursedCents: num(row.disbursed_cents),
    payoutsCents: num(row.payouts_cents),
    paypalEmail: row.paypal_email,
    stripeConnectAccountId: row.stripe_connect_account_id,
    stripeAccountStatus: row.paypal_email ? "active" : "not_connected",
    referralCode: row.referral_code,
    referralCount: num(row.referral_count),
    referralGallons: num(row.referral_gallons),
    createdAt: ms(row.created_at),
    updatedAt: ms(row.updated_at),
  };
}
function mapDonation(row: any) {
  if (!row) return null;
  return {
    _id: row.id,
    creatorId: row.creator_id,
    donorId: row.donor_profile_legacy_id,
    donorName: row.is_anonymous ? "Anonymous" : row.donor_name || "Anonymous",
    donorEmail: row.donor_email,
    gallons: num(row.gallons),
    amountCents: num(row.amount_cents),
    netCents: num(row.creator_net_cents ?? row.net_cents),
    feeCents: num(row.platform_fee_cents),
    platformFeeCents: num(row.platform_fee_cents),
    processorFeeCents: row.processor_fee_cents == null ? null : num(row.processor_fee_cents),
    creatorNetCents: row.creator_net_cents == null ? null : num(row.creator_net_cents),
    platformRevenueCents: num(row.platform_revenue_cents),
    feeReconciled: !!row.fee_reconciled,
    isAnonymous: !!row.is_anonymous,
    status: row.status,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    paypalOrderId: row.paypal_order_id,
    message: row.message,
    referralCode: row.referral_code,
    createdAt: ms(row.created_at),
  };
}

async function currentUserAndProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { user: null, profile: null };
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();
  throwIf(error);
  return { user: authData.user, profile };
}
async function requireProfile() {
  const { user, profile } = await currentUserAndProfile();
  if (!user || !profile) throw new Error("Not authenticated");
  return { user, profile };
}
async function getMyCreatorRow() {
  const { profile } = await requireProfile();
  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .eq("user_legacy_id", profile.legacy_id)
    .maybeSingle();
  throwIf(error);
  return data;
}
async function isAdminUser() {
  const { profile } = await requireProfile().catch(() => ({ profile: null as any }));
  return profile?.role === "admin";
}

const auth = {
  currentUser: async () => {
    const { profile } = await currentUserAndProfile();
    return mapProfile(profile);
  },
};

const creators = {
  listActive: async ({ limit = 100 }: any = {}) => {
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("is_active", true)
      .order("total_gallons", { ascending: false })
      .limit(Math.min(Number(limit) || 100, 250));
    throwIf(error);
    return (data ?? []).map(mapCreator);
  },
  listNewest: async ({ limit = 12 }: any = {}) => {
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(Math.min(Number(limit) || 12, 50));
    throwIf(error);
    return (data ?? []).map(mapCreator);
  },
  listFeatured: async () => {
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(10);
    throwIf(error);
    return (data ?? []).map(mapCreator);
  },
  getBySlug: async ({ slug }: any) => {
    if (!slug) return null;
    const { data, error } = await supabase.from("creators").select("*").eq("slug", slug).maybeSingle();
    throwIf(error);
    return mapCreator(data);
  },
  getById: async ({ id }: any) => {
    if (!id) return null;
    const { data, error } = await supabase.from("creators").select("*").eq("id", id).maybeSingle();
    throwIf(error);
    return mapCreator(data);
  },
  getMine: async () => mapCreator(await getMyCreatorRow()),
  upsert: async (args: any) => {
    const { profile } = await requireProfile();
    const existing = await getMyCreatorRow();
    const payload: any = {
      user_legacy_id: profile.legacy_id,
      slug: args.slug,
      display_name: args.displayName,
      bio: args.bio ?? null,
      goal: args.goal ?? null,
      category: args.category ?? null,
      location: args.location ?? null,
      urgency: args.urgency ?? null,
      social_links: args.socialLinks ?? {},
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      const { data, error } = await supabase.from("creators").update(payload).eq("id", existing.id).select("*").single();
      throwIf(error);
      return mapCreator(data);
    }
    payload.id = randomId("creator");
    payload.created_at = new Date().toISOString();
    payload.is_active = true;
    const { data, error } = await supabase.from("creators").insert(payload).select("*").single();
    throwIf(error);
    return mapCreator(data);
  },
  setImages: async (args: any) => {
    const creator = await getMyCreatorRow();
    if (!creator) throw new Error("Creator profile not found");
    const patch: any = { updated_at: new Date().toISOString() };
    if (args.avatarUrl !== undefined) patch.avatar_url = args.avatarUrl;
    if (args.coverUrl !== undefined) patch.cover_url = args.coverUrl;
    if (args.avatarPath !== undefined) patch.avatar_storage_path = args.avatarPath;
    if (args.coverPath !== undefined) patch.cover_storage_path = args.coverPath;
    const { data, error } = await supabase.from("creators").update(patch).eq("id", creator.id).select("*").single();
    throwIf(error);
    return mapCreator(data);
  },
  getPlatformStats: async () => {
    const { data: stats, error } = await supabase.from("platform_stats").select("*").eq("key", "global").maybeSingle();
    throwIf(error);
    const { count } = await supabase.from("public_donations").select("id", { count: "exact", head: true });
    return {
      totalGallons: num(stats?.total_gallons),
      totalCreators: num(stats?.total_creators),
      totalDonations: count ?? 0,
      totalAmountCents: num(stats?.total_donations_cents),
    };
  },
};

const donations = {
  listForCreator: async ({ creatorId, limit = 50 }: any) => {
    if (!creatorId) return [];
    const { data, error } = await supabase
      .from("public_donations")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(Math.min(Number(limit) || 50, 250));
    throwIf(error);
    return (data ?? []).map(mapDonation);
  },
  getRecent: async ({ limit = 10 }: any = {}) => {
    const { data, error } = await supabase
      .from("public_donations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(Number(limit) || 10, 50));
    throwIf(error);
    const creatorIds = [...new Set((data ?? []).map((row: any) => row.creator_id))];
    const { data: creatorRows, error: creatorError } = creatorIds.length
      ? await supabase.from("creators").select("id,slug,display_name").in("id", creatorIds)
      : { data: [], error: null } as any;
    throwIf(creatorError);
    const creatorsById = new Map<string, any>((creatorRows ?? []).map((row: any) => [row.id, row]));
    return (data ?? []).map((row: any) => {
      const creator = creatorsById.get(row.creator_id);
      return {
        ...mapDonation(row),
        creatorSlug: creator?.slug ?? "",
        creatorName: creator?.display_name ?? "Unknown Creator",
      };
    });
  },
  platformStats: async () => {
    const { data, error } = await supabase.from("platform_stats").select("*").eq("key", "global").maybeSingle();
    throwIf(error);
    return {
      totalGallons: num(data?.total_gallons),
      totalAmountCents: num(data?.total_donations_cents),
      totalDonors: num(data?.total_donors),
      totalCreators: num(data?.total_creators),
      totalCampaigns: num(data?.total_campaigns),
      successfulCampaigns: num(data?.successful_campaigns),
    };
  },
  getMyDonations: async () => {
    const { user, profile } = await currentUserAndProfile();
    if (!user || !profile) return [];
    let query = supabase
      .from("donations")
      .select("*, creators(slug,display_name,category,location,verification_status,avatar_url)")
      .eq("status", "completed")
      .order("created_at", { ascending: false });
    if (profile.email) query = query.or(`donor_auth_user_id.eq.${user.id},donor_email.eq.${profile.email}`);
    else query = query.eq("donor_auth_user_id", user.id);
    const { data, error } = await query;
    throwIf(error);
    const result = [] as any[];
    for (const row of data ?? []) {
      const c = row.creators ?? {};
      const { data: recentUpdates } = await supabase
        .from("updates")
        .select("id,title,body,impact_tag,created_at")
        .eq("creator_id", row.creator_id)
        .gte("created_at", row.created_at)
        .order("created_at", { ascending: false })
        .limit(3);
      result.push({
        ...mapDonation(row),
        creatorSlug: c.slug ?? "",
        creatorName: c.display_name ?? "Unknown Creator",
        creatorCategory: c.category ?? null,
        creatorLocation: c.location ?? null,
        creatorVerification: c.verification_status ?? "unverified",
        creatorAvatarUrl: c.avatar_url ?? null,
        recentUpdates: (recentUpdates ?? []).map((u: any) => ({
          _id: u.id, title: u.title, body: u.body, impactTag: u.impact_tag, createdAt: ms(u.created_at),
        })),
      });
    }
    return result;
  },
  getMyImpactSummary: async () => {
    const { user, profile } = await currentUserAndProfile();
    if (!user || !profile) return null;
    const rows = await donations.getMyDonations();
    const totalGallons = rows.reduce((s: number, d: any) => s + d.gallons, 0);
    return {
      totalGallons,
      estimatedMiles: Math.round(totalGallons * 30),
      uniqueCreators: new Set(rows.map((d: any) => d.creatorId)).size,
      totalAmountCents: rows.reduce((s: number, d: any) => s + d.amountCents, 0),
    };
  },
  getByPayPalOrder: async ({ sessionId }: any) => {
    if (!sessionId) return null;
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .or(`id.eq.${sessionId},paypal_order_id.eq.${sessionId}`)
      .maybeSingle();
    throwIf(error);
    return mapDonation(data);
  },
};

const platform = {
  getStats: async () => {
    const s = await donations.platformStats();
    return {
      totalDonationsCents: s.totalAmountCents,
      totalGallons: s.totalGallons,
      totalDonors: s.totalDonors,
      totalCreators: s.totalCreators,
      totalCampaigns: s.totalCampaigns,
      successfulCampaigns: s.successfulCampaigns,
      updatedAt: Date.now(),
    };
  },
};

const updates = {
  listForCreator: async ({ creatorId }: any) => {
    if (!creatorId) return [];
    const { data, error } = await supabase.from("updates").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false });
    throwIf(error);
    return (data ?? []).map((row: any) => ({ _id: row.id, creatorId: row.creator_id, title: row.title, body: row.body, impactTag: row.impact_tag, imageUrl: row.image_url, createdAt: ms(row.created_at) }));
  },
  create: async ({ title, body, impactTag }: any) => {
    const creator = await getMyCreatorRow();
    if (!creator) throw new Error("Creator profile not found");
    const { data, error } = await supabase.from("updates").insert({ id: randomId("update"), creator_id: creator.id, title, body, impact_tag: impactTag ?? null }).select("*").single();
    throwIf(error);
    return data?.id;
  },
};

const milestones = {
  listForCreator: async ({ creatorId }: any) => {
    if (!creatorId) return [];
    const { data, error } = await supabase.from("milestones").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false });
    throwIf(error);
    return (data ?? []).map((row: any) => ({ _id: row.id, creatorId: row.creator_id, title: row.title, body: row.body, gallons: num(row.gallons), createdAt: ms(row.created_at) }));
  },
};

const wall = {
  listForCreator: async ({ creatorId }: any) => {
    if (!creatorId) return [];
    const { data, error } = await supabase.from("wall_posts").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false });
    throwIf(error);
    return (data ?? []).map((row: any) => ({ _id: row.id, creatorId: row.creator_id, userId: row.author_profile_legacy_id, authorName: row.author_name || "Supporter", body: row.body, createdAt: ms(row.created_at) }));
  },
  post: async ({ creatorId, body }: any) => {
    const { profile } = await requireProfile();
    const { data, error } = await supabase.from("wall_posts").insert({ id: randomId("wall"), creator_id: creatorId, author_profile_legacy_id: profile.legacy_id, author_name: profile.name || "Supporter", body }).select("id").single();
    throwIf(error);
    return data?.id;
  },
  remove: async ({ id }: any) => {
    const { error } = await supabase.from("wall_posts").delete().eq("id", id);
    throwIf(error);
    return { success: true };
  },
};

const referrals = {
  getReferralLeaderboard: async () => {
    const { data, error } = await supabase.from("creators").select("*").eq("is_active", true).order("referral_gallons", { ascending: false }).order("referral_count", { ascending: false }).limit(50);
    throwIf(error);
    return (data ?? []).filter((r: any) => r.referral_code || num(r.referral_count) > 0).map((row: any, i: number) => ({ rank: i + 1, slug: row.slug, displayName: row.display_name, avatarUrl: row.avatar_url, referralCode: row.referral_code, referralCount: num(row.referral_count), referralGallons: num(row.referral_gallons) }));
  },
  getMyReferralCode: async () => {
    const creator = await getMyCreatorRow();
    if (!creator) throw new Error("Creator profile not found");
    if (creator.referral_code) return creator.referral_code;
    const base = creator.slug.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
    const code = `${base}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const { error } = await supabase.from("creators").update({ referral_code: code }).eq("id", creator.id);
    throwIf(error);
    return code;
  },
  updateReferralCode: async ({ code }: any) => {
    const creator = await getMyCreatorRow();
    if (!creator) throw new Error("Creator profile not found");
    const normalized = String(code || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (normalized.length < 3) throw new Error("Code must be at least 3 characters");
    const { error } = await supabase.from("creators").update({ referral_code: normalized }).eq("id", creator.id);
    throwIf(error);
    return normalized;
  },
  getMyReferralStats: async () => {
    const creator = await getMyCreatorRow();
    if (!creator) return null;
    const board = await referrals.getReferralLeaderboard();
    const code = creator.referral_code;
    const { data: driven, error } = code
      ? await supabase.from("donations").select("gallons,created_at").eq("status", "completed").eq("referral_code", code)
      : { data: [], error: null } as any;
    throwIf(error);
    const monthly = new Map<string, { month: string; gallons: number; donations: number }>();
    for (const d of driven ?? []) {
      const date = new Date(d.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const old = monthly.get(key) ?? { month: key, gallons: 0, donations: 0 };
      old.gallons += num(d.gallons); old.donations += 1; monthly.set(key, old);
    }
    return {
      referralCode: code,
      referralCount: num(creator.referral_count),
      referralGallons: num(creator.referral_gallons),
      totalDonations: (driven ?? []).length,
      monthlyData: [...monthly.values()].slice(-12),
      leaderboard: board.map((e: any) => ({ ...e, isMe: e.slug === creator.slug })),
    };
  },
};

const notifications = {
  getRecent: async () => {
    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
    throwIf(error);
    return (data ?? []).map((row: any) => ({ _id: row.id, title: row.title, body: row.body, type: row.type, audience: row.audience, link: row.link, createdAt: ms(row.created_at) }));
  },
  getRecentPublic: async () => notifications.getRecent(),
};

const support = {
  submitTicket: async (args: any) => {
    const { data: authData } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("support_tickets").insert({ id: randomId("ticket"), auth_user_id: authData.user?.id ?? null, name: args.name ?? null, email: args.email ?? null, subject: args.subject ?? null, message: args.message ?? args.body ?? "" }).select("id").single();
    throwIf(error);
    return { success: true, ticketId: data?.id };
  },
};

const subscriptions = {
  getMySubscription: async () => {
    const { user, profile } = await currentUserAndProfile();
    if (!user || !profile) return null;
    const { data, error } = await supabase.from("subscriptions").select("*").or(`auth_user_id.eq.${user.id},profile_legacy_id.eq.${profile.legacy_id}`).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
    throwIf(error);
    if (!data) return null;
    const tierMap: any = {
      "fuel-supporter": ["Fuel Supporter", 1],
      "community-builder": ["Community Builder", 3],
      "freedom-partner": ["Freedom Partner", 7],
      "impact-champion": ["Impact Champion", 17],
    };
    const [tierName, gallonsPerMonth] = tierMap[data.plan] ?? [data.plan, 0];
    return { _id: data.id, tierId: data.plan, tierName, gallonsPerMonth, status: data.status, currentPeriodEnd: ms(data.current_period_end), amountCents: num(data.amount_cents) };
  },
  getSubscriptionStats: async () => {
    const { data, error } = await supabase.from("subscriptions").select("plan").eq("status", "active");
    throwIf(error);
    const gallons: any = { "fuel-supporter": 1, "community-builder": 3, "freedom-partner": 7, "impact-champion": 17 };
    return { activeCount: (data ?? []).length, totalGallonsPerMonth: (data ?? []).reduce((s: number, r: any) => s + (gallons[r.plan] ?? 0), 0) };
  },
  createSubscriptionOrder: async ({ tierId }: any) => invokeFunction("membership", { action: "create", tierId }),
  cancelSubscription: async () => invokeFunction("membership", { action: "cancel" }),
};

async function invokeFunction(name: string, body: any) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message || `${name} failed`);
  if (data?.error) throw new Error(data.error);
  return data;
}

const paypal = {
  createCheckoutSession: async (args: any) => invokeFunction("paypal-checkout", { action: "create", ...args }),
  captureOrder: async ({ orderId }: any) => invokeFunction("paypal-checkout", { action: "capture", orderId }),
};

const paypalConnect = {
  startOnboarding: async ({ paypalEmail }: any) => {
    const creator = await getMyCreatorRow();
    if (!creator) throw new Error("Creator profile not found");
    const { error } = await supabase.from("creators").update({ paypal_email: paypalEmail, updated_at: new Date().toISOString() }).eq("id", creator.id);
    throwIf(error);
    return { success: true };
  },
  getBalance: async () => {
    const creator = await getMyCreatorRow();
    if (!creator) throw new Error("Creator not found");
    return { availableCents: Math.max(0, num(creator.balance_cents)), pendingCents: 0, accountStatus: creator.paypal_email ? "active" : "not_connected", currency: "USD" };
  },
  requestPayout: async (args: any) => invokeFunction("paypal-payouts", { action: "payout", ...args }),
};

const admin = {
  isAdmin: async () => isAdminUser(),
  getPlatformOverview: async () => {
    if (!(await isAdminUser())) throw new Error("Unauthorized");
    const now = Date.now();
    const last24 = new Date(now - 86400000).toISOString();
    const last7 = new Date(now - 7 * 86400000).toISOString();
    const [{ data: stats }, { data: d24 }, { data: d7 }, { data: subs }, { data: feeSummary, error: feeSummaryError }] = await Promise.all([
      supabase.from("platform_stats").select("*").eq("key", "global").maybeSingle(),
      supabase.from("donations").select("gallons,amount_cents").eq("status", "completed").gte("created_at", last24),
      supabase.from("donations").select("amount_cents").eq("status", "completed").gte("created_at", last7),
      supabase.from("subscriptions").select("amount_cents").eq("status", "active"),
      supabase.rpc("get_platform_fee_summary"),
    ]);
    throwIf(feeSummaryError);
    const fees = Array.isArray(feeSummary) ? feeSummary[0] : feeSummary;
    return {
      totalCreators: num(stats?.total_creators),
      activeCreators: num(stats?.total_creators),
      totalGallons: num(stats?.total_gallons),
      totalAmountCents: num(stats?.total_donations_cents),
      totalDonors: num(stats?.total_donors),
      activeSubscriptions: (subs ?? []).length,
      last24hDonations: (d24 ?? []).length, last24hGallons: (d24 ?? []).reduce((s: number, d: any) => s + num(d.gallons), 0), last24hAmountCents: (d24 ?? []).reduce((s: number, d: any) => s + num(d.amount_cents), 0),
      last7dDonations: (d7 ?? []).length, last7dAmountCents: (d7 ?? []).reduce((s: number, d: any) => s + num(d.amount_cents), 0), monthlyRecurringCents: (subs ?? []).reduce((s: number, d: any) => s + num(d.amount_cents), 0),
      platformFeeCents: num(fees?.platform_fee_cents),
      processorFeeCents: num(fees?.processor_fee_cents),
      creatorNetCents: num(fees?.creator_net_cents),
      platformRevenueCents: num(fees?.platform_revenue_cents),
      feeLedgerGrossCents: num(fees?.gross_cents),
      unreconciledDonations: num(fees?.unreconciled_donations),
    };
  },
  listAllCreators: async () => {
    if (!(await isAdminUser())) throw new Error("Unauthorized");
    const { data, error } = await supabase.from("creators").select("*").order("created_at", { ascending: false });
    throwIf(error);
    const { data: profiles } = await supabase.from("profiles").select("legacy_id,email,last_login_at");
    const pmap = new Map<string, any>((profiles ?? []).map((p: any) => [p.legacy_id, p]));
    const { data: ds } = await supabase.from("donations").select("creator_id,created_at,gallons").eq("status", "completed").order("created_at", { ascending: false });
    const last = new Map<string, { at: number; gallons: number }>();
    for (const d of ds ?? []) if (!last.has(d.creator_id)) last.set(d.creator_id, { at: ms(d.created_at), gallons: num(d.gallons) });
    return (data ?? []).map((r: any) => ({
      ...mapCreator(r),
      email: pmap.get(r.user_legacy_id)?.email,
      lastLoginAt: ms(pmap.get(r.user_legacy_id)?.last_login_at),
      lastDonationAt: last.get(r.id)?.at ?? null,
      lastDonationGallons: last.get(r.id)?.gallons ?? null,
    }));
  },
  getPlatformFeeLedger: async ({ limit = 100 }: any = {}) => {
    if (!(await isAdminUser())) throw new Error("Unauthorized");
    const { data, error } = await supabase
      .from("platform_fee_ledger")
      .select("*, donations!inner(creator_id,donor_name,is_anonymous,created_at,creators!inner(slug,display_name))")
      .order("created_at", { ascending: false })
      .limit(Math.min(Number(limit) || 100, 500));
    throwIf(error);
    return (data ?? []).map((row: any) => ({
      donationId: row.donation_id,
      provider: row.provider,
      grossCents: num(row.gross_cents),
      platformFeeCents: num(row.platform_fee_cents),
      processorFeeCents: row.processor_fee_cents == null ? null : num(row.processor_fee_cents),
      creatorNetCents: row.creator_net_cents == null ? null : num(row.creator_net_cents),
      platformRevenueCents: num(row.platform_revenue_cents),
      reconciled: !!row.reconciled,
      creatorSlug: row.donations?.creators?.slug,
      creatorName: row.donations?.creators?.display_name,
      donorName: row.donations?.is_anonymous ? "Anonymous" : (row.donations?.donor_name || "Anonymous"),
      createdAt: ms(row.donations?.created_at ?? row.created_at),
    }));
  },
  listAllDonations: async ({ limit = 50 }: any = {}) => {
    if (!(await isAdminUser())) throw new Error("Unauthorized");
    const { data, error } = await supabase.from("donations").select("*, creators!inner(slug,display_name)").eq("status", "completed").order("created_at", { ascending: false }).limit(Math.min(Number(limit) || 50, 250));
    throwIf(error);
    return (data ?? []).map((r: any) => ({ ...mapDonation(r), creatorSlug: r.creators?.slug, creatorName: r.creators?.display_name }));
  },
  sendNotification: async (args: any) => {
    if (!(await isAdminUser())) throw new Error("Unauthorized");
    const { data, error } = await supabase.from("notifications").insert({ id: randomId("notif"), title: args.title, body: args.body, type: args.type ?? "announcement", audience: args.audience ?? "all", link: args.link || null, is_public: true }).select("id").single();
    throwIf(error); return { success: true, id: data?.id };
  },
  toggleCreatorActive: async ({ creatorId, isActive }: any) => {
    if (!(await isAdminUser())) throw new Error("Unauthorized");
    const { error } = await supabase.from("creators").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", creatorId); throwIf(error); return { success: true };
  },
  toggleCreatorFeatured: async ({ creatorId, isFeatured }: any) => {
    if (!(await isAdminUser())) throw new Error("Unauthorized");
    const { error } = await supabase.from("creators").update({ is_featured: isFeatured, updated_at: new Date().toISOString() }).eq("id", creatorId); throwIf(error); return { success: true };
  },
  seedDemoData: async () => ({ message: "Demo seeding is disabled after the Supabase migration to protect production data." }),
};

export const api: any = {
  auth,
  creators,
  donations,
  platform,
  updates,
  milestones,
  wall,
  referrals,
  notifications,
  support,
  subscriptions,
  paypal,
  paypalConnect,
  admin,
  files: {},
};
