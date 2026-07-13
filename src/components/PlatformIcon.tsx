import React from "react";
import { Platform, TaskCategory, getPlatformForCategory } from "../types";
import { getCachedPlatforms, loadPlatforms } from "../lib/platformsStore";
import {
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Globe,
  Sparkles,
} from "lucide-react";

interface PlatformIconProps {
  platform?: Platform | string;
  category?: TaskCategory | string;
  size?: number;
  className?: string;
  showBg?: boolean;
}

// ── Inline branded SVG components for platforms not in Lucide brand set ──────

const TikTokIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.81a8.16 8.16 0 0 0 4.77 1.52V6.89a4.84 4.84 0 0 1-1-.2z" fill="currentColor"/>
  </svg>
);

const DiscordIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const RedditIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

const ThreadsIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.583-1.288-.882-2.299-.89h-.029c-.803 0-1.oblique-left.796 1.547-.797.803 0 1.473.197 1.992.583.647.479 1.049 1.222 1.196 2.211.828.183 1.6.49 2.286.914 1.404.868 2.257 2.106 2.588 3.682.325 1.557.072 3.27-.733 4.813-.849 1.618-2.218 2.775-3.977 3.344-1.439.462-3.057.694-4.818.694zm.617-8.476c-.123 0-.247.007-.371.02-1.02.07-1.86.382-2.358.854-.437.414-.62.965-.587 1.625.059 1.082 1.028 1.721 2.613 1.633 1.126-.06 1.957-.459 2.47-1.185.418-.587.67-1.411.748-2.457a10.818 10.818 0 0 0-2.515-.49z"/>
  </svg>
);

const SnapchatIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.075-.046-.15-.046-.226.014-.239.195-.465.45-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
  </svg>
);

const WhatsAppIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

const TelegramIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const PinterestIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
  </svg>
);

const MessengerIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.733 8.1l3.13 3.259L19.752 8.1l-6.559 6.863z"/>
  </svg>
);

const KwaiIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l7 4.5-7 4.5z"/>
  </svg>
);

const LikeeIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3 10.5c0 1.66-1.34 3-3 3s-3-1.34-3-3V8h2v4.5c0 .55.45 1 1 1s1-.45 1-1V8h2v4.5z"/>
  </svg>
);

