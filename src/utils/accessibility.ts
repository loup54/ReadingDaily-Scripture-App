/**
 * Accessibility Utilities
 *
 * Provides helper functions and constants for implementing accessible components
 * Following WCAG 2.1 Level AA standards
 *
 * @category Utilities
 * @example
 * // Use in components
 * import { a11y } from '@/utils/accessibility';
 *
 * <IconButton
 *   {...a11y.iconButton('Play audio')}
 *   onPress={handlePlay}
 * />
 */

import { AccessibilityRole } from 'react-native';

/**
 * Accessibility roles supported by React Native
 */
export type A11yRole = AccessibilityRole | 'menuitem' | 'tab' | 'spinbutton';

/**
 * Common accessibility labels and hints
 */
export const A11yLabels = {
  // Navigation
  back: 'Back',
  next: 'Next',
  previous: 'Previous',
  forward: 'Forward',
  home: 'Home',
  menu: 'Menu',
  close: 'Close',

  // Actions
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  search: 'Search',
  filter: 'Filter',
  sort: 'Sort',
  refresh: 'Refresh',
  more: 'More options',

  // Media
  play: 'Play',
  pause: 'Pause',
  stop: 'Stop',
  mute: 'Mute',
  unmute: 'Unmute',
  volumeUp: 'Volume up',
  volumeDown: 'Volume down',

  // Forms
  submit: 'Submit',
  cancel: 'Cancel',
  reset: 'Reset',
  selectAll: 'Select all',
  deselectAll: 'Deselect all',

  // Content
  share: 'Share',
  bookmark: 'Bookmark',
  like: 'Like',
  unlike: 'Unlike',
  favorite: 'Add to favorites',
  unfavorite: 'Remove from favorites',
  comment: 'Comment',
  download: 'Download',

  // Settings
  settings: 'Settings',
  about: 'About',
  help: 'Help',
  feedback: 'Send feedback',
  logout: 'Log out',
} as const;

/**
 * Common accessibility hints
 */
export const A11yHints = {
  doubleTap: 'Double tap to activate',
  swipeToNavigate: 'Swipe to navigate between items',
  pressToExpand: 'Press to expand',
  pressToCollapse: 'Press to collapse',
  pressAndHold: 'Press and hold for more options',
  toggleSwitch: 'Press to toggle',
  selectItem: 'Press to select',
  deselectItem: 'Press to deselect',
  dragToReorder: 'Press and drag to reorder',
  longPressForMenu: 'Press and hold to open context menu',
} as const;

/**
 * Helper function to create button accessibility props
 *
 * @param label - The label that describes the button action
 * @param hint - Optional hint for complex interactions
 * @returns Accessibility props object
 *
 * @example
 * <Button {...a11y.button('Save changes', 'Double tap to save')} />
 */
export const a11y = {
  /**
   * Generic button accessibility props
   */
  button: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'button' as const,
    accessibilityHint: hint,
  }),

  /**
   * Icon-only button accessibility props
   * Use this when the button only displays an icon
   */
  iconButton: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'button' as const,
    accessibilityHint: hint || `Press to ${label.toLowerCase()}`,
  }),

  /**
   * Link accessibility props
   */
  link: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'link' as const,
    accessibilityHint: hint || 'Navigate to ' + label,
  }),

  /**
   * Toggle/switch accessibility props
   */
  toggle: (label: string, isEnabled: boolean, hint?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'switch' as const,
    accessibilityState: { checked: isEnabled },
    accessibilityHint: hint || `Toggle ${label}, currently ${isEnabled ? 'on' : 'off'}`,
  }),

  /**
   * Checkbox accessibility props
   */
  checkbox: (label: string, isChecked: boolean, hint?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'checkbox' as const,
    accessibilityState: { checked: isChecked },
    accessibilityHint: hint || `Checkbox for ${label}`,
  }),

  /**
   * Radio button accessibility props
   */
  radio: (label: string, isSelected: boolean, hint?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'radio' as const,
    accessibilityState: { selected: isSelected },
    accessibilityHint: hint || `Select ${label}`,
  }),

  /**
   * Tab accessibility props
   */
  tab: (label: string, isSelected: boolean, hint?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'tab' as const,
    accessibilityState: { selected: isSelected },
    accessibilityHint: hint || `Tab: ${label}`,
  }),

  /**
   * Touchable view accessibility props
   */
  view: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'button' as const,
    accessibilityHint: hint,
  }),

  /**
   * Image/icon accessibility props
   */
  image: (description: string, hint?: string) => ({
    accessible: true,
    accessibilityLabel: description,
    accessibilityHint: hint,
  }),

  /**
   * Loading indicator accessibility props
   */
  loading: (message: string = 'Loading') => ({
    accessible: true,
    accessibilityLabel: message,
    accessibilityLiveRegion: 'polite' as const,
  }),

  /**
   * Status/badge accessibility props
   */
  status: (status: string, description?: string) => ({
    accessible: true,
    accessibilityLabel: description || status,
    accessibilityLiveRegion: 'polite' as const,
  }),

  /**
   * Alert/error message accessibility props
   */
  alert: (message: string, type: 'error' | 'warning' | 'info' | 'success' = 'info') => ({
    accessible: true,
    accessibilityLabel: message,
    accessibilityRole: 'alert' as const,
    accessibilityLiveRegion: 'assertive' as const,
  }),

  /**
   * List item accessibility props
   */
  listItem: (label: string, index?: number, total?: number, hint?: string) => {
    let accessibilityLabel = label;
    if (index !== undefined && total !== undefined) {
      accessibilityLabel = `${label}, item ${index + 1} of ${total}`;
    }
    return {
      accessible: true,
      accessibilityLabel,
      accessibilityHint: hint,
    };
  },

  /**
   * Heading accessibility props
   */
  heading: (text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 1) => ({
    accessible: true,
    accessibilityLabel: text,
    accessibilityRole: 'header' as const,
  }),
} as const;

