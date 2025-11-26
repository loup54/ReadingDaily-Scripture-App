/**
 * Word-Level Audio Highlighting Type Definitions
 * Supports karaoke-style word highlighting synchronized with audio playback
 */

/**
 * Represents a single word with its timing information
 * Used to sync UI highlighting with audio playback
 */
export interface WordTiming {
  /** The word text */
  word: string;
  /** Start time in milliseconds */
  startMs: number;
  /** End time in milliseconds */
  endMs: number;
  /** Word index in the sentence (0-based) */
  index: number;
  /** Character offset in the full text (for precise highlighting) */
  charOffset: number;
  /** Length of the word in characters */
  charLength: number;
}

/**
 * Complete timing data for a sentence/passage
 * Includes all word timings and metadata
 */
export interface SentenceTimingData {
  /** Unique identifier for the reading passage */
  readingId: string;
  /** The full sentence/passage text */
  text: string;
  /** Type of reading (gospel, first-reading, psalm, second-reading) */
  readingType: 'gospel' | 'first-reading' | 'psalm' | 'second-reading';
  /** Date of the reading */
  date: Date;
  /** Reference (e.g., "John 3:16-17") */
  reference: string;
  /** Array of word timings */
  words: WordTiming[];
  /** Total duration of audio in milliseconds */
  durationMs: number;
  /** Audio URL (Google Cloud TTS or Azure) */
  audioUrl: string;
  /** TTS provider used (azure, google, polly) */
  ttsProvider: 'azure' | 'google' | 'polly';
  /** Voice used for TTS */
  voice: string;
  /** Audio speed multiplier (1.0 = normal, 0.75 = slower, 1.5 = faster) */
  speed: number;
  /** Timestamp when this timing data was generated */
  generatedAt: Date;
  /** Version of the highlighting schema */
  version: string;
}

/**
 * Timing metadata for a practice sentence
 * Used in pronunciation practice with highlighting
 */
export interface PracticeSentenceTimingData extends SentenceTimingData {
  /** Difficulty level for highlighting context */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Source (Gospel, First Reading, Psalm, Second Reading) */
  source: string;
  /** Word count for UI display */
  wordCount: number;
}

/**
 * Current highlighting state during audio playback
 * Tracks which word is currently playing
 */
export interface HighlightingState {
  /** Current audio position in milliseconds */
  currentPositionMs: number;
  /** Index of the currently highlighted word (-1 if none) */
  currentWordIndex: number;
  /** The word currently being highlighted */
  currentWord?: WordTiming;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Audio duration in milliseconds */
  durationMs: number;
  /** Update timestamp */
  updatedAt: number; // Unix timestamp in milliseconds
}

/**
 * Highlighting configuration for UI rendering
 */
export interface HighlightingConfig {
  /** Enable/disable word-level highlighting */
  enabled: boolean;
  /** Update frequency in milliseconds (lower = more responsive, higher = better performance) */
  updateIntervalMs: number;
  /** Use native driver for animations (iOS/Android) */
  useNativeDriver: boolean;
  /** Animation duration when transitioning between words */
  animationDurationMs: number;
  /** Highlight color (hex code) */
  highlightColor: string;
  /** Text color for highlighted word */
  highlightTextColor: string;
  /** Fade-out effect for previous words */
  useFadeOut: boolean;
  /** Fade-out duration in milliseconds */
  fadeOutDurationMs: number;
}

/**
 * Default highlighting configuration
 */
export const DEFAULT_HIGHLIGHTING_CONFIG: HighlightingConfig = {
  enabled: true,
  updateIntervalMs: 100, // Update every 100ms (10fps)
  useNativeDriver: true,
  animationDurationMs: 50,
  highlightColor: '#007AFF', // iOS blue
  highlightTextColor: '#FFFFFF',
  useFadeOut: true,
  fadeOutDurationMs: 200,
};

/**
 * Options for highlighting a specific reading
 */
