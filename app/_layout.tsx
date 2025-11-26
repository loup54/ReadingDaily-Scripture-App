import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { Colors } from '@constants';
import { notificationService } from '@/services/notifications/NotificationService';
import { NetworkStatusService } from '@/services/network/NetworkStatusService';
import { OfflineDownloadCoordinator } from '@/services/offline/OfflineDownloadCoordinator';
import { ReadingDownloadService } from '@/services/offline/ReadingDownloadService';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { DownloadStatusOverlay } from '@/components/offline/DownloadStatusOverlay';
import { SyncStatusIndicator } from '@/components/offline/SyncStatusIndicator';
import { SyncQueueService } from '@/services/offline/SyncQueueService';
import { OfflineNotificationService } from '@/services/offline/OfflineNotificationService';
import { useTheme } from '@/hooks/useTheme';
import { toastConfig } from '@/services/notifications/ToastService';
import { DevelopmentAuthHelper } from '@/services/auth/DevelopmentAuthHelper';
// Temporarily disabled - requires @react-native-firebase/messaging package
// import { FirebaseCloudMessagingService } from '@/services/notifications/FirebaseCloudMessagingService';
import { ModalRenderer } from '@/components/ui/ModalRenderer';

/**
 * Deep Linking Configuration for Expo Router
 * Phase 1: Navigation & Flow - Deep Linking Setup
 *
 * Defines URL schemes for deep linking from notifications
 * Supports: readingdaily://readings/:passageId, readingdaily://practice, etc.
 */
const linking = {
  prefixes: ['readingdaily://', 'https://readingdaily.app'],
  config: {
    screens: {
      // Main tab screens
      '(tabs)/readings': 'readings',
      '(tabs)/practice': 'practice',
      '(tabs)/progress': 'progress',
      '(tabs)/notifications': 'notifications',
      '(tabs)/settings': 'settings',
      '(tabs)/help': 'help',
      '(tabs)/subscription': 'subscription',

      // Specific reading screen with passage ID parameter
      '(tabs)/readings/:passageId': 'readings/:passageId',

      // Subscription gifting routes
      '(tabs)/subscription/send-gift': 'subscription/send-gift',
      '(tabs)/subscription/redeem-gift': 'subscription/redeem-gift',

      // Notification sub-stack
      'notifications/settings': 'notifications/settings',

      // Catch-all for undefined routes
      '*': '*',
    },
  },
};

// Export linking configuration for Expo Router
export { linking };

