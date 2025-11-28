/**
 * Legal Documents Screen
 *
 * Displays all legal documents in an organized list
 * - Browse documents by category
 * - View document details and status
 * - Accept required documents
 * - Download status and storage info
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import LegalDocumentService, { LegalDocument } from '@/services/legal/LegalDocumentService';
import DocumentVersioningService, {
  UserAcceptanceStatus,
} from '@/services/legal/DocumentVersioningService';
import { LegalDocumentViewer } from '@/components/legal/LegalDocumentViewer';
import DocumentSigningService from '@/services/legal/DocumentSigningService';

interface DocumentCardProps {
  document: LegalDocument;
  acceptanceStatus: UserAcceptanceStatus;
  hasSigned?: boolean;
  onPress: () => void;
}

interface LegalDocumentsScreenProps {
  onBack?: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  acceptanceStatus,
  hasSigned = false,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.documentCard, { backgroundColor: colors.background.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(document.category) + '20' },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(document.category)}
              size={16}
              color={getCategoryColor(document.category)}
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
              {document.title}
            </Text>
            <Text style={[styles.cardDescription, { color: colors.text.secondary }]}>
              v{document.version} • {document.lastUpdated}
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          {/* Signature Status */}
          {document.requiresSignature && (
            <View
              style={[
                styles.acceptanceTag,
                {
                  backgroundColor: hasSigned
                    ? Colors.accent.green + '20'
                    : Colors.accent.yellow + '20',
                },
              ]}
            >
              <Ionicons
                name={hasSigned ? 'document-lock' : 'document'}
                size={14}
                color={hasSigned ? Colors.accent.green : Colors.ui.warning}
              />
            </View>
          )}

          {/* Acceptance Status */}
          {document.requiresAcceptance && !document.requiresSignature && (
            <View
              style={[
                styles.acceptanceTag,
                {
                  backgroundColor: acceptanceStatus.accepted
                    ? Colors.accent.green + '20'
                    : Colors.accent.red + '20',
                },
              ]}
            >
              <Ionicons
                name={acceptanceStatus.accepted ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={acceptanceStatus.accepted ? Colors.accent.green : Colors.accent.red}
              />
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.cardSummary, { color: colors.text.secondary }]}>
        {document.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="document-text" size={14} color={colors.text.tertiary} />
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            {document.sections.length} sections
          </Text>
        </View>

        <View style={styles.footerItem}>
          <Ionicons name="calendar" size={14} color={colors.text.tertiary} />
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            Effective {document.effectiveDate}
          </Text>
        </View>

        {acceptanceStatus.accepted && (
          <View style={styles.footerItem}>
            <Ionicons name="checkmark" size={14} color={Colors.accent.green} />
            <Text style={[styles.footerText, { color: Colors.accent.green }]}>
              Accepted
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const LegalDocumentsScreen: React.FC<LegalDocumentsScreenProps> = ({
  onBack,
}) => {
  const { colors } = useTheme();
  const { onboarding, setLegalAccepted } = useSettingsStore();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [acceptanceStatuses, setAcceptanceStatuses] = useState<
    Map<string, UserAcceptanceStatus>
  >(new Map());
  const [signatureStatuses, setSignatureStatuses] = useState<
    Map<string, boolean>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<LegalDocument | null>(null);
  const [storageStats, setStorageStats] = useState<{
    totalSize: number;
    documentsCount: number;
  } | null>(null);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(!onboarding.legalAccepted);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
    loadStorageStats();
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);

      // Initialize if needed
      await LegalDocumentService.initializeLegalDocuments();

      // Load all documents
      const docs = await LegalDocumentService.getAllDocuments();
      setDocuments(docs);

      // Load acceptance statuses
      const statuses = new Map<string, UserAcceptanceStatus>();
      const signatures = new Map<string, boolean>();
      for (const doc of docs) {
        const status = await DocumentVersioningService.getAcceptanceStatus(doc.id);
        statuses.set(doc.id, status);

        // Load signature status for documents requiring signatures
        if (doc.requiresSignature) {
          const hasSigned = await DocumentVersioningService.hasValidSignature(doc.id);
          signatures.set(doc.id, hasSigned);
        }
      }
      setAcceptanceStatuses(statuses);
      setSignatureStatuses(signatures);
    } catch (error) {
      console.error('[LegalDocumentsScreen] Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStorageStats = useCallback(async () => {
    try {
      const stats = await LegalDocumentService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('[LegalDocumentsScreen] Error loading storage stats:', error);
    }
  }, []);

  const handleFirstTimeAcceptance = useCallback(() => {
    // Mark legal acceptance in settings
    setLegalAccepted();
    setShowFirstTimeModal(false);
  }, [setLegalAccepted]);

  const handleDocumentPress = useCallback((document: LegalDocument) => {
    setViewingDocument(document);
  }, []);

  const handleDocumentClose = useCallback(() => {
    setViewingDocument(null);
  }, []);

  const handleDocumentAccept = useCallback(async () => {
    if (!viewingDocument) return;

    try {
      const success = await DocumentVersioningService.recordAcceptance(
        viewingDocument.id,
        '1.0.0', // App version
        'ios' // Platform - should come from device
      );

      if (success) {
        Alert.alert('Success', `You have accepted ${viewingDocument.title}`);

        // Update acceptance status
        const newStatus = await DocumentVersioningService.getAcceptanceStatus(
          viewingDocument.id
        );
        setAcceptanceStatuses(prev => new Map(prev).set(viewingDocument.id, newStatus));

        // Close viewer
        setViewingDocument(null);
      } else {
        Alert.alert('Error', 'Failed to record acceptance');
      }
    } catch (error) {
      console.error('[LegalDocumentsScreen] Error accepting document:', error);
      Alert.alert('Error', 'An error occurred');
    }
  }, [viewingDocument]);

  // Filter documents by category
  const filteredDocuments = selectedCategory
    ? documents.filter(doc => doc.category === selectedCategory)
    : documents;

  // Get unique categories
  const categories = Array.from(new Set(documents.map(doc => doc.category)));

  const dynamicStyles = {
    scrollContent: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    } as const,
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading documents...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      {/* First-Time User Modal */}
      <Modal
        visible={showFirstTimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.card }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="documents-outline" size={48} color={colors.primary.blue} />
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Welcome to Legal & Compliance
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.text.secondary }]}>
                Before using the app, please review and accept our legal documents
              </Text>
            </View>

            <View style={styles.modalChecklist}>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.accent.green} />
                <Text style={[styles.checklistText, { color: colors.text.secondary }]}>
                  Review Terms of Service
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.accent.green} />
                <Text style={[styles.checklistText, { color: colors.text.secondary }]}>
                  Accept Privacy Policy
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.accent.green} />
                <Text style={[styles.checklistText, { color: colors.text.secondary }]}>
                  Understand compliance requirements
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary.blue }]}
                onPress={handleFirstTimeAcceptance}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  I Accept & Understand
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalFooterText, { color: colors.text.tertiary }]}>
                You can always review these documents later in Settings
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderColor: colors.ui.border }]}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Legal & Compliance
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            Review our policies and documents
          </Text>
        </View>
      </View>

      {/* Storage Info */}
      {storageStats && (
        <View style={[styles.storageCard, { backgroundColor: colors.background.card }]}>
          <Ionicons name="storage" size={16} color={colors.primary.blue} />
          <Text style={[styles.storageText, { color: colors.text.secondary }]}>
            {documents.length} documents • {(storageStats.totalSize / 1024).toFixed(1)} KB
          </Text>
        </View>
      )}

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        <View style={styles.categoriesContainer}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              !selectedCategory && { backgroundColor: colors.primary.blue },
              { borderColor: colors.ui.border },
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                { color: !selectedCategory ? '#FFF' : colors.text.primary },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && { backgroundColor: colors.primary.blue },
                { borderColor: colors.ui.border },
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Ionicons
                name={getCategoryIcon(category)}
                size={14}
                color={selectedCategory === category ? '#FFF' : colors.text.primary}
                style={{ marginRight: Spacing.xs }}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: selectedCategory === category ? '#FFF' : colors.text.primary },
                ]}
              >
                {getCategoryLabel(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Documents List */}
      <ScrollView style={styles.content} contentContainerStyle={dynamicStyles.scrollContent}>
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map(document => (
            <DocumentCard
              key={document.id}
              document={document}
              acceptanceStatus={acceptanceStatuses.get(document.id) || {
                userId: 'guest',
                documentId: document.id,
                accepted: false,
                requiresReacceptance: false,
              }}
              hasSigned={signatureStatuses.get(document.id) || false}
              onPress={() => handleDocumentPress(document)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text"
              size={48}
              color={colors.text.tertiary}
              style={{ marginBottom: Spacing.md }}
            />
            <Text style={[styles.emptyStateTitle, { color: colors.text.secondary }]}>
              No documents found
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: colors.text.tertiary }]}>
              Try selecting a different category
            </Text>
          </View>
        )}

        {/* Help Text */}
        <View
          style={[
            styles.helpCard,
            { backgroundColor: colors.background.card, borderColor: colors.ui.border },
          ]}
        >
          <Ionicons name="information-circle" size={20} color={colors.primary.blue} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.helpTitle, { color: colors.text.primary }]}>
              Need Help?
            </Text>
            <Text style={[styles.helpText, { color: colors.text.secondary }]}>
              If you have questions about any document, contact us directly at
              ourenglish2019@gmail.com
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleDocumentClose}
        >
          <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <LegalDocumentViewer
              document={viewingDocument}
              onClose={handleDocumentClose}
              onAccept={handleDocumentAccept}
              showAcceptButton={viewingDocument.requiresAcceptance || viewingDocument.requiresSignature}
              requiresSignature={viewingDocument.requiresSignature}
              loading={false}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
    </>
  );
};

