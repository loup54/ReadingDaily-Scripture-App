# ReadingDaily Scripture App - Quick Reference Guide

## Key Files at a Glance

### Text-to-Speech
- **TTSService.ts** - Google Cloud TTS (main service)
- **GoogleTTSService.ts** - Word pronunciation caching
- **AudioPlaybackService.ts** - Playback management and caching

### UI Components
- **EnhancedAudioPlayer.tsx** - Audio player UI
- **DailyReadingsScreen.tsx** - Main reading display
- **AudioTranslationSetupScreen.tsx** - User settings onboarding

### Data & State
- **ReadingService.ts** - Scripture data fetching
- **TranslationService.ts** - Word translation
- **useSettingsStore.ts** - User preferences
- **useTranslationStore.ts** - Translation language selection

### Audio Features
- **AudioHighlightingService.ts** - Word-by-word highlighting
- **AzureSpeechService.ts** - Pronunciation assessment

---

## TTS Service Overview

### Using TTSService
```typescript
import { TTSService, TTS_VOICES } from '@/services/audio';

// Generate TTS audio
const base64Audio = await TTSService.synthesizeSpeech(
  "Lord, have mercy on us",
  TTS_VOICES.FEMALE_PRIMARY,
  1.0  // speed
);
```

### Available Voices
- `TTS_VOICES.FEMALE_PRIMARY` - en-US-Wavenet-C
- `TTS_VOICES.FEMALE_SECONDARY` - en-US-Wavenet-F  
- `TTS_VOICES.MALE_PRIMARY` - en-US-Wavenet-D
- `TTS_VOICES.MALE_SECONDARY` - en-US-Wavenet-A

### Cost Estimation
- Google Cloud TTS: $16 per 1 million characters
- Average daily reading: ~2,500 characters = ~$0.00004

---

## Audio Playback Usage

### Playing Scripture Audio
```typescript
import { audioPlaybackService } from '@/services/audio';
import { TTS_VOICES } from '@/services/audio';

// Load and play with caching
await audioPlaybackService.loadAndPlay(
  scriptureText,
  readingId,        // e.g., "gospel_2025-01-15"
  TTS_VOICES.FEMALE_PRIMARY,
  1.0               // playback speed
);

// Subscribe to playback updates
const unsubscribe = audioPlaybackService.subscribe((state) => {
  console.log(`Playing: ${state.currentTime}ms / ${state.duration}ms`);
});

// Controls
await audioPlaybackService.play();
await audioPlaybackService.pause();
await audioPlaybackService.stop();
await audioPlaybackService.setSpeed(1.5);
await audioPlaybackService.seekTo(30000); // 30 seconds
```

### Cache Management
- **Max entries:** 20 (configurable)
- **Expiry:** 7 days
- **Format:** `{readingId}_{voiceName}_{speed}`
- **Clear cache:** `AudioPlaybackService.clearCache()`

---

## Settings & Configuration

### Audio Settings
```typescript
import { useSettingsStore } from '@/stores/useSettingsStore';

const { settings, updateAudioSettings } = useSettingsStore();

// Current settings
console.log(settings.audio.voice);   // 'auto' | 'male' | 'female'
console.log(settings.audio.speed);   // 0.5 | 0.75 | 1.0 | 1.25 | 1.5

// Update settings
await updateAudioSettings({
  voice: 'male',
  speed: 1.25,
  enableAudioHighlighting: true
});
```

### Translation Settings
```typescript
import { useTranslationStore } from '@/stores/useTranslationStore';

const { preferredLanguage, setPreferredLanguage } = useTranslationStore();

// Change language (es, fr, de, it, pt, ru, zh-CN, zh-TW, ja, ko, ar, hi, vi, th, pl, nl, tr)
await setPreferredLanguage('es');
```

---

## Daily Readings

### Fetching Readings
```typescript
import { ReadingService } from '@/services/readings/ReadingService';

const readings = await ReadingService.getDailyReadings(new Date());

console.log(readings.gospel.content);       // Gospel text
console.log(readings.firstReading.reference); // "John 1:1-5"
console.log(readings.psalm.title);           // Psalm name
console.log(readings.secondReading?.content); // May be null (weekdays)
```

### Reading Structure
```typescript
interface DailyReadings {
  id: string;
  date: Date;
  gospel: Reading;
  firstReading: Reading;
  psalm: Reading;
  secondReading?: Reading;  // Sundays/Feast days only
  feast?: string;
  liturgicalSeason?: string;
}

interface Reading {
  id: string;
  type: 'gospel' | 'first-reading' | 'psalm' | 'second-reading';
  title: string;
  reference: string;  // e.g., "Luke 6:1-5"
  content: string;
  date: Date;
  source?: 'firestore' | 'bundle' | 'usccb';
}
```

---

## Translation Feature

### Translate Words
```typescript
import { TranslationService } from '@/services/translation/TranslationService';

const service = new TranslationService(apiKey);

const result = await service.translateWord(
  'gospel',
  'es'  // Spanish
);

console.log(result.translatedText);  // "evangelio"
console.log(result.cached);          // true if cached
```

### Supported Languages
```
en (English), es (Spanish), fr (French), de (German), 
it (Italian), pt (Portuguese), ru (Russian), 
zh-CN (Chinese Simplified), zh-TW (Chinese Traditional),
ja (Japanese), ko (Korean), ar (Arabic), 
hi (Hindi), vi (Vietnamese), th (Thai), 
pl (Polish), nl (Dutch), tr (Turkish)
```

