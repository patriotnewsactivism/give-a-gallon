import { useQuery } from "convex/react";
import { Fuel, MapPin, Search, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Input } from "@/components/ui/input";

export function ExplorePage() {
  const creators = useQuery(api.creators.listActive, { limit: 50 });
  const [search, setSearch] = useState("");

  const filtered =
    creators?.filter(
      (c) =>
        c.displayName.toLowerCase().includes(search.toLowerCase()) ||
        c.bio?.toLowerCase().includes(search.toLowerCase()) ||
        c.location?.toLowerCase().includes(search.toLowerCase()) ||
        c.category?.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  return (
    <div className="min-h-screen">
      <div className="container py-10">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            GIVE A <span className="text-fuel">GALLON</span>
          </h1>
          <p className="text-muted-foreground">
            Browse activists and fuel their fight. Every gallon counts.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, cause, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border/50"
            />
          </div>
        </div>

        {/* Grid */}
        {!creators ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl border border-border/30 bg-card/30 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {search ? "No activists found" : "No activists yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search
                ? "Try a different search term."
                : "Be the first to create your page and start receiving gallons."}
            </p>
            {!search && (
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-fuel text-fuel-foreground text-sm font-medium hover:bg-fuel/90 transition-colors"
              >
                <Fuel className="size-4" />
                Create Your Page
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {filtered.map((creator: any) => (
              <Link
                key={creator._id}
                to={`/${creator.slug}`}
                className="group rounded-xl border border-border/50 bg-card/50 hover:border-fuel/30 hover:bg-fuel/[0.02] transition-all duration-300 p-5 block"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-12 rounded-full bg-fuel/10 flex items-center justify-center shrink-0">
                    <span
                      className="text-fuel font-bold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {creator.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-fuel transition-colors">
                      {creator.displayName}
                    </h3>
                    {creator.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="size-3" />
                        {creator.location}
                      </div>
                    )}
                    {creator.category && (
                      <div className="text-xs text-fuel/70 mt-0.5">
                        {creator.category}
                      </div>
                    )}
                  </div>
                </div>

                {creator.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {creator.bio}
                  </p>
                )}

                {/* Fuel gauge */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-fuel font-medium flex items-center gap-1">
                      <Fuel className="size-3" />
                      {creator.totalGallons} gallons received
                    </span>
                    {creator.goal && creator.goal > 0 && (
                      <span className="text-muted-foreground">
                        / {creator.goal} goal
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-fuel transition-all duration-500"
                      style={{
                        width: `${creator.goal && creator.goal > 0 ? Math.min((creator.totalGallons / creator.goal) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
