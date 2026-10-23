import { useState, useEffect } from "react";
import { usePlayerStore, selectCurrentTrack } from "./stores/playerStore";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { LibraryContent } from "./components/LibraryContent";
import { PlayerBar } from "./components/PlayerBar";
import { VinylOverlay } from "./components/VinylOverlay";
import { MiniPlayer } from "./components/MiniPlayer";
import { FloatingGramophone } from "./components/FloatingGramophone";
import { QueueDrawer } from "./components/QueueDrawer";
import { SettingsModal } from "./components/SettingsModal";
import { LyricsModal } from "./components/LyricsModal";
import { resizeWindow } from "./utils/window";
import { isTauri, loadSampleTracks, parseAudioFiles } from "./utils/browserAudio";
import { Music } from "lucide-react";

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

export default function App() {
  const playerMode = usePlayerStore((s) => s.playerMode);
  const showNowPlayingOverlay = usePlayerStore((s) => s.showNowPlayingOverlay);
  const showSettings = usePlayerStore((s) => s.showSettings);
  const theme = usePlayerStore((s) => s.settings.theme);
  const coverTint = usePlayerStore((s) => s.settings.coverTint);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const coverCache = usePlayerStore((s) => s.coverCache);
  const cover = currentTrack ? coverCache[currentTrack.path] : null;
  const gramophoneScale = usePlayerStore((s) => s.gramophoneScale);
  const tracks = usePlayerStore((s) => s.tracks);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Ensure browser preview always has playable audio tracks and an active queue ready to play
  useEffect(() => {
    if (!isTauri()) {
      const store = usePlayerStore.getState();
      const list = store.shuffle && store.shuffleQueue ? store.shuffleQueue : store.queue;
      const hasPlayable = store.tracks.some(
        (t) => t.path.startsWith("/audio/") || t.path.startsWith("blob:")
      );
      if (list.length === 0 || !hasPlayable) {
        loadSampleTracks();
      }
    }
  }, [tracks]);

  // Global Drag & Drop audio files anywhere on the browser window
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
        setIsDraggingFiles(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) {
        setIsDraggingFiles(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingFiles(false);
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        await parseAudioFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Initialize HTML5 Audio playback engine and global shortcuts
  useAudioPlayer();

  // Sync Sarv theme attribute to HTML document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Adjust window size across the 4 player modes
  useEffect(() => {
    switch (playerMode) {
      case "nano":
        resizeWindow(380, 64);
        break;
      case "mini":
        resizeWindow(440, 130);
        break;
      case "gramophone": {
        const size = Math.round(360 * gramophoneScale);
        resizeWindow(size, size);
        break;
      }
      case "library":
      default:
        resizeWindow(1180, 780);
        break;
    }
  }, [playerMode, gramophoneScale]);

  // High-Vibrance Dynamic Theme Accent Sync from Album Artwork
  useEffect(() => {
    if (!coverTint) {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--theme-color-primary");
      return;
    }

    const cover = currentTrack ? coverCache[currentTrack.path] : null;
    if (!cover) return;

    let active = true;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      if (!active) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = 32;
        canvas.height = 32;
        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;

        // Find candidate colors with good saturation
        let bestR = 0,
          bestG = 0,
          bestB = 0,
          maxSaturation = 0;

        for (let i = 0; i < data.length; i += 16) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const [h, s, l] = rgbToHsl(pr, pg, pb);

          // Favor rich, vivid colors across a broad lightness spectrum (0.10 to 0.90)
          if (l > 0.10 && l < 0.90 && s > maxSaturation) {
            maxSaturation = s;
            bestR = pr;
            bestG = pg;
            bestB = pb;
          }
        }

        // Only discard if truly monochromatic grayscale
        if (maxSaturation < 0.08) {
          document.documentElement.style.removeProperty("--primary");
          document.documentElement.style.removeProperty("--theme-color-primary");
          document.documentElement.style.removeProperty("--theme-color-accent");
          return;
        }

        // Boost saturation and clamp lightness to guarantee vivid, electric color
        const [h, s] = rgbToHsl(bestR, bestG, bestB);
        const finalColor = `hsl(${Math.round(h)}, ${Math.max(65, Math.round(s * 100))}%, 55%)`;
        const accentColor = `hsl(${Math.round((h + 30) % 360)}, 80%, 60%)`;
        document.documentElement.style.setProperty("--primary", finalColor);
        document.documentElement.style.setProperty("--theme-color-primary", finalColor);
        document.documentElement.style.setProperty("--theme-color-accent", accentColor);
      } catch (e) {
        console.warn("Could not extract cover color:", e);
      }
    };
    img.src = cover;

    return () => {
      active = false;
    };
  }, [currentTrack?.path, coverCache, coverTint]);

  // ── 1. Floating Gramophone / CD View (100% Transparent, No Background Box) ──
  if (playerMode === "gramophone") {
    return (
      <div className="h-full w-full select-none bg-transparent relative">
        <FloatingGramophone />
        <QueueDrawer />
      </div>
    );
  }

  // ── 2. Nano Player (Dynamic Island Capsule) & Mini Player ──
  if (playerMode === "nano" || playerMode === "mini") {
    return (
      <div className="h-full w-full select-none bg-transparent">
        <MiniPlayer />
      </div>
    );
  }

  // ── 3. Main Desktop Library View (Default) ──
  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden select-none relative"
      style={{
        background: "var(--theme-color-base)",
        border: "1px solid color-mix(in oklab, var(--theme-color-base-500, #333) 50%, transparent)",
        borderRadius: "var(--theme-radius-card, 1.25rem)",
        boxShadow: "none",
      }}
    >
      {/* Top Window Titlebar, Search & Mode Switcher */}
      <Header />

      {/* Dynamic Ambient Blurred Cover Aura behind Library View */}
      {cover && coverTint && (
        <div
          className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full pointer-events-none opacity-20 filter blur-[100px] transition-all duration-1000 ease-out z-0"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Center Body: Left Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <LibraryContent />

        {/* Sliding Queue Drawer */}
        <QueueDrawer />

        {/* Settings & Themes Modal */}
        {showSettings && <SettingsModal />}

        {/* Synchronized Lyrics Modal */}
        <LyricsModal />
      </div>

      {/* Persistent Bottom Player Bar - Hidden when in Vinyl Room mode */}
      {!showNowPlayingOverlay && <PlayerBar />}

      {/* Vinyl / Gramophone Immersive Fullscreen Overlay */}
      {showNowPlayingOverlay && <VinylOverlay />}

      {/* Global Drag & Drop Overlay */}
      {isDraggingFiles && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md pointer-events-none animate-fadeIn border-2 border-dashed border-[var(--primary,#0066a4)] m-4 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary,#0066a4)]/20 text-[var(--primary,#0066a4)] flex items-center justify-center mb-3 shadow-lg">
            <Music size={32} />
          </div>
          <div className="text-base font-bold text-white">Drop music files here</div>
          <div className="text-xs text-neutral mt-1">MP3, WAV, FLAC, M4A, OGG are supported</div>
        </div>
      )}
    </div>
  );
}
