import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/screens/settings';
import { useAuthStore } from '@/stores/useAuthStore';

export default function SettingsTab() {
  const router = useRouter();
  const { logout } = useAuthStore();

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
    />
  );
}
