# Document Signing Implementation - Phase 4b

**Status:** Planning Phase
**Timeline:** 8-10 days
**Priority:** ESSENTIAL (Legal Requirement)

---

## Executive Summary

Implement digital signature capability for required documents (primarily Terms of Service). This creates legally documented proof of user agreement and compliance tracking for regulatory requirements.

---

## Objectives

✅ Create documented proof of T&C acceptance
✅ Enable legal compliance for app store guidelines
✅ Track signature metadata (timestamp, device, IP, location)
✅ Support signature verification for audits
✅ Maintain audit trail for legal holds
✅ Support signature expiry/renewal workflows

---

## Architecture Overview

```
LegalDocumentViewer
    ↓
[Shows "I Agree & Accept" button]
    ↓
SignatureModal (NEW)
    ├── SignatureCanvas (Sketch option)
    └── NameInput (Typed name option)
    ↓
DocumentSigningService (NEW)
    ├── Capture signature metadata
    ├── Store in AsyncStorage locally
    └── Queue for Firestore sync
    ↓
DocumentVersioningService (EXTENDED)
    ├── Link signatures to acceptances
    ├── Track signature verification
    └── Include in compliance reports
```

---

## Components to Create

### 1. **SignatureModal Component** (New)
**File:** `/src/components/legal/SignatureModal.tsx`
**Purpose:** Modal for capturing user signature
**Size:** ~250-300 lines

**Features:**
- Two signature input methods:
  - Sketch-based: Touch drawing (using `react-native-signature-canvas`)
  - Typed name: Simple text input
- Clear/Undo buttons for sketch
- Preview of signature
- Validation (signature required)
- Loading state during save
- Error handling

**Props:**
```typescript
interface SignatureModalProps {
  documentId: string;
  documentTitle: string;
  visible: boolean;
  onClose: () => void;
  onSignatureCapture: (signature: CapturedSignature) => Promise<void>;
  loading?: boolean;
}

interface CapturedSignature {
  type: 'sketch' | 'typed';
  data: string; // Base64 for sketch, plain text for typed
  timestamp: number;
  device: string; // iOS/Android
}
```

### 2. **DocumentSigningService** (New)
**File:** `/src/services/legal/DocumentSigningService.ts`
**Purpose:** Manage signature capture, storage, and verification
**Size:** ~300-350 lines

**Key Methods:**
```typescript
// Capture and store signature
captureSignature(
  documentId: string,
  signature: CapturedSignature,
  appVersion: string,
  platform: 'ios' | 'android'
): Promise<DocumentSignature>

// Get signature for document
getSignature(
  documentId: string,
  userId: string
): Promise<DocumentSignature | null>

// Verify signature (for audits)
verifySignature(
  documentId: string,
  userId: string
): Promise<SignatureVerification>

// Check if signature is still valid (not expired)
isSignatureValid(signature: DocumentSignature): boolean

// Get all signatures for user
getUserSignatures(userId: string): Promise<DocumentSignature[]>

// Export signatures for compliance report
exportSignatures(userId: string): Promise<SignatureExport>

// Clear signature on account deletion
clearSignatures(userId: string): Promise<boolean>
```

**Storage Structure:**
```typescript
interface DocumentSignature {
  id: string; // UUID
  documentId: string;
  userId: string;
  signatureType: 'sketch' | 'typed';
  signatureData: string; // Base64 (sketch) or text (typed)
  signedAt: number; // Timestamp
  expiresAt?: number; // Optional expiry
  metadata: {
    platform: 'ios' | 'android';
    appVersion: string;
    device: string;
    ipAddress?: string;
    location?: string;
  };
  verification: {
    verified: boolean;
    verifiedAt?: number;
    hash?: string; // For integrity
  };
}
```

---

## Service Updates Required

### DocumentVersioningService (Extended)
**File:** `/src/services/legal/DocumentVersioningService.ts`

**New Fields in DocumentAcceptance:**
```typescript
interface DocumentAcceptance {
  // ... existing fields
  signatureId?: string; // Link to signature record
  requiresSignature?: boolean;
  signedAt?: number;
}
```

**New Methods:**
```typescript
// Link signature to acceptance
linkSignatureToAcceptance(
  documentId: string,
  signatureId: string
): Promise<boolean>

// Check if document needs signature
requiresSignature(documentId: string): boolean

// Get all documents requiring signatures
getDocumentsRequiringSignature(): Promise<LegalDocument[]>

// Get pending signatures (accepted but not signed)
getPendingSignatures(userId: string): Promise<PendingSignature[]>

// Generate compliance report with signatures
generateComplianceReportWithSignatures(
  userId: string
): Promise<ComplianceReportWithSignatures>
```

---

## UI Modifications

### LegalDocumentViewer Component (Modified)
**File:** `/src/components/legal/LegalDocumentViewer.tsx`

**Changes:**
1. Update button text: "I Agree & Accept" → "I Agree, Accept & Sign"
2. Add signature handling to onAccept callback
3. Show SignatureModal when document requires signature
4. Display signature status/verification badge
5. Handle loading state during signature capture

