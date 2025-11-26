# Subscription Renewal Notifications Guide

## Overview

This document describes the complete subscription renewal notification system for the Reading Daily Scripture App. The system automatically sends timely reminders and updates about subscription renewals via push notifications.

## Features

- **Renewal Reminders**: Notifications at 14, 3, and 0 days before expiry
- **Expiry Warnings**: Urgent alerts when subscription is about to expire
- **Renewal Success Notifications**: Confirmation when subscription renews
- **Renewal Failed Alerts**: Immediate notification of payment failures
- **User Preferences**: Full control over notification types
- **Notification History**: Users can view past notifications
- **Cloud Scheduler Integration**: Automatic daily checks for expiring subscriptions
- **Multi-Platform Support**: iOS (APNs) and Android (FCM) push notifications

## Architecture

```
Subscription Expiry Date Set
        ↓
scheduleRenewalNotifications() called
        ↓
Notification scheduled for future delivery
        ↓
Cloud Scheduler runs daily (9 AM ET)
        ↓
checkExpiringSubscriptions() checks all active subscriptions
        ↓
For each subscription matching schedule:
  ├→ Get user's notification preferences
  ├→ Get user's device tokens
  ├→ Build notification message
  ├→ Send via Firebase Cloud Messaging
  ├→ Record in notification history
  └→ Update notification sent timestamp
        ↓
User receives push notification on device
        ↓
User can view in notification center or history
```

## Services and Components

### 1. SubscriptionRenewalService (Backend)

**Location**: `src/services/notifications/SubscriptionRenewalService.ts`

**Responsibilities**:
- Send individual renewal notifications
- Schedule future notifications
- Check and notify expiring subscriptions (Cloud Scheduler task)
- Build platform-specific notification payloads
- Track notification history

**Key Methods**:
```typescript
sendRenewalNotification(userId, notification) → Promise
scheduleRenewalNotifications(userId, subscriptionId, expiryDate) → Promise
checkAndNotifyExpiringSubscriptions() → Promise
```

**Cloud Functions**:
1. `sendRenewalNotification` (HTTPS Callable)
   - Called by client to trigger notifications
   - Sends to all registered device tokens
   - Records delivery

2. `checkExpiringSubscriptions` (Pub/Sub Scheduled)
   - Runs daily at 9 AM ET
   - Checks all active subscriptions
   - Automatically sends due notifications

### 2. NotificationPreferencesService (Backend)

**Location**: `src/services/notifications/NotificationPreferencesService.ts`

**Responsibilities**:
- Register device tokens for push notifications
- Manage user notification preferences
- Track notification history
- Count unread notifications

**Key Methods**:
```typescript
registerDeviceToken() → Promise<string>
getPreferences() → Promise<NotificationPreferences>
updatePreferences(preferences) → Promise<boolean>
toggleNotificationType(type) → Promise<boolean>
getNotificationHistory(limit) → Promise<Notification[]>
```

**Supported Preferences**:
```typescript
{
  renewalReminders: boolean,    // 14, 3, 0 days before
  expiryWarnings: boolean,      // Urgent warnings
  renewalSuccess: boolean,      // Renewal succeeded
  renewalFailed: boolean,       // Payment failed
  marketingEmails: boolean      // Promotional content
}
```

### 3. useNotificationManagement (React Hook)

**Location**: `src/hooks/useNotificationManagement.ts`

**Purpose**: Component-level notification management

**Usage**:
```typescript
const {
  preferences,           // Current notification settings
  registerDevice,        // Register for push notifications
  updatePreferences,     // Update notification settings
  toggleNotificationType,// Toggle specific notification type
  getNotificationHistory,// Fetch past notifications
  unreadCount,          // Number of unread notifications
  isLoading,            // Loading state
} = useNotificationManagement();
```

## Notification Types and Schedules

### 1. Renewal Reminder (14, 3, 0 days before expiry)

**Title**: "Your subscription is about to renew"

**Body Examples**:
- 14 days: "Your Reading Daily subscription renews in 14 day(s)"
- 3 days: "Your Reading Daily subscription renews in 3 day(s)"
- 0 days: "Your subscription renews today"

**Data**:
```json
{
  "type": "renewal_reminder",
  "subscriptionId": "basic_subscription",
  "expiryDate": "1735689600000"
}
```

### 2. Expiry Warning (3 days before)

**Title**: "Your subscription expires soon"

**Body**:
- 3 days: "Only 3 day(s) left before renewal"
- 0 days: "Your subscription expires today! Renew now to keep your premium features."

**Action**: Opens subscription settings

### 3. Renewal Success (upon successful renewal)

**Title**: "Subscription renewed successfully"

**Body**: "Your Reading Daily subscription has been renewed. Enjoy uninterrupted access!"

### 4. Renewal Failed (upon payment failure)

**Title**: "Subscription renewal failed"

**Body**: "We were unable to renew your subscription. Please update your payment method."

