/**
 * Admin Master Dashboard
 * Gated by ADMIN_EMAIL env var on Convex.
 * Shows:
 *  - Platform-wide live stats
 *  - Per-creator table with last login, donation stats, active status
 *  - Recent donations feed
 *  - Push notification sender
 */
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,Bell, CheckCircle2, ChevronDown, ChevronUp,
  ExternalLink, Fuel, Megaphone, Search, Shield, Star,Users, Wallet, XCircle, Clock, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt$(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function timeAgo(ts: number | null) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const VERIFICATION_BADGE: Record<string, { label: string; color: string }> = {
  platform:     { label: "Platform",     color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  organization: { label: "Org",          color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  journalist:   { label: "Press",        color: "text-green-400 bg-green-500/10 border-green-500/20" },
  community:    { label: "Community",    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  unverified:   { label: "Unverified",   color: "text-muted-foreground bg-muted/30 border-border/30" },
};

type SortKey = "createdAt" | "totalGallons" | "lastLoginAt" | "lastDonationAt" | "totalAmountCents";

// ── Main component ─────────────────────────────────────────────────────────
export function AdminDashboard() {
  const isAdmin = useQuery((api as any).admin.isAdmin);
  const overview = useQuery(isAdmin ? (api as any).admin.getPlatformOverview : (api as any).notifications.getRecentPublic);
  const creators = useQuery(isAdmin ? (api as any).admin.listAllCreators : (api as any).notifications.getRecentPublic);
  const recentDonations = useQuery(isAdmin ? (api as any).admin.listAllDonations : (api as any).notifications.getRecentPublic, isAdmin ? { limit: 50 } : undefined);
  const notifications = useQuery((api as any).notifications.getRecent);
  const sendNotification = useMutation((api as any).admin.sendNotification);
  const toggleActive = useMutation((api as any).admin.toggleCreatorActive);
  const toggleFeatured = useMutation((api as any).admin.toggleCreatorFeatured);
  const seedDemoData = useMutation((api as any).admin.seedDemoData);

  const [tab, setTab] = useState<"overview" | "creators" | "donations" | "notifications">("overview");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Notification form
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifType, setNotifType] = useState<"announcement" | "milestone" | "alert">("announcement");
  const [notifAudience, setNotifAudience] = useState<"all" | "creators" | "donors">("all");
  const [notifLink, setNotifLink] = useState("");
  const [sending, setSending] = useState(false);

  // ── Seeding logic ────────────────────────────────────────────────────────
  async function handleSeedData() {
    if (!confirm("This will seed several demo campaigns and donations. Continue?")) return;
    setSeeding(true);
    try {
      const res = await seedDemoData();
      toast.success(res.message);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to seed");
    } finally {
      setSeeding(false);
    }
  }

  // ── Creator table logic ──────────────────────────────────────────────────
  const filteredCreators = useMemo(() => {
    if (!Array.isArray(creators)) return [];
    const q = search.toLowerCase();
    const filtered = q
      ? creators.filter((c: any) =>
          c.displayName?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
        )
      : creators;
    return [...filtered].sort((a: any, b: any) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortAsc ? av - bv : bv - av;
    });
  }, [creators, search, sortKey, sortAsc]);

  if (isAdmin === undefined) {
    return <div className="flex items-center justify-center min-h-screen"><div className="size-8 rounded-full border-2 border-fuel border-t-transparent animate-spin" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-6">
        <Shield className="size-12 text-muted-foreground/30" />
        <h1 className="text-xl font-semibold">Admin Access Only</h1>
        <p className="text-sm text-muted-foreground max-w-xs">You don't have permission to view this page.</p>
        <Button variant="outline" asChild><Link to="/">← Back to Home</Link></Button>
      </div>
    );
  }


  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortAsc ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />;
  }

  async function handleSendNotification() {
    if (!notifTitle.trim() || !notifBody.trim()) { toast.error("Title and body required"); return; }
    setSending(true);
    try {
      await sendNotification({ title: notifTitle.trim(), body: notifBody.trim(), type: notifType, targetAudience: notifAudience, link: notifLink.trim() || undefined });
      toast.success("Notification sent to all users!");
      setNotifTitle(""); setNotifBody(""); setNotifLink("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  }

  const ov = Array.isArray(overview) ? null : overview as any;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-fuel" />
            <span className="font-black tracking-tight text-lg">ADMIN DASHBOARD</span>
            <span className="px-2 py-0.5 rounded-full bg-fuel/10 text-fuel text-xs font-semibold">LIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedData}
              disabled={seeding}
              className="text-xs border-dashed border-fuel/30 text-fuel hover:bg-fuel/5"
            >
              <Activity className={`size-3.5 mr-1.5 ${seeding ? "animate-spin" : ""}`} />
              {seeding ? "Seeding..." : "Seed Demo Data"}
            </Button>
            <Button variant="outline" size="sm" asChild><Link to="/">← Site</Link></Button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-2">
          {(["overview", "creators", "donations", "notifications"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? "bg-fuel text-fuel-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              {t}
              {t === "creators" && Array.isArray(creators) && <span className="ml-1.5 text-xs opacity-70">({creators.length})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
        {tab === "overview" && ov && (
          <div className="space-y-6">
            {/* Big stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Raised", value: fmt$(ov.totalAmountCents ?? 0), icon: <Wallet className="size-4" />, accent: true },
                { label: "Total Gallons", value: (ov.totalGallons ?? 0).toLocaleString(), icon: <Fuel className="size-4" /> },
                { label: "Active Creators", value: `${ov.activeCreators ?? 0} / ${ov.totalCreators ?? 0}`, icon: <Users className="size-4" /> },
                { label: "Active Subs", value: ov.activeSubscriptions ?? 0, icon: <Zap className="size-4" /> },
              ].map(s => (
                <div key={s.label} className={`p-4 rounded-xl border ${s.accent ? "border-fuel/30 bg-fuel/5" : "border-border/40 bg-card/50"}`}>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{s.icon}{s.label}</div>
                  <div className="text-2xl font-black">{s.value}</div>
                </div>
              ))}
            </div>
            {/* 24h & 7d */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-border/40 bg-card/50 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Last 24 Hours</div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Donations</span><span className="font-semibold">{ov.last24hDonations}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gallons</span><span className="font-semibold text-fuel">{ov.last24hGallons}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Revenue</span><span className="font-semibold">{fmt$(ov.last24hAmountCents)}</span></div>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/50 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Last 7 Days</div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Donations</span><span className="font-semibold">{ov.last7dDonations}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Revenue</span><span className="font-semibold">{fmt$(ov.last7dAmountCents)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">MRR</span><span className="font-semibold">{fmt$(ov.monthlyRecurringCents)}</span></div>
              </div>
            </div>
            {/* Latest 5 donations preview */}
            {Array.isArray(recentDonations) && recentDonations.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Latest Donations</div>
                <div className="space-y-2">
                  {recentDonations.slice(0, 5).map((d: any) => (
                    <div key={d._id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/30 text-sm">
                      <Fuel className="size-3.5 text-fuel shrink-0" />
                      <span className="font-medium">{d.donorName}</span>
                      <span className="text-fuel font-bold">{d.gallons} gal</span>
                      <span className="text-muted-foreground">→</span>
                      <Link to={`/${d.creatorSlug}`} className="text-foreground hover:text-fuel transition-colors font-medium truncate">{d.creatorName}</Link>
                      <span className="ml-auto text-muted-foreground/60 shrink-0">{timeAgo(d.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CREATORS TAB ───────────────────────────────────────────────── */}
        {tab === "creators" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input placeholder="Search name, email, slug…" className="pl-8 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <span className="text-sm text-muted-foreground">{filteredCreators.length} profiles</span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border/40">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Creator</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground text-right cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("totalGallons")}>
                        <span className="inline-flex items-center gap-1">Gallons<SortIcon k="totalGallons" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground text-right cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("totalAmountCents")}>
                        <span className="inline-flex items-center gap-1">Raised<SortIcon k="totalAmountCents" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("lastDonationAt")}>
                        <span className="inline-flex items-center gap-1">Last Donation<SortIcon k="lastDonationAt" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("lastLoginAt")}>
                        <span className="inline-flex items-center gap-1">Last Login<SortIcon k="lastLoginAt" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("createdAt")}>
                        <span className="inline-flex items-center gap-1">Joined<SortIcon k="createdAt" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCreators.map((c: any) => {
                      const badge = VERIFICATION_BADGE[c.verificationStatus] ?? VERIFICATION_BADGE.unverified;
                      const goalPct = c.goal ? Math.min(100, Math.round((c.totalGallons / c.goal) * 100)) : null;
                      return (
                        <tr key={c._id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-8 rounded-full bg-fuel/10 flex items-center justify-center text-xs font-bold text-fuel shrink-0">
                                {c.displayName?.[0] ?? "?"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate max-w-32">{c.displayName}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-32">{c.email ?? "—"}</div>
                                <Link to={`/${c.slug}`} target="_blank" className="text-xs text-fuel/70 hover:text-fuel inline-flex items-center gap-0.5">
                                  /{c.slug} <ExternalLink className="size-2.5" />
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border w-fit ${badge.color}`}>{badge.label}</span>
                              {c.isActive
                                ? <span className="inline-flex items-center gap-0.5 text-xs text-green-400"><CheckCircle2 className="size-3" /> Active</span>
                                : <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"><XCircle className="size-3" /> Inactive</span>
                              }
                              {c.isFeatured && <span className="inline-flex items-center gap-0.5 text-xs text-yellow-400"><Star className="size-3" /> Featured</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="font-semibold text-fuel">{c.totalGallons}</div>
                            {goalPct !== null && (
                              <div className="text-xs text-muted-foreground">{goalPct}% of goal</div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-medium">{fmt$(c.totalAmountCents)}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="size-3 text-muted-foreground" />
                              <span>{timeAgo(c.lastDonationAt)}</span>
                            </div>
                            {c.lastDonationGallons && (
                              <div className="text-xs text-fuel">+{c.lastDonationGallons} gal</div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Activity className="size-3" />
                              {timeAgo(c.lastLoginAt)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">{fmtDate(c.createdAt)}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={async () => {
                                  await toggleActive({ creatorId: c._id, isActive: !c.isActive });
                                  toast.success(c.isActive ? "Deactivated" : "Activated");
                                }}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${c.isActive ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"}`}
                              >
                                {c.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={async () => {
                                  await toggleFeatured({ creatorId: c._id, isFeatured: !c.isFeatured });
                                  toast.success(c.isFeatured ? "Unfeatured" : "Featured!");
                                }}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${c.isFeatured ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                              >
                                {c.isFeatured ? "★" : "☆"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── DONATIONS TAB ──────────────────────────────────────────────── */}
        {tab === "donations" && Array.isArray(recentDonations) && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">{recentDonations.length} most recent completed donations</div>
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border/40">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Donor</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Campaign</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground text-right">Gallons</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground text-right">Amount</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">Message</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDonations.map((d: any) => (
                    <tr key={d._id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{d.donorName}</div>
                        {d.donorEmail && <div className="text-xs text-muted-foreground">{d.donorEmail}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <Link to={`/${d.creatorSlug}`} className="font-medium hover:text-fuel transition-colors">{d.creatorName}</Link>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-fuel">{d.gallons}</td>
                      <td className="px-3 py-3 text-right font-medium">{fmt$(d.amountCents)}</td>
                      <td className="px-3 py-3 max-w-xs">
                        {d.message ? <span className="text-xs text-muted-foreground italic truncate block max-w-48">{d.message}</span> : <span className="text-xs text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{timeAgo(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ──────────────────────────────────────────── */}
        {tab === "notifications" && (
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Send form */}
            <div className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-4">
              <div>
                <h2 className="font-bold text-base flex items-center gap-2"><Bell className="size-4 text-fuel" /> Send Push Notification</h2>
                <p className="text-xs text-muted-foreground mt-1">Delivered live to all users via the bell icon — no email needed.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="notif-title" className="text-xs font-semibold text-muted-foreground mb-1 block">Title</label>
                  <Input id="notif-title" placeholder="e.g. Big milestone reached!" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="h-9" />
                </div>
                <div>
                  <label htmlFor="notif-body" className="text-xs font-semibold text-muted-foreground mb-1 block">Message</label>
                  <Textarea id="notif-body" placeholder="What do you want to tell your community?" value={notifBody} onChange={e => setNotifBody(e.target.value)} rows={3} className="resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="notif-type" className="text-xs font-semibold text-muted-foreground mb-1 block">Type</label>
                    <select id="notif-type" value={notifType} onChange={e => setNotifType(e.target.value as any)}
                      className="w-full h-9 text-sm rounded-md border border-input bg-background px-3 text-foreground">
                      <option value="announcement">📢 Announcement</option>
                      <option value="milestone">🏆 Milestone</option>
                      <option value="alert">🚨 Alert</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="notif-audience" className="text-xs font-semibold text-muted-foreground mb-1 block">Audience</label>
                    <select id="notif-audience" value={notifAudience} onChange={e => setNotifAudience(e.target.value as any)}
                      className="w-full h-9 text-sm rounded-md border border-input bg-background px-3 text-foreground">
                      <option value="all">Everyone</option>
                      <option value="creators">Creators only</option>
                      <option value="donors">Donors only</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="notif-link" className="text-xs font-semibold text-muted-foreground mb-1 block">Link (optional)</label>
                  <Input id="notif-link" placeholder="https://give.wtpnews.org/..." value={notifLink} onChange={e => setNotifLink(e.target.value)} className="h-9" />
                </div>
                <Button onClick={handleSendNotification} disabled={sending || !notifTitle.trim() || !notifBody.trim()} className="w-full bg-fuel text-fuel-foreground hover:bg-fuel/90">
                  {sending ? "Sending…" : "Send to All Users"}
                </Button>
              </div>
            </div>

            {/* Sent history */}
            <div className="space-y-3">
              <h2 className="font-bold text-base flex items-center gap-2"><Megaphone className="size-4" /> Sent Notifications</h2>
              {!notifications || notifications.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-border/40 text-center text-sm text-muted-foreground">No notifications sent yet</div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n: any) => (
                    <div key={n._id} className="p-4 rounded-xl border border-border/40 bg-card/40">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm">{n.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/60">
                        <span className="capitalize">{n.type}</span>
                        <span>→ {n.targetAudience}</span>
                        <span>by {n.sentBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
