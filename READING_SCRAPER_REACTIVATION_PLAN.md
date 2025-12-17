# Reading Scraper System Re-Activation Plan
**Date:** December 17, 2025
**Build:** 53+
**Priority:** 🔴 CRITICAL
**Issue:** Demo readings showing instead of real scripture data

---

## 📋 Executive Summary

Your requirement: **"There is to be no demo, fall back etc type data on this app."**

The reading scraper system exists but is **NOT currently running automatically**. This plan outlines how to:
1. Re-activate the automated daily scraper
2. Populate historical readings (1 week back, 3 weeks forward)
3. Set up Cloud Scheduler for daily updates
4. Remove demo fallback code entirely

---

## 🔍 Current System Analysis

### **What Exists:**

✅ **populate_readings.py**
- Location: `/functions/populate_readings.py`
- Function: Scrapes USCCB and stores in Firestore
- Window: 7 days back, 21 days forward (28-day total)
- Status: **Manual execution only** (no automation)

✅ **Cloud Functions (main.py)**
- `manual_scrape()` - HTTP endpoint for manual scraping
- `scrape_reading_for_date()` - Core scraping logic
- `cleanup_old_readings()` - Storage cleanup function
- Status: **Deployed but NO scheduler function exists**

✅ **USCCB Scraper**
- Location: `/functions/scrapers/usccb_scraper.py`
- Validates and checksums all readings
- Works reliably

### **What's Missing:**

❌ **No automated daily scheduler**
- `scheduler_fn` imported but **never used**
- No Cloud Scheduler trigger configured
- No automatic daily runs

❌ **No initial population done**
- December 2025 readings not in Firestore
- Only November 8-9 in bundled JSON

❌ **Demo fallback still active**
- `ReadingService.ts` still has `getDemoReading()` function
- App falls back to demo when no data found

---

## 🎯 **Your Original System (What We're Restoring)**

Based on your feedback:
> "Previously we had the readings populated 1 week before and 3 weeks after the current date with a daily update mechanism coded in and operating."

**The Vision:**
```
Today: Dec 17, 2025
└─ Populated Range:
   ├─ 1 week back:  Dec 10 - Dec 16  (historical reference)
   ├─ Today:        Dec 17            (current)
   └─ 3 weeks ahead: Dec 18 - Jan 7   (future planning)

Daily at 1:00 AM UTC:
- Scrape tomorrow's reading
- Delete readings older than 7 days
- Validate all new data
```

---

## 📝 **Implementation Plan**

### **Phase 1: Immediate Population** (30 min)

**Goal:** Fill Firestore with current readings so app stops showing "Demo"

**Steps:**

1. **Activate Python environment**
   ```bash
   cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App/functions
   source venv/bin/activate
   ```

2. **Verify Firebase login**
   ```bash
   firebase login
   firebase projects:list
   # Should show: readingdaily-scripture-fe502
   ```

3. **Run initial population**
   ```bash
   # Option A: Use existing populate_readings.py (7 days back, 21 days forward)
   python populate_readings.py

   # Option B: Custom date range for December
   # (Need to modify script to accept args)
   python populate_readings.py --start-date 2025-12-10 --end-date 2026-01-07
   ```

4. **Verify in Firestore**
   ```bash
   # Check Firebase console or use CLI
   firebase firestore:get readings/2025-12-17
   ```

**Expected Output:**
```
📅 Populating readings from 2025-12-10 to 2026-01-07
==================================================
Processing 2025-12-10...
✅ Successfully stored 2025-12-10
Processing 2025-12-11...
✅ Successfully stored 2025-12-11
...
✅ Complete! Success: 29, Failed: 0
```

**Validation:**
- Open app
- Navigate to Dec 13, 2025
- **Should see:** Real reading from Isaiah/Gospel (NOT "Demo")

---

### **Phase 2: Create Automated Daily Scraper** (1 hour)

**Goal:** Add Cloud Scheduler function to run daily at 1:00 AM UTC

**File:** `/functions/main.py`

