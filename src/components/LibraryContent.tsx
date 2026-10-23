import {
  Play,
  Shuffle,
  Music2,
  FolderOpen,
  Heart,
  Clock,
  Disc3,
  User,
  FolderPlus,
  ArrowLeft,
  Sparkles,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import { usePlayerStore, type Track } from "../stores/playerStore";
import { formatTime } from "../utils/format";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useState, useRef, useEffect } from "react";
import { isTauri, parseAudioFiles, loadSampleTracks } from "../utils/browserAudio";
import { loadTrackCover } from "../utils/coverLoader";
import SarvBadge from "./sarv/SarvBadge";
import SarvButton from "./sarv/SarvButton";
import SarvStatCard from "./sarv/SarvStatCard";
import { CoverEditModal } from "./CoverEditModal";

function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[آأإ]/g, "ا")
    .trim();
}

function LazyTrackCover({ path, className = "w-10 h-10 rounded-lg" }: { path: string; className?: string }) {
  // Subscribe ONLY to this specific track's cover, preventing 90,000 global re-renders
  const cover = usePlayerStore((s) => s.coverCache[path]);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (cover !== undefined) return;
    const el = containerRef.current;
    if (!el) return;

    // Load only when scrolled near or inside viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [cover]);

  useEffect(() => {
    if (!isVisible || !path || cover !== undefined) return;
    loadTrackCover(path);
  }, [isVisible, path, cover]);

  return (
    <div
      ref={containerRef}
      className={`${className} overflow-hidden bg-base-content/[0.06] shrink-0 flex items-center justify-center border border-base-content/10`}
    >
      {cover ? (
        <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <Disc3 size={15} className="opacity-35 text-base-content" />
      )}
    </div>
  );
}

/**
 * Sarv UI Spacing System (4px grid)
 * Content: px-6 py-5 - stat grid gap-3 mb-5 - section header pb-3 mb-5
 * Track rows: px-3 py-2 gap-3 - grids gap-3 - cards p-3 (grid) / p-5 (hero)
 */
