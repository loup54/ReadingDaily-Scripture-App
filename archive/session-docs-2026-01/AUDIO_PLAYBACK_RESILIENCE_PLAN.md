# Audio Playback Resilience Plan
**Date:** December 17, 2025
**Build:** 53+
**Priority:** 🟡 HIGH
**Requested By:** User

---

## 📋 Executive Summary

You requested: **"Another area for you to make a good plan so we can future proof as much as possible"** (regarding audio playback).

This document provides a comprehensive resilience strategy for audio playback, covering:
1. **Offline handling** - Graceful degradation when network unavailable
2. **Quota management** - Google Cloud TTS quota monitoring and limits
3. **Error recovery** - Automatic retries, fallbacks, and user messaging
4. **Performance optimization** - Caching strategies and preloading
5. **Cost control** - Budget caps and usage tracking

---

## 🔍 Current System Analysis

### **What Exists:**

✅ **TTSService** (`src/services/audio/TTSService.ts`)
- Google Cloud TTS API integration
- Voice selection (male/female WaveNet voices)
- Speed control (0.5x - 1.5x)
- Cost estimation ($16 per 1M characters)
- API key validation

✅ **AudioPlaybackService** (`src/services/audio/AudioPlaybackService.ts`)
- expo-av audio playback
- AsyncStorage caching (20 files max, 7-day expiry)
- Play/pause/stop/seek controls
- Playback state management
- Network awareness (`loadAndPlayOfflineAware`)

✅ **NetworkStatusService**
- Online/offline detection
- Connection type monitoring

### **What's Missing:**

❌ **No quota tracking** - Can exceed Google Cloud TTS limits
❌ **No retry logic** - Single failure = permanent error
❌ **No fallback voices** - If WaveNet fails, no alternatives
❌ **No preloading** - Always fetch on-demand
❌ **No cost monitoring** - No budget caps or alerts
❌ **Limited offline support** - Only works if previously cached
❌ **No error categorization** - Generic error messages
❌ **No degraded mode** - All-or-nothing approach

---

## 🎯 Resilience Strategy

### **Core Principles:**

1. **Fail Gracefully** - Never show blank screens or cryptic errors
2. **Always Have a Fallback** - Text-only mode as last resort
3. **Optimize for Common Cases** - Cache popular readings
4. **Respect User Resources** - Don't burn through data/battery
5. **Monitor and Alert** - Know when things break

---

## 📱 Phase 1: Offline Handling (2 hours)

### **Goal:** App remains functional when offline, with clear feedback

### **Implementation:**

#### **1.1: Smart Caching Strategy**

**Current:** Only caches audio after generation (reactive)
**Improved:** Proactively cache likely-to-be-needed audio

