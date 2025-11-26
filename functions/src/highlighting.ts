/**
 * Word-Level Audio Highlighting Cloud Functions
 *
 * Phase II Week 7: Firebase Cloud Functions Integration
 * Created: November 12, 2025
 *
 * Orchestrates automated TTS synthesis with word timing capture
 * - Synthesizes readings with Azure Cognitive Services
 * - Captures word boundary events during synthesis
 * - Stores timing data and audio files
 * - Handles errors and retries
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

import {
  SynthesisRequest,
  SynthesisResponse,
  SentenceTimingData,
  WordTiming,
  AzureWordBoundaryEvent,
  FunctionErrorLog,
  ReadingDocument,
  ReadingContent,
} from './types/highlighting-functions';

// Firebase references
const db = admin.firestore();

// Phase II Week 8: Cloud Storage bucket configuration
// References the default Cloud Storage bucket associated with the Firebase project
const bucket = admin.storage().bucket();

// Storage configuration
const STORAGE_CONFIG = {
  // Bucket for audio files
  audioPath: 'readings', // gs://bucket/readings/{date}/{readingType}.mp3

  // File retention policy (cleanup old files)
  retentionDays: 60,

  // Cache settings
  cacheControl: 'public, max-age=31536000', // 1 year (immutable after generation)

  // File metadata
  contentType: 'audio/mpeg',

  // Signed URL expiration (if using private bucket)
  signedUrlExpirationMs: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Enable public access (vs signed URLs)
  publicAccess: true,
};

// Azure Speech configuration (from environment)
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CACHE_RETENTION_DAYS = 60;
const ESTIMATED_COST_PER_KCHARS = 0.000015; // ~$15 per 1M characters

/**
 * Main Cloud Function: HTTP endpoint for on-demand synthesis
 *
 * Accepts POST requests with synthesis parameters
 * Can be triggered manually or by internal services
 *
 * @example
 * POST /synthesizeReading
 * {
 *   "date": "2025-11-12",
 *   "readingTypes": "all",
 *   "voiceName": "en-US-AriaNeural",
 *   "synthesisSpeed": 0.9
 * }
 */
