/**
 * Pronunciation Practice Types
 *
 * Type definitions for pronunciation practice feature using Azure Speech Assessment API.
 */

/**
 * Practice Sentence
 * A single sentence extracted from daily readings for practice
 */
export interface PracticeSentence {
  id: string;
  text: string;
  source: string; // "First Reading", "Responsorial Psalm", "Gospel", etc.
  reference: string; // "John 3:16-17"
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
  readingContent?: string; // Full reading text for expand/collapse view
}

/**
 * Pronunciation Scoring (from Azure)
 * Four dimensions of pronunciation assessment
 */
export interface PronunciationScore {
  accuracyScore: number; // 0-100: How accurately words were pronounced
  fluencyScore: number; // 0-100: How smooth and natural the speech was
  completenessScore: number; // 0-100: Percentage of words spoken
  prosodyScore: number; // 0-100: Rhythm, stress, and intonation
  overallScore: number; // 0-100: Combined weighted score
}

/**
 * Word-level Assessment
 * Detailed feedback for each word
 */
export interface WordAssessment {
  word: string;
  accuracyScore: number; // 0-100
  errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation' | 'UnexpectedBreak' | 'MissingBreak';
  phonemes?: PhonemeAssessment[]; // Optional detailed phoneme-level feedback
}

/**
 * Phoneme-level Assessment
 * Most granular level of pronunciation feedback
 */
export interface PhonemeAssessment {
  phoneme: string;
  accuracyScore: number;
}

/**
 * Pronunciation Result
 * Complete result from a pronunciation assessment
 */
export interface PronunciationResult {
  recognizedText: string; // What Azure heard
  scores: PronunciationScore;
  words: WordAssessment[];
  duration: number; // Duration in seconds
  confidence: number; // Recognition confidence 0-1
}

/**
 * Practice Attempt
 * A single attempt at pronouncing a sentence
 */
export interface PracticeAttempt {
  id: string;
  sentenceId: string;
  timestamp: number; // Unix timestamp
  result: PronunciationResult;
  referenceText: string; // Original sentence text
  audioUri?: string; // Path to recorded audio (optional, for replay)
}

/**
 * Practice Session
 * A complete practice session with multiple sentences
 */
export interface PracticeSession {
  id: string;
  readingId: string; // Link to the reading this practice is based on
  date: string; // ISO date string
  sentences: PracticeSentence[];
  attempts: PracticeAttempt[];
  currentIndex: number; // Which sentence user is currently on
  completed: boolean;
  startTime: number; // Unix timestamp
  endTime?: number; // Unix timestamp
}

/**
 * Practice Statistics
 * Aggregated stats for user's practice history
 */
export interface PracticeStats {
  totalSessions: number;
  completedSessions: number;
  totalAttempts: number;
  averageAccuracy: number;
  averageFluency: number;
  averageCompleteness: number;
  averageProsody: number;
  averageOverall: number;
  currentStreak: number; // Days in a row with practice
  bestScore: number;
  mostPracticedSource: string; // "Gospel", "First Reading", etc.
  totalPracticeTime: number; // Total seconds spent practicing
}

/**
 * Session Summary
 * Summary shown at end of practice session
 */
export interface SessionSummary {
  sessionId: string;
  sentencesCompleted: number;
  totalSentences: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  totalTime: number;
  improvements: string[]; // Suggestions for improvement
  strengths: string[]; // What user did well
}

/**
 * Recording State
 * State of audio recording
 */
export type RecordingState = 'idle' | 'preparing' | 'recording' | 'processing' | 'complete' | 'error';

/**
 * Practice Error
 * Error types specific to practice feature
 */
export interface PracticeError {
  code: 'PERMISSION_DENIED' | 'RECORDING_FAILED' | 'ASSESSMENT_FAILED' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  details?: string;
}