/**
 * Keyboard event handler helpers for web/desktop
 * Use these with onKeyDown or onKeyPress handlers
 */
export const KeyboardHandlers = {
  /**
   * Check if key is Enter or Space (activation keys for buttons)
   */
  isActivationKey: (key: string): boolean => {
    return key === 'Enter' || key === ' ';
  },

  /**
   * Check if key is Escape
   */
  isEscapeKey: (key: string): boolean => {
    return key === 'Escape';
  },

  /**
   * Check if key is arrow key
   */
  isArrowKey: (key: string): boolean => {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
  },

  /**
   * Get arrow direction from key
   */
  getArrowDirection: (key: string): 'up' | 'down' | 'left' | 'right' | null => {
    switch (key) {
      case 'ArrowUp':
        return 'up';
      case 'ArrowDown':
        return 'down';
      case 'ArrowLeft':
        return 'left';
      case 'ArrowRight':
        return 'right';
      default:
        return null;
    }
  },

  /**
   * Check if key is Tab
   */
  isTabKey: (key: string): boolean => {
    return key === 'Tab';
  },

  /**
   * Check if key is Enter
   */
  isEnterKey: (key: string): boolean => {
    return key === 'Enter';
  },

  /**
   * Check if key is Space
   */
  isSpaceKey: (key: string): boolean => {
    return key === ' ';
  },
} as const;

/**
 * Accessibility state helper
 * Use to communicate state changes to screen readers
 */
export interface A11yState {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean;
  expanded?: boolean;
  busy?: boolean;
  live?: 'polite' | 'assertive' | 'off';
}

/**
 * WCAG 2.1 Compliance helpers
 */
export const WCAG = {
  /**
   * Minimum touch target size per Material Design 3 and iOS HIG
   * 48x48 points for Android, 44x44 points for iOS
   */
  MIN_TOUCH_TARGET: 48,

  /**
   * Minimum contrast ratio for normal text (WCAG AA)
   */
  MIN_CONTRAST_NORMAL: 4.5,

  /**
   * Minimum contrast ratio for large text (WCAG AA)
   * Large text is 18pt+ or 14pt+ bold
   */
  MIN_CONTRAST_LARGE: 3,

  /**
   * Minimum contrast ratio for graphics (WCAG AA)
   */
  MIN_CONTRAST_GRAPHICS: 3,
} as const;

/**
 * Test utilities for accessibility
 * Use in tests to verify accessibility props are correct
 */
export const A11yTest = {
  /**
   * Check if component has required accessibility props
   */
  hasAccessibilityProps: (props: any): boolean => {
    return props.accessible === true && props.accessibilityLabel !== undefined;
  },

  /**
   * Check if label is descriptive enough (not empty)
   */
  hasDescriptiveLabel: (label: string): boolean => {
    return label && label.trim().length > 0 && label.length <= 100;
  },

  /**
   * Get common accessibility testing issues
   */
  getIssues: (props: any): string[] => {
    const issues: string[] = [];

    if (props.accessible !== true) {
      issues.push('Component not marked as accessible');
    }

    if (!props.accessibilityLabel) {
      issues.push('Missing accessibilityLabel');
    } else if (props.accessibilityLabel.trim().length === 0) {
      issues.push('accessibilityLabel is empty');
    } else if (props.accessibilityLabel.length > 100) {
      issues.push('accessibilityLabel is too long (> 100 chars)');
    }

    if (props.accessible && !props.accessibilityRole) {
      issues.push('Missing accessibilityRole');
    }

    return issues;
  },
} as const;

export default a11y;
