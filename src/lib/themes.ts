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

// 25 professional preset themes (shown in Appearance dropdown)
export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: "ocean-blue",
    name: "Blue",
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
    id: "sky-blue",
    name: "Sky Blue",
    emoji: "🩵",
    primary: "#0EA5E9",
    primaryDark: "#0284C7",
    primaryMid: "#38BDF8",
    primaryLight: "#F0F9FF",
    primaryBg: "rgba(14,165,233,0.10)",
    primaryBorder: "rgba(14,165,233,0.20)",
    primaryGlow: "rgba(14,165,233,0.30)",
  },
  {
    id: "navy",
    name: "Navy",
    emoji: "🌑",
    primary: "#1E3A8A",
    primaryDark: "#1E2D6B",
    primaryMid: "#2563EB",
    primaryLight: "#EFF6FF",
    primaryBg: "rgba(30,58,138,0.12)",
    primaryBorder: "rgba(30,58,138,0.22)",
    primaryGlow: "rgba(30,58,138,0.30)",
  },
  {
    id: "cyan",
    name: "Cyan",
    emoji: "🩵",
    primary: "#0891B2",
    primaryDark: "#0E7490",
    primaryMid: "#22D3EE",
    primaryLight: "#ECFEFF",
    primaryBg: "rgba(8,145,178,0.10)",
    primaryBorder: "rgba(8,145,178,0.20)",
    primaryGlow: "rgba(8,145,178,0.30)",
  },
  {
    id: "teal",
    name: "Teal",
    emoji: "🌿",
    primary: "#0D9488",
    primaryDark: "#0F766E",
    primaryMid: "#14B8A6",
    primaryLight: "#F0FDFA",
    primaryBg: "rgba(13,148,136,0.10)",
    primaryBorder: "rgba(13,148,136,0.20)",
    primaryGlow: "rgba(13,148,136,0.30)",
  },
  {
    id: "green",
    name: "Green",
    emoji: "🟢",
    primary: "#16A34A",
    primaryDark: "#15803D",
    primaryMid: "#22C55E",
    primaryLight: "#F0FDF4",
    primaryBg: "rgba(22,163,74,0.10)",
    primaryBorder: "rgba(22,163,74,0.20)",
    primaryGlow: "rgba(22,163,74,0.30)",
  },
  {
    id: "emerald",
    name: "Emerald",
    emoji: "💚",
    primary: "#059669",
    primaryDark: "#047857",
    primaryMid: "#10B981",
    primaryLight: "#ECFDF5",
    primaryBg: "rgba(5,150,105,0.10)",
    primaryBorder: "rgba(5,150,105,0.20)",
    primaryGlow: "rgba(5,150,105,0.30)",
  },
  {
    id: "lime",
    name: "Lime",
    emoji: "🍋",
    primary: "#65A30D",
    primaryDark: "#4D7C0F",
    primaryMid: "#84CC16",
    primaryLight: "#F7FEE7",
    primaryBg: "rgba(101,163,13,0.10)",
    primaryBorder: "rgba(101,163,13,0.20)",
    primaryGlow: "rgba(101,163,13,0.30)",
  },
  {
    id: "orange",
    name: "Orange",
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
    id: "amber",
    name: "Amber",
    emoji: "🟡",
    primary: "#D97706",
    primaryDark: "#B45309",
    primaryMid: "#F59E0B",
    primaryLight: "#FFFBEB",
    primaryBg: "rgba(217,119,6,0.10)",
    primaryBorder: "rgba(217,119,6,0.20)",
    primaryGlow: "rgba(217,119,6,0.30)",
  },
  {
    id: "gold",
    name: "Gold",
    emoji: "✨",
    primary: "#B45309",
    primaryDark: "#92400E",
    primaryMid: "#D97706",
    primaryLight: "#FFFBEB",
    primaryBg: "rgba(180,83,9,0.10)",
    primaryBorder: "rgba(180,83,9,0.20)",
    primaryGlow: "rgba(180,83,9,0.28)",
  },
  {
    id: "red",
    name: "Red",
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
    id: "rose",
    name: "Rose",
    emoji: "🌹",
    primary: "#E11D48",
    primaryDark: "#BE123C",
    primaryMid: "#FB7185",
    primaryLight: "#FFF1F2",
    primaryBg: "rgba(225,29,72,0.10)",
    primaryBorder: "rgba(225,29,72,0.20)",
    primaryGlow: "rgba(225,29,72,0.30)",
  },
  {
    id: "pink",
    name: "Pink",
    emoji: "🩷",
    primary: "#EC4899",
    primaryDark: "#DB2777",
    primaryMid: "#F472B6",
    primaryLight: "#FDF2F8",
    primaryBg: "rgba(236,72,153,0.10)",
    primaryBorder: "rgba(236,72,153,0.20)",
    primaryGlow: "rgba(236,72,153,0.30)",
  },
  {
    id: "purple",
    name: "Purple",
    emoji: "🟣",
    primary: "#9333EA",
    primaryDark: "#7E22CE",
    primaryMid: "#A855F7",
    primaryLight: "#FAF5FF",
    primaryBg: "rgba(147,51,234,0.10)",
    primaryBorder: "rgba(147,51,234,0.20)",
    primaryGlow: "rgba(147,51,234,0.30)",
  },
  {
    id: "indigo",
    name: "Indigo",
    emoji: "🔷",
    primary: "#4338CA",
    primaryDark: "#3730A3",
    primaryMid: "#6366F1",
    primaryLight: "#EEF2FF",
    primaryBg: "rgba(67,56,202,0.10)",
    primaryBorder: "rgba(67,56,202,0.20)",
    primaryGlow: "rgba(67,56,202,0.30)",
  },
  {
    id: "violet",
    name: "Violet",
    emoji: "💜",
    primary: "#7C3AED",
    primaryDark: "#6D28D9",
    primaryMid: "#8B5CF6",
    primaryLight: "#EDE9FE",
    primaryBg: "rgba(124,58,237,0.10)",
    primaryBorder: "rgba(124,58,237,0.20)",
    primaryGlow: "rgba(124,58,237,0.30)",
  },
  {
    id: "brown",
    name: "Brown",
    emoji: "🟫",
    primary: "#92400E",
    primaryDark: "#78350F",
    primaryMid: "#B45309",
    primaryLight: "#FFF7ED",
    primaryBg: "rgba(146,64,14,0.10)",
    primaryBorder: "rgba(146,64,14,0.20)",
    primaryGlow: "rgba(146,64,14,0.28)",
  },
  {
    id: "gray",
    name: "Gray",
    emoji: "⬜",
    primary: "#475569",
    primaryDark: "#334155",
    primaryMid: "#64748B",
    primaryLight: "#F8FAFC",
    primaryBg: "rgba(71,85,105,0.10)",
    primaryBorder: "rgba(71,85,105,0.20)",
    primaryGlow: "rgba(71,85,105,0.28)",
  },
  {
    id: "black",
    name: "Black",
    emoji: "⬛",
    primary: "#1E293B",
    primaryDark: "#0F172A",
    primaryMid: "#334155",
    primaryLight: "#F8FAFC",
    primaryBg: "rgba(30,41,59,0.15)",
    primaryBorder: "rgba(30,41,59,0.30)",
    primaryGlow: "rgba(30,41,59,0.35)",
    forceMode: "dark",
  },
  {
    id: "midnight",
    name: "Midnight",
    emoji: "🌙",
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    primaryMid: "#818CF8",
    primaryLight: "rgba(99,102,241,0.10)",
    primaryBg: "rgba(99,102,241,0.12)",
    primaryBorder: "rgba(99,102,241,0.25)",
    primaryGlow: "rgba(99,102,241,0.35)",
    forceMode: "dark",
  },
  {
    id: "ocean",
    name: "Ocean",
    emoji: "🌊",
    primary: "#0369A1",
    primaryDark: "#075985",
    primaryMid: "#0EA5E9",
    primaryLight: "#F0F9FF",
    primaryBg: "rgba(3,105,161,0.10)",
    primaryBorder: "rgba(3,105,161,0.20)",
    primaryGlow: "rgba(3,105,161,0.30)",
  },
  {
    id: "sunset",
    name: "Sunset",
    emoji: "🌅",
    primary: "#C2410C",
    primaryDark: "#9A3412",
    primaryMid: "#F97316",
    primaryLight: "#FFF7ED",
    primaryBg: "rgba(194,65,12,0.10)",
    primaryBorder: "rgba(194,65,12,0.20)",
    primaryGlow: "rgba(194,65,12,0.30)",
  },
  {
    id: "forest",
    name: "Forest",
    emoji: "🌲",
    primary: "#166534",
    primaryDark: "#14532D",
    primaryMid: "#16A34A",
    primaryLight: "#F0FDF4",
    primaryBg: "rgba(22,101,52,0.10)",
    primaryBorder: "rgba(22,101,52,0.20)",
    primaryGlow: "rgba(22,101,52,0.30)",
  },
  {
    id: "royal-blue",
    name: "Royal Blue",
    emoji: "👑",
    primary: "#1D4ED8",
    primaryDark: "#1E40AF",
    primaryMid: "#3B82F6",
    primaryLight: "#EFF6FF",
    primaryBg: "rgba(29,78,216,0.10)",
    primaryBorder: "rgba(29,78,216,0.20)",
    primaryGlow: "rgba(29,78,216,0.30)",
  },
];

export const DEFAULT_THEME_ID = "ocean-blue";

export function getThemeById(id: string): ThemeConfig {
  // Legacy ID mappings for backward compat with stored DB values
  const legacyMap: Record<string, string> = {
    "midnight-dark":  "midnight",
    "light-mode":     "ocean-blue",
    "emerald-green":  "emerald",
    "royal-purple":   "violet",
    "crimson-red":    "red",
    "sunset-orange":  "sunset",
  };
  const resolvedId = legacyMap[id] ?? id;
  return PRESET_THEMES.find((t) => t.id === resolvedId) ?? PRESET_THEMES[0];
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

export type ColorMode = "dark" | "light" | "system";

export interface UserThemePrefs {
  themeId: string;
  customAccent?: string | null;
  colorMode?: ColorMode;
}
