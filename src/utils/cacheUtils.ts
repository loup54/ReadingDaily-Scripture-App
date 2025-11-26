/**
 * Cache Utilities
 * Helper functions for cache management
 *
 * Provides:
 * - Cache key builders
 * - TTL constants
 * - Cache strategies
 */

/**
 * Cache TTL Constants
 * Standard time-to-live values for different data types
 */
export const CACHE_TTL = {
  // Scripture content - long lived
  SCRIPTURE_TEXT: 24 * 60 * 60 * 1000, // 24 hours

  // Navigation/structure - medium lived
  CHAPTER_LIST: 12 * 60 * 60 * 1000, // 12 hours
  BOOK_LIST: 7 * 24 * 60 * 60 * 1000, // 7 days

  // User data - short lived
  BOOKMARKS: 1 * 60 * 60 * 1000, // 1 hour
  NOTES: 1 * 60 * 60 * 1000, // 1 hour
  HIGHLIGHTS: 1 * 60 * 60 * 1000, // 1 hour
  RATINGS: 1 * 60 * 60 * 1000, // 1 hour

  // Profile - medium lived
  USER_PROFILE: 4 * 60 * 60 * 1000, // 4 hours
  PREFERENCES: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Media - long lived
  AUDIO_METADATA: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Daily content
  DAILY_SCRIPTURE: 24 * 60 * 60 * 1000, // 24 hours

  // Search/Index
  SEARCH_INDEX: 24 * 60 * 60 * 1000, // 24 hours

  // Default
  DEFAULT: 60 * 60 * 1000, // 1 hour
};

/**
 * Cache Key Builders
 * Standard cache key patterns
 */
export const cacheKeys = {
  // Scripture
  scripture: (bookId: string, chapterId: string, verseId?: string) => {
    if (verseId) {
      return `scripture_${bookId}_${chapterId}_${verseId}`;
    }
    return `scripture_${bookId}_${chapterId}`;
  },

  // Navigation
  books: () => 'books_list',
  chapters: (bookId: string) => `chapters_${bookId}`,
  verses: (bookId: string, chapterId: string) => `verses_${bookId}_${chapterId}`,

  // User Data
  bookmarks: () => 'bookmarks',
  bookmarkStatus: (scriptureId: string) => `bookmark_${scriptureId}`,
  notes: (scriptureId?: string) => {
    if (scriptureId) {
      return `notes_${scriptureId}`;
    }
    return 'notes_all';
  },
  highlights: (scriptureId?: string) => {
    if (scriptureId) {
      return `highlights_${scriptureId}`;
    }
    return 'highlights_all';
  },
  ratings: (scriptureId: string) => `rating_${scriptureId}`,

  // User Profile
  profile: () => 'user_profile',
  preferences: () => 'user_preferences',

  // Audio
  audioMetadata: (wordId: string) => `audio_${wordId}`,
  pronunciation: (word: string) => `pronunciation_${word.toLowerCase()}`,

  // Daily Content
  dailyScripture: (date?: string) => {
    const dateStr = date || new Date().toDateString();
    return `daily_${dateStr}`;
  },

  // Search
  search: (query: string) => `search_${query.toLowerCase()}`,
  searchIndex: () => 'search_index',
};

/**
 * Cache Strategies
 */
export const CACHE_STRATEGIES = {
  // Cache first - return cached, update silently
  CACHE_FIRST: 'cache_first',

  // Network first - fetch fresh, fallback to cache
  NETWORK_FIRST: 'network_first',

  // Stale while revalidate - return cached, fetch in background
  STALE_WHILE_REVALIDATE: 'stale_while_revalidate',

  // Network only - always fetch
  NETWORK_ONLY: 'network_only',

  // Cache only - never fetch
  CACHE_ONLY: 'cache_only',
} as const;

export type CacheStrategy = typeof CACHE_STRATEGIES[keyof typeof CACHE_STRATEGIES];

/**
 * Get recommended cache strategy for a data type
 */
export function getStrategyForDataType(dataType: string): CacheStrategy {
  const strategies: Record<string, CacheStrategy> = {
    // Scripture content - cache first (rarely changes)
    scripture: CACHE_STRATEGIES.CACHE_FIRST,
    chapters: CACHE_STRATEGIES.CACHE_FIRST,
    books: CACHE_STRATEGIES.CACHE_FIRST,

    // User data - stale while revalidate (needs sync)
    bookmarks: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    notes: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    highlights: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    ratings: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,

    // Profile - network first (user might change it elsewhere)
    profile: CACHE_STRATEGIES.NETWORK_FIRST,
    preferences: CACHE_STRATEGIES.NETWORK_FIRST,

    // Audio - cache first (static content)
    audio: CACHE_STRATEGIES.CACHE_FIRST,

    // Default
    default: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  };

  return strategies[dataType] || strategies.default;
}

