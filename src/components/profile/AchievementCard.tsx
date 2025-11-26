/**
 * Achievement Card Component
 * Phase 10C.5: Achievement Display
 *
 * Displays:
 * - Achievement icon
 * - Achievement name
 * - Rarity badge
 * - Lock status
 * - Points
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Achievement } from '@/types/subscription.types';
import { achievementService } from '@/services/achievements/AchievementService';

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: () => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onPress }) => {
  const isUnlocked = achievement.unlockedAt !== undefined;
  const rarityColor = achievementService.getRarityColor(achievement.rarity);
  const rarityBgColor = achievementService.getRarityBackgroundColor(achievement.rarity);
  const rarityLabel = achievementService.getRarityLabel(achievement.rarity);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isUnlocked ? rarityBgColor : '#E8E8E8',
          opacity: isUnlocked ? 1 : 0.6,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Lock Badge */}
      {!isUnlocked && <Text style={styles.lockBadge}>🔒</Text>}

      {/* Icon */}
      <Text style={styles.icon}>{achievement.icon}</Text>

      {/* Name */}
      <Text
        style={styles.name}
        numberOfLines={2}
      >
        {isUnlocked ? achievement.name : '???'}
      </Text>

      {/* Rarity Badge */}
      <View
        style={[
          styles.rarityBadge,
          {
            backgroundColor: rarityColor,
          },
        ]}
      >
        <Text style={styles.rarityText}>{rarityLabel}</Text>
      </View>

      {/* Points */}
      {isUnlocked && (
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{achievement.points}pt</Text>
        </View>
      )}

      {/* Unlock Date */}
      {isUnlocked && achievement.unlockedAt && (
        <Text style={styles.unlockDate}>
          {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 16,
  },
  icon: {
    fontSize: 40,
    marginVertical: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    minHeight: 32,
  },
  rarityBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  pointsContainer: {
    marginTop: 4,
  },
  pointsValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  unlockDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});

export default AchievementCard;
