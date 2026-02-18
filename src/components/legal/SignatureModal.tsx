/**
 * Signature Modal Component
 *
 * Allows users to sign documents by typing their full name.
 * Validates that the signature name matches the user's registered name.
 *
 * Captures complete metadata for compliance tracking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';

export interface CapturedSignature {
  type: 'typed';
  data: string; // User's full name
  timestamp: number;
  device: string; // iOS/Android
}

interface SignatureModalProps {
  documentId: string;
  documentTitle: string;
  visible: boolean;
  onClose: () => void;
  onSignatureCapture: (signature: CapturedSignature) => Promise<void>;
  loading?: boolean;
}

type SignatureMode = 'typed'; // Removed 'choose' and 'sketch' - typed name only


/**
 * Typed Name Input Component
 */
const TypedNameInput: React.FC<{
  onSignatureReady: (signature: string) => void;
  colors: any;
  userFullName?: string;
}> = ({ onSignatureReady, colors, userFullName }) => {
  const [name, setName] = useState(userFullName || '');

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Empty Name', 'Please enter your full name');
      return;
    }

    // Validate name matches user's registered name
    if (userFullName && trimmedName.toLowerCase() !== userFullName.toLowerCase()) {
      Alert.alert(
        'Name Mismatch',
        `The signature name "${trimmedName}" does not match your registered name "${userFullName}".\n\nFor legal compliance, you must sign with your registered name.`
      );
      return;
    }

    onSignatureReady(trimmedName);
  };

  return (
    <View style={styles.typedContainer}>
      <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
        Enter your full name to sign:
      </Text>

      <TextInput
        style={[
          styles.nameInput,
          {
            color: colors.text.primary,
            borderColor: colors.ui.border,
            backgroundColor: colors.background.primary,
          },
        ]}
        placeholder="Your Full Name"
        placeholderTextColor={colors.text.tertiary}
        value={name}
        onChangeText={setName}
        editable={true}
      />

      <View style={styles.previewContainer}>
        <Text style={[styles.previewLabel, { color: colors.text.secondary }]}>
          Your signature will appear as:
        </Text>
        <Text
          style={[
            styles.signaturePreview,
            {
              color: colors.text.primary,
              borderColor: colors.ui.border,
            },
          ]}
        >
          {name || 'Your Name'}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary.blue },
          !name.trim() && { opacity: 0.5 },
        ]}
        onPress={handleSubmit}
        disabled={!name.trim()}
      >
        <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>Sign with This Name</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Main SignatureModal Component
 */
export const SignatureModal: React.FC<SignatureModalProps> = ({
  documentId,
  documentTitle,
  visible,
  onClose,
  onSignatureCapture,
  loading = false,
}) => {
  const { colors } = useTheme();
  const user = useAuthStore(state => state.user);
  const [mode, setMode] = useState<SignatureMode>('typed');
  const [capturing, setCapturing] = useState(false);

  const handleSignatureReady = async (signatureData: string) => {
    try {
      setCapturing(true);

      const signature: CapturedSignature = {
        type: 'typed',
        data: signatureData,
        timestamp: Date.now(),
        device: Platform.OS,
      };

      await onSignatureCapture(signature);

      // Close modal
      onClose();
    } catch (error) {
      console.error('[SignatureModal] Error capturing signature:', error);
      Alert.alert('Error', 'Failed to save signature. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { borderColor: colors.ui.border }]}>
          <TouchableOpacity onPress={handleClose} disabled={capturing || loading}>
            <Ionicons name="chevron-down" size={28} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Sign Document
            </Text>
            <Text style={[styles.documentTitleText, { color: colors.text.secondary }]}>
              {documentTitle}
            </Text>
          </View>

          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={[styles.instructionText, { color: colors.text.primary }]}>
            Please sign by entering your full name as it appears in your account:
          </Text>

          {/* Legal Notice */}
          <View style={[styles.noticeBox, { backgroundColor: colors.background.card }]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary.blue} />
            <Text style={[styles.noticeText, { color: colors.text.secondary }]}>
              Your signature will be legally binding and recorded for compliance purposes.
            </Text>
          </View>

          {!capturing && (
            <TypedNameInput
              onSignatureReady={handleSignatureReady}
              colors={colors}
              userFullName={user?.fullName}
            />
          )}

          {(capturing || loading) && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.blue} />
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                Saving your signature...
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  documentTitleText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  instructionText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.lg,
  },
  noticeText: {
    ...Typography.caption,
    flex: 1,
  },

  // Typed Name Styles
  typedContainer: {
    gap: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    fontWeight: '600',
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: 48,
  },
  previewContainer: {
    gap: Spacing.sm,
  },
  previewLabel: {
    ...Typography.caption,
  },
  signaturePreview: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    ...Typography.h3,
    fontStyle: 'italic',
    textAlign: 'center',
    minHeight: 80,
    textAlignVertical: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    color: '#FFFFFF',
    ...Typography.body,
    fontWeight: '700',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
});
