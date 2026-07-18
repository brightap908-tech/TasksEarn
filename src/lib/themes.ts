export interface ThemeConfig {
  id: string;
  name: string;
  emoji: string;
  primary: string;
  primaryDark: string;
  primaryMid: string;
  primaryLight: string;
  primaryBg: string;
  primaryBorder: string;
  primaryGlow: string;
  forceMode?: "dark" | "light";
}

export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    emoji: "🔵",
    primary: "#2563EB",
    primaryDark: "#1D4ED8",
    primaryMid: "#3B82F6",
    primaryLight: "#EFF6FF",
    primaryBg: "rgba(37,99,235,0.10)",
    primaryBorder: "rgba(37,99,235,0.20)",
    primaryGlow: "rgba(37,99,235,0.30)",
  },
  {
    id: "emerald-green",
    name: "Emerald Green",
    emoji: "🟢",
    primary: "#059669",
    primaryDark: "#047857",
    primaryMid: "#10B981",
    primaryLight: "#ECFDF5",
    primaryBg: "rgba(5,150,105,0.10)",
    primaryBorder: "rgba(5,150,105,0.20)",
    primaryGlow: "rgba(5,150,105,0.30)",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    emoji: "🟣",
    primary: "#7C3AED",
    primaryDark: "#6D28D9",
    primaryMid: "#8B5CF6",
    primaryLight: "#EDE9FE",
    primaryBg: "rgba(124,58,237,0.10)",
    primaryBorder: "rgba(124,58,237,0.20)",
    primaryGlow: "rgba(124,58,237,0.30)",
  },
  {
    id: "crimson-red",
    name: "Crimson Red",
    emoji: "🔴",
    primary: "#DC2626",
    primaryDark: "#B91C1C",
    primaryMid: "#EF4444",
    primaryLight: "#FEF2F2",
    primaryBg: "rgba(220,38,38,0.10)",
    primaryBorder: "rgba(220,38,38,0.20)",
    primaryGlow: "rgba(220,38,38,0.30)",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    emoji: "🟠",
    primary: "#EA580C",
    primaryDark: "#C2410C",
    primaryMid: "#F97316",
    primaryLight: "#FFF7ED",
    primaryBg: "rgba(234,88,12,0.10)",
    primaryBorder: "rgba(234,88,12,0.20)",
    primaryGlow: "rgba(234,88,12,0.30)",
  },
  {
    id: "midnight-dark",
    name: "Midnight Dark",
    emoji: "⚫",
    primary: "#3B82F6",
    primaryDark: "#2563EB",
    primaryMid: "#60A5FA",
    primaryLight: "rgba(59,130,246,0.10)",
    primaryBg: "rgba(59,130,246,0.10)",
    primaryBorder: "rgba(59,130,246,0.22)",
    primaryGlow: "rgba(59,130,246,0.35)",
    forceMode: "dark",
  },
  {
    id: "light-mode",
    name: "Light Mode",
    emoji: "⚪",
    primary: "#2563EB",
    primaryDark: "#1D4ED8",
    primaryMid: "#3B82F6",
    primaryLight: "#EFF6FF",
    primaryBg: "rgba(37,99,235,0.10)",
    primaryBorder: "rgba(37,99,235,0.20)",
    primaryGlow: "rgba(37,99,235,0.30)",
    forceMode: "light",
  },
];

export const DEFAULT_THEME_ID = "ocean-blue";

export function getThemeById(id: string): ThemeConfig {
  return PRESET_THEMES.find((t) => t.id === id) || PRESET_THEMES[0];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([A-Fa-f0-9]{6})$/.exec(hex.trim());
  if (!m) return null;
  return [
    parseInt(m[1].slice(0, 2), 16),
    parseInt(m[1].slice(2, 4), 16),
    parseInt(m[1].slice(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")
      )
      .join("")
  );
}

function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return toHex(rgb[0] * (1 - amount), rgb[1] * (1 - amount), rgb[2] * (1 - amount));
}

function lightenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return toHex(
    rgb[0] + (255 - rgb[0]) * amount,
    rgb[1] + (255 - rgb[1]) * amount,
    rgb[2] + (255 - rgb[2]) * amount
  );
}

export function buildCustomTheme(accent: string): ThemeConfig {
  const rgb = hexToRgb(accent) || [37, 99, 235];
  const [r, g, b] = rgb;
  return {
    id: "custom",
    name: "Custom",
    emoji: "🎨",
    primary: accent,
    primaryDark: darkenHex(accent, 0.15),
    primaryMid: lightenHex(accent, 0.15),
    primaryLight: `rgba(${r},${g},${b},0.08)`,
    primaryBg: `rgba(${r},${g},${b},0.10)`,
    primaryBorder: `rgba(${r},${g},${b},0.22)`,
    primaryGlow: `rgba(${r},${g},${b},0.32)`,
  };
}

export function resolveTheme(
  themeId: string,
  customAccent?: string | null
): ThemeConfig {
  if (themeId === "custom" && customAccent) return buildCustomTheme(customAccent);
  return getThemeById(themeId);
}

export function applyThemeCssVars(theme: ThemeConfig): void {
  const root = document.documentElement;
  // Enable smooth transition for 300ms
  root.classList.add("theme-transition");
  root.style.setProperty("--theme-primary", theme.primary);
  root.style.setProperty("--theme-primary-dark", theme.primaryDark);
  root.style.setProperty("--theme-primary-mid", theme.primaryMid);
  root.style.setProperty("--theme-primary-light", theme.primaryLight);
  root.style.setProperty("--theme-primary-bg", theme.primaryBg);
  root.style.setProperty("--theme-primary-border", theme.primaryBorder);
  root.style.setProperty("--theme-primary-glow", theme.primaryGlow);
  setTimeout(() => root.classList.remove("theme-transition"), 350);
}

export interface UserThemePrefs {
  themeId: string;
  customAccent?: string | null;
}
