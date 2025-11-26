/**
 * Achievement Service
 * Phase 10C.3: Achievement Management
 *
 * Manages achievement operations:
 * - Award achievements to users
 * - Track unlock history
 * - Generate achievement definitions
 * - Calculate achievement progress
 * - Send achievement notifications
 * - Rarity color mapping
 *
 * Features:
 * - Firestore persistence
 * - Unlock history tracking
 * - Progress calculation
 * - Notification support
 * - Rarity-based styling
 */

import {
  Achievement,
  AchievementStats,
  AchievementUnlockedEvent,
  DEFAULT_ACHIEVEMENTS,
  AchievementRarity,
} from '@/types/subscription.types';

/**
 * Rarity color mapping for UI
 */
export const RARITY_COLORS = {
  common: '#808080', // Gray
  rare: '#4169E1', // Royal Blue
  epic: '#9370DB', // Medium Purple
  legendary: '#FFD700', // Gold
} as const;

/**
 * Rarity background colors
 */
export const RARITY_BACKGROUND_COLORS = {
  common: '#F5F5F5',
  rare: '#E6F0FF',
  epic: '#F3E6FF',
  legendary: '#FFFACD',
} as const;

/**
 * Achievement unlock history entry
 */
interface AchievementUnlock {
  achievementId: string;
  unlockedAt: number;
  pointsAwarded: number;
  notificationSent: boolean;
}

/**
 * Cache for achievement progress
 */
interface AchievementProgressCache {
  userId: string;
  progress: Map<string, number>;
  timestamp: number;
}

/**
 * Achievement Service - manages user achievements
 * Singleton pattern for consistency across app
 */
class AchievementService {
  private unlockedCache: Map<string, AchievementUnlock[]> = new Map();
  private progressCache: Map<string, AchievementProgressCache> = new Map();
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
  private isInitialized = false;
  private notificationCallbacks: Set<(event: AchievementUnlockedEvent) => void> = new Set();

  /**
   * Initialize achievement service
   */
  async initialize(): Promise<void> {
    try {
      console.log('[AchievementService] Initializing');
      // Load default achievements
      this.validateAchievementDefinitions();
      this.isInitialized = true;
      console.log('[AchievementService] ✅ Initialized');
    } catch (error) {
      console.error('[AchievementService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get all achievement definitions
   */
  getAchievementDefinitions(): Achievement[] {
    return DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a }));
  }

  /**
   * Get achievement by ID
   */
  getAchievementById(achievementId: string): Achievement | undefined {
    return DEFAULT_ACHIEVEMENTS.find((a) => a.id === achievementId);
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category: string): Achievement[] {
    return DEFAULT_ACHIEVEMENTS.filter((a) => a.category === category);
  }

