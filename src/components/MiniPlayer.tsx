import {
  Maximize2,
  Disc3,
  Pin,
  X,
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
} from "./Iconsax";
import { usePlayerStore, selectCurrentTrack } from "../stores/playerStore";
import { formatTime } from "../utils/format";
import { setAlwaysOnTop, closeWindow, startWindowDragging } from "../utils/window";

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
  const alwaysOnTop = usePlayerStore((s) => s.alwaysOnTop);
  const toggleAlwaysOnTop = usePlayerStore((s) => s.toggleAlwaysOnTop);
  const coverCache = usePlayerStore((s) => s.coverCache);

  const cover = currentTrack ? coverCache[currentTrack.path] : null;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const cycleRepeat = () => {
    const order = ["off", "all", "one"] as const;
    const idx = order.indexOf(repeat);
    setRepeat(order[(idx + 1) % order.length]);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const handlePin = async () => {
    const nextVal = !alwaysOnTop;
    toggleAlwaysOnTop();
    await setAlwaysOnTop(nextVal);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.target as HTMLElement).closest("button, input, select, a")) {
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
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.06] overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                background: "var(--primary)",
                boxShadow: "0 0 8px var(--primary)",
              }}
            />
          </div>

          {/* Left: Spinning Micro-Vinyl Record */}
          <div className="w-9 h-9 rounded-full relative shrink-0 overflow-hidden flex items-center justify-center vinyl-grooves shadow-lg border border-white/10">
            {cover ? (
              <img
                src={cover}
                alt=""
                className={`w-full h-full rounded-full object-cover ${
                  isPlaying ? "spinning" : "spinning spinning-paused"
                }`}
              />
            ) : (
              <div
                className={`w-full h-full rounded-full flex items-center justify-center ${
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

          {/* Center: Live Soundwave EQ & Track Info */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
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

            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold truncate text-white leading-tight">
                {currentTrack?.title ?? "No Track Playing"}
              </div>
              <div className="text-[9.5px] truncate text-white/50 leading-tight mt-0.5">
                {currentTrack?.artist ?? "Chavosh"}
              </div>
            </div>
          </div>

          {/* Right: Micro Controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={prev}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Previous"
            >
              <IconsaxPrevious size={13} />
            </button>

            <button
              onClick={togglePlay}
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
              onClick={next}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Next"
            >
              <IconsaxNext size={13} />
            </button>

            <button
              onClick={handlePin}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors ml-0.5 cursor-pointer"
              style={{
                color: alwaysOnTop ? "var(--primary)" : "rgba(255,255,255,0.45)",
              }}
              title={alwaysOnTop ? "Always On Top: ON" : "Pin Window"}
            >
              <Pin size={10} className={alwaysOnTop ? "rotate-45 fill-current" : ""} />
            </button>

            <button
              onClick={() => setPlayerMode("library")}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Expand to Full Library"
            >
              <Maximize2 size={10} />
            </button>

            <button
              onClick={() => closeWindow()}
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
        className="w-[416px] h-[106px] rounded-3xl flex items-center p-3 gap-3 relative cursor-default overflow-hidden"
        style={{
          background: "rgba(12, 13, 19, 0.94)",
          backdropFilter: "blur(36px)",
          WebkitBackdropFilter: "blur(36px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow:
            "0 6px 18px -3px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Left: High-Res Album Cover with Ambient Backlight Glow */}
        <div className="relative shrink-0">
          {/* Ambient Glow */}
          {cover && (
            <div
              className="absolute -inset-1 rounded-2xl opacity-40 blur-md pointer-events-none"
              style={{
                backgroundImage: `url(${cover})`,
                backgroundSize: "cover",
              }}
            />
          )}

          <div
            className="w-[90px] h-[90px] rounded-2xl overflow-hidden relative shadow-xl border border-white/10 flex items-center justify-center bg-black/50"
          >
            {cover ? (
              <img src={cover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center vinyl-grooves">
                <IconsaxCd size={28} className="text-white/40" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls, Timeline & Metadata */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-[90px] py-0.5">
          {/* Top Row: Track Title, Artist & Quick Window Actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black truncate text-white leading-tight">
                {currentTrack?.title ?? "No Track Selected"}
              </div>
              <div className="text-[10.5px] truncate text-white/55 mt-0.5 font-medium">
                {currentTrack?.artist ?? "Chavosh"}
              </div>
            </div>

            {/* Window control icons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePin}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                style={{
                  color: alwaysOnTop ? "var(--primary)" : "rgba(255,255,255,0.4)",
                }}
                title={alwaysOnTop ? "Always On Top: ON" : "Pin Always on Top"}
              >
                <Pin size={11} className={alwaysOnTop ? "rotate-45 fill-current" : ""} />
              </button>
              <button
                onClick={() => setPlayerMode("library")}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Restore Full Library"
              >
                <Maximize2 size={11} />
              </button>
              <button
                onClick={() => closeWindow()}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/80 text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Middle Row: Scrubber Timeline */}
          <div className="flex items-center gap-2 text-[9.5px] font-mono text-white/50">
            <span className="w-6 text-right">{formatTime(currentTime)}</span>
            <div
              onClick={handleSeek}
              className="flex-1 h-1.5 bg-white/10 rounded-full relative cursor-pointer group py-1 -my-1"
            >
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPercent}%`,
                    background: "var(--primary)",
                    boxShadow: "0 0 6px var(--primary)",
                  }}
                />
              </div>
            </div>
            <span className="w-6 text-left">{formatTime(duration)}</span>
          </div>

          {/* Bottom Row: Playback Controls & Volume Slider */}
          <div className="flex items-center justify-between">
            {/* Playback buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleShuffle}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  color: shuffle ? "var(--primary)" : "rgba(255,255,255,0.35)",
                }}
                title={shuffle ? "Shuffle: ON" : "Shuffle: OFF"}
              >
                <IconsaxShuffle size={12} />
              </button>

              <button
                onClick={prev}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Previous Track"
              >
                <IconsaxPrevious size={13} />
              </button>

              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                style={{
                  background: "var(--primary)",
                  color: "var(--theme-color-primary-content, #fff)",
                  boxShadow: "0 2px 12px color-mix(in srgb, var(--primary) 60%, transparent)",
                }}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <IconsaxPause size={14} /> : <IconsaxPlay size={14} className="ml-0.5" />}
              </button>

              <button
                onClick={next}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Next Track"
              >
                <IconsaxNext size={13} />
              </button>

              <button
                onClick={cycleRepeat}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  color: repeat !== "off" ? "var(--primary)" : "rgba(255,255,255,0.35)",
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

            {/* Inline Volume Slider */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
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
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-14 cursor-pointer h-1 rounded-full"
                style={{ accentColor: "var(--primary)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
