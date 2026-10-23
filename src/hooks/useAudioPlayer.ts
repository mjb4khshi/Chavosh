import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore, selectCurrentTrack } from "../stores/playerStore";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getTrackCover } from "../utils/window";
import { loadTrackCover } from "../utils/coverLoader";
import { isTauri } from "../utils/browserAudio";
import { attachAudioToAnalyser, resumeAudioContext } from "../utils/audioVisualizer";

export function toAudioSrc(path: string): string {
  if (!path) return "/audio/chavosh-ambient.wav";
  if (
    path.startsWith("blob:") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("/audio/") ||
    path.startsWith("/") ||
    path.startsWith("./")
  ) {
    return path;
  }
  if (!isTauri()) {
    // In browser mode, Windows paths (like C:\ or D:\) cannot be loaded via filesystem.
    // Map them to local playable audio files so audio playback always works smoothly in browser!
    const demos = [
      "/audio/chavosh-ambient.wav",
      "/audio/chavosh-chill.wav",
      "/audio/chavosh-lofi.wav",
    ];
    let hash = 0;
    for (let i = 0; i < path.length; i++) {
      hash = (hash << 5) - hash + path.charCodeAt(i);
      hash |= 0;
    }
    return demos[Math.abs(hash) % demos.length];
  }
  try {
    return convertFileSrc(path);
  } catch {
    return path;
  }
}

let lastGlobalNavTime = 0;
export const safeNextTrack = () => {
  const now = Date.now();
  if (now - lastGlobalNavTime < 450) return;
  lastGlobalNavTime = now;
  usePlayerStore.getState().next();
};

export const safePrevTrack = () => {
  const now = Date.now();
  if (now - lastGlobalNavTime < 450) return;
  lastGlobalNavTime = now;
  usePlayerStore.getState().prev();
};

