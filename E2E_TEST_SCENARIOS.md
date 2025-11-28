# E2E Test Scenarios
## Phase 7: Testing & Documentation

---

## E2E Test 1: Complete Document Acceptance Workflow

**User Story:** User views legal document, accepts it, and signs if required

**Test File:** `e2e/documentAcceptance.e2e.ts`

### Test Flow:

```gherkin
Feature: Complete Document Acceptance
  Scenario: User accepts and signs legal document

    Given user is authenticated and on legal documents screen
    When user taps on "Terms of Service" document

    Then document viewer should open
    And document title displays "Terms of Service"
    And document content is visible

    When user scrolls down through document (2000ms)
    Then view tracking should fire
    And scroll position should be recorded in analytics

    When user searches for "warranty" using search bar
    Then search results show sections containing "warranty"
    And search interaction is tracked with query and results count

    When user taps expand on "Section 2"
    Then section content expands
    And section expansion event is tracked

    When user shares document via share button
    Then native share dialog appears
    And share interaction event is logged

    When user accepts the document by pressing "I Agree" button
    Then if document requires signature:
      | signature modal appears                                  |
      | user sees "Draw Signature" or "Type Name" options        |

    And if user chooses sketch signature:
      | signature canvas opens                          |
      | user draws signature on canvas                  |
      | user taps "Done"                                |
      | signature is saved                              |
      | signature attempt is tracked (success=true)     |

    And if user chooses typed signature:
      | name input field appears               |
      | user types their name                  |
      | user confirms signature                |
      | typed signature is saved               |
      | signature attempt is tracked           |

    Then document acceptance is recorded:
      | documentId = test-doc-001              |
      | userId = authenticated user            |
      | acceptedAt = current timestamp         |
      | version = current document version     |
      | platform = device platform (ios/android) |
      | appVersion = current app version       |
      | signatureId = captured signature ID    |

    And document acceptance modal closes
    And user is back on documents list

    When user navigates to Compliance & Analytics screen
    Then acceptance shows in timeline:
      | Document: Terms of Service              |
      | Date: today                             |
      | Status: Accepted & Signed               |
      | Signature: Verified (checkmark)         |

    And overall compliance percentage increases
    And signature count increments
```

### Assertions:

```javascript
// Document View
expect(await element(by.text('Terms of Service')).atIndex(0)).toBeVisible();
expect(await element(by.type('RCTScrollView')).getScrollPosition()).toBeDefined();

// Analytics Tracking
expect(analytics.trackDocumentView).toHaveBeenCalledWith('test-doc-001');
expect(analytics.trackInteraction).toHaveBeenCalledWith('test-doc-001', 'search', expect.objectContaining({ query: 'warranty' }));
expect(analytics.trackInteraction).toHaveBeenCalledWith('test-doc-001', 'share');

// Signature Capture
expect(await element(by.text('Draw Signature'))).toBeVisible();
expect(signatureData).toBeDefined();
expect(signatureData.type).toMatch(/sketch|typed/);

// Acceptance Recording
expect(documentVersioning.recordAcceptance).toHaveBeenCalledWith(
  'test-doc-001',
  expect.any(String),
  expect.any(String),
  expect.stringMatching(/ios|android/),
  expect.any(String),
  expect.any(String) // signatureId
);

// Compliance Dashboard
expect(await element(by.text('100%')).atIndex(0)).toBeVisible(); // Compliance %
expect(await element(by.text('Accepted & Signed'))).toBeVisible();
```

---

## E2E Test 2: Compliance Dashboard

**User Story:** User views compliance status, generates reports, and exports

**Test File:** `e2e/complianceDashboard.e2e.ts`

### Test Flow:

