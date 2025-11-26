import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { DailyReadingsScreen } from '@/screens/readings/DailyReadingsScreen';
import { PaywallScreen } from '@/screens/trial';
import { UpgradePrompt } from '@/components/trial';
import { ReadingService } from '@/services/readings/ReadingService';
import { DailyReadings, ReadingType } from '@/types/reading.types';
import { useTrialStore } from '@/stores/useTrialStore';
import { useRouter } from 'expo-router';
import { Colors } from '@constants';
import { ErrorBoundary } from '@/components/common';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

function ReadingsTabContent() {
  const [readings, setReadings] = useState<DailyReadings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReadingType>('first-reading');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const router = useRouter();
  const { colors, isDark } = useTheme();

  const {
    isActive,
    hasExpired,
    hasPurchased,
    checkTrialStatus,
  } = useTrialStore();

  useEffect(() => {
    loadTodayReadings();
  }, []);

  const loadTodayReadings = async () => {
    try {
      setLoading(true);
      const data = await ReadingService.getTodayReadings();
      setReadings(data);
      // Normalize today's date to midnight
      const today = new Date();
      const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      setSelectedDate(normalizedToday);
      console.log('[ReadingsTab] Loaded today readings:', normalizedToday.toISOString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load readings');
      console.error('Error loading readings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTomorrowPress = async () => {
    try {
      setLoading(true);
      // Normalize tomorrow's date to midnight
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const normalizedTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

      const data = await ReadingService.getDailyReadings(normalizedTomorrow);
      setReadings(data);
      setSelectedDate(normalizedTomorrow); // Sync selectedDate
      console.log('[ReadingsTab] Loaded tomorrow readings:', normalizedTomorrow.toISOString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load readings');
    } finally {
      setLoading(false);
    }
  };

  const handleDatePickerConfirm = async (date: Date) => {
    try {
      // Ensure date is a valid Date object
      const validDate = date instanceof Date ? date : new Date(date);

      // Reset time to midnight to avoid timezone issues
      const normalizedDate = new Date(validDate.getFullYear(), validDate.getMonth(), validDate.getDate());

      console.log('[ReadingsTab] Date picker selected:', normalizedDate.toISOString());

      setSelectedDate(normalizedDate);
      setShowDatePicker(false);
      setLoading(true);
      const data = await ReadingService.getDailyReadings(normalizedDate);
      setReadings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load readings');
      console.error('[ReadingsTab] Error loading readings for date:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarPress = () => {
    setShowDatePicker(true);
  };

  const handlePlaybackComplete = async () => {
    try {
      console.log('[ReadingsTab] 🎬 handlePlaybackComplete CALLED!');
      console.log('[ReadingsTab] Current state:', {
        hasReadings: !!readings,
        activeTab,
        selectedDate: selectedDate.toISOString(),
      });

      if (readings && activeTab) {
        console.log('[ReadingsTab] ✓ Readings and activeTab exist');

        // Get user from auth store
        const { useAuthStore } = await import('@/stores/useAuthStore');
        const user = useAuthStore.getState().user;

        console.log('[ReadingsTab] User from auth store:', {
          hasUser: !!user,
          id: user?.id,
          email: user?.email,
        });

        if (!user?.id) {
          console.warn('[ReadingsTab] ❌ No authenticated user, cannot record reading');
          return;
        }

        console.log('[ReadingsTab] ✓ User authenticated with ID:', user.id);

        // Get the reading date in YYYY-MM-DD format
        const readingDate = new Date(readings.date || selectedDate);
        const dateString = readingDate.toISOString().split('T')[0];

        console.log('[ReadingsTab] Recording reading for date:', dateString, 'readingType:', activeTab);

        // Import Firestore methods
        const { db } = await import('@/config/firebase');
        const { doc, setDoc, Timestamp } = await import('firebase/firestore');

        if (!db) {
          console.error('[ReadingsTab] ❌ Firestore database not initialized');
          return;
        }

        // IMPORTANT: Write as individual date documents in the readings collection
        // Path: /users/{userId}/readings/{dateString}
        // This path triggers the onReadingRecorded Cloud Function which calculates streaks/badges
        const readingRef = doc(db, 'users', user.id, 'readings', dateString);

        await setDoc(readingRef, {
          date: dateString,
          readingType: activeTab,
          timestamp: Timestamp.now(),
          completedAt: Date.now(),
        }, { merge: true });

        console.log('[ReadingsTab] ✅ Reading recorded successfully:', {
          userId: user.id,
          date: dateString,
          readingType: activeTab,
        });
      } else {
        console.log('[ReadingsTab] ❌ Cannot record - missing data:', {
          readings: !!readings,
          activeTab,
        });
      }
    } catch (error) {
      console.error('[ReadingsTab] Error recording reading:', error);
      // Don't show error to user - reading playback is still successful
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary.blue} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading today's readings...</Text>
      </View>
    );
  }

  if (error || !readings) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.errorText, { color: colors.status.error }]}>
          {error || 'No readings available'}
        </Text>
      </View>
    );
  }

  // Show paywall if trial expired and not purchased
  if (hasExpired && !hasPurchased) {
    return <PaywallScreen onPurchaseComplete={() => checkTrialStatus()} />;
  }

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
  };

  return (
    <>
      <DailyReadingsScreen
        readings={readings}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onTomorrowPress={handleTomorrowPress}
        onPlaybackComplete={handlePlaybackComplete}
        onUpgradePress={() => setShowUpgradePrompt(true)}
        onSettingsPress={handleSettingsPress}
        onCalendarPress={handleCalendarPress}
        selectedDate={selectedDate}
      />

      {/* Calendar Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={[styles.calendarModalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.calendarModalContent, { backgroundColor: isDark ? colors.background.secondary : colors.background.primary }]}>
              <View style={styles.calendarHeader}>
                <Text style={[styles.calendarTitle, { color: colors.text.primary }]}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.calendarClose, { color: colors.primary.blue }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <Calendar
                current={selectedDate.toISOString().split('T')[0]}
                onDayPress={(day) => {
                  const selectedDate = new Date(day.dateString);
                  handleDatePickerConfirm(selectedDate);
                }}
                theme={{
                  backgroundColor: isDark ? colors.background.secondary : colors.background.primary,
                  calendarBackground: isDark ? colors.background.secondary : colors.background.primary,
                  textSectionTitleColor: isDark ? colors.text.secondary : colors.text.secondary,
                  selectedDayBackgroundColor: colors.primary.blue,
                  selectedDayTextColor: colors.text.white,
                  todayTextColor: colors.primary.blue,
                  dayTextColor: isDark ? colors.text.white : colors.text.primary,
                  textDisabledColor: isDark ? colors.text.tertiary : colors.text.tertiary,
                  dotColor: colors.primary.blue,
                  selectedDotColor: colors.text.white,
                  arrowColor: colors.primary.blue,
                  monthTextColor: isDark ? colors.text.white : colors.text.primary,
                  indicatorColor: colors.primary.blue,
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                }}
                style={styles.calendar}
              />

              <TouchableOpacity
                style={[styles.calendarButton, { backgroundColor: colors.primary.blue }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.calendarButtonText, { color: colors.text.white }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Upgrade Prompt Modal (for active trial) */}
      {isActive && !hasPurchased && (
        <UpgradePrompt
          visible={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          onPurchase={async () => {
            setShowUpgradePrompt(false);
            await checkTrialStatus();
          }}
          onRestore={async () => {
            setShowUpgradePrompt(false);
            await checkTrialStatus();
          }}
          isTrialExpired={hasExpired}
        />
      )}
    </>
  );
}

export default function ReadingsTab() {
  return (
    <ErrorBoundary>
      <ReadingsTabContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.status.error,
    textAlign: 'center',
  },
  calendarModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarClose: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  calendar: {
    marginBottom: 16,
    borderRadius: 12,
  },
  calendarButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
