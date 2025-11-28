/**
 * ComplianceAnalyticsScreen
 * Phase 6: Compliance & Analytics
 *
 * Dashboard for viewing compliance status, analytics, and generating reports.
 * Displays:
 * - User compliance status overview
 * - Document acceptance timeline
 * - Signature completion metrics
 * - View history and engagement
 * - Platform/device breakdown
 * - Report generation and export
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors } from '@constants';
import ComplianceReportService from '@/services/legal/ComplianceReportService';
import type { ComplianceReport, ComplianceSummary, DocumentComplianceStatus } from '@/services/legal/ComplianceReportService';
import DocumentAnalyticsService from '@/services/legal/DocumentAnalyticsService';
import type { UserViewStats, SignatureStats, EngagementMetrics } from '@/services/legal/DocumentAnalyticsService';
import { logger } from '@/services/logging/LoggerService';

const { width } = Dimensions.get('window');

interface ComplianceScreenState {
  loading: boolean;
  refreshing: boolean;
  report: ComplianceReport | null;
  viewStats: UserViewStats | null;
  signatureStats: SignatureStats | null;
  error: string | null;
  activeTab: 'overview' | 'timeline' | 'metrics' | 'export';
  selectedDocument: DocumentComplianceStatus | null;
}

/**
 * ComplianceAnalyticsScreen Component
 */
