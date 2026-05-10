/**
 * Video URL helpers for embeds and direct files.
 */
export function isDirectVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const path = u.pathname.toLowerCase();
    return [".mp4", ".webm", ".ogg", ".mov", ".m4v"].some((ext) =>
      path.endsWith(ext),
    );
  } catch {
    return false;
  }
}

export function isAllowedEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return (
      host === "www.youtube.com" ||
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "m.youtube.com" ||
      host === "player.vimeo.com"
    );
  } catch {
    return false;
  }
}

export function isPlayableVideoUrl(url: string): boolean {
  return isAllowedEmbedUrl(url) || isDirectVideoUrl(url);
}

/**
 * Poster image for catalog cards. YouTube/Vimeo supported; direct file URLs → null (use placeholder UI).
 */
export function videoThumbnailUrl(videoUrl: string): string | null {
  const trimmed = videoUrl.trim();
  const ytWatch = /youtube\.com\/watch\?v=([^&]+)/;
  const ytShort = /youtu\.be\/([^/?&#]+)/;
  const ytShorts = /youtube\.com\/shorts\/([^/?&#]+)/;
  const ytEmbed = /youtube\.com\/embed\/([^/?&#]+)/;
  const m =
    trimmed.match(ytWatch) ??
    trimmed.match(ytShort) ??
    trimmed.match(ytShorts) ??
    trimmed.match(ytEmbed);
  if (m?.[1]) {
    return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
  }
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/;
  const vm = trimmed.match(vimeo);
  if (vm?.[1]) {
    return `https://vumbnail.com/${vm[1]}.jpg`;
  }
  const playerVimeo = /player\.vimeo\.com\/video\/(\d+)/;
  const pv = trimmed.match(playerVimeo);
  if (pv?.[1]) {
    return `https://vumbnail.com/${pv[1]}.jpg`;
  }
  return null;
}

export function toEmbedUrl(url: string): string {
  const trimmed = url.trim();
  const ytWatch = /youtube\.com\/watch\?v=([^&]+)/;
  const ytShort = /youtu\.be\/([^/?&#]+)/;
  const ytShorts = /youtube\.com\/shorts\/([^/?&#]+)/;
  const m =
    trimmed.match(ytWatch) ??
    trimmed.match(ytShort) ??
    trimmed.match(ytShorts);
  if (m?.[1]) {
    return `https://www.youtube.com/embed/${m[1]}`;
  }
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/;
  const vm = trimmed.match(vimeo);
  if (vm?.[1]) {
    return `https://player.vimeo.com/video/${vm[1]}`;
  }
  return trimmed;
}
