# Security Audit - API Key Exposure

**Date**: February 7-8, 2026
**Auditor**: Automated scan during Build 97/98 investigation
**Severity**: 🔴 CRITICAL
**Status**: UNRESOLVED - Requires immediate action

---

## Executive Summary

During the Build 94-98 payment service debugging, a security scan revealed **multiple API keys exposed in the git repository**. These keys are currently:
- ✅ Tracked in version control (committed)
- ✅ Visible in git history
- ✅ Accessible to anyone with repository access
- ❌ NOT properly secured in environment variables or secrets management

**Immediate Risk**: These keys could be used to:
- Consume Google Cloud quota (financial impact)
- Access Firebase services (data access/manipulation)
- Perform unauthorized API calls on your behalf

---

## Findings

### 🔴 Finding 1: Google Cloud API Key in eas.json

**File**: `eas.json`
**Status**: Tracked in git
**Key Pattern**: `AIzaSyB0uezCk4ERGIPn8VssFjZdWT7H83uiBXo`

**Exposure Details**:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY": "AIzaSyB0uezCk4ERGIPn8VssFjZdWT7H83uiBXo"
      }
    }
  }
}
```

**Services Accessible**:
- Google Cloud Text-to-Speech
- Potentially other Google Cloud APIs
- Cloud billing/quota consumption

**Risk Level**: HIGH
- Financial: Unauthorized quota usage could result in charges
- Operational: API could be rate-limited or disabled
- Privacy: Could access project resources

---

### 🔴 Finding 2: Firebase API Key in public/index.html

**File**: `public/index.html`
**Status**: Tracked in git
**Key Pattern**: `AIzaSyDJIfZfHCif6ohNG_J-_NkaNPY2A-Ek2fc`

**Exposure Details**:
```html
<script>
  var firebaseConfig = {
    apiKey: "AIzaSyDJIfZfHCif6ohNG_J-_NkaNPY2A-Ek2fc",
    // ... other config
  };
</script>
```

**Services Accessible**:
- Firebase Authentication
- Firebase Firestore
- Firebase Cloud Functions
- Firebase Storage
- Firebase Realtime Database

**Risk Level**: CRITICAL
- Data Access: Could read/write database if rules aren't strict
- Authentication: Could create unauthorized accounts
- Financial: Cloud Functions usage could incur costs
- Privacy: User data could be exposed

**Note**: Firebase API keys in client code are somewhat acceptable if protected by Firebase Security Rules, but should still be restricted by domain/bundle ID.

---

### 🟡 Finding 3: API Keys in Test/Script Files

**Files**:
- `test-google-tts.js` (tracked in git)
- `scripts/reset-test-password.sh` (tracked in git)

**Status**: Tracked in git
**Key Patterns**: Various test/service account keys

**Risk Level**: MEDIUM
- Test keys may have limited permissions
- Script keys could have elevated permissions
- Still accessible in git history

---

### 🟡 Finding 4: Additional Keys in eas.json

**Other Exposed Keys** in `eas.json`:
- `EXPO_PUBLIC_AZURE_SPEECH_KEY`
- `EXPO_PUBLIC_FIREBASE_API_KEY` (duplicate of Finding 2)
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Notes**:
- **Stripe Publishable Key**: Safe to expose (designed for client-side)
- **Azure Speech Key**: Same risk as Google Cloud key
- **Firebase API Key**: Duplicate exposure

---

## Git History Analysis

### Findings
```bash
# Search revealed keys in multiple commits
git log --all --full-history -- '*apiKey*' '*serviceAccount*'
```

**Results**:
- Keys were previously removed
- Keys were later re-added
- Multiple commits contain exposed keys
- Full history rewrite would be needed for complete removal

### Affected Commits
- Multiple commits from Feb 6-7, 2026
- Previous commits (history not fully analyzed)
- Keys exist in:
  - Current HEAD
  - feature/dark-mode branch
  - Possibly other branches

---

## Impact Assessment

### Current Exposure Level
- **Repository Access**: Anyone with read access has keys
- **Public/Private**: Unknown (assumed private repository)
- **Team Size**: Unknown how many people have access
- **Third-party Access**: CI/CD systems may have logged keys

### Potential Attack Vectors

1. **Repository Clone**
   - Anyone cloning the repo gets all keys
   - Git history contains all historical keys

2. **CI/CD Logs**
   - Build logs may have printed keys
   - EAS build logs potentially exposed them

3. **Developer Machines**
   - Keys exist in every local clone
   - Could be in .bash_history, editor history, etc.

4. **Backup Systems**
   - Any backups of the repo contain keys
   - Cloud storage services may have cached them

---

## Remediation Plan

### Phase 1: Immediate Actions (Within 24 Hours)

#### Step 1: Rotate All Exposed Keys ⏰ URGENT

**Google Cloud API Key**:
```bash
# 1. Go to Google Cloud Console
# 2. Navigate to APIs & Services > Credentials
# 3. Find API key: AIzaSyB0uezCk4ERGIPn8VssFjZdWT7H83uiBXo
# 4. Delete or restrict the key
# 5. Create new key with restrictions:
#    - API restrictions: Only Text-to-Speech API
#    - Application restrictions: iOS bundle ID (com.readingdaily.scripture)
# 6. Update key in secure location (not git)
```

**Firebase API Key**:
```bash
# 1. Review Firebase Security Rules (most important)
# 2. Check Firebase Authentication domain restrictions
# 3. Optionally regenerate Firebase config
# 4. Ensure bundle ID restrictions are in place
```

**Azure Speech Key**:
```bash
# 1. Go to Azure Portal
# 2. Find Azure Speech Service
# 3. Regenerate keys
# 4. Update in secure environment variables
```

**Stripe Key**:
- Verify it's the publishable key (safe to expose)
- If it's the secret key, rotate immediately

#### Step 2: Remove Keys from Git

**Option A: Environment Variables (Recommended)**
```bash
# 1. Create .env file (add to .gitignore)
cat > .env << 'EOF'
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=your_new_key_here
EXPO_PUBLIC_AZURE_SPEECH_KEY=your_new_key_here
EXPO_PUBLIC_FIREBASE_API_KEY=your_new_key_here
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
EOF