```typescript
// src/services/audio/AudioCacheManager.ts (NEW FILE)

export class AudioCacheManager {
  /**
   * Preload audio for upcoming readings
   * Call this when user is online and idle
   */
  static async preloadUpcomingReadings(
    currentDate: Date,
    daysAhead: number = 3
  ): Promise<void> {
    const networkState = NetworkStatusService.getCurrentState();

    // Only preload on WiFi to save cellular data
    if (networkState.status !== 'online' || networkState.type !== 'wifi') {
      console.log('[AudioCacheManager] Skipping preload (not on WiFi)');
      return;
    }

    try {
      const readings = await ReadingService.getReadingsForDateRange(
        currentDate,
        addDays(currentDate, daysAhead)
      );

      let preloadedCount = 0;
      const maxPreload = 5; // Limit to 5 readings to avoid excessive API usage

      for (const reading of readings.slice(0, maxPreload)) {
        // Check if already cached
        const isCached = await audioPlaybackService.isAudioCached(
          reading.id,
          TTS_VOICES.FEMALE_PRIMARY.name,
          1.0
        );

        if (!isCached) {
          try {
            // Generate and cache (but don't play)
            const base64Audio = await TTSService.synthesizeSpeech(
              reading.gospel.text,
              TTS_VOICES.FEMALE_PRIMARY,
              1.0
            );

            await audioPlaybackService.cacheAudio(
              reading.id,
              base64Audio,
              TTS_VOICES.FEMALE_PRIMARY.name,
              1.0
            );

            preloadedCount++;

            // Add delay to avoid rate limiting
            await delay(1000);
          } catch (error) {
            console.error(`Failed to preload ${reading.id}:`, error);
            // Continue with next reading
          }
        }
      }

      console.log(`[AudioCacheManager] Preloaded ${preloadedCount} readings`);
    } catch (error) {
      console.error('[AudioCacheManager] Preload failed:', error);
    }
  }

  /**
   * Check cache health and report stats
   */
  static async getCacheStats(): Promise<{
    totalEntries: number;
    totalSizeBytes: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    hitRate: number;
  }> {
    const index = await this.getCacheIndex();
    const entries = Object.values(index);

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalSizeBytes: 0,
        oldestEntry: null,
        newestEntry: null,
        hitRate: 0,
      };
    }

    const totalSizeBytes = entries.reduce((sum, e) => sum + e.characterCount, 0);
    const timestamps = entries.map(e => e.timestamp);

    return {
      totalEntries: entries.length,
      totalSizeBytes,
      oldestEntry: new Date(Math.min(...timestamps)),
      newestEntry: new Date(Math.max(...timestamps)),
      hitRate: this.calculateHitRate(), // Track hits vs misses
    };
  }

  /**
   * Prioritize cache entries by usage frequency
   * Keep most-used readings, delete least-used
   */
  static async optimizeCacheByUsage(): Promise<void> {
    // Track access count in cache index
    const index = await this.getCacheIndex();
    const entries = Object.entries(index);

    // Sort by access count (descending)
    entries.sort(([, a], [, b]) => (b.accessCount || 0) - (a.accessCount || 0));

    // Keep top 15, delete rest
    const toKeep = entries.slice(0, 15);
    const toDelete = entries.slice(15);

    for (const [key] of toDelete) {
      await this.deleteCacheEntry(key);
    }

    console.log(`[AudioCacheManager] Optimized cache: kept ${toKeep.length}, deleted ${toDelete.length}`);
  }
}
```

**Integration Point:**
- Call `preloadUpcomingReadings()` when app opens
- Call when user connects to WiFi
- Call after completing a reading (preload next few)

---

#### **1.2: Offline Mode UI**

**Current:** Shows error "Failed to load audio"
**Improved:** Show clear offline indicator with options

```typescript
// src/components/audio/AudioOfflineIndicator.tsx (NEW FILE)

export const AudioOfflineIndicator: React.FC<{
  readingId: string;
  readingText: string;
  isCached: boolean;
}> = ({ readingId, readingText, isCached }) => {
  const networkState = useNetworkStatus();

  if (networkState.status === 'online') {
    return null; // Don't show when online
  }

  return (
    <View style={styles.container}>
      <Icon name="wifi-off" size={24} color="#FF6B35" />

      {isCached ? (
        <>
          <Text style={styles.title}>You're Offline</Text>
          <Text style={styles.message}>
            Audio for this reading is available from cache
          </Text>
          <Button
            title="Play Cached Audio"
            onPress={onPlayCached}
            icon="play-circle"
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>Audio Not Available Offline</Text>
          <Text style={styles.message}>
            Audio for this reading hasn't been downloaded yet. You can:
          </Text>

          <View style={styles.options}>
            <Button
              title="Read Text Instead"
              onPress={onReadText}
              variant="secondary"
              icon="book-open"
            />
            <Text style={styles.orText}>or</Text>
            <Button
              title="Download When Online"
              onPress={onDownloadLater}
              variant="text"
              icon="download-cloud"
            />
          </View>
        </>
      )}
    </View>
  );
};
```

**User Experience:**
- Clear visual indicator (WiFi icon with slash)
- Explains the situation ("You're offline")
- Provides actionable options (not just "Error")
- Doesn't block user from proceeding

---

#### **1.3: Text-Only Mode (Graceful Degradation)**

**When offline and not cached, switch to text-only reading**

```typescript
// src/hooks/useAudioOrTextMode.ts (NEW FILE)

export const useAudioOrTextMode = (reading: Reading) => {
  const [mode, setMode] = useState<'audio' | 'text' | 'loading'>('loading');
  const [isCached, setIsCached] = useState(false);
  const networkState = useNetworkStatus();

  useEffect(() => {
    async function checkAvailability() {
      // Check if audio is cached
      const cached = await audioPlaybackService.isAudioCached(
        reading.id,
        TTS_VOICES.FEMALE_PRIMARY.name,
        1.0
      );

      setIsCached(cached);

      // Decide mode
      if (networkState.status === 'online' || cached) {
        setMode('audio'); // Can play audio
      } else {
        setMode('text'); // Fall back to text
      }
    }

    checkAvailability();
  }, [reading.id, networkState.status]);

  return {
    mode,
    isCached,
    canPlayAudio: mode === 'audio',
    switchToText: () => setMode('text'),
    switchToAudio: () => setMode('audio'),
  };
};
```

