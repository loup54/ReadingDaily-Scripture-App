# Pronunciation Practice Screen

## Overview

The main screen for pronunciation practice. Integrates all pronunciation components and manages the complete practice flow from session start to completion.

## Usage

```typescript
import { PronunciationPracticeScreen } from '@/screens/practice';

function App() {
  return (
    <PronunciationPracticeScreen
      onBack={() => navigation.goBack()}
      onSettingsPress={() => navigation.navigate('Settings')}
    />
  );
}
```

## Features

### Session Management
- Auto-initializes practice session from daily readings
- Extracts 5 sentences with SentenceExtractionService
- Tracks current sentence index and completion state
- Handles session reset and restart

### Recording Flow
- Permission checks on mount
- Microphone permission requests with system dialog
- Start/stop recording with RecordingControls
- Real-time duration display
- State management (idle → recording → processing → complete)

### Pronunciation Assessment
- Auto-triggers Azure assessment after recording
- Shows loading state during assessment
- Displays comprehensive feedback
- 4-dimension scoring display
- Word-level error analysis

### Navigation
- Sentence navigation (previous/next)
- Progress tracking (sentence X of Y)
- Difficulty indicators
- Action buttons (Try Again, Next, Finish)
- Session completion celebration

### Error Handling
- Permission denied alerts
- Recording failure handling
- Assessment error feedback
- Network error handling
- User-friendly error messages

## Props

```typescript
interface PronunciationPracticeScreenProps {
  onBack?: () => void;           // Called when back button pressed
  onSettingsPress?: () => void;  // Called when settings button pressed
}
```

## State Flow

```
1. Mount → Check permissions
2. Load readings → Auto-start session
3. Display sentence → Show recording controls
4. Start recording → Permission check → Record
5. Stop recording → Auto-assess pronunciation
6. Display feedback → Show results
7. Next sentence → Repeat 3-6
8. Session complete → Save to history → Show celebration
```

## Components Used

- `RecordingControls` - Microphone button and recording UI
- `PronunciationFeedback` - Score display and word analysis
- `PracticeSentenceDisplay` - Sentence text and navigation

## Store Integration

```typescript
const {
  currentSession,
  recordingState,
  latestResult,
  error,
  hasPermissions,
  startSession,
  startRecording,
  stopRecording,
  nextSentence,
  previousSentence,
  // ... more
} = usePracticeStore();
```

## Error States

### Permission Denied
Shows alert with option to open settings.

### Recording Failed
Shows error alert and resets recording state.

### Assessment Failed
Shows error alert with retry option.

### No Readings Available
Shows error and prompts user to load readings.

## Loading States

### Session Loading
Shows spinner with "Preparing practice session..." text.

### Assessment Processing
Shows spinner with "Analyzing your pronunciation..." text.

## Example Flow

```typescript
// 1. User opens screen
useEffect(() => {
  checkPermissions();
}, []);

// 2. Readings loaded → Start session
useEffect(() => {
  if (readings && !currentSession) {
    handleStartSession();
  }
}, [readings]);

// 3. User taps mic → Request permission if needed
const handleStartRecording = async () => {
  if (!hasPermissions) {
    await handleRequestPermissions();
    return;
  }
  await startRecording();
};

// 4. User stops recording → Auto-assess
const handleStopRecording = async () => {
  await stopRecording(); // Auto-triggers assessment
};

// 5. User views feedback → Next sentence
const handleNextSentence = () => {
  nextSentence();
};
```

## Customization

### Custom Sentence Selection

```typescript
// Override sentence extraction
const customSentences = [
  { id: '1', text: 'Custom sentence', ... },
  // ...
];

// Manually create session
const session = {
  id: 'custom-session',
  sentences: customSentences,
  // ...
};
```

### Custom Error Handling

```typescript
useEffect(() => {
  if (error) {
    // Custom error handling
    customErrorHandler(error);
    clearError();
  }
}, [error]);
```

## See Also

- [PRONUNCIATION_PRACTICE.md](../../../docs/PRONUNCIATION_PRACTICE.md) - Complete feature documentation
- [AZURE_SPEECH_SETUP.md](../../../docs/AZURE_SPEECH_SETUP.md) - Azure configuration guide
- [usePracticeStore.ts](../../stores/usePracticeStore.ts) - State management
