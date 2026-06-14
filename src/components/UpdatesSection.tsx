import { useMutation, useQuery } from "convex/react";
import {
  FileText,
  ImagePlus,
  Loader2,
  Megaphone,
  Paperclip,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadFile } from "@/hooks/useUploadFile";
import { getVideoEmbed } from "@/lib/videoEmbed";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const IMAGE_MAX = 8 * 1024 * 1024; // 8MB
const DOC_MAX = 20 * 1024 * 1024; // 20MB
const DOC_TYPES =
  /pdf|msword|officedocument|rtf|plain|csv|presentation|spreadsheet/i;

type PendingAttachment = {
  storageId: Id<"_storage">;
  name: string;
  contentType: string;
  kind: "image" | "document";
  size: number;
  previewUrl?: string;
};

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

export function UpdatesSection({
  creatorId,
  isOwner,
}: {
  creatorId: Id<"creators">;
  isOwner: boolean;
}) {
  const updates = useQuery(api.updates.listForCreator, { creatorId });

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Megaphone className="size-4 text-fuel" />
        Updates
      </h2>

      {isOwner && <UpdateComposer />}

      {updates === undefined ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-fuel" />
        </div>
      ) : updates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/50 bg-card/30 p-5 text-sm text-muted-foreground">
          {isOwner
            ? "Post your first update — share progress, photos, a video, or a document so supporters see their gallons at work."
            : "No updates yet. Check back soon."}
        </p>
      ) : (
        <div className="space-y-4">
          {updates.map(u => (
            <UpdateCard key={u._id} update={u} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}

function UpdateComposer() {
  const upload = useUploadFile();
  const post = useMutation(api.updates.post);
  const fileInput = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith("image/");
        const isDoc = DOC_TYPES.test(file.type);
        if (!isImage && !isDoc) {
          toast.error(`${file.name}: unsupported file type`);
          continue;
        }
        if (isImage && file.size > IMAGE_MAX) {
          toast.error(`${file.name}: images must be under 8MB`);
          continue;
        }
        if (isDoc && file.size > DOC_MAX) {
          toast.error(`${file.name}: documents must be under 20MB`);
          continue;
        }
        const storageId = await upload(file);
        setAttachments(prev => [
          ...prev,
          {
            storageId,
            name: file.name,
            contentType: file.type,
            kind: isImage ? "image" : "document",
            size: file.size,
            previewUrl: isImage ? URL.createObjectURL(file) : undefined,
          },
        ]);
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const submit = async () => {
    if (!body.trim() && attachments.length === 0 && !videoUrl.trim()) {
      toast.error("Add a message, media, or a video link");
      return;
    }
    if (videoUrl.trim() && !getVideoEmbed(videoUrl)) {
      toast.error("Enter a valid YouTube or Vimeo link");
      return;
    }
    setPosting(true);
    try {
      await post({
        body,
        videoUrl: videoUrl.trim() || undefined,
        attachments: attachments.map(({ previewUrl, ...a }) => a),
      });
      setBody("");
      setVideoUrl("");
      setShowVideo(false);
      setAttachments([]);
      toast.success("Update posted");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not post update");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-border/50 bg-card/50 p-4">
      <Textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Share an update — where you went, what happened, what's next…"
        rows={3}
        className="resize-none border-border/50 bg-background"
      />

      {showVideo && (
        <Input
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="Paste a YouTube or Vimeo link"
          className="mt-3 bg-background"
        />
      )}

      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div
              key={a.storageId}
              className="group relative flex items-center gap-2 rounded-lg border border-border/50 bg-background p-1.5 pr-2 text-xs"
            >
              {a.kind === "image" && a.previewUrl ? (
                <img
                  src={a.previewUrl}
                  alt={a.name}
                  className="size-9 rounded object-cover"
                />
              ) : (
                <span className="flex size-9 items-center justify-center rounded bg-fuel/10">
                  <FileText className="size-4 text-fuel" />
                </span>
              )}
              <span className="max-w-32 truncate">{a.name}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments(prev => prev.filter((_, j) => j !== i))
                }
                className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                aria-label="Remove attachment"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            <span className="hidden sm:inline">Photo / Doc</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowVideo(v => !v)}
          >
            <Video className="size-4" />
            <span className="hidden sm:inline">Video</span>
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.rtf,.ppt,.pptx,.xls,.xlsx"
            multiple
            hidden
            onChange={e => addFiles(e.target.files)}
          />
        </div>
        <Button
          size="sm"
          onClick={submit}
          disabled={posting || uploading}
          className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
        >
          {posting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Paperclip className="size-4" />
          )}
          Post update
        </Button>
      </div>
    </div>
  );
}

type FeedUpdate = {
  _id: Id<"updates">;
  title?: string;
  body: string;
  videoUrl?: string;
  createdAt: number;
  attachments: Array<{
    name: string;
    contentType: string;
    kind: "image" | "document";
    size: number;
    url: string | null;
  }>;
};

function UpdateCard({
  update,
  isOwner,
}: {
  update: FeedUpdate;
  isOwner: boolean;
}) {
  const remove = useMutation(api.updates.remove);
  const video = update.videoUrl ? getVideoEmbed(update.videoUrl) : null;
  const images = update.attachments.filter(a => a.kind === "image" && a.url);
  const docs = update.attachments.filter(a => a.kind === "document" && a.url);

  return (
    <article className="rounded-2xl border border-border/50 bg-card/50 p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {timeAgo(update.createdAt)}
        </span>
        {isOwner && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Delete this update?")) return;
              try {
                await remove({ id: update._id });
                toast.success("Update deleted");
              } catch {
                toast.error("Could not delete");
              }
            }}
            className="rounded p-1 text-muted-foreground hover:text-destructive"
            aria-label="Delete update"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {update.title && <h3 className="mb-1 font-semibold">{update.title}</h3>}
      {update.body && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {update.body}
        </p>
      )}

      {video && (
        <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-border/50">
          <iframe
            src={video.embedUrl}
            title="Update video"
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {images.length > 0 && (
        <div
          className={`mt-3 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {images.map(a => (
            <a
              key={a.url}
              href={a.url ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-border/50"
            >
              {/* biome-ignore lint/a11y/useAltText: decorative supporter-uploaded image */}
              <img
                src={a.url ?? undefined}
                alt={a.name}
                className="max-h-96 w-full object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <div className="mt-3 space-y-2">
          {docs.map(a => (
            <a
              key={a.url}
              href={a.url ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-background p-3 transition hover:border-fuel/40"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-fuel/10">
                <FileText className="size-5 text-fuel" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {a.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(a.size / 1024 / 1024).toFixed(1)} MB · Open
                </span>
              </span>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export default UpdatesSection;
