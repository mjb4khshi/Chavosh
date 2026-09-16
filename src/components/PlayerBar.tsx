import {
  Heart,
  ListMusic,
  Zap,
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
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore, selectCurrentTrack } from "../stores/playerStore";
import { formatTime } from "../utils/format";
import SarvBadge from "./sarv/SarvBadge";

/**
 * Sarv UI Spacing System (4px grid)
 * PlayerBar: h-20 (80px) - px-4 - fixed wings w-56 + fluid center
 */
export function PlayerBar() {
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
  const favorites = usePlayerStore((s) => s.favorites);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const showNowPlayingOverlay = usePlayerStore((s) => s.showNowPlayingOverlay);
  const setShowNowPlayingOverlay = usePlayerStore((s) => s.setShowNowPlayingOverlay);
  const showQueueDrawer = usePlayerStore((s) => s.showQueueDrawer);
  const toggleQueueDrawer = usePlayerStore((s) => s.toggleQueueDrawer);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const shuffleQueue = usePlayerStore((s) => s.shuffleQueue);
  const coverCache = usePlayerStore((s) => s.coverCache);
  const settings = usePlayerStore((s) => s.settings);
  const updateSettings = usePlayerStore((s) => s.updateSettings);

  const activeList = shuffle && shuffleQueue ? shuffleQueue : queue;
  const upcomingCount = Math.max(0, activeList.length - (queueIndex + 1));
  const isFavorite = currentTrack ? favorites.includes(currentTrack.id) : false;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const cover = currentTrack ? coverCache[currentTrack.path] : null;

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

  const ctlBtn = "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer";

  return (
    <div
      className="h-20 w-full flex items-center gap-4 px-4 select-none shrink-0 border-t border-base-content/[0.08] relative z-20"
      style={{
        background:
          "color-mix(in oklab, var(--theme-color-base-500, #141620) 20%, var(--theme-color-base, #07080c))",
        backdropFilter: "blur(28px)",
      }}
    >
      {/* Left Wing: Track Info & Artwork */}
      <div className="w-56 shrink-0 flex items-center gap-3 min-w-0">
        <div
          onClick={() => setShowNowPlayingOverlay(!showNowPlayingOverlay)}
          className="w-11 h-11 rounded-[var(--radius-button)] relative overflow-hidden shrink-0 cursor-pointer group flex items-center justify-center border border-base-content/10 shadow-sm"
          style={{ background: "#0c0d12" }}
          title="Open Vinyl Room"
        >
          <AnimatePresence mode="wait" initial={false}>
            {cover ? (
              <motion.img
                key={cover}
                src={cover}
                alt=""
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.06 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform absolute inset-0"
              />
            ) : (
              <motion.div
                key="default-cd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full flex items-center justify-center vinyl-grooves absolute inset-0"
              >
                <IconsaxCd size={18} className="text-base-content/60" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0 flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentTrack?.id ?? "no-track"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="min-w-0"
            >
              <div
                className="text-xs font-bold truncate leading-tight hover:underline cursor-pointer text-base-content"
                onClick={() => setShowNowPlayingOverlay(true)}
              >
                {currentTrack?.title ?? "No Track Selected"}
              </div>
              <div className="text-[11px] truncate text-neutral mt-0.5 font-medium">
                {currentTrack?.artist ?? "Chavosh"}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {currentTrack && (
          <button
            type="button"
            onClick={() => toggleFavorite(currentTrack.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-base-content/[0.08] transition-colors shrink-0 cursor-pointer"
            style={{
              color: isFavorite
                ? "var(--theme-color-accent, #fe28a2)"
                : "color-mix(in srgb, var(--theme-color-base-content) 40%, transparent)",
            }}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      {/* Center: Controls & Scrubber */}
      <div className="flex-1 min-w-0 max-w-xl mx-auto flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleShuffle}
            className={ctlBtn}
            style={{
              color: shuffle
                ? "var(--theme-color-primary, #0066a4)"
                : "color-mix(in srgb, var(--theme-color-base-content) 45%, transparent)",
              background: shuffle
                ? "color-mix(in oklab, var(--theme-color-primary, #0066a4) 20%, transparent)"
                : "transparent",
            }}
            title={shuffle ? "Smart Shuffle: On" : "Smart Shuffle: Off"}
          >
            <IconsaxShuffle size={16} />
          </button>

          <button type="button" onClick={prev} className={`${ctlBtn} hover:bg-base-content/[0.08] text-base-content/80 hover:text-base-content`} title="Previous Track">
            <IconsaxPrevious size={17} />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
            style={{
              background: "var(--theme-color-primary, #0066a4)",
              color: "var(--theme-color-primary-content, #fff)",
              boxShadow: "0 4px 18px color-mix(in oklab, var(--theme-color-primary, #0066a4) 60%, transparent)",
            }}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <IconsaxPause size={17} /> : <IconsaxPlay size={17} className="ml-0.5" />}
          </button>

          <button type="button" onClick={next} className={`${ctlBtn} hover:bg-base-content/[0.08] text-base-content/80 hover:text-base-content`} title="Next Track">
            <IconsaxNext size={17} />
          </button>

          <button
            type="button"
            onClick={cycleRepeat}
            className={ctlBtn}
            style={{
              color:
                repeat !== "off"
                  ? "var(--primary, var(--theme-color-primary, #0066a4))"
                  : "color-mix(in srgb, var(--theme-color-base-content) 45%, transparent)",
              background:
                repeat !== "off"
                  ? "color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 20%, transparent)"
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
            {repeat === "one" ? <IconsaxRepeatOne size={16} /> : <IconsaxRepeat size={16} />}
          </button>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono font-medium text-neutral tabular-nums w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleSeek}
            className="flex-1 h-1.5 bg-base-content/[0.08] hover:h-2.5 rounded-full cursor-pointer relative overflow-hidden transition-all group/bar"
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progressPercent}%`,
                background: "var(--primary, var(--theme-color-primary, #0066a4))",
                boxShadow: "0 0 10px var(--primary, var(--theme-color-primary, #0066a4))",
              }}
            />
          </div>
          <span className="text-[11px] font-mono font-medium text-neutral tabular-nums w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right Wing: Remix, Queue & Volume */}
      <div className="w-56 shrink-0 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => updateSettings({ remixEnabled: !settings.remixEnabled })}
          className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            settings.remixEnabled
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              : "text-base-content/60 hover:text-base-content hover:bg-base-content/[0.08]"
          }`}
          title={settings.remixEnabled ? "Remix Engine: ON" : "Enable Remix Engine"}
        >
          <Zap size={13} className={settings.remixEnabled ? "fill-current" : ""} />
          <span className="hidden xl:inline text-[11px] font-bold">Remix</span>
        </button>

        <button
          type="button"
          onClick={toggleQueueDrawer}
          className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            showQueueDrawer
              ? "bg-base-content text-base-900"
              : "text-base-content/60 hover:text-base-content hover:bg-base-content/[0.08]"
          }`}
          style={{
            background: showQueueDrawer
              ? "color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 22%, transparent)"
              : undefined,
            color: showQueueDrawer
              ? "var(--primary, var(--theme-color-primary, #0066a4))"
              : undefined,
            border: showQueueDrawer
              ? "1px solid var(--primary, var(--theme-color-primary, #0066a4))"
              : undefined,
          }}
          title="Toggle Queue Drawer"
        >
          <ListMusic size={14} />
          {upcomingCount > 0 && (
            <SarvBadge
              variant={showQueueDrawer ? "neutral" : "primary"}
              soft={!showQueueDrawer}
              size="xs"
              className="font-mono"
            >
              {upcomingCount}
            </SarvBadge>
          )}
        </button>

        <div className="flex items-center gap-1.5 pl-3 border-l border-base-content/[0.08]">
          <button
            type="button"
            onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-base-content/[0.08] transition-colors text-base-content/60 hover:text-base-content cursor-pointer"
            title={volume === 0 ? "Unmute" : `Volume: ${Math.round(volume * 100)}%`}
          >
            {volume === 0 ? (
              <IconsaxVolumeCross size={16} />
            ) : volume < 0.45 ? (
              <IconsaxVolumeLow size={16} />
            ) : (
              <IconsaxVolumeHigh size={16} />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 cursor-pointer h-1.5 rounded-full"
            style={{ accentColor: "var(--primary, var(--theme-color-primary, #0066a4))" }}
          />
        </div>
      </div>
    </div>
  );
}