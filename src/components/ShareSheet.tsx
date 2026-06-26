import {
  Copy,
  Facebook,
  Link2,
  MessageCircle,
  Share2,
  Twitter,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface ShareSheetProps {
  url: string;
  title: string;
  description?: string;
  compact?: boolean;
}

export function ShareSheet({
  url,
  title,
  description,
  compact = false,
}: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith("http")
    ? url
    : `${window.location.origin}${url}`;
  const text = description ?? title;

  function copy() {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  function share(platform: "twitter" | "facebook" | "sms" | "native") {
    if (platform === "native" && navigator.share) {
      navigator.share({ title, text, url: fullUrl }).catch(() => {});
      return;
    }
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${fullUrl}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      sms: `sms:?body=${encodeURIComponent(`${text} ${fullUrl}`)}`,
    };
    window.open(urls[platform], "_blank");
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => share("twitter")}
          title="Share on X"
          className="p-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <Twitter className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => share("facebook")}
          title="Share on Facebook"
          className="p-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <Facebook className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={copy}
          title="Copy link"
          className="p-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          {copied ? (
            <Link2 className="size-3.5 text-fuel" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={() => share("native")}
            title="More share options"
            className="p-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <Share2 className="size-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Share2 className="size-4 text-fuel" /> Share this campaign
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => share("twitter")}
        >
          <Twitter className="size-3.5" /> Tweet
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => share("facebook")}
        >
          <Facebook className="size-3.5" /> Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => share("sms")}
        >
          <MessageCircle className="size-3.5" /> Text
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${copied ? "border-fuel/50 text-fuel" : ""}`}
          onClick={copy}
        >
          {copied ? (
            <Link2 className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <div className="flex items-center gap-2 bg-background/50 rounded-lg border border-border/30 px-3 py-1.5">
        <span className="text-xs text-muted-foreground truncate flex-1">
          {fullUrl}
        </span>
      </div>
    </div>
  );
}
