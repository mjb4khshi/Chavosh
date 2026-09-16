import React, { useState, useRef, useEffect } from "react";
import { X, Check, Palette, Sliders, Zap, Pin, Sparkles, Monitor, ChevronDown } from "lucide-react";
import { usePlayerStore } from "../stores/playerStore";
import { setAlwaysOnTop } from "../utils/window";

export const SARV_THEMES = [
  { id: "persian-dark", name: "Iranian Dark", persianName: "اصیل ایرانی (تیره)", dot: "#0066a4" },
  { id: "persian-light", name: "Iranian Light", persianName: "روشن ایرانی", dot: "#0066a4" },
  { id: "cyberpunk", name: "Cyberpunk Neon", persianName: "سایبرپانک نئون", dot: "#00f0ff" },
  { id: "tokyo-midnight", name: "Karaj Midnight", persianName: "کرج نیمه‌شب", dot: "#8b5cf6" },
  { id: "ocean-abyss", name: "Persian Gulf", persianName: "خلیج فارس", dot: "#06b6d4" },
  { id: "emerald", name: "Emerald Forest", persianName: "زمرد کهنسال", dot: "#10b981" },
  { id: "royal-purple", name: "Royal Purple", persianName: "بنفش سلطنتی", dot: "#a855f7" },
  { id: "crimson", name: "Crimson Velvet", persianName: "زرشکی مخمل", dot: "#f43f5e" },
  { id: "coffee-roast", name: "Coffee Roast", persianName: "اسپرسو و شکلات", dot: "#d97706" },
  { id: "sunset", name: "Robat Karim Sunset", persianName: "غروب رباط کریم", dot: "#ff5e36" },
  { id: "matcha", name: "Matcha Blossom", persianName: "ماچا بهاری", dot: "#15803d" },
  { id: "nordic", name: "Nordic Glacier", persianName: "یخچال نوردیک", dot: "#0284c7" },
  { id: "rose-gold", name: "Rose Gold", persianName: "رز گلد براق", dot: "#e11d48" },
  { id: "persian-dark-sharp", name: "Dark Sharp", persianName: "زاویه‌دار تیره", dot: "#0066a4" },
  { id: "persian-light-sharp", name: "Light Sharp", persianName: "زاویه‌دار روشن", dot: "#0066a4" },
];

interface SwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

function SarvSwitch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="w-12 h-6.5 rounded-full relative transition-all duration-300 shrink-0 cursor-pointer p-0.5 border"
      style={{
        background: checked
          ? "var(--primary, var(--theme-color-primary, #0066a4))"
          : "color-mix(in oklab, var(--theme-color-base-content, #fff) 12%, transparent)",
        borderColor: checked
          ? "var(--primary, var(--theme-color-primary, #0066a4))"
          : "color-mix(in oklab, var(--theme-color-base-content, #fff) 18%, transparent)",
        boxShadow: checked
          ? "0 0 12px color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 50%, transparent)"
          : "none",
      }}
    >
      <div
        className="w-5 h-5 rounded-full shadow-md transition-transform duration-300"
        style={{
          background: checked ? "var(--theme-color-primary-content, #ffffff)" : "var(--theme-color-base-content, #ffffff)",
          transform: checked ? "translateX(22px)" : "translateX(1px)",
        }}
      />
    </button>
  );
}