**Add this code at the end of main.py:**

```python
@scheduler_fn.on_schedule(schedule="0 1 * * *")  # Daily at 1:00 AM UTC
def daily_reading_scraper(event: scheduler_fn.ScheduledEvent) -> None:
    """
    Automated daily scraper
    Runs at 1:00 AM UTC every day

    Tasks:
    1. Scrape readings for next 3 weeks
    2. Delete readings older than 7 days
    3. Validate all data
    """
    logger.info("🕐 Daily scraper started")

    try:
        db = get_db()
        today = datetime.now(pytz.UTC).date()

        # Calculate window (1 week back, 3 weeks forward)
        start_date = today - timedelta(days=7)
        end_date = today + timedelta(days=21)

        success_count = 0
        failure_count = 0

        logger.info(f"📅 Scraping window: {start_date} to {end_date}")

        # Scrape each day in window
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.isoformat()

            # Check if reading already exists and is recent
            doc_ref = db.collection('readings').document(date_str)
            doc = doc_ref.get()

            if doc.exists:
                # Check if less than 24 hours old
                metadata = doc.to_dict().get('metadata', {})
                scraped_at_str = metadata.get('scrapedAt')

                if scraped_at_str:
                    scraped_at = datetime.fromisoformat(scraped_at_str.replace('Z', '+00:00'))
                    age_hours = (datetime.now(pytz.UTC) - scraped_at).total_seconds() / 3600

                    if age_hours < 24:
                        logger.info(f"⏭️  Skipping {date_str} (fresh, {age_hours:.1f}h old)")
                        current_date += timedelta(days=1)
                        continue

            # Scrape reading
            try:
                reading = scrape_reading_for_date(current_date)

                if reading:
                    # Validate
                    is_valid, errors = validate_reading(reading)

                    if is_valid:
                        # Calculate checksum
                        checksum = calculate_checksum(reading)

                        # Add metadata
                        reading['metadata'] = {
                            'scrapedAt': datetime.now(pytz.UTC).isoformat(),
                            'source': reading.get('metadata', {}).get('source', 'USCCB'),
                            'checksum': checksum,
                            'validated': True,
                            'version': '1.0',
                            'scheduledRun': True
                        }

                        # Store in Firestore
                        doc_ref.set(reading)
                        logger.info(f"✅ Stored {date_str}")
                        success_count += 1
                    else:
                        logger.error(f"❌ Validation failed for {date_str}: {errors}")
                        failure_count += 1
                else:
                    logger.error(f"❌ Scraping failed for {date_str}")
                    failure_count += 1

            except Exception as e:
                logger.error(f"❌ Error processing {date_str}: {str(e)}")
                failure_count += 1

            current_date += timedelta(days=1)

        # Cleanup old readings (older than 7 days)
        cleanup_cutoff = today - timedelta(days=7)
        cleanup_old_readings(cleanup_cutoff)

        logger.info(f"✅ Daily scraper complete! Success: {success_count}, Failed: {failure_count}")

    except Exception as e:
        logger.error(f"❌ Daily scraper error: {str(e)}")
        raise
```

**Deploy to Firebase:**
```bash
cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App/functions
firebase deploy --only functions:daily_reading_scraper
```

**Expected Output:**
```
✔  functions[daily_reading_scraper(us-central1)] Successful create operation.
Function URL: https://us-central1-readingdaily-scripture-fe502.cloudfunctions.net/daily_reading_scraper
Trigger: scheduler (0 1 * * *)
```

---

### **Phase 3: Remove Demo Fallback Code** (30 min)

**Goal:** Enforce "NO demo data" policy in app code

**File:** `src/services/readings/ReadingService.ts`

**Current Code (Lines 171-174):**
```typescript
// Final fallback: Demo reading for testing (only for past/current dates)
console.warn('⚠️ No data found, using demo reading for testing');
return this.getDemoReading(date);
```

**Replace With:**
```typescript
// NO DEMO DATA - Show error if reading not available
console.error('❌ No reading data available for', dateStr);
throw new Error(`Reading not available for ${dateStr}. Please check your internet connection and try again.`);
```

