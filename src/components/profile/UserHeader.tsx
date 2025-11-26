/**
 * User Header Component
 * Phase 10C.5: Profile Header
 *
 * Displays:
 * - User avatar
 * - Display name
 * - Email
 * - Subscription tier
 * - Member since date
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { UserProfile } from '@/types/subscription.types';

interface UserHeaderProps {
  profile: UserProfile;
}

const UserHeader: React.FC<UserHeaderProps> = ({ profile }) => {
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : 'Recently';

  const tierLabel = profile.currentTier === 'basic' ? 'Premium' : 'Free';
  const tierColor = profile.currentTier === 'basic' ? '#FFD700' : '#999';

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{profile.displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* User Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.email}>{profile.email}</Text>

        {/* Subscription Badge */}
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { borderColor: tierColor }]}>
            <Text style={[styles.badgeText, { color: tierColor }]}>{tierLabel}</Text>
          </View>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberSince: {
    fontSize: 12,
    color: '#999',
  },
});

export default UserHeader;
