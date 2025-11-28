import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, IconButton, TooltipIcon } from '@components/common';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants';
import { useAuthStore } from '@stores/useAuthStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useTrialStore } from '@stores/useTrialStore';
import { useTranslationStore } from '@stores/useTranslationStore';
import { useTheme } from '@/hooks/useTheme';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { TranslationService } from '@/services/translation/TranslationService';
import { CacheService } from '@services/cache';
import { StorageCleanupService } from '@/services/offline/StorageCleanupService';
import { OfflineSettingsSection } from '@/components/offline/OfflineSettingsSection';
import {
  useUpdateNotificationPreferences,
  useNotificationPreferences,
} from '@/stores/useNotificationStore';
import type { CacheStats } from '@services/cache';
import type { SupportedLanguage, VoiceType, PlaybackSpeed } from '@types/settings.types';

interface SettingsScreenProps {
  onBack?: () => void;
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onManageSubscription?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onHelpFAQ?: () => void;
  onLegalDocuments?: () => void;
  onBackupExport?: () => void;
  onComplianceAnalytics?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onEditProfile,
  onChangePassword,
  onManageSubscription,
  onLogout,
  onDeleteAccount,
  onHelpFAQ,
  onLegalDocuments,
  onBackupExport,
  onComplianceAnalytics,
}) => {
  const { user } = useAuthStore();
  const { hasPurchased, isActive, getFormattedTimeRemaining, remainingMinutes } = useTrialStore();
  const {
    settings,
    updateAudioSettings,
    updateTranslationSettings,
    updateNotificationSettings,
    updatePrivacySettings,
  } = useSettingsStore();
  const { isDark, toggleTheme, colors } = useTheme();
  const { storageStats } = useOfflineStore();

  // New translation store
  const {
    enabled: translationEnabled,
    preferredLanguage,
    setEnabled: setTranslationEnabled,
    setPreferredLanguage,
    loadSettings: loadTranslationSettings,
  } = useTranslationStore();

  const [clearingCache, setClearingCache] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showAccentSelector, setShowAccentSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(settings.translation.appLanguage || 'english-au');
  const [selectedAccent, setSelectedAccent] = useState<string>(settings.translation.accent || 'australian');
  const [offlineStorageStats, setOfflineStorageStats] = useState<any>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editedName, setEditedName] = useState(user?.displayName || user?.fullName || '');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRestoringPurchase, setIsRestoringPurchase] = useState(false);

  // Phase 10B Notification hooks
  const notificationPreferences = useNotificationPreferences();
  const updateNotificationPreferences = useUpdateNotificationPreferences();

  // Scroll view ref for auto-scrolling when selector expands
  const scrollViewRef = useRef<ScrollView>(null);
  const languageSelectorRef = useRef<View>(null);

  // Language and accent options
  const LANGUAGE_OPTIONS = [
    { code: 'english-au', name: 'Australian English', flag: '🇦🇺' },
    { code: 'english-uk', name: 'British English', flag: '🇬🇧' },
    { code: 'english-us', name: 'American English', flag: '🇺🇸' },
  ];

  const ACCENT_OPTIONS = [
    { code: 'australian', name: 'Australian Accent', flag: '🇦🇺' },
    { code: 'british', name: 'British Accent', flag: '🇬🇧' },
    { code: 'american', name: 'American Accent', flag: '🇺🇸' },
  ];

  // Refresh offline storage stats
  const refreshOfflineStorageStats = useCallback(async () => {
    try {
      const stats = await StorageCleanupService.getStorageStats();
      setOfflineStorageStats(stats);
      console.log('[Settings] Offline storage stats refreshed:', stats);
    } catch (error) {
      console.error('[Settings] Failed to refresh offline storage stats:', error);
    }
  }, []);

  // Load cache stats, translation settings, and offline stats on mount
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        // Load all settings with error handling
        await Promise.allSettled([
          loadCacheStats(),
          loadTranslationSettings(),
          refreshOfflineStorageStats(),
        ]);
        console.log('[Settings] All settings loaded successfully');
      } catch (error) {
        console.error('[Settings] Error initializing settings:', error);
        // Don't crash the screen - continue with defaults
      }
    };

    initializeSettings();
  }, []);

  // Refresh offline storage stats when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('[Settings] Screen focused, refreshing storage stats');
      refreshOfflineStorageStats();
    }, [refreshOfflineStorageStats])
  );

  const loadCacheStats = async () => {
    try {
      // Check if CacheService has getCacheStats method
      if (CacheService && typeof CacheService.getCacheStats === 'function') {
        const stats = await CacheService.getCacheStats();
        setCacheStats(stats);
      } else {
        console.warn('[Settings] CacheService.getCacheStats not available');
        setCacheStats(null);
      }
    } catch (error) {
      console.error('[Settings] Failed to load cache stats:', error);
      setCacheStats(null);
    }
  };

  // ============================================
  // ASYNC SWITCH HANDLERS (Fixed)
  // ============================================

  const handleDailyRemindersToggle = useCallback(async (value: boolean) => {
    console.log('[Settings] Toggling daily reminders:', value);
    try {
      if (value) {
        // Enabling daily reminders via Phase 10B notification system
        console.log('[Settings] 📱 Enabling daily reminders...');

        // Update notification preferences to enable daily reminders
        await updateNotificationPreferences(user?.uid || '', {
          ...notificationPreferences,
          dailyRemindersEnabled: true,
        });

        console.log('[Settings] ✅ Daily reminders enabled');
        Alert.alert('Success', 'Daily reminders enabled. You\'ll receive a notification at your scheduled time.');
      } else {
        // Disabling daily reminders via Phase 10B notification system
        console.log('[Settings] ⏹️ Disabling daily reminders...');

        // Update notification preferences to disable daily reminders
        await updateNotificationPreferences(user?.uid || '', {
          ...notificationPreferences,
          dailyRemindersEnabled: false,
        });

        console.log('[Settings] ✅ Daily reminders disabled');
        Alert.alert('Success', 'Daily reminders disabled.');
      }

      // Update the settings in store
      await updateNotificationSettings({ reminderEnabled: value });
      console.log('[Settings] ✅ Daily reminders updated:', value);
    } catch (error) {
      console.error('[Settings] ❌ Failed to update daily reminders:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  }, [updateNotificationPreferences, updateNotificationSettings, notificationPreferences, user?.uid]);

  const handleTranslationToggle = useCallback(async (value: boolean) => {
    console.log('[Settings] Toggling translation feature:', value);
    try {
      await setTranslationEnabled(value);
      console.log('[Settings] ✅ Translation feature updated:', value);
    } catch (error) {
      console.error('[Settings] ❌ Failed to update translation:', error);
      Alert.alert('Error', 'Failed to update translation settings');
    }
  }, [setTranslationEnabled]);

  const handleAnalyticsToggle = useCallback(async (value: boolean) => {
    console.log('[Settings] Toggling analytics:', value);
    try {
      await updatePrivacySettings({ analyticsEnabled: value });
      console.log('[Settings] ✅ Analytics updated:', value);
    } catch (error) {
      console.error('[Settings] ❌ Failed to update analytics:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  }, [updatePrivacySettings]);

  const handleCrashReportingToggle = useCallback(async (value: boolean) => {
    console.log('[Settings] Toggling crash reporting:', value);
    try {
      await updatePrivacySettings({ crashReportingEnabled: value });
      console.log('[Settings] ✅ Crash reporting updated:', value);
    } catch (error) {
      console.error('[Settings] ❌ Failed to update crash reporting:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  }, [updatePrivacySettings]);

  // Handle Clear Cache
  const handleClearCache = () => {
    const cacheSize = cacheStats ? CacheService.formatBytes(cacheStats.totalSize) : 'unknown';
    Alert.alert(
      'Clear All Cache',
      `This will clear ${cacheSize} of cached data including settings, readings, and audio files. Your account data will not be affected. Continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              if (CacheService && typeof CacheService.clearAllCache === 'function') {
                await CacheService.clearAllCache();
                await loadCacheStats(); // Reload stats
                Alert.alert('Success', 'Cache cleared successfully. The app will continue to work smoothly.');
              } else {
                Alert.alert(
                  'Not Available',
                  'Cache clearing is not available in this version. Your app will continue to work normally.',
                  [{ text: 'OK', style: 'default' }]
                );
              }
            } catch (error: any) {
              console.error('[Settings] Failed to clear cache:', error);
              // Provide user-friendly error message
              const errorMessage =
                error?.message?.includes('offline')
                  ? 'You appear to be offline. Please check your connection and try again.'
                  : 'Failed to clear cache. Please try again or contact support if the problem persists.';

              Alert.alert(
                'Clear Cache Failed',
                errorMessage,
                [
                  { text: 'Dismiss', style: 'cancel' },
                  { text: 'Retry', style: 'default', onPress: handleClearCache },
                  { text: 'Contact Support', style: 'default', onPress: () => {
                    Linking.openURL('mailto:ourenglish2019@gmail.com');
                  }},
                ]
              );
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  // Handle Edit Profile
  const handleOpenEditProfile = () => {
    setEditedName(user?.displayName || user?.fullName || '');
    setShowEditProfileModal(true);
  };

  const handleCloseEditProfile = () => {
    Keyboard.dismiss();
    setShowEditProfileModal(false);
  };

  const handleSaveProfile = useCallback(async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      // Update user profile via Firebase
      if (user?.id) {
        const auth = require('firebase/auth').getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          await require('firebase/auth').updateProfile(currentUser, {
            displayName: editedName,
          });
          // Update auth store
          console.log('[Settings] Profile updated successfully');
        }
      }
      Keyboard.dismiss();
      setShowEditProfileModal(false);
      Alert.alert('Success ✓', 'Profile updated successfully');
    } catch (error: any) {
      console.error('[Settings] Failed to update profile:', error);

      let errorMessage = 'Failed to update profile. ';

      if (error.message?.includes('offline') || error.message?.includes('network')) {
        errorMessage = 'You appear to be offline. Please check your internet connection and try again.';
      } else if (error.message?.includes('auth')) {
        errorMessage = 'There was an authentication issue. Please try logging out and back in.';
      } else {
        errorMessage += 'Please try again. If the problem persists, contact support.';
      }

      Alert.alert(
        'Profile Update Failed',
        errorMessage,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'Try Again', style: 'default', onPress: handleOpenEditProfile },
          { text: 'Contact Support', style: 'default', onPress: () => {
            Linking.openURL('mailto:ourenglish2019@gmail.com?subject=Profile%20Update%20Help');
          }},
        ]
      );
    }
  }, [editedName, user?.id]);

  // Handle Change Password
  const handleOpenChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePasswordModal(true);
  };

  const handleCloseChangePassword = () => {
    Keyboard.dismiss();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePasswordModal(false);
  };

  const handleSavePassword = useCallback(async () => {
    // Validation
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Current password is required');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Error', 'New password is required');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    try {
      const auth = require('firebase/auth').getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser || !user?.email) {
        throw new Error('User not authenticated');
      }

      // Re-authenticate with current password
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = require('firebase/auth');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      console.log('[Settings] Password updated successfully');

      Keyboard.dismiss();
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('Success ✓', 'Password changed successfully');
    } catch (error: any) {
      console.error('[Settings] Failed to change password:', error);

      let errorMessage = 'Failed to change password. ';

      if (error.code === 'auth/wrong-password' || error.message?.includes('password')) {
        errorMessage = 'The current password you entered is incorrect. Please try again.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
      } else if (error.message?.includes('offline') || error.message?.includes('network')) {
        errorMessage = 'You appear to be offline. Please check your internet connection and try again.';
      } else {
        errorMessage += 'Please try again. If the problem persists, contact support.';
      }

      Alert.alert(
        'Password Change Failed',
        errorMessage,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'Try Again', style: 'default', onPress: handleOpenChangePassword },
          { text: 'Contact Support', style: 'default', onPress: () => {
            Linking.openURL('mailto:ourenglish2019@gmail.com?subject=Password%20Change%20Help');
          }},
        ]
      );
    } finally {
      setIsChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword, user?.email]);

  // Handle Rate App
  const handleRateApp = useCallback(async () => {
    try {
      let appStoreUrl: string;

      if (Platform.OS === 'ios') {
        // iOS App Store URL - replace with your actual app ID
        appStoreUrl = 'https://apps.apple.com/app/readingdaily-scripture/id6670556968';
      } else {
        // Google Play Store URL - replace with your actual package name
        appStoreUrl = 'https://play.google.com/store/apps/details?id=com.louispage.readingdailyscripture';
      }

      const canOpen = await Linking.canOpenURL(appStoreUrl);
      if (canOpen) {
        await Linking.openURL(appStoreUrl);
        console.log('[Settings] Opening app store');
      } else {
        Alert.alert('Error', 'Could not open app store. Please try again.');
      }
    } catch (error) {
      console.error('[Settings] Failed to open app store:', error);
      Alert.alert('Error', 'Could not open app store. Please try again.');
    }
  }, []);

  // Handle Restore Purchase
  const handleRestorePurchase = useCallback(async () => {
    const { restorePurchase } = useTrialStore.getState();
    setIsRestoringPurchase(true);
    try {
      console.log('[Settings] Restoring purchases...');
      const restored = await restorePurchase();

      if (restored) {
        Alert.alert(
          'Success! ✓',
          'Your previous purchase has been restored. You now have lifetime access.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found on this device.\n\n• Make sure you\'re using the same Apple ID or Google account as your purchase\n• If you purchased on a different device, sign in with that account\n• For help, contact support.',
          [
            { text: 'Dismiss', style: 'cancel' },
            { text: 'Contact Support', style: 'default', onPress: () => {
              Linking.openURL('mailto:ourenglish2019@gmail.com?subject=Purchase%20Restore%20Help');
            }},
          ]
        );
      }
    } catch (error: any) {
      console.error('[Settings] Failed to restore purchases:', error);

      // Determine error type for user-friendly messaging
      const isNetworkError = error?.message?.includes('network') ||
                           error?.message?.includes('offline') ||
                           error?.code === 'NETWORK_ERROR';
      const isAuthError = error?.message?.includes('auth') ||
                         error?.message?.includes('credential');

      let errorTitle = 'Restore Failed';
      let errorMessage = 'Could not restore purchases. ';

      if (isNetworkError) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (isAuthError) {
        errorMessage += 'There was an authentication issue. Please ensure you\'re signed in with the correct Apple ID or Google account.';
      } else {
        errorMessage += 'Please try again. If the problem persists, contact support.';
      }

      Alert.alert(
        errorTitle,
        errorMessage,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'Retry', style: 'default', onPress: handleRestorePurchase },
          { text: 'Contact Support', style: 'default', onPress: () => {
            Linking.openURL('mailto:ourenglish2019@gmail.com?subject=Purchase%20Restore%20Failed');
          }},
        ]
      );
    } finally {
      setIsRestoringPurchase(false);
    }
  }, []);

  // Handle Language Change
  const handleLanguageChange = (language: SupportedLanguage) => {
    updateTranslationSettings({ language });
  };

  // Handle Language & Accent Selection
  const handleLanguageSelect = useCallback(async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    try {
      await updateAudioSettings({ appLanguage: languageCode });
      console.log('[Settings] ✅ Language updated:', languageCode);
    } catch (error) {
      console.error('[Settings] ❌ Failed to update language:', error);
      Alert.alert('Error', 'Failed to update language setting');
    }
  }, [updateAudioSettings]);

  const handleAccentSelect = useCallback(async (accentCode: string) => {
    setSelectedAccent(accentCode);
    try {
      await updateAudioSettings({ accent: accentCode });
      console.log('[Settings] ✅ Accent updated:', accentCode);
    } catch (error) {
      console.error('[Settings] ❌ Failed to update accent:', error);
      Alert.alert('Error', 'Failed to update accent setting');
    }
  }, [updateAudioSettings]);

  // Get subscription status text
  const getSubscriptionStatus = () => {
    if (hasPurchased) {
      return 'Lifetime Access Active';
    }
    if (isActive) {
      return `Free Trial Active`;
    }
    return 'Trial Not Started';
  };

  const getSubscriptionDetail = () => {
    if (hasPurchased) {
      return '$5 • Lifetime';
    }
    if (isActive) {
      return `${remainingMinutes} min remaining`;
    }
    return 'Start your 7-day free trial';
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: colors.background.primary,
    },
    card: {
      ...styles.card,
      backgroundColor: colors.background.card,
    },
    profileCard: {
      ...styles.profileCard,
      backgroundColor: colors.background.card,
    },
    sectionTitle: {
      ...styles.sectionTitle,
      color: colors.text.white,
    },
    profileName: {
      ...styles.profileName,
      color: colors.text.primary,
    },
    profileEmail: {
      ...styles.profileEmail,
      color: colors.text.secondary,
    },
    settingLabel: {
      ...styles.settingLabel,
      color: colors.text.primary,
    },
    settingValue: {
      ...styles.settingValue,
      color: colors.text.secondary,
    },
    divider: {
      ...styles.divider,
      backgroundColor: colors.ui.divider,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <LinearGradient
        colors={colors.primary.gradient}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <IconButton
              icon="chevron-back"
              onPress={onBack}
              variant="default"
              size="md"
              color={colors.text.white}
            />
          )}
          <Text style={[styles.headerTitle, { color: colors.text.white }]}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <View style={styles.section}>
            <View style={dynamicStyles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={dynamicStyles.profileName}>
                  {user?.fullName || 'User'}
                </Text>
                <Text style={dynamicStyles.profileEmail}>{user?.email || ''}</Text>
                <View style={styles.subscriptionBadge}>
                  <Text style={styles.subscriptionText}>
                    {getSubscriptionStatus()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Appearance</Text>
            <View style={dynamicStyles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="moon-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={dynamicStyles.settingLabel}>Dark Mode</Text>
                  </View>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{
                    false: colors.text.tertiary,
                    true: colors.primary.purple,
                  }}
                  thumbColor={isDark ? colors.text.white : colors.background.primary}
                />
              </View>
            </View>
          </View>

          {/* Billing Section */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Billing</Text>
            <View style={dynamicStyles.card}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={onManageSubscription}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="card-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={dynamicStyles.settingLabel}>Subscription</Text>
                    <Text style={dynamicStyles.settingValue}>
                      {getSubscriptionDetail()}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <View style={dynamicStyles.divider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleRestorePurchase}
                disabled={isRestoringPurchase}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="refresh-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={dynamicStyles.settingLabel}>Restore Purchase</Text>
                    <Text style={dynamicStyles.settingValue}>
                      {isRestoringPurchase ? 'Restoring...' : 'Recover previous purchases'}
                    </Text>
                  </View>
                </View>
                {isRestoringPurchase ? (
                  <ActivityIndicator size="small" color={colors.primary.blue} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text.tertiary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Learning Preferences */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Learning Preferences</Text>
            <View style={dynamicStyles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={dynamicStyles.settingLabel}>Daily Reminders</Text>
                    <Text style={dynamicStyles.settingValue}>
                      Get notified for daily readings
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.notifications.reminderEnabled}
                  onValueChange={handleDailyRemindersToggle}
                  trackColor={{
                    false: colors.text.tertiary,
                    true: colors.primary.blue,
                  }}
                  thumbColor={colors.text.white}
                />
              </View>
            </View>
          </View>

          {/* Audio & Translation - Redesigned to match screenshot */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Audio & Translation</Text>

            {/* Summary row - showing current config */}
            <Text style={styles.sectionSubtitle}>
              Speed: {settings.audio.speed}x • Voice: {settings.audio.voice === 'male' ? 'Male' : settings.audio.voice === 'female' ? 'Female' : 'Auto'} • Tap-to-translate: {settings.translation.tapToTranslate ? 'On' : 'Off'}
            </Text>

            <View style={dynamicStyles.card}>
              {/* Speaking speed with +/- buttons */}
              <View style={styles.settingColumn}>
                <Text style={dynamicStyles.settingLabel}>Speaking speed</Text>
                <View style={styles.speedSliderRow}>
                  <TouchableOpacity
                    style={styles.speedAdjustButton}
                    onPress={() => {
                      const speeds: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5];
                      const currentIndex = speeds.indexOf(settings.audio.speed);
                      if (currentIndex > 0) {
                        updateAudioSettings({ speed: speeds[currentIndex - 1] });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.speedAdjustText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.speedDisplay}>
                    <Text style={styles.speedDisplayText}>{settings.audio.speed}x</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.speedAdjustButton}
                    onPress={() => {
                      const speeds: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5];
                      const currentIndex = speeds.indexOf(settings.audio.speed);
                      if (currentIndex < speeds.length - 1) {
                        updateAudioSettings({ speed: speeds[currentIndex + 1] });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.speedAdjustText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={dynamicStyles.divider} />

              {/* Voice selection with Auto/Male/Female pills */}
              <View style={styles.settingColumn}>
                <Text style={dynamicStyles.settingLabel}>Voice</Text>
                <View style={styles.pillRow}>
                  <TouchableOpacity
                    style={[
                      styles.pill,
                      settings.audio.voice === 'auto' && styles.pillActive,
                    ]}
                    onPress={() => updateAudioSettings({ voice: 'auto' as VoiceType })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        settings.audio.voice === 'auto' && styles.pillTextActive,
                      ]}
                    >
                      Auto
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pill,
                      settings.audio.voice === 'male' && styles.pillActive,
                    ]}
                    onPress={() => updateAudioSettings({ voice: 'male' })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        settings.audio.voice === 'male' && styles.pillTextActive,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pill,
                      settings.audio.voice === 'female' && styles.pillActive,
                    ]}
                    onPress={() => updateAudioSettings({ voice: 'female' })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        settings.audio.voice === 'female' && styles.pillTextActive,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={dynamicStyles.divider} />

              {/* Translation Feature Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="language-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={dynamicStyles.settingLabel}>Translation Feature</Text>
                    <Text style={dynamicStyles.settingValue}>
                      Tap words to translate
                    </Text>
                  </View>
                </View>
                <Switch
                  value={translationEnabled}
                  onValueChange={handleTranslationToggle}
                  trackColor={{
                    false: colors.text.tertiary,
                    true: colors.primary.blue,
                  }}
                  thumbColor={colors.text.white}
                />
              </View>

              <View style={dynamicStyles.divider} />

              {/* Word Highlighting During Audio Playback Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="sparkles-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <View style={styles.settingTextContainer}>
                    <View style={styles.labelRow}>
                      <Text style={dynamicStyles.settingLabel}>Word Highlighting</Text>
                      <TooltipIcon
                        title="Word Highlighting"
                        description="Words will highlight as the audio plays. This helps you follow along and improves your reading speed."
                        size={14}
                        color={colors.primary.blue}
                      />
                    </View>
                    <Text style={dynamicStyles.settingValue}>
                      Highlight words during audio playback
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.audio.enableAudioHighlighting}
                  onValueChange={(value) => updateAudioSettings({ enableAudioHighlighting: value })}
                  trackColor={{
                    false: colors.text.tertiary,
                    true: colors.primary.blue,
                  }}
                  thumbColor={colors.text.white}
                />
              </View>

              <View style={dynamicStyles.divider} />

              {/* Preferred Translation Language Selector */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setShowLanguageSelector(!showLanguageSelector)}
                activeOpacity={0.7}
                disabled={!translationEnabled}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="globe-outline"
                    size={22}
                    color={translationEnabled ? colors.primary.blue : colors.ui.disabled}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={[dynamicStyles.settingLabel, !translationEnabled && { color: colors.ui.disabled }]}>
                      Preferred Translation Language
                    </Text>
                    <Text style={[dynamicStyles.settingValue, !translationEnabled && { color: colors.ui.disabled }]}>
                      {TranslationService.SUPPORTED_LANGUAGES.find(l => l.code === preferredLanguage)?.name || 'Spanish'}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={showLanguageSelector ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={translationEnabled ? colors.text.tertiary : colors.ui.disabled}
                />
              </TouchableOpacity>

              {/* Language List - Scrollable */}
              {showLanguageSelector && translationEnabled && (
                <ScrollView style={styles.languageListContainer} showsVerticalScrollIndicator={true}>
                  {TranslationService.SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'en').map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageListItem,
                        preferredLanguage === lang.code && { backgroundColor: colors.primary.blue + '20' }
                      ]}
                      onPress={async () => {
                        console.log('[Settings] Setting preferred language to:', lang.code);
                        await setPreferredLanguage(lang.code);
                        setShowLanguageSelector(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.languageListItemContent}>
                        <Text style={[dynamicStyles.settingLabel, { marginLeft: 0 }]}>
                          {lang.nativeName}
                        </Text>
                        <Text style={dynamicStyles.settingValue}>
                          {lang.name}
                        </Text>
                      </View>
                      {preferredLanguage === lang.code && (
                        <Ionicons name="checkmark" size={20} color={colors.primary.blue} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={dynamicStyles.divider} />

              {/* Language & Accent */}
              <View>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => {
                    const newShowState = !showLanguageSelector;
                    setShowLanguageSelector(newShowState);
                    setShowAccentSelector(false);
                    // Auto-scroll to selector when expanding
                    if (newShowState) {
                      setTimeout(() => {
                        languageSelectorRef.current?.measureLayout(
                          scrollViewRef.current as any,
                          (x, y) => {
                            scrollViewRef.current?.scrollTo({ y: y - 50, animated: true });
                          },
                          () => {
                            // Fallback: scroll to end if measureLayout fails
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }
                        );
                      }, 100);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons
                      name="globe-outline"
                      size={22}
                      color={colors.primary.blue}
                    />
                    <View style={styles.settingTextContainer}>
                      <Text style={dynamicStyles.settingLabel}>Pronunciation Language & Accent</Text>
                      <Text style={dynamicStyles.settingValue}>
                        {LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage)?.name} • {ACCENT_OPTIONS.find(a => a.code === selectedAccent)?.name}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={showLanguageSelector ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>

                {/* Language Selector */}
                {showLanguageSelector && (
                  <View ref={languageSelectorRef} style={[styles.selectorContainer, { backgroundColor: colors.background.card }]}>
                    <Text style={[styles.selectorTitle, { color: colors.text.primary }]}>Select Language</Text>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        style={[
                          styles.selectorOption,
                          selectedLanguage === lang.code && { backgroundColor: colors.primary.blue + '20' }
                        ]}
                        onPress={() => handleLanguageSelect(lang.code)}
                      >
                        <Text style={[styles.flagEmoji]}>{lang.flag}</Text>
                        <Text style={[styles.optionText, { color: colors.text.primary }]}>
                          {lang.name}
                        </Text>
                        {selectedLanguage === lang.code && (
                          <Ionicons name="checkmark" size={20} color={colors.primary.blue} />
                        )}
                      </TouchableOpacity>
                    ))}

                    <View style={[styles.selectorDivider, { backgroundColor: colors.background.secondary }]} />

                    <Text style={[styles.selectorTitle, { color: colors.text.primary }]}>Select Accent</Text>
                    {ACCENT_OPTIONS.map((accent) => (
                      <TouchableOpacity
                        key={accent.code}
                        style={[
                          styles.selectorOption,
                          selectedAccent === accent.code && { backgroundColor: colors.primary.blue + '20' }
                        ]}
                        onPress={() => handleAccentSelect(accent.code)}
                      >
                        <Text style={[styles.flagEmoji]}>{accent.flag}</Text>
                        <Text style={[styles.optionText, { color: colors.text.primary }]}>
                          {accent.name}
                        </Text>
                        {selectedAccent === accent.code && (
                          <Ionicons name="checkmark" size={20} color={colors.primary.blue} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Offline Settings Section */}
          <OfflineSettingsSection
            onStorageRefresh={refreshOfflineStorageStats}
            isDark={isDark}
            colors={colors}
          />

          {/* Account Settings */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Account</Text>
            <View style={dynamicStyles.card}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleOpenEditProfile}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <Text style={dynamicStyles.settingLabel}>Edit Profile</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <View style={dynamicStyles.divider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleOpenChangePassword}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <Text style={dynamicStyles.settingLabel}>Change Password</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Privacy</Text>
            <View style={dynamicStyles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="analytics-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <Text style={dynamicStyles.settingLabel}>Analytics</Text>
                </View>
                <Switch
                  value={settings.privacy.analyticsEnabled}
                  onValueChange={handleAnalyticsToggle}
                  trackColor={{
                    false: colors.text.tertiary,
                    true: colors.primary.blue,
                  }}
                  thumbColor={colors.text.white}
                />
              </View>

              <View style={dynamicStyles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="bug-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <Text style={dynamicStyles.settingLabel}>Crash Reporting</Text>
                </View>
                <Switch
                  value={settings.privacy.crashReportingEnabled}
                  onValueChange={handleCrashReportingToggle}
                  trackColor={{
                    false: colors.text.tertiary,
                    true: colors.primary.blue,
                  }}
                  thumbColor={colors.text.white}
                />
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>
              Danger Zone
            </Text>
            <View style={[styles.card, styles.dangerCard]}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleClearCache}
                disabled={clearingCache}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={colors.status.error}
                  />
                  <Text style={[dynamicStyles.settingLabel, styles.dangerText]}>
                    Clear All Cache
                  </Text>
                </View>
                {clearingCache ? (
                  <Text style={styles.clearingText}>Clearing...</Text>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text.tertiary}
                  />
                )}
              </TouchableOpacity>

              <View style={dynamicStyles.divider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={onLogout}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={colors.status.error}
                  />
                  <Text style={[dynamicStyles.settingLabel, styles.dangerText]}>
                    Log Out
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <View style={dynamicStyles.divider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={onDeleteAccount}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="close-circle-outline"
                    size={22}
                    color={colors.status.error}
                  />
                  <Text style={[dynamicStyles.settingLabel, styles.dangerText]}>
                    Delete Account
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal & Compliance - Now with in-app documents */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Legal & Compliance</Text>
            <View style={dynamicStyles.card}>
              {/* View All Legal Documents */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={onLegalDocuments}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="document-text"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={dynamicStyles.settingLabel}>All Legal Documents</Text>
                    <Text style={dynamicStyles.settingValue}>
                      View in-app • Always updated
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <View style={dynamicStyles.divider} />

              {/* Privacy Policy */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={onLegalDocuments}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <Text style={dynamicStyles.settingLabel}>Privacy Policy</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <View style={dynamicStyles.divider} />

              {/* Terms of Service */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={onLegalDocuments}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <Text style={dynamicStyles.settingLabel}>Terms of Service</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <View style={dynamicStyles.divider} />

              {/* Contact Support */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => {
                  Linking.openURL('mailto:ourenglish2019@gmail.com?subject=Support%20Request').catch(err =>
                    Alert.alert('Error', 'Could not open email. Please contact ourenglish2019@gmail.com')
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <Text style={dynamicStyles.settingLabel}>Contact Support</Text>
                </View>
                <Ionicons
                  name="open-outline"
                  size={18}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <View style={dynamicStyles.divider} />

              {/* Backup & Export */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={onBackupExport}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={dynamicStyles.settingLabel}>Backup & Export</Text>
                    <Text style={dynamicStyles.settingValue}>
                      Manage backups • Auto-sync
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
              <View style={dynamicStyles.divider} />

              {/* Compliance & Analytics */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={onComplianceAnalytics}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={dynamicStyles.settingLabel}>Compliance & Analytics</Text>
                    <Text style={dynamicStyles.settingValue}>
                      View status • Generate reports
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Support</Text>
            <View style={dynamicStyles.card}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={onHelpFAQ}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="help-circle-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <Text style={dynamicStyles.settingLabel}>Help & FAQ</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <View style={dynamicStyles.divider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleRateApp}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="star-outline"
                    size={22}
                    color={colors.primary.blue}
                  />
                  <Text style={dynamicStyles.settingLabel}>Rate the App</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* App Version & Footer */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {settings.version}</Text>
            <Text style={styles.footerText}>Catholic ESL Learning</Text>
            <Text style={styles.footerText}>
              developed by www.ourengltd.best
            </Text>
          </View>
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditProfileModal}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseEditProfile}
        >
          <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <LinearGradient
              colors={colors.primary.gradient}
              style={styles.gradient}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={handleCloseEditProfile}
                  activeOpacity={0.7}
                  style={[styles.modalHeaderIconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                >
                  <Ionicons name="close" size={20} color={colors.text.white} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text.white }]}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  activeOpacity={0.7}
                  style={[styles.modalHeaderIconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                >
                  <Ionicons name="checkmark" size={20} color={colors.text.white} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={styles.modalContentContainer}
              >
                <View style={styles.modalCard}>
                  <Text style={[styles.modalLabel, { color: colors.text.primary }]}>
                    Display Name
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.ui.divider,
                      },
                    ]}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.text.tertiary}
                    value={editedName}
                    onChangeText={setEditedName}
                    maxLength={50}
                  />
                  <Text style={[styles.modalHelperText, { color: colors.text.secondary }]}>
                    {editedName.length}/50
                  </Text>

                  <Text style={[styles.modalLabel, { color: colors.text.primary, marginTop: Spacing.lg }]}>
                    Email
                  </Text>
                  <View
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.background.secondary,
                        borderColor: colors.ui.divider,
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text style={{ color: colors.text.secondary }}>
                      {user?.email || 'Not available'}
                    </Text>
                  </View>
                  <Text style={[styles.modalHelperText, { color: colors.text.secondary }]}>
                    Email cannot be changed here. Contact support for email changes.
                  </Text>
                </View>
              </ScrollView>
            </LinearGradient>
          </SafeAreaView>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={showChangePasswordModal}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseChangePassword}
        >
          <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <LinearGradient
              colors={colors.primary.gradient}
              style={styles.gradient}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={handleCloseChangePassword}
                  activeOpacity={0.7}
                  style={[styles.modalHeaderIconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                >
                  <Ionicons name="close" size={20} color={colors.text.white} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text.white }]}>Change Password</Text>
                <TouchableOpacity
                  onPress={handleSavePassword}
                  disabled={isChangingPassword}
                  activeOpacity={0.7}
                  style={[styles.modalHeaderIconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                >
                  <Ionicons name="checkmark" size={20} color={colors.text.white} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={styles.modalContentContainer}
              >
                <View style={styles.modalCard}>
                  <Text style={[styles.modalLabel, { color: colors.text.primary }]}>
                    Current Password
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.ui.divider,
                      },
                    ]}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.text.tertiary}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={true}
                    editable={!isChangingPassword}
                  />

                  <Text style={[styles.modalLabel, { color: colors.text.primary, marginTop: Spacing.lg }]}>
                    New Password
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.ui.divider,
                      },
                    ]}
                    placeholder="Enter new password (min. 6 characters)"
                    placeholderTextColor={colors.text.tertiary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={true}
                    editable={!isChangingPassword}
                  />

                  <Text style={[styles.modalLabel, { color: colors.text.primary, marginTop: Spacing.lg }]}>
                    Confirm Password
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.ui.divider,
                      },
                    ]}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.text.tertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                    editable={!isChangingPassword}
                  />

                  <Text style={[styles.modalHelperText, { color: colors.text.secondary, marginTop: Spacing.lg }]}>
                    Password must be at least 6 characters long
                  </Text>
                </View>
              </ScrollView>
            </LinearGradient>
          </SafeAreaView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.displaySmall,
    color: Colors.text.white,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.text.white,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  profileCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  profileAvatarText: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  profileEmail: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  subscriptionBadge: {
    backgroundColor: Colors.accent.green,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  subscriptionText: {
    ...Typography.caption,
    color: Colors.text.white,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingValue: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.ui.divider,
    marginVertical: Spacing.xs,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm - 2,
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary.blue,
  },
  segmentButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  segmentButtonTextActive: {
    color: Colors.text.white,
    fontWeight: '600',
  },
  speedControls: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  speedButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.secondary,
    minWidth: 42,
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: Colors.primary.blue,
  },
  speedButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  speedButtonTextActive: {
    color: Colors.text.white,
    fontWeight: '600',
  },
  dangerTitle: {
    color: Colors.status.error,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: Colors.status.error + '30',
  },
  dangerText: {
    color: Colors.status.error,
  },
  clearingText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  versionText: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.6,
  },
  // New styles for redesigned UI matching screenshots
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.8,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  settingColumn: {
    paddingVertical: Spacing.sm,
  },
  speedSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  speedAdjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedAdjustText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  speedDisplay: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  speedDisplayText: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  pillActive: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.blue,
  },
  pillText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  pillTextActive: {
    color: Colors.text.white,
    fontWeight: '600',
  },
  helperText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  languageListContainer: {
    marginTop: Spacing.sm,
    maxHeight: 300,
  },
  languageListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs / 2,
  },
  languageListItemContent: {
    flex: 1,
  },
  selectorContainer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.card,
  },
  selectorTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
    width: 30,
  },
  optionText: {
    ...Typography.body,
    flex: 1,
    fontWeight: '500',
  },
  selectorDivider: {
    height: 1,
    backgroundColor: Colors.background.secondary,
    marginVertical: Spacing.md,
  },
  // Modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  modalHeaderButton: {
    ...Typography.body,
    fontWeight: '600',
  },
  modalHeaderIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text.white,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  modalLabel: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: 48,
  },
  modalHelperText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
});
