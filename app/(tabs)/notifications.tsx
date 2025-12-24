import React from 'react';
import { NotificationCenterScreen } from '@/screens/NotificationCenterScreen';

export default function NotificationsTab() {
  // Render NotificationCenterScreen directly without redirect
  // showHeader=false because tab navigator provides its own header space
  return <NotificationCenterScreen showHeader={false} />;
}