// Helper functions
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    privacy: Colors.accent.blue || '#2196F3',
    legal: Colors.accent.red || '#F44336',
    compliance: Colors.accent.green || '#4CAF50',
    help: Colors.primary.blue || '#5B6FE8',
  };
  return colors[category] || Colors.text.secondary;
}

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    privacy: 'shield-checkmark',
    legal: 'document-text',
    compliance: 'checkmark-circle',
    help: 'help-circle',
  };
  return icons[category] || 'document';
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    privacy: 'Privacy',
    legal: 'Legal',
    compliance: 'Compliance',
    help: 'Help',
  };
  return labels[category] || category;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // First-Time Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxWidth: 400,
    ...Shadows.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h2,
    fontWeight: '700',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...Typography.body,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalChecklist: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checklistText: {
    ...Typography.body,
    flex: 1,
  },
  modalFooter: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    width: '100%',
  },
  modalButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  modalFooterText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingRight: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  storageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  storageText: {
    ...Typography.caption,
  },
  categoriesScroll: {
    maxHeight: 50,
    marginBottom: Spacing.md,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  categoryButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  documentCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  cardDescription: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  acceptanceTag: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSummary: {
    ...Typography.caption,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    ...Typography.caption,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  emptyStateSubtitle: {
    ...Typography.body,
    marginTop: Spacing.sm,
  },
  helpCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  helpTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  helpText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
});
