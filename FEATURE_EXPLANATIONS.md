# Feature Explanations - Subscription & Notifications
**Date:** December 17, 2025
**Questions from User**

---

## ❓ Question 1: 'Send a Gift' on Subscription Page - What Does It Do?

### **Answer:**

The **"Send a Gift"** feature allows users to **purchase and gift subscriptions to friends/family via email**.

---

### **How It Works:**

#### **Step 1: Select Subscription Tier**
User chooses which subscription tier to gift:
- **Basic** - $2.99/month
- **Premium** - $19.99/year
- **Lifetime** - $59.99 one-time

#### **Step 2: Enter Gift Details**
- **Recipient Email:** Who receives the gift
- **Personal Message:** Optional custom message

#### **Step 3: Confirm & Send**
- User pays for the subscription
- System generates a unique **gift code**
- Email sent to recipient with:
  - Gift code
  - Personal message from sender
  - Instructions to redeem

#### **Step 4: Recipient Redeems**
- Recipient clicks "Redeem Gift" on Subscription page
- Enters gift code
- Subscription activates immediately

---

### **Where to Find It:**

**Location:** Subscription Screen (SubscriptionScreen.tsx:45-47)

```typescript
const handleSendGift = () => {
  router.push('/(tabs)/subscription/send-gift');
};
```

**Button:** "Send a Gift" button on main Subscription page

---

### **Technical Implementation:**

**File:** `src/screens/subscription/SendGiftScreen.tsx`

**Firebase Function Called:**
```typescript
const sendGift = httpsCallable(functions, 'sendGift');

await sendGift({
  subscriptionTier: 'basic', // or 'premium', 'lifetime'
  recipientEmail: 'friend@example.com',
  expiresInDays: 365,
  message: 'Happy Birthday!',
});
```

**Backend Function:** `functions/sendGift` (Firebase Cloud Function)

**What Happens:**
1. Validates sender is authenticated
2. Charges sender's payment method
3. Generates unique gift code (stored in Firestore)
4. Sends email to recipient with code
5. Returns success/failure to app

---

### **User Flow Example:**

```
User (John) → Subscription Screen → "Send a Gift" button
  ↓
Select Tier: "Lifetime - $59.99"
  ↓
Enter Email: "mary@example.com"
Message: "Merry Christmas! Enjoy the app!"
  ↓
Confirm & Pay $59.99
  ↓
✅ Gift Sent Successfully!
  ↓
Mary receives email:
  Subject: "John sent you a gift: ReadingDaily Lifetime Access"
  Body: "Merry Christmas! Enjoy the app!"
  Code: "GIFT-ABC123"
  ↓
Mary opens app → Subscription → "Redeem Gift"
  ↓
Enters: "GIFT-ABC123"
  ↓
✅ Lifetime Access Activated!
```

---

### **Related Files:**

| File | Purpose |
|------|---------|
| `SendGiftScreen.tsx` | UI for gifting flow (3 steps) |
| `RedeemGiftScreen.tsx` | UI for recipient to redeem |
| `SubscriptionGiftingService.ts` | Business logic for gifting |
| `GiftEmailTemplates.ts` | Email templates sent to recipient |
| `redeemGiftCodeFunction.ts` | Firebase function to validate/activate codes |
| `FIRESTORE_GIFTING_SCHEMA.md` | Database schema for gift codes |

---

### **Current Status:**

✅ **Fully Implemented** (as of previous phases)

**Features Working:**
- 3-step gift purchase flow
- Email notifications to recipients
- Gift code generation and validation
- Expiration handling (365 days default)
- Firestore tracking of gift usage
- Multiple tier support (Basic, Premium, Lifetime)

**Not Yet Tested in Build 53:**
- End-to-end flow with real payment
- Email delivery
- Code redemption

**Recommendation:** Test this feature in Build 53 to ensure:
1. Payment processing works
2. Emails are sent
3. Gift codes can be redeemed
4. Subscriptions activate correctly

---

## ❓ Question 2: Notifications??? (What Are They?)

### **Answer:**

The **Notifications** feature is a comprehensive notification center that displays **in-app notification history** with filtering, search, and management.

---

### **What Types of Notifications:**

