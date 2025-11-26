/**
 * Unit Tests for AudioHighlightingService
 * Tests core highlighting logic, particularly binary search for word lookup
 */

import { AudioHighlightingService } from '../AudioHighlightingService';
import { SentenceTimingData, WordTiming } from '@/types';

/**
 * Mock timing data for testing
 */
const createMockTimingData = (): SentenceTimingData => ({
  readingId: 'test_gospel',
  text: 'For God so loved the world',
  readingType: 'gospel',
  date: new Date(),
  reference: 'John 3:16',
  words: [
    { word: 'For', startMs: 0, endMs: 340, index: 0, charOffset: 0, charLength: 3 },
    { word: 'God', startMs: 340, endMs: 620, index: 1, charOffset: 4, charLength: 3 },
    { word: 'so', startMs: 620, endMs: 900, index: 2, charOffset: 8, charLength: 2 },
    { word: 'loved', startMs: 900, endMs: 1200, index: 3, charOffset: 11, charLength: 5 },
    { word: 'the', startMs: 1200, endMs: 1400, index: 4, charOffset: 17, charLength: 3 },
    { word: 'world', startMs: 1400, endMs: 1800, index: 5, charOffset: 21, charLength: 5 },
  ],
  durationMs: 1800,
  audioUrl: 'https://example.com/audio.mp3',
  ttsProvider: 'google',
  voice: 'en-US-Neural2-C',
  speed: 1.0,
  generatedAt: new Date(),
  version: '1.0',
});

/**
 * Mock data provider for testing
 */
class MockTimingDataProvider {
  async getTimingData(): Promise<SentenceTimingData | null> {
    return createMockTimingData();
  }

  async saveTimingData(): Promise<void> {}
  async getCachedTimingData(): Promise<null> {
    return null;
  }
  async clearCache(): Promise<void> {}
}

describe('AudioHighlightingService', () => {
  let service: AudioHighlightingService;

  beforeEach(() => {
    service = AudioHighlightingService.getInstance();
    service.setDataProvider(new MockTimingDataProvider() as any);
  });

  describe('Binary Search Word Lookup', () => {
    it('should find word at exact start position', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      // Position at start of "For"
      service.updateAudioPosition(0);
      const state = service.getCurrentState();
      expect(state.currentWordIndex).toBe(0);
    });

    it('should find word at exact end position', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      // Position at start of "God" (end of "For")
      service.updateAudioPosition(340);
      let state = service.getCurrentState();
      expect(state.currentWordIndex).toBe(1);

      // Position at end of "world"
      service.updateAudioPosition(1799);
      state = service.getCurrentState();
      expect(state.currentWordIndex).toBe(5);
    });

    it('should find word in middle of text', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      // Position in middle of "loved"
      service.updateAudioPosition(1050);
      const state = service.getCurrentState();
      expect(state.currentWordIndex).toBe(3);
      expect(state.currentWord?.word).toBe('loved');
    });

    it('should handle position before first word', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      service.updateAudioPosition(-100);
      const state = service.getCurrentState();
      expect(state.currentWordIndex).toBe(-1);
    });

    it('should handle position after last word', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      service.updateAudioPosition(9999);
      const state = service.getCurrentState();
      // Should be last word
      expect(state.currentWordIndex).toBeGreaterThanOrEqual(0);
    });

    it('should efficiently find words (O(log n))', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      const start = performance.now();

      // Test 1000 random positions
      for (let i = 0; i < 1000; i++) {
        const randomMs = Math.random() * 1800;
        service.updateAudioPosition(randomMs);
      }

      const duration = performance.now() - start;

      // Should be fast (typically <10ms for 1000 lookups)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('State Management', () => {
    it('should initialize with correct default state', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      const state = service.getCurrentState();
      expect(state.isPlaying).toBe(true);
      expect(state.currentPositionMs).toBe(0);
      expect(state.durationMs).toBe(1800);
    });

    it('should update state on position change', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      service.updateAudioPosition(500);
      let state = service.getCurrentState();
      expect(state.currentPositionMs).toBe(500);

      service.updateAudioPosition(1000);
      state = service.getCurrentState();
      expect(state.currentPositionMs).toBe(1000);
    });

    it('should handle pause and resume', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      expect(service.getCurrentState().isPlaying).toBe(true);

      service.pauseHighlighting();
      expect(service.getCurrentState().isPlaying).toBe(false);

      service.resumeHighlighting();
      expect(service.getCurrentState().isPlaying).toBe(true);
    });

    it('should emit state changes to listeners', async () => {
      const states: any[] = [];

      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      service.onStateChange((state) => {
        states.push(state);
      });

      service.updateAudioPosition(100);
      service.updateAudioPosition(200);
      service.updateAudioPosition(300);

      expect(states.length).toBeGreaterThan(0);
    });
  });

  describe('Seeking', () => {
    it('should seek to specific position', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      service.seekToPosition(1000);
      const state = service.getCurrentState();
      expect(state.currentPositionMs).toBe(1000);
    });

    it('should clamp seek position to valid range', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      // Seek beyond duration
      service.seekToPosition(9999);
      let state = service.getCurrentState();
      expect(state.currentPositionMs).toBeLessThanOrEqual(1800);

      // Seek before start
      service.seekToPosition(-100);
      state = service.getCurrentState();
      expect(state.currentPositionMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Word Change Events', () => {
    it('should trigger callback on word change', async () => {
      const wordChanges: any[] = [];

      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
        onWordChange: (index, word) => {
          wordChanges.push({ index, word: word.word });
        },
      });

      // Move through words
      service.updateAudioPosition(0);   // "For"
      service.updateAudioPosition(400); // "God"
      service.updateAudioPosition(800); // "so"

      // Should have captured word changes
      expect(wordChanges.length).toBeGreaterThan(0);
    });

    it('should not emit duplicate word changes', async () => {
      const wordChanges: any[] = [];

      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
        onWordChange: (index, word) => {
          wordChanges.push(word.word);
        },
      });

      // Stay within same word
      service.updateAudioPosition(100);  // Still "For"
      service.updateAudioPosition(200);  // Still "For"
      service.updateAudioPosition(300);  // Still "For"

      // Should not emit changes for same word
      expect(wordChanges.length).toBe(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should provide performance metrics', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      const metrics = service.getMetrics();

      expect(metrics.wordCount).toBe(6);
      expect(metrics.durationMs).toBe(1800);
      expect(metrics.updateIntervalMs).toBe(100);
      expect(metrics.estimatedMemoryKb).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      await service.startHighlighting({
        readingId: 'test_gospel',
        readingType: 'gospel',
      });

      service.destroy();

      const state = service.getCurrentState();
      expect(state.isPlaying).toBe(false);
    });
  });
});

export {};