```gherkin
Feature: Compliance Dashboard
  Scenario: User views compliance and exports reports

    Given user has accepted multiple documents
    And some documents are signed
    And user is on compliance analytics screen

    Then overview tab is active by default
    And shows overall compliance percentage (0-100%)
    And shows document status:
      | Document          | Accepted | Signed |
      | Terms of Service  | ✓        | ✓      |
      | Privacy Policy    | ✓        | ✓      |
      | Data Processing   | ✗        | ✗      |

    And shows timeline with:
      | Latest acceptance first              |
      | Each entry shows: Doc Title, Date    |
      | Signature badge if signed            |

    When user taps "Metrics" tab
    Then displays view statistics:
      | Total Documents Viewed    | 3     |
      | Total Views              | 12    |
      | Avg View Duration        | 45s   |
      | Last Viewed              | Today |

    And displays signature statistics:
      | Total Attempts    | 5     |
      | Successful        | 5     |
      | Failed            | 0     |
      | Success Rate      | 100%  |

    And displays engagement metrics:
      | Document | Views | Engagement |
      | ToS      | 5     | 95%        |
      | Privacy  | 4     | 85%        |
      | Data     | 3     | 75%        |

    And displays jurisdictional compliance:
      | GDPR       | ✓ COMPLIANT     |
      | CCPA       | ✓ COMPLIANT     |
      | UK         | ✓ COMPLIANT     |
      | AUSTRALIA  | ✓ COMPLIANT     |
      | CANADA     | ✓ COMPLIANT     |

    When user taps "Timeline" tab
    Then shows acceptance timeline:
      | Terms of Service   | Jan 15, 2024 | v1.0.0 | iOS    |
      | Privacy Policy     | Jan 14, 2024 | v1.0.0 | iOS    |

    And shows signature timeline:
      | Terms of Service   | Jan 15, 2024 | Sketch |
      | Privacy Policy     | Jan 14, 2024 | Typed  |

    When user taps "Export" tab
    Then shows export options:
      | Export as JSON | Button | Enabled |
      | Export as CSV  | Button | Enabled |
      | Export as PDF  | Button | Enabled |

    And shows verification option:
      | Verify Acceptances | Button | Enabled |

    When user taps "Export as JSON"
    Then JSON file is generated with:
      | report ID                  |
      | user ID                    |
      | generated timestamp        |
      | all documents              |
      | acceptance timeline        |
      | signature timeline         |
      | audit trail                |
      | jurisdictional compliance  |

    And export success dialog appears
    And file is ready for download/sharing

    When user taps "Verify Acceptances"
    Then verification runs
    And results show:
      | All acceptances valid      | ✓      |
      | Valid count               | 2      |
      | Invalid count             | 0      |
      | Expired count             | 0      |
      | No issues found           | ✓      |
```

### Assertions:

```javascript
// Overview Tab
expect(await element(by.text(/\d+%/))).toBeVisible(); // Compliance percentage
expect(await element(by.text('Terms of Service'))).toBeVisible();
expect(await element(by.text('Accepted & Signed'))).toBeVisible();

// Metrics Tab
expect(await element(by.text('Total Documents Viewed'))).toBeVisible();
expect(await element(by.text('100%'))).toBeVisible(); // Success rate

// Timeline Tab
expect(await element(by.text('Jan 15, 2024'))).toBeVisible();
expect(await element(by.text('v1.0.0'))).toBeVisible();

// Export Tab
expect(await element(by.text('Export as JSON'))).toBeVisible();
expect(await element(by.text('Export as CSV'))).toBeVisible();
expect(await element(by.text('Export as PDF'))).toBeVisible();

// Verification
expect(await element(by.text('All acceptances valid'))).toBeVisible();
```

---

## E2E Test 3: Backup and Restore Workflow

**User Story:** User creates backup, uploads to cloud, and restores data

**Test File:** `e2e/backupRestore.e2e.ts`

### Test Flow:

