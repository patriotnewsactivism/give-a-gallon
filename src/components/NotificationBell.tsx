/**
 * NotificationBell — live push notification delivery for all users.
 * Shows a bell icon in the header with unread badge.
 * Pops a toast for each new notification that arrives in real time.
 */
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Megaphone,
  Trophy,
} from "lucide-react";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

const TYPE_ICON: Record<string, ReactElement> = {
  announcement: <Megaphone className="size-3.5 text-blue-400" />,
  milestone: <Trophy className="size-3.5 text-yellow-400" />,
  alert: <AlertTriangle className="size-3.5 text-red-400" />,
};

const TYPE_COLOR: Record<string, string> = {
  announcement: "border-blue-500/30 bg-blue-500/5",
  milestone: "border-yellow-500/30 bg-yellow-500/5",
  alert: "border-red-500/30 bg-red-500/5",
};

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  // Always call this hook unconditionally — notifications are public
  const notifications = useQuery((api as any).notifications.getRecent);

  const seenLatestId = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("notif_read_ids");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const markRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(
          "notif_read_ids",
          JSON.stringify([...next].slice(-100)),
        );
      } catch {}
      return next;
    });
  };

  const markAllRead = () => {
    notifications?.forEach((n: any) => {
      void markRead(n._id);
    });
  };

  // Fire toast for genuinely new notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const latest = notifications[0] as any;
    if (seenLatestId.current === null) {
      seenLatestId.current = latest._id;
      return;
    }
    if (latest._id === seenLatestId.current) return;
    seenLatestId.current = latest._id;
    toast(latest.title, {
      description: latest.body,
      duration: 8000,
      action: latest.link
        ? { label: "View", onClick: () => window.open(latest.link, "_blank") }
        : undefined,
    });
  }, [notifications]);

  const unreadCount =
    notifications?.filter((n: any) => !readIds.has(n._id)).length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(o => !o);
          if (!open) markAllRead();
        }}
        className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-fuel" />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            role="button"
            tabIndex={-1}
            aria-label="Close"
            onClick={() => setOpen(false)}
            onKeyDown={e => {
              if (e.key === "Escape") setOpen(false);
            }}
          />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/30 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <span className="text-sm font-semibold">Notifications</span>
              {notifications && notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((n: any) => {
                    const isUnread = !readIds.has(n._id);
                    return (
                      <div
                        key={n._id}
                        className={`relative p-3 rounded-xl border text-sm ${TYPE_COLOR[n.type] ?? "border-border/30 bg-card/30"} ${isUnread ? "opacity-100" : "opacity-60"}`}
                      >
                        {isUnread && (
                          <span className="absolute top-3 right-3 size-1.5 rounded-full bg-fuel" />
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          {TYPE_ICON[n.type]}
                          <span className="font-semibold text-foreground">
                            {n.title}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {n.body}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground/60">
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.link && (
                            <Link
                              to={n.link}
                              className="inline-flex items-center gap-1 text-xs text-fuel hover:underline"
                              onClick={() => setOpen(false)}
                            >
                              View <ExternalLink className="size-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