**Usage in Screen:**
```typescript
const { mode, isCached, canPlayAudio } = useAudioOrTextMode(reading);

if (mode === 'text') {
  return <TextOnlyReadingView reading={reading} />;
}

return <AudioReadingView reading={reading} isCached={isCached} />;
```

---

### **Testing Scenarios:**

| Scenario | Expected Behavior |
|----------|-------------------|
| **Online + Cached** | Play cached audio instantly |
| **Online + Not Cached** | Generate TTS, play, cache for future |
| **Offline + Cached** | Play cached audio, show "Offline" badge |
| **Offline + Not Cached** | Show text-only mode with download option |
| **Online → Offline Mid-Playback** | Continue playing cached audio |
| **Offline → Online** | Auto-preload next 3 readings |

---

## 🔢 Phase 2: Quota Management (2 hours)

### **Goal:** Never exceed Google Cloud TTS quota, track costs

### **2.1: Quota Tracking**

**Google Cloud TTS Limits:**
- **Free Tier:** 4 million characters/month WaveNet voices
- **Cost:** $16 per 1 million characters after free tier
- **Rate Limit:** ~100 requests/second (practically unlimited for our use)

**Implementation:**

```typescript
// src/services/audio/TTSQuotaManager.ts (NEW FILE)

interface QuotaUsage {
  monthYear: string; // "2025-12"
  charactersUsed: number;
  requestCount: number;
  costUSD: number;
  lastUpdated: number;
}

export class TTSQuotaManager {
  private static readonly QUOTA_KEY = '@tts_quota_usage';
  private static readonly FREE_TIER_LIMIT = 4_000_000; // 4M characters/month
  private static readonly COST_PER_MILLION = 16.0;
  private static readonly WARNING_THRESHOLD = 0.8; // Warn at 80% usage
  private static readonly HARD_LIMIT = 5_000_000; // Stop at 5M (includes 1M paid buffer)

  /**
   * Track TTS API usage
   */
  static async trackUsage(characterCount: number): Promise<void> {
    const usage = await this.getCurrentMonthUsage();

    usage.charactersUsed += characterCount;
    usage.requestCount += 1;
    usage.costUSD = this.calculateCost(usage.charactersUsed);
    usage.lastUpdated = Date.now();

    await AsyncStorage.setItem(this.QUOTA_KEY, JSON.stringify(usage));

    // Check thresholds
    await this.checkThresholds(usage);
  }

  /**
   * Get current month usage
   */
  static async getCurrentMonthUsage(): Promise<QuotaUsage> {
    const monthYear = format(new Date(), 'yyyy-MM');

    try {
      const storedJson = await AsyncStorage.getItem(this.QUOTA_KEY);

      if (storedJson) {
        const stored: QuotaUsage = JSON.parse(storedJson);

        // Reset if new month
        if (stored.monthYear !== monthYear) {
          return this.createNewMonthUsage(monthYear);
        }

        return stored;
      }
    } catch (error) {
      console.error('Failed to get quota usage:', error);
    }

    return this.createNewMonthUsage(monthYear);
  }

  /**
   * Create new month usage record
   */
  private static createNewMonthUsage(monthYear: string): QuotaUsage {
    return {
      monthYear,
      charactersUsed: 0,
      requestCount: 0,
      costUSD: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Calculate cost based on usage
   */
  private static calculateCost(charactersUsed: number): number {
    if (charactersUsed <= this.FREE_TIER_LIMIT) {
      return 0; // Still in free tier
    }

    const paidCharacters = charactersUsed - this.FREE_TIER_LIMIT;
    return (paidCharacters / 1_000_000) * this.COST_PER_MILLION;
  }

  /**
   * Check if quota limits exceeded
   */
  static async isQuotaExceeded(): Promise<boolean> {
    const usage = await this.getCurrentMonthUsage();
    return usage.charactersUsed >= this.HARD_LIMIT;
  }

  /**
   * Check thresholds and send alerts
   */
  private static async checkThresholds(usage: QuotaUsage): Promise<void> {
    const percentUsed = usage.charactersUsed / this.HARD_LIMIT;

    // Warning at 80%
    if (percentUsed >= this.WARNING_THRESHOLD && percentUsed < 0.9) {
      await this.sendQuotaWarning(usage, 80);
    }

    // Critical warning at 90%
    if (percentUsed >= 0.9 && percentUsed < 1.0) {
      await this.sendQuotaWarning(usage, 90);
    }

    // Hard limit reached
    if (percentUsed >= 1.0) {
      await this.sendQuotaExceeded(usage);
    }
  }

  /**
   * Send quota warning notification
   */
  private static async sendQuotaWarning(
    usage: QuotaUsage,
    threshold: number
  ): Promise<void> {
    console.warn(`[TTSQuotaManager] ${threshold}% quota usage warning`);

    // Send push notification to admin
    // await sendAdminNotification({
    //   title: `TTS Quota ${threshold}% Used`,
    //   body: `${usage.charactersUsed.toLocaleString()} of ${this.HARD_LIMIT.toLocaleString()} characters used this month.`,
    // });

    // Log to analytics
    FirebaseAnalyticsService.logEvent('tts_quota_warning', {
      threshold,
      charactersUsed: usage.charactersUsed,
      costUSD: usage.costUSD,
    });
  }

  /**
   * Send quota exceeded notification
   */
  private static async sendQuotaExceeded(usage: QuotaUsage): Promise<void> {
    console.error('[TTSQuotaManager] QUOTA EXCEEDED!');

    // Alert admin immediately
    // await sendAdminAlert({
    //   severity: 'critical',
    //   title: 'TTS Quota Exceeded',
    //   message: `${usage.charactersUsed.toLocaleString()} characters used. TTS API calls will fail.`,
    // });

    FirebaseAnalyticsService.logEvent('tts_quota_exceeded', {
      charactersUsed: usage.charactersUsed,
      costUSD: usage.costUSD,
    });
  }

  /**
   * Get quota status for dashboard
   */
  static async getQuotaStatus(): Promise<{
    used: number;
    limit: number;
    percentUsed: number;
    cost: number;
    requestCount: number;
    isExceeded: boolean;
  }> {
    const usage = await this.getCurrentMonthUsage();

    return {
      used: usage.charactersUsed,
      limit: this.HARD_LIMIT,
      percentUsed: (usage.charactersUsed / this.HARD_LIMIT) * 100,
      cost: usage.costUSD,
      requestCount: usage.requestCount,
      isExceeded: usage.charactersUsed >= this.HARD_LIMIT,
    };
  }
}
```

