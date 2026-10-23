import { usePlayerStore } from "../stores/playerStore";

export interface CoverSearchResult {
  url: string;
  artist: string;
  album: string;
  title: string;
}

const PERSISTENT_COVER_STORAGE_PREFIX = "chavosh_custom_cover_";

/**
 * Searches iTunes Search API for high-resolution (1200x1200) album artwork.
 * iTunes Search API has public CORS enabled, requires no API key, and returns crystal-clear artwork.
 */
export async function searchOnlineCovers(
  queryOrArtist: string,
  title?: string
): Promise<CoverSearchResult[]> {
  const query = title
    ? `${queryOrArtist} ${title}`.trim()
    : queryOrArtist.trim();
  if (!query) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    const results: CoverSearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const item of data.results) {
      if (item.artworkUrl100) {
        // Upgrade 100x100 preview to ultra-crisp 1200x1200 artwork
        const highRes = item.artworkUrl100
          .replace("100x100bb.jpg", "1200x1200bb.jpg")
          .replace("100x100bb.png", "1200x1200bb.png");

        if (!seenUrls.has(highRes)) {
          seenUrls.add(highRes);
          results.push({
            url: highRes,
            artist: item.artistName || (title ? queryOrArtist : "Unknown Artist"),
            album: item.collectionName || "Single",
            title: item.trackName || title || queryOrArtist,
          });
        }
      }
    }

    return results;
  } catch (err) {
    console.warn("Online cover search failed:", err);
    return [];
  }
}

/**
 * Saves and applies a custom cover for a track path in Zustand and persistent localStorage
 */
export function applyCustomTrackCover(path: string, coverUrl: string) {
  if (!path || !coverUrl) return;

  // 1. Update Zustand store
  usePlayerStore.getState().setCoverCache(path, coverUrl);

  // 2. Persist in localStorage
  try {
    localStorage.setItem(`${PERSISTENT_COVER_STORAGE_PREFIX}${path}`, coverUrl);
  } catch (e) {
    console.warn("Failed to persist custom cover:", e);
  }
}

/**
 * Retrieves persisted custom cover if user previously assigned one
 */
export function getPersistedCustomCover(path: string): string | null {
  try {
    return localStorage.getItem(`${PERSISTENT_COVER_STORAGE_PREFIX}${path}`);
  } catch {
    return null;
  }
}
