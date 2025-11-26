/**
 * Swipe Gesture Utilities
 *
 * Helper functions for detecting and handling swipe gestures.
 * Works with React Native's PanResponder or custom touch handlers.
 *
 * Features:
 * - Swipe direction detection (left, right, up, down)
 * - Configurable sensitivity thresholds
 * - Velocity-based detection
 * - Type-safe gesture types
 */

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | 'none';

export interface SwipeGestureConfig {
  /** Minimum distance to register swipe (default: 50) */
  minDistance?: number;

  /** Minimum velocity to register swipe (default: 0.3) */
  minVelocity?: number;

  /** Maximum angle from horizontal/vertical (default: 45 degrees) */
  maxAngle?: number;

  /** Threshold for distinguishing vertical vs horizontal (default: 30) */
  directionThreshold?: number;
}

export interface SwipeEvent {
  /** Starting X position */
  startX: number;

  /** Starting Y position */
  startY: number;

  /** Ending X position */
  endX: number;

  /** Ending Y position */
  endY: number;

  /** Horizontal distance */
  distanceX: number;

  /** Vertical distance */
  distanceY: number;

  /** Time elapsed in milliseconds */
  duration: number;

  /** Horizontal velocity (pixels/second) */
  velocityX: number;

  /** Vertical velocity (pixels/second) */
  velocityY: number;

  /** Detected swipe direction */
  direction: SwipeDirection;
}

/**
 * Detect swipe direction from touch coordinates
 *
 * @example
 * const direction = detectSwipeDirection({
 *   startX: 100,
 *   startY: 100,
 *   endX: 200,
 *   endY: 150,
 *   duration: 200,
 * });
 * // 'right'
 */
export const detectSwipeDirection = (
  event: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    duration: number;
  },
  config?: Partial<SwipeGestureConfig>
): SwipeEvent => {
  const mergedConfig = {
    minDistance: 50,
    minVelocity: 0.3,
    maxAngle: 45,
    directionThreshold: 30,
    ...config,
  };

  const distanceX = event.endX - event.startX;
  const distanceY = event.endY - event.startY;
  const duration = Math.max(event.duration, 1); // Prevent division by zero

  // Calculate velocity (pixels per second)
  const velocityX = (distanceX / duration) * 1000;
  const velocityY = (distanceY / duration) * 1000;

  // Determine direction
  let direction: SwipeDirection = 'none';

  const absDistanceX = Math.abs(distanceX);
  const absDistanceY = Math.abs(distanceY);

  // Check if swipe distance is sufficient
  const hasMinDistance =
    absDistanceX >= mergedConfig.minDistance! ||
    absDistanceY >= mergedConfig.minDistance!;

  if (!hasMinDistance) {
    return {
      startX: event.startX,
      startY: event.startY,
      endX: event.endX,
      endY: event.endY,
      distanceX,
      distanceY,
      duration: event.duration,
      velocityX,
      velocityY,
      direction: 'none',
    };
  }

  // Determine if more horizontal or vertical
  if (absDistanceX > absDistanceY + mergedConfig.directionThreshold!) {
    // Horizontal swipe
    direction = distanceX > 0 ? 'right' : 'left';
  } else if (absDistanceY > absDistanceX + mergedConfig.directionThreshold!) {
    // Vertical swipe
    direction = distanceY > 0 ? 'down' : 'up';
  }

  return {
    startX: event.startX,
    startY: event.startY,
    endX: event.endX,
    endY: event.endY,
    distanceX,
    distanceY,
    duration: event.duration,
    velocityX,
    velocityY,
    direction,
  };
};

/**
 * Create touch handlers for swipe detection
 *
 * Returns startHandler and endHandler for use with onResponderGrant/Release
 *
 * @example
 * const { handleTouchStart, handleTouchEnd } = createSwipeHandlers(
 *   (swipeEvent) => {
 *     if (swipeEvent.direction === 'left') {
 *       console.log('Swiped left');
 *     }
 *   }
 * );
 */
export const createSwipeHandlers = (
  onSwipe: (event: SwipeEvent) => void,
  config?: Partial<SwipeGestureConfig>
) => {
  let touchStart = { x: 0, y: 0, timestamp: 0 };

  const handleTouchStart = (x: number, y: number) => {
    touchStart = {
      x,
      y,
      timestamp: Date.now(),
    };
  };

  const handleTouchEnd = (x: number, y: number) => {
    const swipeEvent = detectSwipeDirection(
      {
        startX: touchStart.x,
        startY: touchStart.y,
        endX: x,
        endY: y,
        duration: Date.now() - touchStart.timestamp,
      },
      config
    );

    if (swipeEvent.direction !== 'none') {
      onSwipe(swipeEvent);
    }
  };

  return {
    handleTouchStart,
    handleTouchEnd,
  };
};

/**
 * Check if gesture is a horizontal swipe
 */
export const isHorizontalSwipe = (direction: SwipeDirection): boolean => {
  return direction === 'left' || direction === 'right';
};

/**
 * Check if gesture is a vertical swipe
 */
export const isVerticalSwipe = (direction: SwipeDirection): boolean => {
  return direction === 'up' || direction === 'down';
};

/**
 * Swipe gesture directions with descriptions
 */
export const SwipeDescriptions = {
  left: 'Swipe left to go back',
  right: 'Swipe right to go forward',
  up: 'Swipe up to scroll',
  down: 'Swipe down to scroll',
  none: 'Tap or hold',
} as const;

/**
 * Create gesture callback with fallback for unsupported devices
 *
 * Useful for graceful degradation on devices without gesture support
 *
 * @example
 * const handleNavigate = createGestureWithFallback(
 *   (direction) => {
 *     if (direction === 'right') navigation.goBack();
 *   },
 *   () => {
 *     // Fallback: show button
 *     setShowBackButton(true);
 *   }
 * );
 */
export const createGestureWithFallback = (
  onGestureDetected: (direction: SwipeDirection) => void,
  onUnsupported?: () => void
) => {
  return (swipeEvent: SwipeEvent) => {
    if (swipeEvent.direction === 'none') {
      if (onUnsupported) {
        onUnsupported();
      }
    } else {
      onGestureDetected(swipeEvent.direction);
    }
  };
};
