/**
 * Route History Service
 * Phase 3: Navigation & Flow - Route History & Breadcrumbs
 *
 * Tracks navigation history for displaying breadcrumb trails.
 * Maintains up to N previous routes for navigation context.
 */

export interface RouteSegment {
  /**
   * Route name/path (e.g., 'readings', 'readings/john-3-16')
   */
  name: string;

  /**
   * Display label for breadcrumb (e.g., 'Readings', 'John 3:16')
   */
  label: string;

  /**
   * Route parameters
   */
  params?: Record<string, any>;

  /**
   * Timestamp when route was visited
   */
  timestamp: number;

  /**
   * Optional icon name for breadcrumb display
   */
  icon?: string;
}

export type RouteHistoryListener = (history: RouteSegment[]) => void;

/**
 * Route History Service - Tracks navigation for breadcrumbs
 *
 * Usage:
 * const tracker = RouteHistoryService.getInstance();
 * tracker.push({ name: 'readings', label: 'Daily Readings' });
 * const breadcrumbs = tracker.getHistory();
 */
export class RouteHistoryService {
  private static instance: RouteHistoryService;
  private history: RouteSegment[] = [];
  private maxHistorySize: number = 10;
  private listeners: Set<RouteHistoryListener> = new Set();

  /**
   * Get singleton instance
   */
  static getInstance(): RouteHistoryService {
    if (!RouteHistoryService.instance) {
      RouteHistoryService.instance = new RouteHistoryService();
    }
    return RouteHistoryService.instance;
  }

  /**
   * Push a new route onto history
   *
   * @param segment Route segment to add
   */
  push(segment: Omit<RouteSegment, 'timestamp'>): void {
    const routeSegment: RouteSegment = {
      ...segment,
      timestamp: Date.now(),
    };

    console.log(
      `[RouteHistory] 📍 Pushing route: ${segment.name} (${segment.label})`
    );

    // Add to history
    this.history.push(routeSegment);

    // Keep max size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Pop last route from history
   *
   * @returns Popped route or undefined
   */
  pop(): RouteSegment | undefined {
    if (this.history.length === 0) return undefined;

    const popped = this.history.pop();
    console.log(`[RouteHistory] 📍 Popped route: ${popped?.name}`);

    this.notifyListeners();
    return popped;
  }

  /**
   * Replace last route in history
   *
   * @param segment New route segment
   */
  replace(segment: Omit<RouteSegment, 'timestamp'>): void {
    if (this.history.length === 0) {
      this.push(segment);
      return;
    }

    const routeSegment: RouteSegment = {
      ...segment,
      timestamp: Date.now(),
    };

    console.log(`[RouteHistory] 🔄 Replacing route: ${segment.name}`);

    this.history[this.history.length - 1] = routeSegment;
    this.notifyListeners();
  }

  /**
   * Get current navigation breadcrumb trail
   * Returns all routes except the current one (last item is current)
   *
   * @returns Array of breadcrumb segments
   */
  getBreadcrumbs(): RouteSegment[] {
    // Return all but last (last is current page)
    return this.history.slice(0, -1);
  }

  /**
   * Get current (top) route
   *
   * @returns Current route or undefined
   */
  getCurrent(): RouteSegment | undefined {
    return this.history[this.history.length - 1];
  }

  /**
   * Get full history
   *
   * @returns Copy of full history
   */
  getHistory(): RouteSegment[] {
    return [...this.history];
  }

  /**
   * Get history size
   */
  size(): number {
    return this.history.length;
  }

  /**
   * Check if route is in history
   *
   * @param name Route name
   * @returns True if route exists
   */
  has(name: string): boolean {
    return this.history.some((r) => r.name === name);
  }

  /**
   * Clear all history
   */
  clear(): void {
    console.log('[RouteHistory] 🗑️  Clearing history');
    this.history = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to history changes
   *
   * @param listener Callback function
   * @returns Unsubscribe function
   */
  onHistoryChange(listener: RouteHistoryListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Set max history size
   *
   * @param size Maximum number of routes to keep
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);

    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    console.log(`[RouteHistory] ⚙️  Max history size set to: ${size}`);
  }

  /**
   * Generate readable breadcrumb text
   *
   * @param separator Text to separate breadcrumbs (default: '/')
   * @returns Formatted breadcrumb string
   */
  generateBreadcrumbText(separator: string = ' / '): string {
    const breadcrumbs = this.getBreadcrumbs();
    if (breadcrumbs.length === 0) return '';

    return breadcrumbs.map((b) => b.label).join(separator);
  }

  /**
   * Private: Notify all listeners
   */
  private notifyListeners(): void {
    console.log(
      `[RouteHistory] 📢 Notifying ${this.listeners.size} listener(s). History size: ${this.history.length}`
    );

    this.listeners.forEach((listener) => {
      try {
        listener([...this.history]);
      } catch (error) {
        console.error('[RouteHistory] Error in listener:', error);
      }
    });
  }

  /**
   * Reset service (for testing)
   */
  reset(): void {
    console.log('[RouteHistory] 🔄 Resetting service');
    this.history = [];
    this.listeners.clear();
  }
}

// Export singleton instance
export const routeHistoryService = RouteHistoryService.getInstance();
