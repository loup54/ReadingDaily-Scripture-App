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

        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization failed:', error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  if (!isInitialized || !authInitialized) {
    return <LoadingScreen message="Initializing app..." />;
  }

  // Redirect based on auth state
  if (state === 'authenticated' && user) {
    return <Redirect href="/(tabs)/readings" />;
  }

  return <Redirect href="/(auth)/landing" />;
}
