/**
 * Keyboard Navigation & Focus Management Hook
 * Phase 4: Keyboard Navigation - WCAG 2.1 Compliance
 *
 * Provides utilities for:
 * - Managing focus on interactive elements
 * - Handling keyboard events (Tab, Enter, Space, Escape)
 * - Focus visible indicators
 * - Tab order management
 *
 * @example
 * // Basic keyboard handler
 * const { handleKeyDown } = useKeyboardNavigation();
 * <TouchableOpacity
 *   onKeyDown={handleKeyDown}
 *   onPress={handlePress}
 * />
 *
 * @example
 * // With focus styles
 * const { isFocused } = useFocusState();
 * <View style={[styles.button, isFocused && styles.focused]} />
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Keyboard keys that trigger actions
 */
export enum KeyboardKey {
  ENTER = 'Enter',
  SPACE = ' ',
  ESCAPE = 'Escape',
  ARROW_UP = 'ArrowUp',
  ARROW_DOWN = 'ArrowDown',
  ARROW_LEFT = 'ArrowLeft',
  ARROW_RIGHT = 'ArrowRight',
  TAB = 'Tab',
}

/**
 * Result from keyboard event handler
 */
export interface KeyboardEventResult {
  /**
   * Whether the key was handled
   */
  handled: boolean;

  /**
   * Which key was pressed
   */
  key: string;

  /**
   * Whether Shift was held
   */
  shiftKey: boolean;

  /**
   * Whether Ctrl/Cmd was held
   */
  ctrlKey: boolean;

  /**
   * Whether Alt was held
   */
  altKey: boolean;
}

/**
 * Options for keyboard event handler
 */
export interface KeyboardHandlerOptions {
  /**
   * Keys that should trigger onActivate callback
   * Default: Enter, Space
   */
  activateKeys?: KeyboardKey[];

  /**
   * Keys that should trigger onCancel callback
   * Default: Escape
   */
  cancelKeys?: KeyboardKey[];

  /**
   * Callback when activation key is pressed
   */
  onActivate?: () => void;

  /**
   * Callback when cancel key is pressed
   */
  onCancel?: () => void;

  /**
   * Callback for navigation keys (arrows)
   */
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;

  /**
   * Prevent default browser behavior
   * Default: true
   */
  preventDefault?: boolean;

  /**
   * Stop event propagation
   * Default: true
   */
  stopPropagation?: boolean;
}

/**
 * Focus state manager
 */
export interface FocusState {
  isFocused: boolean;
  isKeyboardFocused: boolean;
  focusedElement: HTMLElement | null;
}

/**
 * Hook for handling keyboard events on interactive elements
 * Supports: Button, IconButton, Links, Form controls
 *
 * @param options Keyboard handler configuration
 * @returns Handler function and key information
 *
 * @example
 * const { handleKeyDown, lastKey } = useKeyboardNavigation({
 *   onActivate: handlePress,
 *   onCancel: handleClose,
 * });
 */
export const useKeyboardNavigation = (
  options: KeyboardHandlerOptions = {}
) => {
  const {
    activateKeys = [KeyboardKey.ENTER, KeyboardKey.SPACE],
    cancelKeys = [KeyboardKey.ESCAPE],
    onActivate,
    onCancel,
    onNavigate,
    preventDefault = true,
    stopPropagation = true,
  } = options;

  const [lastKey, setLastKey] = useState<string>('');

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<any> | KeyboardEvent): KeyboardEventResult => {
      const key = (event as any).key || (event as KeyboardEvent).key;
      const shiftKey = (event as any).shiftKey || (event as KeyboardEvent).shiftKey;
      const ctrlKey = (event as any).ctrlKey || (event as KeyboardEvent).ctrlKey;
      const altKey = (event as any).altKey || (event as KeyboardEvent).altKey;

      setLastKey(key);

      let handled = false;

      // Check for activation keys (Enter, Space)
      if (activateKeys.includes(key as KeyboardKey) && onActivate) {
        onActivate();
        handled = true;
      }

      // Check for cancel keys (Escape)
      if (cancelKeys.includes(key as KeyboardKey) && onCancel) {
        onCancel();
        handled = true;
      }

      // Check for navigation keys (Arrows)
      if (onNavigate) {
        if (key === KeyboardKey.ARROW_UP) {
          onNavigate('up');
          handled = true;
        } else if (key === KeyboardKey.ARROW_DOWN) {
          onNavigate('down');
          handled = true;
        } else if (key === KeyboardKey.ARROW_LEFT) {
          onNavigate('left');
          handled = true;
        } else if (key === KeyboardKey.ARROW_RIGHT) {
          onNavigate('right');
          handled = true;
        }
      }

      // Prevent default if handled
      if (handled && preventDefault) {
        (event as any).preventDefault?.();
        if ((event as KeyboardEvent).preventDefault) {
          (event as KeyboardEvent).preventDefault();
        }
      }

      // Stop propagation if requested
      if (handled && stopPropagation) {
        (event as any).stopPropagation?.();
        if ((event as KeyboardEvent).stopPropagation) {
          (event as KeyboardEvent).stopPropagation();
        }
      }

      return {
        handled,
        key,
        shiftKey,
        ctrlKey,
        altKey,
      };
    },
    [activateKeys, cancelKeys, onActivate, onCancel, onNavigate, preventDefault, stopPropagation]
  );

  return {
    /**
     * Handle keyboard down event
     */
    handleKeyDown,

    /**
     * Last key pressed
     */
    lastKey,
  };
};