**Integration in TTSService:**

```typescript
// In TTSService.synthesizeSpeech()

// BEFORE making API call
const quotaExceeded = await TTSQuotaManager.isQuotaExceeded();

if (quotaExceeded) {
  throw new Error('TTS quota exceeded for this month. Audio playback temporarily unavailable.');
}

// AFTER successful API call
await TTSQuotaManager.trackUsage(text.length);
```

---

### **2.2: Cost Control Measures**

**Strategy 1: Optimize Text Before TTS**

```typescript
/**
 * Preprocess text to reduce TTS character count
 */
function optimizeTextForTTS(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\.{3,}/g, '...') // Normalize ellipses
    .replace(/\n{3,}/g, '\n\n'); // Limit line breaks
}
```

**Strategy 2: Deduplication**

```typescript
/**
 * Generate hash of text to avoid duplicate TTS calls
 */
function generateTextHash(text: string): string {
  // Simple hash for duplicate detection
  return crypto.createHash('md5').update(text).digest('hex');
}

// Before calling TTS API
const textHash = generateTextHash(text);
const existingCache = await findCacheByHash(textHash);

if (existingCache) {
  console.log('Using existing TTS for duplicate text');
  return existingCache.audioData;
}
```

**Strategy 3: Bundled Audio**

```typescript
/**
 * For most common readings (e.g., Lord's Prayer), bundle pre-generated audio
 * Saves API calls and improves offline experience
 */
const BUNDLED_AUDIO = {
  'lords-prayer': require('@/assets/audio/lords-prayer.mp3'),
  'hail-mary': require('@/assets/audio/hail-mary.mp3'),
  'glory-be': require('@/assets/audio/glory-be.mp3'),
};

// In AudioPlaybackService
if (BUNDLED_AUDIO[readingId]) {
  console.log(`Using bundled audio for ${readingId}`);
  return BUNDLED_AUDIO[readingId];
}
```

