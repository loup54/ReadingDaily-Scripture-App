# USCCB Scraper - Solemnity/Feast Day Issue
**Date:** December 18, 2025
**Priority:** 🟡 MEDIUM
**Issue:** Scraper fails on major feast days with multiple Mass options

---

## 🔍 Root Cause Analysis

### **What Happened:**
December 25, 2025 (Christmas) failed to scrape:
```
ERROR: Missing required readings for 2025-12-25
ERROR: ❌ Failed to scrape 2025-12-25
```

### **Why It Failed:**

**Normal Day URL:**
```
https://bible.usccb.org/bible/readings/121725.cfm
→ Single set of readings (1st, Psalm, Gospel)
→ Standard HTML structure
→ Scraper works ✅
```

**Christmas Day URL:**
```
https://bible.usccb.org/bible/readings/122525.cfm
→ Landing page with 4 Mass options:
   • Vigil Mass (Lectionary 13)
   • Mass during the Night (Lectionary 14)
   • Mass at Dawn (Lectionary 15)
   • Mass during the Day (Lectionary 16)
→ Each link goes to separate reading page
→ Scraper sees no readings on landing page ❌
```

**USCCB Structure for Solemnities:**
```html
<!-- Normal Day -->
<div class="content-body">
  <p>Gospel text here...</p>
</div>

<!-- Christmas/Major Solemnity -->
<div class="mass-options">
  <a href="/bible/lectionary/13">Vigil Mass</a>
  <a href="/bible/lectionary/14">Night Mass</a>
  <a href="/bible/lectionary/15">Dawn Mass</a>
  <a href="/bible/lectionary/16">Day Mass</a>
</div>
```

---

## 📅 Affected Dates (Major Solemnities)

### **Christmas Season:**
- ✅ **December 24** - Christmas Eve (works - single reading)
- ❌ **December 25** - Christmas Day (FAILS - 4 Masses)
- ✅ **December 26** - St. Stephen (works)
- ✅ **January 1** - Mary, Mother of God (likely FAILS - solemnity)
- ✅ **January 6** - Epiphany (may fail if Sunday, works if weekday)

### **Easter Season:**
- ❌ **Holy Thursday** - Mass of the Lord's Supper (FAILS - special liturgy)
- ❌ **Good Friday** - Passion of the Lord (FAILS - special structure)
- ❌ **Easter Vigil** - Saturday night (FAILS - 7+ readings)
- ❌ **Easter Sunday** - (FAILS - multiple Masses)

### **Other Solemnities (Likely to Fail):**
- ❌ **Pentecost Sunday** - May have vigil option
- ❌ **Ascension Thursday** - If celebrated on Thursday
- ❌ **Immaculate Conception** (Dec 8) - Major solemnity
- ❌ **Assumption** (Aug 15) - Major solemnity
- ❌ **All Saints** (Nov 1) - Major solemnity

### **Total Estimated Failures Per Year:**
- **~10-15 days** out of 365 (3-4% of year)
- All are major liturgical celebrations
- Users will definitely notice on these important days

---

## 🎯 Impact Assessment

### **Low Risk:**
- Only 3-4% of year affected
- Mostly predictable dates (Christmas, Easter, etc.)
- Demo fallback will show on these days

### **Medium Risk:**
- These are the **most important liturgical days** of the year
- Users **most likely to use app** on these days
- Showing "Demo" on Christmas would be embarrassing

### **High Risk:**
- If we remove demo fallback (as planned), app will crash/show nothing
- Could affect user trust on most important days
- Easter Vigil failure would be especially bad (Saturday night service)

---

## 💡 Solution Options

### **Option 1: Default to "Day Mass" Reading** (Quick Fix - 1 hour)

**Approach:**
1. Detect if landing page (no readings found)
2. Check for links to specific Masses
3. Default to "Mass during the Day" (most attended)
4. Scrape that page instead

**Pros:**
✅ Quick to implement
✅ Covers 90% of use cases
✅ Users get real readings for Christmas

**Cons:**
❌ Doesn't give users choice of which Mass
❌ Some may attend Vigil/Night Mass and want those readings
❌ Still single-point-of-failure

**Code Change:**
```python
# In usccb_scraper.py, add to scrape() method:
def scrape(self, date):
    # ... existing code ...

    # Check if this is a multi-mass page
    mass_links = soup.find_all('a', href=re.compile(r'lectionary/\d+'))
    if mass_links and not reading_data['gospel']:
        # Multiple Mass options - default to last one (usually "Day Mass")
        day_mass_link = mass_links[-1]  # Last link is usually "Mass during the Day"
        day_mass_url = f"https://bible.usccb.org{day_mass_link['href']}"
        logger.info(f"Multi-mass day detected, using: {day_mass_url}")
        return self._scrape_lectionary(day_mass_url, date)

    # ... rest of validation ...
```

---

### **Option 2: Store All Mass Options** (Comprehensive - 3 hours)

**Approach:**
1. Detect multi-mass pages
2. Scrape ALL Mass options (Vigil, Night, Dawn, Day)
3. Store as separate "variants" in Firestore
4. Let user choose which Mass in app settings

**Firestore Schema:**
```json
{
  "date": "2025-12-25",
  "masses": [
    {
      "massType": "vigil",
      "lectionary": 13,
      "firstReading": {...},
      "gospel": {...}
    },
    {
      "massType": "night",
      "lectionary": 14,
      "firstReading": {...},
      "gospel": {...}
    },
    // ... etc
  ]
}
```

**App Changes Needed:**
- Add Mass selector in UI ("Which Mass did you attend?")
- Save user preference (e.g., "I always go to Vigil")
- Display appropriate reading based on selection