  /**
   * Get achievements by rarity
   */
  getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
    return DEFAULT_ACHIEVEMENTS.filter((a) => a.rarity === rarity);
  }

  /**
   * Award achievement to user
   * Creates unlock record and triggers notifications
   */
  async awardAchievement(userId: string, achievementId: string): Promise<AchievementUnlockedEvent | null> {
    try {
      if (!userId || !achievementId) {
        throw new Error('userId and achievementId are required');
      }

      console.log('[AchievementService] Awarding achievement', achievementId, 'to', userId);

      const achievement = this.getAchievementById(achievementId);
      if (!achievement) {
        throw new Error(`Achievement not found: ${achievementId}`);
      }

      // Check if already unlocked
      const unlockedAchievements = await this.getUnlockedAchievements(userId);
      const alreadyUnlocked = unlockedAchievements.some((a) => a.achievementId === achievementId);

      if (alreadyUnlocked) {
        console.log('[AchievementService] Achievement already unlocked:', achievementId);
        return null;
      }

      // Create unlock record
      const unlockEvent: AchievementUnlockedEvent = {
        userId,
        achievementId,
        achievementName: achievement.name,
        timestamp: Date.now(),
        pointsAwarded: achievement.points,
      };

      // Save unlock record
      await this.saveUnlockRecord(userId, achievementId, achievement.points);

      // Invalidate cache
      this.invalidateProgressCache(userId);

      // Trigger notification callbacks
      this.notifyAchievementUnlocked(unlockEvent);

      console.log('[AchievementService] Achievement awarded:', achievementId);
      return unlockEvent;
    } catch (error) {
      console.error('[AchievementService] Error awarding achievement:', error);
      throw error;
    }
  }

  /**
   * Get all unlocked achievements for user
   */
  async getUnlockedAchievements(userId: string): Promise<AchievementUnlock[]> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      // Check cache first
      const cached = this.unlockedCache.get(userId);
      if (cached) {
        console.log('[AchievementService] Returning cached unlocks for', userId);
        return cached;
      }

      console.log('[AchievementService] Fetching unlocked achievements for', userId);

      // In real app, fetch from Firestore
      // const snapshot = await firestore()
      //   .collection('users')
      //   .doc(userId)
      //   .collection('achievements')
      //   .where('unlockedAt', '!=', null)
      //   .get();

      // const unlocks = snapshot.docs.map(doc => ({
      //   achievementId: doc.id,
      //   unlockedAt: doc.data().unlockedAt,
      //   pointsAwarded: doc.data().pointsAwarded,
      //   notificationSent: doc.data().notificationSent
      // }));

      // For now, return empty (no unlocks yet)
      const unlocks: AchievementUnlock[] = [];
      this.unlockedCache.set(userId, unlocks);
      return unlocks;
    } catch (error) {
      console.error('[AchievementService] Error getting unlocked achievements:', error);
      return [];
    }
  }

  /**
   * Get achievement statistics for user
   */
  async getAchievementStats(userId: string): Promise<AchievementStats> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      console.log('[AchievementService] Getting achievement stats for', userId);

      const unlockedAchievements = await this.getUnlockedAchievements(userId);
      const allAchievements = this.getAchievementDefinitions();

      // Calculate totals
      const totalPoints = unlockedAchievements.reduce((sum, unlock) => sum + unlock.pointsAwarded, 0);
      const unlockedCount = unlockedAchievements.length;
      const lockedCount = allAchievements.length - unlockedCount;
      const progressPercentage = (unlockedCount / allAchievements.length) * 100;

      // Find next achievement to unlock
      const nextAchievement = this.findNextAchievementToUnlock(allAchievements, unlockedAchievements);

      return {
        total: allAchievements.length,
        unlocked: unlockedCount,
        points: totalPoints,
        lockedCount,
        progressPercentage,
        nextAchievement,
      };
    } catch (error) {
      console.error('[AchievementService] Error getting achievement stats:', error);
      throw error;
    }
  }

  /**
   * Find next achievement to unlock
   */
  private findNextAchievementToUnlock(
    allAchievements: Achievement[],
    unlockedAchievements: AchievementUnlock[]
  ): AchievementStats['nextAchievement'] {
    const unlockedIds = new Set(unlockedAchievements.map((u) => u.achievementId));

    // Find first locked achievement that is not hidden
    const lockedAchievement = allAchievements.find(
      (a) => !unlockedIds.has(a.id) && (!a.hiddenUntilUnlocked || true)
    );

    if (!lockedAchievement) {
      return undefined;
    }

    // Mock progress data (in real app, query from sessions)
    const progress = Math.floor(Math.random() * lockedAchievement.requirement.value);

    return {
      id: lockedAchievement.id,
      name: lockedAchievement.name,
      progress,
      requirement: lockedAchievement.requirement.value,
    };
  }

  /**
   * Get rarity color for styling
   */
  getRarityColor(rarity: AchievementRarity): string {
    return RARITY_COLORS[rarity];
  }

  /**
   * Get rarity background color for styling
   */
  getRarityBackgroundColor(rarity: AchievementRarity): string {
    return RARITY_BACKGROUND_COLORS[rarity];
  }

  /**
   * Get rarity label text
   */
  getRarityLabel(rarity: AchievementRarity): string {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  }

  /**
   * Subscribe to achievement unlock events
   * Returns unsubscribe function
   */
  onAchievementUnlocked(callback: (event: AchievementUnlockedEvent) => void): () => void {
    console.log('[AchievementService] Adding achievement unlock listener');
    this.notificationCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      console.log('[AchievementService] Removing achievement unlock listener');
      this.notificationCallbacks.delete(callback);
    };
  }

  /**
   * Check if achievement is hidden until unlocked
   */
  isHiddenUntilUnlocked(achievementId: string): boolean {
    const achievement = this.getAchievementById(achievementId);
    return achievement?.hiddenUntilUnlocked ?? false;
  }

  /**
   * Get unlock timestamp for achievement
   */
  async getUnlockTimestamp(userId: string, achievementId: string): Promise<number | undefined> {
    try {
      const unlocks = await this.getUnlockedAchievements(userId);
      const unlock = unlocks.find((u) => u.achievementId === achievementId);
      return unlock?.unlockedAt;
    } catch (error) {
      console.error('[AchievementService] Error getting unlock timestamp:', error);
      return undefined;
    }
  }

  /**
   * Get total achievement points for user
   */
  async getTotalAchievementPoints(userId: string): Promise<number> {
    try {
      const unlockedAchievements = await this.getUnlockedAchievements(userId);
      return unlockedAchievements.reduce((sum, unlock) => sum + unlock.pointsAwarded, 0);
    } catch (error) {
      console.error('[AchievementService] Error getting total points:', error);
      return 0;
    }
  }

  /**
   * Get achievement count by category
   */
  getAchievementCountByCategory(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const achievement of this.getAchievementDefinitions()) {
      if (!counts[achievement.category]) {
        counts[achievement.category] = 0;
      }
      counts[achievement.category]++;
    }

    return counts;
  }

  /**
   * Get achievement count by rarity
   */
  getAchievementCountByRarity(): Record<AchievementRarity, number> {
    const counts: Record<AchievementRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    for (const achievement of this.getAchievementDefinitions()) {
      counts[achievement.rarity]++;
    }

    return counts;
  }

  /**
   * Get total available achievement points
   */
  getTotalAvailablePoints(): number {
    return this.getAchievementDefinitions().reduce((sum, a) => sum + a.points, 0);
  }

  /**
   * Check if achievement display order is valid
   */
  private validateAchievementDefinitions(): void {
    const achievementIds = new Set<string>();
    const displayOrders = new Set<number>();

    for (const achievement of DEFAULT_ACHIEVEMENTS) {
      // Check unique IDs
      if (achievementIds.has(achievement.id)) {
        console.warn(`[AchievementService] Duplicate achievement ID: ${achievement.id}`);
      }
      achievementIds.add(achievement.id);

      // Check display order
      if (displayOrders.has(achievement.displayOrder)) {
        console.warn(`[AchievementService] Duplicate display order: ${achievement.displayOrder}`);
      }
      displayOrders.add(achievement.displayOrder);

      // Validate requirement
      if (!achievement.requirement || !achievement.requirement.type) {
        console.warn(`[AchievementService] Invalid requirement for: ${achievement.id}`);
      }
    }
  }

  /**
   * Save unlock record to database
   * Placeholder for Firestore integration
   */
  private async saveUnlockRecord(userId: string, achievementId: string, points: number): Promise<void> {
    try {
      console.log('[AchievementService] Saving unlock record for', userId, achievementId);

      // In real app, save to Firestore
      // await firestore()
      //   .collection('users')
      //   .doc(userId)
      //   .collection('achievements')
      //   .doc(achievementId)
      //   .set({
      //     achievementId,
      //     unlockedAt: Date.now(),
      //     pointsAwarded: points,
      //     notificationSent: false
      //   }, { merge: true });

      // Update local cache
      const unlocks = await this.getUnlockedAchievements(userId);
      unlocks.push({
        achievementId,
        unlockedAt: Date.now(),
        pointsAwarded: points,
        notificationSent: true,
      });
    } catch (error) {
      console.error('[AchievementService] Error saving unlock record:', error);
      throw error;
    }
  }

  /**
   * Notify all listeners of achievement unlock
   */
  private notifyAchievementUnlocked(event: AchievementUnlockedEvent): void {
    this.notificationCallbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[AchievementService] Error in notification callback:', error);
      }
    });
  }

  /**
   * Invalidate progress cache for user
   */
  private invalidateProgressCache(userId: string): void {
    this.progressCache.delete(userId);
  }

  /**
   * Clear all caches
   */
  clearCache(userId?: string): void {
    if (userId) {
      console.log('[AchievementService] Clearing cache for', userId);
      this.unlockedCache.delete(userId);
      this.progressCache.delete(userId);
    } else {
      console.log('[AchievementService] Clearing all achievement cache');
      this.unlockedCache.clear();
      this.progressCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { unlockedCacheSize: number; progressCacheSize: number } {
    return {
      unlockedCacheSize: this.unlockedCache.size,
      progressCacheSize: this.progressCache.size,
    };
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    try {
      console.log('[AchievementService] Shutting down');
      this.unlockedCache.clear();
      this.progressCache.clear();
      this.notificationCallbacks.clear();
      this.isInitialized = false;
      console.log('[AchievementService] ✅ Shutdown complete');
    } catch (error) {
      console.error('[AchievementService] Error during shutdown:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const achievementService = new AchievementService();

// Export class for testing
export { AchievementService };