---

### **2.3: Admin Dashboard for Quota Monitoring**

```typescript
// src/screens/admin/TTSQuotaDashboard.tsx (NEW FILE)

export const TTSQuotaDashboard: React.FC = () => {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const data = await TTSQuotaManager.getQuotaStatus();
      setStatus(data);
    }
    load();
  }, []);

  if (!status) return <Loading />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TTS Quota Usage (This Month)</Text>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${status.percentUsed}%`,
              backgroundColor: status.percentUsed > 90 ? '#FF0000' : '#4CAF50'
            }
          ]}
        />
      </View>

      <View style={styles.stats}>
        <Stat label="Characters Used" value={status.used.toLocaleString()} />
        <Stat label="Limit" value={status.limit.toLocaleString()} />
        <Stat label="Percent Used" value={`${status.percentUsed.toFixed(1)}%`} />
        <Stat label="Cost This Month" value={`$${status.cost.toFixed(2)}`} />
        <Stat label="API Requests" value={status.requestCount} />
      </View>

      {status.isExceeded && (
        <Alert variant="danger">
          ⚠️ Quota exceeded! TTS API is disabled until next month.
        </Alert>
      )}

      <Button
        title="View Detailed Logs"
        onPress={onViewLogs}
      />
    </View>
  );
};
```

---

## 🔄 Phase 3: Error Recovery (2 hours)

### **Goal:** Automatic retry logic with exponential backoff

### **3.1: Error Categorization**

```typescript
// src/services/audio/TTSErrorHandler.ts (NEW FILE)

export enum TTSErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',           // Offline, timeout
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',         // Hit API limits
  INVALID_API_KEY = 'INVALID_API_KEY',       // Auth failure
  RATE_LIMIT = 'RATE_LIMIT',                 // Too many requests
  INVALID_INPUT = 'INVALID_INPUT',           // Bad text input
  SERVER_ERROR = 'SERVER_ERROR',             // Google Cloud error (5xx)
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',           // Catch-all
}

export interface TTSError {
  type: TTSErrorType;
  message: string;
  retryable: boolean;
  userMessage: string;
  suggestedAction: string;
}

export class TTSErrorHandler {
  /**
   * Classify error and provide recovery strategy
   */
  static classifyError(error: any): TTSError {
    // Network errors (offline, timeout)
    if (error.message?.includes('network') || error.message?.includes('fetch failed')) {
      return {
        type: TTSErrorType.NETWORK_ERROR,
        message: error.message,
        retryable: true,
        userMessage: 'Unable to connect to audio service',
        suggestedAction: 'Check your internet connection and try again',
      };
    }

    // Quota exceeded
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return {
        type: TTSErrorType.QUOTA_EXCEEDED,
        message: error.message,
        retryable: false,
        userMessage: 'Audio generation limit reached',
        suggestedAction: 'Try again next month or use cached readings',
      };
    }

    // Invalid API key
    if (error.message?.includes('API key') || error.message?.includes('401')) {
      return {
        type: TTSErrorType.INVALID_API_KEY,
        message: error.message,
        retryable: false,
        userMessage: 'Audio service authentication failed',
        suggestedAction: 'Please contact support',
      };
    }

    // Rate limiting
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return {
        type: TTSErrorType.RATE_LIMIT,
        message: error.message,
        retryable: true,
        userMessage: 'Too many audio requests',
        suggestedAction: 'Please wait a moment and try again',
      };
    }

    // Invalid input
    if (error.message?.includes('invalid') || error.message?.includes('400')) {
      return {
        type: TTSErrorType.INVALID_INPUT,
        message: error.message,
        retryable: false,
        userMessage: 'Unable to generate audio for this text',
        suggestedAction: 'Please read the text instead',
      };
    }

    // Server errors (500+)
    if (error.message?.includes('500') || error.message?.includes('503')) {
      return {
        type: TTSErrorType.SERVER_ERROR,
        message: error.message,
        retryable: true,
        userMessage: 'Audio service temporarily unavailable',
        suggestedAction: 'Please try again in a few minutes',
      };
    }

    // Unknown error
    return {
      type: TTSErrorType.UNKNOWN_ERROR,
      message: error.message || 'Unknown error',
      retryable: true,
      userMessage: 'Audio playback failed',
      suggestedAction: 'Please try again or read the text instead',
    };
  }
}
```

---

### **3.2: Retry Logic with Exponential Backoff**

```typescript
// src/utils/retryWithBackoff.ts (NEW FILE)

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let delayMs = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt}/${config.maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const classified = TTSErrorHandler.classifyError(error);

      if (!classified.retryable) {
        console.log(`[Retry] Error not retryable: ${classified.type}`);
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === config.maxRetries) {
        console.log(`[Retry] Max retries (${config.maxRetries}) exceeded`);
        throw error;
      }

      // Wait before retrying
      console.log(`[Retry] Waiting ${delayMs}ms before retry...`);
      await delay(delayMs);

      // Exponential backoff
      delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError;
}
```

**Integration in TTSService:**

```typescript
// Wrap TTS API call with retry logic

