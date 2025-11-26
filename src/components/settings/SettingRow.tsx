/**
 * SettingRow Component with Integrated Tooltip
 *
 * Reusable wrapper for settings that includes a help icon and tooltip.
 * Provides contextual help for complex settings without cluttering the UI.
 * Phase 4: Settings Tooltips & Feature Prompts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface SettingRowProps {
  /**
   * Label text for the setting
   */
  label: string;

  /**
   * Tooltip text explaining the setting
   */
  tooltip: string;

  /**
   * Optional icon name for the help button
   */
  tooltipIcon?: 'help-circle-outline' | 'help-circle' | 'information-circle-outline';

  /**
   * The setting control (Switch, Picker, Input, etc.)
   */
  children: React.ReactNode;

  /**
   * Optional additional style for the container
   */
  containerStyle?: any;

  /**
   * Optional color for the tooltip icon
   */
  tooltipColor?: string;
}

/**
 * SettingRow - Reusable setting with help tooltip
 *
 * @example
 * <SettingRow
 *   label="Word Highlighting"
 *   tooltip="Words highlight as audio plays. Great for following along."
 * >
 *   <Switch value={enabled} onValueChange={toggle} />
 * </SettingRow>
 */
export const SettingRow: React.FC<SettingRowProps> = ({
  label,
  tooltip,
  tooltipIcon = 'help-circle-outline',
  children,
  containerStyle,
  tooltipColor,
}) => {
  const { colors } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggleTooltip = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );
    setShowTooltip(!showTooltip);
  };

  const iconColor = tooltipColor || colors.primary.blue;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label with help icon */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text.primary }]}>
          {label}
        </Text>

        <TouchableOpacity
          onPress={handleToggleTooltip}
          activeOpacity={0.6}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.helpButton}
        >
          <Ionicons
            name={tooltipIcon}
            size={18}
            color={iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* Setting control */}
      <View style={styles.controlContainer}>
        {children}
      </View>

      {/* Tooltip - expandable */}
      {showTooltip && (
        <View
          style={[
            styles.tooltipBox,
            { backgroundColor: colors.background.card },
          ]}
        >
          <View style={styles.tooltipContent}>
            <Ionicons
              name="bulb-outline"
              size={16}
              color={colors.primary.blue}
              style={styles.tooltipIcon}
            />
            <Text
              style={[
                styles.tooltipText,
                { color: colors.text.secondary },
              ]}
            >
              {tooltip}
            </Text>
          </View>

          {/* Tooltip dismiss indicator */}
          <TouchableOpacity
            onPress={handleToggleTooltip}
            style={styles.tooltipDismiss}
          >
            <Text style={[styles.tooltipDismissText, { color: colors.primary.blue }]}>
              Got it
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Divider */}
      <View
        style={[
          styles.divider,
          { backgroundColor: colors.ui.border },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },

  label: {
    ...Typography.bodyLarge,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },

  helpButton: {
    paddingLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  controlContainer: {
    marginBottom: Spacing.sm,
  },

  tooltipBox: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },

  tooltipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },

  tooltipIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
    flexShrink: 0,
  },

  tooltipText: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },

  tooltipDismiss: {
    alignItems: 'flex-end',
    paddingTop: Spacing.xs,
  },

  tooltipDismissText: {
    fontSize: 12,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.lg,
  },
});
