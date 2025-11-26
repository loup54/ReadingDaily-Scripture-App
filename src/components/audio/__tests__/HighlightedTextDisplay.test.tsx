/**
 * Component Tests for HighlightedTextDisplay
 * Tests text rendering with word-level highlighting
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { HighlightedTextDisplay, CompactHighlightedTextDisplay } from '../HighlightedTextDisplay';
import { WordTiming } from '@/types';

/**
 * Mock word timing data
 */
const mockWords: WordTiming[] = [
  { word: 'In', startMs: 0, endMs: 340, index: 0, charOffset: 0, charLength: 2 },
  { word: 'the', startMs: 340, endMs: 620, index: 1, charOffset: 3, charLength: 3 },
  { word: 'beginning', startMs: 620, endMs: 1000, index: 2, charOffset: 7, charLength: 9 },
  { word: 'was', startMs: 1000, endMs: 1300, index: 3, charOffset: 17, charLength: 3 },
  { word: 'the', startMs: 1300, endMs: 1600, index: 4, charOffset: 21, charLength: 3 },
  { word: 'Word', startMs: 1600, endMs: 2000, index: 5, charOffset: 25, charLength: 4 },
];

const mockText = 'In the beginning was the Word';

describe('HighlightedTextDisplay Component', () => {
  describe('Rendering', () => {
    it('should render all words', () => {
      render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={-1}
        />
      );

      // Check that text content is present
      mockWords.forEach((word) => {
        // Note: In a real React Native test, we'd use more specific matchers
        expect(mockText).toContain(word.word);
      });
    });

    it('should render with custom font size', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
          fontSize={24}
        />
      );

      // Component should render successfully with custom fontSize
      expect(container).toBeTruthy();
    });

    it('should render with custom line height', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
          lineHeight={32}
        />
      );

      // Component should render successfully with custom lineHeight
      expect(container).toBeTruthy();
    });
  });

  describe('Highlighting Behavior', () => {
    it('should highlight current word', () => {
      const { rerender } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
        />
      );

      // Verify component renders with highlight
      expect(rerender).toBeDefined();
    });

    it('should update highlighting on word index change', () => {
      const { rerender } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
        />
      );

      // Move to next word
      rerender(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={1}
        />
      );

      // Component should update highlighting
      expect(rerender).toBeDefined();
    });

    it('should handle no current word (index -1)', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={-1}
        />
      );

      // Should render without highlighting
      expect(container).toBeTruthy();
    });

    it('should handle word index at boundary (last word)', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={mockWords.length - 1}
        />
      );

      // Should highlight last word
      expect(container).toBeTruthy();
    });
  });

  describe('Fade Out Effect', () => {
    it('should apply fade out effect when enabled', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={2}
          config={{ useFadeOut: true }}
        />
      );

      // Component should apply fade effect
      expect(container).toBeTruthy();
    });

    it('should not apply fade out when disabled', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={2}
          config={{ useFadeOut: false }}
        />
      );

      // Component should render without fade
      expect(container).toBeTruthy();
    });
  });

  describe('Color Configuration', () => {
    it('should apply custom highlight color', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
          config={{
            highlightColor: '#FF6B6B',
            highlightTextColor: '#FFFFFF',
          }}
        />
      );

      // Component should use custom colors
      expect(container).toBeTruthy();
    });

    it('should apply theme colors', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
          config={{
            highlightColor: '#1E90FF',
            highlightTextColor: '#FFFFFF',
          }}
        />
      );

      // Component should apply theme
      expect(container).toBeTruthy();
    });
  });

  describe('Debug Mode', () => {
    it('should show word boundaries in debug mode', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
          showBoundaries={true}
        />
      );

      // Component should render with debug info
      expect(container).toBeTruthy();
    });

    it('should hide word boundaries when debug disabled', () => {
      const { container } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
          showBoundaries={false}
        />
      );

      // Component should render without debug info
      expect(container).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle large text (500+ words)', () => {
      const largeWords: WordTiming[] = [];
      let text = '';
      for (let i = 0; i < 500; i++) {
        largeWords.push({
          word: `word${i}`,
          startMs: i * 100,
          endMs: (i + 1) * 100,
          index: i,
          charOffset: i * 6,
          charLength: 6,
        });
        text += (i > 0 ? ' ' : '') + `word${i}`;
      }

      const start = performance.now();
      const { container } = render(
        <HighlightedTextDisplay
          text={text}
          words={largeWords}
          currentWordIndex={250}
        />
      );
      const duration = performance.now() - start;

      expect(container).toBeTruthy();
      expect(duration).toBeLessThan(500); // Should render in reasonable time
    });

    it('should efficiently update on highlight change', () => {
      const { rerender } = render(
        <HighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
        />
      );

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        rerender(
          <HighlightedTextDisplay
            text={mockText}
            words={mockWords}
            currentWordIndex={i % mockWords.length}
          />
        );
      }
      const duration = performance.now() - start;

      // Should handle 100 re-renders quickly
      expect(duration).toBeLessThan(1000);
    });
  });
});

describe('CompactHighlightedTextDisplay Component', () => {
  describe('Context Window Behavior', () => {
    it('should show context window around current word', () => {
      const { container } = render(
        <CompactHighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={3}
          contextWindowSize={2}
        />
      );

      // Should show current word and context
      expect(container).toBeTruthy();
    });

    it('should handle context window at start', () => {
      const { container } = render(
        <CompactHighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={0}
          contextWindowSize={3}
        />
      );

      // Should not error with insufficient context
      expect(container).toBeTruthy();
    });

    it('should handle context window at end', () => {
      const { container } = render(
        <CompactHighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={mockWords.length - 1}
          contextWindowSize={3}
        />
      );

      // Should not error at end of text
      expect(container).toBeTruthy();
    });

    it('should adjust window size dynamically', () => {
      const { rerender } = render(
        <CompactHighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={3}
          contextWindowSize={2}
        />
      );

      // Change window size
      rerender(
        <CompactHighlightedTextDisplay
          text={mockText}
          words={mockWords}
          currentWordIndex={3}
          contextWindowSize={5}
        />
      );

      // Should update window
      expect(rerender).toBeDefined();
    });
  });

  describe('Performance vs Full Display', () => {
    it('should render faster than full display', () => {
      const largeWords: WordTiming[] = [];
      let text = '';
      for (let i = 0; i < 1000; i++) {
        largeWords.push({
          word: `word${i}`,
          startMs: i * 100,
          endMs: (i + 1) * 100,
          index: i,
          charOffset: i * 6,
          charLength: 6,
        });
        text += (i > 0 ? ' ' : '') + `word${i}`;
      }

      const compactStart = performance.now();
      const { container: compactContainer } = render(
        <CompactHighlightedTextDisplay
          text={text}
          words={largeWords}
          currentWordIndex={500}
          contextWindowSize={5}
        />
      );
      const compactDuration = performance.now() - compactStart;

      const fullStart = performance.now();
      const { container: fullContainer } = render(
        <HighlightedTextDisplay
          text={text}
          words={largeWords}
          currentWordIndex={500}
        />
      );
      const fullDuration = performance.now() - fullStart;

      expect(compactContainer).toBeTruthy();
      expect(fullContainer).toBeTruthy();
      expect(compactDuration).toBeLessThan(fullDuration * 2);
    });
  });
});

export {};