```gherkin
Feature: Backup and Restore
  Scenario: User creates local backup, uploads, and restores

    Given user is on backup/export screen
    And has documents, acceptances, and signatures
    And has 500MB free space

    When user taps "Create Backup Now" button
    Then loading indicator shows "Creating backup..."

    Then backup is created with:
      | Backup ID       | guid            |
      | Created At      | current time    |
      | Size            | calculated size |
      | Document Count  | 3               |
      | Acceptance Count| 2               |
      | Signature Count | 2               |
      | Status          | ✓ Ready         |

    And backup appears in backup list with:
      | Backup Date          | Jan 20, 2024      |
      | Size                 | 2.5 MB            |
      | Doc Count            | 3                 |
      | Status               | ✓ Verified        |
      | Actions              | Restore | Delete   |

    When user enables password protection
    And sets password "SecurePass123!"
    And confirms password

    Then backup is encrypted
    And backup size slightly increases
    And password indicator shows "🔒 Protected"

    When user taps "Upload to Cloud"
    Then upload dialog appears
    And shows upload progress (0-100%)

    Then backup uploads successfully
    And cloud sync status shows "✓ Synced"
    And upload timestamp is recorded

    When user deletes the local backup
    And navigates to Cloud Backups tab

    Then cloud backup appears in list:
      | Backup Date          | Jan 20, 2024  |
      | Storage              | Cloud         |
      | Size                 | 2.5 MB        |
      | Status               | ✓ Available   |
      | Actions              | Download      |

    When user taps "Restore from Cloud"
    Then backup selection dialog shows
    And user selects the cloud backup

    And restore confirmation dialog appears:
      | ⚠ Warning: This will overwrite local data |
      | Backup Date: Jan 20, 2024                 |
      | Size: 2.5 MB                              |
      | [Cancel] [Restore]                        |

    And if backup was encrypted:
      | Password prompt appears     |
      | User enters password        |
      | Validation shows ✓ Correct  |

    When user taps "Restore"
    Then restoration progress shows
    And system shows "Restoring backup... 50%"

    Then restoration completes successfully
    And confirmation dialog appears:
      | ✓ Backup restored successfully |
      | Restored items:                |
      | - Documents: 3                 |
      | - Acceptances: 2              |
      | - Signatures: 2               |

    And user can verify restored data:

    When user navigates to legal documents
    Then documents are restored:
      | Terms of Service  | ✓ Accepted & Signed |
      | Privacy Policy    | ✓ Accepted & Signed |

    When user navigates to compliance dashboard
    Then compliance status is restored:
      | Overall Compliance | 100%  |
      | Documents Accepted | 2 / 3 |
      | Documents Signed   | 2 / 3 |
      | Acceptance Timeline shows restored entries |

    When user opens document history
    Then view history and interactions are restored:
      | Document views: 12    |
      | Search history shown  |
      | Share interactions    |
```

### Assertions:

```javascript
// Backup Creation
expect(await element(by.text('Creating backup...'))).toBeVisible();
expect(await waitFor(element(by.text('✓ Ready'))).toBeVisible()).toBe(true);

// Backup List
expect(await element(by.text('Jan 20, 2024'))).toBeVisible();
expect(await element(by.text('2.5 MB'))).toBeVisible();
expect(await element(by.text('✓ Verified'))).toBeVisible();

// Cloud Upload
expect(await waitFor(element(by.text('✓ Synced'))).toBeVisible()).toBe(true);

// Restore Process
expect(await element(by.text('⚠ Warning: This will overwrite local data'))).toBeVisible();
expect(await waitFor(element(by.text('✓ Backup restored successfully'))).toBeVisible()).toBe(true);

// Data Verification
expect(await element(by.text('✓ Accepted & Signed'))).toBeVisible();
expect(await element(by.text('100%'))).toBeVisible(); // Compliance
```

---

## E2E Test 4: Settings Navigation

**User Story:** User navigates through all legal/compliance features from settings

**Test File:** `e2e/settingsNavigation.e2e.ts`

### Test Flow:

```gherkin
Feature: Settings Navigation
  Scenario: User accesses all legal/compliance features

    Given user is on main app
    When user taps "Settings" tab

    Then settings screen opens
    And shows all sections:
      | Account Information    |
      | Preferences           |
      | Legal & Compliance    |
      | Support               |

    When user scrolls to "Legal & Compliance" section
    Then shows buttons:
      | Legal Documents        |
      | Compliance & Analytics |
      | Backup & Export       |

    When user taps "Legal Documents"
    Then navigates to legal documents screen
    And shows list of documents:
      | Terms of Service       |
      | Privacy Policy         |
      | Data Processing Terms  |

    And user can:
      | View document details    |
      | Accept documents         |
      | Sign documents           |
      | See acceptance status    |

    When user taps back button
    Then returns to settings

    When user taps "Compliance & Analytics"
    Then navigates to compliance dashboard
    And shows:
      | Overview tab     | Compliance %   |
      | Timeline tab     | Acceptance log |
      | Metrics tab      | Statistics     |
      | Export tab       | Report export  |

    And user can:
      | View compliance status          |
      | Generate compliance reports     |
      | Export reports (JSON/CSV/PDF)   |
      | Verify acceptances              |

    When user taps back button
    Then returns to settings

    When user taps "Backup & Export"
    Then navigates to backup screen
    And shows tabs:
      | Backup  |
      | Export  |
      | Restore |
      | History |

    And user can:
      | Create local backups          |
      | Set password protection       |
      | Upload to cloud               |
      | Download cloud backups        |
      | Restore from backup           |
      | View backup history           |

    When user taps back button
    Then returns to settings
```

