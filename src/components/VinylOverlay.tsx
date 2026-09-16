import {
  X,
  Disc3,
  Disc,
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

export function VinylOverlay() {
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

  const cover = currentTrack ? coverCache[currentTrack.path] : null;
  const activeList = shuffle && shuffleQueue ? shuffleQueue : queue;

  const cycleRepeat = () => {
    const order = ["off", "all", "one"] as const;
    const idx = order.indexOf(repeat);
    setRepeat(order[(idx + 1) % order.length]);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const upcomingTracks = activeList.slice(queueIndex + 1, queueIndex + 6);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col select-none animate-fadeIn"
      style={{
        background: "color-mix(in srgb, var(--theme-color-base) 94%, transparent)",
        backdropFilter: "blur(40px)",
      }}
    >
      {/* Top action bar */}
      <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          {/* Style switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setPlayerStyle("vinyl")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: playerStyle === "vinyl" ? "var(--primary)" : "transparent",
                color: playerStyle === "vinyl" ? "#fff" : "var(--ink-dim)",
              }}
            >
              <Disc size={14} />
              <span>Vinyl Turntable</span>
            </button>
            <button
              onClick={() => setPlayerStyle("cd")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: playerStyle === "cd" ? "var(--primary)" : "transparent",
                color: playerStyle === "cd" ? "#fff" : "var(--ink-dim)",
              }}
            >
              <Disc3 size={14} />
              <span>Compact Disc</span>
            </button>
          </div>
        </div>

        {/* Close overlay */}
        <button
          onClick={() => setShowNowPlayingOverlay(false)}
          className="sarv-btn sarv-btn-ghost text-xs py-2 px-4 gap-1.5 cursor-pointer"
        >
          <X size={15} />
          <span>Exit Room</span>
        </button>
      </div>

      {/* Main split view */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden gap-14 max-w-6xl mx-auto w-full">
        {/* Left: Giant Realistic Turntable / CD */}
        <div
          className="w-[400px] h-[400px] relative shrink-0 flex items-center justify-center"
          style={{
            filter: "drop-shadow(0 25px 40px rgba(0, 0, 0, 0.8))",
          }}
        >
          {/* Rotating Disc (Grooves or CD Rainbow only!) */}
          <div
            className={`w-full h-full rounded-full absolute inset-0 overflow-hidden ${
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
            className="absolute rounded-full overflow-hidden flex flex-col items-center justify-center text-center p-4 z-20 shadow-2xl border border-white/10"
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

            {/* Center Spindle */}
            <div className="w-5 h-5 rounded-full bg-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-inner border border-white/20 z-30 pointer-events-none" />
          </div>

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
                  width: "155px",
                  height: "4.5px",
                  transform: `rotate(${isPlaying ? "-10deg" : "28deg"})`,
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

        {/* Right: Detailed Info, Controls & Queue Preview */}
        <div className="flex-1 max-w-md flex flex-col justify-center gap-6">
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
                  background: repeat !== "off" ? "color-mix(in oklab, var(--primary) 20%, transparent)" : "transparent",
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
      </div>
    </div>
  );
}