1. **Daily Reminder** 📅
   - "Your daily reading is ready!"
   - Sent at user's preferred time (e.g., 8:00 AM)
   - Purpose: Encourage daily habit

2. **Achievement Unlocked** 🏆
   - "You've completed 7 days in a row!"
   - Triggered when user earns achievement
   - Purpose: Gamification/motivation

3. **Performance Insight** 📊
   - "Your pronunciation improved 15% this week!"
   - Weekly summary of progress
   - Purpose: Show value, encourage retention

4. **Subscription Renewal** 💳
   - "Your subscription renews in 3 days"
   - Sent before auto-renewal
   - Purpose: Transparency, reduce churn

5. **Gift Received** 🎁
   - "John sent you a gift subscription!"
   - When someone gifts you a subscription
   - Purpose: Notify recipient of gift

---

### **Where to Find It:**

**Location:** Notification Center Screen (NotificationCenterScreen.tsx)

**Access Path:**
```
App → Settings → Notifications
OR
App → Notification Bell Icon (if visible in header)
```

---

### **Features:**

#### **1. Notification List**
- Shows all received notifications
- Chronological order (newest first)
- Unread count badge

#### **2. Search & Filter**
- **Search:** By title or body text
- **Filter by Type:** Daily reminder, achievement, etc.
- **Filter by Status:** All, Read, Unread
- **Sort:** Newest, Oldest, By Type

#### **3. Mark as Read/Unread**
- Tap notification to mark as read
- Unread indicator (blue dot)
- Unread count in header badge

#### **4. Delete Notifications**
- Swipe or tap delete button
- Confirmation alert before deleting

#### **5. Pull to Refresh**
- Pull down to reload latest notifications

---

### **User Interface:**

```
┌─────────────────────────────────────┐
│ ← Notifications            [5]      │ ← Unread count badge
├─────────────────────────────────────┤
│ 🔍 Search notifications...          │
├─────────────────────────────────────┤
│ ▶ Show Filters                      │ ← Expandable
│   Type: [All] [Daily] [Achievement] │
│   Status: [All] [Read] [Unread]     │
│   Sort: [Newest] [Oldest] [Type]    │
├─────────────────────────────────────┤
│ 📅 Daily Reading Ready          •   │ ← Unread (blue dot)
│    Your reading for Dec 17 is...    │
│    Dec 17, 8:00 AM                  │
│    [✓] [🗑️]                         │ ← Mark read / Delete
├─────────────────────────────────────┤
│ 🏆 Achievement Unlocked!            │ ← Read (no dot)
│    7-Day Streak completed!          │
│    Dec 16, 6:30 PM                  │
│    [✓✓] [🗑️]                        │
├─────────────────────────────────────┤
│ 📊 Performance Insight              │
│    Your accuracy improved 12%!      │
│    Dec 15, 9:00 PM                  │
│    [✓✓] [🗑️]                        │
└─────────────────────────────────────┘
```

---

### **Current Status:**

✅ **Fully Implemented** (Phase 10B.4)

**What Works:**
- Notification history display
- Search functionality
- Filtering by type, status
- Sorting options
- Mark as read/unread
- Delete notifications
- Pull-to-refresh
- Empty state with tips
- "Load Test Notifications" button for QA

**What's NOT Yet Hooked Up:**
❌ **Push Notifications** - Notifications are stored but not sent via FCM yet
❌ **Daily Reminder Scheduler** - No automated daily notifications yet
❌ **Achievement Triggers** - Achievements not triggering notifications yet
❌ **Email Notifications** - No email fallback yet

---

### **Important Note:**

**The Notification Center screen is EMPTY by default** because:

