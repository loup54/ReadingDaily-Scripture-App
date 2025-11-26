/**
 * Reading types and interfaces
 */

export type ReadingType = 'gospel' | 'first-reading' | 'psalm' | 'second-reading';

export interface Reading {
  id: string;
  type: ReadingType;
  title: string;
  reference: string; // e.g., "Luke 6:1-5"
  content: string;
  audioUrl?: string;
  date: Date;

  // Metadata (Phase 7+)
  source?: 'firestore' | 'bundle' | 'usccb'; // Data source
  scrapedAt?: number; // Unix timestamp when scraped (ms)
  cachedAt?: number; // Unix timestamp when cached (ms)
}

export interface DailyReadings {
  id: string;
  date: Date;
  gospel: Reading;
  firstReading: Reading;
  psalm: Reading;
  secondReading?: Reading; // Optional - present on Sundays and feast days
  feast?: string; // Optional feast day name
  liturgicalSeason?: string; // e.g., "Ordinary Time", "Advent"

  // Metadata (Phase 7+)
  source?: 'firestore' | 'bundle' | 'usccb'; // Data source
  scrapedAt?: number; // Unix timestamp when scraped (ms)
  cachedAt?: number; // Unix timestamp when cached (ms)
}

export interface ReadingState {
  currentDate: Date;
  readings: DailyReadings | null;
  loading: boolean;
  error: string | null;
  activeTab: ReadingType;
}

export interface ReadingStore extends ReadingState {
  // Actions
  loadReadings: (date: Date) => Promise<void>;
  setActiveTab: (tab: ReadingType) => void;
  navigateToDate: (date: Date) => Promise<void>;
  goToToday: () => Promise<void>;
  goToTomorrow: () => Promise<void>;
  goToYesterday: () => Promise<void>;
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  voice: 'auto' | 'male' | 'female';
}

export interface TranslationState {
  enabled: boolean;
  language: 'spanish' | 'vietnamese' | 'mandarin';
  selectedText?: string;
}