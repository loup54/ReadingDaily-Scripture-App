/**
 * Document Analytics Service
 *
 * Tracks document interactions, views, and engagement metrics
 * - Records document views with duration and device info
 * - Tracks user interactions (scroll, search, share, etc.)
 * - Calculates engagement metrics and statistics
 * - Syncs analytics to Firestore for cloud storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/useAuthStore';
import * as Crypto from 'expo-crypto';

/**
 * Single view event
 */
export interface ViewEvent {
  eventId: string;
  documentId: string;
  viewedAt: number;
  duration: number; // milliseconds
  platform: 'ios' | 'android';
  appVersion: string;
  deviceInfo?: string;
  synced?: boolean;
}

/**
 * Interaction event (search, scroll, share, etc.)
 */
export interface InteractionEvent {
  eventId: string;
  documentId: string;
  action: string; // 'scroll', 'search', 'share', 'expand', 'download'
  timestamp: number;
  metadata?: Record<string, any>;
  synced?: boolean;
}

/**
 * User view statistics
 */
export interface UserViewStats {
  totalDocumentsViewed: number;
  totalViewCount: number;
  averageViewDuration: number;
  lastViewedAt?: number;
  viewsByDocument: Record<string, number>;
  viewDurationByDocument: Record<string, number>;
}

/**
 * Signature completion statistics
 */
export interface SignatureStats {
  totalAttempts: number;
  successfulSignatures: number;
  failedAttempts: number;
  successRate: number;
  averageTimeToSign: number;
  signaturesByDocument: Record<string, number>;
}

/**
 * Document engagement metrics
 */
export interface EngagementMetrics {
  documentId: string;
  viewCount: number;
  totalViewTime: number;
  interactionCount: number;
  lastViewedAt?: number;
  engagementScore: number; // 0-100
  interactionsByType: Record<string, number>;
}

/**
 * Document acceptance metrics
 */
export interface AcceptanceMetrics {
  documentId: string;
  acceptedCount: number;
  totalPossibleAcceptances: number;
  averageTimeToAccept: number;
  acceptanceRate: number;
  lastAcceptedAt?: number;
}

class DocumentAnalyticsService {
  private static readonly ANALYTICS_PREFIX = '@analytics_';
  private static readonly VIEW_EVENTS_KEY = '@analytics_view_events';
  private static readonly INTERACTION_EVENTS_KEY = '@analytics_interaction_events';
  private static readonly SIGNATURE_ATTEMPTS_KEY = '@analytics_signature_attempts';
  private static readonly ACCEPTANCE_TIMES_KEY = '@analytics_acceptance_times';
  private static readonly PENDING_SYNC_KEY = '@analytics_pending_sync';

  /**
   * Track document view
   */
  static async trackDocumentView(documentId: string): Promise<void> {
    try {
      const eventId = await this.generateId();
      const userId = useAuthStore.getState().user?.id;

      const viewEvent: ViewEvent = {
        eventId,
        documentId,
        viewedAt: Date.now(),
        duration: 0, // Will be updated when view ends
        platform: 'ios', // TODO: Get actual platform
        appVersion: '1.0.0', // TODO: Get actual app version
        deviceInfo: undefined,
        synced: false,
      };

      // Store locally
      const viewKey = `${this.VIEW_EVENTS_KEY}_${userId}`;
      const viewsJson = await AsyncStorage.getItem(viewKey);
      const views: ViewEvent[] = viewsJson ? JSON.parse(viewsJson) : [];
      views.push(viewEvent);
      await AsyncStorage.setItem(viewKey, JSON.stringify(views));

      // Mark for sync
      await this.markForSync(eventId);

      console.log(`[DocumentAnalyticsService] View tracked: ${documentId}`);
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to track view:', error);
    }
  }

