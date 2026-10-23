import React, { useState } from "react";
import { X, Search, Upload, Image as ImageIcon, Check, RotateCcw, Sparkles } from "lucide-react";
import { type Track, usePlayerStore } from "../stores/playerStore";
import { searchOnlineCovers, applyCustomTrackCover, type CoverSearchResult } from "../utils/coverService";
import SarvButton from "./sarv/SarvButton";

interface CoverEditModalProps {
  track: Track | null;
  currentCover: string | null;
  onClose: () => void;
}

export function CoverEditModal({ track, currentCover, onClose }: CoverEditModalProps) {
  const [query, setQuery] = useState(
    track ? `${track.artist} ${track.title}`.replace("Unknown Artist", "").trim() : ""
  );
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CoverSearchResult[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!track) return null;

  // Auto-search on mount if query is available
  React.useEffect(() => {
    if (!query.trim()) return;
    let cancelled = false;
    setIsSearching(true);
    searchOnlineCovers(query.trim()).then((list) => {
      if (!cancelled) {
        setResults(list);
        setIsSearching(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const list = await searchOnlineCovers(query.trim());
      setResults(list);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyCover = (url: string) => {
    setSelectedUrl(url);
    applyCustomTrackCover(track.path, url);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        handleApplyCover(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 flex flex-col gap-5 border border-base-content/15 shadow-2xl relative overflow-hidden"
        style={{
          background:
            "color-mix(in oklab, var(--theme-color-base-500, #141620) 85%, var(--theme-color-base, #07080c))",
          backdropFilter: "blur(32px)",
          color: "var(--theme-color-base-content, #ffffff)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-base-content/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary,#0066a4)]/15 text-[var(--primary,#0066a4)] flex items-center justify-center">
              <ImageIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-base-content">
                Fix / Replace Album Artwork
              </h3>
              <p className="text-[11px] text-neutral truncate max-w-[280px]">
                {track.title} • {track.artist}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral hover:text-base-content hover:bg-base-content/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current cover preview & Upload Custom option */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-base-content/[0.04] border border-base-content/[0.08]">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-base-content/10 shrink-0 border border-base-content/10 flex items-center justify-center shadow-md">
            {currentCover ? (
              <img src={currentCover} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={22} className="opacity-30" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-base-content">
              {currentCover ? "Active Artwork" : "No Artwork Assigned"}
            </div>
            <div className="text-[11px] text-neutral mt-0.5">
              Select an image from your computer or search online
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <SarvButton
            variant="soft"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload size={13} />}
            className="text-xs shrink-0"
          >
            Upload File
          </SarvButton>
        </div>

        {/* Online search bar */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-base-content flex items-center gap-1.5">
            <Sparkles size={12} className="text-[var(--primary,#0066a4)]" />
            <span>Search High-Res Artwork Online (iTunes HD)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Artist and song title..."
              className="flex-1 h-9 px-3 rounded-xl bg-base-content/[0.06] border border-base-content/15 text-xs text-base-content placeholder-base-content/40 outline-none focus:border-[var(--primary,#0066a4)]"
            />
            <SarvButton
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              icon={<Search size={13} />}
              className="text-xs shrink-0 h-9"
            >
              {isSearching ? "Searching..." : "Search"}
            </SarvButton>
          </div>
        </div>

        {/* Online Results Grid */}
        {results.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-neutral">
              Candidate Covers (Click to apply):
            </span>
            <div className="grid grid-cols-4 gap-2.5 max-h-[190px] overflow-y-auto pr-1">
              {results.map((item, idx) => (
                <div
                  key={`${item.url}-${idx}`}
                  onClick={() => handleApplyCover(item.url)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-base-content/15 hover:border-[var(--primary,#0066a4)] cursor-pointer transition-all hover:scale-105 shadow-md bg-black/30"
                  title={`${item.title} - ${item.artist} (${item.album})`}
                >
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center">
                    <Check size={18} className="text-white drop-shadow" />
                    <span className="text-[9px] text-white font-bold mt-1 line-clamp-1">
                      {item.album}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