/**
 * Get recommended TTL for a data type
 */
export function getTTLForDataType(dataType: string): number {
  const ttls: Record<string, number> = {
    scripture: CACHE_TTL.SCRIPTURE_TEXT,
    chapters: CACHE_TTL.CHAPTER_LIST,
    books: CACHE_TTL.BOOK_LIST,
    bookmarks: CACHE_TTL.BOOKMARKS,
    notes: CACHE_TTL.NOTES,
    highlights: CACHE_TTL.HIGHLIGHTS,
    ratings: CACHE_TTL.RATINGS,
    profile: CACHE_TTL.USER_PROFILE,
    preferences: CACHE_TTL.PREFERENCES,
    audio: CACHE_TTL.AUDIO_METADATA,
    daily: CACHE_TTL.DAILY_SCRIPTURE,
    search: CACHE_TTL.SEARCH_INDEX,
  };

  return ttls[dataType] || CACHE_TTL.DEFAULT;
}

/**
 * Format cache size for display
 */
export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if cache entry is getting stale
 * Useful for showing "Updated" badges
 */
export function isStale(timestamp: number, ttl: number, threshold: number = 0.8): boolean {
  const age = Date.now() - timestamp;
  const staleness = age / ttl;
  return staleness > threshold;
}

/**
 * Get staleness percentage (0-100)
 */
export function getStalnessPercentage(timestamp: number, ttl: number): number {
  const age = Date.now() - timestamp;
  return Math.min(100, (age / ttl) * 100);
}

/**
 * Convert seconds to milliseconds
 */
export function seconds(s: number): number {
  return s * 1000;
}

/**
 * Convert minutes to milliseconds
 */
export function minutes(m: number): number {
  return m * 60 * 1000;
}

/**
 * Convert hours to milliseconds
 */
export function hours(h: number): number {
  return h * 60 * 60 * 1000;
}

/**
 * Convert days to milliseconds
 */
export function days(d: number): number {
  return d * 24 * 60 * 60 * 1000;
}

/**
 * Check if two cache entries are different
 */
export function isCacheEntryDifferent<T>(old: T | null, new_: T | null): boolean {
  if (old === null || new_ === null) {
    return old !== new_;
  }

  try {
    return JSON.stringify(old) !== JSON.stringify(new_);
  } catch {
    return true;
  }
}

/**
 * Create a cache version key for versioning cache
 * Useful when cache format changes
 */
export function createVersionedCacheKey(key: string, version: number): string {
  return `${key}_v${version}`;
}

/**
 * Debug: Log cache info
 */
export function debugCacheInfo(cacheKey: string, data: any, ttl: number): void {
  if (__DEV__) {
    console.log(`[Cache] Key: ${cacheKey}`);
    console.log(`[Cache] TTL: ${formatCacheSize(ttl)}`);
    console.log(`[Cache] Size: ${formatCacheSize(JSON.stringify(data).length)}`);
  }
}

/**
 * Predefine cache configuration by data type
 */
export const CACHE_CONFIG = {
  scripture: {
    ttl: CACHE_TTL.SCRIPTURE_TEXT,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    persistent: true,
  },
  chapters: {
    ttl: CACHE_TTL.CHAPTER_LIST,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    persistent: true,
  },
  bookmarks: {
    ttl: CACHE_TTL.BOOKMARKS,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    persistent: true,
  },
  notes: {
    ttl: CACHE_TTL.NOTES,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    persistent: true,
  },
  audio: {
    ttl: CACHE_TTL.AUDIO_METADATA,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    persistent: true,
  },
  profile: {
    ttl: CACHE_TTL.USER_PROFILE,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    persistent: true,
  },
  daily: {
    ttl: CACHE_TTL.DAILY_SCRIPTURE,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    persistent: true,
  },
} as const;

export type CacheConfigKey = keyof typeof CACHE_CONFIG;

/**
 * Get cache configuration for a data type
 */
export function getCacheConfig(key: CacheConfigKey) {
  return CACHE_CONFIG[key];
}