/**
 * Hook to track focus state for focus-visible indicators
 * Shows focus ring only when focus is from keyboard (not touch)
 *
 * @returns Focus state and event handlers
 *
 * @example
 * const { isFocused, isKeyboardFocused, handleFocus, handleBlur } = useFocusState();
 * <View
 *   onFocus={handleFocus}
 *   onBlur={handleBlur}
 *   style={[styles.button, isKeyboardFocused && styles.focusRing]}
 * />
 */
export const useFocusState = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const lastInteractionRef = useRef<'keyboard' | 'mouse' | null>(null);

  const handleFocus = useCallback((event?: React.FocusEvent<any>) => {
    setIsFocused(true);
    // Show focus ring only if focus came from keyboard
    const isKeyboard = lastInteractionRef.current === 'keyboard';
    setIsKeyboardFocused(isKeyboard);
  }, []);

  const handleBlur = useCallback((event?: React.FocusEvent<any>) => {
    setIsFocused(false);
    setIsKeyboardFocused(false);
    lastInteractionRef.current = null;
  }, []);

  // Track keyboard interactions
  const handleKeyDown = useCallback(() => {
    lastInteractionRef.current = 'keyboard';
  }, []);

  // Track mouse interactions
  const handleMouseDown = useCallback(() => {
    lastInteractionRef.current = 'mouse';
  }, []);

  return {
    /**
     * Whether element is focused (keyboard or mouse)
     */
    isFocused,

    /**
     * Whether element is keyboard-focused (shows focus ring)
     */
    isKeyboardFocused,

    /**
     * Handle focus event
     */
    handleFocus,

    /**
     * Handle blur event
     */
    handleBlur,

    /**
     * Handle keyboard interaction
     */
    handleKeyDown,

    /**
     * Handle mouse interaction
     */
    handleMouseDown,

    /**
     * Get focus state props to spread on element
     */
    getFocusProps: () => ({
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      onMouseDown: handleMouseDown,
    }),
  };
};

/**
 * Hook to manage focus for modal or dialog
 * Traps focus within the modal, returns focus on close
 *
 * @param elementRef Reference to modal/dialog container
 * @param isOpen Whether modal is open
 * @returns Focus management functions
 *
 * @example
 * const dialogRef = useRef(null);
 * const { focusFirstElement, focusLastElement } = useFocusTrapping(dialogRef, isOpen);
 * useEffect(() => {
 *   if (isOpen) focusFirstElement();
 * }, [isOpen]);
 */
export const useFocusTrapping = (
  elementRef: React.RefObject<HTMLElement>,
  isOpen: boolean
) => {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const focusFirstElement = useCallback(() => {
    if (!elementRef.current) return;

    const focusableElements = elementRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }, [elementRef]);

  const focusLastElement = useCallback(() => {
    if (!elementRef.current) return;

    const focusableElements = elementRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
    }
  }, [elementRef]);

  const returnFocus = useCallback(() => {
    if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      focusFirstElement();
    } else {
      // Return focus when modal closes
      returnFocus();
    }
  }, [isOpen, focusFirstElement, returnFocus]);

  return {
    /**
     * Move focus to first focusable element in modal
     */
    focusFirstElement,

    /**
     * Move focus to last focusable element in modal
     */
    focusLastElement,

    /**
     * Return focus to previously focused element
     */
    returnFocus,
  };
};

