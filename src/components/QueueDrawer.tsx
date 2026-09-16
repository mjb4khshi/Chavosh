import { X, Shuffle, Play, Music, Trash2, ListMusic } from "lucide-react";
import { usePlayerStore, selectCurrentTrack } from "../stores/playerStore";
import { formatTime } from "../utils/format";

/**
 * Queue Drawer: w-80 - header h-12 px-4 - body p-3 space-y-4
 */
export function QueueDrawer() {
  const showQueueDrawer = usePlayerStore((s) => s.showQueueDrawer);
  const setShowQueueDrawer = usePlayerStore((s) => s.setShowQueueDrawer);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const shuffleQueue = usePlayerStore((s) => s.shuffleQueue);
  const shuffleRemainingQueue = usePlayerStore((s) => s.shuffleRemainingQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const coverCache = usePlayerStore((s) => s.coverCache);

  const activeList = shuffle && shuffleQueue ? shuffleQueue : queue;
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const upcomingTracks = activeList.slice(queueIndex + 1);

  if (!showQueueDrawer) return null;

  return (
    <div
      className="absolute inset-y-0 right-0 w-80 z-40 flex flex-col select-none animate-fadeIn border-l border-base-content/[0.08] shadow-2xl"
      style={{
        background: "color-mix(in srgb, var(--theme-color-base) 96%, transparent)",
        backdropFilter: "blur(32px)",
      }}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-base-content/10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ListMusic size={16} style={{ color: "var(--primary)" }} />
          <h2 className="text-xs font-black tracking-wide" style={{ color: "var(--ink)" }}>
            Play Queue
          </h2>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: "color-mix(in srgb, var(--primary) 18%, transparent)",
              color: "var(--primary)",
            }}
          >
            {upcomingTracks.length} upcoming
          </span>
        </div>

            <div className="flex items-center gap-0.5 shrink-0">
          {upcomingTracks.length > 1 && (
            <button
              onClick={shuffleRemainingQueue}
              title="Reshuffle Upcoming Songs"
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-base-content/[0.08] transition-colors cursor-pointer"
              style={{ color: "var(--primary)" }}
            >
              <Shuffle size={13} />
            </button>
          )}
          <button
            onClick={() => setShowQueueDrawer(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-base-content/[0.08] transition-colors cursor-pointer"
            style={{ color: "var(--ink-dim)" }}
            title="Close Queue"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {currentTrack && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-40 px-1">
              Now Playing
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-[var(--radius-card)] border border-base-content/10 relative overflow-hidden"
              style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)" }}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-base-content/[0.06] flex items-center justify-center border border-base-content/10 relative shadow-md">
                {coverCache[currentTrack.path] ? (
                  <img src={coverCache[currentTrack.path]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center vinyl-grooves">
                    <Music size={16} className="text-white/60" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-3.5">
                      <span className="w-0.5 rounded-full bg-[var(--primary)] eq-bar-1" />
                      <span className="w-0.5 rounded-full bg-[var(--accent)] eq-bar-2" />
                      <span className="w-0.5 rounded-full bg-[var(--primary)] eq-bar-3" />
                    </div>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate leading-tight" style={{ color: "var(--primary)" }}>
                  {currentTrack.title}
                </div>
                <div className="text-[11px] opacity-70 truncate mt-0.5" style={{ color: "var(--ink-dim)" }}>
                  {currentTrack.artist}
                </div>
                <div className="text-[10px] opacity-40 font-mono mt-0.5">
                  {formatTime(currentTrack.duration)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Up Next */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-40">
              {shuffle ? "Shuffled Next" : "Up Next"}
            </div>
            {shuffle && (
              <span className="text-[10px] font-semibold text-[var(--primary)]">Shuffle Active</span>
            )}
          </div>

          {upcomingTracks.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs opacity-50 space-y-1">
              <p>No tracks queued next</p>
              <p className="text-[11px] opacity-75">
                Play an album, song list, or playlist to fill the queue.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {upcomingTracks.map((t, idx) => {
                const actualIndex = queueIndex + 1 + idx;
                const cover = coverCache[t.path];

                return (
                  <div
                    key={`${t.id}-${actualIndex}`}
                    className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => playQueueIndex(actualIndex)}
                  >
                    <div className="w-6 text-center text-xs opacity-40 font-mono group-hover:hidden">
                      {idx + 1}
                    </div>
                    <button
                      className="w-6 hidden group-hover:flex items-center justify-center text-[var(--primary)] cursor-pointer"
                      title="Play Now"
                    >
                      <Play size={12} className="fill-current" />
                    </button>

                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-base-content/[0.06] shrink-0 flex items-center justify-center border border-base-content/10">
                      {cover ? (
                        <img src={cover} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music size={12} className="opacity-40" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--ink)" }}>
                        {t.title}
                      </div>
                      <div className="text-[10px] opacity-50 truncate mt-0.5" style={{ color: "var(--ink-dim)" }}>
                        {t.artist}
                      </div>
                    </div>

                    <div className="text-[10px] font-mono opacity-40 group-hover:hidden">
                      {formatTime(t.duration)}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(actualIndex);
                      }}
                      className="hidden group-hover:flex w-6 h-6 rounded-lg items-center justify-center opacity-60 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove from queue"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}