# 2. Add .env to .gitignore
echo '.env' >> .gitignore

# 3. Update eas.json to reference env vars
# Remove hardcoded keys, EAS will use .env

# 4. Commit changes
git add eas.json .gitignore
git commit -m "Remove hardcoded API keys, use environment variables"
```

**Option B: EAS Secrets (More Secure for Production)**
```bash
# Store secrets in EAS (not in repository)
eas secret:create --scope project --name GOOGLE_CLOUD_API_KEY --value "your_new_key"
eas secret:create --scope project --name AZURE_SPEECH_KEY --value "your_new_key"
eas secret:create --scope project --name FIREBASE_API_KEY --value "your_new_key"

# Update eas.json to reference secrets
# EAS will inject them during build
```

#### Step 3: Clean Current Files

**Update eas.json**:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY": "$GOOGLE_CLOUD_API_KEY",
        "EXPO_PUBLIC_AZURE_SPEECH_KEY": "$AZURE_SPEECH_KEY",
        "EXPO_PUBLIC_FIREBASE_API_KEY": "$FIREBASE_API_KEY",
        "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY": "$STRIPE_PUBLISHABLE_KEY"
      }
    }
  }
}
```

**Update public/index.html**:
```html
<!-- Remove hardcoded Firebase config -->
<!-- Load from environment or separate config file not in git -->
```

**Update test-google-tts.js**:
```javascript
// Use environment variables
const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
```

---

### Phase 2: Git History Cleanup (Within 1 Week)

⚠️ **WARNING**: This is destructive and will require force-push

#### Option A: BFG Repo-Cleaner (Recommended)
```bash
# 1. Install BFG
brew install bfg

# 2. Clone a fresh copy
git clone --mirror git@github.com:youruser/yourrepo.git

# 3. Create replacement file
cat > replacements.txt << 'EOF'
AIzaSyB0uezCk4ERGIPn8VssFjZdWT7H83uiBXo==>YOUR_GOOGLE_API_KEY_REMOVED
AIzaSyDJIfZfHCif6ohNG_J-_NkaNPY2A-Ek2fc==>YOUR_FIREBASE_API_KEY_REMOVED
EOF

# 4. Run BFG
bfg --replace-text replacements.txt yourrepo.git

# 5. Clean up
cd yourrepo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. Force push (coordinate with team first!)
git push --force
```