  /**
   * Track document interaction
   */
  static async trackInteraction(
    documentId: string,
    action: string,
    metadata?: any
  ): Promise<void> {
    try {
      const eventId = await this.generateId();
      const userId = useAuthStore.getState().user?.id;

      const interactionEvent: InteractionEvent = {
        eventId,
        documentId,
        action,
        timestamp: Date.now(),
        metadata,
        synced: false,
      };

      // Store locally
      const intKey = `${this.INTERACTION_EVENTS_KEY}_${userId}`;
      const intJson = await AsyncStorage.getItem(intKey);
      const interactions: InteractionEvent[] = intJson ? JSON.parse(intJson) : [];
      interactions.push(interactionEvent);
      await AsyncStorage.setItem(intKey, JSON.stringify(interactions));

      // Mark for sync
      await this.markForSync(eventId);

      console.log(
        `[DocumentAnalyticsService] Interaction tracked: ${action} on ${documentId}`
      );
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to track interaction:', error);
    }
  }

  /**
   * Get view history for a document
   */
  static async getViewHistory(documentId: string): Promise<ViewEvent[]> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return [];

      const viewKey = `${this.VIEW_EVENTS_KEY}_${userId}`;
      const viewsJson = await AsyncStorage.getItem(viewKey);
      if (!viewsJson) return [];

