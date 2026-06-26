/**
 * NetworkBanner — cross-promotes WTP News & Civil Rights Hub
 * Shown on ExplorePage and LandingPage
 */
import { ExternalLink, Radio, Scale } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const NETWORK_SITES = [
  {
    name: "We The People News",
    url: "https://www.wtpnews.org",
    description:
      "Independent boots-on-the-ground journalism. The outlet that built this platform.",
    icon: <Radio className="size-4" />,
    accent: "text-fuel",
    border: "border-fuel/20",
    bg: "bg-fuel/[0.04]",
    tag: "THE OUTLET BEHIND THIS PLATFORM",
  },
  {
    name: "Civil Rights Hub",
    url: "https://www.civilrightshub.org",
    description:
      "Know your rights. Find legal help. Connect with advocates fighting for you.",
    icon: <Scale className="size-4" />,
    accent: "text-blue-400",
    border: "border-blue-400/20",
    bg: "bg-blue-400/[0.04]",
    tag: "SISTER PLATFORM",
  },
];

export function NetworkBanner() {
  return (
    <section className="border-t border-border/30 py-12 sm:py-14">
      <div className="container max-w-4xl">
        <Reveal>
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-muted-foreground text-xs font-semibold mb-3 border border-border/30">
              THE NETWORK
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Part of Something Bigger
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Give-A-Gallon is one piece of an independent media and advocacy
              ecosystem built for people in the fight.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-4">
          {NETWORK_SITES.map(site => (
            <Reveal key={site.name}>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block rounded-2xl border ${site.border} ${site.bg} p-5 hover:brightness-110 transition-all`}
              >
                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold mb-3 ${site.accent} opacity-70`}
                >
                  {site.tag}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className={`flex items-center gap-2 font-bold text-base mb-1 ${site.accent}`}
                    >
                      {site.icon}
                      {site.name}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {site.description}
                    </p>
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
