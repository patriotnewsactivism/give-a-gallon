import { useMutation } from "convex/react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadFile } from "@/hooks/useUploadFile";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * ProfilePhotos — cover banner + avatar uploader for the settings page.
 * Uploads to Convex storage and attaches the storageId to the creator profile.
 */
export function ProfilePhotos({
  avatarUrl,
  coverUrl,
  displayName,
}: {
  avatarUrl?: string | null;
  coverUrl?: string | null;
  displayName?: string;
}) {
  const upload = useUploadFile();
  const setImages = useMutation(api.creators.setImages);
  const [busy, setBusy] = useState<null | "avatar" | "cover">(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const handle = async (kind: "avatar" | "cover", file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 8MB");
      return;
    }
    setBusy(kind);
    try {
      const storageId = await upload(file);
      await setImages(
        kind === "avatar"
          ? { avatarId: storageId }
          : { coverImageId: storageId },
      );
      toast.success(kind === "avatar" ? "Avatar updated" : "Cover updated");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/40">
      {/* Cover */}
      <div className="group relative h-36 w-full bg-gradient-to-br from-fuel/15 to-fuel/5 sm:h-44">
        {coverUrl && (
          <img
            src={coverUrl}
            alt="Cover"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <button
          type="button"
          onClick={() => coverInput.current?.click()}
          disabled={busy !== null}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-background/80 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition hover:bg-background disabled:opacity-60"
        >
          {busy === "cover" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImagePlus className="size-3.5" />
          )}
          {coverUrl ? "Change cover" : "Add cover"}
        </button>
        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          hidden
          onChange={e => handle("cover", e.target.files?.[0])}
        />
      </div>

      {/* Avatar + label */}
      <div className="flex items-end gap-4 px-4 pb-4">
        <div className="relative -mt-10">
          <div
            className={cn(
              "flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-fuel/10",
            )}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName ?? "Avatar"}
                className="size-full object-cover"
              />
            ) : (
              <span
                className="text-2xl font-bold text-fuel"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {(displayName ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            disabled={busy !== null}
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-background bg-fuel text-fuel-foreground shadow transition hover:bg-fuel/90 disabled:opacity-60"
            aria-label="Change avatar"
          >
            {busy === "avatar" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Camera className="size-3.5" />
            )}
          </button>
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            hidden
            onChange={e => handle("avatar", e.target.files?.[0])}
          />
        </div>
        <div className="pb-1">
          <p className="text-sm font-medium">Profile photos</p>
          <p className="text-xs text-muted-foreground">
            A cover and avatar make your page stand out. JPG or PNG, up to 8MB.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProfilePhotos;
