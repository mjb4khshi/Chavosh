import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./browserAudio";
import { usePlayerStore } from "../stores/playerStore";
import { getPersistedCustomCover, searchOnlineCovers } from "./coverService";

const MAX_CONCURRENT_COVER_LOADS = 3;
let activeLoads = 0;
const queue: Array<() => void> = [];
const inFlightPromises = new Map<string, Promise<string | null>>();

function processQueue() {
  while (activeLoads < MAX_CONCURRENT_COVER_LOADS && queue.length > 0) {
    const task = queue.shift();
    if (task) {
      activeLoads++;
      task();
    }
  }
}

/**
 * High-performance throttled cover loader with queueing and request deduplication.
 */
export function loadTrackCover(path: string): Promise<string | null> {
  if (!path) {
    return Promise.resolve(null);
  }

  // 1. Check if already in Zustand cache
  const cached = usePlayerStore.getState().coverCache[path];
  if (cached !== undefined) {
    return Promise.resolve(cached || null);
  }

  // 2. Check if user set a custom cover stored in localStorage
  const persisted = getPersistedCustomCover(path);
  if (persisted) {
    usePlayerStore.getState().setCoverCache(path, persisted);
    return Promise.resolve(persisted);
  }

  // 3. Web mode fallback: search iTunes if track has metadata
  if (!isTauri()) {
    const track = usePlayerStore.getState().tracks.find((t) => t.path === path);
    if (track && track.title && track.title !== "Unknown Title") {
      const query =
        track.artist && track.artist !== "Unknown Artist"
          ? `${track.artist} ${track.title}`
          : track.title;

      return searchOnlineCovers(query)
        .then((results) => {
          const found = results[0]?.url || "";
          usePlayerStore.getState().setCoverCache(path, found);
          return found || null;
        })
        .catch(() => {
          usePlayerStore.getState().setCoverCache(path, "");
          return null;
        });
    }
    return Promise.resolve(null);
  }

  // 2. Check if a request for this exact path is already in flight
  if (inFlightPromises.has(path)) {
    return inFlightPromises.get(path)!;
  }

  // 3. Queue the request
  const promise = new Promise<string | null>((resolve) => {
    const execute = () => {
      invoke<string | null>("get_track_cover", { path })
        .then((res) => {
          const cover = res || "";
          usePlayerStore.getState().setCoverCache(path, cover);
          resolve(cover || null);
        })
        .catch(() => {
          usePlayerStore.getState().setCoverCache(path, "");
          resolve(null);
        })
        .finally(() => {
          activeLoads--;
          inFlightPromises.delete(path);
          processQueue();
        });
    };

    queue.push(execute);
    processQueue();
  });

  inFlightPromises.set(path, promise);
  return promise;
}