**Pros:**
✅ Liturgically accurate
✅ Gives users choice
✅ Professional/complete solution

**Cons:**
❌ Requires app UI changes
❌ More complex Firestore schema
❌ Takes longer to implement
❌ More storage used

---

### **Option 3: Manual Override for Known Dates** (Safest - 30 min)

**Approach:**
1. Maintain list of known problematic dates
2. For these dates, use hardcoded lectionary URLs
3. Scrape directly from lectionary page

**Implementation:**
```python
# Special dates that need lectionary-based scraping
SPECIAL_DATES = {
    '12-25': 16,  # Christmas Day → Lectionary 16 (Day Mass)
    '01-01': 18,  # Mary, Mother of God
    'easter': 42,  # Easter Sunday (calculated dynamically)
}

def scrape(self, date):
    date_key = date.strftime('%m-%d')

    if date_key in SPECIAL_DATES:
        lectionary_num = SPECIAL_DATES[date_key]
        return self._scrape_lectionary(lectionary_num, date)

    # Normal scraping logic...
```

**Pros:**
✅ Very safe (tested manually first)
✅ Quick to implement
✅ No schema changes needed
✅ Easy to maintain

**Cons:**
❌ Requires manual mapping of ~15 dates
❌ Brittle (USCCB changes lectionary numbers)
❌ Still doesn't give users choice

---

## 🚀 Recommended Approach

**Phase 1 (Now - 30 min):** Option 3 (Manual Override)
- Quick fix for Christmas, Easter, major feasts
- Safe and predictable
- Gets us through 2025-2026

**Phase 2 (Future - 3 hours):** Option 2 (Store All Masses)
- Better long-term solution
- Requires app UI updates
- Plan for Build 56 or later

---

## 📝 Implementation Plan - Phase 1

### **Step 1: Create Lectionary URL Mapping** (5 min)

Add to `usccb_scraper.py`:
```python
SOLEMNITY_LECTIONARY_MAP = {
    # Christmas Season
    '12-25': 16,  # Christmas Day - Mass during the Day
    '01-01': 18,  # Mary, Mother of God

    # Easter Season (TODO: Calculate dynamically)
    # '04-20-2025': 42,  # Easter Sunday 2025

    # Fixed Solemnities
    '08-15': 622,  # Assumption
    '11-01': 667,  # All Saints
    '12-08': 689,  # Immaculate Conception
}
```

### **Step 2: Add Lectionary Scraper Method** (15 min)

```python
def _scrape_lectionary(self, lectionary_num, date):
    """Scrape directly from lectionary page"""
    url = f"https://bible.usccb.org/bible/lectionary/{lectionary_num}"
    logger.info(f"Scraping lectionary {lectionary_num}: {url}")

    response = self.session.get(url, timeout=10)
    soup = BeautifulSoup(response.content, 'html.parser')

    # Same extraction logic as normal scrape
    # ...
```

### **Step 3: Update Main Scrape Method** (10 min)

```python
def scrape(self, date):
    date_key = date.strftime('%m-%d')

    # Check if this is a known solemnity
    if date_key in self.SOLEMNITY_LECTIONARY_MAP:
        return self._scrape_lectionary(
            self.SOLEMNITY_LECTIONARY_MAP[date_key],
            date
        )

    # Continue with normal URL-based scraping...
```

---

## 🧪 Testing Plan

### **Test Dates:**
```bash
# Re-run populate script and check these dates:
python populate_readings.py

# Should now succeed:
✅ December 25, 2025 (Christmas)
✅ January 1, 2026 (Mary, Mother of God)
```

### **Verification:**
1. Check Firestore for Dec 25 readings
2. Verify readings match USCCB Day Mass
3. Test in app - should show "First Reading" not "First Reading (Demo)"

---

## 📊 Current Status

**Readings Populated:** 28/29 days (96.5% success rate)

**Failed Dates:**
- December 25, 2025 (Christmas) - ❌ FAILED

**Projected Failures (Without Fix):**
- January 1, 2026 (Mary, Mother of God)
- Easter Vigil & Sunday (April 2025)
- ~10-12 other major feasts

**With Phase 1 Fix:**
- Expected success rate: ~99%
- Only edge cases (new feast days, USCCB changes) would fail

---

## ⏰ Timeline

### **Option A: Fix Now (Recommended)**
1. Implement Phase 1 manual override (30 min)
2. Re-run populate script (5 min)
3. Verify Christmas readings work (5 min)
4. Create Build 55 with working Christmas (10 min)
**Total:** 50 minutes

### **Option B: Ship Build 55, Fix Later**
1. Ship Build 55 now with 28/29 days
2. Christmas shows "Demo" reading (acceptable?)
3. Fix after Christmas, ready for Easter
**Advantage:** Faster to production
**Risk:** Users see demo on Christmas (most important day)

---

## 🎯 Recommendation

**Ship Build 55 now, fix scraper for Build 56:**

**Reasoning:**
- Christmas is 7 days away
- 28/29 days is 96.5% success
- Users already using app will have readings through Jan 8
- Gives time to properly test lectionary scraping
- Can manually add Dec 25 to Firestore if needed

**Or:**

**Fix now if you want perfect Christmas experience:**
- Small risk of breaking working scraper
- But ensures Christmas Day works perfectly
- Good for user impression on most important liturgical day

---

## 📚 Related Files

- `functions/scrapers/usccb_scraper.py` - Main scraper logic
- `functions/populate_readings.py` - Population script
- `READING_SCRAPER_REACTIVATION_PLAN.md` - Overall scraper plan

---

**Decision needed:** Fix now or ship Build 55 and fix later?
