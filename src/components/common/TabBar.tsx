import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '@constants';
import { SpringAnimations, AnimationDurations } from '@/constants/animations';
import { useTheme } from '@/hooks/useTheme';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { IconSizes } from '@/constants/icons';

export interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabPress }) => {
  const { colors } = useTheme();
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabWidths = useRef<number[]>([]);
  const tabOffsets = useRef<number[]>([]);

  const handleTabLayout = (event: LayoutChangeEvent, index: number) => {
    tabWidths.current[index] = event.nativeEvent.layout.width;
    tabOffsets.current[index] = event.nativeEvent.layout.x;
  };

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);
    if (activeIndex >= 0 && tabOffsets.current[activeIndex]) {
      if (prefersReducedMotion) {
        indicatorAnim.setValue(activeIndex);
      } else {
        Animated.spring(indicatorAnim, {
          toValue: activeIndex,
          useNativeDriver: false,
          ...SpringAnimations.GENTLE,
        }).start();
      }
    }
  }, [activeTab, tabs, prefersReducedMotion, indicatorAnim]);

  const translateX = indicatorAnim.interpolate({
    inputRange: Array.from({ length: tabs.length }, (_, i) => i),
    outputRange: tabOffsets.current.slice(0, tabs.length).length > 0
      ? tabOffsets.current.slice(0, tabs.length)
      : [0],
  });

  const indicatorWidth = tabWidths.current.length > 0 ? tabWidths.current[0] : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.tabs.background, borderTopColor: colors.ui.border }]}>
      {/* Animated Indicator */}
      {indicatorWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [{ translateX }],
              width: indicatorWidth,
              backgroundColor: colors.primary.blue,
            },
          ]}
        />
      )}

      {/* Tab Items */}
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            onLayout={(event) => handleTabLayout(event, index)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={IconSizes.MEDIUM}
              color={isActive ? colors.primary.blue : colors.text.tertiary}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primary.blue : colors.text.tertiary },
                isActive && { fontWeight: '600' },
              ]}
            >
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
    borderTopWidth: 1,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.md,
    ...Shadows.sm,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    marginTop: Spacing.xs / 2,
  },
});