import React from "react";
import { Check, RotateCcw, Palette, X, Save, Sun, Moon, Monitor } from "lucide-react";
import {
  PRESET_THEMES,
  DEFAULT_THEME_ID,
  resolveTheme,
  applyThemeCssVars,
  UserThemePrefs,
  ColorMode,
} from "../lib/themes";

interface Props {
  isDarkMode: boolean;
  colorMode?: ColorMode;
  currentThemeId: string;
  currentCustomAccent: string | null;
  onSave: (prefs: UserThemePrefs) => Promise<void>;
  onCancel: () => void;
  platformDefaultThemeId?: string;
}

export default function ThemeCustomizer({
  isDarkMode,
  colorMode: initialColorMode = "light",
  currentThemeId,
  currentCustomAccent,
  onSave,
  onCancel,
  platformDefaultThemeId = DEFAULT_THEME_ID,
}: Props) {
  const [selectedId, setSelectedId] = React.useState(currentThemeId);
  const [customAccent, setCustomAccent] = React.useState(currentCustomAccent || "#2563EB");
  const [colorMode, setColorMode] = React.useState<ColorMode>(initialColorMode);
  const [saving, setSaving] = React.useState(false);

  // Derive display dark from colorMode
  const displayDark = colorMode === "dark"
    ? true
    : colorMode === "light"
      ? false
      : isDarkMode; // system: use current

  const bg = displayDark ? "#111827" : "#ffffff";
  const cardBg = displayDark ? "#1a2236" : "#F8FAFC";
  const border = displayDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const textMain = displayDark ? "#F1F5F9" : "#0F172A";
  const textSub = displayDark ? "#94A3B8" : "#64748B";
  const inputBg = displayDark ? "rgba(255,255,255,0.06)" : "#F8FAFC";

  // Live preview: apply theme immediately on selection
  const handleSelect = (id: string) => {
    setSelectedId(id);
    const theme = id === "custom" ? resolveTheme("custom", customAccent) : resolveTheme(id);
    applyThemeCssVars(theme);
  };

  const handleCustomAccentChange = (color: string) => {
    setCustomAccent(color);
    setSelectedId("custom");
    applyThemeCssVars(resolveTheme("custom", color));
  };

  const handleColorModeChange = (mode: ColorMode) => {
    setColorMode(mode);
    // Apply dark/light immediately to the DOM for live preview
    const dark = mode === "dark" ? true : mode === "light" ? false : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleReset = () => {
    setSelectedId(platformDefaultThemeId);
    setCustomAccent("#2563EB");
    setColorMode("light");
    applyThemeCssVars(resolveTheme(platformDefaultThemeId));
    document.documentElement.classList.remove("dark");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        themeId: selectedId,
        customAccent: selectedId === "custom" ? customAccent : null,
        colorMode,
      });
    } finally {
      setSaving(false);
    }
  };

  // Preview colors for display
  const previewTheme = selectedId === "custom"
    ? resolveTheme("custom", customAccent)
    : resolveTheme(selectedId);

  return (
    <div className="space-y-4 animate-fadeIn" style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: textMain }}>
            Theme Settings
          </h2>
          <p className="text-xs mt-0.5" style={{ color: textSub }}>
            Changes apply instantly across every page — header, sidebar, buttons, cards &amp; more.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="rounded-xl p-2 cursor-pointer"
          style={{ background: displayDark ? "rgba(255,255,255,0.06)" : "#F1F5F9", border: `1px solid ${border}`, color: textSub, minHeight: "auto" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Color Mode Selector ─────────────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: textSub, letterSpacing: "0.07em" }}>
          Color Mode
        </p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { mode: "light" as ColorMode, icon: <Sun className="h-4 w-4" />, label: "Light", desc: "Bright & clean" },
            { mode: "dark" as ColorMode,  icon: <Moon className="h-4 w-4" />, label: "Dark",  desc: "Easy on eyes" },
            { mode: "system" as ColorMode, icon: <Monitor className="h-4 w-4" />, label: "System", desc: "Follows OS" },
          ] as const).map(({ mode, icon, label, desc }) => {
            const active = colorMode === mode;
            return (
              <button
                key={mode}
                onClick={() => handleColorModeChange(mode)}
                className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background: active ? previewTheme.primaryBg : cardBg,
                  border: active ? `2px solid ${previewTheme.primary}` : `1.5px solid ${border}`,
                  boxShadow: active ? `0 0 0 3px ${previewTheme.primaryGlow}` : "none",
                  minHeight: "auto",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ color: active ? previewTheme.primary : textSub }}>{icon}</div>
                <span className="text-[11px] font-bold" style={{ color: active ? previewTheme.primary : textMain }}>{label}</span>
                <span className="text-[9px]" style={{ color: textSub }}>{desc}</span>
                {active && (
                  <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center" style={{ background: previewTheme.primary }}>
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Preset Theme Grid ───────────────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: textSub, letterSpacing: "0.07em" }}>
          Accent Color Theme
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {PRESET_THEMES.map((theme) => {
            const active = selectedId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className="relative rounded-xl p-2.5 cursor-pointer text-left flex flex-col items-center gap-1.5 transition-all"
                style={{
                  background: active
                    ? displayDark ? `rgba(${hexToRgbParts(theme.primary)},0.15)` : theme.primaryLight
                    : cardBg,
                  border: active ? `2px solid ${theme.primary}` : `1.5px solid ${border}`,
                  boxShadow: active ? `0 0 0 3px ${theme.primaryBg}` : "none",
                  minHeight: "auto",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Color swatch */}
                <div
                  className="h-8 w-8 rounded-lg shrink-0"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
                />
                <span className="text-[10px] font-semibold leading-tight text-center" style={{ color: active ? theme.primary : textMain }}>
                  {theme.name}
                </span>
                {theme.forceMode && (
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded-full" style={{ background: theme.primaryBg, color: theme.primary }}>
                    {theme.forceMode === "dark" ? "Dark" : "Light"}
                  </span>
                )}
                {active && (
                  <div className="absolute top-1 right-1 h-4 w-4 rounded-full flex items-center justify-center" style={{ background: theme.primary }}>
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Custom Color Picker ─────────────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: textSub, letterSpacing: "0.07em" }}>
          Custom Accent Color
        </p>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={customAccent}
            onChange={(e) => handleCustomAccentChange(e.target.value)}
            className="cursor-pointer"
            style={{ width: "52px", height: "52px", borderRadius: "12px", border: `2px solid ${selectedId === "custom" ? customAccent : border}`, padding: "3px", background: "transparent" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 shrink-0" style={{ color: textSub }} />
              <span className="text-xs font-semibold" style={{ color: textMain }}>
                {selectedId === "custom" ? "Custom color active" : "Pick any accent color"}
              </span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: textSub }}>
              Buttons, badges, links &amp; active states all adapt instantly.
            </p>
            <input
              type="text"
              value={customAccent}
              onChange={(e) => {
                const val = e.target.value;
                setCustomAccent(val);
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                  setSelectedId("custom");
                  applyThemeCssVars(resolveTheme("custom", val));
                }
              }}
              placeholder="#2563EB"
              className="mt-2 font-mono"
              style={{ width: "120px", background: inputBg, border: `1px solid ${border}`, color: textMain, borderRadius: "8px", padding: "6px 10px", fontSize: "12px" }}
            />
          </div>
        </div>
      </div>

      {/* ── Live Preview ────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: textSub, letterSpacing: "0.07em" }}>
          Live Preview
        </p>

        {/* Simulated header */}
        <div className="rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${border}` }}>
          <div className="flex items-center gap-3 px-3 py-2" style={{ background: displayDark ? "#0b1220" : "#ffffff", borderBottom: `1px solid ${border}` }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: previewTheme.primary }} />
            <div className="flex-1 h-1.5 rounded-full" style={{ background: previewTheme.primaryBg, maxWidth: "60px" }} />
            <div className="flex gap-1.5 ml-auto">
              {[0.5, 0.7, 1].map((o, i) => (
                <div key={i} className="h-1.5 rounded-full" style={{ width: "24px", background: `rgba(${hexToRgbParts(previewTheme.primary)},${o})` }} />
              ))}
            </div>
          </div>
          <div className="flex" style={{ background: displayDark ? "#0d1626" : "#F8FAFC", minHeight: "48px" }}>
            {/* Sidebar */}
            <div className="w-16 px-2 py-3 space-y-1.5" style={{ borderRight: `1px solid ${border}` }}>
              {[true, false, false].map((active, i) => (
                <div key={i} className="h-1.5 rounded-full" style={{ background: active ? previewTheme.primary : (displayDark ? "rgba(255,255,255,0.08)" : "#E2E8F0") }} />
              ))}
            </div>
            {/* Content area */}
            <div className="flex-1 p-2 space-y-1.5">
              <div className="flex gap-1.5">
                {["₦1,250", "₦6,400"].map((v, i) => (
                  <div key={i} className="flex-1 px-2 py-1.5 rounded-lg" style={{ background: i === 0 ? previewTheme.primaryBg : (displayDark ? "rgba(255,255,255,0.04)" : "#fff"), border: `1px solid ${i === 0 ? previewTheme.primaryBorder : border}` }}>
                    <div className="h-1 w-8 rounded-full mb-1" style={{ background: i === 0 ? previewTheme.primary : (displayDark ? "rgba(255,255,255,0.15)" : "#E2E8F0") }} />
                    <span className="text-[8px] font-bold" style={{ color: i === 0 ? previewTheme.primary : textSub }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${previewTheme.primary}, ${previewTheme.primaryDark})`, boxShadow: `0 3px 10px ${previewTheme.primaryGlow}` }}>
            Primary Button
          </div>
          <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ background: previewTheme.primaryBg, color: previewTheme.primary, border: `1px solid ${previewTheme.primaryBorder}` }}>
            Ghost Button
          </div>
          <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ background: displayDark ? "rgba(255,255,255,0.06)" : "#F1F5F9", color: textSub, border: `1px solid ${border}` }}>
            Secondary
          </div>
        </div>

        {/* Badges + Link + Form row */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: previewTheme.primaryBg, color: previewTheme.primary }}>
            Active Badge
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.10)", color: "#16a34a" }}>
            Approved
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(234,88,12,0.10)", color: "#ea580c" }}>
            Pending
          </span>
          <a href="#" onClick={e => e.preventDefault()} className="text-[11px] font-semibold underline-offset-2 hover:underline" style={{ color: previewTheme.primary }}>
            Link text
          </a>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: textSub }}>Task Progress</span>
            <span className="text-[10px] font-bold" style={{ color: previewTheme.primary }}>68%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: previewTheme.primaryBg }}>
            <div className="h-full rounded-full transition-all" style={{ width: "68%", background: `linear-gradient(90deg, ${previewTheme.primary}, ${previewTheme.primaryMid})` }} />
          </div>
        </div>

        {/* Active nav item + input */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold" style={{ background: previewTheme.primaryBg, color: previewTheme.primary }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: previewTheme.primary }} />
            Active Nav Item
          </div>
          <div className="flex-1 min-w-0" style={{ position: "relative" }}>
            <div className="w-full rounded-xl px-3 py-1.5 text-[11px]" style={{ background: inputBg, border: `2px solid ${previewTheme.primary}`, color: textSub, boxShadow: `0 0 0 3px ${previewTheme.primaryBg}` }}>
              Form focused input…
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          style={{ background: displayDark ? "rgba(255,255,255,0.06)" : "#F1F5F9", border: `1px solid ${border}`, color: textSub, minHeight: "auto" }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
          style={{ background: `linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark))`, boxShadow: `0 4px 14px var(--theme-primary-glow)`, minHeight: "auto" }}
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save Theme"}
        </button>
      </div>
    </div>
  );
}

// Helper: extract rgb parts from hex for rgba() use
function hexToRgbParts(hex: string): string {
  const m = /^#([A-Fa-f0-9]{6})$/.exec(hex.trim());
  if (!m) return "37,99,235";
  return [
    parseInt(m[1].slice(0, 2), 16),
    parseInt(m[1].slice(2, 4), 16),
    parseInt(m[1].slice(4, 6), 16),
  ].join(",");
}
