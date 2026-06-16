import { useQuery } from "convex/react";
import {
  Fuel,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { CATEGORIES, VERIFICATION_TIERS, URGENCY_LEVELS } from "@/lib/constants";
import { FuelGaugeMark } from "@/components/FuelGaugeMark";
import { NetworkBanner } from "@/components/NetworkBanner";
import { Input } from "@/components/ui/input";

function VerificationBadge({ status }: { status?: string }) {
  const tier = VERIFICATION_TIERS[(status ?? "unverified") as keyof typeof VERIFICATION_TIERS]
    ?? VERIFICATION_TIERS.unverified;
  if (status === "unverified" || !status) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${tier.color} ${tier.bg}`}>
      {tier.badge} {tier.label}
    </span>
  );
}

function UrgencyPip({ urgency }: { urgency?: string }) {
  if (!urgency || urgency === "low") return null;
  const u = URGENCY_LEVELS[urgency as keyof typeof URGENCY_LEVELS];
  return (
    <span className={`text-xs font-semibold ${u?.color ?? ""}`}>
      {u?.label ?? urgency}
    </span>
  );
}

export function ExplorePage() {
  const creators = useQuery(api.creators.listActive, { limit: 100 });
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = (creators ?? []).filter(c => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.displayName.toLowerCase().includes(q) ||
      c.bio?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q);
    const matchesCategory = !activeCategory || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      <div className="container py-8 sm:py-12">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FIND A <span className="text-fuel">CAMPAIGN</span>
          </h1>
          <p className="text-muted-foreground">
            Activists, journalists, veterans, creators — real people, real causes. Fuel them.
          </p>
        </div>

        {/* Search + filter row */}
        <div className="max-w-2xl mx-auto mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, cause, or location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-card border-border/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${showFilters ? "border-fuel/50 bg-fuel/10 text-fuel" : "border-border/50 text-muted-foreground hover:text-foreground"}`}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Category pills */}
        {showFilters && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!activeCategory ? "bg-fuel text-fuel-foreground" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${activeCategory === cat.id ? "bg-fuel text-fuel-foreground" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"}`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        {creators && (
          <p className="text-center text-xs text-muted-foreground mb-6">
            {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
            {activeCategory ? ` in ${CATEGORIES.find(c => c.id === activeCategory)?.label}` : ""}
          </p>
        )}

        {/* Grid */}
        {!creators ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-52 rounded-xl border border-border/30 bg-card/30 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Fuel className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {search || activeCategory ? "No campaigns found" : "No campaigns yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search || activeCategory
                ? "Try adjusting your search or filter."
                : "Be the first to create your page and start receiving gallons."}
            </p>
            {!search && !activeCategory && (
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-fuel text-fuel-foreground text-sm font-medium hover:bg-fuel/90 transition-colors"
              >
                <Fuel className="size-4" />
                Create Your Campaign
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {filtered.map((creator: any) => {
              const catInfo = CATEGORIES.find(c => c.id === creator.category);
              const pct = creator.goal ? Math.min(100, Math.round((creator.totalGallons / creator.goal) * 100)) : null;
              return (
                <Link
                  key={creator._id}
                  to={`/${creator.slug}`}
                  className="group flex flex-col rounded-xl border border-border/50 bg-card/50 hover:border-fuel/40 hover:shadow-lg hover:shadow-fuel/5 transition-all duration-300 overflow-hidden"
                >
                  {/* Cover / color bar */}
                  {creator.coverUrl ? (
                    <div className="h-24 overflow-hidden">
                      <img src={creator.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-2 bg-gradient-to-r from-fuel/60 via-fuel/30 to-transparent" />
                  )}

                  <div className="p-4 flex flex-col flex-1">
                    {/* Avatar + name */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fuel/10 border border-border/30">
                        {creator.avatarUrl ? (
                          <img src={creator.avatarUrl} alt={creator.displayName} className="size-full object-cover" />
                        ) : (
                          <span className="text-fuel font-bold" style={{ fontFamily: "var(--font-display)" }}>
                            {creator.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold truncate group-hover:text-fuel transition-colors">
                            {creator.displayName}
                          </h3>
                          {creator.urgency === "emergency" && (
                            <Zap className="size-3.5 text-red-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {creator.location && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <MapPin className="size-3" />{creator.location}
                            </span>
                          )}
                          <UrgencyPip urgency={creator.urgency} />
                        </div>
                      </div>
                    </div>

                    {/* Category + verification */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {catInfo && (
                        <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                          {catInfo.icon} {catInfo.label}
                        </span>
                      )}
                      <VerificationBadge status={creator.verificationStatus} />
                    </div>

                    {/* Bio */}
                    {creator.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                        {creator.bio}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="mt-auto">
                      {pct !== null ? (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span><span className="text-fuel font-semibold">{creator.totalGallons}</span> of {creator.goal} gal</span>
                            <span className="text-fuel font-semibold">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-fuel transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm">
                          <FuelGaugeMark className="size-4 text-fuel" />
                          <span className="text-fuel font-semibold">{creator.totalGallons}</span>
                          <span className="text-muted-foreground">gallons funded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <NetworkBanner />
    </div>
  );
}
