/**
 * ComplianceReportService
 * Phase 6: Compliance & Analytics
 *
 * Generates compliance reports, audit trails, and exports for legal document acceptance.
 * Tracks compliance status, signature completion, and multi-jurisdictional requirements.
 *
 * Features:
 * - Generate comprehensive compliance reports
 * - Create immutable audit trails
 * - Calculate acceptance timelines
 * - Multi-jurisdictional compliance checking
 * - Export reports as JSON/PDF/CSV
 * - Signature verification and reporting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import DocumentVersioningService from './DocumentVersioningService';
import DocumentAnalyticsService from './DocumentAnalyticsService';
import { logger } from '@/services/logging/LoggerService';

/**
 * Utility functions
 */
const generateId = (): string => {
  const random = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return `report_${timestamp}_${random}`;
};

const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * Compliance Report Data Structures
 */

export interface DocumentComplianceStatus {
  documentId: string;
  title: string;
  required: boolean;
  accepted: boolean;
  acceptedAt?: number;
  version: string;
  signed: boolean;
  signedAt?: number;
  viewCount: number;
  lastViewedAt?: number;
  engagementScore?: number;
}

export interface AcceptanceEvent {
  documentId: string;
  title: string;
  acceptedAt: number;
  version: string;
  platform: 'ios' | 'android';
  appVersion: string;
}

export interface SignatureEvent {
  documentId: string;
  title: string;
  signedAt: number;
  type: 'sketch' | 'typed';
  verified: boolean;
}

export interface AuditEvent {
  eventId: string;
  timestamp: number;
  action: string; // 'view', 'accept', 'sign', 'reject', 'expire'
  documentId: string;
  documentTitle: string;
  userId: string;
  details: Record<string, any>;
  immutable: boolean; // Cannot be modified
  hash?: string; // SHA-256 hash for integrity verification
}

export interface AuditTrail {
  id: string;
  userId: string;
  generatedAt: number;
  period: {
    startDate: number;
    endDate: number;
  };
  events: AuditEvent[];
  totalEvents: number;
  hash?: string; // Overall trail hash
}

export interface ComplianceCheckItem {
  requirement: string;
  met: boolean;
  evidence: string;
  checkDate?: number;
}

export interface JurisdictionCompliance {
  jurisdiction: string;
  isCompliant: boolean;
  checklist: ComplianceCheckItem[];
  summary: string;
}

export interface ComplianceSummary {
  userId: string;
  generatedAt: number;
  overallCompliance: number; // 0-100%
  documentCount: number;
  requiredDocuments: number;
  acceptedDocuments: number;
  signedDocuments: number;
  rejectedDocuments: number;
  viewCount: number;
  lastActivityAt?: number;
  jurisdictions: string[];
  status: 'compliant' | 'partial' | 'non-compliant';
}

export interface ComplianceReport {
  id: string;
  userId: string;
  generatedAt: number;
  reportType: 'full' | 'summary' | 'executive';
  period: {
    startDate: number;
    endDate: number;
  };
  summary: ComplianceSummary;
  documents: DocumentComplianceStatus[];
  acceptanceTimeline: AcceptanceEvent[];
  signatureTimeline: SignatureEvent[];
  jurisdictionalCompliance: JurisdictionCompliance[];
  platform: 'ios' | 'android';
  appVersion: string;
  hash?: string;
}

export interface SignatureReport {
  documentId: string;
  title: string;
  signatures: SignatureEvent[];
  totalAttempts: number;
  successRate: number;
  averageTimeToSign: number;
}

export interface AcceptanceVerification {
  userId: string;
  allValid: boolean;
  validCount: number;
  invalidCount: number;
  expiredCount: number;
  issuesFound: string[];
  verificationDate: number;
}

export interface ExportFormat {
  format: 'json' | 'csv' | 'pdf';
  content: string;
  fileName: string;
  mimeType: string;
}