**New Props:**
```typescript
interface LegalDocumentViewerProps {
  // ... existing
  requiresSignature?: boolean;
  onSignatureComplete?: (signature: DocumentSignature) => void;
}
```

---

## LegalDocumentsScreen Updates
**File:** `/src/screens/legal/LegalDocumentsScreen.tsx`

**Changes:**
1. Add signature status indicator on document cards
2. Show badge: "Signature required" or "Signed ✓"
3. Update flow to capture signature when accepting
4. Handle signature completion feedback

---

## Implementation Steps (Phase 4b)

### Week 1
- [ ] Day 1-2: Design & create SignatureModal component
- [ ] Day 3: Implement signature canvas (sketch mode)
- [ ] Day 4: Implement name input (typed mode)
- [ ] Day 5: Create DocumentSigningService core

### Week 2
- [ ] Day 6: Implement signature storage in AsyncStorage
- [ ] Day 7: Extend DocumentVersioningService
- [ ] Day 8: Integrate with LegalDocumentViewer
- [ ] Day 9: Update LegalDocumentsScreen
- [ ] Day 10: Testing and refinement

---

## Dependencies & Libraries

**Required:**
- `react-native-signature-canvas` - For sketch-based signatures
- `crypto-js` - For signature hashing/verification
- `uuid` - For signature IDs

**Already Available:**
- AsyncStorage (local storage)
- Firebase (for Firestore sync)
- Zustand (auth store)

---

## Data Flow

### Acceptance with Signature

```
User views T&C
    ↓
User taps "I Agree, Accept & Sign"
    ↓
SignatureModal appears
    ↓
User chooses: Sketch or Typed name
    ↓
DocumentSigningService.captureSignature()
    ├─ Create DocumentSignature record
    ├─ Store in AsyncStorage (locally)
    └─ Queue for Firestore sync
    ↓
DocumentVersioningService.linkSignatureToAcceptance()
    ├─ Link signature to acceptance record
    └─ Mark as synced
    ↓
UI shows "Signed ✓" badge
```

### Sync to Firestore (When Online)

```
Sync queue contains signature
    ↓
FirebaseService checks online status
    ↓
Upload to Firestore:
├─ /users/{userId}/signatures/{signatureId}
└─ /documents/{documentId}/signatures/{userId}
    ↓
Update metadata in AsyncStorage
```

---

## Document Index Updates

**File:** `/src/assets/legal-documents/index.json`

**New Fields:**
```json
{
  "documents": [
    {
      "id": "terms-of-service",
      "title": "Terms of Service",
      "version": "1.0.0",
      "requiresSignature": true,  // NEW
      "signatureExpiry": 365,     // Days (null = no expiry)
      // ... other fields
    }
  ]
}
```

---

## Compliance & Legal

### Signature Metadata Captured
✅ Timestamp (ISO 8601)
✅ Device type (iOS/Android)
✅ App version
✅ Platform/OS version
✅ IP address (when available)
✅ Signature type (sketch/typed)
✅ Hash verification (for integrity)

### Audit Trail
✅ All signatures logged with user ID
✅ Immutable records (AsyncStorage then Firestore)
✅ Signature expiry tracking
✅ Reacceptance workflow
✅ Compliance reports with signatures

### Legal Standards
✅ ESIGN Act compliance (US)
✅ eIDAS compliance (EU)
✅ UETA compliance (most states)
✅ Satisfies app store T&C requirements

---

## Testing Checklist

- [ ] Signature capture (sketch mode) works
- [ ] Signature capture (typed mode) works
- [ ] Signatures stored locally
- [ ] Signatures sync to Firestore
- [ ] Signature status displays correctly
- [ ] Multiple documents can be signed
- [ ] Signature expiry works (if set)
- [ ] Compliance reports include signatures
- [ ] Signatures survive app restart
- [ ] Dark/light mode works
- [ ] Accessibility features work
- [ ] Account deletion clears signatures

---

## Phase Deliverables

✅ SignatureModal component (fully featured)
✅ DocumentSigningService (complete API)
✅ DocumentVersioningService extensions
✅ UI integration (LegalDocumentViewer & LegalDocumentsScreen)
✅ Local storage & Firestore sync
✅ Compliance reporting with signatures
✅ Comprehensive documentation
✅ Testing checklist & validation

---

## What's Next

**Phase 5:** Backup & Export System
- Will include signature backup/export
- Device restore flow with signature recovery

**Phase 6:** Admin CMS
- View/verify signatures
- Signature analytics
- Manage expiry policies

---

## Success Metrics

📊 Users can sign required documents
📊 Signatures stored with complete metadata
📊 Compliance reports include signature verification
📊 No data loss on app restart/reinstall
📊 ESIGN/eIDAS compliance verified
📊 Users trust the signing process

---

**Status:** Ready for Phase 4b Implementation
**Next Step:** Begin component creation