#### Option B: git filter-branch
```bash
# WARNING: Complex and slow, use BFG instead if possible

git filter-branch --tree-filter '
  if [ -f "eas.json" ]; then
    sed -i "s/AIzaSyB0uezCk4ERGIPn8VssFjZdWT7H83uiBXo/YOUR_KEY_REMOVED/g" eas.json
    sed -i "s/AIzaSyDJIfZfHCif6ohNG_J-_NkaNPY2A-Ek2fc/YOUR_KEY_REMOVED/g" eas.json
  fi
  if [ -f "public/index.html" ]; then
    sed -i "s/AIzaSyDJIfZfHCif6ohNG_J-_NkaNPY2A-Ek2fc/YOUR_KEY_REMOVED/g" public/index.html
  fi
' --all

# Force push
git push --force --all
```

#### Team Coordination Required
1. Notify all team members BEFORE force-push
2. Have everyone backup their local branches
3. After force-push, everyone must:
   ```bash
   git fetch origin
   git reset --hard origin/feature/dark-mode
   ```

---

### Phase 3: Preventive Measures (Ongoing)

#### 1. Git Hooks - Pre-commit Secret Scanning
```bash
# Install git-secrets
brew install git-secrets

# Setup in repository
cd /path/to/repo
git secrets --install
git secrets --register-aws  # Detects AWS keys

# Add custom patterns
git secrets --add 'AIza[0-9A-Za-z\\-_]{35}'  # Google API keys
git secrets --add 'sk_live_[0-9A-Za-z]{24}'  # Stripe secret keys
git secrets --add 'AKIA[0-9A-Z]{16}'         # AWS access keys

# This will prevent commits with secrets
```

#### 2. .gitignore Configuration
```bash
# Add to .gitignore
cat >> .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.*.local

# API Keys and Secrets
**/secrets.json
**/service-account-*.json
**/*-credentials.json

# Test files with keys
test-google-tts.js
scripts/reset-test-password.sh

# Build artifacts that might contain keys
*.log
*.env.production
EOF
```

#### 3. CI/CD Secret Scanning
- Enable GitHub Secret Scanning (if using GitHub)
- Configure GitGuardian or similar service
- Set up alerts for exposed secrets

#### 4. Developer Training
- Document secrets management policy
- Train team on environment variables
- Review before every commit

#### 5. Regular Audits
```bash
# Monthly secret scan
git log --all --full-history -p | grep -E 'AIza|sk_live|AKIA' > audit.log

# Check for new exposures
git log --since="1 month ago" -p -- '*.json' '*.html' '*.js' | grep -E 'apiKey|secret'
```

---

## Best Practices Going Forward

### 1. Environment Variables
```bash
# Development
.env                    # Local development (gitignored)
.env.example           # Template (committed, no real values)

# Production
EAS Secrets            # For builds
Firebase Config        # Remote Config for runtime
```

### 2. Configuration Management

**Good Example** (.env.example):
```bash
# Google Cloud
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=your_key_here

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_key_here

# Azure
EXPO_PUBLIC_AZURE_SPEECH_KEY=your_key_here

# Stripe (publishable key - safe to expose)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Bad Example** (eas.json - current state):
```json
{
  "env": {
    "EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY": "AIzaSyB0uezCk4ERGIPn8VssFjZdWT7H83uiBXo"  // ❌ NEVER
  }
}
```

### 3. API Key Restrictions

**Google Cloud API Keys**:
- Set application restrictions (iOS bundle ID)
- Set API restrictions (only required APIs)
- Enable quotas/rate limits
- Monitor usage in Cloud Console

**Firebase**:
- Implement strict Security Rules
- Restrict to app bundle IDs
- Enable App Check
- Monitor authentication anomalies

**Azure**:
- Use managed identities when possible
- Rotate keys regularly
- Set up usage alerts
- Implement rate limiting

---

## Testing After Remediation

### Verify Keys Removed
```bash
# Should return no results
git log --all -p | grep -E 'AIzaSyB0uezCk4ERGIPn8VssFjZdWT7H83uiBXo|AIzaSyDJIfZfHCif6ohNG_J-_NkaNPY2A-Ek2fc'

# Check current files
grep -r 'AIza' . --exclude-dir=node_modules --exclude-dir=.git
```

### Verify App Still Works
1. Build with new environment variables
2. Test Google TTS functionality
3. Test Firebase connectivity
4. Test Azure Speech (if used)
5. Test Stripe payments

### Verify EAS Secrets
```bash
# List configured secrets
eas secret:list

