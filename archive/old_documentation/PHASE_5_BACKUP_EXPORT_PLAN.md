# Phase 5: Backup & Export System

**Status:** Planning & Implementation
**Timeline:** 10-12 days
**Priority:** HIGH (Data Protection & Recovery)

---

## Executive Summary

Implement comprehensive backup and export system for legal documents and signatures. Users can:
- Export all documents as ZIP file to device
- Backup to cloud (Firestore) automatically
- Restore from backup on new device
- Schedule monthly automatic backups
- Password-protect backups (optional)

---

## Objectives

✅ Local ZIP backup of all documents + signatures
✅ Cloud backup to Firestore (encrypted)
✅ Device restore flow for account recovery
✅ Monthly scheduled backups
✅ Backup versioning and history
✅ Export compliance reports
✅ Automatic cleanup of old backups
✅ Restore from previous versions

---

## Architecture Overview

```
Backup System Architecture

┌─────────────────────────────────────────────────────┐
│         User Initiates Backup/Export                 │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    ┌────────────┐         ┌──────────────┐
    │   Export   │         │   Backup     │
    │  (ZIP)     │         │  (Cloud)     │
    └─────┬──────┘         └──────┬───────┘
          │                       │
          ▼                       ▼
    ┌──────────────┐      ┌──────────────────┐
    │BackupService │      │CloudBackupService│
    └──────┬───────┘      └────────┬─────────┘
           │                       │
    ┌──────┴──────┐      ┌────────┴────────┐
    │ Collections  │      │  Firestore      │
    ├─ Documents  │      ├─ /backups/*     │
    ├─ Signatures │      ├─ Metadata       │
    ├─ Acceptances│      └─ Encryption     │
    └──────────────┘

┌──────────────────────────────────────────────┐
│    Scheduled Backup (Background Task)         │
├──────────────────────────────────────────────┤
│ • Monthly schedule                           │
│ • Check if online                            │
│ • Run backup (compress + encrypt)            │
│ • Upload to Firestore                        │
│ • Cleanup old backups (keep 12 months)       │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│    Device Restore (New Device/Account)        │
├──────────────────────────────────────────────┤
│ • User enters backup password                │
│ • Download backup from Firestore             │
│ • Decompress ZIP file                        │
│ • Restore all documents + signatures         │
│ • Verify integrity (hashes)                  │
│ • Restore acceptance records                 │
└──────────────────────────────────────────────┘
```

---

## Services to Create

### 1. BackupService (NEW)
**File:** `/src/services/legal/BackupService.ts`
**Purpose:** Manage local backup creation and restoration
**Size:** ~350-400 lines

**Key Methods:**
```typescript
// Create local ZIP backup
createLocalBackup(password?: string): Promise<BackupFile>

// Export documents as ZIP
exportDocumentsAsZip(): Promise<string> // Returns file URI

// List local backups
getLocalBackups(): Promise<BackupFile[]>

// Restore from local backup
restoreFromLocalBackup(backupUri: string, password?: string): Promise<boolean>

// Get backup metadata
getBackupMetadata(backupUri: string): Promise<BackupMetadata>

// Verify backup integrity
verifyBackupIntegrity(backupUri: string): Promise<BackupVerification>

// Delete backup
deleteLocalBackup(backupId: string): Promise<boolean>

// Calculate backup size
getBackupSize(backupUri: string): Promise<number>
```

**Backup Structure:**
```
backup-2025-01-27-12-30-45.zip
├── metadata.json
│   ├── createdAt
│   ├── userId
│   ├── version
│   ├── appVersion
│   └── checksums
├── documents/
│   ├── privacy-policy.md
│   ├── terms-of-service.md
│   └── ... (all 6 documents)
├── signatures/
│   ├── {signature-id-1}.json
│   ├── {signature-id-2}.json
│   └── ... (all signatures)
├── acceptances/
│   ├── {document-id-1}.json
│   ├── {document-id-2}.json
│   └── ... (all acceptances)
└── history.json
    ├── All signature timestamps
    ├── Acceptance history
    └── Modification log
```

### 2. CloudBackupService (NEW)
**File:** `/src/services/legal/CloudBackupService.ts`
**Purpose:** Manage cloud backup to Firestore
**Size:** ~300-350 lines

