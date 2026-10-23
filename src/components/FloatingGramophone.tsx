import React, { useState, useRef, useCallback } from "react";
import {
  Pin,
  X,
  Minus,
  Plus,
  Zap,
  ListMusic,
  Mic2,
  Sparkles,
  Activity,
} from "lucide-react";
import {
  IconsaxPlay,
  IconsaxPause,
  IconsaxNext,
  IconsaxPrevious,
  IconsaxCd,
  IconsaxCategory,
  IconsaxShuffle,
  IconsaxRepeat,
  IconsaxRepeatOne,
  IconsaxVolumeHigh,
  IconsaxVolumeLow,
  IconsaxVolumeCross,
} from "./Iconsax";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore, selectCurrentTrack } from "../stores/playerStore";
import { startWindowDragging, setAlwaysOnTop, closeWindow, resizeWindow } from "../utils/window";
import { formatTime } from "../utils/format";
import { findActiveLyricIndex } from "../utils/lyrics";
import { LiquidWaveVisualizer } from "./LiquidWaveVisualizer";
import { useVisualizerFrame } from "../hooks/useVisualizerFrame";

export function FloatingGramophone() {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const setRepeat = usePlayerStore((s) => s.setRepeat);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const shuffleQueue = usePlayerStore((s) => s.shuffleQueue);
  const showQueueDrawer = usePlayerStore((s) => s.showQueueDrawer);
  const toggleQueueDrawer = usePlayerStore((s) => s.toggleQueueDrawer);
  const settings = usePlayerStore((s) => s.settings);
  const updateSettings = usePlayerStore((s) => s.updateSettings);

  const setPlayerMode = usePlayerStore((s) => s.setPlayerMode);
  const playerStyle = usePlayerStore((s) => s.playerStyle);
  const setPlayerStyle = usePlayerStore((s) => s.setPlayerStyle);
  const alwaysOnTop = usePlayerStore((s) => s.alwaysOnTop);
  const toggleAlwaysOnTop = usePlayerStore((s) => s.toggleAlwaysOnTop);
  const coverCache = usePlayerStore((s) => s.coverCache);
  const gramophoneScale = usePlayerStore((s) => s.gramophoneScale);
  const setGramophoneScale = usePlayerStore((s) => s.setGramophoneScale);
  const currentLyrics = usePlayerStore((s) => s.currentLyrics);

  const visualizerEnabled = settings.vinylVisualizerEnabled ?? true;
  const beatPulseEnabled = settings.vinylBeatPulseEnabled ?? true;
  const isAudioFrameActive = visualizerEnabled || beatPulseEnabled;
  const visualizerFrame = useVisualizerFrame(isPlaying, isAudioFrameActive);
  const beatPulse = visualizerFrame.beatPulse || 0;
  const gramophonePulseScale =
    isPlaying && beatPulseEnabled
      ? 1 + beatPulse * 0.125
      : 1;

  const [isHovering, setIsHovering] = useState(false);
  const [isCenterHovering, setIsCenterHovering] = useState(false);
  const [hoveredSide, setHoveredSide] = useState<"prev" | "next" | null>(null);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [showTimeTooltip, setShowTimeTooltip] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showLyricPill, setShowLyricPill] = useState(true);

  const scrubberRef = useRef<HTMLDivElement | null>(null);

  const activeLyricIndex =
    currentLyrics && currentLyrics.synced
      ? findActiveLyricIndex(currentLyrics.lines, currentTime)
      : -1;
  const currentLyricLine =
    currentLyrics && activeLyricIndex >= 0
      ? currentLyrics.lines[activeLyricIndex]
      : null;

  const cover = currentTrack ? coverCache[currentTrack.path] : null;
  const coverKey = currentTrack?.path ?? "chavosh-placeholder";

  const activeList = shuffle && shuffleQueue ? shuffleQueue : queue;
  const upcomingCount = Math.max(0, activeList.length - (queueIndex + 1));
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const cycleRepeat = () => {
    const order = ["off", "all", "one"] as const;
    const idx = order.indexOf(repeat);
    setRepeat(order[(idx + 1) % order.length]);
  };

  const handlePin = async () => {
    const nextVal = !alwaysOnTop;
    toggleAlwaysOnTop();
    await setAlwaysOnTop(nextVal);
  };

  const stepScale = (delta: number) => {
    const nextScale = Math.round((gramophoneScale + delta) * 100) / 100;
    const clamped = Math.max(0.65, Math.min(1.35, nextScale));
    setGramophoneScale(clamped);
    const newSize = Math.round(360 * clamped);
    resizeWindow(newSize, newSize);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.button === 0 &&
      !(e.target as HTMLElement).closest(
        "button, a, input, select, textarea, [data-no-drag], .cursor-pointer, [role='slider'], [role='button'], .scrubber-ring"
      )
    ) {
      startWindowDragging();
    }
  };

  // ── Circular Progress Scrubber Math ──
  const RADIUS = 46;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - (progressPercent / 100) * CIRCUMFERENCE;

  // Compute Scrubber Thumb Coordinates (angle starts at top 12 o'clock = -90deg)
  const angleRad = -Math.PI / 2 + (progressPercent / 100) * 2 * Math.PI;
  const thumbX = 50 + RADIUS * Math.cos(angleRad);
  const thumbY = 50 + RADIUS * Math.sin(angleRad);

  const scrubAtCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!scrubberRef.current || duration <= 0) return;
      const rect = scrubberRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += 2 * Math.PI;
      const pct = Math.max(0, Math.min(1, angle / (2 * Math.PI)));
      seek(pct * duration);
    },
    [duration, seek]
  );

  const handlePointerDown = (e: React.PointerEvent<Element>) => {
    e.stopPropagation();
    setIsDraggingScrubber(true);
    scrubAtCoordinates(e.clientX, e.clientY);
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<Element>) => {
    if (isDraggingScrubber) {
      e.stopPropagation();
      scrubAtCoordinates(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<Element>) => {
    if (isDraggingScrubber) {
      e.stopPropagation();
      setIsDraggingScrubber(false);
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <div
      dir="ltr"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setIsCenterHovering(false);
        setHoveredSide(null);
        setIsDraggingScrubber(false);
      }}
      className="w-full h-full flex flex-col items-center justify-center select-none relative group p-2 overflow-hidden"
      style={
        {
          background: "transparent",
          "--gramophone-scale": gramophoneScale,
        } as React.CSSProperties
      }
    >
      {/* Floating Top Controls Pill (Hover) - with Shuffle, Remix, Queue & Settings */}
      <div
        className="absolute top-2 left-0 right-0 mx-auto w-fit z-40 flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-xl border border-white/15 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl max-w-[calc(100%-20px)]"
        style={{
          transform: "scale(clamp(0.68, min(100vw, 100vh) / 365, 1))",
          transformOrigin: "top center",
        }}
      >
        {/* Shuffle Button */}
        <button
          onClick={toggleShuffle}
          className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer shrink-0"
          style={{
            color: shuffle ? "var(--primary, var(--theme-color-primary, #0066a4))" : "rgba(255, 255, 255, 0.7)",
          }}
          title={shuffle ? "Smart Shuffle: ON" : "Smart Shuffle: OFF"}
        >
          <IconsaxShuffle size={12} />
        </button>

        {/* Repeat Button */}
        <button
          onClick={cycleRepeat}
          className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer relative shrink-0"
          style={{
            color: repeat !== "off" ? "var(--primary, var(--theme-color-primary, #0066a4))" : "rgba(255, 255, 255, 0.7)",
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

        {/* Volume Control Button & Popover Slider */}
        <div
          className="relative flex items-center shrink-0"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
          onWheel={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? 0.05 : -0.05;
            setVolume(Math.max(0, Math.min(1, volume + delta)));
          }}
        >
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
            className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
            style={{
              color: volume === 0 ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.85)",
            }}
            title={volume === 0 ? "Unmute" : `Volume: ${Math.round(volume * 100)}%`}
          >
            {volume === 0 ? (
              <IconsaxVolumeCross size={12} />
            ) : volume < 0.45 ? (
              <IconsaxVolumeLow size={12} />
            ) : (
              <IconsaxVolumeHigh size={12} />
            )}
          </button>

          {showVolumeSlider && (
            <div
              className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/95 backdrop-blur-xl border border-white/20 flex items-center gap-1.5 shadow-2xl animate-fadeIn z-50 pointer-events-auto"
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-16 h-1 cursor-pointer accent-[var(--primary,var(--theme-color-primary,#0066a4))] rounded-full"
              />
              <span className="text-[9px] font-mono font-bold text-white tabular-nums w-5 text-center">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Remix Mode Button */}
        <button
          onClick={() => updateSettings({ remixEnabled: !settings.remixEnabled })}
          className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-0.5 shrink-0"
          style={{
            color: settings.remixEnabled ? "#f59e0b" : "rgba(255, 255, 255, 0.7)",
          }}
          title={settings.remixEnabled ? "Remix Engine: ON" : "Enable Remix Engine"}
        >
          <Zap size={11} className={settings.remixEnabled ? "fill-current" : ""} />
        </button>

        {/* Play Queue / Playlist Button */}
        <button
          onClick={toggleQueueDrawer}
          className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          style={{
            color: showQueueDrawer ? "var(--primary, var(--theme-color-primary, #0066a4))" : "rgba(255, 255, 255, 0.7)",
          }}
          title="Toggle Play Queue"
        >
          <ListMusic size={12} />
          {upcomingCount > 0 && (
            <span
              className="text-[8px] font-mono px-1 rounded-full font-bold"
              style={{
                background: "var(--primary, var(--theme-color-primary, #0066a4))",
                color: "var(--theme-color-primary-content, #fff)",
              }}
            >
              {upcomingCount}
            </span>
          )}
        </button>

        {/* Live Lyrics Pill Toggle */}
        <button
          onClick={() => setShowLyricPill(!showLyricPill)}
          className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          style={{
            color: showLyricPill
              ? "var(--primary, var(--theme-color-primary, #0066a4))"
              : "rgba(255, 255, 255, 0.65)",
            background: showLyricPill
              ? "color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 22%, transparent)"
              : "transparent",
          }}
          title={showLyricPill ? "Hide Live Lyrics" : "Show Live Lyrics"}
        >
          <Mic2 size={11} />
        </button>

        {/* Audio Visualizer Ring Toggle */}
        <button
          onClick={() =>
            updateSettings({
              vinylVisualizerEnabled: !visualizerEnabled,
            })
          }
          className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          style={{
            color: visualizerEnabled
              ? "var(--primary, var(--theme-color-primary, #0066a4))"
              : "rgba(255, 255, 255, 0.5)",
            background: visualizerEnabled
              ? "color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 22%, transparent)"
              : "transparent",
          }}
          title={
            visualizerEnabled
              ? "اکولایزر دیسک: روشن (کلیک برای خاموش کردن) / Visualizer: ON"
              : "اکولایزر دیسک: خاموش (کلیک برای روشن کردن) / Visualizer: OFF"
          }
        >
          <Sparkles size={11} />
        </button>

        {/* Beat Pulse Effect Toggle */}
        <button
          onClick={() =>
            updateSettings({
              vinylBeatPulseEnabled: !beatPulseEnabled,
            })
          }
          className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          style={{
            color: beatPulseEnabled
              ? "var(--primary, var(--theme-color-primary, #0066a4))"
              : "rgba(255, 255, 255, 0.5)",
            background: beatPulseEnabled
              ? "color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 22%, transparent)"
              : "transparent",
          }}
          title={
            beatPulseEnabled
              ? "افکت ضرب‌آهنگ دیسک: روشن (کلیک برای خاموش کردن) / Beat Pulse: ON"
              : "افکت ضرب‌آهنگ دیسک: خاموش (کلیک برای روشن کردن) / Beat Pulse: OFF"
          }
        >
          <Activity size={11} />
        </button>

        <div className="w-px h-3 bg-white/20 shrink-0" />

        {/* Disc size manual control */}
        <div className="flex items-center gap-0.5 shrink-0 px-1 py-0.5 rounded-full bg-white/5 border border-white/10" title="Gramophone Disc Scale">
          <button
            onClick={() => stepScale(-0.05)}
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <Minus size={9} />
          </button>
          <span className="w-6 text-center text-[8.5px] font-bold font-mono text-white/85 tabular-nums">
            {Math.round(gramophoneScale * 100)}%
          </span>
          <button
            onClick={() => stepScale(0.05)}
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <Plus size={9} />
          </button>
        </div>

        <div className="w-px h-3 bg-white/20 shrink-0" />

        {/* Pin Always on Top */}
        <button
          onClick={handlePin}
          className="w-4.5 h-4.5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer shrink-0"
          style={{ color: alwaysOnTop ? "var(--primary, var(--theme-color-primary, #0066a4))" : "white" }}
          title={alwaysOnTop ? "Unpin Window" : "Pin Always on Top"}
        >
          <Pin size={10} className={alwaysOnTop ? "rotate-45" : ""} />
        </button>

        {/* Return to Library */}
        <button
          onClick={() => setPlayerMode("library")}
          className="w-4.5 h-4.5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white cursor-pointer shrink-0"
          title="Return to Library Window"
        >
          <IconsaxCategory size={10} />
        </button>

        {/* Close Window */}
        <button
          onClick={() => closeWindow()}
          className="w-4.5 h-4.5 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors text-white cursor-pointer shrink-0"
          title="Close"
        >
          <X size={10} />
        </button>
      </div>

      {/* STATIC disc wrapper — with smooth beat pulse effect */}
      <div
        className="relative flex items-center justify-center disc-shadow rounded-full disc-stage overflow-visible transform-gpu"
        style={{
          transform: `scale(${gramophonePulseScale})`,
        }}
      >
        {/* Dynamic Ambient Halo & Responsive Liquid Wave Ring (Toggled via settings.vinylVisualizerEnabled) */}
        {visualizerEnabled && (
          <>
            <div
              className="absolute rounded-full pointer-events-none transition-all duration-200 ease-out"
              style={{
                width: "128%",
                height: "128%",
                top: "-14%",
                left: "-14%",
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--primary, #00d2ff) 50%, transparent) 0%, color-mix(in srgb, var(--primary, #00d2ff) 18%, transparent) 55%, transparent 75%)",
                filter: `blur(${16 + beatPulse * 16}px)`,
                opacity: isPlaying ? 0.68 + beatPulse * 0.32 : 0.22,
                zIndex: 0,
              }}
            />
            <div
              className="absolute pointer-events-none overflow-visible"
              style={{
                width: "140%",
                height: "140%",
                top: "-20%",
                left: "-20%",
                zIndex: 15,
              }}
            >
              <LiquidWaveVisualizer
                frame={visualizerFrame}
                isPlaying={isPlaying}
                responsive
              />
            </div>
          </>
        )}

        {/* ── ROTATING DISC GROOVES (Spins when playing) ── */}
        <div
          className={`w-full h-full rounded-full absolute inset-0 overflow-hidden ${
            playerStyle === "cd" ? "cd-disc-surface" : "vinyl-grooves"
          } ${isPlaying ? "spinning" : "spinning spinning-paused"}`}
        >
          {/* CD Transparent Clamping Ring */}
          {playerStyle === "cd" && (
            <div className="absolute inset-[24%] rounded-full cd-acrylic-hub pointer-events-none" />
          )}
        </div>

        {/* ── ROTATING WHITE SPECULAR HIGHLIGHT SHEEN (Smoothly rotates as requested) ── */}
        <div
          className={`absolute inset-0 rounded-full pointer-events-none overflow-hidden z-10 ${
            playerStyle === "cd" ? "cd-sheen" : "vinyl-sheen"
          } vinyl-sheen-rotating ${isPlaying ? "" : "paused"}`}
        />

        {/* ── CIRCULAR PROGRESS RING (Interactive scrubber surrounding inner cover ring) ── */}
        <div
          ref={scrubberRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="scrubber-ring absolute rounded-full flex items-center justify-center pointer-events-none touch-none"
          style={{
            width: "48%",
            aspectRatio: "1 / 1",
            zIndex: 25,
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible pointer-events-none">
            {/* Background Track Circle (Interactive hit area) */}
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="6"
              fill="none"
              className="pointer-events-auto cursor-pointer"
              onPointerDown={handlePointerDown}
              onMouseEnter={() => setShowTimeTooltip(true)}
              onMouseLeave={() => setShowTimeTooltip(false)}
            />
            {/* Active Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              stroke="var(--primary, var(--theme-color-primary, #0066a4))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
              fill="none"
              className="pointer-events-auto cursor-pointer"
              onPointerDown={handlePointerDown}
              onMouseEnter={() => setShowTimeTooltip(true)}
              onMouseLeave={() => setShowTimeTooltip(false)}
              style={{
                filter: "drop-shadow(0 0 6px var(--primary, var(--theme-color-primary, #0066a4)))",
                transition: isDraggingScrubber ? "none" : "stroke-dashoffset 0.12s linear",
              }}
            />
            {/* Glowing Scrubber Thumb Point */}
            {duration > 0 && (
              <circle
                cx={thumbX}
                cy={thumbY}
                r={isDraggingScrubber ? "6" : "4.5"}
                fill="#ffffff"
                stroke="var(--primary, var(--theme-color-primary, #0066a4))"
                strokeWidth="2.5"
                className="pointer-events-auto cursor-grab active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onMouseEnter={() => setShowTimeTooltip(true)}
                onMouseLeave={() => setShowTimeTooltip(false)}
                style={{
                  filter: "drop-shadow(0 0 8px #ffffff)",
                  transition: isDraggingScrubber ? "none" : "all 0.12s linear",
                }}
              />
            )}
          </svg>
        </div>

        {/* Time Badge (Hover/Drag Feedback) */}
        {(showTimeTooltip || isDraggingScrubber) && (
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 backdrop-blur-md border border-white/20 text-[10px] font-mono text-white font-bold whitespace-nowrap shadow-xl animate-fadeIn"
            style={{ zIndex: 50 }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        )}

        {/* ── STATIC CENTER LABEL & COVER (Does NOT rotate!) ── */}
        <div
          className="absolute rounded-full overflow-hidden flex items-center justify-center text-center border border-white/10 select-none pointer-events-none"
          style={{
            width: "42.5%",
            aspectRatio: "1 / 1",
            zIndex: 20,
            background:
              playerStyle === "cd"
                ? "radial-gradient(circle, #252530 0%, #111116 100%)"
                : "var(--primary, var(--theme-color-primary, #0066a4))",
            boxShadow:
              "0 0 0 5px #0d0d12, 0 0 0 7px rgba(255, 255, 255, 0.1), inset 0 0 25px rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* Crossfading album artwork */}
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={coverKey}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              {cover ? (
                <img src={cover} alt="" className="w-full h-full object-cover opacity-90" />
              ) : (
                <div className="w-full h-full flex items-center justify-center vinyl-grooves">
                  <IconsaxCd size={26} className="text-white/70" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Constant scrim for text legibility */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] pointer-events-none" />

          {/* Title, Artist & Live Status pinned to the lower part of the label */}
          <div className="absolute inset-x-0 bottom-2 px-2 pointer-events-none z-10 flex flex-col items-center">
            <div className="text-[11px] font-black truncate max-w-[85%] text-white leading-tight drop-shadow-md">
              {currentTrack?.title ?? "Chavosh"}
            </div>
            <div className="text-[9px] truncate max-w-[80%] text-white/80 mt-0.5 font-medium">
              {currentTrack?.artist ?? "Music Player"}
            </div>
            {/* Live Playing State & Time */}
            <div className="flex items-center gap-1.5 mt-1">
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 rounded-full bg-[var(--primary,var(--theme-color-primary,#0066a4))] eq-bar-1" />
                  <span className="w-0.5 rounded-full bg-[var(--primary,var(--theme-color-primary,#0066a4))] eq-bar-2" />
                  <span className="w-0.5 rounded-full bg-[var(--primary,var(--theme-color-primary,#0066a4))] eq-bar-3" />
                  <span className="w-0.5 rounded-full bg-[var(--primary,var(--theme-color-primary,#0066a4))] eq-bar-4" />
                </div>
              ) : (
                <span className="text-[8px] font-mono text-white/50 font-bold tracking-wider">PAUSED</span>
              )}
              <span className="text-[8.5px] font-mono text-white/90 font-bold">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>

          {/* Center Spindle Hole */}
          <div className="w-4 h-4 rounded-full bg-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-inner border border-white/20 z-10" />
        </div>

        {/* ── Playback controls overlay (dead center of the disc, revealed ONLY on hovering inner circle) ── */}
        <div
          onMouseEnter={() => setIsCenterHovering(true)}
          onMouseLeave={() => {
            setIsCenterHovering(false);
            setHoveredSide(null);
          }}
          className={`absolute rounded-full flex items-center justify-center gap-2 transition-all duration-300 pointer-events-auto ${
            isCenterHovering
              ? "opacity-100 bg-black/60 backdrop-blur-[3px]"
              : "opacity-0"
          }`}
          style={{
            width: "42.5%",
            aspectRatio: "1 / 1",
            zIndex: 40,
          }}
        >
          {/* Previous Track Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            onMouseEnter={() => setHoveredSide("prev")}
            onMouseLeave={() => setHoveredSide(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/20 hover:scale-110 active:scale-90 cursor-pointer pointer-events-auto"
            style={{
              color: hoveredSide === "prev" ? "var(--primary, var(--theme-color-primary, #0066a4))" : "rgba(255,255,255,0.9)",
            }}
            title="Previous Track"
          >
            <IconsaxPrevious size={16} />
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xl cursor-pointer pointer-events-auto"
            style={{
              background: "var(--primary, var(--theme-color-primary, #0066a4))",
              color: "var(--theme-color-primary-content, #fff)",
              boxShadow: "0 4px 14px color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 55%, transparent)",
            }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <IconsaxPause size={18} /> : <IconsaxPlay size={18} className="ml-0.5" />}
          </button>

          {/* Next Track Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            onMouseEnter={() => setHoveredSide("next")}
            onMouseLeave={() => setHoveredSide(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/20 hover:scale-110 active:scale-90 cursor-pointer pointer-events-auto"
            style={{
              color: hoveredSide === "next" ? "var(--primary, var(--theme-color-primary, #0066a4))" : "rgba(255,255,255,0.9)",
            }}
            title="Next Track"
          >
            <IconsaxNext size={16} />
          </button>
        </div>

        {/* ── REALISTIC MECHANICAL TONEARM (Vinyl only, stays neatly framed inside disc) ── */}
        {playerStyle === "vinyl" && (
          <div
            className="absolute top-2 right-3 pointer-events-none z-30 transition-transform duration-300"
            style={{
              transform: "scale(clamp(0.65, min(100vw, 100vh) / 360, 1.25))",
              transformOrigin: "top right",
            }}
          >
            {/* Pivot Base */}
            <div
              className="w-11 h-11 rounded-full relative shadow-xl border border-white/10"
              style={{
                background: "radial-gradient(circle, #555562 0%, #15151e 100%)",
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#0e0e14] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/10" />
            </div>

            {/* Arm Tube: playing rests on music groove (-12deg), paused rests tucked safely within boundary (-32deg) */}
            <div
              className="absolute top-5.5 right-5.5 origin-[100%_50%] transition-transform duration-700 ease-out"
              style={{
                width: "122px",
                height: "4px",
                transform: `rotate(${isPlaying ? "-12deg" : "-32deg"})`,
              }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: "linear-gradient(to bottom, #dcdde1 0%, #718093 50%, #2f3640 100%)",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.6)",
                }}
              />
              {/* Headshell & Cartridge with Primary Accent Border */}
              <div
                className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-5 h-3.5 rounded-sm border-l-2"
                style={{
                  background: "linear-gradient(135deg, #2d3436 0%, #636e72 100%)",
                  borderColor: "var(--primary, var(--theme-color-primary, #0066a4))",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING LIVE LYRIC SUBTITLE PILL (Underneath the turntable, perfectly centered with smooth motion) ── */}
      {showLyricPill && currentLyricLine && (
        <div
          className="absolute bottom-2.5 left-0 right-0 mx-auto w-fit px-3.5 py-1 rounded-full flex items-center justify-center shadow-xl pointer-events-none z-50 animate-fadeIn border border-white/20 max-w-[calc(100%-24px)] overflow-hidden"
          style={{
            background: "rgba(10, 11, 16, 0.94)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 18px -2px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.08)",
            transform: "scale(clamp(0.72, min(100vw, 100vh) / 360, 1))",
            transformOrigin: "bottom center",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`${currentLyricLine.id}-${currentLyricLine.text}`}
              initial={{ opacity: 0, y: 7, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -7, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="text-[11px] font-black text-white truncate max-w-[240px] drop-shadow-sm text-center block"
              dir="auto"
            >
              {currentLyricLine.text}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
