/**
 * NewestCreators — "Just Joined" strip on the landing page
 * Shows the most recently created active profiles to drive
 * social proof and encourage new signups.
 */
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { Fuel, Sparkles, UserPlus } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CATEGORIES } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

function timeAgo(ts: number) {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "recently";
  }
}

function categoryLabel(cat?: string) {
  if (!cat) return null;
  const found = CATEGORIES.find((c: { id: string; label: string }) => c.id === cat);
  return found?.label ?? cat;
}

export function NewestCreators() {
  const creators = useQuery(api.creators.listNewest, { limit: 12 });

  if (!creators || creators.length === 0) return null;

  return (
    <section className="border-t border-border/30 py-10 sm:py-12 overflow-hidden">
      <div className="container max-w-6xl">
        <Reveal>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold mb-2">
                <UserPlus className="size-3" /> JUST JOINED
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Newest Campaigns
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                These activists just launched — be their first supporter.
              </p>
            </div>
            <Link
              to="/explore"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Browse all →
            </Link>
          </div>
        </Reveal>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-3 sm:pb-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible snap-x snap-mandatory">
          {creators.map((creator, i) => {
            const catLabel = categoryLabel(creator.category);
            const joined = creator.createdAt ? timeAgo(creator.createdAt) : null;

            return (
              <Reveal key={creator._id} delayMs={i * 40}>
                <Link
                  to={`/${creator.slug}`}
                  className="group flex-shrink-0 w-56 sm:w-auto snap-start block rounded-2xl border border-border/40 bg-card/60 hover:border-fuel/40 hover:bg-fuel/[0.04] transition-all overflow-hidden shadow-sm shadow-black/20 hover:shadow-md hover:shadow-fuel/10"
                >
                  {/* Mini cover strip */}
                  {creator.coverUrl ? (
                    <div className="h-16 overflow-hidden">
                      <img
                        src={creator.coverUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                      />
                    </div>
                  ) : (
                    <div className="h-8 bg-gradient-to-r from-green-500/15 via-fuel/10 to-transparent" />
                  )}

                  <div className="p-3">
                    <div className="flex items-center gap-2.5 mb-2">
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt=""
                          className="size-9 rounded-full object-cover border border-border/40 shrink-0 -mt-5 ring-2 ring-background"
                        />
                      ) : (
                        <div className="size-9 rounded-full bg-fuel/15 flex items-center justify-center text-sm font-bold text-fuel border border-fuel/20 shrink-0 -mt-5 ring-2 ring-background">
                          {creator.displayName[0]}
                        </div>
                      )}
                      <div className="min-w-0 pt-0.5">
                        <div className="font-bold text-sm truncate group-hover:text-fuel transition-colors leading-tight">
                          {creator.displayName}
                        </div>
                        {catLabel && (
                          <div className="text-xs text-muted-foreground truncate">{catLabel}</div>
                        )}
                      </div>
                    </div>

                    {creator.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                        {creator.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span className="inline-flex items-center gap-1 text-green-400 font-medium">
                        <Sparkles className="size-3" />
                        {joined ?? "New"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Fuel className="size-3 text-fuel" />
                        {creator.totalGallons > 0
                          ? `${creator.totalGallons} gal`
                          : "Be first!"}
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {/* Mobile "browse all" link */}
        <div className="mt-4 text-center sm:hidden">
          <Link to="/explore" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Browse all campaigns →
          </Link>
        </div>
      </div>
    </section>
  );
}