export function SettingsModal() {
  const settings = usePlayerStore((s) => s.settings);
  const updateSettings = usePlayerStore((s) => s.updateSettings);
  const setShowSettings = usePlayerStore((s) => s.setShowSettings);
  const alwaysOnTop = usePlayerStore((s) => s.alwaysOnTop);
  const toggleAlwaysOnTop = usePlayerStore((s) => s.toggleAlwaysOnTop);

  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const currentTheme =
    SARV_THEMES.find((t) => t.id === settings.theme) || SARV_THEMES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTogglePin = async () => {
    const nextVal = !alwaysOnTop;
    toggleAlwaysOnTop();
    await setAlwaysOnTop(nextVal);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md select-none animate-fadeIn"
      onClick={() => setShowSettings(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="sarv-card w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-base-content/10"
        style={{
          background:
            "color-mix(in oklab, var(--theme-color-base-500, #141620) 78%, var(--theme-color-base, #07080c))",
          backdropFilter: "blur(36px)",
          WebkitBackdropFilter: "blur(36px)",
          color: "var(--theme-color-base-content, #ffffff)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-content/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-inner"
              style={{
                background:
                  "color-mix(in oklab, var(--primary, var(--theme-color-primary, #0066a4)) 22%, transparent)",
              }}
            >
              <Palette
                size={16}
                style={{ color: "var(--primary, var(--theme-color-primary, #0066a4))" }}
              />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-base-content">
                Settings & Appearance
              </h2>
              <p className="text-[11px] text-neutral">تنظیمات ظاهر، پخش و پنجره چاووش</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-base-content/10 text-neutral hover:text-base-content transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Themes Section - Compact Sarv UI Selector */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={14}
                  style={{ color: "var(--primary, var(--theme-color-primary, #0066a4))" }}
                />
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/85">
                  Color Theme (تم برنامه)
                </h3>
              </div>
              <span className="text-[11px] text-neutral font-mono">15 Sarv Themes</span>
            </div>

            {/* Compact Sarv UI Dropdown Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer bg-base-content/[0.04] border-base-content/[0.1] hover:border-base-content/[0.2] hover:bg-base-content/[0.07]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-md ring-2 ring-base-content/15"
                    style={{ background: currentTheme.dot }}
                  />
                  <div className="text-right flex items-center gap-2 truncate">
                    <span className="text-xs font-bold text-base-content">
                      {currentTheme.name}
                    </span>
                    <span className="text-[11px] text-neutral truncate">
                      ({currentTheme.persianName})
                    </span>
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-neutral shrink-0 transition-transform duration-200 ${
                    themeDropdownOpen ? "rotate-180 text-base-content" : ""
                  }`}
                />
              </button>

              {/* Theme Dropdown Menu */}
              {themeDropdownOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-2xl border shadow-2xl max-h-60 overflow-y-auto space-y-1 animate-fadeIn"
                  style={{
                    background:
                      "color-mix(in oklab, var(--theme-color-base-500, #141620) 92%, var(--theme-color-base, #07080c))",
                    borderColor:
                      "color-mix(in oklab, var(--theme-color-base-content, #fff) 14%, transparent)",
                    backdropFilter: "blur(24px)",
                  }}
                >
                  {SARV_THEMES.map((t) => {
                    const isSelected = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          updateSettings({ theme: t.id });
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[color-mix(in_oklab,var(--primary,var(--theme-color-primary,#0066a4))_18%,transparent)]"
                            : "hover:bg-base-content/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-1 ring-base-content/20"
                            style={{ background: t.dot }}
                          />
                          <span
                            className="text-xs font-semibold truncate"
                            style={{
                              color: isSelected
                                ? "var(--primary, var(--theme-color-primary, #0066a4))"
                                : "var(--theme-color-base-content, #ffffff)",
                            }}
                          >
                            {t.name}
                          </span>
                          <span className="text-[10px] text-neutral truncate">
                            {t.persianName}
                          </span>
                        </div>
                        {isSelected && (
                          <Check
                            size={14}
                            style={{
                              color: "var(--primary, var(--theme-color-primary, #0066a4))",
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Audio Engine & Crossfade Section */}
          <section className="space-y-3 pt-4 border-t border-base-content/10">
            <div className="flex items-center gap-2">
              <Sliders
                size={14}
                style={{ color: "var(--primary, var(--theme-color-primary, #0066a4))" }}
              />
              <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/85">
                Playback Engine (موتور پخش)
              </h3>
            </div>

            {/* Crossfade Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-base-content/[0.03] border border-base-content/[0.08] hover:border-base-content/[0.14] transition-colors">
              <div className="min-w-0 pr-3">
                <div className="text-xs font-bold text-base-content">
                  Seamless Track Crossfade
                </div>
                <div className="text-[11px] text-neutral mt-0.5">
                  فید و پیوند روان بین آهنگ‌های متوالی در صف پخش
                </div>
              </div>
              <SarvSwitch
                checked={settings.crossfadeEnabled}
                onChange={(val) => updateSettings({ crossfadeEnabled: val })}
              />
            </div>

            {settings.crossfadeEnabled && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-base-content/[0.02] border border-base-content/[0.06] animate-fadeIn">
                <span className="text-xs text-base-content/80">Crossfade Duration:</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={settings.crossfadeDuration}
                    onChange={(e) =>
                      updateSettings({ crossfadeDuration: Number(e.target.value) })
                    }
                    className="w-32 cursor-pointer accent-[var(--primary,var(--theme-color-primary,#0066a4))]"
                  />
                  <span className="text-xs font-mono w-6 text-center text-base-content font-bold">
                    {settings.crossfadeDuration}s
                  </span>
                </div>
              </div>
            )}

            {/* Remix Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-base-content/[0.03] border border-base-content/[0.08] hover:border-base-content/[0.14] transition-colors">
              <div className="min-w-0 pr-3">
                <div className="text-xs font-bold text-base-content flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-400 fill-amber-400" />
                  Party Remix Engine
                </div>
                <div className="text-[11px] text-neutral mt-0.5">
                  میکس خودکار پرانرژی‌ترین بخش‌های ۳۰ الی ۵۰ ثانیه‌ای برای مهمانی
                </div>
              </div>
              <SarvSwitch
                checked={settings.remixEnabled}
                onChange={(val) => updateSettings({ remixEnabled: val })}
              />
            </div>
          </section>

          {/* Window & Visual Settings */}
          <section className="space-y-3 pt-4 border-t border-base-content/10">
            <div className="flex items-center gap-2">
              <Monitor
                size={14}
                style={{ color: "var(--primary, var(--theme-color-primary, #0066a4))" }}
              />
              <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/85">
                Window & Visuals (پنجره و جلوه‌ها)
              </h3>
            </div>

            {/* Always on Top */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-base-content/[0.03] border border-base-content/[0.08] hover:border-base-content/[0.14] transition-colors">
              <div className="min-w-0 pr-3">
                <div className="text-xs font-bold text-base-content flex items-center gap-1.5">
                  <Pin
                    size={13}
                    style={{
                      color: alwaysOnTop
                        ? "var(--primary, var(--theme-color-primary, #0066a4))"
                        : "currentColor",
                    }}
                  />
                  Always on Top (پین روی تمام برنامه‌ها)
                </div>
                <div className="text-[11px] text-neutral mt-0.5">
                  نگه‌داشتن پنجره چاووش در بالاترین لایه دسکتاپ
                </div>
              </div>
              <SarvSwitch checked={alwaysOnTop} onChange={handleTogglePin} />
            </div>

            {/* Dynamic Album Cover Sync */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-base-content/[0.03] border border-base-content/[0.08] hover:border-base-content/[0.14] transition-colors">
              <div className="min-w-0 pr-3">
                <div className="text-xs font-bold text-base-content">
                  Dynamic Album Art Color Sync
                </div>
                <div className="text-[11px] text-neutral mt-0.5">
                  تغییر هوشمند رنگ تم به رنگ غالب و زنده کاور آهنگ جاری
                </div>
              </div>
              <SarvSwitch
                checked={settings.coverTint}
                onChange={(val) => updateSettings({ coverTint: val })}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}