export interface HighlightingOptions {
  /** Reading ID to highlight */
  readingId: string;
  /** Type of reading */
  readingType: 'gospel' | 'first-reading' | 'psalm' | 'second-reading';
  /** Configuration overrides */
  config?: Partial<HighlightingConfig>;
  /** Callback when word changes */
  onWordChange?: (wordIndex: number, word: WordTiming) => void;
  /** Callback when highlighting completes */
  onComplete?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Audio position update event
 * Emitted from audio playback service
 */
export interface AudioPositionUpdate {
  /** Current position in milliseconds */
  positionMs: number;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Is audio currently playing */
  isPlaying: boolean;
  /** Timestamp of the update */
  timestamp: number;
}

/**
 * Word change event
 * Emitted when highlighting moves to a new word
 */
export interface WordChangeEvent {
  /** The newly highlighted word */
  word: WordTiming;
  /** Previous word that was highlighted */
  previousWord?: WordTiming;
  /** Current audio position */
  positionMs: number;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Highlighting error types
 */
export enum HighlightingErrorType {
  /** No timing data found for reading */
  TIMING_DATA_NOT_FOUND = 'TIMING_DATA_NOT_FOUND',
  /** Failed to fetch timing data from Firestore */
  FETCH_FAILED = 'FETCH_FAILED',
  /** Audio position tracking failed */
  POSITION_TRACKING_FAILED = 'POSITION_TRACKING_FAILED',
  /** Invalid word timing data format */
  INVALID_DATA = 'INVALID_DATA',
  /** Timing data is outdated or stale */
  DATA_STALE = 'DATA_STALE',
}

/**
 * Highlighting error with context
 */
export interface HighlightingError extends Error {
  type: HighlightingErrorType;
  readingId?: string;
  context?: Record<string, any>;
}

/**
 * Word highlighting metrics
 * For performance monitoring
 */
export interface HighlightingMetrics {
  /** Average time to update highlighting in milliseconds */
  avgUpdateTimeMs: number;
  /** Word lookup time in milliseconds (binary search) */
  wordLookupTimeMs: number;
  /** Number of UI updates since start */
  updateCount: number;
  /** Peak memory usage in bytes */
  peakMemoryBytes: number;
  /** Dropped frames due to performance */
  droppedFrames: number;
  /** FPS average during highlighting */
  avgFps: number;
}

/**
 * Cached highlighting data in local storage
 * Reduces need to fetch from Firestore
 */
export interface CachedHighlightingData {
  /** Timing data for the reading */
  timingData: SentenceTimingData;
  /** Cache timestamp */
  cachedAt: Date;
  /** TTL in milliseconds (when cache expires) */
  ttlMs: number;
  /** Cache key for identification */
  cacheKey: string;
}

/**
 * Firestore document schema for word timings
 */
export interface FirestoreWordTimingDocument {
  /** Sentence text */
  text: string;
  /** Reading type */
  readingType: string;
  /** Reading date (ISO string) */
  date: string;
  /** Reference string */
  reference: string;
  /** Array of word timings */
  words: Array<{
    word: string;
    startMs: number;
    endMs: number;
    index: number;
    charOffset: number;
    charLength: number;
  }>;
  /** Total duration */
  durationMs: number;
  /** Audio URL */
  audioUrl: string;
  /** TTS provider */
  ttsProvider: string;
  /** Voice used */
  voice: string;
  /** Audio speed */
  speed: number;
  /** Generation timestamp (Firestore Timestamp) */
  generatedAt: any; // Firestore Timestamp
  /** Schema version */
  version: string;
}

/**
 * Binary search result for word lookup
 */
export interface WordSearchResult {
  /** Index of the word in the array */
  wordIndex: number;
  /** The word timing data */
  word: WordTiming;
  /** Whether this is an exact match or best match */
  isExact: boolean;
  /** Search time in milliseconds */
  searchTimeMs: number;
}

/**
 * Animation frame callback for highlighting
 */
export type HighlightingAnimationCallback = (state: HighlightingState) => void;

/**
 * Highlighting state listener
 */
export type HighlightingStateListener = (state: HighlightingState) => void;

/**
 * Storage type for word timings
 */
export type TimingDataStorageType = 'firestore' | 'localStorage' | 'memory';

/**
 * Highlighting provider interface (for DI pattern)
 */
export interface IHighlightingProvider {
  getTimingData(readingId: string, readingType: string): Promise<SentenceTimingData | null>;
  saveTimingData(data: SentenceTimingData): Promise<void>;
  getCachedTimingData(cacheKey: string): Promise<CachedHighlightingData | null>;
  clearCache(): Promise<void>;
}

/**
 * Highlighting service interface
 */
export interface IHighlightingService {
  startHighlighting(options: HighlightingOptions): Promise<void>;
  stopHighlighting(): void;
  getCurrentState(): HighlightingState;
  onStateChange(listener: HighlightingStateListener): () => void;
  updateAudioPosition(positionMs: number): void;
}
