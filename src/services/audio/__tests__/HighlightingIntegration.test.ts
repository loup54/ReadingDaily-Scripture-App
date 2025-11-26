/**
 * Integration Tests for Audio Highlighting System
 * Tests the complete flow: Service → Hooks → Components → UI
 */

import { AudioHighlightingService } from '../AudioHighlightingService';
import { SentenceTimingData, WordTiming } from '@/types';

/**
 * Mock timing data for integration testing
 */
const createMockReadingData = (
  wordCount: number = 50,
  durationMs: number = 5000,
): SentenceTimingData => {
  const words: WordTiming[] = [];
  const wordsText = [
    'In', 'the', 'beginning', 'was', 'the', 'Word', 'and', 'the', 'Word', 'was',
    'with', 'God', 'and', 'the', 'Word', 'was', 'God', 'All', 'things', 'were',
    'made', 'through', 'him', 'and', 'without', 'him', 'was', 'not', 'any', 'thing',
    'made', 'that', 'has', 'been', 'made', 'In', 'him', 'was', 'life', 'and',
    'the', 'life', 'was', 'the', 'light', 'of', 'men', 'The', 'light', 'shines',
  ];

  let charOffset = 0;
  let currentTime = 0;
  const timePerWord = durationMs / wordCount;

  for (let i = 0; i < wordCount; i++) {
    const word = wordsText[i % wordsText.length];
    const startMs = Math.round(currentTime);
    const endMs = Math.round(currentTime + timePerWord);

    words.push({
      word,
      startMs,
      endMs,
      index: i,
      charOffset,
      charLength: word.length,
    });

    charOffset += word.length + 1;
    currentTime += timePerWord;
  }

  return {
    readingId: 'test_john_1_1',
    text: words.map(w => w.word).join(' '),
    readingType: 'gospel',
    date: new Date(),
    reference: 'John 1:1-5',
    words,
    durationMs,
    audioUrl: 'https://example.com/test.mp3',
    ttsProvider: 'google',
    voice: 'en-US-Neural2-C',
    speed: 1.0,
    generatedAt: new Date(),
    version: '1.0',
  };
};

/**
 * Mock timing data provider
 */
class MockTimingDataProvider {
  private data: SentenceTimingData | null = null;

  async getTimingData(
    readingId: string,
    readingType: string,
    date: Date,
  ): Promise<SentenceTimingData | null> {
    if (!this.data) {
      this.data = createMockReadingData();
    }
    return this.data;
  }

  async saveTimingData(): Promise<void> {}
  async getCachedTimingData(): Promise<null> {
    return null;
  }
  async clearCache(): Promise<void> {}
}