**Key Methods:**
```typescript
// Upload backup to Firestore
uploadBackup(backup: BackupFile, password?: string): Promise<CloudBackup>

// List cloud backups
getCloudBackups(userId: string): Promise<CloudBackup[]>

// Download backup from cloud
downloadBackup(backupId: string, password?: string): Promise<BackupFile>

// Restore from cloud backup
restoreFromCloud(backupId: string, password?: string): Promise<boolean>

// Delete cloud backup
deleteCloudBackup(backupId: string): Promise<boolean>

// Get backup versioning history
getBackupVersionHistory(userId: string): Promise<BackupVersion[]>

// Auto-upload backup
autoUploadBackup(): Promise<CloudBackup | null>

// Schedule monthly backup
scheduleMonthlyBackup(): Promise<void>

// Cleanup old backups (keep 12 months)
cleanupOldBackups(retentionMonths?: number): Promise<void>
```

**Cloud Storage Structure:**
```
Firestore: /backups/{userId}/
├── /backups/{userId}/metadata
│   ├── lastBackup: timestamp
│   ├── backupCount: number
│   ├── totalSize: bytes
│   └── autoBackupEnabled: boolean
├── /backups/{userId}/versions/{backupId}
│   ├── createdAt: timestamp
│   ├── size: bytes
│   ├── encrypted: boolean
│   ├── compressedSize: bytes
│   ├── fileUrl: Cloud Storage URL
│   ├── checksums: verification hashes
│   └── metadata: backup contents summary
└── /backups/{userId}/schedule
    ├── enabled: boolean
    ├── frequency: 'monthly'
    ├── lastRun: timestamp
    └── nextRun: timestamp
```

### 3. BackupScheduleService (NEW)
**File:** `/src/services/legal/BackupScheduleService.ts`
**Purpose:** Manage background backup scheduling
**Size:** ~250-300 lines

**Key Methods:**
```typescript
// Enable/disable auto backups
setAutoBackupEnabled(enabled: boolean): Promise<void>

// Get schedule status
getScheduleStatus(): Promise<ScheduleStatus>

// Trigger monthly backup (if due)
checkAndRunScheduledBackup(): Promise<void>

// Manually trigger backup
triggerBackupNow(): Promise<CloudBackup | null>

// Get next backup time
getNextBackupTime(): Promise<Date | null>

// Clear schedule
clearSchedule(): Promise<void>
```

---

## UI Components & Screens

### BackupExportScreen (NEW)
**File:** `/src/screens/legal/BackupExportScreen.tsx`
**Purpose:** UI for backup, export, and restore operations
**Size:** ~500-600 lines

**Tabs/Sections:**

1. **Backup Tab**
   - Last backup timestamp
   - Backup size and info
   - "Create Backup Now" button
   - Auto-backup toggle
   - Backup history list

2. **Export Tab**
   - "Export as ZIP" button
   - Choose export options:
     - Include documents
     - Include signatures
     - Include acceptance history
   - Password protection toggle
   - Export location selection

3. **Restore Tab**
   - "Restore from File" button
   - "Restore from Cloud" option
   - Backup file selector
   - Password input (if encrypted)
   - Verification before restore
   - Restore progress indicator

4. **History Tab**
   - List of all backups (local + cloud)
   - Backup timestamp, size, type
   - Delete button per backup
   - Restore button per backup
   - Download button for cloud backups

### Components

**BackupCard** - Display individual backup info
- Timestamp and size
- Type (local/cloud)
- Status (verified/needs verification)
- Actions (restore, download, delete)

**BackupProgress** - Show backup/restore progress
- Progress bar
- Current step (compressing, encrypting, uploading)
- Time remaining estimate
- Cancel button

---

## Data Structures

### BackupFile
```typescript
interface BackupFile {
  id: string; // UUID
  userId: string;
  createdAt: number;
  version: string;
  appVersion: string;
  size: number;
  compressedSize: number;
  encrypted: boolean;
  password?: string; // Hashed, optional
  fileUri: string; // Local path or Cloud Storage URL
  checksums: {
    documents: string; // SHA256
    signatures: string;
    acceptances: string;
    metadata: string;
  };
  verified: boolean;
  verifiedAt?: number;
  contents: {
    documentCount: number;
    signatureCount: number;
    acceptanceCount: number;
  };
}
```

### BackupMetadata
```typescript
interface BackupMetadata {
  id: string;
  createdAt: number;
  userId: string;
  appVersion: string;
  version: string;
  documentCount: number;
  signatureCount: number;
  acceptanceCount: number;
  totalSize: number;
  checksums: Record<string, string>;
}
```