export function LibraryContent() {
  const activeTab = usePlayerStore((s) => s.activeTab);
  const tracks = usePlayerStore((s) => s.tracks);
  const addTracks = usePlayerStore((s) => s.addTracks);
  const folders = usePlayerStore((s) => s.folders);
  const setFolders = usePlayerStore((s) => s.setFolders);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrack = usePlayerStore((s) => {
    const list = s.shuffle && s.shuffleQueue ? s.shuffleQueue : s.queue;
    return list[s.queueIndex] ?? null;
  });
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const searchQuery = usePlayerStore((s) => s.searchQuery);
  const favorites = usePlayerStore((s) => s.favorites);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const coverCache = usePlayerStore((s) => s.coverCache);
  const selectedArtist = usePlayerStore((s) => s.selectedArtist);
  const setSelectedArtist = usePlayerStore((s) => s.setSelectedArtist);
  const selectedAlbum = usePlayerStore((s) => s.selectedAlbum);
  const setSelectedAlbum = usePlayerStore((s) => s.setSelectedAlbum);
  const setActiveTab = usePlayerStore((s) => s.setActiveTab);

  const [scanning, setScanning] = useState(false);
  const [coverEditTrack, setCoverEditTrack] = useState<Track | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const coverEditModalNode = coverEditTrack ? (
    <CoverEditModal
      track={coverEditTrack}
      currentCover={coverCache[coverEditTrack.path] ?? null}
      onClose={() => setCoverEditTrack(null)}
    />
  ) : null;

  const handleAddFolder = async () => {
    if (!isTauri()) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const selected = await open({ directory: true, multiple: true });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      setScanning(true);
      const newTracks = await invoke<Track[]>("scan_folders", { folders: paths });
      addTracks(newTracks);
      setFolders([...new Set([...folders, ...paths])]);
    } catch (e) {
      console.error("Failed to scan folders via Tauri:", e);
      fileInputRef.current?.click();
    } finally {
      setScanning(false);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to top and reset album/artist view when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      if (selectedArtist) setSelectedArtist(null);
      if (selectedAlbum) setSelectedAlbum(null);
      if (activeTab !== "tracks") setActiveTab("tracks");
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery]);

  const filtered = tracks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = normalizeText(searchQuery);
    return (
      normalizeText(t.title || "").includes(q) ||
      normalizeText(t.artist || "").includes(q) ||
      normalizeText(t.album || "").includes(q)
    );
  });

  const totalDuration = filtered.reduce((acc, t) => acc + (t.duration || 0), 0);

  const albumsMap = new Map<string, Track[]>();
  filtered.forEach((t) => {
    const albumName = t.album || "Unknown Album";
    const list = albumsMap.get(albumName) || [];
    list.push(t);
    albumsMap.set(albumName, list);
  });

  const artistsMap = new Map<string, Track[]>();
  filtered.forEach((t) => {
    const artistName = t.artist || "Unknown Artist";
    const list = artistsMap.get(artistName) || [];
    list.push(t);
    artistsMap.set(artistName, list);
  });

  // Shared Track Row: full = 6 columns (cover + album), compact = 4 columns
  const renderTrackRow = (
    t: Track,
    list: Track[],
    idx: number,
    variant: "full" | "compact",
    subLabel: "artist" | "album"
  ) => {
    const isCurrent = currentTrack?.id === t.id;
    const isFav = favorites.includes(t.id);
    const cover = coverCache[t.path];

    return (
      <div
        key={`${t.path || t.id}-${idx}`}
        onDoubleClick={() => playTrack(t, list)}
        className="group grid items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/[0.04]"
        style={{
          gridTemplateColumns:
            variant === "full"
              ? "32px 40px minmax(160px, 1fr) minmax(90px, 180px) 64px 36px"
              : "32px 1fr 64px 36px",
          background: isCurrent
            ? "color-mix(in oklab, var(--theme-color-primary, #0066a4) 14%, transparent)"
            : "transparent",
          border: isCurrent
            ? "1px solid color-mix(in oklab, var(--theme-color-primary, #0066a4) 30%, transparent)"
            : "1px solid transparent",
        }}
      >
        <div className="flex items-center justify-center text-xs">
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5">
              <span className="w-0.5 bg-[var(--theme-color-primary,#0066a4)] rounded-full eq-bar-1" />
              <span className="w-0.5 bg-[var(--theme-color-primary,#0066a4)] rounded-full eq-bar-2" />
              <span className="w-0.5 bg-[var(--theme-color-primary,#0066a4)] rounded-full eq-bar-3" />
            </div>
          ) : (
            <>
              <span
                className="font-mono text-xs text-base-content/40 group-hover:hidden"
                style={{ color: isCurrent ? "var(--theme-color-primary,#0066a4)" : undefined }}
              >
                {t.track_number ?? idx + 1}
              </span>
              <button
                onClick={() => playTrack(t, list)}
                className="hidden group-hover:flex items-center justify-center text-[var(--theme-color-primary,#0066a4)] cursor-pointer"
                title="Play"
              >
                <Play size={13} className="fill-current" />
              </button>
            </>
          )}
        </div>

        {variant === "full" && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setCoverEditTrack(t);
            }}
            className="w-10 h-10 rounded-lg relative overflow-hidden group/thumb cursor-pointer shrink-0 border border-base-content/10 shadow-sm"
            title="تغییر کاور این قطعه / Fix Cover"
          >
            <LazyTrackCover path={t.path} className="w-full h-full" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
              <ImageIcon size={13} className="text-[var(--primary,#0066a4)]" />
            </div>
          </div>
        )}

        <div className="min-w-0">
          <div
            className="text-xs font-bold truncate leading-tight"
            style={{
          color: isCurrent
            ? "var(--theme-color-primary,#0066a4)"
            : "var(--theme-color-base-content, #ffffff)",
        }}
          >
            {t.title}
          </div>
          <div className="text-[11px] text-neutral truncate mt-0.5">
            {subLabel === "artist" ? t.artist : t.album}
          </div>
        </div>

        {variant === "full" && (
          <div className="text-xs text-neutral truncate hidden md:block">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAlbum(t.album);
              }}
              className="hover:underline cursor-pointer text-left truncate max-w-full"
            >
              {t.album}
            </button>
          </div>
        )}

        <div className="text-xs font-mono text-neutral text-right">{formatTime(t.duration)}</div>

        <div className="flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(t.id);
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isFav ? "opacity-100" : "opacity-0 group-hover:opacity-60"
            }`}
            style={{ color: isFav ? "var(--theme-color-accent,#fe28a2)" : "rgba(255,255,255,0.4)" }}
            title={isFav ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart size={13} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    );
  };
  // 1. ARTIST DETAIL VIEW
  if (activeTab === "artists" && selectedArtist) {
    const artistTracks = artistsMap.get(selectedArtist) || [];
    const artistAlbumsMap = new Map<string, Track[]>();
    artistTracks.forEach((t) => {
      const list = artistAlbumsMap.get(t.album) || [];
      list.push(t);
      artistAlbumsMap.set(t.album, list);
    });
    const artistDuration = artistTracks.reduce((acc, t) => acc + t.duration, 0);
    const trackWithCover = artistTracks.find((t) => coverCache[t.path]);
    const artistCover = trackWithCover ? coverCache[trackWithCover.path] : null;

    return (
      <main className="flex-1 flex flex-col overflow-hidden select-none relative">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <SarvButton
            variant="soft"
            styleType="soft"
            size="sm"
            onClick={() => setSelectedArtist(null)}
            className="mb-5 text-xs"
            icon={<ArrowLeft size={13} />}
          >
            Back to Artists
          </SarvButton>

          {/* Artist Hero */}
          <div className="sarv-card p-5 flex flex-col md:flex-row items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-base-content/10 shadow-xl flex items-center justify-center bg-base-content/[0.06]">
              {artistCover ? (
                <img src={artistCover} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-base-content/40" />
              )}
            </div>

            <div className="min-w-0 flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <SarvBadge variant="primary" soft size="xs" className="font-bold uppercase tracking-wider">
                  Artist Profile
                </SarvBadge>
                <SarvBadge variant="neutral" soft size="xs">
                  {artistTracks.length} tracks
                </SarvBadge>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-base-content mt-1.5 truncate">
                {selectedArtist}
              </h1>

              <div className="text-xs text-neutral mt-1 font-medium flex items-center justify-center md:justify-start gap-2">
                <span>{artistAlbumsMap.size} Albums</span>
                <span>-</span>
                <span>{Math.round(artistDuration / 60)} minutes total</span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                <SarvButton
                  variant="primary"
                  size="sm"
                  onClick={() => playQueue(artistTracks, 0)}
                  icon={<Play size={13} className="fill-current" />}
                  className="font-bold"
                >
                  Play All Songs
                </SarvButton>
                <SarvButton
                  variant="soft"
                  styleType="soft"
                  size="sm"
                  onClick={() => {
                    const shuffled = [...artistTracks].sort(() => Math.random() - 0.5);
                    playQueue(shuffled, 0);
                  }}
                  icon={<Shuffle size={13} />}
                  className="font-semibold"
                >
                  Shuffle Artist
                </SarvButton>
              </div>
            </div>
          </div>

          {/* Albums by this Artist */}
          {artistAlbumsMap.size > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-neutral">
                  Albums by {selectedArtist}
                </h2>
                <SarvBadge variant="neutral" soft size="xs">
                  {artistAlbumsMap.size} Releases
                </SarvBadge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from(artistAlbumsMap.entries()).map(([albumName, aTracks]) => {
                  const tCover = aTracks.find((t) => coverCache[t.path]);
                  const albCover = tCover ? coverCache[tCover.path] : null;

                  return (
                    <div
                      key={albumName}
                      onClick={() => setSelectedAlbum(albumName)}
                      className="sarv-card sarv-card-hover p-3 rounded-2xl flex flex-col gap-2.5 cursor-pointer group"
                    >
                      <div className="aspect-square rounded-xl relative overflow-hidden bg-base-content/[0.06] flex items-center justify-center border border-base-content/10">
                        {albCover ? (
                          <img src={albCover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Disc3 size={26} className="text-base-content/30" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-base-content group-hover:text-[var(--theme-color-primary,#0066a4)] transition-colors">
                          {albumName}
                        </div>
                        <div className="text-[11px] text-neutral truncate mt-0.5">
                          {aTracks.length} tracks
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Songs */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral mb-2">
              All Songs ({artistTracks.length})
            </h2>

            <div className="flex flex-col gap-0.5 pb-10">
              {artistTracks.map((t, idx) => renderTrackRow(t, artistTracks, idx, "full", "album"))}
            </div>
          </div>
        </div>
        {coverEditModalNode}
      </main>
    );
  }
  // 2. ALBUM DETAIL VIEW
  if (selectedAlbum) {
    const albumTracks = albumsMap.get(selectedAlbum) || [];
    const trackWithCover = albumTracks.find((t) => coverCache[t.path]);
    const albumCover = trackWithCover ? coverCache[trackWithCover.path] : null;
    const albumDuration = albumTracks.reduce((acc, t) => acc + t.duration, 0);
    const albumArtist = albumTracks[0]?.artist ?? "Unknown Artist";
    const albumYear = albumTracks.find((t) => t.year)?.year;

    return (
      <main className="flex-1 flex flex-col overflow-hidden select-none relative">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <SarvButton
            variant="soft"
            styleType="soft"
            size="sm"
            onClick={() => setSelectedAlbum(null)}
            className="mb-5 text-xs"
            icon={<ArrowLeft size={13} />}
          >
            Back to Albums
          </SarvButton>

          {/* Album Hero */}
          <div className="sarv-card p-5 flex flex-col md:flex-row items-center gap-5 mb-6">
            <div
              onClick={() => {
                if (albumTracks[0]) setCoverEditTrack(albumTracks[0]);
              }}
              className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-base-content/10 shadow-xl flex items-center justify-center bg-base-content/[0.06] relative group cursor-pointer"
              title="تغییر کاور آلبوم / Fix Album Cover"
            >
              {albumCover ? (
                <img src={albumCover} alt="" className="w-full h-full object-cover" />
              ) : (
                <Disc3 size={36} className="text-base-content/40" />
              )}
              <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity">
                <ImageIcon size={18} className="text-[var(--primary,#0066a4)]" />
                <span className="text-[10px] font-bold">Fix Cover</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <SarvBadge variant="primary" soft size="xs" className="font-bold uppercase tracking-wider">
                  Album Release
                </SarvBadge>
                {albumYear && (
                  <SarvBadge variant="neutral" soft size="xs">
                    {albumYear}
                  </SarvBadge>
                )}
              </div>

              <h1 className="text-2xl font-black tracking-tight text-base-content mt-1.5 truncate">
                {selectedAlbum}
              </h1>

              <div
                onClick={() => setSelectedArtist(albumArtist)}
                className="text-xs text-base-content/80 mt-1 font-semibold hover:underline cursor-pointer"
              >
                {albumArtist}
              </div>

              <div className="text-xs text-neutral mt-1 font-medium">
                {albumTracks.length} songs - {Math.round(albumDuration / 60)} minutes
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                <SarvButton
                  variant="primary"
                  size="sm"
                  onClick={() => playQueue(albumTracks, 0)}
                  icon={<Play size={13} className="fill-current" />}
                  className="font-bold"
                >
                  Play Album
                </SarvButton>
                <SarvButton
                  variant="soft"
                  styleType="soft"
                  size="sm"
                  onClick={() => {
                    const shuffled = [...albumTracks].sort(() => Math.random() - 0.5);
                    playQueue(shuffled, 0);
                  }}
                  icon={<Shuffle size={13} />}
                  className="font-semibold"
                >
                  Shuffle Album
                </SarvButton>
              </div>
            </div>
          </div>

          {/* Tracklist */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral mb-2">
              Tracklist ({albumTracks.length})
            </h2>

            <div className="flex flex-col gap-0.5 pb-10">
              {albumTracks.map((t, idx) => renderTrackRow(t, albumTracks, idx, "compact", "artist"))}
            </div>
          </div>
        </div>
        {coverEditModalNode}
      </main>
    );
  }
  // 3. MAIN VIEWS (SONGS, ALBUMS, ARTISTS, FOLDERS)
  return (
    <main className="flex-1 flex flex-col overflow-hidden select-none relative">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-5">
        {/* Sarv Bento Metrics Grid */}
        {activeTab === "tracks" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <SarvStatCard
              icon={Music2}
              label="TOTAL TRACKS"
              value={filtered.length}
              subtitle="In your library"
              accent="primary"
            />
            <SarvStatCard
              icon={Clock}
              label="DURATION"
              value={`${Math.round(totalDuration / 60)}m`}
              subtitle="Listening runtime"
              accent="accent"
            />
            <SarvStatCard
              icon={User}
              label="ARTISTS"
              value={artistsMap.size}
              subtitle="Unique performers"
              accent="secondary"
              onClick={() => setActiveTab("artists")}
            />
            <SarvStatCard
              icon={Disc3}
              label="ALBUMS"
              value={albumsMap.size}
              subtitle="Full collections"
              accent="success"
              onClick={() => setActiveTab("albums")}
            />
          </div>
        )}

        {/* Section Title & Action Bar */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/[0.06] mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-base-content truncate">
                {activeTab === "tracks"
                  ? "All Songs"
                  : activeTab === "albums"
                  ? "Albums"
                  : activeTab === "artists"
                  ? "Artists"
                  : "Music Folders"}
              </h1>
              <SarvBadge variant="primary" soft size="xs" className="font-mono shrink-0">
                {activeTab === "tracks"
                  ? `${filtered.length}`
                  : activeTab === "albums"
                  ? `${albumsMap.size}`
                  : activeTab === "artists"
                  ? `${artistsMap.size}`
                  : `${folders.length}`}
              </SarvBadge>
            </div>
            <p className="text-[11px] text-neutral mt-0.5 truncate">
              {activeTab === "tracks"
                ? `Showing ${filtered.length} tracks across all scanned directories`
                : activeTab === "albums"
                ? `${albumsMap.size} albums organized by title`
                : activeTab === "artists"
                ? "Browse your music catalog by performer"
                : "Manage scanned directory paths"}
            </p>
          </div>

          {activeTab === "tracks" && (
            <div className="flex items-center gap-2 shrink-0">
              <SarvButton
                variant="primary"
                size="sm"
                onClick={() => playQueue(filtered, 0)}
                disabled={filtered.length === 0}
                icon={<Play size={13} className="fill-current" />}
                className="font-bold"
              >
                Play All
              </SarvButton>
              <SarvButton
                variant="soft"
                styleType="soft"
                size="sm"
                onClick={() => {
                  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
                  playQueue(shuffled, 0);
                }}
                disabled={filtered.length === 0}
                icon={<Shuffle size={13} />}
                className="font-semibold"
              >
                Shuffle
              </SarvButton>
            </div>
          )}
        </div>

        {/* Empty State */}
        {tracks.length === 0 && (
          <div className="sarv-card p-10 flex flex-col items-center justify-center text-center gap-3.5 my-6 relative overflow-hidden">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="audio/*"
              className="hidden"
              onChange={async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setScanning(true);
                  try {
                    await parseAudioFiles(e.target.files);
                  } finally {
                    setScanning(false);
                    e.target.value = "";
                  }
                }
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-base-content/[0.06] flex items-center justify-center text-[var(--theme-color-primary,#0066a4)] shadow-inner">
              <FolderPlus size={26} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-base-content">Your Music Library is Empty</h2>
              <p className="text-xs text-neutral mt-1 max-w-sm">
                Add your MP3, FLAC, WAV, M4A, or OGG files, or load sample tracks to test the player.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <SarvButton
                variant="primary"
                size="sm"
                onClick={handleAddFolder}
                disabled={scanning}
                icon={<FolderPlus size={13} />}
                className="font-bold"
              >
                {scanning ? "Scanning..." : isTauri() ? "Select Music Folder" : "Add Audio Files"}
              </SarvButton>
              <SarvButton
                variant="soft"
                styleType="soft"
                size="sm"
                onClick={() => loadSampleTracks()}
                icon={<Sparkles size={13} />}
              >
                Load Demo Tracks
              </SarvButton>
            </div>
            <div className="text-[11px] text-base-content/40 mt-1">
              Tip: You can also drag & drop audio files directly into this window
            </div>
          </div>
        )}

        {/* Tracks Table View */}
        {activeTab === "tracks" && tracks.length > 0 && (
          <div>
            <div
              className="grid items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral/80 border-b border-white/[0.06]"
              style={{ gridTemplateColumns: "32px 40px minmax(160px, 1fr) minmax(90px, 180px) 64px 36px" }}
            >
              <span className="text-center">#</span>
              <span />
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <span className="flex items-center justify-end">
                <Clock size={11} />
              </span>
              <span />
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-2.5 text-neutral">
                <Search size={30} className="opacity-30" />
                <p className="text-sm font-semibold text-base-content/75">No songs found</p>
                <p className="text-xs text-neutral">No tracks matching &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 mt-1 pb-10">
                {filtered.map((t, idx) => renderTrackRow(t, filtered, idx, "full", "artist"))}
              </div>
            )}
          </div>
        )}

        {/* Albums Grid View */}
        {activeTab === "albums" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-10">
            {Array.from(albumsMap.entries()).map(([albumName, albumTracks]) => {
              const trackWithCover = albumTracks.find((t) => coverCache[t.path]);
              const candidate = trackWithCover || albumTracks[0];
              const candidatePath = candidate?.path || "";

              return (
                <div
                  key={albumName}
                  onClick={() => setSelectedAlbum(albumName)}
                  className="sarv-card sarv-card-hover p-3 rounded-2xl flex flex-col gap-2.5 cursor-pointer group"
                >
                  <div className="aspect-square rounded-xl relative overflow-hidden bg-base-content/[0.06] flex items-center justify-center border border-base-content/10">
                    <LazyTrackCover path={candidatePath} className="w-full h-full rounded-xl" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playQueue(albumTracks, 0);
                      }}
                      className="w-9 h-9 rounded-full bg-[var(--theme-color-primary,#0066a4)] text-base-content flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all absolute bottom-2 right-2 hover:scale-105 cursor-pointer"
                      title="Play Album"
                    >
                      <Play size={14} className="ml-0.5 fill-current" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate text-base-content group-hover:text-[var(--theme-color-primary,#0066a4)] transition-colors">
                      {albumName}
                    </div>
                    <div className="text-[11px] text-neutral truncate mt-0.5 font-medium">
                      {albumTracks[0]?.artist ?? "Unknown"} - {albumTracks.length} tracks
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Artists Grid View */}
        {activeTab === "artists" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-10">
            {Array.from(artistsMap.entries()).map(([artistName, artistTracks]) => {
              const trackWithCover = artistTracks.find((t) => coverCache[t.path]);
              const candidate = trackWithCover || artistTracks[0];
              const candidatePath = candidate?.path || "";

              return (
                <div
                  key={artistName}
                  onClick={() => setSelectedArtist(artistName)}
                  className="sarv-card sarv-card-hover p-3 rounded-2xl flex items-center gap-3 cursor-pointer group"
                >
                  <LazyTrackCover path={candidatePath} className="w-10 h-10 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate text-base-content group-hover:text-[var(--theme-color-primary,#0066a4)] transition-colors">
                      {artistName}
                    </div>
                    <div className="text-[11px] text-neutral truncate mt-0.5 font-medium">
                      {artistTracks.length} tracks
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Folders View */}
        {activeTab === "folders" && (
          <div className="flex flex-col gap-2.5 pb-10">
            {folders.map((f) => (
              <div key={f} className="sarv-card p-3 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-base-content/[0.06] flex items-center justify-center shrink-0 text-[var(--theme-color-primary,#0066a4)]">
                  <FolderOpen size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate text-base-content">
                    {f.split(/[\\/]/).pop()}
                  </div>
                  <div className="text-[11px] text-neutral truncate font-mono mt-0.5">
                    {f}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {coverEditModalNode}
    </main>
  );
}