describe('Audio Highlighting System - Integration Tests', () => {
  let service: AudioHighlightingService;
  let provider: MockTimingDataProvider;

  beforeEach(() => {
    service = AudioHighlightingService.getInstance();
    provider = new MockTimingDataProvider();
    service.setDataProvider(provider as any);
  });

  describe('Service Initialization & Data Loading', () => {
    it('should load timing data from provider', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      const state = service.getCurrentState();
      expect(state.totalWords).toBe(50);
      expect(state.durationMs).toBeGreaterThan(0);
      expect(state.isLoading).toBe(false);
    });

    it('should initialize with correct state', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      const state = service.getCurrentState();
      expect(state.currentWordIndex).toBe(-1); // No position yet
      expect(state.isPlaying).toBe(true);
      expect(state.currentPositionMs).toBe(0);
    });

    it('should emit state change on initialization', async () => {
      const stateChanges: any[] = [];

      service.onStateChange((state) => {
        stateChanges.push(state);
      });

      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      // Should have emitted at least one state change
      expect(stateChanges.length).toBeGreaterThan(0);
    });
  });

  describe('Audio Playback Simulation', () => {
    it('should track position through entire reading', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      const positions = [0, 500, 1000, 2000, 3000, 4000, 5000];
      const states = [];

      for (const pos of positions) {
        service.updateAudioPosition(pos);
        states.push(service.getCurrentState());
      }

      // Should progress through words
      expect(states[0].currentWordIndex).toBeLessThan(states[states.length - 1].currentWordIndex);
    });

    it('should update word index as position advances', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.updateAudioPosition(100);
      const state1 = service.getCurrentState();
      const index1 = state1.currentWordIndex;

      service.updateAudioPosition(500);
      const state2 = service.getCurrentState();
      const index2 = state2.currentWordIndex;

      service.updateAudioPosition(1000);
      const state3 = service.getCurrentState();
      const index3 = state3.currentWordIndex;

      // Indices should increase or stay same
      expect(index2).toBeGreaterThanOrEqual(index1);
      expect(index3).toBeGreaterThanOrEqual(index2);
    });

    it('should correctly identify current word at position', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.updateAudioPosition(0); // First word
      let state = service.getCurrentState();
      expect(state.currentWord?.index).toBe(0);

      service.updateAudioPosition(2500); // Middle
      state = service.getCurrentState();
      expect(state.currentWord?.index).toBeGreaterThan(0);
      expect(state.currentWord?.index).toBeLessThan(49);

      service.updateAudioPosition(4999); // Near end
      state = service.getCurrentState();
      expect(state.currentWord?.index).toBeGreaterThan(40);
    });
  });

  describe('Hook-Like Behavior (State Listeners)', () => {
    it('should notify listeners of position updates', async () => {
      const updates: any[] = [];

      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.onStateChange((state) => {
        updates.push({
          position: state.currentPositionMs,
          wordIndex: state.currentWordIndex,
        });
      });

      service.updateAudioPosition(100);
      service.updateAudioPosition(500);
      service.updateAudioPosition(1000);

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].position).toBeLessThanOrEqual(updates[updates.length - 1].position);
    });

    it('should notify on word changes', async () => {
      const wordChanges: any[] = [];

      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
        onWordChange: (index, word) => {
          wordChanges.push({ index, word: word.word });
        },
      });

      // Move through several words
      service.updateAudioPosition(0);
      service.updateAudioPosition(500);
      service.updateAudioPosition(1000);
      service.updateAudioPosition(1500);
      service.updateAudioPosition(2000);

      expect(wordChanges.length).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent listeners', async () => {
      const listener1Changes: any[] = [];
      const listener2Changes: any[] = [];

      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.onStateChange((state) => {
        listener1Changes.push(state.currentWordIndex);
      });

      service.onStateChange((state) => {
        listener2Changes.push(state.currentWordIndex);
      });

      service.updateAudioPosition(100);
      service.updateAudioPosition(500);

      // Both listeners should get updates
      expect(listener1Changes.length).toBeGreaterThan(0);
      expect(listener2Changes.length).toBeGreaterThan(0);
    });
  });

  describe('Seeking and Position Control', () => {
    it('should seek to specific position', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.seekToPosition(2500);
      let state = service.getCurrentState();
      expect(state.currentPositionMs).toBe(2500);

      service.seekToPosition(0);
      state = service.getCurrentState();
      expect(state.currentPositionMs).toBe(0);
    });

    it('should update highlighting on seek', async () => {
      const stateChanges: any[] = [];

      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.onStateChange((state) => {
        stateChanges.push(state.currentWordIndex);
      });

      service.seekToPosition(2500);

      const finalState = service.getCurrentState();
      expect(finalState.currentWordIndex).toBeGreaterThan(0);
    });

    it('should clamp seek to valid range', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      // Seek beyond duration
      service.seekToPosition(10000);
      let state = service.getCurrentState();
      expect(state.currentPositionMs).toBeLessThanOrEqual(5000);

      // Seek before start
      service.seekToPosition(-1000);
      state = service.getCurrentState();
      expect(state.currentPositionMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Play/Pause State Management', () => {
    it('should toggle play state', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      expect(service.getCurrentState().isPlaying).toBe(true);

      service.pauseHighlighting();
      expect(service.getCurrentState().isPlaying).toBe(false);

      service.resumeHighlighting();
      expect(service.getCurrentState().isPlaying).toBe(true);
    });

    it('should maintain position during pause', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.updateAudioPosition(2500);
      const positionBeforePause = service.getCurrentState().currentPositionMs;

      service.pauseHighlighting();
      const positionAfterPause = service.getCurrentState().currentPositionMs;

      expect(positionAfterPause).toBe(positionBeforePause);
    });
  });

  describe('Component Rendering Data (Full UI Flow)', () => {
    it('should provide data for text highlighting component', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      // Simulate audio playback progressing
      const positions = [100, 300, 600, 1000, 1500, 2000, 2500];

      for (const pos of positions) {
        service.updateAudioPosition(pos);
        const state = service.getCurrentState();

        // All required data for rendering should be available
        expect(state.currentWord).toBeDefined();
        expect(state.currentWordIndex).toBeGreaterThanOrEqual(-1);
        expect(state.currentPositionMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should provide progress bar data', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.updateAudioPosition(2500);
      const state = service.getCurrentState();

      // Progress bar needs duration and current position
      expect(state.durationMs).toBe(5000);
      expect(state.currentPositionMs).toBe(2500);

      const progress = state.currentPositionMs / state.durationMs;
      expect(progress).toBe(0.5);
    });

    it('should provide control bar data', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      const state = service.getCurrentState();

      // Control bar needs play state
      expect(state.isPlaying).toBeDefined();
      expect(state.durationMs).toBeGreaterThan(0);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle invalid reading ID gracefully', async () => {
      await service.startHighlighting({
        readingId: 'nonexistent_reading',
        readingType: 'gospel',
      });

      const state = service.getCurrentState();
      // Should either have data or handle gracefully
      expect(state).toBeDefined();
    });

    it('should handle rapid position updates', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      // Rapid updates (simulating audio callbacks)
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        service.updateAudioPosition(Math.random() * 5000);
      }
      const duration = performance.now() - start;

      // Should handle 100 updates quickly
      expect(duration).toBeLessThan(50);
    });

    it('should handle repeated pause/resume', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      for (let i = 0; i < 10; i++) {
        service.pauseHighlighting();
        expect(service.getCurrentState().isPlaying).toBe(false);

        service.resumeHighlighting();
        expect(service.getCurrentState().isPlaying).toBe(true);
      }
    });
  });

  describe('Performance Under Load', () => {
    it('should handle large reading (1000 words)', async () => {
      const largeData = createMockReadingData(1000, 60000);

      class LargeDataProvider {
        async getTimingData(): Promise<SentenceTimingData> {
          return largeData;
        }
        async saveTimingData(): Promise<void> {}
        async getCachedTimingData(): Promise<null> {
          return null;
        }
        async clearCache(): Promise<void> {}
      }

      service.setDataProvider(new LargeDataProvider() as any);

      const start = performance.now();
      await service.startHighlighting({
        readingId: 'large_reading',
        readingType: 'gospel',
      });
      const initDuration = performance.now() - start;

      // Initialization should be quick
      expect(initDuration).toBeLessThan(100);

      // Binary search should still be fast
      const searchStart = performance.now();
      for (let i = 0; i < 100; i++) {
        service.updateAudioPosition(Math.random() * 60000);
      }
      const searchDuration = performance.now() - searchStart;

      expect(searchDuration).toBeLessThan(50);
    });

    it('should not leak memory on repeated start/stop', async () => {
      const initialMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

      for (let i = 0; i < 10; i++) {
        await service.startHighlighting({
          readingId: `reading_${i}`,
          readingType: 'gospel',
        });

        service.destroy();
      }

      const finalMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

      // Memory shouldn't grow significantly (within 10MB tolerance)
      const memoryGrowth = parseFloat(finalMemory) - parseFloat(initialMemory);
      expect(memoryGrowth).toBeLessThan(10);
    });
  });

  describe('Metrics API (Performance Monitoring)', () => {
    it('should provide accurate metrics', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      const metrics = service.getMetrics();

      expect(metrics.wordCount).toBe(50);
      expect(metrics.durationMs).toBe(5000);
      expect(metrics.updateIntervalMs).toBeGreaterThan(0);
      expect(metrics.estimatedMemoryKb).toBeGreaterThan(0);
    });

    it('should track word lookup performance', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        service.updateAudioPosition(Math.random() * 5000);
      }
      const duration = performance.now() - start;

      const metrics = service.getMetrics();
      console.log(`1000 lookups in ${duration.toFixed(2)}ms for ${metrics.wordCount} words`);

      // Should average <0.1ms per lookup (binary search)
      expect(duration / 1000).toBeLessThan(0.1);
    });
  });

  describe('Cleanup & Lifecycle', () => {
    it('should cleanup resources properly', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.destroy();

      const state = service.getCurrentState();
      expect(state.isPlaying).toBe(false);
      expect(state.totalWords).toBe(0);
    });

    it('should allow restart after cleanup', async () => {
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      service.destroy();

      // Should be able to restart
      await service.startHighlighting({
        readingId: 'test_john_1_1',
        readingType: 'gospel',
      });

      const state = service.getCurrentState();
      expect(state.totalWords).toBe(50);
    });
  });
});

export {};
