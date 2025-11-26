import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ReadingType } from '@/types/reading.types';
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { useTheme } from '@/hooks/useTheme';

interface ReadingTabsProps {
  activeTab: ReadingType;
  onTabChange: (tab: ReadingType) => void;
}

export const ReadingTabs: React.FC<ReadingTabsProps> = ({ activeTab, onTabChange }) => {
  const { colors } = useTheme();
  const tabs: Array<{ key: ReadingType; label: string }> = [
    { key: 'first-reading', label: '1st' },
    { key: 'psalm', label: 'Psalm' },
    { key: 'second-reading', label: '2nd' },
    { key: 'gospel', label: 'Gospel' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && [styles.tabActive, { backgroundColor: colors.tabs.active }]]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
            testID={`tab-${tab.key}`}
          >
            <Text style={[styles.tabText, { color: isActive ? colors.text.white : colors.text.primary }, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.accent.red,
  },
  tabText: {
    ...Typography.label,
    color: Colors.text.primary,
  },
  tabTextActive: {
    color: Colors.text.white,
    fontWeight: '600',
  },
});