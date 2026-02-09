# Documentation Index

Quick reference to all project documentation organized by category.

## 📚 Main Documentation

- **[README.md](README.md)** - Project overview, setup, and quick start
- **[current-status.md](current-status.md)** - Current project status and recent changes
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

## 🚀 Getting Started

- **[README.md](README.md)** - Installation and setup instructions
- **[quick_reference.md](quick_reference.md)** - Quick reference guide
- **[LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md)** - Local testing procedures

## 🔧 Development Guides

### Firebase & Cloud Functions
- **[FIREBASE_DEPLOYMENT_GUIDE.md](FIREBASE_DEPLOYMENT_GUIDE.md)** - Deploy Cloud Functions
- **[CLOUD_FUNCTIONS_GUIDE.md](CLOUD_FUNCTIONS_GUIDE.md)** - Cloud Functions documentation
- **[FIRESTORE_GIFTING_SCHEMA.md](FIRESTORE_GIFTING_SCHEMA.md)** - Gifting database schema

### Features
- **[WORD_HIGHLIGHTING_IMPLEMENTATION_REPORT.md](WORD_HIGHLIGHTING_IMPLEMENTATION_REPORT.md)** - Audio highlighting
- **[SUBSCRIPTION_GIFTING_SYSTEM.md](SUBSCRIPTION_GIFTING_SYSTEM.md)** - Gifting implementation
- **[GIFT_CODE_TESTING_GUIDE.md](GIFT_CODE_TESTING_GUIDE.md)** - Testing gift codes
- **[FEATURE_EXPLANATIONS.md](FEATURE_EXPLANATIONS.md)** - Feature descriptions

### Payment Systems
- **[RECEIPT_VALIDATION_GUIDE.md](RECEIPT_VALIDATION_GUIDE.md)** - IAP validation
- **[SUBSCRIPTION_RENEWAL_NOTIFICATIONS_GUIDE.md](SUBSCRIPTION_RENEWAL_NOTIFICATIONS_GUIDE.md)** - Renewal notifications
- **[SUBSCRIPTION_LTV_MODEL_AND_RECOMMENDATIONS.md](SUBSCRIPTION_LTV_MODEL_AND_RECOMMENDATIONS.md)** - LTV analysis

## 📱 App Store & Deployment

- **[APP_STORE_CONTENT.md](APP_STORE_CONTENT.md)** - App Store metadata
- **[LAUNCH_MATERIALS.md](LAUNCH_MATERIALS.md)** - Launch checklist
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[APPLE_RESOLUTION_CENTER_RESPONSE.md](APPLE_RESOLUTION_CENTER_RESPONSE.md)** - Apple review responses

## 🧪 Testing

- **[E2E_TEST_SCENARIOS.md](E2E_TEST_SCENARIOS.md)** - End-to-end test scenarios
- **[LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md)** - Local testing guide

## 📖 Legal & Compliance

### Security
- **[SECURITY_AUDIT_2026_02_07.md](SECURITY_AUDIT_2026_02_07.md)** - API key exposure audit (Feb 2026)
- **[SECURITY_REMEDIATION_REVIEW.md](SECURITY_REMEDIATION_REVIEW.md)** - Security review

### Legal Documentation
- **[LEGAL_DOCUMENTS_IMPLEMENTATION.md](LEGAL_DOCUMENTS_IMPLEMENTATION.md)** - Legal docs system
- **[LEGAL_DOCS_QUICK_START.md](LEGAL_DOCS_QUICK_START.md)** - Legal quick start
- **[DOCUMENT_SIGNING_PHASE_4B_PLAN.md](DOCUMENT_SIGNING_PHASE_4B_PLAN.md)** - Document signing plan

### Legal Documents (src/assets/legal-documents/)
- Privacy Policy
- Terms of Service
- Consumer Rights
- Copyright
- Accessibility Statement
- Help/FAQ

## 🎨 Design & Branding

