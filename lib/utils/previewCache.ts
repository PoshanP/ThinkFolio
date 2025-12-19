// Module-level cache for PDF preview images
// Persists across component mounts within the same session

interface PreviewCache {
  images: Record<string, string>;
  generatedIds: Set<string>;
}

// In-memory cache
const cache: PreviewCache = {
  images: {},
  generatedIds: new Set()
};

// Session storage key
const STORAGE_KEY = 'pdf-preview-cache';

// Initialize from sessionStorage on load
if (typeof window !== 'undefined') {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      cache.images = parsed.images || {};
      cache.generatedIds = new Set(parsed.generatedIds || []);
    }
  } catch {
    // Ignore storage errors
  }
}

// Save to sessionStorage (debounced)
let saveTimeout: NodeJS.Timeout | null = null;
function saveToStorage() {
  if (typeof window === 'undefined') return;

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const toStore = {
        images: cache.images,
        generatedIds: Array.from(cache.generatedIds)
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Storage might be full, clear old entries
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }, 500);
}

export function getPreviewImage(paperId: string): string | undefined {
  return cache.images[paperId];
}

export function setPreviewImage(paperId: string, dataUrl: string) {
  cache.images[paperId] = dataUrl;
  cache.generatedIds.add(paperId);
  saveToStorage();
}

export function hasPreview(paperId: string): boolean {
  return cache.generatedIds.has(paperId);
}

export function clearPreview(paperId: string) {
  delete cache.images[paperId];
  cache.generatedIds.delete(paperId);
  saveToStorage();
}

export function clearAllPreviews() {
  cache.images = {};
  cache.generatedIds.clear();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