**Also Remove:**
1. Entire `getDemoReading()` function (lines 227-267)
2. References to "Demo Mode" in comments

**Add User-Friendly Error Handling:**

In the component that calls `getDailyReadings()`:

```typescript
try {
  const reading = await ReadingService.getDailyReadings(selectedDate);
  setReading(reading);
} catch (error) {
  Alert.alert(
    'Reading Unavailable',
    'The reading for this date is not yet available. Our team updates readings daily. Please try again later or select a different date.',
    [
      { text: 'Select Another Date', onPress: () => {/* Navigate to date picker */} },
      { text: 'OK' }
    ]
  );
}
```

---

### **Phase 4: Monitoring & Alerting** (30 min)

**Goal:** Know when scraper fails so you can fix it quickly

**Option A: Firebase Logs**
```bash
# View logs
firebase functions:log --only daily_reading_scraper

# Set up log export to BigQuery (for analysis)
gcloud logging sinks create reading-scraper-errors \
  bigquery.googleapis.com/projects/readingdaily-scripture-fe502/datasets/function_logs \
  --log-filter='resource.type="cloud_function" AND resource.labels.function_name="daily_reading_scraper" AND severity>=ERROR'
```

**Option B: Email Alerts (Recommended)**

Add to Cloud Function:

```python
def send_failure_alert(date_str, error_message):
    """Send email when scraping fails"""
    # Use SendGrid, Mailgun, or Firebase Extensions
    try:
        # Example with SendGrid
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email='alerts@readingdaily-scripture.app',
            to_emails='louispage@icloud.com',
            subject=f'⚠️ Reading Scraper Failed: {date_str}',
            html_content=f"""
            <h2>Scraper Failure Alert</h2>
            <p><strong>Date:</strong> {date_str}</p>
            <p><strong>Error:</strong> {error_message}</p>
            <p><strong>Action Required:</strong> Check logs and re-run scraper manually</p>
            """
        )

        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        logger.info(f"Alert sent: {response.status_code}")

    except Exception as e:
        logger.error(f"Failed to send alert: {str(e)}")
```

**Call in scraper when failures occur:**
```python
if failure_count > 0:
    send_failure_alert(date_str, f"{failure_count} readings failed to scrape")
```

---

## 🧪 **Testing Checklist**

### **Manual Testing:**

**Test 1: Initial Population**
- [ ] Run `populate_readings.py`
- [ ] Check Firestore has readings for Dec 10 - Jan 7
- [ ] Open app → Navigate to Dec 13 → See real reading (NOT Demo)
- [ ] Check Dec 17 (today) → See real reading
- [ ] Check Jan 5 (future) → See real reading

**Test 2: Scheduler Function**
- [ ] Deploy daily_reading_scraper function
- [ ] Trigger manually: `firebase functions:call daily_reading_scraper`
- [ ] Check logs: `firebase functions:log`
- [ ] Verify new readings added to Firestore

**Test 3: Demo Removal**
- [ ] Remove getDemoReading() code
- [ ] Build app
- [ ] Delete Firestore reading for tomorrow
- [ ] Try to view tomorrow's reading
- [ ] **Expected:** Error message (NOT demo data)

**Test 4: Cleanup**
- [ ] Wait 7+ days (or manually trigger with old date)
- [ ] Verify old readings deleted from Firestore
- [ ] Check storage usage decreased

---

## 📊 **Success Metrics**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Readings populated** | 29 days (7 back + today + 21 forward) | Firestore collection count |
| **Scraper uptime** | 99%+ | Cloud Functions logs |
| **Demo reading usage** | 0% | Remove code entirely |
| **Storage usage** | < 100 MB | Firestore console |
| **Scraper run time** | < 5 minutes daily | Cloud Functions metrics |

---

## 💰 **Cost Estimate**

**Firebase Cloud Functions:**
- Invocations: 1/day = 30/month
- Execution time: ~5 min/day = 150 min/month
- Cost: **$0.00** (within free tier: 2M invocations, 400K GB-sec)

