/**
 * Progress Tab Screen
 *
 * Main tab for displaying user progress tracking, streaks, and badges
 * Integrates ProgressDashboard component
 * Phase E: Progress Tracking (Task 2.6)
 */

import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProgressDashboard } from '@/screens/progress/ProgressDashboard';

/**
 * Progress Tab Component
 *
 * Renders the progress dashboard with user's current data
 * Gets user ID from auth store for data fetching
 */
export default function ProgressTab() {
  const { user } = useAuthStore();

  // Get user ID from auth store
  const userId = user?.id;

  // If no user logged in, show empty state (shouldn't happen in normal flow)
  if (!userId) {
    return null;
  }

  // Render progress dashboard with user ID
  return <ProgressDashboard userId={userId} />;
}