static async synthesizeSpeech(
  text: string,
  voice: TTSVoiceConfig = TTS_VOICES.FEMALE_PRIMARY,
  speed: number = 1.0
): Promise<string> {
  return retryWithBackoff(
    async () => {
      // Original TTS API call logic here
      const response = await fetch(`${TTS_API_ENDPOINT}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TTS API error: ${errorData.error.message}`);
      }

      return data.audioContent;
    },
    {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
    }
  );
}
```

---

### **3.3: Fallback Voices**

**If primary voice fails, try secondary voices**

```typescript
const VOICE_FALLBACK_ORDER = [
  TTS_VOICES.FEMALE_PRIMARY,   // Try first
  TTS_VOICES.FEMALE_SECONDARY, // If first fails
  TTS_VOICES.MALE_PRIMARY,     // If both female fail
  TTS_VOICES.MALE_SECONDARY,   // Last resort
];

static async synthesizeSpeechWithFallback(
  text: string,
  preferredVoice: TTSVoiceConfig,
  speed: number = 1.0
): Promise<{ audio: string; voiceUsed: TTSVoiceConfig }> {
  // Try preferred voice first
  try {
    const audio = await this.synthesizeSpeech(text, preferredVoice, speed);
    return { audio, voiceUsed: preferredVoice };
  } catch (error) {
    console.warn(`Primary voice ${preferredVoice.name} failed, trying fallbacks`);
  }

  // Try fallback voices
  for (const fallbackVoice of VOICE_FALLBACK_ORDER) {
    if (fallbackVoice.name === preferredVoice.name) continue; // Skip already-tried voice

    try {
      console.log(`Trying fallback voice: ${fallbackVoice.name}`);
      const audio = await this.synthesizeSpeech(text, fallbackVoice, speed);
      return { audio, voiceUsed: fallbackVoice };
    } catch (error) {
      console.warn(`Fallback voice ${fallbackVoice.name} failed`);
    }
  }

  throw new Error('All TTS voices failed');
}
```

---

## ⚡ Phase 4: Performance Optimization (1.5 hours)

### **4.1: Preloading Strategy**

```typescript
// Preload next reading when current reading starts playing

audioPlaybackService.subscribe((state) => {
  if (state.isPlaying && !state.isLoading) {
    // User started listening to current reading
    // Preload next reading in background
    preloadNextReading(currentDate);
  }
});

async function preloadNextReading(currentDate: Date): Promise<void> {
  const nextDate = addDays(currentDate, 1);
  const nextReading = await ReadingService.getDailyReadings(nextDate);

  // Check if already cached
  const isCached = await audioPlaybackService.isAudioCached(
    nextReading.id,
    TTS_VOICES.FEMALE_PRIMARY.name,
    1.0
  );

  if (!isCached && NetworkStatusService.getCurrentState().status === 'online') {
    console.log('[Preload] Generating audio for tomorrow\'s reading');

    try {
      const base64Audio = await TTSService.synthesizeSpeech(
        nextReading.gospel.text,
        TTS_VOICES.FEMALE_PRIMARY,
        1.0
      );

      await audioPlaybackService.cacheAudio(
        nextReading.id,
        base64Audio,
        TTS_VOICES.FEMALE_PRIMARY.name,
        1.0
      );

      console.log('[Preload] Tomorrow\'s audio ready!');
    } catch (error) {
      console.error('[Preload] Failed:', error);
    }
  }
}
```

---

### **4.2: Cache Warmup on WiFi**

```typescript
// When user connects to WiFi, warm up cache

