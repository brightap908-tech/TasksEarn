import { useEffect } from "react";

const DOMAIN = "https://tasksearn.name.ng";
const DEFAULT_IMAGE = `${DOMAIN}/icon-512.png`;

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setMetaName(name: string, content: string) {
  let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaProp(property: string, content: string) {
  let el = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  const id = "page-jsonld";
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  const el = document.getElementById("page-jsonld");
  if (el) el.remove();
}

/**
 * SEO — updates document head (title, meta, canonical, OG, Twitter Card, JSON-LD)
 * per page. Use inside any route component.
 */
export default function SEO({ title, description, path = "", ogType = "website", jsonLd }: SEOProps) {
  const canonical = `${DOMAIN}${path}`;

  useEffect(() => {
    // Title
    document.title = title;

    // Core meta
    setMetaName("description", description);
    setMetaName("robots", "index, follow, max-image-preview:large, max-snippet:-1");

    // Canonical
    setCanonical(canonical);

    // Open Graph
    setMetaProp("og:title", title);
    setMetaProp("og:description", description);
    setMetaProp("og:url", canonical);
    setMetaProp("og:type", ogType);
    setMetaProp("og:image", DEFAULT_IMAGE);
    setMetaProp("og:image:alt", "TasksEarn - Online Task Marketplace");
    setMetaProp("og:site_name", "TasksEarn");
    setMetaProp("og:locale", "en_NG");

    // Twitter Card
    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", title);
    setMetaName("twitter:description", description);
    setMetaName("twitter:image", DEFAULT_IMAGE);

    // JSON-LD
    if (jsonLd) {
      setJsonLd(jsonLd);
    } else {
      removeJsonLd();
    }

    return () => {
      // Restore home defaults on unmount so shared index.html stays sane
      document.title = "TasksEarn - Earn Money Online by Completing Simple Tasks";
    };
  }, [title, description, canonical, ogType]);

  return null;
}
