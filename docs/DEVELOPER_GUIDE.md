# Developer Guide

Complete guide for developers working on the legal documents, compliance, and backup features.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Service Setup](#service-setup)
3. [Testing Guide](#testing-guide)
4. [Contributing](#contributing)
5. [Troubleshooting](#troubleshooting)

---

## Architecture

### Service Architecture Overview

The legal system is built on 7 core services, all following the singleton pattern:

```
┌─────────────────────────────────────────────────────┐
│           React Native UI Components                 │
├─────────────────────────────────────────────────────┤
│  LegalDocumentViewer  ComplianceAnalyticsScreen  etc │
├─────────────────────────────────────────────────────┤
│              Service Layer (Singletons)             │
├────────────┬──────────────┬──────────────────────────┤
│ Analytics  │ Compliance   │ Signing Service         │
│ Versioning │ Backup       │ CloudBackup             │
│ Schedule   │              │                         │
├─────────────────────────────────────────────────────┤
│     Storage Layer (AsyncStorage + Firestore)        │
├─────────────────────────────────────────────────────┤
│  Device Storage        Cloud Storage (Firebase)     │
└─────────────────────────────────────────────────────┘
```

### Service Dependencies

```typescript
// Analytics flows into Compliance Reports
DocumentAnalyticsService → ComplianceReportService

// Versioning tracks Acceptances + Signatures
DocumentVersioningService → DocumentSigningService

// Backups use all services
BackupService → {all other services}

// Cloud operations depend on local
CloudBackupService → BackupService
```

### Data Flow

**Document Acceptance Flow:**
```
User Opens Document
    ↓
Analytics: Track View
    ↓
User Accepts Document
    ↓
Versioning: Record Acceptance
    ↓
If Signature Required:
    → Signing: Capture Signature
    → Versioning: Link Signature
    ↓
Compliance: Log Audit Event
    ↓
Analytics: Track Acceptance
    ↓
Success: Document Marked Complete
```

### Service Responsibilities

| Service | Purpose | Scope |
|---------|---------|-------|
| DocumentAnalyticsService | Track usage patterns | Views, interactions, metrics |
| ComplianceReportService | Generate compliance evidence | Reports, audit trails, exports |
| DocumentSigningService | Manage signatures | Capture, verify, store, expire |
| DocumentVersioningService | Track acceptances | Record, history, status |
| BackupService | Local data backup | Create, restore, verify |
| CloudBackupService | Cloud synchronization | Upload, download, sync |
| BackupScheduleService | Auto-backup schedule | Monthly, retry, cleanup |

---

## Service Setup

### Development Environment

**Prerequisites:**
```bash
Node.js 16+
npm 7+
React Native 0.71+
Expo SDK 48+
```

**Installation:**
```bash
# Clone repository
git clone <repo-url>
cd ReadingDaily-Scripture-App

# Install dependencies
npm install

# Install global tools
npm install -g detox-cli expo-cli

# Setup Firebase (see Firebase Setup section)
```

### Firebase Configuration

**Required Setup:**

1. **Create Firebase Project**
   - Go to Firebase Console
   - Create new project
   - Enable Firestore Database
   - Enable Cloud Storage
   - Generate service account key

2. **Configure Auth**
   - Enable Email/Password authentication
   - Enable Anonymous authentication

3. **Set Up Firestore Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/acceptances/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    match /users/{userId}/signatures/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    match /users/{userId}/backups/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    match /users/{userId}/analytics/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

4. **Environment Variables**
```bash
# .env file
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx
```

### Service Initialization

**Basic Setup Example:**

```typescript
// src/services/legal/DocumentAnalyticsService.ts
import { AsyncStorage } from 'react-native';
import { db, auth } from '@/config/firebase';
import { logger } from '@/services/logging/LoggerService';

class DocumentAnalyticsService {
  private static instance: DocumentAnalyticsService;
  private initialized = false;

  private constructor() {}

  static getInstance(): DocumentAnalyticsService {
    if (!DocumentAnalyticsService.instance) {
      DocumentAnalyticsService.instance = new DocumentAnalyticsService();
    }
    return DocumentAnalyticsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load from AsyncStorage
      const stored = await AsyncStorage.getItem('analytics_data');
      if (stored) {
        this.data = JSON.parse(stored);
      }

      this.initialized = true;
      logger.info('[Analytics] Service initialized');
    } catch (error) {
      logger.error('[Analytics] Initialization failed', error);
      throw error;
    }
  }

  // ... rest of implementation
}
```

### Data Storage

**AsyncStorage (Local):**
```typescript
// Store data locally
await AsyncStorage.setItem(
  'analytics_data',
  JSON.stringify(data)
);

// Retrieve
const data = await AsyncStorage.getItem('analytics_data');
```

**Firestore (Cloud):**
```typescript
// Store in Firestore
const docRef = doc(
  db,
  'users',
  userId,
  'acceptances',
  documentId
);

await setDoc(docRef, {
  accepted: true,
  acceptedAt: Date.now(),
  version: '1.0.0',
});

// Query
const q = query(
  collection(db, 'users', userId, 'acceptances'),
  where('accepted', '==', true)
);
const docs = await getDocs(q);
```

---

## Testing Guide

### Test Structure

```
src/
├── services/legal/
│   ├── DocumentAnalyticsService.ts
│   ├── __tests__/
│   │   ├── DocumentAnalyticsService.test.ts
│   │   ├── IntegrationTests.test.ts
│   │   └── ...
│   └── ...
├── components/legal/
│   ├── LegalDocumentViewer.tsx
│   ├── __tests__/
│   │   └── LegalDocumentViewer.test.tsx
│   └── ...
└── screens/legal/
    ├── ComplianceAnalyticsScreen.tsx
    ├── __tests__/
    │   └── ComplianceAnalyticsScreen.test.tsx
    └── ...
```

### Unit Testing

**Setting Up Tests:**

```typescript
// src/services/legal/__tests__/DocumentAnalyticsService.test.ts

import DocumentAnalyticsService from '../DocumentAnalyticsService';
import * as AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('DocumentAnalyticsService', () => {
  let service: DocumentAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = DocumentAnalyticsService.getInstance();
  });

  test('should track document view', async () => {
    await service.trackDocumentView('doc-001');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
```

**Running Tests:**

```bash
# Run all tests
npm test

# Run specific test file
npm test DocumentAnalyticsService.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Integration Testing

**Testing Multi-Service Workflows:**

```typescript
describe('Document Acceptance Workflow', () => {
  test('should track view -> accept -> sign -> verify', async () => {
    // 1. Track view
    const analytics = DocumentAnalyticsService.getInstance();
    await analytics.trackDocumentView('doc-001');

    // 2. Record acceptance
    const versioning = DocumentVersioningService;
    await versioning.recordAcceptance(
      'doc-001',
      'user-001',
      '1.0.0',
      'ios',
      '1.0.0'
    );

    // 3. Capture signature
    const sig = await DocumentSigningService.captureSignature(
      'doc-001',
      {type: 'sketch', data: 'base64', timestamp: Date.now()},
      '1.0.0',
      'ios'
    );

    // 4. Link signature
    await versioning.linkSignatureToAcceptance('doc-001', sig.id);

    // 5. Generate report
    const compliance = ComplianceReportService.getInstance();
    const report = await compliance.generateComplianceReport('full');

    // Verify entire flow completed
    expect(report.overallCompliancePercentage).toBeGreaterThan(0);
  });
});
```

### E2E Testing

**Detox Setup:**

```bash
# Build for testing
detox build-framework-cache

# Run E2E tests
detox test e2e/documentAcceptance.e2e.ts --configuration ios.sim.debug

# With recording
detox test e2e/ --configuration ios.sim.debug --record-logs all --record-videos all
```

**Example E2E Test:**

```typescript
// e2e/documentAcceptance.e2e.ts
describe('Document Acceptance Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should accept and sign document', async () => {
    // Navigate to legal documents
    await element(by.text('Settings')).tap();
    await element(by.text('Legal Documents')).tap();

    // Open document
    await element(by.text('Terms of Service')).tap();

    // Expand sections
    await element(by.text('Section 1')).tap();
    expect(await element(by.text('Introduction text'))).toBeVisible();

    // Search
    await element(by.id('searchInput')).typeText('warranty');
    expect(await element(by.text('Search results'))).toBeVisible();

    // Share
    await element(by.id('shareButton')).tap();
    // Handle share dialog

    // Accept and sign
    await element(by.text('I Agree & Sign')).tap();
    await element(by.text('Draw Signature')).tap();

    // Draw signature
    // ... signature drawing code

    await element(by.text('Done')).tap();

    // Verify completion
    expect(await element(by.text('Signature saved'))).toBeVisible();
  });
});
```

### Test Data Fixtures

**Mock Data Setup:**

```typescript
// src/services/legal/__tests__/fixtures/index.ts

export const mockDocument = {
  id: 'doc-001',
  title: 'Terms of Service',
  content: '# Section 1\nContent here',
  version: '1.0.0',
  lastUpdated: '2024-01-15',
  effectiveDate: '2024-01-01',
  contactEmail: 'legal@example.com',
  sections: [
    { id: 'sec-1', title: 'Section 1', level: 2 }
  ],
};

export const mockAcceptance = {
  id: 'acc-001',
  documentId: 'doc-001',
  userId: 'user-001',
  acceptedAt: Date.now(),
  documentVersion: '1.0.0',
  platform: 'ios',
  appVersion: '1.0.0',
};

export const mockSignature = {
  id: 'sig-001',
  documentId: 'doc-001',
  userId: 'user-001',
  type: 'sketch',
  capturedAt: Date.now(),
  expiresAt: Date.now() + 31536000000, // 1 year
  platform: 'ios',
  appVersion: '1.0.0',
  hash: 'sha256hash',
};
```

### Mocking Services

**Creating Mock Services:**

```typescript
// Mock DocumentAnalyticsService
const mockAnalyticsService = {
  trackDocumentView: jest.fn().mockResolvedValue(undefined),
  trackInteraction: jest.fn().mockResolvedValue(undefined),
  trackSignatureAttempt: jest.fn().mockResolvedValue(undefined),
  getUserStatistics: jest.fn().mockResolvedValue({
    totalDocumentsViewed: 3,
    totalViews: 10,
    averageViewDuration: 45,
  }),
  getInstance: jest.fn().mockReturnValue(mockAnalyticsService),
};

jest.mock('@/services/legal/DocumentAnalyticsService', () => ({
  DocumentAnalyticsService: mockAnalyticsService,
}));
```

---

## Contributing

### Code Style

**TypeScript Standards:**
- Use strict mode
- Define all types explicitly
- Avoid `any` type
- Use interfaces for data structures

**Naming Conventions:**
- Classes: PascalCase (e.g., `DocumentAnalyticsService`)
- Functions: camelCase (e.g., `trackDocumentView`)
- Constants: UPPER_CASE (e.g., `MAX_RETRIES`)
- Interfaces: I prefix (e.g., `IDocumentService`)

**File Structure:**
```
service/
├── DocumentAnalyticsService.ts    # Main implementation
├── types.ts                       # Type definitions
├── constants.ts                   # Constants
├── __tests__/
│   ├── DocumentAnalyticsService.test.ts
│   └── fixtures/
│       └── mockData.ts
└── README.md                      # Service documentation
```

### Pull Request Process

1. **Create Feature Branch**
```bash
git checkout -b feature/new-feature
```

2. **Make Changes**
   - Follow code style
   - Add tests
   - Update documentation
   - Keep commits focused

3. **Test Locally**
```bash
npm test
npm run lint
npm run build
```

4. **Push and Create PR**
```bash
git push origin feature/new-feature
```

5. **PR Checklist**
   - ✓ Tests pass (100% if new code)
   - ✓ No console errors/warnings
   - ✓ Documentation updated
   - ✓ TypeScript strict mode
   - ✓ Code reviewed

### Documentation

**Update Documentation For:**
- New features
- API changes
- Breaking changes
- Configuration updates

**Documentation Files:**
- `docs/API_DOCUMENTATION.md` - API reference
- `docs/USER_GUIDES.md` - User documentation
- `docs/DEVELOPER_GUIDE.md` - Developer guide
- Service README files

---

## Troubleshooting

### Common Issues

#### Tests Failing

**Problem:** Unit tests fail with "Cannot find module"

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Jest cache
npm test -- --clearCache

# Run tests
npm test
```

#### AsyncStorage Not Available in Tests

**Problem:** "AsyncStorage is not available"

**Solution:**
```typescript
// Mock in test setup
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(null),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));
```

#### Firebase Connection Issues

**Problem:** Firestore operations timeout

**Solution:**
```typescript
// Check connection
if (!db) {
  logger.error('Firebase not initialized');
  // Fallback to AsyncStorage
}

// Use offline persistence
enableIndexedDbPersistence(db);
```

#### Signature Verification Fails

**Problem:** Signature hash doesn't match

**Solution:**
```typescript
// Ensure consistent hashing
import * as Crypto from 'expo-crypto';

const hash = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  signatureData
);
```

### Performance Optimization

**Reduce Storage Access:**
```typescript
// Cache in memory
private memoryCache = new Map();

async getData(key: string) {
  if (this.memoryCache.has(key)) {
    return this.memoryCache.get(key);
  }
  const data = await AsyncStorage.getItem(key);
  if (data) this.memoryCache.set(key, JSON.parse(data));
  return data;
}
```

**Batch Operations:**
```typescript
// Instead of multiple calls
for (const doc of documents) {
  await analytics.trackDocumentView(doc.id);
}

// Do batch operation
await analytics.trackMultipleViews(documentIds);
```

**Optimize Queries:**
```typescript
// Bad: Load all then filter
const all = await getDocs(collection(db, 'acceptances'));
const filtered = all.docs.filter(d => d.data().documentId === 'doc-1');

// Good: Query with where clause
const q = query(
  collection(db, 'acceptances'),
  where('documentId', '==', 'doc-1')
);
const filtered = await getDocs(q);
```

### Debug Logging

**Enable Debug Mode:**

```typescript
// src/config/debug.ts
export const DEBUG = {
  analytics: true,
  backup: true,
  compliance: true,
  storage: false,
  network: false,
};

// src/services/logging/LoggerService.ts
import { DEBUG } from '@/config/debug';

export const logger = {
  info: (msg: string, data?: any) => {
    if (DEBUG.analytics || DEBUG.compliance) {
      console.log(`[INFO] ${msg}`, data);
    }
  },
};
```

**Inspect Storage:**

```typescript
// View AsyncStorage contents
async function inspectStorage() {
  const keys = await AsyncStorage.getAllKeys();
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    console.log(`${key}:`, JSON.parse(value || '{}'));
  }
}
```

### Release Checklist

Before deploying to production:

- ✓ All tests passing
- ✓ No console errors/warnings
- ✓ Performance benchmarks acceptable (<500ms operations)
- ✓ Compliance verified (GDPR, CCPA, etc.)
- ✓ Backup tested (create and restore)
- ✓ Analytics tracking verified
- ✓ Documentation updated
- ✓ Version bumped
- ✓ Changelog updated
- ✓ Code review completed

---

## Resources

**Documentation:**
- API Reference: `docs/API_DOCUMENTATION.md`
- Architecture: `docs/PHASE_7_TESTING_DOCUMENTATION.md`

**External Resources:**
- [React Native](https://reactnative.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Detox Testing](https://detox.e2e.dev)
- [Jest Testing](https://jestjs.io)

**Contact:**
- For architecture questions: See ARCHITECTURE.md
- For deployment: See DEPLOYMENT.md
- For support: legal@example.com

---

**Last Updated:** January 2024
**Guide Version:** 1.0.0
