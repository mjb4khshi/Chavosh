import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Track {
  id: number;
  path: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  year?: number;
  track_number?: number;
  genre?: string;
}

export type RepeatMode = "off" | "all" | "one";
export type PlayerStyle = "vinyl" | "cd";
export type GramophoneSize = "compact" | "standard" | "large";
export type PlayerMode = "library" | "mini" | "nano" | "gramophone";
export type LibraryTab = "tracks" | "albums" | "artists" | "folders";

export interface Settings {
  theme: string;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  remixEnabled: boolean;
  remixMinSec: number;
  remixMaxSec: number;
  coverTint: boolean;
}

interface PlayerState {
  // Navigation & Modes
  activeTab: LibraryTab;
  setActiveTab: (tab: LibraryTab) => void;
  selectedArtist: string | null;
  setSelectedArtist: (artist: string | null) => void;
  selectedAlbum: string | null;
  setSelectedAlbum: (album: string | null) => void;
  playerMode: PlayerMode;
  setPlayerMode: (mode: PlayerMode) => void;
  isMiniPlayer: boolean; // computed / backward-compat
  setIsMiniPlayer: (mini: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showNowPlayingOverlay: boolean;
  setShowNowPlayingOverlay: (show: boolean) => void;
  showQueueDrawer: boolean;
  setShowQueueDrawer: (show: boolean) => void;
  toggleQueueDrawer: () => void;
  playerStyle: PlayerStyle;
  setPlayerStyle: (style: PlayerStyle) => void;
  gramophoneSize: GramophoneSize;
  setGramophoneSize: (size: GramophoneSize) => void;
  cycleGramophoneSize: () => void;
  /** Radial scale of the floating gramophone disc (0.7 – 1.25) */
  gramophoneScale: number;
  setGramophoneScale: (scale: number) => void;

  // Window
  alwaysOnTop: boolean;
  toggleAlwaysOnTop: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Library & Favorites
  tracks: Track[];
  folders: string[];
  favorites: number[];
  toggleFavorite: (id: number) => void;

  // Playback Queue
  queue: Track[];
  queueIndex: number;

  // Playback Status
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  shuffleQueue: Track[] | null;
  repeat: RepeatMode;

  // Album Art Cache & Dynamic Color Sync
  coverCache: Record<string, string>;
  setCoverCache: (path: string, cover: string) => void;
  dominantColor: string | null;
  setDominantColor: (color: string | null) => void;

  // Settings
  settings: Settings;

  // Actions
  setTracks: (tracks: Track[]) => void;
  addTracks: (tracks: Track[]) => void;
  setFolders: (folders: string[]) => void;

  playTrack: (track: Track, queue?: Track[]) => void;
  playQueue: (queue: Track[], startIndex?: number) => void;
  playQueueIndex: (index: number, initialTime?: number) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;

  toggleShuffle: () => void;
  shuffleRemainingQueue: () => void;
  removeFromQueue: (index: number) => void;
  setRepeat: (mode: RepeatMode) => void;
  updateSettings: (partial: Partial<Settings>) => void;
}

function applyThemeToDOM(theme: string) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

const defaultTheme = "persian-dark";
applyThemeToDOM(defaultTheme);

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      activeTab: "tracks",
      setActiveTab: (tab) =>
        set({
          activeTab: tab,
          selectedArtist: null,
          selectedAlbum: null,
        }),
      selectedArtist: null,
      setSelectedArtist: (artist) => set({ selectedArtist: artist }),
      selectedAlbum: null,
      setSelectedAlbum: (album) => set({ selectedAlbum: album }),
      playerMode: "library",
      setPlayerMode: (mode) =>
        set({
          playerMode: mode,
          isMiniPlayer: mode === "mini" || mode === "nano",
        }),
      isMiniPlayer: false,
      setIsMiniPlayer: (mini) =>
        set({
          isMiniPlayer: mini,
          playerMode: mini ? "nano" : "library",
        }),
      showSettings: false,
      setShowSettings: (show) => set({ showSettings: show }),
      showNowPlayingOverlay: false,
      setShowNowPlayingOverlay: (show) => set({ showNowPlayingOverlay: show }),
      showQueueDrawer: false,
      setShowQueueDrawer: (show) => set({ showQueueDrawer: show }),
      toggleQueueDrawer: () => set((s) => ({ showQueueDrawer: !s.showQueueDrawer })),
      playerStyle: "vinyl",
      setPlayerStyle: (style) => set({ playerStyle: style }),
      gramophoneSize: "standard",
      setGramophoneSize: (size) => set({ gramophoneSize: size }),
      cycleGramophoneSize: () =>
        set((s) => {
          const order: GramophoneSize[] = ["compact", "standard", "large"];
          const idx = order.indexOf(s.gramophoneSize);
          return { gramophoneSize: order[(idx + 1) % order.length] };
        }),
      gramophoneScale: 1,
      setGramophoneScale: (scale) =>
        set({ gramophoneScale: Math.max(0.7, Math.min(1.25, scale)) }),

