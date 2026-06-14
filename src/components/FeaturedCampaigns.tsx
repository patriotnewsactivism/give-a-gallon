/**
 * FeaturedCampaigns — editorial spotlight section
 * Shows isFeatured=true campaigns with optional featuredNote
 */
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { Fuel, Star, ExternalLink } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { FuelGaugeMark } from "@/components/FuelGaugeMark";
import { VERIFICATION_TIERS } from "../../convex/constants";

const NETWORK_LABEL: Record<string, { label: string; color: string }> = {
  wtpnews:       { label: "WTP News Pick", color: "text-fuel" },
  civilrightshub:{ label: "Civil Rights Hub Pick", color: "text-blue-400" },
};

export function FeaturedCampaigns() {
  const featured = useQuery(api.creators.listFeatured);

  if (!featured || featured.length === 0) return null;

  return (
    <section className="border-t border-border/30 py-12 sm:py-14">
      <div className="container max-w-4xl">
        <Reveal>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuel/10 text-fuel text-xs font-semibold mb-2">
                <Star className="size-3 fill-current" /> EDITORIAL PICKS
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Campaigns We Believe In
              </h2>
            </div>
            <Link to="/explore" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Browse all →
            </Link>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-4">
          {featured.map((creator) => {
            const tier = VERIFICATION_TIERS[(creator.verificationStatus ?? "unverified") as keyof typeof VERIFICATION_TIERS];
            const progress = creator.goal
              ? Math.min(100, Math.round((creator.totalGallons / creator.goal) * 100))
              : null;
            const networkLabel = creator.networkSource
              ? NETWORK_LABEL[creator.networkSource]
              : null;

            return (
              <Reveal key={creator._id}>
                <Link
                  to={`/${creator.slug}`}
                  className="group block rounded-2xl border border-fuel/15 bg-fuel/[0.03] hover:border-fuel/30 hover:bg-fuel/[0.06] transition-all overflow-hidden"
                >
                  {/* Cover */}
                  {creator.coverUrl ? (
                    <div className="h-28 overflow-hidden">
                      <img
                        src={creator.coverUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      />
                    </div>
                  ) : (
                    <div className="h-10 bg-gradient-to-r from-fuel/10 to-transparent" />
                  )}

                  <div className="p-4">
                    {/* Network source badge */}
                    {networkLabel && (
                      <div className={`text-xs font-semibold mb-1.5 ${networkLabel.color}`}>
                        ✦ {networkLabel.label}
                      </div>
                    )}

                    {/* Creator info */}
                    <div className="flex items-start gap-3 mb-3">
                      {creator.avatarUrl ? (
                        <img src={creator.avatarUrl} alt="" className="size-10 rounded-full object-cover border border-border/40 shrink-0" />
                      ) : (
                        <div className="size-10 rounded-full bg-fuel/15 flex items-center justify-center text-sm font-bold text-fuel border border-fuel/20 shrink-0">
                          {creator.displayName[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold truncate group-hover:text-fuel transition-colors">
                          {creator.displayName}
                        </div>
                        {tier && creator.verificationStatus !== "unverified" && (
                          <span className={`text-xs ${tier.color}`}>{tier.badge} {tier.label}</span>
                        )}
                      </div>
                      <ExternalLink className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 mt-1 ml-auto transition-colors" />
                    </div>

                    {/* Editorial note or bio */}
                    {(creator.featuredNote || creator.bio) && (
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                        {creator.featuredNote || creator.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Fuel className="size-3 text-fuel" />
                        <span>{creator.totalGallons.toLocaleString()} gal</span>
                      </div>
                      {progress !== null && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-border/40 overflow-hidden">
                            <div
                              className="h-full bg-fuel rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span>{progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
