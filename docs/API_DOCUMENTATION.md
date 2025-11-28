# API Documentation

Complete API reference for all legal services in the Reading Daily Scripture App.

---

## Table of Contents

1. [DocumentAnalyticsService](#documentanalyticsservice)
2. [ComplianceReportService](#compliancereportservice)
3. [DocumentSigningService](#documentsigningservice)
4. [DocumentVersioningService](#documentversioningservice)
5. [BackupService](#backupservice)
6. [CloudBackupService](#cloudbackupservice)
7. [BackupScheduleService](#backupscheduleservice)

---

## DocumentAnalyticsService

Tracks document interactions, user engagement, and compliance metrics.

### Overview

The DocumentAnalyticsService provides comprehensive tracking of:
- Document view events with timestamps and durations
- User interactions (search, share, section expansion)
- Signature attempts and success rates
- Engagement metrics and statistics
- View history and user analytics

### Singleton Pattern

```typescript
import { DocumentAnalyticsService } from '@/services/legal/DocumentAnalyticsService';

const analytics = DocumentAnalyticsService.getInstance();
```

### Methods

#### `trackDocumentView(documentId: string): Promise<void>`

Tracks when a user views a document.

**Parameters:**
- `documentId` (string): Unique identifier of the document being viewed

**Returns:** Promise<void>

**Example:**
```typescript
await analytics.trackDocumentView('tos-001');
```

**Tracking Data:**
- Timestamp of view
- Document ID
- User ID (if authenticated)
- Platform (iOS/Android)
- App version

---

#### `trackInteraction(documentId: string, action: string, data: Record<string, any>): Promise<void>`

Tracks user interactions with documents.

**Parameters:**
- `documentId` (string): Document ID
- `action` (string): Type of interaction ('search', 'share', 'expand_section', etc.)
- `data` (object): Additional interaction metadata

**Returns:** Promise<void>

**Example:**
```typescript
await analytics.trackInteraction('tos-001', 'search', {
  query: 'warranty',
  resultsCount: 3
});
```

**Supported Actions:**
- `search`: Document search with query and result count
- `share`: Document sharing
- `expand_section`: Section expansion with section ID
- `view_complete`: View completion with duration
- `signature_complete`: Signature completion with type and time

---

#### `trackSignatureAttempt(documentId: string, success: boolean): Promise<void>`

Tracks signature capture attempts and their outcomes.

**Parameters:**
- `documentId` (string): Document ID
- `success` (boolean): Whether signature capture succeeded

**Returns:** Promise<void>

**Example:**
```typescript
await analytics.trackSignatureAttempt('tos-001', true);
```

**Tracked Data:**
- Success/failure status
- Signature type (sketch/typed)
- Time to complete
- Platform information

---

#### `getUserStatistics(): Promise<UserStatistics>`

Retrieves aggregated user statistics.

**Returns:** Promise<UserStatistics>

**Response Structure:**
```typescript
{
  totalDocumentsViewed: number;
  totalViews: number;
  averageViewDuration: number; // in seconds
  lastViewedAt: number; // timestamp
  lastViewedDocumentId?: string;
  signatureStatistics: {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    successRate: number; // 0-100
  };
}
```

**Example:**
```typescript
const stats = await analytics.getUserStatistics();
console.log(`User viewed ${stats.totalDocumentsViewed} documents`);
```

---

#### `getEngagementMetrics(): Promise<EngagementMetric[]>`

Retrieves engagement metrics for all documents.

**Returns:** Promise<EngagementMetric[]>

**Response Structure (per document):**
```typescript
{
  documentId: string;
  viewCount: number;
  engagementScore: number; // 0-100
  totalDuration: number; // seconds
  lastViewed?: number; // timestamp
}
```

**Engagement Scoring:**
- View count: 20%
- View duration: 30%
- Interactions: 30%
- Search activity: 20%

---

#### `getDocumentViews(documentId: string): Promise<DocumentView[]>`

Retrieves all view events for a specific document.

**Parameters:**
- `documentId` (string): Document ID

**Returns:** Promise<DocumentView[]>

**Response Structure (per view):**
```typescript
{
  id: string;
  documentId: string;
  userId: string;
  viewedAt: number; // timestamp
  duration: number; // seconds
  platform: 'ios' | 'android';
  appVersion: string;
}
```

---

#### `clearUserData(): Promise<void>`

Clears all analytics data for the current user (GDPR compliance).

**Returns:** Promise<void>

**Example:**
```typescript
await analytics.clearUserData(); // Account deletion
```

---

### Events and Listeners

Analytics events can be monitored for real-time tracking:

```typescript
// Subscribe to view events
analytics.on('viewStarted', (event) => {
  console.log(`User viewing: ${event.documentId}`);
});

// Subscribe to interaction events
analytics.on('interactionTracked', (event) => {
  console.log(`Interaction: ${event.action}`);
});
```

---

## ComplianceReportService

Generates compliance reports, manages audit trails, and verifies document acceptances.

### Overview

The ComplianceReportService provides:
- Compliance report generation (full, summary, executive)
- Audit trail logging for all document actions
- Acceptance verification and expiration tracking
- Report export (JSON, CSV, PDF)
- Jurisdictional compliance checking (GDPR, CCPA, UK, AU, Canada)

### Singleton Pattern

```typescript
import { ComplianceReportService } from '@/services/legal/ComplianceReportService';

const compliance = ComplianceReportService.getInstance();
```

### Methods

#### `generateComplianceReport(type: 'full' | 'summary' | 'executive'): Promise<ComplianceReport>`

Generates a compliance report with document acceptance status.

**Parameters:**
- `type` (string): Report type
  - `full`: Complete report with all details
  - `summary`: Condensed report with key metrics
  - `executive`: High-level overview for executives

**Returns:** Promise<ComplianceReport>

**Response Structure:**
```typescript
{
  reportId: string;
  userId: string;
  generatedAt: number;
  reportType: string;
  documentStatuses: DocumentStatus[];
  overallCompliancePercentage: number; // 0-100
  acceptanceTimeline: AcceptanceEvent[];
  signatureTimeline: SignatureEvent[];
  auditTrail: AuditEvent[];
  jurisdictionalStatus: {
    gdpr: 'compliant' | 'non-compliant' | 'unknown';
    ccpa: 'compliant' | 'non-compliant' | 'unknown';
    uk: 'compliant' | 'non-compliant' | 'unknown';
    australia: 'compliant' | 'non-compliant' | 'unknown';
    canada: 'compliant' | 'non-compliant' | 'unknown';
  };
}
```

**Example:**
```typescript
const report = await compliance.generateComplianceReport('full');
console.log(`Compliance: ${report.overallCompliancePercentage}%`);
```

---

#### `logAuditEvent(event: AuditEvent): Promise<void>`

Logs an audit event for compliance tracking.

**Parameters:**
- `event` (object): Audit event details

**Audit Event Structure:**
```typescript
{
  action: string; // 'view', 'accept', 'sign', etc.
  documentId: string;
  documentTitle: string;
  userId?: string;
  timestamp?: number;
  details?: {
    [key: string]: any;
  };
}
```

**Example:**
```typescript
await compliance.logAuditEvent({
  action: 'sign',
  documentId: 'tos-001',
  documentTitle: 'Terms of Service',
  details: {
    signatureType: 'sketch',
    timeToSign: 125
  }
});
```

---

#### `getAuditTrail(documentId?: string): Promise<AuditEvent[]>`

Retrieves the audit trail for a document or all documents.

**Parameters:**
- `documentId` (string, optional): Specific document ID

**Returns:** Promise<AuditEvent[]>

**Example:**
```typescript
const trail = await compliance.getAuditTrail('tos-001');
console.log(`${trail.length} events in audit trail`);
```

---

#### `verifyAcceptances(): Promise<VerificationResult>`

Verifies all document acceptances for validity and expiration.

**Returns:** Promise<VerificationResult>

**Response Structure:**
```typescript
{
  valid: number;
  invalid: number;
  expired: number;
  allValid: boolean;
  details: {
    documentId: string;
    status: 'valid' | 'invalid' | 'expired';
    reason?: string;
  }[];
}
```

**Example:**
```typescript
const result = await compliance.verifyAcceptances();
if (result.allValid) {
  console.log('All acceptances are valid');
} else {
  console.log(`${result.invalid} invalid, ${result.expired} expired`);
}
```

---

#### `exportToJSON(): Promise<string>`

Exports the compliance report as JSON.

**Returns:** Promise<string> - JSON string

**Example:**
```typescript
const jsonData = await compliance.exportToJSON();
const report = JSON.parse(jsonData);
```

---

#### `exportToCSV(): Promise<string>`

Exports the compliance report as CSV.

**Returns:** Promise<string> - CSV formatted string

**Example:**
```typescript
const csvData = await compliance.exportToCSV();
// Can be saved to file or shared
```

---

#### `exportToPDF(): Promise<Blob>`

Exports the compliance report as PDF.

**Returns:** Promise<Blob>

**Example:**
```typescript
const pdfBlob = await compliance.exportToPDF();
// Save to device or share
```

---

### Jurisdictional Compliance

The service automatically checks compliance with:
- **GDPR** (EU): General Data Protection Regulation
- **CCPA** (California): California Consumer Privacy Act
- **UK PDPA** (UK): UK Privacy standards
- **Privacy Act** (Australia): Australian privacy requirements
- **PIPEDA** (Canada): Personal Information Protection Act

---

## DocumentSigningService

Manages digital signature capture, storage, and verification.

### Overview

The DocumentSigningService provides:
- Signature capture (sketch and typed)
- Signature verification and validation
- Signature expiration tracking (1 year default)
- Tamper detection
- Platform-specific signature handling

### Singleton Pattern

```typescript
import DocumentSigningService from '@/services/legal/DocumentSigningService';

// Note: This is a static utility, not a singleton instance
```

### Methods

#### `captureSignature(documentId: string, signature: CapturedSignature, appVersion: string, platform: 'ios' | 'android'): Promise<DocumentSignature | null>`

Captures and stores a digital signature.

**Parameters:**
- `documentId` (string): Document being signed
- `signature` (object): Signature data
  ```typescript
  {
    type: 'sketch' | 'typed';
    data: string; // Base64 encoded for sketch
    name?: string; // For typed signatures
    timestamp: number;
  }
  ```
- `appVersion` (string): Current app version
- `platform` (string): 'ios' or 'android'

**Returns:** Promise<DocumentSignature | null>

**Response Structure:**
```typescript
{
  id: string;
  documentId: string;
  userId: string;
  type: 'sketch' | 'typed';
  capturedAt: number;
  expiresAt: number; // 1 year from capture
  platform: 'ios' | 'android';
  appVersion: string;
  hash: string; // SHA-256 hash for verification
}
```

**Example:**
```typescript
const signature = await DocumentSigningService.captureSignature(
  'tos-001',
  {
    type: 'sketch',
    data: 'base64data...',
    timestamp: Date.now()
  },
  '1.0.0',
  'ios'
);
```

---

#### `verifySignature(signatureId: string): Promise<SignatureVerification>`

Verifies a signature's integrity and validity.

**Parameters:**
- `signatureId` (string): Signature ID to verify

**Returns:** Promise<SignatureVerification>

**Response Structure:**
```typescript
{
  signatureId: string;
  isValid: boolean;
  isTampered: boolean;
  isExpired: boolean;
  expiresAt: number;
  verifiedAt: number;
}
```

**Example:**
```typescript
const verification = await DocumentSigningService.verifySignature('sig-001');
if (verification.isValid && !verification.isTampered) {
  console.log('Signature is valid');
}
```

---

#### `getUserSignatures(userId: string): Promise<DocumentSignature[]>`

Retrieves all signatures for a user.

**Parameters:**
- `userId` (string): User ID

**Returns:** Promise<DocumentSignature[]>

**Example:**
```typescript
const signatures = await DocumentSigningService.getUserSignatures('user-001');
console.log(`User has ${signatures.length} signatures`);
```

---

#### `deleteSignature(signatureId: string): Promise<boolean>`

Deletes a signature record.

**Parameters:**
- `signatureId` (string): Signature ID

**Returns:** Promise<boolean> - Success status

**Example:**
```typescript
const deleted = await DocumentSigningService.deleteSignature('sig-001');
```

---

#### `clearUserSignatures(userId: string): Promise<boolean>`

Deletes all signatures for a user (GDPR compliance).

**Parameters:**
- `userId` (string): User ID

**Returns:** Promise<boolean> - Success status

**Example:**
```typescript
await DocumentSigningService.clearUserSignatures('user-001');
```

---

### Signature Types

#### Sketch Signatures
- Canvas-based drawing
- Captured as image data
- Platform: iOS and Android
- Time to capture: 30-120 seconds typical

#### Typed Signatures
- User types their name
- Simpler, faster method
- Good for accessibility
- Time to capture: 5-10 seconds typical

---

## DocumentVersioningService

Manages document versions and tracks user acceptances.

### Overview

The DocumentVersioningService provides:
- Document version management
- Acceptance recording with metadata
- Acceptance status tracking
- Signature integration
- Version history retrieval

### Singleton Pattern

```typescript
import DocumentVersioningService from '@/services/legal/DocumentVersioningService';

// Note: This is a static utility, not a singleton instance
```

### Methods

#### `recordAcceptance(documentId: string, userId: string, version: string, platform: 'ios' | 'android', appVersion: string, signatureId?: string): Promise<boolean>`

Records document acceptance by a user.

**Parameters:**
- `documentId` (string): Document ID
- `userId` (string): User ID
- `version` (string): Document version (e.g., "1.0.0")
- `platform` (string): 'ios' or 'android'
- `appVersion` (string): App version at time of acceptance
- `signatureId` (string, optional): Associated signature ID

**Returns:** Promise<boolean> - Success status

**Example:**
```typescript
const recorded = await DocumentVersioningService.recordAcceptance(
  'tos-001',
  'user-001',
  '1.0.0',
  'ios',
  '1.0.0',
  'sig-001'
);
```

**Stored Data:**
- Acceptance timestamp
- Document version
- Platform and app version
- Signature reference
- User ID

---

#### `getDocumentVersion(documentId: string): Promise<string>`

Retrieves the current version of a document.

**Parameters:**
- `documentId` (string): Document ID

**Returns:** Promise<string> - Version string

**Example:**
```typescript
const version = await DocumentVersioningService.getDocumentVersion('tos-001');
console.log(`Current version: ${version}`);
```

---

#### `getAcceptanceHistory(documentId: string, userId: string): Promise<Acceptance[]>`

Retrieves acceptance history for a user and document.

**Parameters:**
- `documentId` (string): Document ID
- `userId` (string): User ID

**Returns:** Promise<Acceptance[]>

**Response Structure (per acceptance):**
```typescript
{
  id: string;
  documentId: string;
  userId: string;
  acceptedAt: number;
  documentVersion: string;
  platform: 'ios' | 'android';
  appVersion: string;
  signatureId?: string;
}
```

**Example:**
```typescript
const history = await DocumentVersioningService.getAcceptanceHistory('tos-001', 'user-001');
console.log(`Document accepted ${history.length} times`);
```

---

#### `getUserAcceptances(userId: string): Promise<Acceptance[]>`

Retrieves all acceptances for a user.

**Parameters:**
- `userId` (string): User ID

**Returns:** Promise<Acceptance[]>

**Example:**
```typescript
const acceptances = await DocumentVersioningService.getUserAcceptances('user-001');
```

---

#### `hasDocumentBeenAccepted(documentId: string, userId: string): Promise<boolean>`

Checks if a user has accepted a document.

**Parameters:**
- `documentId` (string): Document ID
- `userId` (string): User ID

**Returns:** Promise<boolean>

**Example:**
```typescript
const accepted = await DocumentVersioningService.hasDocumentBeenAccepted('tos-001', 'user-001');
if (!accepted) {
  // Show document for acceptance
}
```

---

#### `getDocumentsRequiringSignature(): Promise<string[]>`

Gets all document IDs that require signatures.

**Returns:** Promise<string[]> - Array of document IDs

**Example:**
```typescript
const requiresSignature = await DocumentVersioningService.getDocumentsRequiringSignature();
```

---

#### `getPendingSignatures(userId: string): Promise<PendingSignature[]>`

Gets documents waiting for user signatures.

**Parameters:**
- `userId` (string): User ID

**Returns:** Promise<PendingSignature[]>

**Response Structure (per pending):**
```typescript
{
  documentId: string;
  title: string;
  acceptedAt: number;
  signatureDeadline?: number;
}
```

**Example:**
```typescript
const pending = await DocumentVersioningService.getPendingSignatures('user-001');
console.log(`${pending.length} documents awaiting signature`);
```

---

#### `linkSignatureToAcceptance(documentId: string, signatureId: string): Promise<boolean>`

Links a signature to a document acceptance.

**Parameters:**
- `documentId` (string): Document ID
- `signatureId` (string): Signature ID

**Returns:** Promise<boolean> - Success status

**Example:**
```typescript
const linked = await DocumentVersioningService.linkSignatureToAcceptance('tos-001', 'sig-001');
```

---

## BackupService

Manages local backup creation, restoration, and verification.

### Overview

The BackupService provides:
- Local backup creation with compression
- Password-protected backups
- Backup restoration with verification
- Integrity checking via checksums
- Backup management (list, delete, verify)

### Singleton Pattern

```typescript
import BackupService from '@/services/legal/BackupService';

// Static methods, not instance-based
```

### Methods

#### `createLocalBackup(password?: string): Promise<BackupFile | null>`

Creates a local backup of all user data.

**Parameters:**
- `password` (string, optional): Password for encryption

**Returns:** Promise<BackupFile | null>

**Response Structure:**
```typescript
{
  id: string;
  fileUri: string;
  createdAt: number;
  size: number; // bytes
  verified: boolean;
  encrypted: boolean;
  contents: {
    documentCount: number;
    acceptanceCount: number;
    signatureCount: number;
  };
}
```

**Example:**
```typescript
const backup = await BackupService.createLocalBackup('SecurePass123!');
if (backup) {
  console.log(`Backup created: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
}
```

**Backup Contents:**
- All legal documents
- User acceptances
- Signatures
- Analytics data
- Audit trail
- Settings

---

#### `restoreFromLocalBackup(fileUri: string, password?: string): Promise<boolean>`

Restores data from a local backup.

**Parameters:**
- `fileUri` (string): Path to backup file
- `password` (string, optional): Password for encrypted backup

**Returns:** Promise<boolean> - Success status

**Example:**
```typescript
const success = await BackupService.restoreFromLocalBackup(
  '/path/to/backup.zip',
  'SecurePass123!'
);
```

**Warning:** Restore overwrites current data.

---

#### `getLocalBackups(): Promise<BackupFile[]>`

Retrieves list of local backups.

**Returns:** Promise<BackupFile[]>

**Example:**
```typescript
const backups = await BackupService.getLocalBackups();
console.log(`${backups.length} local backups available`);
```

---

#### `deleteLocalBackup(backupId: string): Promise<boolean>`

Deletes a local backup.

**Parameters:**
- `backupId` (string): Backup ID

**Returns:** Promise<boolean> - Success status

**Example:**
```typescript
const deleted = await BackupService.deleteLocalBackup('backup-001');
```

---

#### `verifyBackupIntegrity(backupId: string): Promise<boolean>`

Verifies backup integrity via checksum validation.

**Parameters:**
- `backupId` (string): Backup ID

**Returns:** Promise<boolean> - Integrity status

**Example:**
```typescript
const isValid = await BackupService.verifyBackupIntegrity('backup-001');
```

---

## CloudBackupService

Manages cloud backup upload, download, and synchronization.

### Overview

The CloudBackupService provides:
- Cloud backup upload/download
- Firestore-based backup storage
- Automatic cloud synchronization
- Backup versioning
- Monthly cleanup of old backups

### Singleton Pattern

```typescript
import CloudBackupService from '@/services/legal/CloudBackupService';

// Static methods
```

### Methods

#### `uploadBackupToCloud(userId: string, localBackupPath: string): Promise<CloudBackup | null>`

Uploads a backup to cloud storage.

**Parameters:**
- `userId` (string): User ID
- `localBackupPath` (string): Path to local backup file

**Returns:** Promise<CloudBackup | null>

**Response Structure:**
```typescript
{
  id: string;
  cloudId: string;
  userId: string;
  createdAt: number;
  size: number;
  verified: boolean;
  encrypted: boolean;
  contents: {
    documentCount: number;
    acceptanceCount: number;
    signatureCount: number;
  };
}
```

**Example:**
```typescript
const cloudBackup = await CloudBackupService.uploadBackupToCloud(
  'user-001',
  '/path/to/backup.zip'
);
```

---

#### `downloadBackupFromCloud(userId: string, cloudId: string): Promise<string | null>`

Downloads a backup from cloud.

**Parameters:**
- `userId` (string): User ID
- `cloudId` (string): Cloud backup ID

**Returns:** Promise<string | null> - Path to downloaded file

**Example:**
```typescript
const localPath = await CloudBackupService.downloadBackupFromCloud(
  'user-001',
  'cloud-backup-001'
);
```

---

#### `getCloudBackups(userId: string): Promise<CloudBackup[]>`

Retrieves list of cloud backups for a user.

**Parameters:**
- `userId` (string): User ID

**Returns:** Promise<CloudBackup[]>

**Example:**
```typescript
const cloudBackups = await CloudBackupService.getCloudBackups('user-001');
```

---

#### `deleteCloudBackup(userId: string, cloudId: string): Promise<boolean>`

Deletes a cloud backup.

**Parameters:**
- `userId` (string): User ID
- `cloudId` (string): Cloud backup ID

**Returns:** Promise<boolean> - Success status

**Example:**
```typescript
const deleted = await CloudBackupService.deleteCloudBackup('user-001', 'cloud-backup-001');
```

---

#### `syncBackupToCloud(userId: string): Promise<CloudBackup | null>`

Syncs local backup to cloud (creates if needed).

**Parameters:**
- `userId` (string): User ID

**Returns:** Promise<CloudBackup | null>

**Example:**
```typescript
const synced = await CloudBackupService.syncBackupToCloud('user-001');
```

---

## BackupScheduleService

Manages automatic backup scheduling.

### Overview

The BackupScheduleService provides:
- Enable/disable auto-backup
- Monthly backup scheduling
- Retry logic (max 3 attempts)
- Schedule status tracking
- Days until next backup calculation

### Singleton Pattern

```typescript
import BackupScheduleService from '@/services/legal/BackupScheduleService';

// Static methods
```

### Methods

#### `setAutoBackupEnabled(enabled: boolean): Promise<void>`

Enables or disables automatic backups.

**Parameters:**
- `enabled` (boolean): Enable/disable status

**Returns:** Promise<void>

**Example:**
```typescript
await BackupScheduleService.setAutoBackupEnabled(true);
```

---

#### `isAutoBackupEnabled(): Promise<boolean>`

Checks if auto-backup is enabled.

**Returns:** Promise<boolean>

**Example:**
```typescript
const enabled = await BackupScheduleService.isAutoBackupEnabled();
```

---

#### `initializeMonthlySchedule(): Promise<void>`

Sets up monthly automatic backup schedule.

**Returns:** Promise<void>

**Schedule:** Monthly, automatic retry up to 3 times on failure

**Example:**
```typescript
await BackupScheduleService.initializeMonthlySchedule();
```

---

#### `getLastBackupTime(): Promise<Date | null>`

Gets timestamp of last backup.

**Returns:** Promise<Date | null>

**Example:**
```typescript
const lastBackup = await BackupScheduleService.getLastBackupTime();
if (lastBackup) {
  console.log(`Last backup: ${lastBackup.toLocaleDateString()}`);
}
```

---

#### `getNextBackupTime(): Promise<Date | null>`

Gets scheduled time of next backup.

**Returns:** Promise<Date | null>

**Example:**
```typescript
const nextBackup = await BackupScheduleService.getNextBackupTime();
```

---

#### `getDaysUntilNextBackup(): Promise<number>`

Calculates days until next scheduled backup.

**Returns:** Promise<number> - Days remaining (-1 if not scheduled)

**Example:**
```typescript
const days = await BackupScheduleService.getDaysUntilNextBackup();
console.log(`Next backup in ${days} days`);
```

---

#### `triggerBackupNow(userId: string): Promise<boolean>`

Triggers a backup immediately, outside normal schedule.

**Parameters:**
- `userId` (string): User ID

**Returns:** Promise<boolean> - Success status

**Example:**
```typescript
const success = await BackupScheduleService.triggerBackupNow('user-001');
```

---

#### `cleanupOldBackups(): Promise<number>`

Removes backups older than 1 year.

**Returns:** Promise<number> - Number of backups deleted

**Example:**
```typescript
const deleted = await BackupScheduleService.cleanupOldBackups();
console.log(`Cleaned up ${deleted} old backups`);
```

---

### Schedule Details

**Default Configuration:**
- Frequency: Monthly
- Retry attempts: 3
- Retry delay: 5 minutes between attempts
- Cleanup interval: Monthly
- Retention period: 1 year

---

## Error Handling

All services implement standardized error handling:

```typescript
try {
  const result = await service.method();
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof NetworkError) {
    // Handle network errors
  } else if (error instanceof StorageError) {
    // Handle storage errors
  } else {
    // Handle unknown errors
  }
}
```

---

## Rate Limiting

Some operations implement rate limiting to prevent abuse:

- Document view tracking: 1 per second per document
- Export operations: 5 per minute per user
- Backup creation: 1 per hour per user
- Cloud operations: Firestore rate limits apply

---

## Data Privacy & Security

All services implement:

- **Encryption**: Password-protected backups use AES-256
- **Hashing**: SHA-256 for integrity verification
- **GDPR Compliance**: Data deletion methods available
- **Audit Trails**: All actions logged for compliance
- **Secure Storage**: AsyncStorage with encryption where possible

---

## Timestamps & Timezone

All timestamps are in milliseconds since epoch (JavaScript standard):

```typescript
const timestamp = Date.now(); // Current timestamp in ms
const date = new Date(timestamp); // Convert to Date object
```

Timezones are handled by the client based on device settings.

---

## Testing

All services have comprehensive test coverage:

- Unit tests: >90% coverage
- Integration tests: Multi-service workflows
- E2E tests: Complete user journeys
- Mock data fixtures: Test-ready data

Run tests with:
```bash
npm run test:services
npm run test:integration
npm run test:e2e
```

---

## Migration Guide

### From v0.x to v1.0

1. **Analytics Service**: Now tracks by default, disable with `enabled: false` in config
2. **Compliance Report**: Changed from automatic to on-demand generation
3. **Backup Service**: Password protection now available
4. **Cloud Backup**: New feature requiring authentication setup

---

## Support & Issues

For issues or questions:
- Check documentation at `/docs`
- Review test files for usage examples
- File issues at project repository
- Contact legal@example.com for compliance questions

---

**Last Updated:** January 2024
**Documentation Version:** 1.0.0
