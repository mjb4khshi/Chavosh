import React, { useEffect, useRef, useState } from "react";
import {
  Mic2,
  Copy,
  Check,
  RotateCw,
  Search,
  Upload,
  AlignLeft,
  FileText,
  Sparkles,
  Globe,
  Radio,
} from "lucide-react";
import { usePlayerStore, selectCurrentTrack } from "../stores/playerStore";
import { findActiveLyricIndex, parseLrc, type LyricsData } from "../utils/lyrics";
import {
  extractCleanMetadata,
  saveLyricsToCache,
  fetchYouTubeCaptions,
} from "../utils/lyricsService";
import { formatTime } from "../utils/format";
import SarvButton from "./sarv/SarvButton";

interface LyricsViewProps {
  className?: string;
  isInsideVinyl?: boolean;
}

export function LyricsView({ className = "", isInsideVinyl = false }: LyricsViewProps) {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const seek = usePlayerStore((s) => s.seek);
  const currentLyrics = usePlayerStore((s) => s.currentLyrics);
  const setCurrentLyrics = usePlayerStore((s) => s.setCurrentLyrics);
  const isLoadingLyrics = usePlayerStore((s) => s.isLoadingLyrics);
  const loadLyrics = usePlayerStore((s) => s.loadLyrics);
  const lyricsFontSize = usePlayerStore((s) => s.lyricsFontSize);
  const setLyricsFontSize = usePlayerStore((s) => s.setLyricsFontSize);

  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Auto-sync search query with current track
  useEffect(() => {
    if (currentTrack) {
      const { cleanTitle, cleanArtist } = extractCleanMetadata(currentTrack);
      setManualQuery(cleanArtist ? `${cleanArtist} ${cleanTitle}` : cleanTitle);
    }
  }, [currentTrack]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isFirstScrollRef = useRef(true);
  const prevTrackKeyRef = useRef<string | null>(null);

  const activeIndex =
    currentLyrics && currentLyrics.synced
      ? findActiveLyricIndex(currentLyrics.lines, currentTime)
      : -1;

  // Reset scroll mode on track change so initial position snaps instantly without bottom glitches
  useEffect(() => {
    const key = currentTrack ? `${currentTrack.id}:${currentTrack.path}` : null;
    if (key !== prevTrackKeyRef.current) {
      prevTrackKeyRef.current = key;
      isFirstScrollRef.current = true;
    }
  }, [currentTrack]);

  // Precise, container-bound auto-scroll (avoids scrollIntoView window jumps and bottom glitching)
  useEffect(() => {
    if (!autoScroll || userInteracted) return;

    const container = containerRef.current;
    if (!container) return;

    if (activeIndex < 0) {
      if (isFirstScrollRef.current) {
        container.scrollTop = 0;
        isFirstScrollRef.current = false;
      }
      return;
    }

    const activeEl = activeLineRef.current;
    if (!activeEl) return;

    const rafId = requestAnimationFrame(() => {
      const c = containerRef.current;
      const el = activeLineRef.current;
      if (!c || !el) return;

      const elTop = el.offsetTop;
      const elHeight = el.offsetHeight;
      const containerHeight = c.clientHeight;

      const targetScrollTop = Math.max(
        0,
        elTop - containerHeight / 2 + elHeight / 2
      );

      if (isFirstScrollRef.current) {
        c.scrollTop = targetScrollTop;
        isFirstScrollRef.current = false;
      } else {
        c.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [activeIndex, autoScroll, userInteracted]);

  // Reset user interaction timeout after 4 seconds of idle
  const handleScroll = () => {
    setUserInteracted(true);
  };

  useEffect(() => {
    if (!userInteracted) return;
    const timer = setTimeout(() => {
      setUserInteracted(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [userInteracted]);

  const handleCopy = () => {
    if (!currentLyrics) return;
    const text =
      currentLyrics.plain ||
      currentLyrics.lines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const parsed = parseLrc(content, "manual");
        parsed.title = currentTrack?.title;
        parsed.artist = currentTrack?.artist;
        setCurrentLyrics(parsed);
        if (currentTrack) {
          saveLyricsToCache(currentTrack, parsed);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleManualSearch = async () => {
    if (!manualQuery.trim() || !currentTrack) return;
    setIsSearchingManual(true);
    try {
      const res = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(manualQuery.trim())}`,
        {
          headers: { "User-Agent": "Chavosh Music Player v1.0.0" },
        }
      );
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          // Prioritize synced lyrics, fallback to plain
          const bestSynced = list.find((it: any) => it.syncedLyrics);
          const item = bestSynced || list[0];

          let parsed: LyricsData | null = null;
          if (item.syncedLyrics) {
            parsed = parseLrc(item.syncedLyrics, "lrclib");
          } else if (item.plainLyrics) {
            parsed = parseLrc(item.plainLyrics, "lrclib");
          }

          if (parsed) {
            parsed.title = currentTrack.title;
            parsed.artist = currentTrack.artist;
            setCurrentLyrics(parsed);
            saveLyricsToCache(currentTrack, parsed);
            setShowSearchBar(false);
          }
        }
      }
    } catch (err) {
      console.warn("Manual lyrics search failed:", err);
    } finally {
      setIsSearchingManual(false);
    }
  };

  const handleYouTubeCaptionsSearch = async () => {
    if (!currentTrack) return;
    setIsSearchingYouTube(true);
    try {
      const res = await fetchYouTubeCaptions(currentTrack);
      if (res) {
        setCurrentLyrics(res);
      }
    } catch (err) {
      console.warn("YouTube captions search failed:", err);
    } finally {
      setIsSearchingYouTube(false);
    }
  };

  // Font size styles (Bold & Punchy typography - Avoid .text-base class as it maps to --color-base)
  const fontClasses =
    lyricsFontSize === "sm"
      ? "text-[15px] sm:text-[17px] leading-relaxed font-black"
      : lyricsFontSize === "lg"
      ? "text-2xl sm:text-3xl leading-loose font-black"
      : "text-lg sm:text-2xl leading-relaxed font-black";

  return (
    <div
      className={`flex flex-col h-full select-none relative group ${className}`}
      style={{ minHeight: isInsideVinyl ? "360px" : "420px" }}
    >
      {/* Hidden file input for uploading custom .lrc */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".lrc,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Discreet Minimalist Top Actions - Hidden by default, visible on hover */}
      <div
        className={`flex items-center justify-between gap-2 px-1 pb-2 shrink-0 transition-opacity duration-300 ${
          showSearchBar
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
          {currentLyrics?.synced ? (
            <span
              className="flex items-center gap-1.5 text-[11px] font-bold"
              style={{ color: "var(--primary, #00d2ff)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--primary, #00d2ff)" }}
              />
              Synced Karaoke
            </span>
          ) : currentLyrics ? (
            <button
              type="button"
              onClick={() => currentTrack && loadLyrics(currentTrack, true)}
              disabled={isLoadingLyrics}
              className="flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-500/30 transition-all cursor-pointer font-bold"
              title="Force online search to replace embedded or unsynced lyrics"
            >
              <Globe size={10} className={isLoadingLyrics ? "animate-spin" : ""} />
              <span>Force Online Sync</span>
            </button>
          ) : null}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Font size toggle */}
          <div className="flex items-center bg-base-content/[0.08] rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setLyricsFontSize("sm")}
              className={`px-2 py-0.5 text-[10px] font-black rounded-full cursor-pointer transition-colors ${
                lyricsFontSize === "sm"
                  ? "shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
              style={{
                background: lyricsFontSize === "sm" ? "var(--primary)" : "transparent",
                color: lyricsFontSize === "sm" ? "var(--theme-color-primary-content, #ffffff)" : undefined,
              }}
              title="Small text"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setLyricsFontSize("md")}
              className={`px-2 py-0.5 text-[10.5px] font-black rounded-full cursor-pointer transition-colors ${
                lyricsFontSize === "md"
                  ? "shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
              style={{
                background: lyricsFontSize === "md" ? "var(--primary)" : "transparent",
                color: lyricsFontSize === "md" ? "var(--theme-color-primary-content, #ffffff)" : undefined,
              }}
              title="Standard text"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setLyricsFontSize("lg")}
              className={`px-2 py-0.5 text-[11px] font-black rounded-full cursor-pointer transition-colors ${
                lyricsFontSize === "lg"
                  ? "shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
              style={{
                background: lyricsFontSize === "lg" ? "var(--primary)" : "transparent",
                color: lyricsFontSize === "lg" ? "var(--theme-color-primary-content, #ffffff)" : undefined,
              }}
              title="Large text"
            >
              A+
            </button>
          </div>

          {/* Force Online Sync / Replace */}
          {currentTrack && (
            <button
              type="button"
              onClick={() => loadLyrics(currentTrack, true)}
              disabled={isLoadingLyrics}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer text-base-content/65 hover:text-base-content hover:bg-base-content/10"
              title="Force online sync to replace lyrics"
            >
              <Globe size={12} className={isLoadingLyrics ? "animate-spin text-[var(--primary,#00d2ff)]" : ""} />
            </button>
          )}

          {/* Re-sync / Refresh */}
          {currentTrack && (
            <button
              type="button"
              onClick={() => loadLyrics(currentTrack)}
              disabled={isLoadingLyrics}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer text-base-content/65 hover:text-base-content hover:bg-base-content/10"
              title="Refresh lyrics"
            >
              <RotateCw size={12} className={isLoadingLyrics ? "animate-spin" : ""} />
            </button>
          )}

          {/* Copy Lyrics */}
          {currentLyrics && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer text-base-content/65 hover:text-base-content hover:bg-base-content/10"
              title={copied ? "Copied!" : "Copy lyrics"}
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          )}

          {/* Search / Fix Track Title */}
          <button
            type="button"
            onClick={() => setShowSearchBar(!showSearchBar)}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              showSearchBar
                ? "bg-[var(--primary,#00d2ff)] text-black"
                : "text-base-content/65 hover:text-base-content hover:bg-base-content/10"
            }`}
            title="Edit song name / Search custom lyrics"
          >
            <Search size={12} />
          </button>

          {/* Upload LRC file */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer text-base-content/65 hover:text-base-content hover:bg-base-content/10"
            title="Import custom .lrc file"
          >
            <Upload size={12} />
          </button>
        </div>
      </div>

      {/* Inline Search / Name Correction Bar */}
      {showSearchBar && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-2 rounded-xl bg-base-content/[0.06] border border-base-content/15 animate-fadeIn shrink-0">
          <input
            type="text"
            dir="auto"
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            placeholder="Edit title / artist name..."
            className="flex-1 bg-transparent text-xs text-base-content placeholder-base-content/40 outline-none px-1 font-semibold"
            autoFocus
          />
          <button
            type="button"
            onClick={handleManualSearch}
            disabled={isSearchingManual || !manualQuery.trim()}
            className="px-2.5 py-1 rounded-lg bg-[var(--primary,#00d2ff)] text-black text-[10.5px] font-black cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0"
          >
            {isSearchingManual ? <RotateCw size={10} className="animate-spin" /> : <Search size={10} />}
            <span>Find & Save</span>
          </button>
        </div>
      )}

      {/* Main Lyrics Scroll Area */}
      <div
        ref={containerRef}
        onWheel={handleScroll}
        onTouchMove={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden relative px-2 py-6"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        {/* Loading state */}
        {isLoadingLyrics && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral py-16">
            <RotateCw size={26} className="animate-spin text-[var(--theme-color-primary,#0066a4)]" />
            <p className="text-xs font-semibold">Finding matching lyrics...</p>
          </div>
        )}

        {/* Synced Lyrics List with Distance-Based Depth of Field */}
        {!isLoadingLyrics && currentLyrics && currentLyrics.synced && (
          <div className="flex flex-col gap-5 text-center my-6">
            {currentLyrics.lines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const diff = idx - activeIndex;
              const absDiff = Math.abs(diff);

              let dynamicClasses = "opacity-65 scale-[0.94]";
              if (isActive) {
                dynamicClasses = "opacity-100 scale-[1.04] z-10 drop-shadow-md";
              } else if (absDiff === 1) {
                dynamicClasses = "opacity-88 scale-[0.98]";
              } else if (absDiff === 2) {
                dynamicClasses = "opacity-75 scale-[0.96]";
              }

              return (
                <div
                  key={`${line.id}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  dir="auto"
                  className={`relative px-4 py-2 rounded-2xl cursor-pointer transition-all duration-300 ease-out transform-gpu origin-center hover:opacity-100 hover:scale-[0.98] ${dynamicClasses}`}
                  style={{
                    color: isActive
                      ? "var(--primary, #00d2ff)"
                      : isInsideVinyl
                        ? "rgba(255, 255, 255, 0.70)"
                        : "var(--theme-color-base-content, #ffffff)",
                    textShadow: isActive
                      ? "0 0 24px color-mix(in srgb, var(--primary, #00d2ff) 75%, transparent), 0 2px 8px rgba(0,0,0,0.85)"
                      : isInsideVinyl
                        ? "0 1px 4px rgba(0, 0, 0, 0.85)"
                        : "0 1px 3px rgba(0,0,0,0.45)",
                  }}
                >
                  <p
                    className={`${fontClasses} tracking-tight font-black transition-all`}
                    style={{ color: "inherit" }}
                  >
                    {line.text}
                  </p>

                  {/* Hover seek hint */}
                  <span className="opacity-0 hover:opacity-100 transition-opacity absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-base-content bg-base-500 px-2 py-0.5 rounded-full shadow border border-base-content/10 pointer-events-none">
                    {formatTime(line.time)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Plain Text Lyrics */}
        {!isLoadingLyrics && currentLyrics && !currentLyrics.synced && (
          <div className="py-6 px-4 text-center max-w-lg mx-auto" dir="auto">
            <div
              className="whitespace-pre-line text-base sm:text-lg leading-loose font-black"
              style={{
                color: isInsideVinyl
                  ? "rgba(255, 255, 255, 0.92)"
                  : "var(--theme-color-base-content, #ffffff)",
                textShadow: isInsideVinyl ? "0 1px 4px rgba(0, 0, 0, 0.85)" : undefined,
              }}
            >
              {currentLyrics.plain ||
                currentLyrics.lines.map((l) => l.text).join("\n")}
            </div>
          </div>
        )}

        {/* Empty State / Not Found */}
        {!isLoadingLyrics && !currentLyrics && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3.5 py-12 px-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-base-content/[0.05] border border-base-content/[0.08] flex items-center justify-center text-neutral">
              <FileText size={26} className="opacity-50" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-base-content">
                No Lyrics Available
              </h3>
              <p className="text-xs text-neutral mt-1">
                Lyrics for &ldquo;{currentTrack?.title ?? "this track"}&rdquo; were not found in tags or online.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => currentTrack && loadLyrics(currentTrack, true)}
                disabled={isLoadingLyrics}
                className="px-3 py-1.5 rounded-xl bg-base-content/[0.08] hover:bg-base-content/[0.14] text-base-content text-xs font-bold border border-base-content/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Globe size={13} className={isLoadingLyrics ? "animate-spin" : "text-[var(--primary,#00d2ff)]"} />
                <span>Search LRCLIB</span>
              </button>

              <button
                type="button"
                onClick={handleYouTubeCaptionsSearch}
                disabled={isSearchingYouTube}
                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold border border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Radio size={13} className={isSearchingYouTube ? "animate-spin" : ""} />
                <span>YouTube Captions</span>
              </button>
            </div>

            {/* Manual search bar */}
            <div className="w-full flex items-center gap-2 mt-2">
              <input
                type="text"
                dir="auto"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                placeholder="Search by song or artist..."
                className="input input-primary w-full text-xs h-8 px-3 rounded-lg bg-base-content/[0.06] border border-base-content/10"
              />
              <SarvButton
                variant="primary"
                size="sm"
                onClick={handleManualSearch}
                disabled={isSearchingManual || !manualQuery.trim()}
                icon={<Search size={12} />}
                className="text-xs shrink-0"
              >
                Search
              </SarvButton>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <SarvButton
                variant="soft"
                styleType="soft"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload size={12} />}
                className="text-xs"
              >
                Upload .LRC
              </SarvButton>
            </div>
          </div>
        )}
      </div>

      {/* Re-center indicator if user scrolled away */}
      {currentLyrics?.synced && userInteracted && autoScroll && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
          <button
            type="button"
            onClick={() => {
              setUserInteracted(false);
              isFirstScrollRef.current = false;
            }}
            className="px-3 py-1 rounded-full text-[11px] font-bold bg-[var(--theme-color-primary,#0066a4)] text-white shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <Sparkles size={11} />
            <span>Jump to Current Verse</span>
          </button>
        </div>
      )}
    </div>
  );
}
