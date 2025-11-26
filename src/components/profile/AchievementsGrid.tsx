/**
 * Achievements Grid Component
 * Phase 10C.5: Achievement Gallery
 *
 * Displays:
 * - Grid of achievements
 * - Mixed locked/unlocked
 * - Rarity-based colors
 * - Progress information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Achievement } from '@/types/subscription.types';
import AchievementCard from './AchievementCard';

interface AchievementsGridProps {
  achievements: Achievement[];
}

interface SelectedAchievement {
  achievement: Achievement;
  index: number;
}

const AchievementsGrid: React.FC<AchievementsGridProps> = ({ achievements }) => {
  const [selectedAchievement, setSelectedAchievement] = useState<SelectedAchievement | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 40) / 3;

  const unlockedCount = achievements.filter((a) => a.unlockedAt !== undefined).length;
  const totalPoints = achievements
    .filter((a) => a.unlockedAt !== undefined)
    .reduce((sum, a) => sum + a.points, 0);

  const handleAchievementPress = (achievement: Achievement, index: number) => {
    setSelectedAchievement({ achievement, index });
  };

  const handleModalClose = () => {
    setSelectedAchievement(null);
  };

  return (
    <View style={styles.container}>
      {/* Stats Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Unlocked</Text>
          <Text style={styles.summaryValue}>
            {unlockedCount}/{achievements.length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Points</Text>
          <Text style={styles.summaryValue}>{totalPoints}</Text>
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={achievements}
        keyExtractor={(_, index) => index.toString()}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => (
          <View style={{ width: itemWidth }}>
            <AchievementCard
              achievement={item}
              onPress={() => handleAchievementPress(item, index)}
            />
          </View>
        )}
      />

      {/* Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement.achievement}
          visible={true}
          onClose={handleModalClose}
        />
      )}
    </View>
  );
};

/**
 * Achievement Detail Modal
 */
interface AchievementDetailModalProps {
  achievement: Achievement;
  visible: boolean;
  onClose: () => void;
}

const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  achievement,
  visible,
  onClose,
}) => {
  const isUnlocked = achievement.unlockedAt !== undefined;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          {/* Icon */}
          <Text style={styles.modalIcon}>{achievement.icon}</Text>

          {/* Title */}
          <Text style={styles.modalTitle}>{achievement.name}</Text>

          {/* Description */}
          <Text style={styles.modalDescription}>{achievement.description}</Text>

          {/* Requirement */}
          <View style={styles.requirementSection}>
            <Text style={styles.requirementLabel}>Requirement</Text>
            <Text style={styles.requirementValue}>
              {achievement.requirement.type === 'count' && `Complete ${achievement.requirement.value} sessions`}
              {achievement.requirement.type === 'streak' && `${achievement.requirement.value} day streak`}
              {achievement.requirement.type === 'score' && `Score ${achievement.requirement.value}%`}
            </Text>
          </View>

          {/* Status */}
          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[styles.statusValue, { color: isUnlocked ? '#34C759' : '#999' }]}>
              {isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
            </Text>
          </View>

          {/* Points */}
          <View style={styles.pointsSection}>
            <Text style={styles.pointsLabel}>Reward</Text>
            <Text style={styles.pointsValue}>{achievement.points} points</Text>
          </View>

          {/* Unlock Date */}
          {isUnlocked && achievement.unlockedAt && (
            <View style={styles.unlockDateSection}>
              <Text style={styles.unlockDateLabel}>Unlocked</Text>
              <Text style={styles.unlockDateValue}>
                {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}

          {/* Progress */}
          {!isUnlocked && achievement.progress !== undefined && (
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Progress</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((achievement.progress / achievement.requirement.value) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress} / {achievement.requirement.value}
              </Text>
            </View>
          )}

          {/* Close Modal Button */}
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  row: {
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 24,
    color: '#999',
  },
  modalIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  requirementSection: {
    marginBottom: 16,
  },
  requirementLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  requirementValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  statusSection: {
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  pointsSection: {
    marginBottom: 16,
  },
  pointsLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  unlockDateSection: {
    marginBottom: 16,
  },
  unlockDateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  unlockDateValue: {
    fontSize: 14,
    color: '#000',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AchievementsGrid;
