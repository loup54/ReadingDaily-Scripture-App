/**
 * Statistics Card Component
 * Phase 10C.5: Statistics Display
 *
 * Displays:
 * - Total sessions
 * - Average score
 * - Streak days
 * - Total minutes
 * - Best score
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserProfile } from '@/types/subscription.types';

interface StatisticsCardProps {
  profile: UserProfile;
}

interface StatItem {
  label: string;
  value: string;
  icon: string;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({ profile }) => {
  const stats: StatItem[] = [
    {
      label: 'Sessions',
      value: profile.totalSessions.toString(),
      icon: '📚',
    },
    {
      label: 'Avg Score',
      value: `${Math.round(profile.averageScore)}%`,
      icon: '⭐',
    },
    {
      label: 'Streak',
      value: `${profile.streakDays} days`,
      icon: '🔥',
    },
    {
      label: 'Minutes',
      value: profile.totalMinutes.toString(),
      icon: '⏱️',
    },
    {
      label: 'Best Score',
      value: `${profile.bestScore}%`,
      icon: '🏆',
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={styles.icon}>{stat.icon}</Text>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});

export default StatisticsCard;
