/**
 * Breadcrumbs Component
 * Phase 3: Navigation & Flow - Visual Breadcrumb Display
 *
 * Displays navigation path with tappable breadcrumb items.
 * Shows: Home > Readings > John 3:16
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

export interface BreadcrumbsProps {
  /**
   * Show home icon/link at start
   */
  showHome?: boolean;

  /**
   * Separator between breadcrumbs
   */
  separator?: string;

  /**
   * Max number of breadcrumbs to show (rest become "...")
   */
  maxVisible?: number;

  /**
   * Custom styles
   */
  containerStyle?: any;

  /**
   * Text style
   */
  textStyle?: any;

  /**
   * Whether to show in horizontal scroll or vertical stack
   */
  horizontal?: boolean;

  /**
   * Font size for breadcrumb text
   */
  fontSize?: number;

  /**
   * Whether breadcrumbs are clickable
   */
  clickable?: boolean;

  /**
   * Callback when home is tapped (if showHome=true)
   */
  onHomePress?: () => void;
}

/**
 * Breadcrumbs - Display navigation path
 *
 * @example
 * <Breadcrumbs
 *   showHome={true}
 *   horizontal={true}
 *   clickable={true}
 * />
 *
 * Renders: 🏠 > Readings > John 3:16
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  showHome = true,
  separator = '›',
  maxVisible = 5,
  containerStyle,
  textStyle,
  horizontal = true,
  fontSize = 14,
  clickable = true,
  onHomePress,
}) => {
  const { breadcrumbs, navigateTo, hasBreadcrumbs } = useBreadcrumbs();
  const { colors } = useTheme();

  if (!hasBreadcrumbs && !showHome) {
    return null;
  }

  // Determine which breadcrumbs to show
  let visibleBreadcrumbs = breadcrumbs;
  let hasCollapsed = false;

  if (visibleBreadcrumbs.length > maxVisible) {
    hasCollapsed = true;
    visibleBreadcrumbs = visibleBreadcrumbs.slice(
      visibleBreadcrumbs.length - maxVisible
    );
  }

  const ContainerComponent = horizontal ? ScrollView : View;
  const containerProps = horizontal
    ? {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        scrollEventThrottle: 16,
      }
    : {};

  return (
    <ContainerComponent
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderBottomColor: colors.text.tertiary,
        },
        containerStyle,
      ]}
      {...containerProps}
    >
      <View style={styles.content}>
        {/* Home Link */}
        {showHome && (
          <>
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={onHomePress}
              activeOpacity={clickable ? 0.6 : 1}
              disabled={!clickable}
            >
              <Ionicons
                name="home"
                size={18}
                color={colors.text.secondary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.itemText,
                  {
                    color: colors.text.secondary,
                    fontSize,
                  },
                  textStyle,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>
            {(hasCollapsed || hasBreadcrumbs) && (
              <Text
                style={[
                  styles.separator,
                  {
                    color: colors.text.tertiary,
                  },
                ]}
              >
                {' '}
                {separator}{' '}
              </Text>
            )}
          </>
        )}

        {/* Collapsed Indicator */}
        {hasCollapsed && (
          <>
            <Text
              style={[
                styles.itemText,
                {
                  color: colors.text.tertiary,
                  fontSize,
                },
                textStyle,
              ]}
            >
              ...
            </Text>
            {visibleBreadcrumbs.length > 0 && (
              <Text
                style={[
                  styles.separator,
                  {
                    color: colors.text.tertiary,
                  },
                ]}
              >
                {' '}
                {separator}{' '}
              </Text>
            )}
          </>
        )}

        {/* Breadcrumb Items */}
        {visibleBreadcrumbs.map((breadcrumb, index) => {
          const isLast = index === visibleBreadcrumbs.length - 1;
          const originalIndex = breadcrumbs.length - visibleBreadcrumbs.length + index;

          return (
            <View key={`${breadcrumb.name}-${index}`} style={styles.itemContainer}>
              <TouchableOpacity
                onPress={() => navigateTo(originalIndex)}
                activeOpacity={clickable ? 0.6 : 1}
                disabled={!clickable || isLast}
                style={styles.itemPressable}
              >
                {breadcrumb.icon && (
                  <Ionicons
                    name={breadcrumb.icon as any}
                    size={16}
                    color={colors.text.primary}
                    style={styles.icon}
                  />
                )}
                <Text
                  style={[
                    styles.itemText,
                    {
                      color: isLast
                        ? colors.text.primary
                        : colors.text.secondary,
                      fontSize,
                      fontWeight: isLast ? '600' : '400',
                    },
                    textStyle,
                  ]}
                  numberOfLines={1}
                >
                  {breadcrumb.label}
                </Text>
              </TouchableOpacity>

              {!isLast && (
                <Text
                  style={[
                    styles.separator,
                    {
                      color: colors.text.tertiary,
                    },
                  ]}
                >
                  {' '}
                  {separator}{' '}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  itemPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  itemText: {
    ...Typography.caption,
    maxWidth: 150,
  },
  separator: {
    ...Typography.caption,
    marginHorizontal: Spacing.xs,
  },
});
