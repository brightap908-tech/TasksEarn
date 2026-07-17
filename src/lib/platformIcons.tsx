/**
 * PlatformIcon — maps a social-media platform name to its brand icon.
 * Falls back to a generic task icon if the platform is unknown.
 *
 * Uses react-icons/fa6 (Font Awesome 6 Brands) so every icon is the
 * official vector shape. Brand colours are applied inline; pass
 * `monochrome` to override with a single colour.
 */
import React from "react";
import {
  FaTiktok,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaXTwitter,
  FaTelegram,
  FaWhatsapp,
  FaLinkedin,
  FaSnapchat,
  FaDiscord,
  FaReddit,
  FaThreads,
  FaPinterest,
  FaFacebookMessenger,
} from "react-icons/fa6";
import { Play } from "lucide-react"; // fallback for Likee / Kwai / unknown

interface PlatformIconProps {
  /** First word of task.category — e.g. "Facebook", "TikTok" */
  platform: string;
  /** Rendered size in pixels (default 20) */
  size?: number;
  /** When true, renders every icon in the passed colour instead of brand colour */
  monochrome?: boolean;
  /** Colour used when monochrome=true (default "#2563EB") */
  color?: string;
}

interface IconDef {
  Icon: React.ElementType;
  brandColor: string;
}

const PLATFORM_MAP: Record<string, IconDef> = {
  tiktok:    { Icon: FaTiktok,            brandColor: "#010101" },
  facebook:  { Icon: FaFacebook,          brandColor: "#1877F2" },
  instagram: { Icon: FaInstagram,         brandColor: "#E1306C" },
  youtube:   { Icon: FaYoutube,           brandColor: "#FF0000" },
  x:         { Icon: FaXTwitter,          brandColor: "#000000" },
  twitter:   { Icon: FaXTwitter,          brandColor: "#000000" },
  telegram:  { Icon: FaTelegram,          brandColor: "#2CA5E0" },
  whatsapp:  { Icon: FaWhatsapp,          brandColor: "#25D366" },
  linkedin:  { Icon: FaLinkedin,          brandColor: "#0A66C2" },
  snapchat:  { Icon: FaSnapchat,          brandColor: "#FFFC00" }, // yellow — used with dark bg
  discord:   { Icon: FaDiscord,           brandColor: "#5865F2" },
  reddit:    { Icon: FaReddit,            brandColor: "#FF4500" },
  threads:   { Icon: FaThreads,           brandColor: "#101010" },
  pinterest: { Icon: FaPinterest,         brandColor: "#E60023" },
  messenger: { Icon: FaFacebookMessenger, brandColor: "#0084FF" },
  // Likee & Kwai have no FA6 icon → Play from lucide as fallback
  likee:     { Icon: Play,               brandColor: "#FF4081" },
  kwai:      { Icon: Play,               brandColor: "#F5A623" },
};

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  size = 20,
  monochrome = false,
  color = "#2563EB",
}) => {
  const key = platform?.trim().toLowerCase() ?? "";
  const def = PLATFORM_MAP[key];

  if (!def) {
    // Unknown platform → generic lucide Play icon
    return <Play size={size} color={monochrome ? color : "#94A3B8"} strokeWidth={1.8} />;
  }

  const { Icon, brandColor } = def;
  const resolvedColor = monochrome ? color : brandColor;

  // Snapchat is yellow — darken it when used on light backgrounds
  const safeColor = resolvedColor === "#FFFC00" && !monochrome ? "#D4B000" : resolvedColor;

  return <Icon size={size} color={safeColor} style={{ flexShrink: 0 }} />;
};

/**
 * Extract the platform keyword from a task category string.
 * "Facebook Like" → "Facebook"
 * "TikTok Follow" → "TikTok"
 */
export function getPlatformFromCategory(category: string): string {
  return category?.split(" ")[0] ?? "";
}
