/**
 * Parse a YouTube or Vimeo URL into an embeddable player URL.
 * Returns null for anything we don't recognize (caller can show a plain link).
 */
export function getVideoEmbed(
  url: string,
): { provider: "youtube" | "vimeo"; embedUrl: string } | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");

  // YouTube
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (id)
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube.com/embed/${id}`,
      };
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = u.searchParams.get("v");
    if (v)
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube.com/embed/${v}`,
      };
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "shorts") {
      const id = parts[1];
      if (id)
        return {
          provider: "youtube",
          embedUrl: `https://www.youtube.com/embed/${id}`,
        };
    }
  }

  // Vimeo
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean).pop();
    if (id && /^\d+$/.test(id)) {
      return {
        provider: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${id}`,
      };
    }
  }

  return null;
}