export function useAudioPlayer() {
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeDeckRef = useRef<"A" | "B">("A");
  const isCrossfadingRef = useRef<boolean>(false);
  const remixCheckIntervalRef = useRef<number | null>(null);
  const skipSeekSyncRef = useRef<boolean>(false);
  /** Track that the crossfade engine already loaded + faded in. Prevents the
   *  load effect from re-loading it (which caused the audible "played twice"
   *  glitch on every remix transition). */
  const preparedDeckRef = useRef<{ id?: number; path: string; deck: "A" | "B" } | null>(null);
  const lastLoadedLyricsTrackRef = useRef<string | null>(null);

  const store = usePlayerStore;
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const settings = usePlayerStore((s) => s.settings);
  const coverCache = usePlayerStore((s) => s.coverCache);
  const setCoverCache = usePlayerStore((s) => s.setCoverCache);
  const loadLyrics = usePlayerStore((s) => s.loadLyrics);

  // Initialize both audio elements
  useEffect(() => {
    const audioA = new Audio();
    const audioB = new Audio();
    audioA.preload = "auto";
    audioB.preload = "auto";
    audioA.crossOrigin = "anonymous";
    audioB.crossOrigin = "anonymous";
    audioARef.current = audioA;
    audioBRef.current = audioB;

    // Attach both decks to audio analyser early for instantaneous spectrum tracking
    attachAudioToAnalyser(audioA);
    attachAudioToAnalyser(audioB);

    const onTimeUpdate = (e: Event) => {
      const audio = e.currentTarget as HTMLAudioElement;
      const activeAudio = activeDeckRef.current === "A" ? audioARef.current : audioBRef.current;
      if (audio === activeAudio && !isCrossfadingRef.current) {
        store.getState().setCurrentTime(audio.currentTime);
      }
    };

    const onLoadedMetadata = (e: Event) => {
      const audio = e.currentTarget as HTMLAudioElement;
      const activeAudio = activeDeckRef.current === "A" ? audioARef.current : audioBRef.current;
      if (audio === activeAudio) {
        store.getState().setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      if (isCrossfadingRef.current) return;
      const s = store.getState();
      const list = s.shuffle && s.shuffleQueue ? s.shuffleQueue : s.queue;
      if (s.repeat === "one") {
        const active = activeDeckRef.current === "A" ? audioARef.current : audioBRef.current;
        if (active) {
          active.currentTime = 0;
          active.play().catch(() => {});
        }
        return;
      }
      if (s.queueIndex < list.length - 1 || s.repeat === "all") {
        s.next();
      } else {
        s.pause();
      }
    };

    const onError = (e: Event) => {
      const audio = e.currentTarget as HTMLAudioElement;
      console.warn("Audio element failed to load src:", audio.src, e);
      if (!isTauri() && !audio.src.endsWith("/audio/chavosh-ambient.wav")) {
        audio.src = "/audio/chavosh-ambient.wav";
        if (store.getState().isPlaying) {
          audio.play().catch(() => {});
        }
      }
    };

    audioA.addEventListener("timeupdate", onTimeUpdate);
    audioA.addEventListener("loadedmetadata", onLoadedMetadata);
    audioA.addEventListener("ended", onEnded);
    audioA.addEventListener("error", onError);

    audioB.addEventListener("timeupdate", onTimeUpdate);
    audioB.addEventListener("loadedmetadata", onLoadedMetadata);
    audioB.addEventListener("ended", onEnded);
    audioB.addEventListener("error", onError);

    return () => {
      audioA.removeEventListener("timeupdate", onTimeUpdate);
      audioA.removeEventListener("loadedmetadata", onLoadedMetadata);
      audioA.removeEventListener("ended", onEnded);
      audioA.removeEventListener("error", onError);
      audioB.removeEventListener("timeupdate", onTimeUpdate);
      audioB.removeEventListener("loadedmetadata", onLoadedMetadata);
      audioB.removeEventListener("ended", onEnded);
      audioB.removeEventListener("error", onError);
      audioA.pause();
      audioB.pause();
      if (remixCheckIntervalRef.current) {
        clearInterval(remixCheckIntervalRef.current);
      }
    };
  }, []);

  // Fetch cover art if not cached
  useEffect(() => {
    if (!currentTrack || !currentTrack.path) return;
    loadTrackCover(currentTrack.path);
  }, [currentTrack?.path]);

  // Automatically search and load lyrics on track change (guarded against duplicate invocations)
  useEffect(() => {
    if (!currentTrack || !currentTrack.path) return;
    const trackKey = `${currentTrack.id}:${currentTrack.path}`;
    if (lastLoadedLyricsTrackRef.current === trackKey) return;
    lastLoadedLyricsTrackRef.current = trackKey;
    loadLyrics(currentTrack);
  }, [currentTrack?.id, currentTrack?.path, loadLyrics]);

  // Windows Media Transport Controls (SMTC) & Background Media Keys
  // Enables hardware media keys (Next/Prev/Play/Pause) to work even when Chavosh is unfocused or minimized!
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (currentTrack) {
      const coverUrl = coverCache[currentTrack.path];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: coverUrl
          ? [{ src: coverUrl, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    navigator.mediaSession.setActionHandler("play", () => {
      store.getState().play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      store.getState().pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      safePrevTrack();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      safeNextTrack();
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        store.getState().seek(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const offset = details.seekOffset || 10;
      store.getState().seek(Math.max(0, store.getState().currentTime - offset));
    });
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const offset = details.seekOffset || 10;
      store.getState().seek(Math.min(store.getState().duration, store.getState().currentTime + offset));
    });

    return () => {
      if (!("mediaSession" in navigator)) return;
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
    };
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.artist, currentTrack?.album, coverCache, isPlaying]);

  // Load and play track on active deck
  useEffect(() => {
    if (!currentTrack) return;
    if (isCrossfadingRef.current) return; // handled by crossfade routine

    const activeAudio = activeDeckRef.current === "A" ? audioARef.current : audioBRef.current;
    if (!activeAudio) return;

    // The crossfade engine already loaded & faded this exact track in on the
    // deck that is now active — reloading `src` here would restart it from 0
    // and replay the section that was just faded in.
    const prepared = preparedDeckRef.current;
    if (
      prepared &&
      (prepared.path === currentTrack.path || prepared.id === currentTrack.id) &&
      prepared.deck === activeDeckRef.current
    ) {
      preparedDeckRef.current = null;
      activeAudio.volume = volume;
      if (isPlaying && activeAudio.paused) activeAudio.play().catch(() => {});
      return;
    }

    const src = toAudioSrc(currentTrack.path);
    if (!activeAudio.src || !activeAudio.src.endsWith(src)) {
      activeAudio.src = src;
    }
    activeAudio.volume = volume;

    if (isPlaying) {
      resumeAudioContext();
      attachAudioToAnalyser(activeAudio);
      resumeAudioContext();
      attachAudioToAnalyser(activeAudio);
      const playPromise = activeAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio play() caught:", err);
          const onCanPlay = () => {
            if (store.getState().isPlaying) {
              activeAudio.play().catch(() => {});
            }
          };
          activeAudio.addEventListener("canplay", onCanPlay, { once: true });
        });
      }
    }

    // Remix Mode: seek directly into energetic section (20-25%)
    if (settings.remixEnabled) {
      const handleJump = () => {
        if (activeAudio.duration > 50) {
          const start = Math.min(activeAudio.duration * 0.25, 40);
          activeAudio.currentTime = start;
          store.getState().setCurrentTime(start);
        }
      };
      if (activeAudio.readyState >= 1) {
        handleJump();
      } else {
        activeAudio.addEventListener("loadedmetadata", handleJump, { once: true });
      }
    }
  }, [currentTrack?.id, currentTrack?.path, settings.remixEnabled]);

  // High-Energy Seamless Remix Crossfade Engine
  useEffect(() => {
    if (remixCheckIntervalRef.current) {
      clearInterval(remixCheckIntervalRef.current);
      remixCheckIntervalRef.current = null;
    }

    if (!settings.remixEnabled || !isPlaying) return;

    const minSec = settings.remixMinSec || 30;
    const maxSec = settings.remixMaxSec || 48;
    const clipDuration = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
    const crossfadeDuration = 3; // 3 seconds smooth crossfade overlap
    let clipStartedAt = Date.now();

    remixCheckIntervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - clipStartedAt) / 1000;
      if (elapsed >= clipDuration - crossfadeDuration && !isCrossfadingRef.current) {
        // Time to initiate seamless crossfade to next track!
        const s = store.getState();
        const list = s.shuffle && s.shuffleQueue ? s.shuffleQueue : s.queue;
        if (list.length === 0) return;

        let nextIdx = s.queueIndex + 1;
        if (nextIdx >= list.length) {
          if (s.repeat === "all") nextIdx = 0;
          else return;
        }

        const nextTrack = list[nextIdx];
        if (!nextTrack) return;

        isCrossfadingRef.current = true;

        const currentDeck = activeDeckRef.current;
        const nextDeck = currentDeck === "A" ? "B" : "A";
        const currentAudio = currentDeck === "A" ? audioARef.current : audioBRef.current;
        const nextAudio = nextDeck === "A" ? audioARef.current : audioBRef.current;

        if (!currentAudio || !nextAudio) {
          isCrossfadingRef.current = false;
          return;
        }

        // Prepare next deck
        nextAudio.src = toAudioSrc(nextTrack.path);
        nextAudio.volume = 0;

        const startCrossfade = () => {
          if (nextAudio.duration > 50) {
            nextAudio.currentTime = Math.min(nextAudio.duration * 0.25, 40);
          } else {
            nextAudio.currentTime = 0;
          }

          nextAudio.play().catch(() => {});

          const steps = 30;
          const stepInterval = (crossfadeDuration * 1000) / steps;
          let currentStep = 0;

          const fadeTimer = window.setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;

            // Equal power crossfade curves
            const gainIn = Math.sin((progress * Math.PI) / 2);
            const gainOut = Math.cos((progress * Math.PI) / 2);

            nextAudio.volume = Math.max(0, Math.min(1, gainIn * s.volume));
            currentAudio.volume = Math.max(0, Math.min(1, gainOut * s.volume));

            if (currentStep >= steps) {
              clearInterval(fadeTimer);
              currentAudio.pause();
              currentAudio.volume = s.volume;
              nextAudio.volume = s.volume;
              activeDeckRef.current = nextDeck;
              
              // Prevent seek-sync from rewinding the track back to 0
              skipSeekSyncRef.current = true;
              isCrossfadingRef.current = false;

              preparedDeckRef.current = {
                id: nextTrack.id,
                path: nextTrack.path,
                deck: nextDeck,
              };

              const realTime = nextAudio.currentTime;
              s.playQueueIndex(nextIdx, realTime);
              s.setCurrentTime(realTime);

              setTimeout(() => {
                skipSeekSyncRef.current = false;
              }, 400);

              clipStartedAt = Date.now();
            }
          }, stepInterval);
        };

        if (nextAudio.readyState >= 1) {
          startCrossfade();
        } else {
          nextAudio.addEventListener("loadedmetadata", startCrossfade, { once: true });
        }
      }
    }, 500);

    return () => {
      if (remixCheckIntervalRef.current) {
        clearInterval(remixCheckIntervalRef.current);
        remixCheckIntervalRef.current = null;
      }
    };
  }, [settings.remixEnabled, isPlaying, currentTrack?.id]);

  // Play/pause control
  useEffect(() => {
    const activeAudio = activeDeckRef.current === "A" ? audioARef.current : audioBRef.current;
    if (!activeAudio) return;
    if (isPlaying) {
      if (currentTrack) {
        const expected = toAudioSrc(currentTrack.path);
        if (!activeAudio.src || !activeAudio.src.endsWith(expected)) {
          activeAudio.src = expected;
        }
      }
      resumeAudioContext();
      attachAudioToAnalyser(activeAudio);
      const playPromise = activeAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio play() waiting for data:", err);
          const onCanPlay = () => {
            if (store.getState().isPlaying) {
              activeAudio.play().catch(() => {});
            }
          };
          activeAudio.addEventListener("canplay", onCanPlay, { once: true });
        });
      }
    } else {
      activeAudio.pause();
      const inactiveAudio = activeDeckRef.current === "A" ? audioBRef.current : audioARef.current;
      inactiveAudio?.pause();
    }
  }, [isPlaying, currentTrack?.path]);

  // Volume
  useEffect(() => {
    if (!isCrossfadingRef.current) {
      if (audioARef.current) audioARef.current.volume = volume;
      if (audioBRef.current) audioBRef.current.volume = volume;
    }
  }, [volume]);

  // Seek
  useEffect(() => {
    if (skipSeekSyncRef.current || isCrossfadingRef.current) return;
    const activeAudio = activeDeckRef.current === "A" ? audioARef.current : audioBRef.current;
    if (!activeAudio) return;
    const diff = Math.abs(activeAudio.currentTime - currentTime);
    if (diff > 1.5) {
      activeAudio.currentTime = currentTime;
    }
  }, [currentTime]);

  // Global Gestures & Touchpad 3-Finger Swipes & Shortcuts
  useEffect(() => {
    let accumulatedDeltaX = 0;
    let wheelSwipeTimer: number | null = null;

    const handleWheel = (e: WheelEvent) => {
      // Check if user did a horizontal swipe gesture (touchpad 3-finger swipe or tilt wheel)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) {
        accumulatedDeltaX += e.deltaX;
        if (wheelSwipeTimer) clearTimeout(wheelSwipeTimer);
        wheelSwipeTimer = window.setTimeout(() => {
          if (accumulatedDeltaX > 55) {
            safeNextTrack();
          } else if (accumulatedDeltaX < -55) {
            safePrevTrack();
          }
          accumulatedDeltaX = 0;
        }, 70);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const s = store.getState();

      // Space: Play/Pause
      if (e.code === "Space") {
        e.preventDefault();
        s.togglePlay();
        return;
      }

      // External Keyboard Media & Navigation Keys (keyCode 176, 167, etc.)
      const isNextKey =
        e.code === "MediaTrackNext" ||
        e.key === "MediaTrackNext" ||
        e.code === "BrowserForward" ||
        e.key === "BrowserForward" ||
        e.keyCode === 176 ||
        e.keyCode === 167;

      const isPrevKey =
        e.code === "MediaTrackPrevious" ||
        e.key === "MediaTrackPrevious" ||
        e.code === "BrowserBack" ||
        e.key === "BrowserBack" ||
        e.keyCode === 177 ||
        e.keyCode === 166;

      const isPlayPauseKey =
        e.code === "MediaPlayPause" ||
        e.key === "MediaPlayPause" ||
        e.keyCode === 179;

      if (isNextKey) {
        e.preventDefault();
        safeNextTrack();
        return;
      }
      if (isPrevKey) {
        e.preventDefault();
        safePrevTrack();
        return;
      }
      if (isPlayPauseKey) {
        e.preventDefault();
        s.togglePlay();
        return;
      }

      // Arrow navigation
      if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        s.toggleLyrics();
        return;
      }
      if (e.code === "Escape") {
        if (s.showLyrics) {
          e.preventDefault();
          s.setShowLyrics(false);
          return;
        }
        if (s.showSettings) {
          e.preventDefault();
          s.setShowSettings(false);
          return;
        }
        if (s.showNowPlayingOverlay) {
          e.preventDefault();
          s.setShowNowPlayingOverlay(false);
          return;
        }
        if (s.showQueueDrawer) {
          e.preventDefault();
          s.setShowQueueDrawer(false);
          return;
        }
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (e.altKey || e.ctrlKey) safePrevTrack();
        else s.seek(Math.max(0, s.currentTime - 5));
        return;
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        if (e.altKey || e.ctrlKey) safeNextTrack();
        else s.seek(Math.min(s.duration, s.currentTime + 5));
        return;
      }
      if (e.code === "ArrowUp") {
        e.preventDefault();
        s.setVolume(Math.min(1, s.volume + 0.05));
        return;
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        s.setVolume(Math.max(0, s.volume - 0.05));
        return;
      }
    };

    // External Mouse Navigation (Back/Forward side buttons)
    const handleMouseNav = (e: MouseEvent) => {
      // Button 3: Back (XBUTTON1), Button 4: Forward (XBUTTON2)
      if (e.button === 3) {
        e.preventDefault();
        e.stopPropagation();
        safePrevTrack();
      } else if (e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
        safeNextTrack();
      }
    };

    // Attach listeners with capture: true to intercept before WebView2 default handling
    window.addEventListener("wheel", handleWheel, { passive: true, capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("pointerdown", handleMouseNav, { capture: true });

    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("pointerdown", handleMouseNav, { capture: true });
      if (wheelSwipeTimer) clearTimeout(wheelSwipeTimer);
    };
  }, []);


  const seek = useCallback((time: number) => {
    const activeAudio = activeDeckRef.current === "A" ? audioARef.current : audioBRef.current;
    if (activeAudio) {
      activeAudio.currentTime = time;
    }
    store.getState().seek(time);
  }, []);

  return { seek, audioRef: audioARef };
}
