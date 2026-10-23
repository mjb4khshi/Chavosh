import { useState } from "react";
import {
  Maximize2,
  Disc3,
  Pin,
  X,
  Mic2,
} from "lucide-react";
import {
  IconsaxPlay,
  IconsaxPause,
  IconsaxNext,
  IconsaxPrevious,
  IconsaxShuffle,
  IconsaxRepeat,
  IconsaxRepeatOne,
  IconsaxVolumeHigh,
  IconsaxVolumeLow,
  IconsaxVolumeCross,
  IconsaxCd,
  IconsaxMusic,
} from "./Iconsax";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore, selectCurrentTrack } from "../stores/playerStore";
import { formatTime } from "../utils/format";
import { setAlwaysOnTop, closeWindow, startWindowDragging } from "../utils/window";
import { findActiveLyricIndex } from "../utils/lyrics";

export function MiniPlayer() {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const setRepeat = usePlayerStore((s) => s.setRepeat);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const playerMode = usePlayerStore((s) => s.playerMode);
  const setPlayerMode = usePlayerStore((s) => s.setPlayerMode);
  const setShowNowPlayingOverlay = usePlayerStore((s) => s.setShowNowPlayingOverlay);
  const alwaysOnTop = usePlayerStore((s) => s.alwaysOnTop);
  const toggleAlwaysOnTop = usePlayerStore((s) => s.toggleAlwaysOnTop);
  const coverCache = usePlayerStore((s) => s.coverCache);
  const currentLyrics = usePlayerStore((s) => s.currentLyrics);

  const [showLyricsNano, setShowLyricsNano] = useState(false);
  const [showLyricsMini, setShowLyricsMini] = useState(false);

  const activeLyricIndex =
    currentLyrics && currentLyrics.synced
      ? findActiveLyricIndex(currentLyrics.lines, currentTime)
      : -1;
  const currentLyricLine =
    currentLyrics && activeLyricIndex >= 0
      ? currentLyrics.lines[activeLyricIndex]
      : null;
  const nextLyricLine =
    currentLyrics &&
    activeLyricIndex >= 0 &&
    activeLyricIndex + 1 < currentLyrics.lines.length
      ? currentLyrics.lines[activeLyricIndex + 1]
      : null;

  const cover = currentTrack ? coverCache[currentTrack.path] : null;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const cycleRepeat = () => {
    const order = ["off", "all", "one"] as const;
    const idx = order.indexOf(repeat);
    setRepeat(order[(idx + 1) % order.length]);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const handlePin = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextVal = !alwaysOnTop;
    toggleAlwaysOnTop();
    await setAlwaysOnTop(nextVal);
  };

  const restoreLibrary = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowNowPlayingOverlay(false);
    setPlayerMode("library");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.button === 0 &&
      !(e.target as HTMLElement).closest(
        "button, input, select, textarea, a, [data-no-drag], .cursor-pointer, [role='slider'], [role='button']"
      )
    ) {
      startWindowDragging();
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // 1. DYNAMIC ISLAND (NANO CAPSULE) — 380x64 Window
  // ══════════════════════════════════════════════════════════════════
  if (playerMode === "nano") {
    return (
      <div
        onMouseDown={handleMouseDown}
        className="w-full h-full flex items-center justify-center select-none p-2"
        style={{ background: "transparent" }}
      >
        <div
          className="w-[356px] h-[48px] rounded-full flex items-center px-2.5 gap-2.5 relative cursor-default overflow-hidden group"
          style={{
            background: "rgba(10, 11, 16, 0.92)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow:
              "0 4px 16px -2px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          }}
        >
          {/* Hairline Progress Bar at the Bottom Edge */}
          <div
            onClick={handleSeek}
            data-no-drag
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.06] overflow-hidden cursor-pointer group/seek"
            title="Click to seek"
          >
            <div
              className="h-full transition-all duration-150"
              style={{
                width: `${progressPercent}%`,
                background: "var(--primary)",
                boxShadow: "0 0 8px var(--primary)",
              }}
            />
          </div>

          {/* Left: Spinning Micro-Vinyl Record */}
          <div
            onClick={restoreLibrary}
            data-no-drag
            className="w-9 h-9 rounded-full relative shrink-0 overflow-hidden flex items-center justify-center vinyl-grooves shadow-lg border border-white/10 cursor-pointer"
            title="Click to restore full library"
          >
            {cover ? (
              <img
                src={cover}
                alt=""
                className={`w-full h-full rounded-full object-cover pointer-events-none ${
                  isPlaying ? "spinning" : "spinning spinning-paused"
                }`}
              />
            ) : (
              <div
                className={`w-full h-full rounded-full flex items-center justify-center pointer-events-none ${
                  isPlaying ? "spinning" : "spinning spinning-paused"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "var(--primary)" }}
                />
              </div>
            )}
            {/* Center Spindle */}
            <div className="w-2.5 h-2.5 rounded-full bg-black/90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/30" />
          </div>

          {/* Center: Live Soundwave EQ & Track Info / Live Lyric Ticker */}
          <div
            onClick={() => setShowLyricsNano(!showLyricsNano)}
            data-no-drag
            className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer group/ticker"
            title={currentLyrics ? "Click to toggle Live Lyrics / Track Info" : undefined}
          >
            {/* 3-Bar Soundwave Visualizer */}
            <div className="flex items-end gap-0.5 h-3 shrink-0">
              <span
                className={`w-[2.5px] rounded-full ${isPlaying ? "eq-bar-1" : "h-1"}`}
                style={{ background: "var(--primary)" }}
              />
              <span
                className={`w-[2.5px] rounded-full ${isPlaying ? "eq-bar-2" : "h-2"}`}
                style={{ background: "var(--accent)" }}
              />
              <span
                className={`w-[2.5px] rounded-full ${isPlaying ? "eq-bar-3" : "h-1.5"}`}
                style={{ background: "var(--primary)" }}
              />
            </div>

            <div className="min-w-0 flex-1 overflow-hidden pointer-events-none">
              <AnimatePresence mode="wait" initial={false}>
                {showLyricsNano && currentLyricLine ? (
                  <motion.div
                    key={currentLyricLine.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    dir="auto"
                    className="text-[11px] font-bold truncate leading-tight drop-shadow-sm flex items-center gap-1"
                    style={{ color: "var(--primary, #00d2ff)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                      style={{ background: "var(--primary, #00d2ff)" }}
                    />
                    <span className="truncate">{currentLyricLine.text}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentTrack?.title ?? "title"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="text-[11px] font-bold truncate text-white leading-tight flex items-center gap-1">
                      <span className="truncate">{currentTrack?.title ?? "No Track Playing"}</span>
                      {currentLyrics?.synced && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/70 font-mono">
                          LRC
                        </span>
                      )}
                    </div>
                    <div className="text-[9.5px] truncate text-white/50 leading-tight mt-0.5">
                      {currentTrack?.artist ?? "Chavosh"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Micro Controls */}
          <div className="flex items-center gap-0.5 shrink-0" data-no-drag>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              data-no-drag
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Previous"
            >
              <IconsaxPrevious size={13} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              data-no-drag
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md mx-0.5 cursor-pointer"
              style={{
                background: "var(--primary)",
                color: "var(--theme-color-primary-content, #fff)",
                boxShadow: "0 2px 10px color-mix(in srgb, var(--primary) 60%, transparent)",
              }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <IconsaxPause size={12} /> : <IconsaxPlay size={12} className="ml-0.5" />}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              data-no-drag
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Next"
            >
              <IconsaxNext size={13} />
            </button>

            <button
              onClick={handlePin}
              data-no-drag
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors ml-0.5 cursor-pointer"
              style={{
                color: alwaysOnTop ? "var(--primary)" : "rgba(255,255,255,0.45)",
              }}
              title={alwaysOnTop ? "Always On Top: ON" : "Pin Window"}
            >
              <Pin size={10} className={alwaysOnTop ? "rotate-45 fill-current" : ""} />
            </button>

            <button
              onClick={restoreLibrary}
              data-no-drag
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Expand to Full Library"
            >
              <Maximize2 size={10} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); closeWindow(); }}
              data-no-drag
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/80 text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // 2. COMPACT MINI PLAYER (DEDICATED CARD VIEW) — 440x130 Window
  // ══════════════════════════════════════════════════════════════════
  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-full h-full flex items-center justify-center select-none p-2"
      style={{ background: "transparent" }}
    >
      <div
        className="w-[416px] h-[110px] rounded-3xl flex items-center p-3 gap-3.5 relative cursor-default overflow-hidden group/card"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--theme-color-base-500, #141620) 88%, var(--theme-color-base, #07080c)) 0%, color-mix(in oklab, var(--theme-color-base, #07080c) 94%, black) 100%)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid color-mix(in oklab, var(--theme-color-base-content, #fff) 12%, transparent)",
          boxShadow:
            "0 20px 40px -10px rgba(0, 0, 0, 0.75), 0 8px 16px -6px rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.18)",
        }}
      >
        {/* Subtle Theme Ambient Glow radiating inside the card */}
        <div
          className="absolute -top-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{
            background: "var(--primary, var(--theme-color-primary, #0066a4))",
          }}
        />

        {/* Left: High-Res Album Cover / Stylized Vinyl Hub with Ambient Backlight Glow */}
        <div
          onClick={restoreLibrary}
          data-no-drag
          className="relative shrink-0 cursor-pointer"
          title="Click to restore full library"
        >
          {/* Ambient Glow */}
          {cover ? (
            <div
              className="absolute -inset-1 rounded-2xl opacity-45 blur-md pointer-events-none transition-opacity duration-500"
              style={{
                backgroundImage: `url(${cover})`,
                backgroundSize: "cover",
              }}
            />
          ) : (
            <div
              className="absolute -inset-1 rounded-2xl opacity-30 blur-md pointer-events-none"
              style={{
                background: "var(--primary, var(--theme-color-primary, #0066a4))",
              }}
            />
          )}

          <div
            className="w-[86px] h-[86px] rounded-2xl overflow-hidden relative shadow-lg border border-white/15 flex items-center justify-center shrink-0"
            style={{
              background: cover
                ? "#000000"
                : "linear-gradient(135deg, color-mix(in oklab, var(--theme-color-base-500, #1e202c) 75%, transparent) 0%, color-mix(in oklab, var(--theme-color-base, #101118) 95%, black) 100%)",
            }}
          >
            {cover ? (
              <img src={cover} alt="" className="w-full h-full object-cover select-none pointer-events-none" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner border border-white/10"
                  style={{
                    background:
                      "color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 18%, transparent)",
                  }}
                >
                  <IconsaxMusic
                    size={20}
                    style={{ color: "var(--primary, var(--theme-color-primary, #0066a4))" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls, Timeline & Metadata */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-[86px]">
          {/* Top Row: Track Title, Artist & Quick Window Actions */}
          <div className="flex items-start justify-between gap-2">
            <div
              className="min-w-0 flex-1 cursor-pointer"
              data-no-drag
              onClick={() => setShowLyricsMini(!showLyricsMini)}
              title="Click to toggle Lyrics / Title"
            >
              <AnimatePresence mode="wait" initial={false}>
                {showLyricsMini ? (
                  <motion.div
                    key={currentLyricLine ? currentLyricLine.id : "no-lyric"}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.16 }}
                    className="min-w-0"
                    dir="auto"
                  >
                    {currentLyricLine ? (
                      <>
                        <div
                          className="text-[12px] font-bold truncate leading-tight tracking-tight flex items-center gap-1.5 drop-shadow-sm"
                          style={{ color: "var(--primary, #00d2ff)" }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                            style={{ background: "var(--primary, #00d2ff)" }}
                          />
                          <span className="truncate">{currentLyricLine.text}</span>
                        </div>
                        <div className="text-[10.5px] truncate text-white/80 mt-0.5 font-semibold pl-3">
                          {nextLyricLine?.text ?? currentTrack?.artist}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[12px] font-bold text-white/70 italic truncate">
                          {currentLyrics ? "♪ Instrumental ♪" : "Searching lyrics..."}
                        </div>
                        <div className="text-[10px] truncate text-white/40 mt-0.5">
                          {currentTrack?.title} - {currentTrack?.artist}
                        </div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentTrack?.title ?? "title"}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.16 }}
                    className="min-w-0"
                  >
                    <div className="text-[12.5px] font-bold truncate text-white leading-tight tracking-tight flex items-center gap-1.5">
                      {isPlaying && (
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                          style={{ background: "var(--primary, #0066a4)" }}
                        />
                      )}
                      <span className="truncate">{currentTrack?.title ?? "No Track Selected"}</span>
                      {currentLyrics?.synced && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/70 font-mono">
                          LRC
                        </span>
                      )}
                    </div>
                    <div className="text-[10.5px] truncate text-white/55 mt-0.5 font-medium">
                      {currentTrack?.artist ?? "Chavosh"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Window control icons capsule */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm shrink-0" data-no-drag>
              <button
                onClick={(e) => { e.stopPropagation(); setShowLyricsMini(!showLyricsMini); }}
                data-no-drag
                className="w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  color: showLyricsMini ? "var(--primary, #0066a4)" : "rgba(255,255,255,0.45)",
                  background: showLyricsMini
                    ? "color-mix(in oklab, var(--primary, #0066a4) 22%, transparent)"
                    : "transparent",
                }}
                title={showLyricsMini ? "Show Track Info" : "Live Dual-Line Lyrics"}
              >
                <Mic2 size={11} />
              </button>
              <button
                onClick={handlePin}
                data-no-drag
                className="w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  color: alwaysOnTop ? "var(--primary, #0066a4)" : "rgba(255,255,255,0.45)",
                  background: alwaysOnTop
                    ? "color-mix(in oklab, var(--primary, #0066a4) 18%, transparent)"
                    : "transparent",
                }}
                title={alwaysOnTop ? "Always On Top: ON" : "Pin Always on Top"}
              >
                <Pin size={11} className={alwaysOnTop ? "rotate-45 fill-current" : ""} />
              </button>
              <button
                onClick={restoreLibrary}
                data-no-drag
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Restore Full Library"
              >
                <Maximize2 size={11} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); closeWindow(); }}
                data-no-drag
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {/* Middle Row: Scrubber Timeline */}
          <div className="flex items-center gap-2 text-[9.5px] font-mono text-white/45" data-no-drag>
            <span className="w-6 text-right tabular-nums">{formatTime(currentTime)}</span>
            <div
              onClick={handleSeek}
              data-no-drag
              className="flex-1 h-3 flex items-center cursor-pointer group/scrub relative py-1"
            >
              <div className="w-full h-1 group-hover/scrub:h-1.5 bg-white/[0.12] rounded-full overflow-hidden relative transition-all duration-200">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPercent}%`,
                    background:
                      "linear-gradient(90deg, var(--primary, #0066a4) 0%, color-mix(in srgb, var(--primary, #0066a4) 80%, #fff) 100%)",
                    boxShadow: "0 0 8px var(--primary, #0066a4)",
                  }}
                />
              </div>
              {/* Glowing scrubber thumb indicator on hover */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover/scrub:opacity-100 transition-opacity pointer-events-none"
                style={{
                  left: `${progressPercent}%`,
                  boxShadow: "0 0 6px rgba(255, 255, 255, 0.8)",
                }}
              />
            </div>
            <span className="w-6 text-left tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* Bottom Row: Playback Controls & Volume Slider */}
          <div className="flex items-center justify-between" data-no-drag>
            {/* Playback buttons */}
            <div className="flex items-center gap-1" data-no-drag>
              <button
                onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                data-no-drag
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{
                  color: shuffle ? "var(--primary, #0066a4)" : "rgba(255,255,255,0.4)",
                  background: shuffle
                    ? "color-mix(in oklab, var(--primary, #0066a4) 18%, transparent)"
                    : "transparent",
                }}
                title={shuffle ? "Shuffle: ON" : "Shuffle: OFF"}
              >
                <IconsaxShuffle size={12} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                data-no-drag
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/75 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Previous Track"
              >
                <IconsaxPrevious size={13} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                data-no-drag
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-108 active:scale-95 shadow-lg mx-0.5 cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary, #0066a4) 0%, color-mix(in oklab, var(--primary, #0066a4) 80%, black) 100%)",
                  color: "var(--theme-color-primary-content, #fff)",
                  boxShadow:
                    "0 3px 14px color-mix(in srgb, var(--primary, #0066a4) 65%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <IconsaxPause size={14} /> : <IconsaxPlay size={14} className="ml-0.5" />}
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                data-no-drag
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/75 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Next Track"
              >
                <IconsaxNext size={13} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); cycleRepeat(); }}
                data-no-drag
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{
                  color: repeat !== "off" ? "var(--primary, #0066a4)" : "rgba(255,255,255,0.4)",
                  background:
                    repeat !== "off"
                      ? "color-mix(in oklab, var(--primary, #0066a4) 18%, transparent)"
                      : "transparent",
                }}
                title={
                  repeat === "one"
                    ? "Repeat: Current Track"
                    : repeat === "all"
                    ? "Repeat: All Queue"
                    : "Repeat: OFF"
                }
              >
                {repeat === "one" ? <IconsaxRepeatOne size={12} /> : <IconsaxRepeat size={12} />}
              </button>
            </div>

            {/* Sleek Custom Volume Slider */}
            <div className="flex items-center gap-1.5 pl-2" data-no-drag>
              <button
                onClick={(e) => { e.stopPropagation(); setVolume(volume > 0 ? 0 : 0.85); }}
                data-no-drag
                className="text-white/45 hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1 rounded-md hover:bg-white/10"
                title={volume === 0 ? "Unmute" : `Volume: ${Math.round(volume * 100)}%`}
              >
                {volume === 0 ? (
                  <IconsaxVolumeCross size={13} />
                ) : volume < 0.45 ? (
                  <IconsaxVolumeLow size={13} />
                ) : (
                  <IconsaxVolumeHigh size={13} />
                )}
              </button>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const val = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setVolume(Math.round(val * 100) / 100);
                }}
                data-no-drag
                className="w-16 h-3 flex items-center cursor-pointer group/vol relative py-1"
                title={`Volume: ${Math.round(volume * 100)}%`}
              >
                <div className="w-full h-1 group-hover/vol:h-1.5 bg-white/[0.12] rounded-full overflow-hidden relative transition-all duration-200 pointer-events-none">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${volume * 100}%`,
                      background: "var(--primary, #0066a4)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
