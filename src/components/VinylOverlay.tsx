import { useState } from "react";
import {
  X,
  Disc3,
  Disc,
  Mic2,
  ListMusic,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Minus,
  Square,
  Activity,
} from "lucide-react";
import {
  IconsaxPlay,
  IconsaxPause,
  IconsaxNext,
  IconsaxPrevious,
  IconsaxShuffle,
  IconsaxRepeat,
  IconsaxRepeatOne,
  IconsaxCd,
} from "./Iconsax";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore, selectCurrentTrack } from "../stores/playerStore";
import { formatTime } from "../utils/format";
import { LyricsView } from "./LyricsView";
import { CoverEditModal } from "./CoverEditModal";
import { LiquidWaveVisualizer } from "./LiquidWaveVisualizer";
import { useVisualizerFrame } from "../hooks/useVisualizerFrame";
import {
  startWindowDragging,
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow,
} from "../utils/window";

export function VinylOverlay() {
  const [vinylTab, setVinylTab] = useState<"overview" | "lyrics">("overview");
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [isHoveringTurntable, setIsHoveringTurntable] = useState(false);

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
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const shuffleQueue = usePlayerStore((s) => s.shuffleQueue);
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);
  const playerStyle = usePlayerStore((s) => s.playerStyle);
  const setPlayerStyle = usePlayerStore((s) => s.setPlayerStyle);
  const setShowNowPlayingOverlay = usePlayerStore((s) => s.setShowNowPlayingOverlay);
  const coverCache = usePlayerStore((s) => s.coverCache);
  const settings = usePlayerStore((s) => s.settings);
  const updateSettings = usePlayerStore((s) => s.updateSettings);
  const setShowSettings = usePlayerStore((s) => s.setShowSettings);

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

  const visualizerEnabled = settings.vinylVisualizerEnabled ?? true;
  const beatPulseEnabled = settings.vinylBeatPulseEnabled ?? true;
  const cover = currentTrack ? coverCache[currentTrack.path] : null;
  const activeList = shuffle && shuffleQueue ? shuffleQueue : queue;

  // Pure kick transient pulse: rests firmly at 1.00, punches to ~1.125 on drum kicks
  const isAudioFrameActive = visualizerEnabled || beatPulseEnabled;
  const visualizerFrame = useVisualizerFrame(isPlaying, isAudioFrameActive);
  const { bass, mid, treble, bars } = visualizerFrame;
  const beatPulse = visualizerFrame.beatPulse || 0;
  const discPulseScale =
    isPlaying && beatPulseEnabled
      ? 1 + beatPulse * 0.125
      : 1;

  const cycleRepeat = () => {
    const order = ["off", "all", "one"] as const;
    const idx = order.indexOf(repeat);
    setRepeat(order[(idx + 1) % order.length]);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const upcomingTracks = activeList.slice(queueIndex + 1, queueIndex + 6);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col select-none animate-fadeIn overflow-hidden"
      style={{
        background: "var(--theme-color-base)",
      }}
    >
      {/* Immersive Audio-Reactive Aurora & Deeply-Blurred Dynamic Cover Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        {cover ? (
          <div
            className="absolute -inset-20 bg-cover bg-center transition-all duration-700 ease-out transform-gpu filter blur-[52px]"
            style={{
              backgroundImage: `url(${cover})`,
              transform: `scale(${1.15 + (isPlaying ? bass * 0.08 : 0)})`,
              opacity: 0.72 + (isPlaying ? bass * 0.16 : 0),
            }}
          />
        ) : (
          /* Vibrant Dynamic Theme Aurora Mesh when no cover */
          <div
            className="absolute -inset-20 transition-all duration-700 ease-out transform-gpu filter blur-[70px] opacity-65"
            style={{
              background:
                "radial-gradient(circle at 25% 25%, var(--primary, #0066a4) 0%, transparent 55%), radial-gradient(circle at 75% 75%, var(--theme-color-accent, #fe28a2) 0%, transparent 55%), radial-gradient(circle at 50% 50%, var(--theme-color-warn, #ffba00) 0%, transparent 45%)",
              transform: `scale(${1.1 + (isPlaying ? bass * 0.1 : 0)})`,
            }}
          />
        )}

        {/* Dynamic Reactive Color Glow Orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full filter blur-[100px] opacity-30 transition-transform duration-300"
          style={{
            background: "var(--primary, #0066a4)",
            transform: `scale(${1 + (isPlaying ? bass * 0.25 : 0)}) translate(${mid * 20}px, ${bass * -20}px)`,
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[480px] h-[480px] rounded-full filter blur-[95px] opacity-25 transition-transform duration-300"
          style={{
            background: "var(--theme-color-accent, #fe28a2)",
            transform: `scale(${1 + (isPlaying ? mid * 0.25 : 0)})`,
          }}
        />

        {/* Theme-Adaptive Frosted Overlay: Crisp Frosted White in Light Themes, Deep Obsidian in Dark Themes */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--theme-color-base) 42%, transparent) 0%, color-mix(in srgb, var(--theme-color-base) 84%, transparent) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        />
      </div>

      {/* Seamless Top Window Bar (Full Width, Unified Frosted Header) */}
      <div
        onMouseDown={handleMouseDown}
        className="h-14 flex items-center justify-between px-5 border-b border-base-content/10 shrink-0 relative z-10 transition-colors select-none"
        style={{
          background: "color-mix(in srgb, var(--theme-color-base) 18%, transparent)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      >
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-[var(--radius-button)] relative overflow-hidden flex items-center justify-center shadow-md border border-base-content/10 bg-base-content/[0.06]">
            <img
              src="/logo.png"
              alt="Chavosh Logo"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div className="hidden sm:flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black tracking-widest uppercase text-base-content">CHAVOSH</span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-md bg-[var(--primary,#0066a4)]/20 text-[var(--primary,#0066a4)]">VINYL</span>
            </div>
            <span className="text-[10px] text-neutral font-medium">Turntable Room</span>
          </div>
        </div>

        {/* Center: Style switcher, Views, Fix Cover & Visualizer Toggle */}
        <div className="flex items-center gap-2">
          {/* Style switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-base-content/[0.05] border border-base-content/10">
            <button
              onClick={() => setPlayerStyle("vinyl")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: playerStyle === "vinyl" ? "var(--primary)" : "transparent",
                color: playerStyle === "vinyl" ? "var(--theme-color-primary-content, #fff)" : "var(--ink-dim)",
              }}
            >
              <Disc size={13} />
              <span>Vinyl</span>
            </button>
            <button
              onClick={() => setPlayerStyle("cd")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: playerStyle === "cd" ? "var(--primary)" : "transparent",
                color: playerStyle === "cd" ? "var(--theme-color-primary-content, #fff)" : "var(--ink-dim)",
              }}
            >
              <Disc3 size={13} />
              <span>CD</span>
            </button>
          </div>

          {/* View Tab Switcher: Overview vs Lyrics */}
          <div className="flex items-center p-0.5 rounded-xl bg-base-content/[0.05] border border-base-content/10">
            <button
              onClick={() => setVinylTab("overview")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: vinylTab === "overview" ? "var(--primary)" : "transparent",
                color: vinylTab === "overview" ? "var(--theme-color-primary-content, #fff)" : "var(--ink-dim)",
              }}
            >
              <ListMusic size={13} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setVinylTab("lyrics")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: vinylTab === "lyrics" ? "var(--primary)" : "transparent",
                color: vinylTab === "lyrics" ? "var(--theme-color-primary-content, #fff)" : "var(--ink-dim)",
              }}
            >
              <Mic2 size={13} />
              <span>Lyrics</span>
            </button>
          </div>

          {/* Fix / Replace Cover Button */}
          {currentTrack && (
            <button
              onClick={() => setShowCoverModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-content/[0.05] hover:bg-base-content/[0.1] text-base-content transition-all cursor-pointer border border-base-content/10"
              title="Fix or Replace Album Artwork"
            >
              <ImageIcon size={13} className="text-[var(--primary,#0066a4)]" />
              <span className="hidden md:inline">Fix Cover</span>
            </button>
          )}

          {/* Visualizer Ring Toggle Button */}
          <button
            onClick={() =>
              updateSettings({
                vinylVisualizerEnabled: !visualizerEnabled,
              })
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-content/[0.05] hover:bg-base-content/[0.1] text-base-content transition-all cursor-pointer border border-base-content/10"
            style={{
              color: visualizerEnabled ? "var(--primary, #00d2ff)" : "var(--ink-dim)",
            }}
            title="Toggle Vinyl Audio Visualizer Ring (فعال یا غیرفعال کردن اکولایزر وینیل)"
          >
            <Sparkles size={13} />
            <span>{visualizerEnabled ? "Visualizer: ON" : "Visualizer: OFF"}</span>
          </button>

          {/* Beat Pulse Effect Toggle Button */}
          <button
            onClick={() =>
              updateSettings({
                vinylBeatPulseEnabled: !beatPulseEnabled,
              })
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-base-content/[0.05] hover:bg-base-content/[0.1] text-base-content transition-all cursor-pointer border border-base-content/10"
            style={{
              color: beatPulseEnabled ? "var(--primary, #00d2ff)" : "var(--ink-dim)",
            }}
            title="افکت ضرب‌آهنگ دیسک وینیل (Beat Pulse on Vinyl Disc)"
          >
            <Activity size={13} />
            <span>{beatPulseEnabled ? "Beat Pulse: ON" : "Beat Pulse: OFF"}</span>
          </button>
        </div>

        {/* Right: Exit Room + Settings + Window Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Exit Room Button */}
          <button
            onClick={() => setShowNowPlayingOverlay(false)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-base-content bg-base-content/[0.08] hover:bg-base-content/[0.15] border border-base-content/10 transition-colors cursor-pointer shadow-sm mr-1"
            title="Exit Vinyl Room (Esc / Back to Library)"
          >
            <X size={14} />
            <span>Exit Room</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            title="Sarv UI Themes & Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-base-content/65 hover:text-base-content hover:bg-base-content/[0.08]"
          >
            <Palette size={14} />
          </button>

          <div className="w-px h-5 bg-base-content/10 mx-0.5" />

          <button
            type="button"
            onClick={() => minimizeWindow()}
            title="Minimize"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-base-content/65 hover:text-base-content hover:bg-base-content/[0.08]"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={() => toggleMaximizeWindow()}
            title="Maximize / Restore"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-base-content/65 hover:text-base-content hover:bg-base-content/[0.08]"
          >
            <Square size={11} />
          </button>
          <button
            type="button"
            onClick={() => closeWindow()}
            title="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/80 hover:text-white transition-colors cursor-pointer text-base-content/65"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main split view */}
      <div className="flex-1 flex items-center justify-center p-8 gap-14 max-w-6xl mx-auto w-full relative z-10 overflow-visible">
        {/* Left: Giant Realistic Turntable / CD with YouTube-Style Turbulent Liquid Wave Ring */}
        <div
          onMouseEnter={() => setIsHoveringTurntable(true)}
          onMouseLeave={() => setIsHoveringTurntable(false)}
          className="w-[430px] h-[430px] relative shrink-0 flex items-center justify-center overflow-visible transform-gpu"
          style={{
            transform: `scale(${discPulseScale})`,
          }}
        >
          {/* Uncropped Audio-Reactive Radiant Ambient Halo behind Turntable */}
          {visualizerEnabled && (
            <>
              <div
                className="absolute rounded-full pointer-events-none transition-opacity duration-200 ease-out"
                style={{
                  width: "440px",
                  height: "440px",
                  background:
                    "radial-gradient(circle, color-mix(in srgb, var(--primary, #00d2ff) 50%, transparent) 0%, color-mix(in srgb, var(--primary, #00d2ff) 18%, transparent) 55%, transparent 75%)",
                  filter: `blur(${22 + beatPulse * 24}px)`,
                  opacity: isPlaying ? 0.65 + beatPulse * 0.35 : 0.22,
                }}
              />

              {/* YouTube-Style Liquid Undulating Wave Equalizer Ring */}
              <LiquidWaveVisualizer frame={visualizerFrame} isPlaying={isPlaying} />
            </>
          )}

          {/* Rotating Disc (Grooves or CD Rainbow only!) */}
          <div
            className={`w-[400px] h-[400px] rounded-full absolute overflow-hidden ${
              playerStyle === "cd" ? "cd-disc-surface" : "vinyl-grooves"
            } ${isPlaying ? "spinning" : "spinning spinning-paused"}`}
          >
            <div className="absolute inset-0 rounded-full vinyl-sheen pointer-events-none" />

            {/* CD Acrylic Clamping Ring */}
            {playerStyle === "cd" && (
              <div className="absolute inset-[24%] rounded-full cd-acrylic-hub pointer-events-none" />
            )}
          </div>

          {/* STATIC Center Label with Album Cover (Does NOT spin!) */}
          <div
            className="group absolute rounded-full overflow-hidden flex flex-col items-center justify-center text-center p-4 z-20 shadow-2xl border border-white/10"
            style={{
              width: "170px",
              height: "170px",
              background:
                playerStyle === "cd"
                  ? "radial-gradient(circle, #252530 0%, #111116 100%)"
                  : "var(--primary)",
              boxShadow:
                "0 0 0 5px #0d0d12, 0 0 0 7px rgba(255,255,255,0.1), inset 0 0 25px rgba(0,0,0,0.7)",
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {cover ? (
                <motion.img
                  key={cover}
                  src={cover}
                  alt=""
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 0.92, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.08 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <motion.div
                  key="no-cover-disc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full flex items-center justify-center absolute inset-0"
                >
                  <IconsaxCd size={32} className="text-white/80 mb-1" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dark blur overlay for typography */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 z-10 pointer-events-none">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentTrack?.id ?? "no-track"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="text-xs font-black truncate max-w-[130px] text-white">
                    {currentTrack?.title ?? "Chavosh"}
                  </div>
                  <div className="text-[10px] opacity-75 truncate max-w-[120px] text-white mt-0.5">
                    {currentTrack?.artist ?? "Music Player"}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Hover button to fix cover */}
            {currentTrack && (
              <button
                type="button"
                onClick={() => setShowCoverModal(true)}
                className="absolute bottom-2.5 px-2.5 py-0.5 rounded-full bg-black/85 hover:bg-black text-[9.5px] font-bold text-white flex items-center gap-1 shadow-lg border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto z-40 hover:scale-105"
                title="Replace artwork"
              >
                <ImageIcon size={10} />
                <span>Fix Cover</span>
              </button>
            )}

            {/* Center Spindle */}
            <div className="w-5 h-5 rounded-full bg-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-inner border border-white/20 z-30 pointer-events-none" />
          </div>

          {/* Interactive Hover Music Controller in Lyrics Mode */}
          {vinylTab === "lyrics" && (
            <div
              className={`absolute rounded-full flex flex-col items-center justify-center p-5 z-40 transition-all duration-300 ease-out border border-white/20 shadow-2xl backdrop-blur-2xl ${
                isHoveringTurntable
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-90 pointer-events-none"
              }`}
              style={{
                width: "270px",
                height: "270px",
                background: "color-mix(in srgb, var(--theme-color-base) 88%, transparent)",
                boxShadow: "0 12px 35px -5px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.06)",
              }}
            >
              {/* Song Title & Artist */}
              <div className="text-center px-4 mb-2 max-w-[210px]">
                <div className="text-xs font-black truncate text-base-content">
                  {currentTrack?.title ?? "Chavosh"}
                </div>
                <div className="text-[10px] opacity-75 truncate text-base-content/80 mt-0.5 font-medium">
                  {currentTrack?.artist ?? "Unknown Artist"}
                </div>
              </div>

              {/* Main Media Action Buttons */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleShuffle();
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-base-content/10 transition-colors cursor-pointer"
                  style={{ color: shuffle ? "var(--primary)" : "var(--ink-dim)" }}
                  title={shuffle ? "Smart Shuffle: ON" : "Smart Shuffle: OFF"}
                >
                  <IconsaxShuffle size={14} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-base-content/10 transition-colors cursor-pointer text-base-content"
                  title="Previous Track"
                >
                  <IconsaxPrevious size={18} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    background: "var(--primary)",
                    color: "var(--theme-color-primary-content, #ffffff)",
                    boxShadow: "0 4px 18px color-mix(in oklab, var(--primary) 50%, transparent)",
                  }}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <IconsaxPause size={22} /> : <IconsaxPlay size={22} className="ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-base-content/10 transition-colors cursor-pointer text-base-content"
                  title="Next Track"
                >
                  <IconsaxNext size={18} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleRepeat();
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-base-content/10 transition-colors cursor-pointer"
                  style={{ color: repeat !== "off" ? "var(--primary)" : "var(--ink-dim)" }}
                  title={`Repeat: ${repeat}`}
                >
                  {repeat === "one" ? <IconsaxRepeatOne size={14} /> : <IconsaxRepeat size={14} />}
                </button>
              </div>

              {/* Progress Bar & Time */}
              <div className="w-full px-5 flex flex-col gap-1">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (duration <= 0) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    seek(ratio * duration);
                  }}
                  className="h-1.5 rounded-full bg-base-content/15 relative cursor-pointer overflow-hidden group/bar"
                >
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${progressPercent}%`,
                      background: "var(--primary)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono opacity-70 text-base-content">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tonearm (Vinyl only) */}
          {playerStyle === "vinyl" && (
            <div className="absolute top-2 right-4 pointer-events-none z-30">
              <div
                className="w-12 h-12 rounded-full relative shadow-2xl border border-white/10"
                style={{
                  background: "radial-gradient(circle, #555562 0%, #15151e 100%)",
                }}
              >
                <div className="w-4 h-4 rounded-full bg-[#0e0e14] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/10" />
              </div>

              <div
                className="absolute top-6 right-6 origin-[100%_50%] transition-transform duration-700 ease-out"
                style={{
                  width: "140px",
                  height: "4.5px",
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
                <div
                  className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-6 h-4 rounded-sm border-l-2"
                  style={{
                    background: "linear-gradient(135deg, #2d3436 0%, #636e72 100%)",
                    borderColor: "var(--primary)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Detailed Info or Live Synchronized Lyrics */}
        <div className="flex-1 max-w-lg flex flex-col justify-center h-full">
          {vinylTab === "lyrics" ? (
            <div className="h-[540px] flex flex-col overflow-hidden">
              <LyricsView isInsideVinyl />
            </div>
          ) : (
            <div className="flex flex-col justify-center gap-6">
              {/* Track title & meta */}
              <div className="min-h-[100px] flex flex-col justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentTrack?.id ?? "empty-meta"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    <h2 className="text-3xl font-black tracking-tight leading-tight" style={{ color: "var(--ink)" }}>
                      {currentTrack?.title ?? "No Song Playing"}
                    </h2>
                    <div className="text-base font-medium opacity-70 mt-1" style={{ color: "var(--ink-dim)" }}>
                      {currentTrack?.artist ?? "Unknown Artist"}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 opacity-70">
                        {currentTrack?.album ?? "Single"}
                      </span>
                      {currentTrack?.year && (
                        <span className="text-xs px-2.5 py-1 rounded-xl bg-white/5 opacity-60">
                          {currentTrack.year}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Scrubber & Controls */}
              <div className="sarv-card p-5 rounded-3xl flex flex-col gap-4">
                {/* Timeline */}
                <div className="flex flex-col gap-1.5">
                  <div
                    onClick={(e) => {
                      if (duration <= 0) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      seek(ratio * duration);
                    }}
                    className="h-2 rounded-full bg-white/10 relative cursor-pointer overflow-hidden"
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressPercent}%`,
                        background: "var(--primary)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono opacity-60">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Playback Buttons */}
                <div className="flex items-center justify-center gap-5">
                  <button
                    onClick={toggleShuffle}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors cursor-pointer"
                    style={{
                      color: shuffle ? "var(--primary)" : "var(--ink-dim)",
                      background: shuffle ? "color-mix(in oklab, var(--primary) 20%, transparent)" : "transparent",
                    }}
                    title={shuffle ? "Smart Shuffle: ON" : "Smart Shuffle: OFF"}
                  >
                    <IconsaxShuffle size={18} />
                  </button>

                  <button
                    onClick={prev}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                    style={{ color: "var(--ink)" }}
                    title="Previous Track"
                  >
                    <IconsaxPrevious size={20} />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-13 h-13 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    style={{
                      background: "var(--primary)",
                      color: "var(--theme-color-primary-content, #fff)",
                      boxShadow: "0 6px 24px color-mix(in srgb, var(--primary) 50%, transparent)",
                    }}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <IconsaxPause size={22} /> : <IconsaxPlay size={22} className="ml-0.5" />}
                  </button>

                  <button
                    onClick={next}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                    style={{ color: "var(--ink)" }}
                    title="Next Track"
                  >
                    <IconsaxNext size={20} />
                  </button>

                  <button
                    onClick={cycleRepeat}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors cursor-pointer"
                    style={{
                      color: repeat !== "off" ? "var(--primary)" : "var(--ink-dim)",
                      background:
                        repeat !== "off"
                          ? "color-mix(in oklab, var(--primary) 20%, transparent)"
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
                    {repeat === "one" ? <IconsaxRepeatOne size={18} /> : <IconsaxRepeat size={18} />}
                  </button>
                </div>
              </div>

              {/* Up Next Preview */}
              {upcomingTracks.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-40">
                    Up Next ({upcomingTracks.length})
                  </div>
                  <div className="flex flex-col gap-1">
                    {upcomingTracks.slice(0, 3).map((t, i) => {
                      const actualIdx = queueIndex + 1 + i;
                      return (
                        <div
                          key={`${t.id}-${actualIdx}`}
                          onClick={() => playQueueIndex(actualIdx)}
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-xs opacity-75 hover:opacity-100 transition-all cursor-pointer"
                        >
                          <span className="font-mono text-[10px] opacity-40">{i + 1}</span>
                          <span className="font-medium truncate flex-1">{t.title}</span>
                          <span className="opacity-50 text-[11px]">{t.artist}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fix / Replace Artwork Modal */}
      {showCoverModal && (
        <CoverEditModal
          track={currentTrack}
          currentCover={cover}
          onClose={() => setShowCoverModal(false)}
        />
      )}
    </div>
  );
}