**Action**: Opens subscription settings

## Firestore Schema

### Notification Collections

#### notificationHistory (subcollection under users)

```typescript
{
  type: 'renewal_reminder' | 'expiry_warning' | 'renewal_success' | 'renewal_failed';
  subscriptionId: string;
  expiryDate: Timestamp;
  daysUntilExpiry: number;
  notificationId: string; // From FCM
  sentAt: Timestamp;
  delivered: boolean;
  readAt?: Timestamp; // When user viewed it
}
```

#### scheduledNotifications (top-level collection)

```typescript
{
  userId: string;
  subscriptionId: string;
  notificationType: 'renewal_reminder' | 'expiry_warning' | ...;
  scheduledFor: Timestamp; // When to send
  expiryDate: Timestamp; // Subscription expiry
  createdAt: Timestamp;
  sent: boolean;
}
```

### users Collection (Updated)

```typescript
{
  deviceTokens: string[]; // All registered device tokens
  notificationPreferences: NotificationPreferences;
  lastRenewalNotificationSentAt?: Timestamp;
  lastTokenRegistrationAt?: Timestamp;
  preferencesUpdatedAt?: Timestamp;
}
```

## Deployment

### 1. Environment Setup

No new environment variables needed. Uses existing:
- Firebase Cloud Messaging (automatic)
- Firebase Cloud Functions (existing)
- Firestore (existing)

### 2. Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions:sendRenewalNotification,functions:checkExpiringSubscriptions
```

### 3. Configure Cloud Scheduler

```bash
# Create scheduler job (if not exists)
gcloud scheduler jobs create pubsub check-expiring-subscriptions \
  --schedule="0 9 * * *" \
  --timezone=America/New_York \
  --topic=projects/YOUR_PROJECT/topics/firebase-schedule-checkExpiringSubscriptions
```

### 4. Update Firestore Security Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users' notification history (readable by user)
    match /users/{userId}/notificationHistory/{document=**} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Cloud Functions only
    }

    // Device tokens (write-only from Cloud Functions)
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId &&
                      request.resource.data.keys().hasAll(['notificationPreferences']);
    }

    // Scheduled notifications (Cloud Functions only)
    match /scheduledNotifications/{document=**} {
      allow read: if hasRole(request.auth.uid, 'admin');
      allow write: if false; // Cloud Functions only
    }
  }

  function hasRole(uid, role) {
    return get(/databases/$(database)/documents/users/$(uid)).data.roles[role] == true;
  }
}
```

## Client Integration

### Example: Registering for Notifications

```typescript
import { useNotificationManagement } from '@/hooks/useNotificationManagement';

export function SubscriptionSettingsScreen() {
  const {
    registerDevice,
    preferences,
    updatePreferences,
  } = useNotificationManagement();

  const handleEnableNotifications = async () => {
    // Register device first
    const registered = await registerDevice();

    if (registered) {
      // Then update preferences
      await updatePreferences({
        renewalReminders: true,
        expiryWarnings: true,
      });
    }
  };

  return (
    <Button
      title="Enable Renewal Notifications"
      onPress={handleEnableNotifications}
    />
  );
}
```

### Example: Showing Notification History

```typescript
import { useNotificationManagement } from '@/hooks/useNotificationManagement';

export function NotificationHistoryScreen() {
  const { getNotificationHistory, unreadCount } = useNotificationManagement();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const notifications = await getNotificationHistory(50);
      setHistory(notifications);
    };

    fetchHistory();
  }, [getNotificationHistory]);

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      <FlatList
        data={history}
        renderItem={({ item }) => (
          <Text>
            {item.type} - {new Date(item.sentAt).toLocaleDateString()}
          </Text>
        )}
      />
    </View>
  );
}
```

### Example: Managing Preferences

```typescript
import { useNotificationManagement } from '@/hooks/useNotificationManagement';

export function NotificationPreferencesScreen() {
  const {
    preferences,
    toggleNotificationType,
    disableAllNotifications,
  } = useNotificationManagement();

  if (!preferences) return <Text>Loading...</Text>;

  return (
    <View>
      <Switch
        value={preferences.renewalReminders}
        onValueChange={() => toggleNotificationType('renewalReminders')}
        label="Renewal Reminders (14, 3, 0 days)"
      />

      <Switch
        value={preferences.expiryWarnings}
        onValueChange={() => toggleNotificationType('expiryWarnings')}
        label="Expiry Warnings"
      />

      <Switch
        value={preferences.renewalSuccess}
        onValueChange={() => toggleNotificationType('renewalSuccess')}
        label="Renewal Success Notifications"
      />

      <Switch
        value={preferences.renewalFailed}
        onValueChange={() => toggleNotificationType('renewalFailed')}
        label="Renewal Failed Alerts"
      />

      <Button
        title="Disable All"
        onPress={disableAllNotifications}
      />
    </View>
  );
}
```

## Push Notification Configuration

