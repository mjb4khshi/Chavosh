import { type Track } from "../stores/playerStore";
import { usePlayerStore } from "../stores/playerStore";

export function isTauri(): boolean {
  return typeof window !== "undefined" && Boolean((window as unknown as Record<string, unknown>).__TAURI_INTERNALS__);
}

export const SAMPLE_TRACKS: { track: Track; cover: string }[] = [
  {
    track: {
      id: 9901,
      path: "/audio/chavosh-ambient.wav",
      title: "Chavosh Dawn (طلوع چاووش)",
      artist: "Chavosh Ensemble",
      album: "Silk Road Horizons",
      duration: 24,
      year: 2026,
      track_number: 1,
      genre: "Ambient",
    },
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
  },
  {
    track: {
      id: 9902,
      path: "/audio/chavosh-chill.wav",
      title: "Midnight Breeze (نسیم نیمه‌شب)",
      artist: "Sohrab & Friends",
      album: "Tehran Nights",
      duration: 20,
      year: 2026,
      track_number: 2,
      genre: "Lo-Fi",
    },
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
  },
  {
    track: {
      id: 9903,
      path: "/audio/chavosh-lofi.wav",
      title: "Silk Road Beats (ضرب‌آهنگ راه ابریشم)",
      artist: "Alireza Beats",
      album: "Alborz Dreams",
      duration: 28,
      year: 2026,
      track_number: 3,
      genre: "Chillhop",
    },
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
  },
];

/** Populate store with sample playable tracks and covers (ideal for web testing) */
export function loadSampleTracks() {
  const store = usePlayerStore.getState();
  const sampleTracksList = SAMPLE_TRACKS.map((s) => s.track);

  // Cache sample covers
  for (const item of SAMPLE_TRACKS) {
    store.setCoverCache(item.track.path, item.cover);
  }

  // Ensure sample tracks are always available at the top and playable
  const otherTracks = store.tracks.filter(
    (t) => !SAMPLE_TRACKS.some((s) => s.track.path === t.path)
  );
  store.setTracks([...sampleTracksList, ...otherTracks]);
  store.playQueue(sampleTracksList, 0);
}

/** Parses dropped or uploaded audio files directly inside the browser */
export async function parseAudioFiles(fileList: FileList | File[]): Promise<Track[]> {
  const store = usePlayerStore.getState();
  const files = Array.from(fileList);
  const audioFiles = files.filter((f) =>
    /\.(mp3|wav|flac|ogg|m4a|aac|opus)$/i.test(f.name) || f.type.startsWith("audio/")
  );

  const parsedTracks: Track[] = [];
  let currentMaxId = store.tracks.reduce((max, t) => Math.max(max, t.id), 0);

  for (const file of audioFiles) {
    currentMaxId++;
    const objectUrl = URL.createObjectURL(file);

    // Clean name "Artist - Title.mp3" or just "Title"
    const rawName = file.name.replace(/\.[^/.]+$/, "");
    let artist = "Unknown Artist";
    let title = rawName;

    if (rawName.includes(" - ")) {
      const parts = rawName.split(" - ");
      artist = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    }

    // Try reading duration from HTML5 Audio
    let duration = 180;
    try {
      duration = await new Promise<number>((resolve) => {
        const tempAudio = new Audio(objectUrl);
        tempAudio.onloadedmetadata = () => {
          resolve(Math.round(tempAudio.duration) || 180);
        };
        tempAudio.onerror = () => resolve(180);
        setTimeout(() => resolve(180), 2000); // 2s timeout fallback
      });
    } catch {
      duration = 180;
    }

    const track: Track = {
      id: currentMaxId,
      path: objectUrl,
      title,
      artist,
      album: "Local Imports",
      duration,
      year: new Date().getFullYear(),
      genre: "Local",
    };

    parsedTracks.push(track);
  }

  if (parsedTracks.length > 0) {
    store.addTracks(parsedTracks);
    if (store.queue.length === 0) {
      store.playQueue(parsedTracks, 0);
    }
  }

  return parsedTracks;
}
