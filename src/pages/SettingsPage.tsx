import { useMutation, useQuery } from "convex/react";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { ProfilePhotos } from "@/components/ProfilePhotos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GALLON_PRICE } from "@/lib/constants";

const CATEGORIES = [
  "First Amendment",
  "Civil Rights",
  "Government Accountability",
  "Police Accountability",
  "Legal Defense",
  "Journalism",
  "Community Organizing",
  "Environmental",
  "Other",
];

export function SettingsPage() {
  const creator = useQuery(api.creators.getMine);
  const upsert = useMutation(api.creators.upsert);
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [saving, setSaving] = useState(false);

  // Populate from existing profile
  useEffect(() => {
    if (creator) {
      setDisplayName(creator.displayName);
      setSlug(creator.slug);
      setBio(creator.bio ?? "");
      setGoal(creator.goal ? creator.goal.toString() : "");
      setCategory(creator.category ?? "");
      setLocation(creator.location ?? "");
      setYoutube(creator.socialLinks?.youtube ?? "");
      setTwitter(creator.socialLinks?.twitter ?? "");
      setWebsite(creator.socialLinks?.website ?? "");
      setInstagram(creator.socialLinks?.instagram ?? "");
    }
  }, [creator]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setDisplayName(name);
    if (!creator) {
      // Only auto-generate for new profiles
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 30)
      );
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    if (!slug.trim() || slug.length < 3) {
      toast.error("URL slug must be at least 3 characters");
      return;
    }
    setSaving(true);
    try {
      await upsert({
        displayName: displayName.trim(),
        slug: slug.trim(),
        bio: bio.trim() || undefined,
        goal: goal ? Number(goal) : undefined,
        category: category || undefined,
        location: location.trim() || undefined,
        socialLinks: {
          youtube: youtube.trim() || undefined,
          twitter: twitter.trim() || undefined,
          website: website.trim() || undefined,
          instagram: instagram.trim() || undefined,
        },
      });
      toast.success("Profile saved!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (creator === undefined) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="size-6 text-fuel animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <h1
        className="text-2xl font-bold mb-1"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {creator ? "EDIT PROFILE" : "CREATE YOUR PAGE"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {creator
          ? "Update your activist profile"
          : "Set up your page to start receiving gallons"}
      </p>

      <div className="space-y-5">
        {/* Profile photos — only after the profile exists */}
        {creator ? (
          <ProfilePhotos
            avatarUrl={creator.avatarUrl}
            coverUrl={creator.coverUrl}
            displayName={creator.displayName}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-border/50 bg-card/30 p-4 text-xs text-muted-foreground">
            Save your profile first — then you can add a cover photo and avatar.
          </p>
        )}

        {/* Display Name */}
        <Field label="Display Name *">
          <Input
            value={displayName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Don Matthews"
            className="bg-background"
          />
        </Field>

        {/* URL Slug */}
        <Field label="Your URL">
          <div className="flex items-center gap-0">
            <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 border-border/50">
              giveagallon.com/
            </span>
            <Input
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                )
              }
              placeholder="donmatthews"
              className="bg-background rounded-l-none"
            />
          </div>
        </Field>

        {/* Bio */}
        <Field label="Bio">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell supporters about your cause and what you're fighting for..."
            rows={3}
            className="bg-background resize-none"
          />
        </Field>

        {/* Category */}
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 rounded-md border border-border/50 bg-background px-3 text-sm"
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </Field>

        {/* Location */}
        <Field label="Location">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Mississippi, USA"
            className="bg-background"
          />
        </Field>

        {/* Goal */}
        <Field label="Gallon Goal (optional)">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="100"
              className="bg-background"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              gallons
            </span>
          </div>
          {goal && Number(goal) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              = ${(Number(goal) * GALLON_PRICE).toFixed(2)} fundraising goal
            </p>
          )}
        </Field>

        {/* Social Links */}
        <div className="border-t border-border/30 pt-5">
          <h3 className="text-sm font-semibold mb-3">Social Links</h3>
          <div className="space-y-3">
            <Field label="YouTube">
              <Input
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
                className="bg-background"
              />
            </Field>
            <Field label="Twitter / X">
              <Input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                className="bg-background"
              />
            </Field>
            <Field label="Website">
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="bg-background"
              />
            </Field>
            <Field label="Instagram">
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className="bg-background"
              />
            </Field>
          </div>
        </div>

        {/* Save */}
        <div className="pt-4">
          <Button
            className="w-full bg-fuel text-fuel-foreground hover:bg-fuel/90 h-11 font-semibold"
            disabled={saving || !displayName.trim() || !slug.trim()}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="size-4 mr-1" />
                {creator ? "Save Changes" : "Create My Page"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground mb-1.5 block font-medium">
        {label}
      </span>
      {children}
    </div>
  );
}
