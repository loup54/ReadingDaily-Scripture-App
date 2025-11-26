import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function NotificationsTab() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual notifications screen
    router.replace('/notifications');
  }, [router]);

  return null;
}