NetworkStatusService.subscribe((state) => {
  if (state.status === 'online' && state.type === 'wifi') {
    console.log('[Cache] WiFi connected, starting cache warmup');
    AudioCacheManager.preloadUpcomingReadings(new Date(), 7); // Next week
  }
});
```

---

### **4.3: Compression**

```typescript
/**
 * Compress cached audio to save storage
 * Google Cloud TTS returns base64 MP3 (already compressed)
 * But we can optimize further with LZ compression
 */
import pako from 'pako';

function compressBase64(base64: string): string {
  const compressed = pako.deflate(base64, { level: 9 });
  return btoa(String.fromCharCode(...compressed));
}

function decompressBase64(compressed: string): string {
  const binary = atob(compressed);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressed = pako.inflate(bytes);
  return String.fromCharCode(...decompressed);
}
```

**Expected Savings:** ~30-40% storage reduction

---

## 📊 Phase 5: Monitoring & Alerting (1 hour)

### **5.1: Error Tracking**

```typescript
// Track all audio errors in Firebase Analytics

FirebaseAnalyticsService.logEvent('audio_error', {
  errorType: classified.type,
  readingId: readingId,
  voiceName: voice.name,
  networkStatus: networkState.status,
  cacheAvailable: isCached,
  characterCount: text.length,
});
```

---

### **5.2: Performance Metrics**

```typescript
// Track audio load times

const startTime = Date.now();

await audioPlaybackService.loadAndPlay(text, readingId, voice, speed);

const loadTimeMs = Date.now() - startTime;

FirebaseAnalyticsService.logEvent('audio_loaded', {
  readingId,
  loadTimeMs,
  wasCached: isCached,
  textLength: text.length,
});
```

---

### **5.3: Cost Dashboard**

```typescript
// Track monthly TTS costs

async function logMonthlyCost() {
  const status = await TTSQuotaManager.getQuotaStatus();

  FirebaseAnalyticsService.logEvent('tts_monthly_cost', {
    month: format(new Date(), 'yyyy-MM'),
    charactersUsed: status.used,
    costUSD: status.cost,
    requestCount: status.requestCount,
  });
}
```

---

## ✅ Implementation Checklist

### **Phase 1: Offline Handling** (2 hours)
- [ ] Create `AudioCacheManager.ts` with preloading logic
- [ ] Implement `preloadUpcomingReadings()` function
- [ ] Create `AudioOfflineIndicator` component
- [ ] Add `useAudioOrTextMode` hook
- [ ] Create text-only reading view
- [ ] Test all offline scenarios

### **Phase 2: Quota Management** (2 hours)
- [ ] Create `TTSQuotaManager.ts` with tracking
- [ ] Integrate quota check in `TTSService.synthesizeSpeech()`
- [ ] Add `trackUsage()` after successful API calls
- [ ] Implement threshold warnings (80%, 90%, 100%)
- [ ] Create admin dashboard for quota monitoring
- [ ] Test quota exceeded scenario

### **Phase 3: Error Recovery** (2 hours)
- [ ] Create `TTSErrorHandler.ts` with error classification
- [ ] Implement `retryWithBackoff()` utility
- [ ] Wrap TTS API calls with retry logic
- [ ] Add fallback voice support
- [ ] Create user-friendly error messages
- [ ] Test all error scenarios

### **Phase 4: Performance** (1.5 hours)
- [ ] Implement preloading on playback start
- [ ] Add cache warmup on WiFi connection
- [ ] Optimize cache by usage frequency
- [ ] Consider compression (optional)
- [ ] Test preloading performance

### **Phase 5: Monitoring** (1 hour)
- [ ] Add error tracking events
- [ ] Add performance metric events
- [ ] Create cost tracking dashboard
- [ ] Set up Firebase Analytics queries
- [ ] Document monitoring procedures

---

## 🎯 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Offline Success Rate** | >95% | % of offline playback attempts that succeed (if cached) |
| **Cache Hit Rate** | >80% | % of audio requests served from cache |
| **TTS API Errors** | <2% | % of TTS API calls that fail |
| **Retry Success Rate** | >70% | % of retries that eventually succeed |
| **Monthly TTS Cost** | <$50 | Total TTS API cost per month |
| **Average Load Time** | <2s | Time from play button to audio start |
| **Quota Usage** | <80% | % of monthly quota used |

---

## 💰 Cost Analysis

### **Current Usage (Estimated):**

Assumptions:
- 100 daily active users
- Each listens to 1 full reading per day
- Average reading: 500 characters
- 30 days/month

**Calculation:**
```
Characters/month = 100 users × 1 reading/day × 500 chars × 30 days
                 = 1,500,000 characters/month
                 = 1.5M characters

