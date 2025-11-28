/**
 * Legal Document Viewer Component
 *
 * Displays legal documents with:
 * - Markdown rendering
 * - Search functionality
 * - Dark/light mode support
 * - Accessibility features
 * - Share/save options
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { LegalDocument } from '@/services/legal/LegalDocumentService';
import { SignatureModal, CapturedSignature } from './SignatureModal';
import DocumentSigningService from '@/services/legal/DocumentSigningService';
import DocumentVersioningService from '@/services/legal/DocumentVersioningService';
import DocumentAnalyticsService from '@/services/legal/DocumentAnalyticsService';
import ComplianceReportService from '@/services/legal/ComplianceReportService';

interface LegalDocumentViewerProps {
  document: LegalDocument;
  onClose?: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
  loading?: boolean;
  requiresSignature?: boolean;
  onSignatureComplete?: (signature: any) => void;
}

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
  document,
  onClose,
  onAccept,
  showAcceptButton = false,
  loading = false,
  requiresSignature = false,
  onSignatureComplete,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingDocument, setSigningDocument] = useState(false);

  // Analytics services
  const viewStartTime = useRef<number>(Date.now());
  const hasTrackedView = useRef<boolean>(false);

  /**
   * Track document view on mount
   */
  useEffect(() => {
    const trackView = async () => {
      try {
        viewStartTime.current = Date.now();

        // Track document view
        await DocumentAnalyticsService.trackDocumentView(document.id);
        hasTrackedView.current = true;

        // Log audit event
        const complianceService = ComplianceReportService.getInstance();
        await complianceService.logAuditEvent({
          action: 'view',
          documentId: document.id,
          documentTitle: document.title,
          userId: '', // Will be set by service
          details: {
            version: document.version,
            platform: Platform.OS,
          },
        });
      } catch (error) {
        console.warn('[LegalDocumentViewer] Failed to track view:', error);
      }
    };

    trackView();

    // Track view duration on unmount
    return () => {
      if (hasTrackedView.current) {
        const viewDuration = Date.now() - viewStartTime.current;
        DocumentAnalyticsService.trackInteraction(document.id, 'view_complete', {
          duration: viewDuration,
          searchQueries: searchQuery ? 1 : 0,
          sectionsExpanded: expandedSections.size,
        }).catch(error => console.warn('[LegalDocumentViewer] Failed to track view complete:', error));
      }
    };
  }, [document.id, document.title, document.version]);

  /**
   * Handle accept button press
   * If signature required, show modal; otherwise call onAccept
   */
  const handleAcceptPress = useCallback(() => {
    if (requiresSignature) {
      setShowSignatureModal(true);
    } else if (onAccept) {
      onAccept();
    }
  }, [requiresSignature, onAccept]);

  /**
   * Handle signature capture
   */
  const handleSignatureCapture = useCallback(
    async (signature: CapturedSignature) => {
      try {
        setSigningDocument(true);

        // Track signature attempt start
        const signatureStartTime = Date.now();

        // Store signature
        const documentSignature = await DocumentSigningService.captureSignature(
          document.id,
          signature,
          '1.0.0', // TODO: Get actual app version
          Platform.OS as 'ios' | 'android'
        );

        if (!documentSignature) {
          throw new Error('Failed to capture signature');
        }

        // Link signature to acceptance
        const linked = await DocumentVersioningService.linkSignatureToAcceptance(
          document.id,
          documentSignature.id
        );

        if (!linked) {
          throw new Error('Failed to link signature');
        }

        // Track successful signature
        const timeToSign = Date.now() - signatureStartTime;
        await DocumentAnalyticsService.trackSignatureAttempt(document.id, true);
        await DocumentAnalyticsService.trackInteraction(document.id, 'signature_complete', {
          type: signature.type,
          timeToSign,
        });

        // Log audit event for signature
        const complianceService = ComplianceReportService.getInstance();
        await complianceService.logAuditEvent({
          action: 'sign',
          documentId: document.id,
          documentTitle: document.title,
          userId: '', // Will be set by service
          details: {
            signatureType: signature.type,
            timeToSign,
            signatureId: documentSignature.id,
          },
        });

        // Call accept callback
        if (onAccept) {
          onAccept();
        }

        // Notify caller of signature completion
        if (onSignatureComplete) {
          onSignatureComplete(documentSignature);
        }

        // Close modal
        setShowSignatureModal(false);
      } catch (error) {
        console.error('[LegalDocumentViewer] Signature capture failed:', error);

        // Track failed signature attempt
        await DocumentAnalyticsService.trackSignatureAttempt(document.id, false);

        alert('Failed to save signature. Please try again.');
      } finally {
        setSigningDocument(false);
      }
    },
    [document.id, document.title, onAccept, onSignatureComplete]
  );

  // Parse markdown content into sections
  const sections = useMemo(() => {
    if (!document.content) return [];

    const lines = document.content.split('\n');
    const parsed: Array<{
      title: string;
      level: number;
      content: string[];
      id: string;
    }> = [];

    let currentSection = {
      title: '',
      level: 0,
      content: [] as string[],
      id: '',
    };

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);

      if (match) {
        if (currentSection.title) {
          parsed.push(currentSection);
        }

        const level = match[1].length;
        const title = match[2];
        currentSection = {
          title,
          level,
          content: [],
          id: title.toLowerCase().replace(/\s+/g, '-'),
        };
      } else if (currentSection.title) {
        currentSection.content.push(line);
      }
    }

    if (currentSection.title) {
      parsed.push(currentSection);
    }

    return parsed;
  }, [document.content]);

  // Track search interactions
  useEffect(() => {
    // Filter sections based on search
    const filtered = searchQuery.trim().length > 0
      ? sections.filter(
          section =>
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            section.content.some(line => line.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : sections;

    if (searchQuery.trim().length > 0) {
      const timer = setTimeout(() => {
        DocumentAnalyticsService.trackInteraction(document.id, 'search', {
          query: searchQuery,
          resultsCount: filtered.length,
        }).catch(error => console.warn('[LegalDocumentViewer] Failed to track search:', error));
      }, 500); // Debounce search tracking

      return () => clearTimeout(timer);
    }
  }, [searchQuery, document.id, sections]);

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;

    const query = searchQuery.toLowerCase();
    return sections.filter(
      section =>
        section.title.toLowerCase().includes(query) ||
        section.content.some(line => line.toLowerCase().includes(query))
    );
  }, [sections, searchQuery]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
        // Track section expansion
        DocumentAnalyticsService.trackInteraction(document.id, 'expand_section', {
          sectionId,
        }).catch(error => console.warn('[LegalDocumentViewer] Failed to track expand:', error));
      }
      return newSet;
    });
  }, [document.id]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${document.title}\n\n${document.description}\n\nVersion: ${document.version}`,
        title: document.title,
        url: undefined,
      });

      // Track share interaction
      DocumentAnalyticsService.trackInteraction(document.id, 'share', {
        title: document.title,
      }).catch(error => console.warn('[LegalDocumentViewer] Failed to track share:', error));
    } catch (error) {
      console.error('[LegalDocumentViewer] Share error:', error);
    }
  }, [document]);

  const expandAll = useCallback(() => {
    const allIds = new Set(sections.map(s => s.id));
    setExpandedSections(allIds);
  }, [sections]);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary.blue} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading document...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.card, borderColor: colors.ui.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
            {document.title}
          </Text>
          <Text style={[styles.version, { color: colors.text.secondary }]}>
            v{document.version} • Updated {document.lastUpdated}
          </Text>
        </View>

        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-social" size={22} color={colors.primary.blue} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background.card }]}>
        <Ionicons name="search" size={18} color={colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search document..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Expand/Collapse Controls */}
      <View style={[styles.controlsContainer, { backgroundColor: colors.background.secondary }]}>
        <TouchableOpacity onPress={expandAll} style={styles.controlButton}>
          <Ionicons name="expand" size={16} color={colors.primary.blue} />
          <Text style={[styles.controlText, { color: colors.primary.blue }]}>Expand All</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.ui.border }]} />

        <TouchableOpacity onPress={collapseAll} style={styles.controlButton}>
          <Ionicons name="contract" size={16} color={colors.primary.blue} />
          <Text style={[styles.controlText, { color: colors.primary.blue }]}>Collapse All</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <Text style={[styles.resultCount, { color: colors.text.secondary }]}>
          {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={true}
        onScroll={event => setScrollPosition(event.nativeEvent.contentOffset.y)}
      >
        {filteredSections.length > 0 ? (
          <View style={styles.sectionsContainer}>
            {filteredSections.map((section, index) => (
              <View key={section.id} style={styles.section}>
                <TouchableOpacity
                  onPress={() => toggleSection(section.id)}
                  style={[
                    styles.sectionHeader,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.ui.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.text.primary },
                      section.level > 2 && styles.sectionTitleSmall,
                    ]}
                  >
                    {section.title}
                  </Text>
                  <Ionicons
                    name={expandedSections.has(section.id) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>

                {expandedSections.has(section.id) && (
                  <View
                    style={[
                      styles.sectionContent,
                      { backgroundColor: colors.background.secondary },
                    ]}
                  >
                    {section.content.map((line, idx) => {
                      if (!line.trim()) return null;

                      // Check if line is bold, italic, or code
                      const isBold = line.includes('**');
                      const isCode = line.startsWith('    ') || line.startsWith('\t');
                      const isList = line.startsWith('-') || line.startsWith('*');

                      return (
                        <Text
                          key={idx}
                          style={[
                            styles.contentLine,
                            { color: colors.text.primary },
                            isBold && styles.bold,
                            isCode && [
                              styles.code,
                              { backgroundColor: colors.background.primary },
                            ],
                            isList && styles.listItem,
                          ]}
                        >
                          {line.replace(/\*\*/g, '')}
                        </Text>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="search"
              size={48}
              color={colors.text.tertiary}
              style={{ marginBottom: Spacing.md }}
            />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              No sections match "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Metadata Footer */}
        <View
          style={[
            styles.metadataFooter,
            { backgroundColor: colors.background.card, borderColor: colors.ui.border },
          ]}
        >
          <View style={styles.metadataRow}>
            <Ionicons name="document-text" size={16} color={colors.text.secondary} />
            <Text style={[styles.metadataLabel, { color: colors.text.secondary }]}>
              {document.sections.length} sections
            </Text>
          </View>

          <View style={styles.metadataRow}>
            <Ionicons name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.metadataLabel, { color: colors.text.secondary }]}>
              Updated {document.lastUpdated}
            </Text>
          </View>

          <View style={styles.metadataRow}>
            <Ionicons name="information-circle" size={16} color={colors.text.secondary} />
            <Text style={[styles.metadataLabel, { color: colors.text.secondary }]}>
              Effective {document.effectiveDate}
            </Text>
          </View>
        </View>

        {/* Contact for Questions */}
        <View style={[styles.contactCard, { backgroundColor: colors.background.card }]}>
          <Ionicons name="mail" size={20} color={colors.primary.blue} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactTitle, { color: colors.text.primary }]}>
              Questions?
            </Text>
            <Text style={[styles.contactEmail, { color: colors.primary.blue }]}>
              {document.contactEmail}
            </Text>
          </View>
        </View>

        <View style={{ height: showAcceptButton ? 0 : Spacing.lg }} />
      </ScrollView>

      {/* Accept Button */}
      {showAcceptButton && (
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.background.card, borderColor: colors.ui.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.acceptButton,
              { backgroundColor: colors.primary.blue },
              (loading || signingDocument) && { opacity: 0.6 },
            ]}
            onPress={handleAcceptPress}
            disabled={loading || signingDocument}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>
              {requiresSignature ? 'I Agree & Sign' : 'I Agree & Accept'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Signature Modal */}
      <SignatureModal
        visible={showSignatureModal}
        documentId={document.id}
        documentTitle={document.title}
        onClose={() => setShowSignatureModal(false)}
        onSignatureCapture={handleSignatureCapture}
        loading={signingDocument}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    fontWeight: '700',
  },
  version: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  shareButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.xs,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  controlText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: Spacing.sm,
  },
  resultCount: {
    ...Typography.caption,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  sectionsContainer: {
    paddingVertical: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: '700',
    flex: 1,
  },
  sectionTitleSmall: {
    ...Typography.body,
  },
  sectionContent: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xs,
  },
  contentLine: {
    ...Typography.body,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
  },
  code: {
    ...Typography.caption,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  listItem: {
    marginLeft: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    ...Typography.body,
  },
  metadataFooter: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metadataLabel: {
    ...Typography.caption,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  contactTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  contactEmail: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  acceptButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