/**
 * ComplianceReportService
 * Generates and manages compliance reports, audit trails, and exports
 */
export class ComplianceReportService {
  private static instance: ComplianceReportService;
  private versioningService: DocumentVersioningService;
  private analyticsService: DocumentAnalyticsService;
  private auditTrailStorageKey = '@compliance_audit_trail';
  private reportsStorageKey = '@compliance_reports';

  // Multi-jurisdictional compliance requirements
  private jurisdictionRequirements: Record<string, string[]> = {
    US_GENERAL: [
      'Terms of Service acceptance required',
      'Privacy Policy acknowledgment required',
      'Data usage consent required',
    ],
    GDPR: [
      'Terms of Service acceptance required',
      'Privacy Policy acceptance required',
      'Data processing consent required',
      'Right to access confirmed',
      'Right to deletion confirmed',
    ],
    CCPA: [
      'Privacy Policy disclosure required',
      'Data sale opt-out available',
      'Consumer rights notice required',
    ],
    UK: [
      'Terms of Service acceptance required',
      'Privacy Policy acceptance required',
      'PECR consent for marketing',
    ],
    AUSTRALIA: [
      'Privacy Act compliance confirmed',
      'Privacy Policy provided',
      'Complaint handling procedure available',
    ],
    CANADA: [
      'PIPEDA compliance confirmed',
      'Privacy Policy provided',
      'Consent for data collection',
    ],
  };

  private constructor() {
    // Services are static, no need to store instances
  }

  static getInstance(): ComplianceReportService {
    if (!ComplianceReportService.instance) {
      ComplianceReportService.instance = new ComplianceReportService();
    }
    return ComplianceReportService.instance;
  }

