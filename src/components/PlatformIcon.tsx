import React from "react";
import { Platform, TaskCategory, getPlatformForCategory } from "../types";
import {
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Twitch,
  Send,
  MessageCircle,
  Ghost,
  AtSign,
  Gamepad2,
  Flame,
  Pin,
  Music,
  Globe,
  Sparkles,
  Video,
  Play
} from "lucide-react";

interface PlatformIconProps {
  platform?: Platform | string;
  category?: TaskCategory | string;
  size?: number;
  className?: string;
  showBg?: boolean;
}

export function getPlatformInfo(platformStr: string) {
  const norm = platformStr.toLowerCase();

  // Mapping string or enum to appropriate Lucide icons and colors
  if (norm.includes("facebook") || norm.includes("fb")) {
    return {
      Icon: Facebook,
      colorClass: "text-[#1877F2]",
      bgClass: "bg-[#1877F2]/10 border-[#1877F2]/20",
      name: "Facebook",
    };
  }
  if (norm.includes("instagram") || norm.includes("ig")) {
    return {
      Icon: Instagram,
      colorClass: "text-[#E4405F]",
      bgClass: "bg-[#E4405F]/10 border-[#E4405F]/20",
      name: "Instagram",
    };
  }
  if (norm.includes("youtube") || norm.includes("yt")) {
    return {
      Icon: Youtube,
      colorClass: "text-[#FF0000]",
      bgClass: "bg-[#FF0000]/10 border-[#FF0000]/20",
      name: "YouTube",
    };
  }
  if (norm.includes("tiktok")) {
    return {
      Icon: Music, // Lucide TikTok brand icon fallback
      colorClass: "text-[#00F2FE]", // cyan/magenta glow vibe
      bgClass: "bg-[#00F2FE]/10 border-[#00F2FE]/20",
      name: "TikTok",
    };
  }
  if (norm.includes("telegram")) {
    return {
      Icon: Send,
      colorClass: "text-[#229ED9]",
      bgClass: "bg-[#229ED9]/10 border-[#229ED9]/20",
      name: "Telegram",
    };
  }
  if (norm.includes("whatsapp")) {
    return {
      Icon: MessageCircle,
      colorClass: "text-[#25D366]",
      bgClass: "bg-[#25D366]/10 border-[#25D366]/20",
      name: "WhatsApp",
    };
  }
  if (norm.includes("twitter") || norm.includes(" x ")) {
    return {
      Icon: Twitter,
      colorClass: "text-[#1DA1F2]",
      bgClass: "bg-[#1DA1F2]/10 border-[#1DA1F2]/20",
      name: "X (Twitter)",
    };
  }
  if (norm.includes("snapchat")) {
    return {
      Icon: Ghost,
      colorClass: "text-[#FFFC00]",
      bgClass: "bg-[#FFFC00]/10 border-[#FFFC00]/20",
      name: "Snapchat",
    };
  }
  if (norm.includes("linkedin")) {
    return {
      Icon: Linkedin,
      colorClass: "text-[#0A66C2]",
      bgClass: "bg-[#0A66C2]/10 border-[#0A66C2]/20",
      name: "LinkedIn",
    };
  }
  if (norm.includes("threads")) {
    return {
      Icon: AtSign,
      colorClass: "text-slate-200",
      bgClass: "bg-slate-200/10 border-slate-200/20",
      name: "Threads",
    };
  }
  if (norm.includes("pinterest")) {
    return {
      Icon: Pin,
      colorClass: "text-[#BD081C]",
      bgClass: "bg-[#BD081C]/10 border-[#BD081C]/20",
      name: "Pinterest",
    };
  }
  if (norm.includes("reddit")) {
    return {
      Icon: Flame,
      colorClass: "text-[#FF4500]",
      bgClass: "bg-[#FF4500]/10 border-[#FF4500]/20",
      name: "Reddit",
    };
  }
  if (norm.includes("discord")) {
    return {
      Icon: Gamepad2,
      colorClass: "text-[#5865F2]",
      bgClass: "bg-[#5865F2]/10 border-[#5865F2]/20",
      name: "Discord",
    };
  }
  if (norm.includes("spotify")) {
    return {
      Icon: Music,
      colorClass: "text-[#1DB954]",
      bgClass: "bg-[#1DB954]/10 border-[#1DB954]/20",
      name: "Spotify",
    };
  }
  if (norm.includes("twitch")) {
    return {
      Icon: Twitch,
      colorClass: "text-[#9146FF]",
      bgClass: "bg-[#9146FF]/10 border-[#9146FF]/20",
      name: "Twitch",
    };
  }
  if (norm.includes("kwai")) {
    return {
      Icon: Play,
      colorClass: "text-[#FF8C00]",
      bgClass: "bg-[#FF8C00]/10 border-[#FF8C00]/20",
      name: "Kwai",
    };
  }
  if (norm.includes("likee")) {
    return {
      Icon: Video,
      colorClass: "text-[#FF3366]",
      bgClass: "bg-[#FF3366]/10 border-[#FF3366]/20",
      name: "Likee",
    };
  }
  if (norm.includes("website") || norm.includes("web") || norm.includes("blog") || norm.includes("visit")) {
    return {
      Icon: Globe,
      colorClass: "text-teal-400",
      bgClass: "bg-teal-400/10 border-teal-400/20",
      name: "Website",
    };
  }

  // Fallback
  return {
    Icon: Sparkles,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10 border-emerald-400/20",
    name: platformStr,
  };
}

export default function PlatformIcon({
  platform,
  category,
  size = 16,
  className = "",
  showBg = false,
}: PlatformIconProps) {
  let platformName = "";

  if (platform) {
    platformName = typeof platform === "string" ? platform : String(platform);
  } else if (category) {
    // Determine platform from category
    const catVal = typeof category === "string" ? (category as TaskCategory) : category;
    platformName = getPlatformForCategory(catVal);
  }

  const { Icon, colorClass, bgClass } = getPlatformInfo(platformName);

  if (showBg) {
    return (
      <span
        className={`inline-flex items-center justify-center p-2 rounded-xl border ${bgClass} ${className}`}
        style={{ minWidth: size * 2, minHeight: size * 2 }}
      >
        <Icon size={size} className={colorClass} />
      </span>
    );
  }

  return <Icon size={size} className={`${colorClass} ${className}`} />;
}