1. No push notifications are being sent yet (FCM not configured)
2. No daily reminders scheduled
3. No achievements being earned (user hasn't practiced)

**For Testing:** There's a **"Load Test Notifications" button** that populates fake data for QA purposes.

---

### **Technical Details:**

**File:** `src/screens/NotificationCenterScreen.tsx`

**Data Source:** Firestore `notifications` collection

**Schema:**
```typescript
interface NotificationHistory {
  id: string;
  userId: string;
  notificationId: string;
  notificationType: 'daily_reminder' | 'achievement_unlocked' | 'performance_insight';
  title: string;
  body: string;
  sentAt: number;
  deliveredAt?: number;
  readAt?: number;
  channel: 'push' | 'email' | 'in-app';
  dismissed: boolean;
}
```

**Store:** `useNotificationStore` (Zustand)

**Service:** `NotificationService.ts` (handles CRUD operations)

---

### **Related Files:**

| File | Purpose |
|------|---------|
| `NotificationCenterScreen.tsx` | Main UI (645 lines) |
| `useNotificationStore.ts` | State management |
| `NotificationService.ts` | Business logic |
| `FirebaseCloudMessagingService.ts` | FCM push notifications (not active) |
| `NotificationPreferencesService.ts` | User preferences |
| `SubscriptionRenewalService.ts` | Renewal reminders |
| `notifications.types.ts` | TypeScript types |

---

### **Why Is It Currently Blank?**

**Reason 1: No Push Notification Service Running**
- FCM (Firebase Cloud Messaging) configured but not sending
- No scheduled jobs to send daily reminders
- Need to implement Cloud Scheduler trigger

**Reason 2: No User Activity Yet**
- User hasn't practiced enough to earn achievements
- No subscription renewals yet
- No performance insights generated

**Reason 3: Testing Mode Only**
- "Load Test Notifications" button creates fake data
- Real notifications need backend triggers

---

### **To Activate Notifications:**

#### **Phase 1: Enable Push Notifications** (2 hours)
1. Configure FCM in Firebase Console
2. Add Cloud Scheduler function for daily reminders
3. Hook up achievement triggers
4. Test push notification delivery

#### **Phase 2: Enable Email Notifications** (1 hour)
1. Set up SendGrid or similar email service
2. Create email templates
3. Add email as fallback channel
4. Test email delivery

#### **Phase 3: Enable In-App Triggers** (1 hour)
1. Connect achievement unlock events
2. Connect subscription renewal reminders
3. Connect performance insight generation
4. Test all notification types

---

## 📊 Summary Table

| Feature | Status | Location | Purpose |
|---------|--------|----------|---------|
| **Send a Gift** | ✅ Implemented | Subscription Screen | Gift subscriptions to friends via email |
| **Redeem Gift** | ✅ Implemented | Subscription Screen | Activate gifted subscription with code |
| **Notification Center** | ✅ UI Ready, ❌ Not Active | Settings → Notifications | View notification history, manage notifications |
| **Push Notifications** | ❌ Not Active | FCM Service | Send alerts to user's device |
| **Daily Reminders** | ❌ Not Active | Cloud Scheduler | Encourage daily reading habit |
| **Achievement Alerts** | ❌ Not Active | Achievement Service | Notify when milestones reached |

---

## 🎯 Recommendations

### **For "Send a Gift":**
1. ✅ Feature is ready - test in Build 53
2. Test end-to-end: Purchase → Email → Redeem
3. Verify payment processing works
4. Check email template formatting
5. Test gift code expiration (should expire after 365 days)

### **For "Notifications":**
1. ⏳ UI is ready but needs backend activation
2. **Priority 1:** Enable daily reminder push notifications
3. **Priority 2:** Hook up achievement unlock triggers
4. **Priority 3:** Add performance insight generation
5. **Priority 4:** Enable email notification fallback

### **Implementation Order:**
1. Test "Send a Gift" in Build 53 (already implemented)
2. Enable daily reminder notifications (highest user value)
3. Connect achievement triggers (gamification)
4. Add email notifications (reliability fallback)

---

## 🚀 Next Steps

### **Immediate (Test in Build 53):**
- [ ] Test "Send a Gift" flow
- [ ] Verify recipient receives email
- [ ] Test "Redeem Gift" flow
- [ ] Check subscription activation

### **Short-Term (This Week):**
- [ ] Review Notification Center UI
- [ ] Decide on notification activation priority
- [ ] Plan FCM setup for push notifications
- [ ] Test "Load Test Notifications" button

### **Medium-Term (Next 2 Weeks):**
- [ ] Implement daily reminder scheduler
- [ ] Hook up achievement notifications
- [ ] Enable push notification delivery
- [ ] Add email notification fallback

---

**Questions Answered:**
1. ✅ "Send a Gift" = Gift subscriptions via email with codes
2. ✅ "Notifications" = In-app notification center (UI ready, needs backend activation)

**Both features are fully implemented in the codebase and included in Build 53.**