### iOS (APNs)

1. Set up Apple Push Notification certificate in Firebase Console
2. Upload certificate to Firebase
3. Notifications automatically sent via APNs

**Key Settings**:
- `apns-priority: 10` (high priority)
- `content-available: 1` (background notification)
- Badge: 1 (notification badge)

### Android (FCM)

1. FCM automatically configured via Firebase
2. No additional setup needed

**Key Settings**:
- `priority: high`
- Custom notification icon: `ic_notification`
- Color: `#FF6B35` (brand color)
- `clickAction: FLUTTER_NOTIFICATION_CLICK`

## Notification Delivery Flow

### 1. Subscription Created/Renewed

```
subscriptionRenewalService.scheduleRenewalNotifications()
↓
Check if notifications should be sent now or later
↓
If later: Store in scheduledNotifications collection
If now: Call sendRenewalNotification()
```

### 2. Daily Automated Check (Cloud Scheduler)

```
checkExpiringSubscriptions() triggered
↓
Query all active subscriptions
↓
For each subscription:
  - Calculate days until expiry
  - Check against notification schedule
  - Check if already sent (prevent duplicates)
  - Build notification message
  - Send via FCM/APNs
  - Record in notificationHistory
```

### 3. User Views Notification

```
Push notification received on device
↓
User opens notification or app
↓
(Optional) Call markNotificationAsRead()
↓
Notification marked in Firestore with readAt timestamp
```

## Testing

### Manual Testing

```typescript
// Test sending notification manually
import { subscriptionRenewalService } from '@/services/notifications/SubscriptionRenewalService';

const result = await subscriptionRenewalService.sendRenewalNotification(
  'user-id',
  {
    userId: 'user-id',
    notificationType: 'renewal_reminder',
    subscriptionId: 'basic_subscription',
    expiryDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
    daysUntilExpiry: 3,
    idToken: 'test-token',
  }
);

console.log('Notification result:', result);
```

### Testing Cloud Scheduler

```bash
# Trigger the scheduled function manually
gcloud scheduler jobs run check-expiring-subscriptions

# Check logs
gcloud functions logs read checkExpiringSubscriptions --limit 50
```

## Troubleshooting

### Notifications Not Delivering

**Issue**: Users not receiving push notifications

**Solutions**:
1. Check device token is registered
   ```typescript
   const userDoc = await admin.firestore().collection('users').doc(userId).get();
   console.log('Device tokens:', userDoc.data().deviceTokens);
   ```

2. Verify notification preferences enabled
   ```typescript
   const prefs = await notificationPreferencesService.getPreferences();
   console.log('Preferences:', prefs);
   ```

3. Check FCM/APNs credentials in Firebase Console
4. Verify Firestore rules allow reading deviceTokens

### Duplicate Notifications

**Issue**: Users receiving same notification multiple times

**Solution**: The system checks `hasNotificationBeenSent()` to prevent duplicates. If duplicates persist:
1. Clear `scheduledNotifications` for affected subscription
2. Clear recent entries from `notificationHistory`
3. Re-schedule notifications

### Cloud Scheduler Not Running

**Issue**: Scheduled task not executing

**Solutions**:
1. Verify Cloud Scheduler job exists: `gcloud scheduler jobs list`
2. Check Pub/Sub topic exists: `gcloud pubsub topics list`
3. Check Cloud Function logs: `gcloud functions logs read checkExpiringSubscriptions`
4. Verify function has `roles/pubsub.subscriber` permission

## Performance Considerations

- **Daily Job**: Process ~1000s subscriptions efficiently
- **Database Queries**: Indexed on `subscriptionStatus` and `subscriptionExpiryDate`
- **Batch Notifications**: Send in batches to reduce API calls
- **Rate Limiting**: Cloud Messaging handles rate limiting automatically
- **Retention**: Keep notification history for 90 days, then archive

## Security

- User can only see their own notification history
- Only admins can view scheduled notifications
- Device tokens never exposed in responses
- Notifications only sent to authenticated users
- FCM/APNs handle token validation

## Monitoring

### Key Metrics

1. **Notifications Sent**: Count by type per day
2. **Delivery Rate**: Percentage successfully delivered
3. **User Preferences**: Distribution of enabled/disabled types
4. **Unread Count**: Average unread notifications per user

### Logging

All notification events logged:
```
[sendRenewalNotification] Sent renewal_reminder notification to user: user-123
[checkExpiringSubscriptions] Processed 2500 subscriptions, sent 156 notifications
[SubscriptionRenewalService] Failed to send to token abc123...: InvalidToken
```

## Future Enhancements

1. **Email Notifications**: Alternative to push notifications
2. **SMS Reminders**: For high-priority renewal failures
3. **In-App Messages**: Native alerts within the app
4. **Smart Timing**: Adjust notification time based on user timezone
5. **A/B Testing**: Test notification message variations
6. **Personalization**: Custom messages based on subscription tier