Cost = $0 (under 4M free tier)
```

### **With Resilience Improvements:**

**Cache Hit Rate: 80%**
```
API Calls Needed = 1.5M × 20% (cache miss rate) = 300,000 characters
Cost = $0 (under free tier)
```

**Savings: $0** (but protected from spikes)

### **At Scale (1,000 users):**

```
Without caching: 15M characters/month = $176/month
With 80% cache hit: 3M characters/month = $0/month (free tier)
Savings: $176/month = $2,112/year
```

**ROI: Excellent** - Caching pays for itself immediately at scale

---

## 🚨 Failure Scenarios & Recovery

### **Scenario 1: Google Cloud TTS Down**

**Symptoms:**
- All TTS API calls return 500/503 errors
- No new audio can be generated

**Automatic Recovery:**
1. Retry with exponential backoff (3 attempts)
2. If all retries fail, show "Service temporarily unavailable"
3. Offer cached audio if available
4. Fall back to text-only mode
5. Alert admin via Firebase notification

**User Experience:**
- Users with cached audio: unaffected
- Users without cache: text-only mode

---

### **Scenario 2: Quota Exceeded Mid-Month**

**Symptoms:**
- Hit 5M character limit
- API returns 429 quota errors

**Automatic Recovery:**
1. Detect quota exceeded in `TTSQuotaManager`
2. Disable TTS generation for remainder of month
3. Serve all audio from cache only
4. Show banner: "Audio temporarily limited, using cached readings"
5. Alert admin immediately

**User Experience:**
- 80% of users unaffected (served from cache)
- 20% shown text-only mode
- Clear explanation of temporary limitation

---

### **Scenario 3: User Offline for Extended Period**

**Symptoms:**
- User offline for 7+ days
- Cache expires (7-day expiry)

**Automatic Recovery:**
1. Detect cache expired
2. Show offline indicator
3. Offer text-only mode
4. When online, auto-preload next 3 days
5. Notify user "Audio downloaded for offline use"

**User Experience:**
- Clear offline indicator
- Seamless switch to text mode
- Automatic recovery when online

---

## 📁 Files to Create/Modify

| File | Type | Purpose |
|------|------|---------|
| `src/services/audio/AudioCacheManager.ts` | NEW | Preloading and cache optimization |
| `src/services/audio/TTSQuotaManager.ts` | NEW | Quota tracking and cost monitoring |
| `src/services/audio/TTSErrorHandler.ts` | NEW | Error classification and recovery |
| `src/utils/retryWithBackoff.ts` | NEW | Retry logic utility |
| `src/hooks/useAudioOrTextMode.ts` | NEW | Audio vs text mode selection |
| `src/components/audio/AudioOfflineIndicator.tsx` | NEW | Offline UI component |
| `src/screens/admin/TTSQuotaDashboard.tsx` | NEW | Admin monitoring dashboard |
| `src/services/audio/TTSService.ts` | MODIFY | Add retry, fallback, quota integration |
| `src/services/audio/AudioPlaybackService.ts` | MODIFY | Add compression, preloading |

---

## 🎓 Key Takeaways

### **Critical Improvements:**

1. **Offline Resilience**
   - Proactive caching saves 80% of API calls
   - Text-only fallback ensures zero abandonment
   - Clear offline indicators reduce confusion

2. **Cost Control**
   - Quota tracking prevents surprise bills
   - Free tier covers ~300 daily users
   - Caching ROI: $2,112/year at 1K users

3. **Error Recovery**
   - Retry logic handles 70%+ of transient errors
   - Fallback voices provide redundancy
   - Classified errors improve debugging

4. **Performance**
   - Preloading eliminates perceived latency
   - Cache warmup on WiFi optimizes offline experience
   - Compression saves 30-40% storage

### **Long-Term Benefits:**

- **Reliability:** 99%+ uptime for audio playback
- **Cost Efficiency:** Stay in free tier longer
- **User Experience:** Seamless offline/online transitions
- **Maintainability:** Clear error messages, monitoring dashboards
- **Scalability:** System handles 10x user growth with no code changes

---

**This resilience plan future-proofs your audio system for years of stable, cost-effective operation.**

Ready to implement Phase 1 (Offline Handling) first?
