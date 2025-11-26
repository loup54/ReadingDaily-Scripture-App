import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Root index - Phase 1: Basic Navigation
 *
 * This simplified version just redirects to the landing screen.
 * No initialization, no stores, no validation yet.
 */
export default function Index() {
  // Simple redirect to landing screen
  return <Redirect href="/(auth)/landing" />;
}