# Verify they're being used
eas build --platform ios --profile production --no-wait
# Check build logs for secret injection
```

---

## Monitoring and Detection

### Set Up Alerts

**Google Cloud**:
- Enable billing alerts
- Set up quota alerts
- Monitor API usage dashboard
- Alert on unusual traffic patterns

**Firebase**:
- Enable security monitoring
- Set up authentication anomaly detection
- Monitor database read/write patterns
- Alert on unusual geographic access

**Azure**:
- Configure cost alerts
- Monitor Speech API usage
- Set up geographic restrictions
- Alert on quota exceeded

### Regular Reviews
- [ ] Weekly: Review API usage dashboards
- [ ] Monthly: Audit git commits for secrets
- [ ] Quarterly: Rotate all API keys
- [ ] Yearly: Full security audit

---

## Incident Response

### If Keys Are Compromised

**Immediate Actions**:
1. **Rotate keys immediately** (within minutes)
2. **Check API usage logs** for unauthorized calls
3. **Review billing** for unexpected charges
4. **Check Firebase/Cloud logs** for data access
5. **Notify team** of the incident

**Investigation**:
1. Determine scope of exposure
2. Identify when keys were exposed
3. Check for unauthorized access
4. Document findings

**Communication**:
1. Notify stakeholders if user data accessed
2. Report to legal/compliance if required
3. Document incident for future prevention

---

## Compliance Considerations

### Data Protection Regulations
- **GDPR**: API keys securing EU user data
- **CCPA**: California user data protection
- **HIPAA**: If handling health data
- **PCI DSS**: If Stripe secret key was exposed

### Disclosure Requirements
- Check if breach notification required
- Review terms of service for cloud providers
- Document incident response

---

## Cost of Exposure

### Potential Costs

**Google Cloud**:
- Unauthorized API calls: $0.000004/character (TTS)
- If 1M characters/day: ~$4/day = $120/month
- Worst case (millions of requests): $$$

**Firebase**:
- Database reads/writes
- Cloud Functions invocations
- Storage bandwidth
- Potentially thousands per month

**Azure**:
- Speech API calls
- Similar to Google Cloud costs

**Total Potential Impact**: $100s - $1,000s+ per month if actively exploited

---

## Action Items Checklist

### Immediate (Within 24 Hours)
- [ ] Rotate Google Cloud API key
- [ ] Restrict new Google Cloud key (bundle ID, API scope)
- [ ] Review Firebase Security Rules
- [ ] Rotate Azure Speech key
- [ ] Remove keys from eas.json
- [ ] Remove keys from public/index.html
- [ ] Remove keys from test files
- [ ] Set up .env file
- [ ] Add .env to .gitignore
- [ ] Configure EAS secrets
- [ ] Test build with new secrets
- [ ] Commit and push changes

### Short Term (Within 1 Week)
- [ ] Clean git history with BFG
- [ ] Coordinate team on force-push
- [ ] Force-push cleaned history
- [ ] Verify history cleanup
- [ ] Install git-secrets
- [ ] Configure pre-commit hooks
- [ ] Update .gitignore
- [ ] Create .env.example template
- [ ] Document secrets management process

### Medium Term (Within 1 Month)
- [ ] Enable GitHub secret scanning
- [ ] Set up GitGuardian or similar
- [ ] Configure cloud monitoring alerts
- [ ] Review and tighten Firebase rules
- [ ] Implement API key rotation schedule
- [ ] Train team on security practices
- [ ] Create security documentation

### Ongoing
- [ ] Monthly secret scans
- [ ] Quarterly key rotation
- [ ] Regular security audits
- [ ] Monitor cloud usage/billing
- [ ] Review access logs

---

## References

- **Google Cloud API Security**: https://cloud.google.com/docs/authentication/api-keys
- **Firebase Security Rules**: https://firebase.google.com/docs/rules
- **BFG Repo-Cleaner**: https://rtyley.github.io/bfg-repo-cleaner/
- **git-secrets**: https://github.com/awslabs/git-secrets
- **EAS Secrets**: https://docs.expo.dev/build-reference/variables/

---

## Audit Trail

- **February 7, 2026**: Initial discovery during Build 97/98 debugging
- **February 8, 2026**: Security audit document created
- **Status**: UNRESOLVED - Awaiting remediation
- **Priority**: CRITICAL
- **Owner**: Project maintainer

---

**END OF SECURITY AUDIT**

⚠️ This document contains sensitive information. Restrict access appropriately.
