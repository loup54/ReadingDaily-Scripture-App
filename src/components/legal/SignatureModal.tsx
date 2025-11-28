/**
 * Signature Modal Component
 *
 * Allows users to sign documents with two methods:
 * 1. Sketch-based signature (drawing)
 * 2. Typed name signature
 *
 * Captures complete metadata for compliance tracking
 */

import React, { useState, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

export interface CapturedSignature {
  type: 'sketch' | 'typed';
  data: string; // Base64 for sketch, plain text for typed
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

type SignatureMode = 'choose' | 'sketch' | 'typed';

/**
 * Sketch Signature Canvas Component
 * Allows users to draw their signature with touch events
 */
const SketchCanvas: React.FC<{
  onSignatureReady: (signature: string) => void;
  colors: any;
}> = ({ onSignatureReady, colors }) => {
  const canvasRef = useRef<any>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokes, setStrokes] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);

  const handleTouchStart = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentStroke([{ x: locationX, y: locationY }]);
  };

  const handleTouchMove = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentStroke(prev => [...prev, { x: locationX, y: locationY }]);
    if (!hasSignature && currentStroke.length === 0) {
      setHasSignature(true);
    }
  };

  const handleTouchEnd = () => {
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setHasSignature(false);
  };

  const handleFinish = () => {
    if (!hasSignature && strokes.length === 0) {
      Alert.alert('Empty Signature', 'Please draw your signature first');
      return;
    }
    // Convert strokes to base64 format for storage
    const signatureData = JSON.stringify(strokes);
    const base64 = Buffer.from(signatureData).toString('base64');
    onSignatureReady(base64);
  };

  return (
    <View style={styles.canvasContainer}>
      <View
        style={[
          styles.sketchArea,
          {
            backgroundColor: colors.background.primary,
            borderColor: colors.ui.border,
          }
        ]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        ref={canvasRef}
      >
        {!hasSignature && (
          <Text style={[styles.sketchPlaceholder, { color: colors.text.tertiary }]}>
            Draw your signature here
          </Text>
        )}
        {/* Visual feedback showing signature strokes */}
        {(strokes.length > 0 || currentStroke.length > 0) && (
          <Text style={[styles.sketchHint, { color: colors.accent.green }]}>
            ✓ Signature captured
          </Text>
        )}
      </View>

      <View style={styles.sketchControls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.ui.border }]}
          onPress={handleClear}
        >
          <Ionicons name="trash-outline" size={18} color={colors.text.primary} />
          <Text style={[styles.controlButtonText, { color: colors.text.primary }]}>
            Clear
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colors.primary.blue },
            !hasSignature && strokes.length === 0 && { opacity: 0.5 },
          ]}
          onPress={handleFinish}
          disabled={!hasSignature && strokes.length === 0}
        >
          <Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />
          <Text style={[styles.controlButtonText, { color: '#FFFFFF' }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Typed Name Input Component
 */
const TypedNameInput: React.FC<{
  onSignatureReady: (signature: string) => void;
  colors: any;
}> = ({ onSignatureReady, colors }) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Empty Name', 'Please enter your name');
      return;
    }
    onSignatureReady(name.trim());
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
  const [mode, setMode] = useState<SignatureMode>('choose');
  const [capturing, setCapturing] = useState(false);

  const handleSignatureReady = async (signatureData: string) => {
    try {
      setCapturing(true);

      const signature: CapturedSignature = {
        type: mode === 'sketch' ? 'sketch' : 'typed',
        data: signatureData,
        timestamp: Date.now(),
        device: Platform.OS,
      };

      await onSignatureCapture(signature);

      // Reset modal state
      setMode('choose');
      onClose();
    } catch (error) {
      console.error('[SignatureModal] Error capturing signature:', error);
      Alert.alert('Error', 'Failed to save signature. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const handleClose = () => {
    if (mode !== 'choose') {
      setMode('choose');
    } else {
      onClose();
    }
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
          scrollEnabled={mode === 'choose'}
        >
          {mode === 'choose' && (
            <>
              <Text style={[styles.instructionText, { color: colors.text.primary }]}>
                Choose how you'd like to sign this document:
              </Text>

              {/* Sketch Option */}
              <TouchableOpacity
                style={[styles.modeCard, { backgroundColor: colors.background.card }]}
                onPress={() => setMode('sketch')}
              >
                <View style={styles.modeCardContent}>
                  <View
                    style={[
                      styles.modeIcon,
                      { backgroundColor: colors.primary.blue + '20' },
                    ]}
                  >
                    <Ionicons name="pencil" size={28} color={colors.primary.blue} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeTitle, { color: colors.text.primary }]}>
                      Draw Signature
                    </Text>
                    <Text style={[styles.modeDescription, { color: colors.text.secondary }]}>
                      Use your finger or stylus to draw your signature
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>

              {/* Typed Option */}
              <TouchableOpacity
                style={[styles.modeCard, { backgroundColor: colors.background.card }]}
                onPress={() => setMode('typed')}
              >
                <View style={styles.modeCardContent}>
                  <View
                    style={[
                      styles.modeIcon,
                      { backgroundColor: colors.primary.blue + '20' },
                    ]}
                  >
                    <Ionicons name="text" size={28} color={colors.primary.blue} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeTitle, { color: colors.text.primary }]}>
                      Type Name
                    </Text>
                    <Text style={[styles.modeDescription, { color: colors.text.secondary }]}>
                      Enter your full name as your signature
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>

              {/* Legal Notice */}
              <View style={[styles.noticeBox, { backgroundColor: colors.background.card }]}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary.blue} />
                <Text style={[styles.noticeText, { color: colors.text.secondary }]}>
                  Your signature will be legally binding and recorded for compliance purposes.
                </Text>
              </View>
            </>
          )}

          {mode === 'sketch' && !capturing && (
            <SketchCanvas onSignatureReady={handleSignatureReady} colors={colors} />
          )}

          {mode === 'typed' && !capturing && (
            <TypedNameInput onSignatureReady={handleSignatureReady} colors={colors} />
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
  modeCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  modeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  modeDescription: {
    ...Typography.caption,
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

  // Sketch Canvas Styles
  canvasContainer: {
    gap: Spacing.md,
  },
  sketchArea: {
    height: 250,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sketchPlaceholder: {
    ...Typography.caption,
  },
  sketchHint: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  sketchControls: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  controlButtonText: {
    ...Typography.caption,
    fontWeight: '600',
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
