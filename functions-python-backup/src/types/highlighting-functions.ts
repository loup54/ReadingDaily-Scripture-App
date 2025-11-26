/**
 * Cloud Functions Type Definitions for Word-Level Audio Highlighting
 *
 * Phase II Week 7: Firebase Cloud Functions Integration
 * Created: November 12, 2025
 *
 * Type definitions for automated TTS synthesis with word timing capture
 * via Azure Cognitive Services Speech SDK
 */

/**
 * Word timing data for a single word in the text
 * Captures exact positioning and duration information
 */
export interface WordTiming {
  /** Zero-indexed word position in the reading */
  wordIndex: number;
  /** Word text (exact match from source text) */
  word: string;
  /** Milliseconds from start of audio when word begins */
  startMs: number;
  /** Milliseconds from start of audio when word ends */
  endMs: number;
  /** Character position in original text where word starts */
  charStart: number;
  /** Character position in original text where word ends */
  charEnd: number;
}

/**
 * Complete timing data for an entire reading
 * Stored in Firestore under /readings/{date}/timings/{readingType}
 */
export interface SentenceTimingData {
  /** "gospel" | "firstReading" | "secondReading" */
  readingType: "gospel" | "firstReading" | "secondReading";
  /** ISO 8601 date string (YYYY-MM-DD) */
  date: string;
  /** Language code: "en" for English, "es" for Spanish, etc. */
  language: string;
  /** Azure voice name (e.g., "en-US-AriaNeural") */
  voiceName: string;
  /** Playback speed used during synthesis (0.5 - 2.0) */
  synthesisSpeed: number;
  /** Cloud Storage URL for synthesized audio file */
  audioUrl: string;
  /** Array of word timing data for entire reading */
  wordTimings: WordTiming[];
  /** Timestamp when this data was generated */
  generatedAt: FirebaseFirestore.Timestamp;
  /** Status of synthesis: "ready" | "failed" | "processing" */
  status: "ready" | "failed" | "processing";
  /** Total duration of audio in milliseconds */
  durationMs: number;
  /** Error message if status is "failed" */
  error?: string;
  /** Number of attempts made to generate this data */
  attemptCount: number;
  /** Version number for schema migrations */
  schemaVersion: number;
}

/**
 * Request payload for initiating reading synthesis
 * Used by Cloud Function HTTP trigger or internal calls
 */
export interface SynthesisRequest {
  /** ISO 8601 date string (YYYY-MM-DD) */
  date: string;
  /** Which reading to synthesize: "gospel" | "firstReading" | "secondReading" | "all" */
  readingTypes: "gospel" | "firstReading" | "secondReading" | "all";
  /** Language code (default: "en") */
  language?: string;
  /** Azure voice name (default: "en-US-AriaNeural") */
  voiceName?: string;
  /** Synthesis speed 0.5-2.0 (default: 0.9) */
  synthesisSpeed?: number;
  /** Force re-synthesis even if data exists (default: false) */
  forceResynteth?: boolean;
}

/**
 * Response payload from synthesis Cloud Function
 */
export interface SynthesisResponse {
  /** "success" | "partial" | "error" */
  status: "success" | "partial" | "error";
  /** Human-readable message about what was processed */
  message: string;
  /** Array of processed readings */
  processed: Array<{
    readingType: string;
    audioUrl: string;
    wordCount: number;
    durationSeconds: number;
  }>;
  /** Total cost in USD for TTS API calls */
  estimatedCost: number;
  /** Timestamp when synthesis completed */
  completedAt: string;
  /** Error details if status is "error" */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Azure Speech SDK word boundary event
 * Emitted during TTS synthesis to capture timing information
 */
export interface AzureWordBoundaryEvent {
  /** Event type: "WordBoundary" */
  eventType: string;
  /** Audio offset in milliseconds from start */
  audioOffset: number;
  /** Word boundary type: "WordBoundary" */
  boundaryType: string;
  /** Duration of audio in milliseconds for this segment */
  duration: number;
  /** Text at this boundary */
  text?: string;
  /** Word index in the text */
  wordLength?: number;
}

/**
 * Firestore document for a daily reading
 * Top-level structure for readings collection
 */
export interface ReadingDocument {
  /** ISO 8601 date */
  date: string;
  /** Whether timing data has been generated */
  hasTimingData: boolean;
  /** Timestamp of last update */
  lastUpdated: FirebaseFirestore.Timestamp;
  /** Gospel reading text */
  gospel?: ReadingContent;
  /** First reading text */
  firstReading?: ReadingContent;
  /** Second reading (only on Sundays/Feasts) */
  secondReading?: ReadingContent;
  /** Psalm (responsorial) */
  psalm?: ReadingContent;
}

/**
 * Single reading content (gospel, first reading, etc.)
 */
export interface ReadingContent {
  /** Full text of the reading */
  text: string;
  /** Reading source (e.g., "Mark 1:1-8") */
  source: string;
  /** Title/label for this reading */
  title: string;
}

/**
 * Error entry logged when synthesis fails
 * Stored in /functions-errors/{date}-{readingType}
 */
export interface FunctionErrorLog {
  /** Error message */
  message: string;
  /** Full error stack trace */
  stack: string;
  /** When error occurred */
  timestamp: FirebaseFirestore.Timestamp;
  /** Request that caused error */
  request: Record<string, unknown>;
  /** "synthesis" | "storage" | "firestore" | "azure" */
  errorType: string;
}

/**
 * Cloud Function configuration for cost tracking
 * Stored in /config/functions
 */
export interface FunctionConfig {
  /** Estimated cost per 1000 characters for Azure TTS */
  azureTtsCostPerKChars: number;
  /** Maximum concurrent synthesis operations */
  maxConcurrentSynthesis: number;
  /** Maximum retry attempts for failed operations */
  maxRetries: number;
  /** Retry delay in milliseconds (exponential backoff) */
  retryDelayMs: number;
  /** Cache retention period in days */
  cacheRetentionDays: number;
  /** Enable cost logging */
  enableCostTracking: boolean;
}

/**
 * Batch processing status for scheduled synthesis
 * Stored in /function-status/daily-synthesis
 */
export interface BatchProcessingStatus {
  /** Processing date */
  date: string;
  /** Overall status: "pending" | "processing" | "completed" | "failed" */
  status: "pending" | "processing" | "completed" | "failed";
  /** When batch started */
  startedAt: FirebaseFirestore.Timestamp;
  /** When batch completed (if finished) */
  completedAt?: FirebaseFirestore.Timestamp;
  /** Readings that completed successfully */
  successCount: number;
  /** Readings that failed */
  failureCount: number;
  /** Total readings attempted */
  totalCount: number;
  /** Estimated cost for this batch */
  estimatedCost: number;
  /** Details of each reading attempt */
  details: Array<{
    readingType: string;
    status: "success" | "failed";
    error?: string;
    audioBytes?: number;
  }>;
}