      const views: ViewEvent[] = JSON.parse(viewsJson);
      return views.filter((v) => v.documentId === documentId);
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to get view history:', error);
      return [];
    }
  }

  /**
   * Get user view statistics
   */
  static async getUserViewStats(): Promise<UserViewStats> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        return {
          totalDocumentsViewed: 0,
          totalViewCount: 0,
          averageViewDuration: 0,
          viewsByDocument: {},
          viewDurationByDocument: {},
        };
      }

      const viewKey = `${this.VIEW_EVENTS_KEY}_${userId}`;
      const viewsJson = await AsyncStorage.getItem(viewKey);
      const views: ViewEvent[] = viewsJson ? JSON.parse(viewsJson) : [];

      const viewsByDocument: Record<string, number> = {};
      const viewDurationByDocument: Record<string, number> = {};
      let totalViewTime = 0;

      for (const view of views) {
        viewsByDocument[view.documentId] = (viewsByDocument[view.documentId] || 0) + 1;
        viewDurationByDocument[view.documentId] =
          (viewDurationByDocument[view.documentId] || 0) + view.duration;
        totalViewTime += view.duration;
      }

      const lastView = views.length > 0 ? views[views.length - 1] : null;

      return {
        totalDocumentsViewed: Object.keys(viewsByDocument).length,
        totalViewCount: views.length,
        averageViewDuration: views.length > 0 ? totalViewTime / views.length : 0,
        lastViewedAt: lastView?.viewedAt,
        viewsByDocument,
        viewDurationByDocument,
      };
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to get user stats:', error);
      return {
        totalDocumentsViewed: 0,
        totalViewCount: 0,
        averageViewDuration: 0,
        viewsByDocument: {},
        viewDurationByDocument: {},
      };
    }
  }

  /**
   * Track signature completion
   */
  static async trackSignatureAttempt(documentId: string, success: boolean): Promise<void> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return;

      const sigKey = `${this.SIGNATURE_ATTEMPTS_KEY}_${userId}`;
      const sigJson = await AsyncStorage.getItem(sigKey);
      const attempts: any[] = sigJson ? JSON.parse(sigJson) : [];

      attempts.push({
        documentId,
        success,
        timestamp: Date.now(),
      });

      await AsyncStorage.setItem(sigKey, JSON.stringify(attempts));
      console.log(
        `[DocumentAnalyticsService] Signature attempt tracked: ${documentId} - ${success}`
      );
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to track signature attempt:', error);
    }
  }

  /**
   * Get signature completion statistics
   */
  static async getSignatureStats(): Promise<SignatureStats> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        return {
          totalAttempts: 0,
          successfulSignatures: 0,
          failedAttempts: 0,
          successRate: 0,
          averageTimeToSign: 0,
          signaturesByDocument: {},
        };
      }

      const sigKey = `${this.SIGNATURE_ATTEMPTS_KEY}_${userId}`;
      const sigJson = await AsyncStorage.getItem(sigKey);
      const attempts: any[] = sigJson ? JSON.parse(sigJson) : [];

      let successCount = 0;
      let failCount = 0;
      const signaturesByDocument: Record<string, number> = {};

      for (const attempt of attempts) {
        if (attempt.success) {
          successCount++;
          signaturesByDocument[attempt.documentId] =
            (signaturesByDocument[attempt.documentId] || 0) + 1;
        } else {
          failCount++;
        }
      }

      return {
        totalAttempts: attempts.length,
        successfulSignatures: successCount,
        failedAttempts: failCount,
        successRate: attempts.length > 0 ? (successCount / attempts.length) * 100 : 0,
        averageTimeToSign: 0, // TODO: Calculate from signature service
        signaturesByDocument,
      };
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to get signature stats:', error);
      return {
        totalAttempts: 0,
        successfulSignatures: 0,
        failedAttempts: 0,
        successRate: 0,
        averageTimeToSign: 0,
        signaturesByDocument: {},
      };
    }
  }

  /**
   * Get document engagement metrics
   */
  static async getEngagementMetrics(documentId: string): Promise<EngagementMetrics> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        return {
          documentId,
          viewCount: 0,
          totalViewTime: 0,
          interactionCount: 0,
          engagementScore: 0,
          interactionsByType: {},
        };
      }

      // Get views
      const viewKey = `${this.VIEW_EVENTS_KEY}_${userId}`;
      const viewsJson = await AsyncStorage.getItem(viewKey);
      const views: ViewEvent[] = viewsJson ? JSON.parse(viewsJson) : [];
      const docViews = views.filter((v) => v.documentId === documentId);

      let totalViewTime = 0;
      for (const view of docViews) {
        totalViewTime += view.duration;
      }

      // Get interactions
      const intKey = `${this.INTERACTION_EVENTS_KEY}_${userId}`;
      const intJson = await AsyncStorage.getItem(intKey);
      const interactions: InteractionEvent[] = intJson ? JSON.parse(intJson) : [];
      const docInteractions = interactions.filter((i) => i.documentId === documentId);

      const interactionsByType: Record<string, number> = {};
      for (const interaction of docInteractions) {
        interactionsByType[interaction.action] =
          (interactionsByType[interaction.action] || 0) + 1;
      }

      // Calculate engagement score (0-100)
      const viewScore = Math.min(docViews.length * 10, 50);
      const timeScore = Math.min((totalViewTime / 60000) * 10, 25); // 1 min = 10 points
      const interactionScore = Math.min(docInteractions.length * 5, 25);
      const engagementScore = viewScore + timeScore + interactionScore;

      const lastView =
        docViews.length > 0 ? docViews[docViews.length - 1].viewedAt : undefined;

      return {
        documentId,
        viewCount: docViews.length,
        totalViewTime,
        interactionCount: docInteractions.length,
        lastViewedAt: lastView,
        engagementScore: Math.min(engagementScore, 100),
        interactionsByType,
      };
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to get engagement metrics:', error);
      return {
        documentId,
        viewCount: 0,
        totalViewTime: 0,
        interactionCount: 0,
        engagementScore: 0,
        interactionsByType: {},
      };
    }
  }

  /**
   * Track acceptance time
   */
  static async trackAcceptanceTime(documentId: string, timeToAcceptMs: number): Promise<void> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return;

      const accKey = `${this.ACCEPTANCE_TIMES_KEY}_${userId}`;
      const accJson = await AsyncStorage.getItem(accKey);
      const times: any[] = accJson ? JSON.parse(accJson) : [];

      times.push({
        documentId,
        timeToAcceptMs,
        acceptedAt: Date.now(),
      });

      await AsyncStorage.setItem(accKey, JSON.stringify(times));
      console.log(
        `[DocumentAnalyticsService] Acceptance time tracked: ${documentId} - ${timeToAcceptMs}ms`
      );
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to track acceptance time:', error);
    }
  }

  /**
   * Get acceptance metrics
   */
  static async getAcceptanceMetrics(documentId: string): Promise<AcceptanceMetrics> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        return {
          documentId,
          acceptedCount: 0,
          totalPossibleAcceptances: 1,
          averageTimeToAccept: 0,
          acceptanceRate: 0,
        };
      }

      const accKey = `${this.ACCEPTANCE_TIMES_KEY}_${userId}`;
      const accJson = await AsyncStorage.getItem(accKey);
      const times: any[] = accJson ? JSON.parse(accJson) : [];

      const docTimes = times.filter((t) => t.documentId === documentId);
      let totalTime = 0;

      for (const time of docTimes) {
        totalTime += time.timeToAcceptMs;
      }

      const lastAccepted =
        docTimes.length > 0 ? docTimes[docTimes.length - 1].acceptedAt : undefined;

      return {
        documentId,
        acceptedCount: docTimes.length,
        totalPossibleAcceptances: 1,
        averageTimeToAccept: docTimes.length > 0 ? totalTime / docTimes.length : 0,
        acceptanceRate: docTimes.length > 0 ? 100 : 0,
        lastAcceptedAt: lastAccepted,
      };
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to get acceptance metrics:', error);
      return {
        documentId,
        acceptedCount: 0,
        totalPossibleAcceptances: 1,
        averageTimeToAccept: 0,
        acceptanceRate: 0,
      };
    }
  }

  /**
   * Clear all analytics for user (account deletion)
   */
  static async clearAnalytics(userId: string): Promise<void> {
    try {
      const keys = [
        `${this.VIEW_EVENTS_KEY}_${userId}`,
        `${this.INTERACTION_EVENTS_KEY}_${userId}`,
        `${this.SIGNATURE_ATTEMPTS_KEY}_${userId}`,
        `${this.ACCEPTANCE_TIMES_KEY}_${userId}`,
        `${this.PENDING_SYNC_KEY}_${userId}`,
      ];

      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }

      console.log(`[DocumentAnalyticsService] Analytics cleared for user: ${userId}`);
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to clear analytics:', error);
    }
  }

  /**
   * Get pending sync events
   */
  static async getPendingSyncEvents(userId: string): Promise<string[]> {
    try {
      const syncKey = `${this.PENDING_SYNC_KEY}_${userId}`;
      const syncJson = await AsyncStorage.getItem(syncKey);
      return syncJson ? JSON.parse(syncJson) : [];
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to get pending sync:', error);
      return [];
    }
  }

  /**
   * Mark sync as complete
   */
  static async markSyncComplete(userId: string, eventId: string): Promise<void> {
    try {
      const syncKey = `${this.PENDING_SYNC_KEY}_${userId}`;
      const syncJson = await AsyncStorage.getItem(syncKey);
      let syncEvents: string[] = syncJson ? JSON.parse(syncJson) : [];

      syncEvents = syncEvents.filter((id) => id !== eventId);
      if (syncEvents.length > 0) {
        await AsyncStorage.setItem(syncKey, JSON.stringify(syncEvents));
      } else {
        await AsyncStorage.removeItem(syncKey);
      }
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to mark sync complete:', error);
    }
  }

  // ====== Private Helpers ======

  /**
   * Generate unique event ID
   */
  private static async generateId(): Promise<string> {
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    return `event_${timestamp}_${random}`;
  }

  /**
   * Mark event for sync
   */
  private static async markForSync(eventId: string): Promise<void> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return;

      const syncKey = `${this.PENDING_SYNC_KEY}_${userId}`;
      const syncJson = await AsyncStorage.getItem(syncKey);
      const syncEvents: string[] = syncJson ? JSON.parse(syncJson) : [];

      if (!syncEvents.includes(eventId)) {
        syncEvents.push(eventId);
        await AsyncStorage.setItem(syncKey, JSON.stringify(syncEvents));
      }
    } catch (error) {
      console.error('[DocumentAnalyticsService] Failed to mark for sync:', error);
    }
  }
}

export default DocumentAnalyticsService;
