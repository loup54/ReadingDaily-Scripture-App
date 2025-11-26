/**
 * Offline Store using Zustand
 * Phase 10A.5: Offline Support & Sync
 *
 * Manages offline state including:
 * - Download progress and status
 * - Cached data inventory
 * - Storage usage and quotas
 * - Network status (from OfflineService)
 * - Sync queue status (from OfflineService)
 * - Feature availability (from OfflineService)
 * - Service health
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadProgress } from '@/services/offline/OfflineDownloadCoordinator';
import { OfflineFeatures, ConnectionStatus } from '@/types/cache.types';

export type NetworkStatus = 'online' | 'offline' | 'unknown';
export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'vpn' | 'other' | 'unknown' | 'none';

interface OfflineStoreState {
  // Download state
  isDownloading: boolean;
  lastDownloadDate: number | null;
  downloadProgress: DownloadProgress;

  // Cached data inventory
  cachedReadingDates: string[];
  cachedAudioCount: number;
  cachedTranslationLanguages: string[];

  // Storage state
  storageUsedMB: number;
  storageTotalMB: number;
  storagePercentUsed: number;

  // Network state (from OfflineService)
  isOnline: boolean;
  networkType: NetworkType;
  connectionStatus: ConnectionStatus;

  // Sync state (from OfflineService)
  isSyncing: boolean;
  pendingSyncCount: number;
  failedSyncCount: number;
  lastSyncTime: number | null;

  // Feature availability (from OfflineService)
  features: OfflineFeatures;

  // Health state
  isServiceReady: boolean;
  serviceHealthIssues: string[];

  // Actions
  setDownloading: (isDownloading: boolean) => void;
  setDownloadProgress: (progress: DownloadProgress) => void;
  setLastDownloadDate: (date: number | null) => void;

  setCachedReadingDates: (dates: string[]) => void;
  setCachedAudioCount: (count: number) => void;
  setCachedTranslationLanguages: (languages: string[]) => void;

  setStorageStats: (usedMB: number, totalMB: number) => void;
  setNetworkStatus: (isOnline: boolean, type: NetworkType, connectionStatus: ConnectionStatus) => void;

  setSyncState: (isSyncing: boolean, pendingCount: number, failedCount: number, lastSyncTime: number | null) => void;
  setFeatures: (features: OfflineFeatures) => void;
  setServiceHealth: (isReady: boolean, issues: string[]) => void;

  resetDownloadState: () => void;
}

const defaultDownloadProgress: DownloadProgress = {
  step: 'readings',
  itemsCompleted: 0,
  itemsTotal: 0,
  percentage: 0,
  elapsedMs: 0,
  estimatedRemainingMs: 0,
};

const defaultFeatures: OfflineFeatures = {
  canPractice: true,
  canViewReadings: true,
  canViewResults: true,
  canSeeStats: true,
  canUpgrade: false,
  canSyncNow: true,
};

export const useOfflineStore = create<OfflineStoreState>()(
  persist(
    (set) => ({
      // Initial state
      isDownloading: false,
      lastDownloadDate: null,
      downloadProgress: defaultDownloadProgress,

      cachedReadingDates: [],
      cachedAudioCount: 0,
      cachedTranslationLanguages: [],

      storageUsedMB: 0,
      storageTotalMB: 50,
      storagePercentUsed: 0,

      isOnline: true,
      networkType: 'unknown',
      connectionStatus: 'online',

      isSyncing: false,
      pendingSyncCount: 0,
      failedSyncCount: 0,
      lastSyncTime: null,

      features: defaultFeatures,
      isServiceReady: false,
      serviceHealthIssues: [],

      // Actions
      setDownloading: (isDownloading: boolean) => {
        set({ isDownloading });
      },

      setDownloadProgress: (progress: DownloadProgress) => {
        set({ downloadProgress: progress });
      },

      setLastDownloadDate: (date: number | null) => {
        set({ lastDownloadDate: date });
      },

      setCachedReadingDates: (dates: string[]) => {
        set({ cachedReadingDates: dates });
      },

      setCachedAudioCount: (count: number) => {
        set({ cachedAudioCount: count });
      },

      setCachedTranslationLanguages: (languages: string[]) => {
        set({ cachedTranslationLanguages: languages });
      },

      setStorageStats: (usedMB: number, totalMB: number) => {
        const percentUsed = totalMB > 0 ? (usedMB / totalMB) * 100 : 0;
        set({
          storageUsedMB: usedMB,
          storageTotalMB: totalMB,
          storagePercentUsed: Math.round(percentUsed * 10) / 10,
        });
      },

      setNetworkStatus: (isOnline: boolean, type: NetworkType, connectionStatus: ConnectionStatus) => {
        set({ isOnline, networkType: type, connectionStatus });
      },

      setSyncState: (isSyncing: boolean, pendingCount: number, failedCount: number, lastSyncTime: number | null) => {
        set({
          isSyncing,
          pendingSyncCount: pendingCount,
          failedSyncCount: failedCount,
          lastSyncTime,
        });
      },

      setFeatures: (features: OfflineFeatures) => {
        set({ features });
      },

      setServiceHealth: (isReady: boolean, issues: string[]) => {
        set({ isServiceReady: isReady, serviceHealthIssues: issues });
      },

      resetDownloadState: () => {
        set({
          isDownloading: false,
          downloadProgress: defaultDownloadProgress,
        });
      },
    }),
    {
      name: 'offline-storage', // Name of the storage key
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these properties
        lastDownloadDate: state.lastDownloadDate,
        cachedReadingDates: state.cachedReadingDates,
        cachedAudioCount: state.cachedAudioCount,
        cachedTranslationLanguages: state.cachedTranslationLanguages,
        storageUsedMB: state.storageUsedMB,
        storageTotalMB: state.storageTotalMB,
        storagePercentUsed: state.storagePercentUsed,
      }),
    }
  )
);