      alwaysOnTop: false,
      toggleAlwaysOnTop: () => set((s) => ({ alwaysOnTop: !s.alwaysOnTop })),

      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      tracks: [],
      folders: [],
      favorites: [],
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((fid) => fid !== id)
            : [...s.favorites, id],
        })),

      queue: [],
      queueIndex: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.85,
      shuffle: false,
      shuffleQueue: null,
      repeat: "off",

      coverCache: {},
      setCoverCache: (path, cover) =>
        set((s) => ({
          coverCache: { ...s.coverCache, [path]: cover },
        })),
      dominantColor: null,
      setDominantColor: (color) => set({ dominantColor: color }),

      settings: {
        theme: defaultTheme,
        crossfadeEnabled: false,
        crossfadeDuration: 4,
        remixEnabled: false,
        remixMinSec: 30,
        remixMaxSec: 50,
        coverTint: true,
      },

      setTracks: (tracks) => set({ tracks }),
      addTracks: (newTracks) =>
        set((s) => {
          const existingPaths = new Set(s.tracks.map((t) => t.path));
          const filtered = newTracks.filter((t) => !existingPaths.has(t.path));
          return { tracks: [...s.tracks, ...filtered] };
        }),
      setFolders: (folders) => set({ folders }),

      playTrack: (track, queue) => {
        if (queue) {
          const idx = queue.findIndex((t) => t.id === track.id);
          set({
            queue,
            queueIndex: idx >= 0 ? idx : 0,
            shuffleQueue: null,
            shuffle: false,
            isPlaying: true,
            currentTime: 0,
          });
        } else {
          const { queue: currentQueue } = get();
          const idx = currentQueue.findIndex((t) => t.id === track.id);
          if (idx === -1) {
            set({
              queue: [track, ...currentQueue],
              queueIndex: 0,
              isPlaying: true,
              currentTime: 0,
            });
          } else {
            set({ queueIndex: idx, isPlaying: true, currentTime: 0 });
          }
        }
      },

      playQueue: (queue, startIndex = 0) => {
        if (queue.length === 0) return;
        set({
          queue,
          queueIndex: startIndex,
          shuffleQueue: null,
          shuffle: false,
          isPlaying: true,
          currentTime: 0,
        });
      },

      playQueueIndex: (index, initialTime) => {
        const { shuffle, shuffleQueue, queue } = get();
        const list = shuffle && shuffleQueue ? shuffleQueue : queue;
        if (index >= 0 && index < list.length) {
          set({
            queueIndex: index,
            currentTime: initialTime !== undefined ? initialTime : 0,
            isPlaying: true,
          });
        }
      },

      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      resume: () => set({ isPlaying: true }),

      next: () => {
        const { queue, queueIndex, repeat, shuffle, shuffleQueue } = get();
        const list = shuffle && shuffleQueue ? shuffleQueue : queue;
        if (list.length === 0) return;
        let nextIdx = queueIndex + 1;
        if (nextIdx >= list.length) {
          if (repeat === "all") nextIdx = 0;
          else {
            set({ isPlaying: false });
            return;
          }
        }
        set({ queueIndex: nextIdx, currentTime: 0, isPlaying: true });
      },

      prev: () => {
        const { queue, queueIndex, currentTime } = get();
        if (queue.length === 0) return;
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }
        const prevIdx = Math.max(0, queueIndex - 1);
        set({ queueIndex: prevIdx, currentTime: 0, isPlaying: true });
      },

      seek: (time) => set({ currentTime: time }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      setCurrentTime: (t) => set({ currentTime: t }),
      setDuration: (d) => set({ duration: d }),

      // Intelligent Shuffle: keeps current track playing at index 0, shuffles subsequent queue
      toggleShuffle: () => {
        const { shuffle, tracks, queue, queueIndex, shuffleQueue } = get();
        if (!shuffle) {
          const activeList = shuffleQueue ?? (queue.length > 0 ? queue : tracks);
          const current = queueIndex >= 0 && activeList[queueIndex] ? activeList[queueIndex] : null;

          if (current) {
            const pool = queue.length > 0 ? queue : tracks;
            const remaining = pool.filter((t) => t.id !== current.id);
            const shuffledRemaining = [...remaining].sort(() => Math.random() - 0.5);
            set({
              shuffle: true,
              shuffleQueue: [current, ...shuffledRemaining],
              queueIndex: 0,
            });
          } else {
            const pool = queue.length > 0 ? queue : tracks;
            const shuffled = [...pool].sort(() => Math.random() - 0.5);
            set({ shuffle: true, shuffleQueue: shuffled, queueIndex: 0 });
          }
        } else {
          // Disabling shuffle: keep current track playing in regular queue
          const activeList = shuffleQueue;
          const current = activeList && queueIndex >= 0 ? activeList[queueIndex] : null;
          if (current) {
            const origIdx = queue.findIndex((t) => t.id === current.id);
            set({
              shuffle: false,
              shuffleQueue: null,
              queueIndex: origIdx >= 0 ? origIdx : 0,
            });
          } else {
            set({ shuffle: false, shuffleQueue: null });
          }
        }
      },

      // Re-shuffle only upcoming tracks in the current queue
      shuffleRemainingQueue: () => {
        const { shuffle, shuffleQueue, queue, queueIndex } = get();
        const activeList = shuffle && shuffleQueue ? shuffleQueue : queue;
        if (activeList.length <= queueIndex + 1) return;

        const played = activeList.slice(0, queueIndex + 1);
        const upcoming = activeList.slice(queueIndex + 1);
        const reshuffledUpcoming = [...upcoming].sort(() => Math.random() - 0.5);
        const combined = [...played, ...reshuffledUpcoming];

        if (shuffle) {
          set({ shuffleQueue: combined });
        } else {
          set({ queue: combined });
        }
      },

      // Remove a specific index from the upcoming queue
      removeFromQueue: (index: number) => {
        const { shuffle, shuffleQueue, queue, queueIndex } = get();
        if (index === queueIndex) return; // Don't remove currently playing track

        if (shuffle && shuffleQueue) {
          const updated = shuffleQueue.filter((_, i) => i !== index);
          const newIdx = index < queueIndex ? queueIndex - 1 : queueIndex;
          set({ shuffleQueue: updated, queueIndex: newIdx });
        } else {
          const updated = queue.filter((_, i) => i !== index);
          const newIdx = index < queueIndex ? queueIndex - 1 : queueIndex;
          set({ queue: updated, queueIndex: newIdx });
        }
      },

      setRepeat: (mode) => set({ repeat: mode }),

      updateSettings: (partial) => {
        set((s) => {
          const updated = { ...s.settings, ...partial };
          if (partial.theme && partial.theme !== s.settings.theme) {
            applyThemeToDOM(partial.theme);
          }
          return { settings: updated };
        });
      },
    }),
    {
      name: "chavosh-player-store-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tracks: state.tracks,
        folders: state.folders,
        favorites: state.favorites,
        settings: state.settings,
        volume: state.volume,
        playerStyle: state.playerStyle,
        gramophoneSize: state.gramophoneSize,
        gramophoneScale: state.gramophoneScale,
        repeat: state.repeat,
        shuffle: state.shuffle,
        activeTab: state.activeTab,
      }),
    }
  )
);

export const selectCurrentTrack = (s: PlayerState): Track | null => {
  const list = s.shuffle && s.shuffleQueue ? s.shuffleQueue : s.queue;
  return list[s.queueIndex] ?? null;
};
