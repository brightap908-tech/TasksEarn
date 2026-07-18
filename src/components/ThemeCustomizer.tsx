import React from "react";
import { Check, RotateCcw, Palette, X, Save } from "lucide-react";
import {
  PRESET_THEMES,
  DEFAULT_THEME_ID,
  resolveTheme,
  applyThemeCssVars,
  UserThemePrefs,
} from "../lib/themes";

interface Props {
  isDarkMode: boolean;
  currentThemeId: string;
  currentCustomAccent: string | null;
  onSave: (prefs: UserThemePrefs) => Promise<void>;
  onCancel: () => void;
  platformDefaultThemeId?: string;
}

export default function ThemeCustomizer({
  isDarkMode,
  currentThemeId,
  currentCustomAccent,
  onSave,
  onCancel,
  platformDefaultThemeId = DEFAULT_THEME_ID,
}: Props) {
  const [selectedId, setSelectedId] = React.useState(currentThemeId);
  const [customAccent, setCustomAccent] = React.useState(
    currentCustomAccent || "#2563EB"
  );
  const [saving, setSaving] = React.useState(false);

  const bg = isDarkMode ? "#111827" : "#ffffff";
  const cardBg = isDarkMode ? "#1a2236" : "#F8FAFC";
  const border = isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const textMain = isDarkMode ? "#F1F5F9" : "#0F172A";
  const textSub = isDarkMode ? "#94A3B8" : "#64748B";

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

  const handleReset = () => {
    setSelectedId(platformDefaultThemeId);
    setCustomAccent("#2563EB");
    applyThemeCssVars(resolveTheme(platformDefaultThemeId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        themeId: selectedId,
        customAccent: selectedId === "custom" ? customAccent : null,
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
    <div className="space-y-4 animate-fadeIn" style={{ maxWidth: "560px" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: textMain }}>
            Theme Customizer
          </h2>
          <p className="text-xs mt-0.5" style={{ color: textSub }}>
            Choose a color theme. Changes apply instantly across the platform.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="rounded-xl p-2 cursor-pointer"
          style={{
            background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9",
            border: `1px solid ${border}`,
            color: textSub,
            minHeight: "auto",
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Preset themes grid */}
      <div
        className="rounded-2xl p-4"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        <p
          className="text-xs font-semibold uppercase mb-3"
          style={{ color: textSub, letterSpacing: "0.07em" }}
        >
          Preset Themes
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESET_THEMES.map((theme) => {
            const active = selectedId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className="relative rounded-xl p-3 cursor-pointer text-left flex flex-col gap-1.5 transition-all"
                style={{
                  background: active
                    ? isDarkMode
                      ? `rgba(${hexToRgbParts(theme.primary)},0.15)`
                      : theme.primaryLight
                    : cardBg,
                  border: active
                    ? `2px solid ${theme.primary}`
                    : `1.5px solid ${border}`,
                  boxShadow: active
                    ? `0 0 0 3px ${theme.primaryBg}`
                    : "none",
                  minHeight: "auto",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Color dot */}
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                    color: "#fff",
                  }}
                >
                  {theme.emoji === "⚫" || theme.emoji === "⚪" ? (
                    <span style={{ fontSize: "14px" }}>{theme.emoji}</span>
                  ) : (
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#fff",
                        opacity: 0.85,
                      }}
                    />
                  )}
                </div>
                <span
                  className="text-[11px] font-semibold leading-tight"
                  style={{ color: active ? theme.primary : textMain }}
                >
                  {theme.name}
                </span>
                {theme.forceMode && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit"
                    style={{
                      background: theme.primaryBg,
                      color: theme.primary,
                    }}
                  >
                    {theme.forceMode === "dark" ? "Forces Dark" : "Forces Light"}
                  </span>
                )}
                {active && (
                  <div
                    className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center"
                    style={{ background: theme.primary }}
                  >
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom color picker */}
      <div
        className="rounded-2xl p-4"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        <p
          className="text-xs font-semibold uppercase mb-3"
          style={{ color: textSub, letterSpacing: "0.07em" }}
        >
          Custom Accent Color
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={customAccent}
              onChange={(e) => handleCustomAccentChange(e.target.value)}
              className="cursor-pointer"
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "12px",
                border: `2px solid ${selectedId === "custom" ? customAccent : border}`,
                padding: "3px",
                background: "transparent",
                cursor: "pointer",
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 shrink-0" style={{ color: textSub }} />
              <span className="text-xs font-semibold" style={{ color: textMain }}>
                {selectedId === "custom" ? "Custom color active" : "Pick any accent color"}
              </span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: textSub }}>
              Any hex color — buttons, badges, links, and active states will adapt.
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
              style={{
                width: "120px",
                background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC",
                border: `1px solid ${border}`,
                color: textMain,
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "12px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div
        className="rounded-2xl p-4"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        <p
          className="text-xs font-semibold uppercase mb-3"
          style={{ color: textSub, letterSpacing: "0.07em" }}
        >
          Preview
        </p>
        <div className="space-y-3">
          {/* Buttons row */}
          <div className="flex flex-wrap gap-2">
            <div
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${previewTheme.primary}, ${previewTheme.primaryDark})`,
                boxShadow: `0 4px 14px ${previewTheme.primaryGlow}`,
              }}
            >
              Primary Button
            </div>
            <div
              className="px-4 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: previewTheme.primaryBg,
                color: previewTheme.primary,
                border: `1px solid ${previewTheme.primaryBorder}`,
              }}
            >
              Ghost Button
            </div>
          </div>
          {/* Badge + link row */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: previewTheme.primaryBg, color: previewTheme.primary }}
            >
              Active Badge
            </span>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-xs font-semibold underline-offset-2 hover:underline"
              style={{ color: previewTheme.primary }}
            >
              Link text
            </a>
          </div>
          {/* Progress bar */}
          <div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: previewTheme.primaryBg }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: "68%",
                  background: `linear-gradient(90deg, ${previewTheme.primary}, ${previewTheme.primaryMid})`,
                }}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: textSub }}>
              Progress bar • 68%
            </p>
          </div>
          {/* Active menu item */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold w-fit"
            style={{
              background: isDarkMode
                ? `rgba(${hexToRgbParts(previewTheme.primary)},0.18)`
                : previewTheme.primaryLight,
              color: previewTheme.primary,
            }}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ background: previewTheme.primary }}
            />
            Active Nav Item
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          style={{
            background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9",
            border: `1px solid ${border}`,
            color: textSub,
            minHeight: "auto",
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
          style={{
            background: `linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark))`,
            boxShadow: `0 4px 14px var(--theme-primary-glow)`,
            minHeight: "auto",
          }}
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
