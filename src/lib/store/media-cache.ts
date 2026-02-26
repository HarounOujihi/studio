import { atom } from "jotai";

type MediaFile = {
  key: string;
  filename: string;
  extension: string;
  size: number;
  lastModified: string | null;
  isImage: boolean;
  isDocument: boolean;
  type: "image" | "document" | "other";
};

type CachedMedia = {
  files: MediaFile[];
  timestamp: number;
  orgId: string;
};

type MediaCache = Record<string, CachedMedia>;

// Cache TTL in milliseconds (30 minutes)
const CACHE_TTL = 30 * 60 * 1000;

// Check if cache is still valid
function isCacheValid(cached: CachedMedia | undefined, orgId: string): boolean {
  if (!cached) return false;
  if (cached.orgId !== orgId) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
}

// Load cache from localStorage
function loadCache(): MediaCache {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("sawi-media-cache-v1");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load media cache:", e);
  }
  return {};
}

// Save cache to localStorage
function saveCache(cache: MediaCache) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sawi-media-cache-v1", JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to save media cache:", e);
  }
}

// Base cache atom initialized from localStorage
const initialCache = typeof window !== "undefined" ? loadCache() : {};
export const mediaCacheAtom = atom<MediaCache>(initialCache);

// Derived atom to get cached files for an org
export const mediaCacheHelpersAtom = atom(
  (get) => {
    const cache = get(mediaCacheAtom);
    return {
      getCachedFiles: (orgId: string): MediaFile[] | null => {
        const cached = cache[orgId];
        if (isCacheValid(cached, orgId)) {
          return cached.files;
        }
        return null;
      },
      isCacheStale: (orgId: string): boolean => {
        return !isCacheValid(cache[orgId], orgId);
      },
    };
  },
  (get, set, params: { action: "set" | "invalidate"; orgId: string; files?: MediaFile[] }) => {
    const currentCache = get(mediaCacheAtom);
    let newCache: MediaCache;

    if (params.action === "set" && params.files) {
      newCache = {
        ...currentCache,
        [params.orgId]: {
          files: params.files,
          timestamp: Date.now(),
          orgId: params.orgId,
        },
      };
    } else if (params.action === "invalidate") {
      const { [params.orgId]: _, ...rest } = currentCache;
      newCache = rest;
    } else {
      return;
    }

    set(mediaCacheAtom, newCache);
    saveCache(newCache);
  }
);

export type { MediaFile, CachedMedia, MediaCache };
