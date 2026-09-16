import { useState } from "react";
import {
  Pin,
  Minus,
  Square,
  X,
  Palette,
} from "lucide-react";
import {
  IconsaxCategory,
  IconsaxCd,
  IconsaxMiniWindow,
  IconsaxMagicStar,
  IconsaxGramophone,
  IconsaxSearch,
} from "./Iconsax";
import { motion } from "framer-motion";
import { usePlayerStore } from "../stores/playerStore";
import {
  startWindowDragging,
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow,
  setAlwaysOnTop,
} from "../utils/window";
import SarvBadge from "./sarv/SarvBadge";

/**
 * Sarv UI Spacing System (4px grid)
 * Header: h-14 (56px) - px-4 - gap-3; collapses gracefully on narrow widths
 */
export function Header() {
  const searchQuery = usePlayerStore((s) => s.searchQuery);
  const setSearchQuery = usePlayerStore((s) => s.setSearchQuery);
  const playerMode = usePlayerStore((s) => s.playerMode);
  const setPlayerMode = usePlayerStore((s) => s.setPlayerMode);
  const showNowPlayingOverlay = usePlayerStore((s) => s.showNowPlayingOverlay);
  const setShowNowPlayingOverlay = usePlayerStore((s) => s.setShowNowPlayingOverlay);
  const alwaysOnTop = usePlayerStore((s) => s.alwaysOnTop);
  const toggleAlwaysOnTop = usePlayerStore((s) => s.toggleAlwaysOnTop);
  const setShowSettings = usePlayerStore((s) => s.setShowSettings);

  const [pinFeedback, setPinFeedback] = useState(false);

  const handlePin = async () => {
    const nextVal = !alwaysOnTop;
    toggleAlwaysOnTop();
    await setAlwaysOnTop(nextVal);
    setPinFeedback(true);
    setTimeout(() => setPinFeedback(false), 1200);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.target as HTMLElement).closest("button, input, select, textarea, a")) {
      startWindowDragging();
    }
  };

  const modeItems = [
    {
      id: "library",
      icon: IconsaxCategory,
      label: "Library",
      active: playerMode === "library" && !showNowPlayingOverlay,
      onClick: () => {
        setShowNowPlayingOverlay(false);
        setPlayerMode("library");
      },
      title: "Desktop Library View",
    },
    {
      id: "vinyl",
      icon: IconsaxCd,
      label: "Vinyl",
      active: showNowPlayingOverlay,
      onClick: () => setShowNowPlayingOverlay(!showNowPlayingOverlay),
      title: "Vinyl Room (3D Turntable)",
    },
    {
      id: "mini",
      icon: IconsaxMiniWindow,
      label: "Mini",
      active: playerMode === "mini",
      onClick: () => setPlayerMode("mini"),
      title: "Compact Mini Bar Player",
    },
    {
      id: "nano",
      icon: IconsaxMagicStar,
      label: "Island",
      active: playerMode === "nano",
      onClick: () => setPlayerMode("nano"),
      title: "Dynamic Island Capsule",
    },
    {
      id: "gramophone",
      icon: IconsaxGramophone,
      label: "Widget",
      active: playerMode === "gramophone",
      onClick: () => setPlayerMode("gramophone"),
      title: "Floating Turntable Widget",
    },
  ];

  const iconBtn =
    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-base-content/65 hover:text-base-content hover:bg-base-content/[0.08]";

  return (
    <header
      onMouseDown={handleMouseDown}
      className="h-14 w-full flex items-center gap-3 px-4 select-none shrink-0 border-b border-base-content/[0.08] cursor-default relative z-30"
      style={{
        background:
          "color-mix(in oklab, var(--theme-color-base-500, #141620) 18%, var(--theme-color-base, #07080c))",
        backdropFilter: "blur(28px)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-[var(--radius-button)] relative overflow-hidden flex items-center justify-center shadow-md border border-base-content/10 bg-base-900">
          <img
            src="/logo.png"
            alt="Chavosh Logo"
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        <div className="hidden sm:flex flex-col leading-tight min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black tracking-widest uppercase text-base-content">CHAVOSH</span>
            <SarvBadge variant="primary" soft size="xs" className="font-mono">v0.1.0</SarvBadge>
          </div>
          <span className="text-[10px] text-neutral font-medium">Music Player</span>
        </div>
      </div>

      {/* Mode Switcher Capsule (fixed spacing & overflow) */}
      <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-base-content/[0.04] border border-base-content/[0.08] shrink-0">
        {modeItems.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={m.onClick}
            title={m.title}
            className={`relative flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              m.active ? "px-3 gap-1.5" : "w-8 hover:bg-base-content/[0.06] text-base-content/60 hover:text-base-content"
            }`}
            style={{
              color: m.active
                ? "var(--theme-color-primary-content, #fff)"
                : undefined,
            }}
          >
            {m.active && (
              <motion.span
                layoutId="header-mode-pill"
                className="absolute inset-0 rounded-lg z-0"
                style={{
                  background: "var(--primary, var(--theme-color-primary, #0066a4))",
                  boxShadow:
                    "0 2px 10px color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 40%, transparent)",
                }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <m.icon size={15} />
              {m.active && m.label && <span className="whitespace-nowrap text-[11px] font-bold">{m.label}</span>}
            </span>
          </button>
        ))}
      </div>

      {/* Search (Authentic Sarv UI Input Component System) */}
      <div className="flex-1 min-w-0 max-w-md mx-auto hidden sm:block">
        <div className="input-wrap w-full">
          <div className="input-box relative w-full flex items-center">
            <span
              className="absolute left-3 z-10 text-neutral pointer-events-none flex items-center justify-center transition-opacity duration-200"
              aria-hidden
            >
              <IconsaxSearch size={15} />
            </span>
            <input
              type="text"
              dir="auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists, albums..."
              className="input input-primary w-full text-xs transition-all text-base-content placeholder:text-neutral focus:outline-none"
              style={{
                borderRadius: "var(--radius-input, 0.85rem)",
                paddingLeft: "2.4rem",
                paddingRight: searchQuery ? "2.25rem" : "3.75rem",
                height: "2.25rem",
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-neutral hover:text-base-content hover:bg-base-content/10 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            ) : (
              <span className="absolute right-2.5 z-10 hidden lg:flex items-center pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-neutral bg-base-content/[0.06] rounded border border-base-content/10">
                  Ctrl K
                </kbd>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Pin, Themes & Window Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handlePin}
          title={alwaysOnTop ? "Always on Top: Active" : "Pin Always on Top"}
          className="relative h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          style={{
            background: alwaysOnTop
              ? "color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 22%, transparent)"
              : "color-mix(in srgb, var(--theme-color-base-content, #fff) 5%, transparent)",
            color: alwaysOnTop
              ? "var(--primary, var(--theme-color-primary, #0066a4))"
              : "color-mix(in srgb, var(--theme-color-base-content, #fff) 65%, transparent)",
            border: alwaysOnTop
              ? "1px solid var(--primary, var(--theme-color-primary, #0066a4))"
              : "1px solid transparent",
          }}
        >
          <Pin size={12} className={alwaysOnTop ? "rotate-45 fill-current" : ""} />
          <span className="hidden lg:inline text-[11px] font-bold">{alwaysOnTop ? "Pinned" : "Pin"}</span>
          {pinFeedback && (
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-lg bg-base-900 text-base-content whitespace-nowrap z-50 shadow-lg">
              {alwaysOnTop ? "Always On Top: ON" : "Always On Top: OFF"}
            </span>
          )}
        </button>

        <button type="button" onClick={() => setShowSettings(true)} title="Sarv UI Themes & Settings" className={iconBtn}>
          <Palette size={14} />
        </button>

        <div className="w-px h-5 bg-base-content/10 mx-1" />

        <button type="button" onClick={() => minimizeWindow()} title="Minimize" className={iconBtn}>
          <Minus size={13} />
        </button>
        <button type="button" onClick={() => toggleMaximizeWindow()} title="Maximize / Restore" className={iconBtn}>
          <Square size={11} />
        </button>
        <button type="button" onClick={() => closeWindow()} title="Close" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/80 hover:text-base-content transition-colors cursor-pointer text-base-content/65">
          <X size={14} />
        </button>
      </div>
    </header>
  );
}