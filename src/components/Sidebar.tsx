import { useState } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { RotateCw } from "lucide-react";
import {
  IconsaxMusic,
  IconsaxCd,
  IconsaxUser,
  IconsaxFolder,
  IconsaxSetting,
} from "./Iconsax";
import { usePlayerStore, type Track, type LibraryTab } from "../stores/playerStore";
import SarvBadge from "./sarv/SarvBadge";
import SarvButton from "./sarv/SarvButton";

/**
 * Sarv UI Spacing System (4px grid)
 * Sidebar: w-60 - p-3 - gap-3 between cards - cards p-2
 */
export function Sidebar() {
  const activeTab = usePlayerStore((s) => s.activeTab);
  const setActiveTab = usePlayerStore((s) => s.setActiveTab);
  const tracks = usePlayerStore((s) => s.tracks);
  const addTracks = usePlayerStore((s) => s.addTracks);
  const folders = usePlayerStore((s) => s.folders);
  const setFolders = usePlayerStore((s) => s.setFolders);
  const setShowSettings = usePlayerStore((s) => s.setShowSettings);
  const setShowNowPlayingOverlay = usePlayerStore((s) => s.setShowNowPlayingOverlay);

  const [scanning, setScanning] = useState(false);

  const uniqueAlbums = new Set(tracks.map((t) => t.album)).size;
  const uniqueArtists = new Set(tracks.map((t) => t.artist)).size;

  const handleAddFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: true });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      setScanning(true);
      const newTracks = await invoke<Track[]>("scan_folders", { folders: paths });
      addTracks(newTracks);
      setFolders([...new Set([...folders, ...paths])]);
    } catch (e) {
      console.error("Failed to scan folders:", e);
    } finally {
      setScanning(false);
    }
  };

  const handleRescan = async () => {
    if (folders.length === 0 || scanning) return;
    try {
      setScanning(true);
      const res = await invoke<Track[]>("scan_folders", { folders });
      addTracks(res);
    } catch (err) {
      console.error("Rescan failed:", err);
    } finally {
      setScanning(false);
    }
  };

  const navItems = [
    { id: "tracks" as LibraryTab, label: "Songs", icon: IconsaxMusic, count: tracks.length },
    { id: "albums" as LibraryTab, label: "Albums", icon: IconsaxCd, count: uniqueAlbums },
    { id: "artists" as LibraryTab, label: "Artists", icon: IconsaxUser, count: uniqueArtists },
    { id: "folders" as LibraryTab, label: "Directories", icon: IconsaxFolder, count: folders.length },
  ];

  return (
    <aside
      className="w-60 shrink-0 flex flex-col gap-3 p-3 select-none border-r border-base-content/[0.08] overflow-y-auto relative z-10"
      style={{
        background:
          "color-mix(in oklab, var(--theme-color-base-500, #141620) 14%, var(--theme-color-base, #07080c))",
      }}
    >
      {/* 1. Library Navigation Card */}
      <div className="sarv-card p-2 flex flex-col gap-0.5">
        <div className="px-2.5 pt-1.5 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-neutral">Library</span>
          <SarvBadge variant="primary" soft size="xs" className="font-mono">{tracks.length}</SarvBadge>
        </div>

        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`group relative flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-button)] text-xs transition-colors cursor-pointer ${
                  isActive
                    ? "font-bold"
                    : "font-medium text-base-content/70 hover:text-base-content hover:bg-base-content/[0.05]"
                }`}
                style={
                  isActive
                    ? { color: "var(--theme-color-primary, #0066a4)" }
                    : undefined
                }
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-nav-pill"
                    className="absolute inset-0 rounded-[var(--radius-button)] z-0"
                    style={{
                      background:
                        "color-mix(in oklab, var(--theme-color-primary, #0066a4) 14%, transparent)",
                      border: "1px solid color-mix(in oklab, var(--theme-color-primary, #0066a4) 28%, transparent)",
                    }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <div
                  className="relative z-10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    background: isActive
                      ? "var(--theme-color-primary, #0066a4)"
                      : "color-mix(in srgb, var(--theme-color-base-content) 6%, transparent)",
                    color: isActive
                      ? "var(--theme-color-primary-content, #ffffff)"
                      : "color-mix(in srgb, var(--theme-color-base-content) 70%, transparent)",
                  }}
                >
                  <Icon size={14} />
                </div>
                <span className="relative z-10 flex-1 text-left truncate">{item.label}</span>
                <SarvBadge
                  variant={isActive ? "primary" : "neutral"}
                  soft={!isActive}
                  size="xs"
                  className="font-mono shrink-0 relative z-10"
                >
                  {item.count}
                </SarvBadge>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Music Sources Card */}
      <div className="sarv-card p-2 flex flex-col gap-1">
        <div className="px-2.5 pt-1.5 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-neutral">Sources</span>
          {folders.length > 0 && (
            <button
              onClick={handleRescan}
              disabled={scanning}
              className="p-1 rounded-lg hover:bg-base-content/[0.08] transition-colors opacity-70 hover:opacity-100 cursor-pointer"
              style={{ color: "var(--theme-color-primary, #0066a4)" }}
              title="Rescan Library Folders"
            >
              <RotateCw size={12} className={scanning ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex flex-col gap-0.5 px-1 max-h-44">
          {folders.map((f) => {
            const folderName = f.split(/[\\/]/).pop() || f;
            return (
              <div
                key={f}
                title={f}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg group hover:bg-base-content/[0.05] transition-all text-base-content/65 hover:text-base-content cursor-default"
              >
                <IconsaxFolder
                  size={14}
                  className="shrink-0 opacity-60 group-hover:text-[var(--theme-color-primary,#0066a4)] group-hover:opacity-100 transition-colors"
                />
                <span className="truncate flex-1 font-medium text-[11px]">{folderName}</span>
              </div>
            );
          })}

          {folders.length === 0 && (
            <div className="px-2 py-5 text-center text-[11px] text-base-content/35 flex flex-col items-center gap-1.5">
              <IconsaxFolder size={20} className="opacity-30" />
              <span>No music folders</span>
            </div>
          )}
        </div>

        <div className="p-1 pt-1.5 border-t border-base-content/[0.08]">
          <SarvButton
            variant="soft"
            styleType="soft"
            size="sm"
            onClick={handleAddFolder}
            disabled={scanning}
            className="w-full gap-1.5"
            icon={<IconsaxFolder size={14} />}
          >
            Add Folder
          </SarvButton>
        </div>
      </div>

      {/* 3. Quick Actions Card */}
      <div className="sarv-card p-2 mt-auto flex flex-col gap-0.5">
        <button
          onClick={() => setShowNowPlayingOverlay(true)}
          className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold hover:bg-base-content/[0.06] text-base-content/80 hover:text-base-content transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-base-content/[0.06] flex items-center justify-center text-[var(--theme-color-primary,#0066a4)] group-hover:scale-105 transition-transform">
            <IconsaxCd size={14} />
          </div>
          <span className="flex-1 text-left">Vinyl Room</span>
          <SarvBadge variant="accent" soft size="xs">3D</SarvBadge>
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold hover:bg-base-content/[0.06] text-base-content/80 hover:text-base-content transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-base-content/[0.06] flex items-center justify-center text-base-content/50 group-hover:text-base-content group-hover:scale-105 transition-transform">
            <IconsaxSetting size={14} />
          </div>
          <span className="flex-1 text-left">Preferences</span>
        </button>
      </div>
    </aside>
  );
}