**Firestore:**
- Storage: ~100 MB (29 readings × 3.5 MB average)
- Reads: ~1000/day (users loading readings)
- Writes: ~30/day (scraper updates)
- Cost: **~$0.50/month**

**Total Monthly Cost:** **< $1.00**

---

## 🚨 **Failure Scenarios & Recovery**

### **Scenario 1: USCCB Website Down**
**Symptom:** Scraper returns null for all dates

**Recovery:**
1. Add fallback scraper (Catholic.org, Universalis)
2. Log error and alert admin
3. Manual scrape when site recovers
4. Re-deploy with retry logic

**Code Fix:**
```python
# In scrape_reading_for_date()
scrapers = [
    USCCBScraper(),
    CatholicOrgScraper(),  # Add fallback
    UniversalisScraper()   # Add second fallback
]

for scraper in scrapers:
    reading = scraper.scrape(date)
    if reading:
        return reading
```

### **Scenario 2: Cloud Function Timeout**
**Symptom:** Function exceeds 60-second timeout

**Recovery:**
1. Reduce scraping window (scrape 1 week instead of 3)
2. Increase timeout in firebase.json
3. Split into multiple smaller functions

**Code Fix:**
```json
// firebase.json
{
  "functions": {
    "timeout": "300s",  // 5 minutes
    "memory": "512MB"
  }
}
```

### **Scenario 3: Firestore Write Quota Exceeded**
**Symptom:** "Quota exceeded" errors in logs

**Recovery:**
1. Implement rate limiting (batch writes)
2. Increase Firestore quota
3. Cache readings locally to reduce writes

---

## 📅 **Rollout Timeline**

### **Day 1 (Today - Dec 17)**
- ✅ Phase 1: Run initial population (30 min)
- ✅ Test in app (15 min)
- ✅ Commit changes to git

### **Day 2 (Dec 18)**
- ⏳ Phase 2: Add scheduler function (1 hour)
- ⏳ Deploy to Firebase (15 min)
- ⏳ Test manual trigger (15 min)

### **Day 3 (Dec 19)**
- ⏳ Phase 3: Remove demo code (30 min)
- ⏳ Build and test app (30 min)
- ⏳ Submit Build 53.2 to TestFlight

### **Day 4 (Dec 20)**
- ⏳ Phase 4: Set up monitoring (30 min)
- ⏳ Verify scheduler ran automatically
- ⏳ Monitor for 1 week

---

## 🎯 **Next Steps**

### **Immediate (Today):**
1. Run `populate_readings.py` to fill December readings
2. Test app shows real data (not Demo)
3. Commit changes

### **This Week:**
1. Add scheduler function to `main.py`
2. Deploy to Firebase
3. Remove demo fallback code
4. Build 53.2 with fixes

### **Next Week:**
1. Monitor daily scraper runs
2. Set up alerting
3. Add fallback scrapers
4. Document for future maintenance

---

## 📁 **Files Modified**

| File | Changes | Purpose |
|------|---------|---------|
| `functions/main.py` | Add daily_reading_scraper() | Automated daily scraping |
| `src/services/readings/ReadingService.ts` | Remove getDemoReading() | No demo fallback |
| `firebase.json` | Update timeout/memory | Handle longer scraping |
| `.github/workflows/scraper-health.yml` | Add health check | Monitor scraper uptime |

---

## ✅ **Definition of Done**

Scraper re-activation is COMPLETE when:
- [ ] Firestore has readings for next 3 weeks
- [ ] Cloud Scheduler runs daily at 1:00 AM UTC
- [ ] Demo fallback code completely removed
- [ ] App shows real readings for all dates in window
- [ ] Monitoring/alerting configured
- [ ] Zero "Demo" readings visible in production
- [ ] Documented for future maintenance

---

**This plan restores your original vision: "1 week before and 3 weeks after the current date with a daily update mechanism."**

Ready to implement Phase 1 (immediate population) now?