export function getPlatformInfo(platformStr: string) {
  const norm = platformStr.toLowerCase();

  if (norm.includes("facebook") || norm.includes("fb ") || norm === "fb") {
    return {
      BrandIcon: null,
      Icon: Facebook,
      colorClass: "text-[#1877F2]",
      bgClass: "bg-[#1877F2]/10 border-[#1877F2]/20",
      name: "Facebook",
    };
  }
  if (norm.includes("instagram") || norm.includes("ig ") || norm === "ig") {
    return {
      BrandIcon: null,
      Icon: Instagram,
      colorClass: "text-[#E4405F]",
      bgClass: "bg-[#E4405F]/10 border-[#E4405F]/20",
      name: "Instagram",
    };
  }
  if (norm.includes("youtube") || norm.includes("yt ") || norm === "yt") {
    return {
      BrandIcon: null,
      Icon: Youtube,
      colorClass: "text-[#FF0000]",
      bgClass: "bg-[#FF0000]/10 border-[#FF0000]/20",
      name: "YouTube",
    };
  }
  if (norm.includes("tiktok")) {
    return {
      BrandIcon: TikTokIcon,
      Icon: null,
      colorClass: "text-[#010101]",
      bgClass: "bg-[#010101]/10 border-[#010101]/20",
      name: "TikTok",
    };
  }
  if (norm.includes("telegram")) {
    return {
      BrandIcon: TelegramIcon,
      Icon: null,
      colorClass: "text-[#229ED9]",
      bgClass: "bg-[#229ED9]/10 border-[#229ED9]/20",
      name: "Telegram",
    };
  }
  if (norm.includes("whatsapp")) {
    return {
      BrandIcon: WhatsAppIcon,
      Icon: null,
      colorClass: "text-[#25D366]",
      bgClass: "bg-[#25D366]/10 border-[#25D366]/20",
      name: "WhatsApp",
    };
  }
  if (norm.includes("twitter") || norm.includes("x (twitter)") || norm === "x") {
    return {
      BrandIcon: null,
      Icon: Twitter,
      colorClass: "text-[#1DA1F2]",
      bgClass: "bg-[#1DA1F2]/10 border-[#1DA1F2]/20",
      name: "X (Twitter)",
    };
  }
  if (norm.includes("snapchat")) {
    return {
      BrandIcon: SnapchatIcon,
      Icon: null,
      colorClass: "text-[#FFFC00]",
      bgClass: "bg-[#FFFC00]/10 border-[#FFFC00]/20",
      name: "Snapchat",
    };
  }
  if (norm.includes("linkedin")) {
    return {
      BrandIcon: null,
      Icon: Linkedin,
      colorClass: "text-[#0A66C2]",
      bgClass: "bg-[#0A66C2]/10 border-[#0A66C2]/20",
      name: "LinkedIn",
    };
  }
  if (norm.includes("threads")) {
    return {
      BrandIcon: ThreadsIcon,
      Icon: null,
      colorClass: "text-slate-900",
      bgClass: "bg-slate-900/10 border-slate-900/20",
      name: "Threads",
    };
  }
  if (norm.includes("pinterest")) {
    return {
      BrandIcon: PinterestIcon,
      Icon: null,
      colorClass: "text-[#BD081C]",
      bgClass: "bg-[#BD081C]/10 border-[#BD081C]/20",
      name: "Pinterest",
    };
  }
  if (norm.includes("reddit")) {
    return {
      BrandIcon: RedditIcon,
      Icon: null,
      colorClass: "text-[#FF4500]",
      bgClass: "bg-[#FF4500]/10 border-[#FF4500]/20",
      name: "Reddit",
    };
  }
  if (norm.includes("discord")) {
    return {
      BrandIcon: DiscordIcon,
      Icon: null,
      colorClass: "text-[#5865F2]",
      bgClass: "bg-[#5865F2]/10 border-[#5865F2]/20",
      name: "Discord",
    };
  }
  if (norm.includes("messenger")) {
    return {
      BrandIcon: MessengerIcon,
      Icon: null,
      colorClass: "text-[#006AFF]",
      bgClass: "bg-[#006AFF]/10 border-[#006AFF]/20",
      name: "Messenger",
    };
  }
  if (norm.includes("kwai")) {
    return {
      BrandIcon: KwaiIcon,
      Icon: null,
      colorClass: "text-[#FF8C00]",
      bgClass: "bg-[#FF8C00]/10 border-[#FF8C00]/20",
      name: "Kwai",
    };
  }
  if (norm.includes("likee")) {
    return {
      BrandIcon: LikeeIcon,
      Icon: null,
      colorClass: "text-[#FF3366]",
      bgClass: "bg-[#FF3366]/10 border-[#FF3366]/20",
      name: "Likee",
    };
  }
  if (norm.includes("website") || norm.includes("web") || norm.includes("blog") || norm.includes("visit")) {
    return {
      BrandIcon: null,
      Icon: Globe,
      colorClass: "text-blue-400",
      bgClass: "bg-blue-400/10 border-blue-400/20",
      name: "Website",
    };
  }

  // Fallback
  return {
    BrandIcon: null,
    Icon: Sparkles,
    colorClass: "text-blue-400",
    bgClass: "bg-blue-400/10 border-blue-400/20",
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
  // Keep the dynamic platforms cache warm so admin-uploaded logos show up
  // everywhere a PlatformIcon is rendered, without every call site needing
  // to fetch/pass the list itself.
  const [, forceRerender] = React.useReducer((c) => c + 1, 0);
  React.useEffect(() => {
    loadPlatforms().then(() => forceRerender());
  }, []);

  let platformName = "";

  if (platform) {
    platformName = typeof platform === "string" ? platform : String(platform);
  } else if (category) {
    // Determine platform from category
    const catVal = typeof category === "string" ? (category as TaskCategory) : category;
    platformName = getPlatformForCategory(catVal);
  }

  const normalizedName = platformName.toLowerCase();
  const dynamicPlatform = getCachedPlatforms().find(
    (p) => normalizedName === p.name.toLowerCase() || normalizedName.includes(p.name.toLowerCase())
  );

  const { BrandIcon, Icon, colorClass, bgClass } = getPlatformInfo(platformName);
  const logoUrl = dynamicPlatform?.logoUrl;

  if (showBg) {
    return (
      <span
        className={`inline-flex items-center justify-center p-2 rounded-xl border overflow-hidden ${bgClass} ${className}`}
        style={{ minWidth: size * 2, minHeight: size * 2 }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={dynamicPlatform?.name} style={{ width: size, height: size }} className="object-contain rounded-sm" />
        ) : BrandIcon ? (
          <BrandIcon size={size} />
        ) : Icon ? (
          <Icon size={size} className={colorClass} />
        ) : null}
      </span>
    );
  }

  return logoUrl ? (
    <img src={logoUrl} alt={dynamicPlatform?.name} style={{ width: size, height: size }} className={`object-contain inline-block rounded-sm ${className}`} />
  ) : BrandIcon ? (
    <span className={`inline-flex items-center justify-center ${colorClass} ${className}`} style={{ width: size, height: size }}>
      <BrandIcon size={size} />
    </span>
  ) : Icon ? (
    <Icon size={size} className={`${colorClass} ${className}`} />
  ) : null;
}
