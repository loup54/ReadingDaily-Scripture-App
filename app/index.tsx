import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTrialStore } from '@/stores/useTrialStore';
import { validateEnv } from '@/config/env';
import { analyticsService } from '@/services/analytics/AnalyticsService';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function Index() {
  const router = useRouter();
  const { user, state, isInitialized: authInitialized } = useAuthStore();
  const { initializeTrial, checkTrialStatus } = useTrialStore();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [minDurationElapsed, setMinDurationElapsed] = React.useState(false);

  // Minimum display duration for loading screen (so users can see quotes rotate)
  useEffect(() => {
    console.log('[App] Starting minimum display timer (5s) for loading screen - allows quote rotation');
    const timer = setTimeout(() => {
      console.log('[App] Minimum display duration elapsed - ready to proceed');
      setMinDurationElapsed(true);
    }, 5000); // Show loading screen for 5 seconds (quotes rotate every 4s)

    return () => {
      clearTimeout(timer);
      console.log('[App] Minimum display timer cleaned up');
    };
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Validate environment
        validateEnv();

        // Initialize analytics service
        await analyticsService.initialize();
        console.log('[App] Analytics initialized');

        // Initialize trial
        await initializeTrial();
        await checkTrialStatus();

        // Set up analytics user tracking
        const auth = getAuth();
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            await analyticsService.setUserId(firebaseUser.uid);
            await analyticsService.setUserProperties({
              email: firebaseUser.email || 'unknown',
              createdAt: firebaseUser.metadata?.creationTime,
            });
          }
        });

        console.log('[App] Initialization complete - waiting for minimum display duration');
        setIsInitialized(true);
      } catch (error) {
        console.error('[App] Initialization failed:', error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  // Show loading screen until BOTH initialization complete AND minimum duration elapsed
  if (!isInitialized || !authInitialized || !minDurationElapsed) {
    if (!isInitialized || !authInitialized) {
      console.log('[App] Showing initialization screen - waiting for initialization');
    } else {
      console.log('[App] Initialization done, but showing screen until minimum duration (5s) for quote rotation');
    }
    return (
      <LoadingScreen />
    );
  }

  // Redirect based on auth state
  if (state === 'authenticated' && user) {
    return <Redirect href="/(tabs)/readings" />;
  }

  return <Redirect href="/(auth)/landing" />;
}