### Assertions:

```javascript
// Settings Screen
expect(await element(by.text('Legal & Compliance'))).toBeVisible();
expect(await element(by.text('Legal Documents'))).toBeVisible();
expect(await element(by.text('Compliance & Analytics'))).toBeVisible();
expect(await element(by.text('Backup & Export'))).toBeVisible();

// Legal Documents Navigation
expect(await element(by.text('Terms of Service'))).toBeVisible();

// Compliance Dashboard
expect(await element(by.text(/\d+%/))).toBeVisible(); // Compliance %

// Backup Screen
expect(await element(by.text('Create Backup Now'))).toBeVisible();
expect(await element(by.text('Backup'))).toBeVisible();
expect(await element(by.text('Restore'))).toBeVisible();
```

---

## Test Execution Setup

### Prerequisites:

```bash
# Install Detox globally
npm install -g detox-cli

# Install test dependencies
npm install --save-dev detox detox-cli detox-config

# Build Detox configuration
detox build-framework-cache
```

### Configuration:

**`.detoxrc.json`:**
```json
{
  "apps": {
    "ios": {
      "type": "ios.app",
      "binaryPath": "ios/build/Release-iphonesimulator/ReadingDaily.app",
      "build": "xcodebuild -workspace ios/ReadingDaily.xcworkspace -scheme ReadingDaily -configuration Release -derivedDataPath ios/build -UseNewBuildSystem=NO"
    }
  },
  "configurations": {
    "ios.sim.debug": {
      "device": {
        "type": "ios.simulator",
        "device": {
          "type": "iPhone 14"
        }
      },
      "app": "ios"
    }
  },
  "testRunner": "jest"
}
```

### Running Tests:

```bash
# Build app for testing
detox build-framework-cache

# Run specific E2E test
detox test e2e/documentAcceptance.e2e.ts --configuration ios.sim.debug --record-logs all

# Run all E2E tests
detox test --configuration ios.sim.debug --cleanup

# Run with recording
detox test e2e/ --configuration ios.sim.debug --record-logs all --record-videos all
```

---

## Success Criteria

✅ All E2E tests pass on iOS simulator
✅ All E2E tests pass on Android emulator
✅ No flaky tests (100% consistent pass rate)
✅ Average test execution time <5 minutes per scenario
✅ All user interactions trigger expected analytics events
✅ All data flows correctly between services
✅ All error scenarios handled gracefully
✅ Performance acceptable (no ANR/jank)

---

## Test Data

### Test User:
```json
{
  "uid": "test-user-001",
  "email": "test@example.com",
  "displayName": "Test User"
}
```

### Test Documents:
```json
[
  {
    "id": "test-doc-001",
    "title": "Terms of Service",
    "version": "1.0.0",
    "required": true,
    "requiresSignature": true
  },
  {
    "id": "test-doc-002",
    "title": "Privacy Policy",
    "version": "1.0.0",
    "required": true,
    "requiresSignature": true
  },
  {
    "id": "test-doc-003",
    "title": "Data Processing",
    "version": "1.0.0",
    "required": false,
    "requiresSignature": false
  }
]
```

---

## Maintenance

**Review E2E tests quarterly** for:
- UI changes
- New features
- Deprecated functionality
- Performance regressions
- New error scenarios

**Update as needed** when:
- Navigation changes
- Element selectors change
- New features are added
- User flows are modified