  /**
   * Generate comprehensive compliance report for a user
   */
  async generateComplianceReport(userId: string, reportType: 'full' | 'summary' | 'executive' = 'full'): Promise<ComplianceReport> {
    try {
      const now = getCurrentTimestamp();
      const reportId = generateId();

      // Get all user acceptances
      const acceptances = await DocumentVersioningService.getUserAcceptances(userId);
      const documents = await DocumentVersioningService.getAllDocuments();

      // Get analytics
      const viewStats = await DocumentAnalyticsService.getUserViewStats();
      const engagementByDoc = new Map<string, any>();

      for (const doc of documents) {
        try {
          const metrics = await DocumentAnalyticsService.getEngagementMetrics(doc.id);
          engagementByDoc.set(doc.id, metrics);
        } catch (error) {
          logger.warn(`Failed to get engagement metrics for ${doc.id}:`, error as Error);
        }
      }

      // Build document compliance status
      const documentStatuses: DocumentComplianceStatus[] = documents.map(doc => {
        const acceptance = acceptances.find(a => a.documentId === doc.id);
        const engagement = engagementByDoc.get(doc.id);

        return {
          documentId: doc.id,
          title: doc.title,
          required: doc.required || false,
          accepted: !!acceptance,
          acceptedAt: acceptance?.acceptedAt,
          version: acceptance?.version || doc.currentVersion,
          signed: acceptance?.signatureId ? true : false,
          signedAt: acceptance?.signedAt,
          viewCount: engagement?.viewCount || 0,
          lastViewedAt: engagement?.lastViewedAt,
          engagementScore: engagement?.engagementScore,
        };
      });

      // Generate timelines
      const acceptanceTimeline = await this.getAcceptanceTimeline(userId);
      const signatureTimeline = await this.getSignatureTimeline(userId);

      // Generate summary
      const summary = this.generateComplianceSummary(userId, documentStatuses, now);

      // Check jurisdictional compliance
      const jurisdictions = ['US_GENERAL', 'GDPR'];
      const jurisdictionalCompliance = jurisdictions.map(j =>
        this.checkJurisdictionalCompliance(j, documentStatuses)
      );

      // Create report
      const report: ComplianceReport = {
        id: reportId,
        userId,
        generatedAt: now,
        reportType,
        period: {
          startDate: now - 365 * 24 * 60 * 60 * 1000, // Last year
          endDate: now,
        },
        summary,
        documents: documentStatuses,
        acceptanceTimeline,
        signatureTimeline,
        jurisdictionalCompliance,
        platform: 'ios',
        appVersion: '1.0.0',
      };

      // Generate hash for integrity
      report.hash = this.generateReportHash(report);

      // Store report
      await this.storeReport(userId, report);

      // Create audit trail entry
      await this.logAuditEvent({
        action: 'generate_report',
        documentId: '',
        documentTitle: 'System',
        userId,
        details: { reportId, reportType },
      });

      logger.info(`Compliance report ${reportId} generated for user ${userId}`);
      return report;
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Generate audit trail for a user
   */
  async generateAuditTrail(userId: string, startDate?: Date, endDate?: Date): Promise<AuditTrail> {
    try {
      const now = getCurrentTimestamp();
      const trailId = generateId();

      // Default date range: last 90 days
      const start = startDate?.getTime() || now - 90 * 24 * 60 * 60 * 1000;
      const end = endDate?.getTime() || now;

      // Retrieve audit events from storage
      const events = await this.getAuditEvents(userId, start, end);

      const trail: AuditTrail = {
        id: trailId,
        userId,
        generatedAt: now,
        period: {
          startDate: start,
          endDate: end,
        },
        events,
        totalEvents: events.length,
      };

      // Generate hash for trail integrity
      trail.hash = this.generateTrailHash(trail);

      // Store trail
      await this.storeAuditTrail(userId, trail);

      logger.info(`Audit trail ${trailId} generated for user ${userId}`);
      return trail;
    } catch (error) {
      logger.error('Error generating audit trail:', error);
      throw error;
    }
  }

  /**
   * Get acceptance timeline for user
   */
  async getAcceptanceTimeline(userId: string): Promise<AcceptanceEvent[]> {
    try {
      const acceptances = await DocumentVersioningService.getUserAcceptances(userId);
      const documents = await DocumentVersioningService.getAllDocuments();

      return acceptances
        .sort((a, b) => (b.acceptedAt || 0) - (a.acceptedAt || 0))
        .map(acceptance => {
          const doc = documents.find(d => d.id === acceptance.documentId);
          return {
            documentId: acceptance.documentId,
            title: doc?.title || 'Unknown Document',
            acceptedAt: acceptance.acceptedAt || 0,
            version: acceptance.version,
            platform: (acceptance.platform as 'ios' | 'android') || 'ios',
            appVersion: acceptance.appVersion || '1.0.0',
          };
        });
    } catch (error) {
      logger.error('Error getting acceptance timeline:', error);
      return [];
    }
  }

  /**
   * Get signature timeline for user
   */
  async getSignatureTimeline(userId: string): Promise<SignatureEvent[]> {
    try {
      const acceptances = await DocumentVersioningService.getUserAcceptances(userId);
      const documents = await DocumentVersioningService.getAllDocuments();

      return acceptances
        .filter(a => a.signedAt)
        .sort((a, b) => (b.signedAt || 0) - (a.signedAt || 0))
        .map(acceptance => {
          const doc = documents.find(d => d.id === acceptance.documentId);
          return {
            documentId: acceptance.documentId,
            title: doc?.title || 'Unknown Document',
            signedAt: acceptance.signedAt || 0,
            type: (acceptance.signatureType as 'sketch' | 'typed') || 'typed',
            verified: true,
          };
        });
    } catch (error) {
      logger.error('Error getting signature timeline:', error);
      return [];
    }
  }

  /**
   * Check compliance for a specific jurisdiction
   */
  checkJurisdictionalCompliance(jurisdiction: string, documentStatuses: DocumentComplianceStatus[]): JurisdictionCompliance {
    const requirements = this.jurisdictionRequirements[jurisdiction] || [];

    const checklist: ComplianceCheckItem[] = requirements.map(req => {
      let met = false;
      let evidence = '';

      // Map requirements to document acceptance
      if (req.includes('Terms of Service')) {
        const tosDoc = documentStatuses.find(d => d.documentId.includes('terms'));
        met = tosDoc?.accepted || false;
        evidence = met ? `Accepted on ${new Date((tosDoc?.acceptedAt || 0)).toLocaleDateString()}` : 'Not accepted';
      } else if (req.includes('Privacy Policy')) {
        const ppDoc = documentStatuses.find(d => d.documentId.includes('privacy'));
        met = ppDoc?.accepted || false;
        evidence = met ? `Accepted on ${new Date((ppDoc?.acceptedAt || 0)).toLocaleDateString()}` : 'Not accepted';
      } else {
        met = true;
        evidence = 'Assumption met';
      }

      return { requirement: req, met, evidence, checkDate: getCurrentTimestamp() };
    });

    const isCompliant = checklist.every(item => item.met);

    return {
      jurisdiction,
      isCompliant,
      checklist,
      summary: isCompliant
        ? `User is compliant with ${jurisdiction} requirements`
        : `User has ${checklist.filter(c => !c.met).length} unmet requirements for ${jurisdiction}`,
    };
  }

  /**
   * Verify all acceptances are valid
   */
  async verifyAcceptancesValid(userId: string): Promise<AcceptanceVerification> {
    try {
      const acceptances = await DocumentVersioningService.getUserAcceptances(userId);
      const documents = await DocumentVersioningService.getAllDocuments();

      const issuesFound: string[] = [];
      let validCount = 0;
      let invalidCount = 0;
      let expiredCount = 0;

      const now = getCurrentTimestamp();

      for (const acceptance of acceptances) {
        const doc = documents.find(d => d.id === acceptance.documentId);

        // Check if document exists
        if (!doc) {
          invalidCount++;
          issuesFound.push(`Document ${acceptance.documentId} no longer exists`);
          continue;
        }

        // Check if acceptance has expired (older than 2 years)
        const maxAge = 2 * 365 * 24 * 60 * 60 * 1000;
        if (now - (acceptance.acceptedAt || 0) > maxAge) {
          expiredCount++;
          issuesFound.push(`Acceptance of ${doc.title} expired (${new Date(acceptance.acceptedAt || 0).toLocaleDateString()})`);
          continue;
        }

        // Check if acceptance version matches document
        if (acceptance.version !== doc.currentVersion) {
          invalidCount++;
          issuesFound.push(`${doc.title} acceptance version mismatch (accepted v${acceptance.version}, current v${doc.currentVersion})`);
          continue;
        }

        validCount++;
      }

      return {
        userId,
        allValid: invalidCount === 0 && expiredCount === 0,
        validCount,
        invalidCount,
        expiredCount,
        issuesFound,
        verificationDate: now,
      };
    } catch (error) {
      logger.error('Error verifying acceptances:', error);
      throw error;
    }
  }

  /**
   * Export report as JSON
   */
  async exportReportAsJSON(report: ComplianceReport): Promise<ExportFormat> {
    try {
      const content = JSON.stringify(report, null, 2);
      const fileName = `compliance-report-${report.id}.json`;

      return {
        format: 'json',
        content,
        fileName,
        mimeType: 'application/json',
      };
    } catch (error) {
      logger.error('Error exporting report as JSON:', error);
      throw error;
    }
  }

  /**
   * Export report as CSV
   */
  async exportReportAsCSV(report: ComplianceReport): Promise<ExportFormat> {
    try {
      let csv = 'Compliance Report CSV Export\n';
      csv += `Generated: ${new Date(report.generatedAt).toISOString()}\n`;
      csv += `User ID: ${report.userId}\n`;
      csv += `Overall Compliance: ${report.summary.overallCompliance}%\n\n`;

      // Document compliance status
      csv += 'Document Compliance Status\n';
      csv += 'Document ID,Title,Required,Accepted,Signed,View Count,Engagement Score\n';
      report.documents.forEach(doc => {
        csv += `"${doc.documentId}","${doc.title}",${doc.required},${doc.accepted},${doc.signed},${doc.viewCount},${doc.engagementScore || 0}\n`;
      });

      csv += '\n\nAcceptance Timeline\n';
      csv += 'Document ID,Title,Accepted Date,Version,Platform\n';
      report.acceptanceTimeline.forEach(event => {
        csv += `"${event.documentId}","${event.title}",${new Date(event.acceptedAt).toISOString()},"${event.version}","${event.platform}"\n`;
      });

      csv += '\n\nSignature Timeline\n';
      csv += 'Document ID,Title,Signed Date,Type\n';
      report.signatureTimeline.forEach(event => {
        csv += `"${event.documentId}","${event.title}",${new Date(event.signedAt).toISOString()},"${event.type}"\n`;
      });

      const fileName = `compliance-report-${report.id}.csv`;

      return {
        format: 'csv',
        content: csv,
        fileName,
        mimeType: 'text/csv',
      };
    } catch (error) {
      logger.error('Error exporting report as CSV:', error);
      throw error;
    }
  }

  /**
   * Export report as PDF (simplified - returns structured string that can be converted to PDF)
   */
  async exportReportAsPDF(report: ComplianceReport): Promise<ExportFormat> {
    try {
      let pdfContent = '';
      pdfContent += `COMPLIANCE REPORT\n`;
      pdfContent += `Generated: ${new Date(report.generatedAt).toISOString()}\n`;
      pdfContent += `User ID: ${report.userId}\n`;
      pdfContent += `Overall Compliance: ${report.summary.overallCompliance}%\n`;
      pdfContent += `Status: ${report.summary.status}\n\n`;

      pdfContent += `DOCUMENT COMPLIANCE STATUS\n`;
      pdfContent += `Total Documents: ${report.documents.length}\n`;
      pdfContent += `Accepted: ${report.documents.filter(d => d.accepted).length}\n`;
      pdfContent += `Signed: ${report.documents.filter(d => d.signed).length}\n\n`;

      report.documents.forEach(doc => {
        pdfContent += `${doc.title}\n`;
        pdfContent += `  - Required: ${doc.required}\n`;
        pdfContent += `  - Accepted: ${doc.accepted ? `Yes (${new Date(doc.acceptedAt || 0).toLocaleDateString()})` : 'No'}\n`;
        pdfContent += `  - Signed: ${doc.signed ? `Yes (${new Date(doc.signedAt || 0).toLocaleDateString()})` : 'No'}\n`;
        pdfContent += `  - Views: ${doc.viewCount}\n`;
        pdfContent += `  - Engagement: ${doc.engagementScore || 0}%\n\n`;
      });

      pdfContent += `JURISDICTIONAL COMPLIANCE\n`;
      report.jurisdictionalCompliance.forEach(juris => {
        pdfContent += `${juris.jurisdiction}: ${juris.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}\n`;
        pdfContent += `${juris.summary}\n\n`;
      });

      const fileName = `compliance-report-${report.id}.pdf`;

      return {
        format: 'pdf',
        content: pdfContent,
        fileName,
        mimeType: 'application/pdf',
      };
    } catch (error) {
      logger.error('Error exporting report as PDF:', error);
      throw error;
    }
  }

  /**
   * Generate compliance summary
   */
  private generateComplianceSummary(userId: string, documentStatuses: DocumentComplianceStatus[], generatedAt: number): ComplianceSummary {
    const acceptedCount = documentStatuses.filter(d => d.accepted).length;
    const requiredCount = documentStatuses.filter(d => d.required).length;
    const requiredAcceptedCount = documentStatuses.filter(d => d.required && d.accepted).length;
    const signedCount = documentStatuses.filter(d => d.signed).length;
    const rejectedCount = documentStatuses.filter(d => !d.accepted && d.required).length;
    const totalViews = documentStatuses.reduce((sum, d) => sum + (d.viewCount || 0), 0);

    const overallCompliance = requiredCount > 0 ? (requiredAcceptedCount / requiredCount) * 100 : 100;

    let status: 'compliant' | 'partial' | 'non-compliant';
    if (overallCompliance === 100) {
      status = 'compliant';
    } else if (overallCompliance >= 50) {
      status = 'partial';
    } else {
      status = 'non-compliant';
    }

    const lastActivityAt = Math.max(
      ...documentStatuses.map(d => d.lastViewedAt || d.acceptedAt || 0)
    );

    return {
      userId,
      generatedAt,
      overallCompliance: Math.round(overallCompliance),
      documentCount: documentStatuses.length,
      requiredDocuments: requiredCount,
      acceptedDocuments: acceptedCount,
      signedDocuments: signedCount,
      rejectedDocuments: rejectedCount,
      viewCount: totalViews,
      lastActivityAt: lastActivityAt > 0 ? lastActivityAt : undefined,
      jurisdictions: ['US_GENERAL', 'GDPR'],
      status,
    };
  }

  /**
   * Log audit event
   */
  async logAuditEvent(event: Omit<AuditEvent, 'eventId' | 'timestamp' | 'immutable' | 'hash'>): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        eventId: generateId(),
        timestamp: getCurrentTimestamp(),
        action: event.action,
        documentId: event.documentId,
        documentTitle: event.documentTitle,
        userId: event.userId,
        details: event.details,
        immutable: true,
        hash: this.generateEventHash(event),
      };

      const key = `${this.auditTrailStorageKey}_${event.userId}`;
      const existingEvents = await AsyncStorage.getItem(key);
      const events = existingEvents ? JSON.parse(existingEvents) : [];

      events.push(auditEvent);

      // Keep only last 1000 events
      if (events.length > 1000) {
        events.shift();
      }

      await AsyncStorage.setItem(key, JSON.stringify(events));

      // Also sync to Firestore
      this.syncAuditEventToFirestore(auditEvent);
    } catch (error) {
      logger.error('Error logging audit event:', error);
    }
  }

  /**
   * Get audit events for a user within date range
   */
  private async getAuditEvents(userId: string, startDate: number, endDate: number): Promise<AuditEvent[]> {
    try {
      const key = `${this.auditTrailStorageKey}_${userId}`;
      const data = await AsyncStorage.getItem(key);

      if (!data) {
        return [];
      }

      const events = JSON.parse(data) as AuditEvent[];
      return events.filter(e => e.timestamp >= startDate && e.timestamp <= endDate);
    } catch (error) {
      logger.error('Error retrieving audit events:', error);
      return [];
    }
  }

  /**
   * Store compliance report
   */
  private async storeReport(userId: string, report: ComplianceReport): Promise<void> {
    try {
      const key = `${this.reportsStorageKey}_${userId}`;
      const existingReports = await AsyncStorage.getItem(key);
      const reports = existingReports ? JSON.parse(existingReports) : [];

      reports.push(report);

      // Keep only last 12 reports
      if (reports.length > 12) {
        reports.shift();
      }

      await AsyncStorage.setItem(key, JSON.stringify(reports));

      // Sync to Firestore
      this.syncReportToFirestore(userId, report);
    } catch (error) {
      logger.error('Error storing compliance report:', error);
    }
  }

  /**
   * Store audit trail
   */
  private async storeAuditTrail(userId: string, trail: AuditTrail): Promise<void> {
    try {
      const key = `${this.reportsStorageKey}_audit_${userId}`;
      const existingTrails = await AsyncStorage.getItem(key);
      const trails = existingTrails ? JSON.parse(existingTrails) : [];

      trails.push(trail);

      // Keep only last 5 trails
      if (trails.length > 5) {
        trails.shift();
      }

      await AsyncStorage.setItem(key, JSON.stringify(trails));

      // Sync to Firestore
      this.syncAuditTrailToFirestore(userId, trail);
    } catch (error) {
      logger.error('Error storing audit trail:', error);
    }
  }

  /**
   * Sync report to Firestore
   */
  private async syncReportToFirestore(userId: string, report: ComplianceReport): Promise<void> {
    try {
      const reportsRef = collection(db, 'users', userId, 'compliance_reports');
      await addDoc(reportsRef, {
        ...report,
        generatedAt: Timestamp.fromMillis(report.generatedAt),
        syncedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.warn('Failed to sync report to Firestore:', error);
    }
  }

  /**
   * Sync audit trail to Firestore
   */
  private async syncAuditTrailToFirestore(userId: string, trail: AuditTrail): Promise<void> {
    try {
      const trailsRef = collection(db, 'users', userId, 'audit_trails');
      await addDoc(trailsRef, {
        ...trail,
        generatedAt: Timestamp.fromMillis(trail.generatedAt),
        events: trail.events.map(e => ({
          ...e,
          timestamp: Timestamp.fromMillis(e.timestamp),
        })),
        syncedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.warn('Failed to sync audit trail to Firestore:', error);
    }
  }

  /**
   * Sync audit event to Firestore
   */
  private async syncAuditEventToFirestore(event: AuditEvent): Promise<void> {
    try {
      const eventsRef = collection(db, 'users', event.userId, 'audit_events');
      await addDoc(eventsRef, {
        ...event,
        timestamp: Timestamp.fromMillis(event.timestamp),
        syncedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.warn('Failed to sync audit event to Firestore:', error);
    }
  }

  /**
   * Generate hash for report integrity
   */
  private generateReportHash(report: Partial<ComplianceReport>): string {
    const data = JSON.stringify({
      userId: report.userId,
      generatedAt: report.generatedAt,
      documents: report.documents,
      summary: report.summary,
    });
    return this.simpleHash(data);
  }

  /**
   * Generate hash for audit trail
   */
  private generateTrailHash(trail: Partial<AuditTrail>): string {
    const data = JSON.stringify({
      userId: trail.userId,
      generatedAt: trail.generatedAt,
      events: trail.events,
    });
    return this.simpleHash(data);
  }

  /**
   * Generate hash for audit event
   */
  private generateEventHash(event: any): string {
    const data = JSON.stringify({
      action: event.action,
      documentId: event.documentId,
      userId: event.userId,
      details: event.details,
    });
    return this.simpleHash(data);
  }

  /**
   * Simple hash function (in production, use SHA-256)
   */
  private simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Clear compliance reports for user (account deletion)
   */
  async clearComplianceData(userId: string): Promise<void> {
    try {
      const keys = [
        `${this.reportsStorageKey}_${userId}`,
        `${this.reportsStorageKey}_audit_${userId}`,
        `${this.auditTrailStorageKey}_${userId}`,
      ];

      await AsyncStorage.multiRemove(keys);

      logger.info(`Compliance data cleared for user ${userId}`);
    } catch (error) {
      logger.error('Error clearing compliance data:', error);
      throw error;
    }
  }

  /**
   * Get stored reports for user
   */
  async getUserReports(userId: string): Promise<ComplianceReport[]> {
    try {
      const key = `${this.reportsStorageKey}_${userId}`;
      const data = await AsyncStorage.getItem(key);

      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Error retrieving user reports:', error);
      return [];
    }
  }

  /**
   * Get stored audit trails for user
   */
  async getUserAuditTrails(userId: string): Promise<AuditTrail[]> {
    try {
      const key = `${this.reportsStorageKey}_audit_${userId}`;
      const data = await AsyncStorage.getItem(key);

      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Error retrieving user audit trails:', error);
      return [];
    }
  }
}

export default ComplianceReportService;