---

## Audio Highlighting

### Enabling Word Highlighting
```typescript
import { audioHighlightingService } from '@/services/audio';

// Initialize
await audioHighlightingService.startHighlighting({
  readingId: 'gospel_2025-01-15',
  readingType: 'gospel',
  onWordChange: (event) => {
    console.log(`Now reading: ${event.word.word}`);
  },
  onError: (error) => {
    console.error('Highlighting failed:', error);
  }
});

// Update position
audioHighlightingService.updateAudioPosition(15000); // 15 seconds

// Control
audioHighlightingService.pauseHighlighting();
audioHighlightingService.resumeHighlighting();
audioHighlightingService.stopHighlighting();
```

### Timing Data Format
```typescript
{
  word: string;
  startTimeMs: number;
  endTimeMs: number;
}
```

---

## Pronunciation Assessment

### Azure Speech Service
```typescript
import AzureSpeechService from '@/services/speech/AzureSpeechService';

// Initialize once
AzureSpeechService.initialize();

// Assess pronunciation
const result = await AzureSpeechService.assessPronunciation(
  audioFilePath,
  referenceText  // What user should read
);

console.log(result.scores.accuracyScore);    // 0-100
console.log(result.scores.fluencyScore);     // 0-100
console.log(result.scores.completenessScore); // 0-100
console.log(result.scores.prosodyScore);     // 0-100
```

---

## Environment Setup

### Required API Keys
```env
# Google Cloud (TTS, Translation, Speech-to-Text)
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=AIzaSyB...

# Azure Speech Services (Pronunciation)
EXPO_PUBLIC_AZURE_SPEECH_KEY=...
EXPO_PUBLIC_AZURE_SPEECH_REGION=australiaeast

# Firebase (Readings database)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=readingdaily-scripture-fe502
```

### Enable Google Cloud APIs
- Cloud Text-to-Speech
- Cloud Translation API
- Cloud Speech-to-Text (optional)

---

## Debugging

### Console Prefixes
- `[TTSService]` - TTS generation
- `[AudioPlaybackService]` - Playback state
- `[EnhancedAudioPlayer]` - Player component
- `[AudioHighlighting]` - Word highlighting
- `[TranslationService]` - Word translation
- `[ReadingService]` - Scripture data

### Enable Debug Logging
```typescript
// All services use console.log/console.error
// No additional setup needed - check DevTools console
```

### Test Offline Mode
```typescript
import { NetworkStatusService } from '@/services/network/NetworkStatusService';

// Simulate offline
const state = NetworkStatusService.getCurrentState();
console.log(state.status);  // 'online' or 'offline'
```

---

## Common Tasks

### Play Daily Gospel with TTS
```typescript
// In component or hook
const { settings } = useSettingsStore();
const readings = await ReadingService.getDailyReadings(new Date());

const voice = settings.audio.voice === 'male' 
  ? TTS_VOICES.MALE_PRIMARY 
  : TTS_VOICES.FEMALE_PRIMARY;

await audioPlaybackService.loadAndPlay(
  readings.gospel.content,
  readings.gospel.id,
  voice,
  settings.audio.speed
);
```

### Translate Word on Tap
```typescript
import { TranslationService } from '@/services/translation/TranslationService';
import { useTranslationStore } from '@/stores/useTranslationStore';

const { preferredLanguage } = useTranslationStore();
const service = new TranslationService(apiKey);

const handleWordPress = async (word: string) => {
  const result = await service.translateWord(word, preferredLanguage);
  Alert.alert(word, result.translatedText);
};
```

### Cache Audio for Offline
```typescript
// Audio is cached automatically by AudioPlaybackService
// To pre-cache multiple readings:
for (const date of datesNeeded) {
  const readings = await ReadingService.getDailyReadings(date);
  const voice = TTS_VOICES.FEMALE_PRIMARY;
  
  // This triggers caching
  await audioPlaybackService.loadAndPlay(
    readings.gospel.content,
    readings.gospel.id,
    voice,
    1.0
  );
}
```

---

## Troubleshooting

### "Google Cloud API key not configured"
- Check `.env` file for `EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY`
- Ensure key starts with `AIzaSy`
- Verify APIs are enabled in Google Cloud console

### "No audio content received"
- Check Google Cloud TTS quota and billing
- Verify network connection
- Check API key has correct permissions

### "Highlighting unavailable"
- Feature disabled by default in settings
- Requires timing data (generated by Cloud Function)
- Check cloud function deployment
- Enable in Settings > Audio > Word Highlighting

### App crashes on startup
- Check AsyncStorage persistence middleware
- Verify Zustand store initialization
- Check console for detailed error logs

---

## Performance Tips

1. **Minimize TTS calls** - Use caching aggressively
2. **Batch translations** - Don't translate every word individually
3. **Lazy load readings** - Only fetch current + next week
4. **Clear old cache** - Automatic cleanup at 20 entries
5. **Monitor quota** - Google Cloud TTS is usage-based

---

## Further Reading

- **Google Cloud TTS Docs:** https://cloud.google.com/text-to-speech/docs
- **Expo Audio:** https://docs.expo.dev/versions/latest/sdk/audio/
- **Azure Speech Services:** https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/
- **Firebase Firestore:** https://firebase.google.com/docs/firestore

