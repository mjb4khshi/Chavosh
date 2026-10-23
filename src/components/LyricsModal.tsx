import { useState } from "react";
import { X, Mic2, Disc3, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore, selectCurrentTrack } from "../stores/playerStore";
import { LyricsView } from "./LyricsView";
import { CoverEditModal } from "./CoverEditModal";

export function LyricsModal() {
  const [showCoverModal, setShowCoverModal] = useState(false);
  const showLyrics = usePlayerStore((s) => s.showLyrics);
  const setShowLyrics = usePlayerStore((s) => s.setShowLyrics);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const coverCache = usePlayerStore((s) => s.coverCache);

  if (!showLyrics) return null;

  const cover = currentTrack ? coverCache[currentTrack.path] : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowLyrics(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.06, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative z-10 w-full max-w-2xl h-[82vh] rounded-[var(--radius-card,1.5rem)] flex flex-col overflow-hidden shadow-2xl border border-base-content/10"
          style={{
            background:
              "color-mix(in oklab, var(--theme-color-base) 94%, var(--theme-color-base-500) 6%)",
            backdropFilter: "blur(32px)",
          }}
        >
          {/* Header */}
          <div className="h-14 px-6 flex items-center justify-between shrink-0 border-b border-base-content/[0.08]">
            <div className="flex items-center gap-3 min-w-0">
              <div
                onClick={() => currentTrack && setShowCoverModal(true)}
                className="w-9 h-9 rounded-xl overflow-hidden bg-base-content/[0.06] shrink-0 border border-base-content/10 flex items-center justify-center shadow-md relative group cursor-pointer"
                title="تغییر یا اصلاح کاور / Fix Cover"
              >
                {cover ? (
                  <img src={cover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Disc3 size={16} className="opacity-30 text-base-content" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <ImageIcon size={13} />
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-base-content truncate">
                  {currentTrack?.title ?? "No Song Selected"}
                </h2>
                <p className="text-[11px] text-base-content/60 truncate font-medium">
                  {currentTrack?.artist ?? "Chavosh"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentTrack && (
                <button
                  type="button"
                  onClick={() => setShowCoverModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-base-content/[0.06] hover:bg-base-content/[0.12] text-base-content transition-all cursor-pointer border border-base-content/10"
                  title="Fix Album Cover"
                >
                  <ImageIcon size={12} className="text-[var(--primary,#0066a4)]" />
                  <span>Fix Cover</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowLyrics(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/60 hover:text-base-content hover:bg-base-content/10 transition-colors cursor-pointer"
                title="Close Lyrics (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-6 pb-6 pt-1 overflow-hidden flex flex-col">
            <LyricsView />
          </div>

          {/* Cover Edit Modal */}
          {showCoverModal && currentTrack && (
            <CoverEditModal
              track={currentTrack}
              currentCover={cover}
              onClose={() => setShowCoverModal(false)}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
