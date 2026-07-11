import React from "react";
import { SocialPlatform } from "../types";

// Lightweight module-level cache so every component that needs the list of
// active social media platforms (task creation, filters, pricing, icons...)
// shares a single network request instead of each firing its own fetch.

let cache: SocialPlatform[] | null = null;
let inflight: Promise<SocialPlatform[]> | null = null;
const listeners = new Set<() => void>();

export function getCachedPlatforms(): SocialPlatform[] {
  return cache || [];
}

function notify() {
  listeners.forEach((l) => l());
}

export async function loadPlatforms(force = false): Promise<SocialPlatform[]> {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;

  inflight = fetch("/api/platforms")
    .then((r) => (r.ok ? r.json() : []))
    .then((data) => {
      cache = Array.isArray(data) ? data : [];
      notify();
      return cache;
    })
    .catch(() => {
      cache = cache || [];
      return cache;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

// Call after admin CRUD operations mutate the platforms list so every
// consumer (task creation, filters, icons) picks up the change immediately.
export function invalidatePlatformsCache() {
  cache = null;
  loadPlatforms(true);
}

export function usePlatforms() {
  const [platforms, setPlatforms] = React.useState<SocialPlatform[]>(getCachedPlatforms());
  const [loading, setLoading] = React.useState(!cache);

  React.useEffect(() => {
    const listener = () => setPlatforms(getCachedPlatforms());
    listeners.add(listener);
    loadPlatforms().then((p) => {
      setPlatforms(p);
      setLoading(false);
    });
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    platforms,
    loading,
    refresh: () => loadPlatforms(true)
  };
}