- **[PROFESSIONAL_BRAND_IDENTITY_ANALYSIS.md](PROFESSIONAL_BRAND_IDENTITY_ANALYSIS.md)** - Brand identity
- **[BUDGET_FRIENDLY_BRAND_STRATEGY.md](BUDGET_FRIENDLY_BRAND_STRATEGY.md)** - Brand strategy
- **[STEP_1_BRAND_POSITIONING.md](STEP_1_BRAND_POSITIONING.md)** - Brand positioning
- **[STEP_2_COLOR_PSYCHOLOGY.md](STEP_2_COLOR_PSYCHOLOGY.md)** - Color psychology
- **[STEP_3_TYPOGRAPHY_STRATEGY.md](STEP_3_TYPOGRAPHY_STRATEGY.md)** - Typography
- **[STEP_4_ICON_SYSTEM.md](STEP_4_ICON_SYSTEM.md)** - Icon system
- **[VISUAL_HIERARCHY_ENHANCEMENT_PLAN.md](VISUAL_HIERARCHY_ENHANCEMENT_PLAN.md)** - Visual hierarchy

## 📋 Planning & Roadmap

- **[PROJECT_ROADMAP_STATUS.md](PROJECT_ROADMAP_STATUS.md)** - Project roadmap
- **[PROJECT_STATUS_MASTER.md](PROJECT_STATUS_MASTER.md)** - Master status doc
- **[DETAILED_IMPLEMENTATION_PHASES_8A_TO_9.3.md](DETAILED_IMPLEMENTATION_PHASES_8A_TO_9.3.md)** - Implementation phases
- **[FUTURE_WORK_QUEUE.md](FUTURE_WORK_QUEUE.md)** - Future work items

## 🔍 Technical Investigation

### Build History & Debugging
- **[BUILD_94_TO_98_JOURNEY.md](BUILD_94_TO_98_JOURNEY.md)** - Payment service fix progression (Builds 94-98)
- **[CURRENT_STATUS_BUILD_98.md](CURRENT_STATUS_BUILD_98.md)** - Project status as of Build 98

### Platform & Services
- **[APP_STORE_CONNECT_INVESTIGATION.md](APP_STORE_CONNECT_INVESTIGATION.md)** - App Store issues
- **[EAS_MANAGED_CERTIFICATES_INVESTIGATION.md](EAS_MANAGED_CERTIFICATES_INVESTIGATION.md)** - Certificate management
- **[FIREBASE_MULTI_ENVIRONMENT_ANALYSIS.md](FIREBASE_MULTI_ENVIRONMENT_ANALYSIS.md)** - Multi-environment
- **[MICROPHONE_PERMISSION_UX_PLAN.md](MICROPHONE_PERMISSION_UX_PLAN.md)** - Mic permissions
- **[USCCB_SCRAPER_SOLEMNITY_ISSUE.md](USCCB_SCRAPER_SOLEMNITY_ISSUE.md)** - Scraper issues

## 🐛 Troubleshooting

- **[HOW_TO_VIEW_LOGS.md](HOW_TO_VIEW_LOGS.md)** - View logs
- **[BUILD_ERROR_ANALYSIS.md](BUILD_ERROR_ANALYSIS.md)** - Build errors
- **[AZURE_SPEECH_ERROR_FIX.md](AZURE_SPEECH_ERROR_FIX.md)** - Azure Speech fixes

## 📦 Archive

- **[ARCHIVE_MANIFEST.md](ARCHIVE_MANIFEST.md)** - Archive index
- **[archive/](archive/)** - Archived documentation
  - Old session reports
  - Build history
  - Deprecated guides

---

## 📝 Documentation Standards

### Naming Convention
- Use UPPERCASE for main documentation files
- Use descriptive names (e.g., `FEATURE_NAME_GUIDE.md`)
- Use hyphens for multi-word names in assets

### File Organization
```
/
├── *.md              # Root-level main docs
├── docs/            # Additional documentation
├── archive/         # Old/deprecated docs
└── src/
    └── assets/
        └── legal-documents/  # Legal markdown files
```

### Maintenance
- Update `current-status.md` after each development session
- Update `CHANGELOG.md` for each release
- Archive old session reports to `archive/session-docs-YYYY-MM/`
- Keep this index updated when adding new docs

---

**Last Updated:** 2026-02-08