### CloudBackup (extends BackupFile)
```typescript
interface CloudBackup extends BackupFile {
  cloudId: string; // Firestore doc ID
  storageUrl: string;
  uploadedAt: number;
  lastDownloadedAt?: number;
  downloadCount: number;
}
```

### BackupVerification
```typescript
interface BackupVerification {
  isValid: boolean;
  integrityOk: boolean;
  contentsVerified: boolean;
  reason?: string;
  errors: string[];
}
```

---

## Implementation Steps

### Week 1
- [ ] Day 1-2: Design and create BackupService
- [ ] Day 3: Implement local ZIP creation
- [ ] Day 4: Implement local restore flow
- [ ] Day 5: Add backup verification/hashing

### Week 2
- [ ] Day 6: Create CloudBackupService
- [ ] Day 7: Implement Firestore upload/download
- [ ] Day 8: Create BackupScheduleService
- [ ] Day 9: Create BackupExportScreen
- [ ] Day 10: Integrate with navigation
- [ ] Day 11-12: Testing and refinement

---

## Dependencies & Libraries

**Required:**
- `react-native-zip-archive` - ZIP compression
- `react-native-documents` - File picker for restore
- `crypto-js` - AES encryption for backups
- `expo-file-system` - Local file operations

**Already Available:**
- AsyncStorage (local data)
- Firebase/Firestore (cloud storage)
- Zustand (auth store)

---

## Security Considerations

✅ **Local Encryption**
- Optional password protection for ZIP backups
- AES-256 encryption for sensitive data
- Hash verification (SHA-256) for all contents

✅ **Cloud Security**
- Firestore security rules (user-only access)
- Encrypted transfer (HTTPS)
- At-rest encryption in Firestore
- Automatic cleanup of old backups

✅ **Data Privacy**
- No backup data in app logs
- Secure deletion (overwrite before delete)
- User consent for cloud backup
- Clear data retention policies

---

## Integration Points

### Settings Screen
Add "Backup & Export" option that navigates to BackupExportScreen

### App Launch (_layout.tsx)
- Check if scheduled backup is due
- Auto-backup if enabled and online
- Show notification if backup fails

### Account Deletion
- Automatically delete all backups
- Clear cloud backup records
- Overwrite local files

---

## Testing Checklist

- [ ] Create local ZIP backup
- [ ] ZIP contains all documents
- [ ] ZIP contains all signatures
- [ ] ZIP contains acceptance history
- [ ] Backup can be verified (hashes match)
- [ ] Password protection works
- [ ] Restore from ZIP works
- [ ] Restore overwrites old data
- [ ] Firestore upload works
- [ ] Firestore download works
- [ ] Cloud backup encryption works
- [ ] Monthly schedule works
- [ ] Old backups auto-cleanup works
- [ ] Backup size calculation correct
- [ ] Network error handling works
- [ ] Restore shows progress
- [ ] Cancel restore works
- [ ] Multiple backups can be stored
- [ ] Dark/light mode works
- [ ] Accessibility features work

---

## Success Metrics

📊 Users can backup all documents locally
📊 Users can export as ZIP for sharing
📊 Cloud backups sync automatically
📊 Users can restore on new device
📊 All signatures preserved in backup
📊 Acceptance history preserved
📊 Backup integrity verified
📊 Monthly backups automated
📊 Zero data loss during restore
📊 Encryption working properly

---

## Phase Deliverables

✅ BackupService (complete API)
✅ CloudBackupService (complete API)
✅ BackupScheduleService (scheduling)
✅ BackupExportScreen (full UI)
✅ Encryption/Decryption system
✅ Local ZIP creation & restore
✅ Cloud backup sync
✅ Backup verification system
✅ Monthly scheduling
✅ Comprehensive documentation
✅ Testing checklist & validation

---

## What's Next

**Phase 6:** Compliance & Analytics
- Document view tracking
- Signature analytics
- Acceptance analytics
- Compliance reports with detailed stats

**Phase 7:** Testing & Documentation
- Unit tests for all services
- Integration tests
- E2E tests for workflows
- User guides

**Phase 8:** Deployment & Migration
- Production build
- Firestore migrations
- User communication
- Version management

---

**Status:** Ready for Phase 5 Implementation
**Next Step:** Begin service creation

