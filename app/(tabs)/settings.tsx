import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/screens/settings';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { ProgressDashboard } from '@/screens/progress/ProgressDashboard';
import { EmptyState } from '@/components/common';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsTab() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { colors } = useTheme();
  const [showProgress, setShowProgress] = useState(false);

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen in future phase
    Alert.alert('Edit Profile', 'This feature will be available in a future update.');
  };

  const handleChangePassword = () => {
    // TODO: Navigate to change password screen in future phase
    Alert.alert('Change Password', 'This feature will be available in a future update.');
  };

  const handleManageSubscription = () => {
    router.push('/(tabs)/subscription');
  };

  const handleHelpFAQ = () => {
    router.push('/(tabs)/help');
  };

  const handleLegalDocuments = () => {
    router.push('/(tabs)/legal-documents');
  };

  const handleBackupExport = () => {
    router.push('/(tabs)/backup-export');
  };

  const handleComplianceAnalytics = () => {
    router.push('/(tabs)/compliance-analytics');
  };

  const handleViewTutorial = () => {
    router.push('/onboarding');
  };

  const handleViewProgress = () => {
    setShowProgress(true);
  };

  const handleNotifications = () => {
    router.push('/(tabs)/notifications');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/landing');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion in future phase
            await logout();
            router.replace('/(auth)/landing');
          },
        },
      ]
    );
  };

  return (
    <>
      <SettingsScreen
        onEditProfile={handleEditProfile}
        onChangePassword={handleChangePassword}
        onManageSubscription={handleManageSubscription}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        onHelpFAQ={handleHelpFAQ}
        onLegalDocuments={handleLegalDocuments}
        onBackupExport={handleBackupExport}
        onComplianceAnalytics={handleComplianceAnalytics}
        onViewTutorial={handleViewTutorial}
        onViewProgress={handleViewProgress}
        onNotifications={handleNotifications}
      />

      <Modal
        visible={showProgress}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProgress(false)}
      >
        <SafeAreaView style={[modalStyles.container, { backgroundColor: colors.background.primary }]}>
          <TouchableOpacity
            style={modalStyles.closeButton}
            onPress={() => setShowProgress(false)}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          {user?.id ? (
            <ProgressDashboard userId={user.id} />
          ) : (
            <EmptyState
              icon="stats-chart-outline"
              title="Sign In to Track Progress"
              message="Create an account or sign in to track your reading streaks, earn badges, and view your reading calendar."
              tips={[
                '📊 Track your daily reading streaks',
                '🏆 Earn badges for milestones',
                '📅 View your reading history calendar',
                '🎯 Monitor your reading consistency',
              ]}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 16,
  },
});