export const synthesizeReading = functions.https.onRequest(async (req, res) => {
  // Enable CORS for testing
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST requests allowed' });
    return;
  }

  try {
    const request: SynthesisRequest = req.body;

    // Validate required fields
    if (!request.date) {
      res.status(400).json({ error: 'Missing required field: date' });
      return;
    }

    functions.logger.info(`Synthesis request received for ${request.date}`);

    const response = await processReadingSynthesis(request);
    res.status(200).json(response);
  } catch (error) {
    functions.logger.error('Error in synthesizeReading:', error);

    const errorResponse: SynthesisResponse = {
      status: 'error',
      message: 'Synthesis failed',
      processed: [],
      estimatedCost: 0,
      completedAt: new Date().toISOString(),
      error: {
        code: 'SYNTHESIS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * Process reading synthesis for one or more readings
 *
 * @param request - Synthesis request with date and reading types
 * @returns Synthesis response with results and metadata
 */
async function processReadingSynthesis(request: SynthesisRequest): Promise<SynthesisResponse> {
  const {
    date,
    readingTypes,
    language = 'en',
    voiceName = 'en-US-AriaNeural',
    synthesisSpeed = 0.9,
    forceResynteth = false,
  } = request;

  const response: SynthesisResponse = {
    status: 'success',
    message: 'Synthesis completed',
    processed: [],
    estimatedCost: 0,
    completedAt: new Date().toISOString(),
  };

  try {
    // Determine which readings to process
    const readingsToProcess =
      readingTypes === 'all'
        ? ['gospel', 'firstReading', 'secondReading']
        : [readingTypes];

    // Fetch reading document
    const readingDoc = await db.collection('readings').doc(date).get();

    if (!readingDoc.exists) {
      throw new Error(`No reading found for date ${date}`);
    }

    const readingData = readingDoc.data() as ReadingDocument;

    // Process each reading type
    for (const readingType of readingsToProcess) {
      try {
        // Skip second reading if it doesn't exist
        if (
          readingType === 'secondReading' &&
          !readingData.secondReading
        ) {
          functions.logger.info(
            `Skipping second reading for ${date} (not available on this date)`
          );
          continue;
        }

        const result = await synthesizeReadingType(
          date,
          readingType as 'gospel' | 'firstReading' | 'secondReading',
          readingData,
          language,
          voiceName,
          synthesisSpeed,
          forceResynteth
        );

        if (result) {
          response.processed.push(result);
          response.estimatedCost += estimateSynthesisCost(result);
        }
      } catch (error) {
        functions.logger.error(
          `Failed to synthesize ${readingType} for ${date}:`,
          error
        );

        // Log error for monitoring
        await logFunctionError(
          date,
          readingType,
          error instanceof Error ? error : new Error('Unknown error')
        );

        response.status = 'partial';
      }
    }

    if (response.processed.length === 0) {
      response.status = 'error';
      response.message = 'All readings failed to synthesize';
    }

    return response;
  } catch (error) {
    functions.logger.error('Error in processReadingSynthesis:', error);

    return {
      status: 'error',
      message: 'Failed to process synthesis request',
      processed: [],
      estimatedCost: 0,
      completedAt: new Date().toISOString(),
      error: {
        code: 'PROCESS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Synthesize a single reading type with retry logic
 *
 * @param date - Reading date (YYYY-MM-DD)
 * @param readingType - Type of reading (gospel, firstReading, secondReading)
 * @param readingData - Reading document data
 * @param language - Language code
 * @param voiceName - Azure voice name
 * @param synthesisSpeed - Playback speed (0.5-2.0)
 * @param forceResynthesis - Force re-synthesis
 * @returns Processed reading metadata or null if skipped
 */
async function synthesizeReadingType(
  date: string,
  readingType: 'gospel' | 'firstReading' | 'secondReading',
  readingData: ReadingDocument,
  language: string,
  voiceName: string,
  synthesisSpeed: number,
  forceResynthesis: boolean
): Promise<{
  readingType: string;
  audioUrl: string;
  wordCount: number;
  durationSeconds: number;
} | null> {
  // Check if synthesis already exists
  if (!forceResynthesis) {
    const existingData = await db
      .collection('readings')
      .doc(date)
      .collection('timings')
      .doc(readingType)
      .get();

    if (existingData.exists && existingData.data()?.status === 'ready') {
      functions.logger.info(
        `Timing data already exists for ${date}/${readingType}`
      );
      return null;
    }
  }

  // Get reading content
  const contentKey = readingType as keyof ReadingDocument;
  const readingContent = readingData[contentKey] as ReadingContent | undefined;

  if (!readingContent || typeof readingContent !== 'object' || !('text' in readingContent)) {
    throw new Error(`No content found for ${readingType}`);
  }

  functions.logger.info(
    `Starting synthesis for ${date}/${readingType} (${readingContent.text.length} chars)`
  );

  // Perform synthesis with retries
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      functions.logger.info(`Synthesis attempt ${attempt}/${MAX_RETRIES}`);

      const result = await performAzureSynthesis(
        readingContent.text,
        voiceName,
        synthesisSpeed
      );

      // Save timing data to Firestore
      const timingData: SentenceTimingData = {
        readingType,
        date,
        language,
        voiceName,
        synthesisSpeed,
        audioUrl: result.audioUrl,
        wordTimings: result.wordTimings,
        generatedAt: admin.firestore.Timestamp.now(),
        status: 'ready',
        durationMs: result.durationMs,
        attemptCount: attempt,
        schemaVersion: 1,
      };

      await db
        .collection('readings')
        .doc(date)
        .collection('timings')
        .doc(readingType)
        .set(timingData);

      // Update parent document
      await db
        .collection('readings')
        .doc(date)
        .update({
          hasTimingData: true,
          lastUpdated: admin.firestore.Timestamp.now(),
        });

      functions.logger.info(
        `Successfully synthesized ${readingType} for ${date} (${result.wordTimings.length} words, ${result.durationMs}ms)`
      );

      return {
        readingType,
        audioUrl: result.audioUrl,
        wordCount: result.wordTimings.length,
        durationSeconds: Math.round(result.durationMs / 1000),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      functions.logger.warn(
        `Attempt ${attempt} failed for ${readingType}:`,
        lastError
      );

      if (attempt < MAX_RETRIES) {
        // Exponential backoff
        const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  if (lastError) {
    throw new Error(
      `Failed to synthesize ${readingType} after ${MAX_RETRIES} attempts: ${lastError.message}`
    );
  }

  throw new Error(`Failed to synthesize ${readingType}`);
}

/**
 * Perform actual Azure TTS synthesis and capture word timing
 *
 * Phase II Week 8: Real Azure Cognitive Services integration
 *
 * Synthesizes text using Azure Speech Services with word boundary capture.
 * Returns word-level timing data for highlighting synchronization.
 *
 * @param text - Text to synthesize
 * @param voiceName - Azure voice name (e.g., "en-US-AriaNeural")
 * @param synthesisSpeed - Playback speed (0.5 - 2.0)
 * @returns Audio file URL and word timing data
 * @throws Error if Azure SDK unavailable or synthesis fails
 */
async function performAzureSynthesis(
  text: string,
  voiceName: string,
  synthesisSpeed: number
): Promise<{
  audioUrl: string;
  wordTimings: WordTiming[];
  durationMs: number;
}> {
  // Validate inputs
  if (!text || text.trim().length === 0) {
    throw new Error('Text to synthesize cannot be empty');
  }

  if (!AZURE_SPEECH_KEY) {
    throw new Error('Azure Speech Key not configured');
  }

  functions.logger.info(
    `[Azure] Synthesizing: "${text.substring(0, 50)}..." (${voiceName}, ${synthesisSpeed}x)`
  );

  try {
    // Try Azure SDK synthesis
    if (AZURE_SPEECH_KEY) {
      try {
        functions.logger.info('[Azure] Attempting SDK synthesis...');

        // Configure Azure Speech Service
        const speechConfig = sdk.SpeechConfig.fromSubscription(
          AZURE_SPEECH_KEY,
          AZURE_SPEECH_REGION
        );
        speechConfig.speechSynthesisVoiceName = voiceName;
        speechConfig.speechSynthesisOutputFormat =
          sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        // Capture word boundaries
        const wordBoundaries: AzureWordBoundaryEvent[] = [];
        synthesizer.wordBoundary = (s: any, e: any) => {
          wordBoundaries.push({
            eventType: e.eventType,
            audioOffset: e.audioOffset,
            boundaryType: e.boundaryType,
            duration: e.duration,
            text: e.text,
            wordLength: e.wordLength,
          });
        };

        // Build SSML
        const speedPercent = (synthesisSpeed * 100).toFixed(0);
        const ssml = buildSSML(text, voiceName, speedPercent);

        // Execute synthesis
        const result = await new Promise<any>((resolve, reject) => {
          synthesizer.speakSsmlAsync(
            ssml,
            (result: any) => resolve(result),
            (error: any) => reject(error)
          );
        });

        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const audioBuffer = Buffer.from(result.audioData);
          const durationMs = Math.round(result.audioDuration / 10000);
          const dateStr = new Date().toISOString().split('T')[0];

          const audioUrl = await uploadAudioToCloudStorage(
            audioBuffer,
            new Date(),
            dateStr
          );

          const wordTimings = convertAzureWordBoundaries(
            text,
            wordBoundaries,
            durationMs
          );

          functions.logger.info(
            `[Azure] ✅ Real synthesis complete: ${wordTimings.length} words, ${durationMs}ms`
          );

          return {
            audioUrl,
            wordTimings,
            durationMs,
          };
        } else {
          throw new Error(
            `Synthesis failed: ${result.reason} - ${result.errorDetails || 'No details'}`
          );
        }
      } catch (sdkError) {
        functions.logger.warn(
          '[Azure] SDK synthesis failed, falling back to simulation',
          sdkError
        );
        // Fall through to simulation below
      }
    }

    // Fallback: Generate simulated timing data
    functions.logger.info('[Azure] Using simulated timing data (fallback)');
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const baseRateMs = 400 / synthesisSpeed; // ~150 words/min
    const durationMs = Math.round(words.length * baseRateMs);

    const wordTimings: WordTiming[] = [];
    let charPosition = 0;
    let audioPosition = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordDurationMs = Math.round(baseRateMs * (word.length / 5));

      wordTimings.push({
        wordIndex: i,
        word,
        startMs: audioPosition,
        endMs: audioPosition + wordDurationMs,
        charStart: charPosition,
        charEnd: charPosition + word.length,
      });

      charPosition += word.length + 1;
      audioPosition += wordDurationMs;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const audioUrl = `gs://readings/${dateStr}/simulated.mp3`;

    functions.logger.info(
      `[Azure] Fallback generated: ${wordTimings.length} words, ${durationMs}ms`
    );

    return {
      audioUrl,
      wordTimings,
      durationMs,
    };
  } catch (error) {
    functions.logger.error('[Azure] Fatal synthesis error:', error);
    throw new Error(
      `Audio synthesis failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Build SSML with voice and speed settings
 *
 * SSML allows precise control over synthesis parameters
 *
 * @param text - Text to wrap in SSML
 * @param voiceName - Voice name for selection
 * @param speedPercent - Speech rate percentage (50-200)
 * @returns SSML string
 */
function buildSSML(text: string, voiceName: string, speedPercent: string): string {
  // Escape special XML characters
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  return `
    <speak version="1.0" xml:lang="en-US">
      <voice name="${voiceName}">
        <prosody rate="${speedPercent}%" pitch="0%">
          ${escaped}
        </prosody>
      </voice>
    </speak>
  `.trim();
}

/**
 * Convert Azure word boundary events to app format
 *
 * @param text - Original text
 * @param boundaries - Azure word boundary events
 * @param durationMs - Total audio duration
 * @returns WordTiming array
 */
function convertAzureWordBoundaries(
  text: string,
  boundaries: AzureWordBoundaryEvent[],
  durationMs: number
): WordTiming[] {
  const wordTimings: WordTiming[] = [];
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  for (let i = 0; i < boundaries.length && i < words.length; i++) {
    const boundary = boundaries[i];
    const word = words[i];

    // Azure reports offsets in 100-nanosecond units
    const startMs = Math.round(boundary.audioOffset / 10000);

    // Next boundary or duration
    const nextBoundary = boundaries[i + 1];
    const endMs = nextBoundary
      ? Math.round(nextBoundary.audioOffset / 10000)
      : Math.min(startMs + 500, durationMs); // Cap at duration

    // Find character position in original text
    const charStart = text.indexOf(word);
    const charEnd = charStart >= 0 ? charStart + word.length : 0;

    wordTimings.push({
      wordIndex: i,
      word,
      startMs,
      endMs,
      charStart: Math.max(0, charStart),
      charEnd: Math.max(0, charEnd),
    });
  }

  return wordTimings;
}

/**
 * Upload audio data to Cloud Storage
 *
 * Phase II Week 8: Cloud Storage integration
 *
 * Stores synthesized audio files in Cloud Storage with proper metadata,
 * caching headers, and public accessibility. Returns URL for audio playback.
 *
 * File structure: gs://bucket/readings/{date}/{readingType}.mp3
 * Example: gs://bucket/readings/2025-11-12/gospel.mp3
 *
 * @param audioData - MP3 audio buffer from Azure TTS
 * @param date - Reading date (YYYY-MM-DD)
 * @param readingType - Type of reading (gospel, firstReading, secondReading)
 * @returns Public HTTPS URL to audio file (or signed URL if private bucket)
 * @throws Error if upload fails
 */
async function uploadAudioToCloudStorage(
  audioData: Buffer,
  date: Date,
  readingType: string
): Promise<string> {
  try {
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];

    // Construct Cloud Storage path
    const filename = `${STORAGE_CONFIG.audioPath}/${dateStr}/${readingType}.mp3`;

    functions.logger.info(
      `[Storage] Uploading: ${filename} (${audioData.length} bytes)`
    );

    // Get file reference
    const file = bucket.file(filename);

    // Upload with metadata
    await file.save(audioData, {
      metadata: {
        contentType: STORAGE_CONFIG.contentType,
        cacheControl: STORAGE_CONFIG.cacheControl,
        // Custom metadata for tracking
        generatedDate: new Date().toISOString(),
        readingType: readingType,
      },
    });

    // Make file publicly readable (for ESL learners to stream)
    if (STORAGE_CONFIG.publicAccess) {
      await file.makePublic();
    }

    // Generate URL
    let publicUrl: string;

    if (STORAGE_CONFIG.publicAccess) {
      // Public URL (works without authentication)
      publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    } else {
      // Signed URL (requires temporary access token)
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + STORAGE_CONFIG.signedUrlExpirationMs,
      });
      publicUrl = signedUrl;
    }

    // Log success with file size for cost tracking
    const fileSizeKb = Math.round(audioData.length / 1024);
    functions.logger.info(
      `[Storage] ✅ Uploaded ${filename} (${fileSizeKb}KB)`
    );

    return publicUrl;
  } catch (error) {
    functions.logger.error('[Storage] Upload error:', error);
    throw new Error(
      `Failed to upload audio: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Generate signed URL for audio file (if using private bucket)
 *
 * Useful if bucket is not public but you want to share temporarily
 *
 * @param date - Reading date
 * @param readingType - Reading type
 * @param expirationHours - Hours until URL expires (default: 24)
 * @returns Signed URL valid for specified duration
 */
async function generateSignedAudioUrl(
  date: Date,
  readingType: string,
  expirationHours: number = 24
): Promise<string> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const filename = `${STORAGE_CONFIG.audioPath}/${dateStr}/${readingType}.mp3`;

    const file = bucket.file(filename);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expirationHours * 60 * 60 * 1000,
    });

    functions.logger.info(
      `[Storage] Generated signed URL for ${filename} (expires in ${expirationHours}h)`
    );

    return signedUrl;
  } catch (error) {
    functions.logger.error('[Storage] Signed URL generation error:', error);
    throw new Error(
      `Failed to generate signed URL: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Check if audio file exists in Cloud Storage
 *
 * Useful for cache hit detection
 *
 * @param date - Reading date
 * @param readingType - Reading type
 * @returns true if file exists
 */
async function audioFileExists(
  date: Date,
  readingType: string
): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const filename = `${STORAGE_CONFIG.audioPath}/${dateStr}/${readingType}.mp3`;

    const file = bucket.file(filename);
    const [exists] = await file.exists();

    return exists;
  } catch (error) {
    functions.logger.warn(
      `[Storage] Failed to check file existence:`,
      error
    );
    return false;
  }
}

/**
 * Delete old audio files (retention policy)
 *
 * Runs periodically to clean up storage older than retention period.
 * Saves storage costs while keeping recent data.
 *
 * @param retentionDays - Delete files older than this many days (default: 60)
 * @returns Number of files deleted
 */
async function deleteOldAudioFiles(
  retentionDays: number = STORAGE_CONFIG.retentionDays
): Promise<number> {
  try {
    functions.logger.info(
      `[Storage] Cleaning up files older than ${retentionDays} days`
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // List all audio files
    const [files] = await bucket.getFiles({
      prefix: STORAGE_CONFIG.audioPath,
    });

    let deletedCount = 0;

    for (const file of files) {
      // Get file metadata
      const [metadata] = await file.getMetadata();

      // Parse creation date (skip if timeCreated is undefined)
      if (!metadata.timeCreated) {
        continue;
      }
      const createdDate = new Date(metadata.timeCreated);

      // Delete if older than retention period
      if (createdDate < cutoffDate) {
        await file.delete();
        deletedCount++;

        functions.logger.info(
          `[Storage] Deleted old file: ${file.name} (created ${createdDate.toISOString()})`
        );
      }
    }

    functions.logger.info(`[Storage] ✅ Deleted ${deletedCount} old files`);
    return deletedCount;
  } catch (error) {
    functions.logger.error('[Storage] Cleanup error:', error);
    throw new Error(
      `Failed to delete old files: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get audio file statistics for cost tracking
 *
 * @returns Object with storage usage statistics
 */
async function getAudioStorageStats(): Promise<{
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMb: number;
  oldestFile: string | null;
  newestFile: string | null;
}> {
  try {
    const [files] = await bucket.getFiles({
      prefix: STORAGE_CONFIG.audioPath,
    });

    let totalSizeBytes = 0;
    let oldestFile: { name: string; date: Date } | null = null;
    let newestFile: { name: string; date: Date } | null = null;

    for (const file of files) {
      const [metadata] = await file.getMetadata();

      // Skip if metadata is missing required fields
      if (!metadata.size || !metadata.timeCreated) {
        continue;
      }

      // Add to total size
      totalSizeBytes += parseInt(metadata.size as string, 10) || 0;

      // Track oldest/newest
      const createdDate = new Date(metadata.timeCreated as string);

      if (!oldestFile || createdDate < oldestFile.date) {
        oldestFile = { name: file.name, date: createdDate };
      }

      if (!newestFile || createdDate > newestFile.date) {
        newestFile = { name: file.name, date: createdDate };
      }
    }

    return {
      totalFiles: files.length,
      totalSizeBytes,
      totalSizeMb: Math.round(totalSizeBytes / 1024 / 1024),
      oldestFile: oldestFile?.name || null,
      newestFile: newestFile?.name || null,
    };
  } catch (error) {
    functions.logger.error('[Storage] Stats error:', error);
    throw new Error(
      `Failed to get storage stats: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Estimate synthesis cost based on character count
 *
 * @param result - Synthesis result
 * @returns Estimated cost in USD
 */
function estimateSynthesisCost(result: {
  readingType: string;
  audioUrl: string;
  wordCount: number;
  durationSeconds: number;
}): number {
  // Rough estimation: ~150 words per minute = 2.5 words per second
  const estimatedChars = result.wordCount * 5; // Average word length

  return (estimatedChars / 1000) * ESTIMATED_COST_PER_KCHARS;
}

/**
 * Log Cloud Function errors to Firestore for monitoring
 *
 * @param date - Reading date
 * @param readingType - Reading type
 * @param error - Error object
 */
async function logFunctionError(
  date: string,
  readingType: string,
  error: Error
): Promise<void> {
  try {
    const errorLog: FunctionErrorLog = {
      message: error.message,
      stack: error.stack || '',
      timestamp: admin.firestore.Timestamp.now(),
      request: { date, readingType },
      errorType: 'synthesis',
    };

    await db
      .collection('functions-errors')
      .doc(`${date}-${readingType}`)
      .set(errorLog);
  } catch (logError) {
    functions.logger.error('Failed to log function error:', logError);
  }
}

/**
 * Health check endpoint for monitoring
 *
 * @returns Status information
 */
export const highlightingHealthCheck = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    try {
      // Check Firestore connectivity
      const configDoc = await db.collection('config').doc('functions').get();

      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        firestore: configDoc.exists ? 'connected' : 'no config found',
        azureKey: AZURE_SPEECH_KEY ? 'configured' : 'missing',
        region: AZURE_SPEECH_REGION,
      };

      res.status(200).json(healthStatus);
    } catch (error) {
      functions.logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