export default function RootLayout() {
  const { initializeAuthState, isInitialized, state, user } = useAuthStore();
  const { isOnline, isDownloading, downloadProgress, isSyncing, pendingSyncCount } = useOfflineStore();

  // CRITICAL FIX: Ensure enableAudioHighlighting is always false
  // Use a higher priority effect to run before anything else
  const firstRenderRef = useRef(true);
  if (firstRenderRef.current === true) {
    firstRenderRef.current = false;
    const currentSettings = useSettingsStore.getState().settings;
    console.log('[RootLayout] Initial enableAudioHighlighting value:', currentSettings.audio.enableAudioHighlighting);
    if (currentSettings.audio.enableAudioHighlighting === true) {
      console.log('[RootLayout] 🔧 CRITICAL FIX: Disabling audio highlighting NOW');
      const newState = {
        settings: {
          ...currentSettings,
          audio: {
            ...currentSettings.audio,
            enableAudioHighlighting: false,
          },
        },
      };
      console.log('[RootLayout] Setting new state:', { enableAudioHighlighting: newState.settings.audio.enableAudioHighlighting });
      useSettingsStore.setState(newState);
    } else {
      console.log('[RootLayout] enableAudioHighlighting already false, no fix needed');
    }
  }

  // CRITICAL FIX: Clear old persisted data and reset store to ensure clean state
  useEffect(() => {
    const resetStorageIfNeeded = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

        // Check if we need to reset
        const currentSettings = useSettingsStore.getState().settings;
        if (currentSettings.audio.enableAudioHighlighting === true) {
          console.log('[RootLayout] 🚨 CRITICAL: Persisted data has true value, clearing AsyncStorage...');

          // Clear the corrupted settings from AsyncStorage
          await AsyncStorage.removeItem('app-settings-storage');
          console.log('[RootLayout] ✅ Cleared corrupted settings from AsyncStorage');

          // Reset store to defaults
          await useSettingsStore.getState().resetSettings();
          console.log('[RootLayout] ✅ Reset settings store to defaults');

          // Verify the fix
          const verifySettings = useSettingsStore.getState().settings;
          console.log('[RootLayout] Verified new value:', { enableAudioHighlighting: verifySettings.audio.enableAudioHighlighting });
        } else {
          console.log('[RootLayout] ✅ Settings are clean, no reset needed');
        }
      } catch (error) {
        console.error('[RootLayout] Error during settings reset:', error);
      }
    };

    resetStorageIfNeeded();
  }, []);

  // Initialize Firebase authentication on app startup
  useEffect(() => {
    if (!isInitialized) {
      const initAuth = async () => {
        // In development mode, ensure test account is logged in for easier testing
        if (DevelopmentAuthHelper.isDevMode()) {
          console.log('[RootLayout] 🔧 Development mode detected - ensuring test account is authenticated');
          const authSuccess = await DevelopmentAuthHelper.ensureTestAccountLoggedIn();
          if (!authSuccess) {
            console.warn('[RootLayout] ⚠️ Failed to auto-login test account, proceeding with normal auth flow');
          }
        }

        // Initialize auth state from Firebase
        await initializeAuthState();
      };

      initAuth();
    }
  }, [isInitialized, initializeAuthState]);


  // Set up deep linking handler for notifications
  useEffect(() => {
    console.log('[RootLayout] 🔗 Registering deep linking handler for notifications');

    // Register the navigation handler with FCM service
    // This enables notifications to route to specific screens/passages
    // Temporarily disabled - requires @react-native-firebase/messaging package
    // const fcmService = FirebaseCloudMessagingService.getInstance();
    // fcmService.setNavigationHandler((deepLink) => {
    //   console.log(`[RootLayout] 🔗 Navigating to deep link: ${deepLink}`);
    //   router.push(deepLink);
    // });
  }, []);

  // Set up notification response handler for when user taps a notification
  useEffect(() => {
    console.log('[RootLayout] Setting up notification delivery listener');

    // Listen for delivered notifications
    const removeListener = notificationService.onNotificationDelivered((notification) => {
      console.log('[RootLayout] 📲 Notification delivered:', notification.id);

      // Navigation to specific screen based on notification type would be handled
      // by the FCM service or notification tap handlers
    });

    // Clean up listener on unmount
    return () => {
      removeListener();
    };
  }, []);

  // Initialize offline/network features
  useEffect(() => {
    const initializeOfflineFeatures = async () => {
      try {
        console.log('[RootLayout] Initializing offline features');

        // Initialize network status monitoring
        await NetworkStatusService.initialize();
        console.log('[RootLayout] ✅ Network status monitor initialized');

        // Update initial network state in store
        const networkState = NetworkStatusService.getCurrentState();
        useOfflineStore.setState({
          isOnline: networkState.status === 'online',
          networkType: networkState.type,
        });

        // Subscribe to network changes
        let wasOffline = !isOnline;
        let syncRetryTimeout: number | null = null;

        const triggerSync = async () => {
          try {
            console.log('[RootLayout] 🔄 Sync triggered - processing queue');
            useOfflineStore.setState({ isSyncing: true });

            const queueSize = await SyncQueueService.getQueueSize();
            if (queueSize > 0) {
              console.log(`[RootLayout] Processing ${queueSize} queued operation(s)`);

              const result = await SyncQueueService.processQueue();

              useOfflineStore.setState({
                isSyncing: false,
                pendingSyncCount: result.pending,
              });

              // Show appropriate notification based on results
              if (result.succeeded > 0) {
                OfflineNotificationService.showSyncComplete(result.succeeded, result.failed);
                console.log('[RootLayout] ✅ Sync completed:', {
                  succeeded: result.succeeded,
                  failed: result.failed,
                  pending: result.pending,
                });
              } else if (result.failed > 0) {
                const errorSummary = result.errors.slice(0, 3).join(', ');
                OfflineNotificationService.showSyncFailed(errorSummary);
                console.warn('[RootLayout] ⚠️ Sync completed with failures:', {
                  succeeded: result.succeeded,
                  failed: result.failed,
                  pending: result.pending,
                  errors: result.errors,
                });
              }

              // If there are still pending operations, schedule retry
              if (result.pending > 0) {
                console.log(`[RootLayout] ${result.pending} operation(s) waiting for retry...`);
                // Retry sync after 5 seconds if device is still online
                syncRetryTimeout = setTimeout(() => {
                  const networkState = NetworkStatusService.getCurrentState();
                  if (networkState.status === 'online') {
                    console.log('[RootLayout] Retrying sync for waiting operations');
                    triggerSync();
                  }
                }, 5000);
              }
            } else {
              console.log('[RootLayout] Sync queue is empty');
              useOfflineStore.setState({ isSyncing: false });
            }
          } catch (error) {
            useOfflineStore.setState({ isSyncing: false });
            const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
            OfflineNotificationService.showSyncFailed(errorMsg);
            console.error('[RootLayout] 🚨 Sync error:', error);
          }
        };

        const unsubscribeNetwork = NetworkStatusService.onNetworkChange(async (state) => {
          const isNowOnline = state.status === 'online';
          useOfflineStore.setState({
            isOnline: isNowOnline,
            networkType: state.type,
          });

          // Trigger sync when coming back online
          if (wasOffline && isNowOnline) {
            console.log('[RootLayout] 📡 Device came back online');

            // Clear any pending retry timeout
            if (syncRetryTimeout) {
              clearTimeout(syncRetryTimeout);
              syncRetryTimeout = null;
            }

            // Check if there are pending sync operations
            const queueSize = await SyncQueueService.getQueueSize();
            if (queueSize > 0) {
              console.log(`[RootLayout] Found ${queueSize} queued operation(s), starting sync`);
              await triggerSync();
            } else {
              console.log('[RootLayout] No pending sync operations');
            }
          } else if (!isNowOnline && !wasOffline) {
            console.log('[RootLayout] 📴 Device went offline');
            // Clear any pending retry timeout
            if (syncRetryTimeout) {
              clearTimeout(syncRetryTimeout);
              syncRetryTimeout = null;
            }
          }

          wasOffline = !isNowOnline;
        });

        // Check if auto-download should happen
        const settings = useSettingsStore.getState().settings;
        const offlineSettings = settings?.offline || {};

        const downloadConfig = {
          autoDownloadEnabled: offlineSettings.autoDownloadEnabled ?? true,
          wifiOnlyEnabled: offlineSettings.wifiOnlyEnabled ?? false,
          selectedLanguages: offlineSettings.selectedLanguagesForCache ?? ['es'],
          audioVoicePreference: offlineSettings.audioVoiceForDownload ?? 'FEMALE_PRIMARY',
          audioSpeedPreference: offlineSettings.audioSpeedForDownload ?? 1.0,
          daysToDownload: offlineSettings.daysToKeepReadings ?? 7,
        };

        const shouldAutoDownload = await OfflineDownloadCoordinator.shouldAutoDownload(downloadConfig);

        if (shouldAutoDownload) {
          console.log('[RootLayout] Starting auto-download of offline data');
          useOfflineStore.setState({ isDownloading: true });

          // Subscribe to download progress
          const unsubscribeProgress = OfflineDownloadCoordinator.onProgress((progress) => {
            useOfflineStore.setState({ downloadProgress: progress });
          });

          // Start the download
          await OfflineDownloadCoordinator.startCoordinatedDownload(downloadConfig);

          // Update cached reading dates
          const cachedDates = await ReadingDownloadService.getDownloadedDates();
          useOfflineStore.setState({
            cachedReadingDates: cachedDates,
            isDownloading: false,
            lastDownloadDate: Date.now(),
          });

          unsubscribeProgress();
          console.log('[RootLayout] ✅ Auto-download complete');
        }

        // Cleanup function
        return () => {
          unsubscribeNetwork();
          if (syncRetryTimeout) {
            clearTimeout(syncRetryTimeout);
          }
        };
      } catch (error) {
        console.error('[RootLayout] Error initializing offline features:', error);
      }
    };

    initializeOfflineFeatures();
  }, []);

  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        {/* Offline Indicator - Shows at top when offline */}
        <OfflineIndicator position="top" animated={true} showDetails={false} />

        {/* Main app content - route structure defined by file system */}
        <Slot />

        {/* Download Status Overlay - Shows during offline downloads */}
        {isDownloading && (
          <DownloadStatusOverlay
            visible={isDownloading}
            type={downloadProgress.step as any}
            progress={downloadProgress.percentage}
            currentItem={downloadProgress.currentItem || 'Preparing...'}
            itemCount={downloadProgress.itemsTotal}
            completedCount={downloadProgress.itemsCompleted}
            canCancel={true}
            onCancel={() => OfflineDownloadCoordinator.cancelDownload()}
          />
        )}

        {/* Sync Status Indicator - Shows during sync operations */}
        {isSyncing && (
          <SyncStatusIndicator isSyncing={isSyncing} itemsTotal={pendingSyncCount} />
        )}

        {/* Modal Renderer - Renders active modal from global stack (Phase 2) */}
        <ModalRenderer debug={false} />

        {/* Toast Notifications - Auto-dismissing, non-blocking notifications */}
        <Toast config={toastConfig} />
      </View>
    </ThemeProvider>
  );
}