export const ComplianceAnalyticsScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();

  const [state, setState] = useState<ComplianceScreenState>({
    loading: true,
    refreshing: false,
    report: null,
    viewStats: null,
    signatureStats: null,
    error: null,
    activeTab: 'overview',
    selectedDocument: null,
  });

  /**
   * Load compliance data
   */
  const loadComplianceData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Generate new report
      const complianceService = ComplianceReportService.getInstance();
      const report = await complianceService.generateComplianceReport(user.uid, 'full');

      // Get analytics
      const viewStats = await DocumentAnalyticsService.getUserViewStats();
      const signatureStats = await DocumentAnalyticsService.getSignatureStats();

      setState(prev => ({
        ...prev,
        report,
        viewStats,
        signatureStats,
        loading: false,
      }));

      logger.info('Compliance data loaded successfully');
    } catch (error) {
      logger.error('Error loading compliance data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load compliance data',
        loading: false,
      }));
    }
  }, [user?.uid]);

  /**
   * Refresh handler
   */
  const handleRefresh = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    await loadComplianceData();
    setState(prev => ({ ...prev, refreshing: false }));
  }, [loadComplianceData]);

  /**
   * Load data on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      loadComplianceData();
    }, [loadComplianceData])
  );

  /**
   * Handle export report
   */
  const handleExportReport = useCallback(async (format: 'json' | 'csv' | 'pdf') => {
    if (!state.report) {
      Alert.alert('No Report', 'Please generate a report first');
      return;
    }

    try {
      const complianceService = ComplianceReportService.getInstance();
      let exportData;
      if (format === 'json') {
        exportData = await complianceService.exportReportAsJSON(state.report);
      } else if (format === 'csv') {
        exportData = await complianceService.exportReportAsCSV(state.report);
      } else {
        exportData = await complianceService.exportReportAsPDF(state.report);
      }

      Alert.alert('Export Successful', `Report exported as ${format.toUpperCase()}\n\nFile: ${exportData.fileName}`);
      logger.info(`Report exported as ${format}`);
    } catch (error) {
      logger.error('Error exporting report:', error);
      Alert.alert('Export Failed', 'Failed to export report. Please try again.');
    }
  }, [state.report]);

  /**
   * Handle verify acceptances
   */
  const handleVerifyAcceptances = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const complianceService = ComplianceReportService.getInstance();
      const verification = await complianceService.verifyAcceptancesValid(user.uid);

      if (verification.allValid) {
        Alert.alert('Verification Complete', `All ${verification.validCount} acceptances are valid and current.`);
      } else {
        Alert.alert(
          'Verification Issues Found',
          `Valid: ${verification.validCount}\nInvalid: ${verification.invalidCount}\nExpired: ${verification.expiredCount}\n\nIssues:\n${verification.issuesFound.join('\n')}`
        );
      }
    } catch (error) {
      logger.error('Error verifying acceptances:', error);
      Alert.alert('Verification Failed', 'Failed to verify acceptances. Please try again.');
    }
  }, [user?.uid]);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    header: {
      paddingVertical: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    tabBar: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginVertical: 16,
    },
    tab: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: colors.cardBackground,
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    complianceMeter: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: 'hidden',
      marginTop: 8,
    },
    complianceFill: {
      height: '100%',
      borderRadius: 4,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    statusCompliant: {
      backgroundColor: '#10B98130',
    },
    statusPartial: {
      backgroundColor: '#F5991630',
    },
    statusNonCompliant: {
      backgroundColor: '#EF444430',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statusTextCompliant: {
      color: '#10B981',
    },
    statusTextPartial: {
      color: '#F59916',
    },
    statusTextNonCompliant: {
      color: '#EF4444',
    },
    documentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    documentInfo: {
      flex: 1,
      marginLeft: 12,
    },
    documentTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    documentStatus: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    documentIcon: {
      fontSize: 24,
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: 16,
      paddingLeft: 12,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
      marginRight: 12,
      marginTop: 4,
    },
    timelineContent: {
      flex: 1,
    },
    timelineDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    timelineTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    timelineSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      marginBottom: 8,
      flexDirection: 'row',
    },
    buttonSecondary: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    buttonTextSecondary: {
      color: colors.text,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyIcon: {
      fontSize: 48,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 4,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (state.loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary.blue} />
      </View>
    );
  }

  const getComplianceColor = (compliance: number): string => {
    if (compliance >= 100) return '#10B981';
    if (compliance >= 50) return '#F59916';
    return '#EF4444';
  };

  const getStatusStyle = (status: 'compliant' | 'partial' | 'non-compliant') => {
    switch (status) {
      case 'compliant':
        return [dynamicStyles.statusBadge, dynamicStyles.statusCompliant];
      case 'partial':
        return [dynamicStyles.statusBadge, dynamicStyles.statusPartial];
      case 'non-compliant':
        return [dynamicStyles.statusBadge, dynamicStyles.statusNonCompliant];
    }
  };

  const getStatusTextStyle = (status: 'compliant' | 'partial' | 'non-compliant') => {
    switch (status) {
      case 'compliant':
        return [dynamicStyles.statusText, dynamicStyles.statusTextCompliant];
      case 'partial':
        return [dynamicStyles.statusText, dynamicStyles.statusTextPartial];
      case 'non-compliant':
        return [dynamicStyles.statusText, dynamicStyles.statusTextNonCompliant];
    }
  };

  return (
    <View style={dynamicStyles.container}>
      <ScrollView
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>Compliance & Analytics</Text>
          <Text style={dynamicStyles.headerSubtitle}>
            Last updated: {state.report?.generatedAt ? new Date(state.report.generatedAt).toLocaleDateString() : 'Never'}
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={dynamicStyles.tabBar}>
          {(['overview', 'timeline', 'metrics', 'export'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[dynamicStyles.tab, state.activeTab === tab && dynamicStyles.tabActive]}
              onPress={() => setState(prev => ({ ...prev, activeTab: tab }))}
            >
              <Text
                style={[
                  dynamicStyles.tabText,
                  state.activeTab === tab && dynamicStyles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {state.activeTab === 'overview' && state.report && (
          <>
            {/* Compliance Status Card */}
            <View style={dynamicStyles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Overall Compliance</Text>
                  <Text style={{ fontSize: 32, fontWeight: '700', color: colors.text, marginTop: 8 }}>
                    {state.report.summary.overallCompliance}%
                  </Text>
                </View>
                <View style={getStatusStyle(state.report.summary.status)}>
                  <Text style={getStatusTextStyle(state.report.summary.status)}>
                    {state.report.summary.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={dynamicStyles.complianceMeter}>
                <View
                  style={[
                    dynamicStyles.complianceFill,
                    {
                      width: `${state.report.summary.overallCompliance}%`,
                      backgroundColor: getComplianceColor(state.report.summary.overallCompliance),
                    },
                  ]}
                />
              </View>
            </View>

            {/* Statistics Cards */}
            <View style={dynamicStyles.card}>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Documents Accepted</Text>
                <Text style={dynamicStyles.statValue}>
                  {state.report.summary.acceptedDocuments}/{state.report.summary.documentCount}
                </Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Required Documents</Text>
                <Text style={dynamicStyles.statValue}>{state.report.summary.requiredDocuments}</Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Signed Documents</Text>
                <Text style={dynamicStyles.statValue}>{state.report.summary.signedDocuments}</Text>
              </View>
              <View style={[dynamicStyles.statRow, { borderBottomWidth: 0 }]}>
                <Text style={dynamicStyles.statLabel}>Total Views</Text>
                <Text style={dynamicStyles.statValue}>{state.report.summary.viewCount}</Text>
              </View>
            </View>

            {/* Document Status */}
            <View style={dynamicStyles.card}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Document Status</Text>
              {state.report.documents.map((doc, index) => (
                <View key={doc.documentId} style={[dynamicStyles.documentRow, index === state.report!.documents.length - 1 && { borderBottomWidth: 0 }]}>
                  <Ionicons
                    name={doc.accepted ? 'checkmark-circle' : 'document-outline'}
                    size={24}
                    color={doc.accepted ? '#10B981' : colors.textSecondary}
                    style={dynamicStyles.documentIcon}
                  />
                  <View style={dynamicStyles.documentInfo}>
                    <Text style={dynamicStyles.documentTitle}>{doc.title}</Text>
                    <Text style={dynamicStyles.documentStatus}>
                      {doc.accepted ? `Accepted ${new Date(doc.acceptedAt || 0).toLocaleDateString()}` : 'Not accepted'} {doc.signed ? '• Signed' : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Timeline Tab */}
        {state.activeTab === 'timeline' && state.report && (
          <>
            <View style={dynamicStyles.card}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Acceptance Timeline</Text>
              {state.report.acceptanceTimeline.length > 0 ? (
                state.report.acceptanceTimeline.map((event, index) => (
                  <View key={`${event.documentId}-${index}`} style={dynamicStyles.timelineItem}>
                    <View style={dynamicStyles.timelineDot} />
                    <View style={dynamicStyles.timelineContent}>
                      <Text style={dynamicStyles.timelineDate}>{new Date(event.acceptedAt).toLocaleDateString()}</Text>
                      <Text style={dynamicStyles.timelineTitle}>{event.title}</Text>
                      <Text style={dynamicStyles.timelineSubtitle}>v{event.version} • {event.platform}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.textSecondary }}>No acceptances yet</Text>
              )}
            </View>

            <View style={dynamicStyles.card}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Signature Timeline</Text>
              {state.report.signatureTimeline.length > 0 ? (
                state.report.signatureTimeline.map((event, index) => (
                  <View key={`${event.documentId}-${index}`} style={dynamicStyles.timelineItem}>
                    <View style={dynamicStyles.timelineDot} />
                    <View style={dynamicStyles.timelineContent}>
                      <Text style={dynamicStyles.timelineDate}>{new Date(event.signedAt).toLocaleDateString()}</Text>
                      <Text style={dynamicStyles.timelineTitle}>{event.title}</Text>
                      <Text style={dynamicStyles.timelineSubtitle}>{event.type === 'sketch' ? 'Signature' : 'Typed name'}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.textSecondary }}>No signatures yet</Text>
              )}
            </View>
          </>
        )}

        {/* Metrics Tab */}
        {state.activeTab === 'metrics' && (
          <>
            {state.viewStats && (
              <View style={dynamicStyles.card}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>View Statistics</Text>
                <View style={dynamicStyles.statRow}>
                  <Text style={dynamicStyles.statLabel}>Total Documents Viewed</Text>
                  <Text style={dynamicStyles.statValue}>{state.viewStats.totalDocumentsViewed}</Text>
                </View>
                <View style={dynamicStyles.statRow}>
                  <Text style={dynamicStyles.statLabel}>Total Views</Text>
                  <Text style={dynamicStyles.statValue}>{state.viewStats.totalViewCount}</Text>
                </View>
                <View style={[dynamicStyles.statRow, { borderBottomWidth: 0 }]}>
                  <Text style={dynamicStyles.statLabel}>Avg View Duration</Text>
                  <Text style={dynamicStyles.statValue}>
                    {Math.round(state.viewStats.averageViewDuration / 1000)}s
                  </Text>
                </View>
              </View>
            )}

            {state.signatureStats && (
              <View style={dynamicStyles.card}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Signature Statistics</Text>
                <View style={dynamicStyles.statRow}>
                  <Text style={dynamicStyles.statLabel}>Total Attempts</Text>
                  <Text style={dynamicStyles.statValue}>{state.signatureStats.totalAttempts}</Text>
                </View>
                <View style={dynamicStyles.statRow}>
                  <Text style={dynamicStyles.statLabel}>Successful</Text>
                  <Text style={dynamicStyles.statValue}>{state.signatureStats.successfulSignatures}</Text>
                </View>
                <View style={dynamicStyles.statRow}>
                  <Text style={dynamicStyles.statLabel}>Success Rate</Text>
                  <Text style={dynamicStyles.statValue}>{Math.round(state.signatureStats.successRate * 100)}%</Text>
                </View>
                <View style={[dynamicStyles.statRow, { borderBottomWidth: 0 }]}>
                  <Text style={dynamicStyles.statLabel}>Avg Time to Sign</Text>
                  <Text style={dynamicStyles.statValue}>
                    {Math.round(state.signatureStats.averageTimeToSign / 1000)}s
                  </Text>
                </View>
              </View>
            )}

            {state.report?.jurisdictionalCompliance && (
              <View style={dynamicStyles.card}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Jurisdictional Compliance</Text>
                {state.report.jurisdictionalCompliance.map((juris, index) => (
                  <View key={juris.jurisdiction} style={[dynamicStyles.statRow, index === state.report!.jurisdictionalCompliance.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={dynamicStyles.statLabel}>{juris.jurisdiction}</Text>
                    <View
                      style={[
                        dynamicStyles.statusBadge,
                        juris.isCompliant ? dynamicStyles.statusCompliant : dynamicStyles.statusNonCompliant,
                      ]}
                    >
                      <Text
                        style={[
                          dynamicStyles.statusText,
                          juris.isCompliant ? dynamicStyles.statusTextCompliant : dynamicStyles.statusTextNonCompliant,
                        ]}
                      >
                        {juris.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Export Tab */}
        {state.activeTab === 'export' && (
          <>
            <View style={dynamicStyles.card}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Export Report</Text>

              <TouchableOpacity
                style={dynamicStyles.button}
                onPress={() => handleExportReport('json')}
              >
                <Ionicons name="code-outline" size={20} color="#FFFFFF" />
                <Text style={dynamicStyles.buttonText}>Export as JSON</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={dynamicStyles.button}
                onPress={() => handleExportReport('csv')}
              >
                <Ionicons name="document-outline" size={20} color="#FFFFFF" />
                <Text style={dynamicStyles.buttonText}>Export as CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={dynamicStyles.button}
                onPress={() => handleExportReport('pdf')}
              >
                <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
                <Text style={dynamicStyles.buttonText}>Export as PDF</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.card}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Verification</Text>

              <TouchableOpacity
                style={[dynamicStyles.button, dynamicStyles.buttonSecondary]}
                onPress={handleVerifyAcceptances}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
                <Text style={[dynamicStyles.buttonText, dynamicStyles.buttonTextSecondary]}>Verify Acceptances</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 12 }}>
                Verify that all document acceptances are valid and current versions.
              </Text>
            </View>
          </>
        )}

        {state.error && (
          <View style={[dynamicStyles.card, { borderColor: '#EF4444' }]}>
            <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '500' }}>Error: {state.error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ComplianceAnalyticsScreen;