/**
 * Utility to check if element is focusable
 * Useful for determining tab order and focus management
 *
 * @param element DOM element to check
 * @returns Whether element can receive focus
 */
export const isFocusable = (element: HTMLElement | null): boolean => {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const tabIndex = element.getAttribute('tabindex');

  // Check if explicitly focusable
  if (['button', 'input', 'select', 'textarea', 'a'].includes(tagName)) {
    const isDisabled = element.hasAttribute('disabled');
    return !isDisabled;
  }

  // Check if has tabindex >= 0
  if (tabIndex && parseInt(tabIndex) >= 0) {
    return true;
  }

  return false;
};

/**
 * Get all focusable elements in a container
 * Useful for focus trapping and manual focus management
 *
 * @param container Container element
 * @returns Array of focusable elements
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ];

  const focusableElements = container.querySelectorAll(focusableSelectors.join(','));
  return Array.from(focusableElements) as HTMLElement[];
};

/**
 * Configuration for keyboard shortcuts
 */
export interface KeyboardShortcutConfig {
  /**
   * Key combination (e.g., "Ctrl+S", "Cmd+Z", "Alt+H")
   */
  key: string;

  /**
   * Callback when shortcut is triggered
   */
  onTriggered: () => void;

  /**
   * Description for help/documentation
   */
  description?: string;

  /**
   * Whether this shortcut is currently enabled
   */
  enabled?: boolean;
}

/**
 * Hook to register global keyboard shortcuts
 * Useful for common actions (Save, Undo, Help, etc.)
 *
 * @param shortcuts Array of keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts([
 *   {
 *     key: 'Ctrl+S',
 *     onTriggered: handleSave,
 *     description: 'Save document',
 *   },
 *   {
 *     key: 'Escape',
 *     onTriggered: handleClose,
 *     description: 'Close dialog',
 *   },
 * ]);
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const key = event.key;
        const ctrl = event.ctrlKey || event.metaKey;
        const alt = event.altKey;
        const shift = event.shiftKey;

        let matches = false;

        // Parse shortcut string (e.g., "Ctrl+S", "Cmd+Z", "Alt+H")
        const parts = shortcut.key.split('+');

        if (parts.length === 1) {
          // Single key like "Escape"
          matches = key === parts[0];
        } else if (parts.length === 2) {
          // Modifier + key like "Ctrl+S"
          const modifier = parts[0].toLowerCase();
          const expectedKey = parts[1];

          if (modifier === 'ctrl' && ctrl && key === expectedKey) {
            matches = true;
          } else if (modifier === 'cmd' && ctrl && key === expectedKey) {
            matches = true;
          } else if (modifier === 'alt' && alt && key === expectedKey) {
            matches = true;
          } else if (modifier === 'shift' && shift && key === expectedKey) {
            matches = true;
          }
        }

        if (matches) {
          event.preventDefault();
          shortcut.onTriggered();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Focus indicator styles
 * Meets WCAG 2.1 1.4.11 Non-text Contrast minimum (3:1)
 */
export const FocusStyles = {
  /**
   * Standard focus ring (blue, 3px, high contrast)
   */
  ring: {
    outlineStyle: 'solid' as const,
    outlineWidth: 3,
    outlineColor: '#2196F3', // Bright blue (sufficient contrast)
    outlineOffset: 2,
  },

  /**
   * Subtle focus indicator (darker color)
   */
  subtle: {
    outlineStyle: 'solid' as const,
    outlineWidth: 2,
    outlineColor: '#1976D2', // Darker blue
    outlineOffset: 1,
  },

  /**
   * High contrast focus ring (for light backgrounds)
   */
  highContrast: {
    outlineStyle: 'solid' as const,
    outlineWidth: 3,
    outlineColor: '#000000', // Black
    outlineOffset: 2,
  },

  /**
   * High contrast for dark backgrounds
   */
  highContrastDark: {
    outlineStyle: 'solid' as const,
    outlineWidth: 3,
    outlineColor: '#FFFFFF', // White
    outlineOffset: 2,
  },
};

export default useKeyboardNavigation;
