import { useMutation, useQuery } from "convex/react";
import { Heart, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

/**
 * WallSection — a public "wall of support" where signed-in users leave
 * messages of encouragement on a campaign. Authors and the campaign owner
 * can remove posts.
 */
export function WallSection({
  creatorId,
  creatorOwnerId,
}: {
  creatorId: Id<"creators">;
  creatorOwnerId: Id<"users">;
}) {
  const me = useQuery(api.auth.currentUser);
  const posts = useQuery(api.wall.listForCreator, { creatorId });
  const post = useMutation(api.wall.post);
  const remove = useMutation(api.wall.remove);

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const isOwner = !!me && me._id === creatorOwnerId;

  const submit = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await post({ creatorId, body });
      setBody("");
      toast.success("Message posted");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not post");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="size-4 text-fuel" />
        Wall of Support
      </h2>

      {me ? (
        <div className="mb-5 rounded-2xl border border-border/50 bg-card/50 p-4">
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Leave a message of support…"
            rows={2}
            maxLength={500}
            className="resize-none border-border/50 bg-background"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {body.length}/500
            </span>
            <Button
              size="sm"
              onClick={submit}
              disabled={sending || !body.trim()}
              className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Post
            </Button>
          </div>
        </div>
      ) : (
        <p className="mb-5 rounded-xl border border-dashed border-border/50 bg-card/30 p-4 text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-fuel hover:underline">
            Sign in
          </Link>{" "}
          to leave a message of support.
        </p>
      )}

      {posts === undefined ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-fuel" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No messages yet — be the first to show support.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map(p => {
            const canDelete = !!me && (me._id === p.userId || isOwner);
            return (
              <div
                key={p._id}
                className="rounded-xl border border-border/40 bg-card/40 p-4"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-fuel/10">
                      <Heart className="size-3 text-fuel" />
                    </span>
                    <span className="truncate text-sm font-semibold">
                      {p.authorName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      · {timeAgo(p.createdAt)}
                    </span>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await remove({ id: p._id });
                        } catch {
                          toast.error("Could not delete");
                        }
                      }}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label="Delete message"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap pl-8 text-sm text-foreground/90">
                  {p.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WallSection;
