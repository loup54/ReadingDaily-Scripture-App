/**
 * Notification Center Screen
 * Phase 10B.4: Notification Center UI
 *
 * Main screen for displaying notification history and management:
 * - List of all notifications with filtering
 * - Mark as read/unread
 * - Delete notifications
 * - Filter by type, status, date
 * - Search notifications
 * - Sort options
 * - Pull-to-refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useNotificationHistory,
  useUnreadNotificationCount,
  useLoadNotificationData,
  useMarkNotificationAsRead,
  useNotificationStore,
  useDeleteNotification,
} from '@/stores/useNotificationStore';
import { NotificationHistory, NotificationType } from '@/types/notifications.types';
import { createTestNotifications } from '@/debug/createTestNotifications';
import { EmptyState } from '@/components/common/EmptyState';

/**
 * Notification Center Screen
 */
export function NotificationCenterScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userId = user?.uid || '';

  // Store hooks
  const history = useNotificationHistory();
  const unreadCount = useUnreadNotificationCount();
  const loadAll = useLoadNotificationData();
  const markAsRead = useMarkNotificationAsRead();
  const deleteNotification = useDeleteNotification();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTestData, setLoadingTestData] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'type'>('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadAll(userId);
    }
  }, [userId]);

  // Filter notifications
  const filteredNotifications = useCallback(() => {
    let filtered = history;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchText.toLowerCase()) ||
          n.body.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((n) => n.notificationType === selectedType);
    }

    // Status filter
    if (selectedStatus === 'read') {
      filtered = filtered.filter((n) => n.readAt !== undefined);
    } else if (selectedStatus === 'unread') {
      filtered = filtered.filter((n) => !n.readAt);
    }

    // Sort
    if (sortBy === 'date-desc') {
      filtered.sort((a, b) => b.sentAt - a.sentAt);
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => a.sentAt - b.sentAt);
    } else if (sortBy === 'type') {
      filtered.sort((a, b) => a.notificationType.localeCompare(b.notificationType));
    }

    return filtered;
  }, [history, searchText, selectedType, selectedStatus, sortBy]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (userId) {
        await loadAll(userId);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notification: NotificationHistory) => {
    await markAsRead(userId, notification.notificationId);
  };

  const handleDelete = (notification: NotificationHistory) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteNotification(userId, notification.notificationId);
          } catch (error) {
            console.error('[NotificationCenter] Error deleting notification:', error);
            Alert.alert('Error', 'Failed to delete notification');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleLoadTestNotifications = async () => {
    try {
      setLoadingTestData(true);
      const testNotifs = await createTestNotifications(userId);

      // Convert test notifications to history format
      const mockHistory: NotificationHistory[] = testNotifs.map((notif) => ({
        id: `${notif.id}-history`,
        userId,
        notificationId: notif.id,
        notificationType: notif.type,
        title: notif.title,
        body: notif.body,
        sentAt: notif.timestamp!,
        deliveredAt: notif.deliveredAt,
        channel: notif.channel,
        dismissed: false,
      }));

      // Directly update the store with test data
      // This bypasses the service to quickly populate UI for QA testing
      const store = useNotificationStore.getState();
      const unreadCount = mockHistory.filter((h) => !h.readAt).length;
      const unreadSummary: { [key: string]: number } = {};
      mockHistory.forEach((h) => {
        unreadSummary[h.notificationType] = (unreadSummary[h.notificationType] || 0) + 1;
      });

      useNotificationStore.setState({
        notificationHistory: mockHistory,
        unreadCount,
        unreadSummary,
      });

      console.log('[NotificationCenter] Test notifications loaded:', mockHistory.length);
      Alert.alert('Success!', `${mockHistory.length} test notifications loaded. Scroll down to see them.`);
    } catch (error) {
      console.error('[NotificationCenter] Error loading test notifications:', error);
      Alert.alert('Error', 'Failed to load test notifications');
    } finally {
      setLoadingTestData(false);
    }
  };

  const notifications = filteredNotifications();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notifications..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? '▼ Hide Filters' : '▶ Show Filters'}
        </Text>
      </TouchableOpacity>

      {/* Filters */}
      {showFilters && (
        <ScrollView
          style={styles.filtersContainer}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {/* Type Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
              {['all', 'daily_reminder', 'achievement_unlocked', 'performance_insight'].map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      selectedType === type && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedType(type as any)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedType === type && styles.filterButtonTextActive,
                      ]}
                    >
                      {type === 'all' ? 'All' : type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>

          {/* Status Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              {(['all', 'read', 'unread'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    selectedStatus === status && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedStatus === status && styles.filterButtonTextActive,
                    ]}
                  >
                    {status === 'all' ? 'All' : status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Sort</Text>
            <View style={styles.filterOptions}>
              {['date-desc', 'date-asc', 'type'].map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.filterButton,
                    sortBy === sort && styles.filterButtonActive,
                  ]}
                  onPress={() => setSortBy(sort as any)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      sortBy === sort && styles.filterButtonTextActive,
                    ]}
                  >
                    {sort === 'date-desc'
                      ? 'Newest'
                      : sort === 'date-asc'
                      ? 'Oldest'
                      : 'Type'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Notification List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationListItem
              notification={item}
              onMarkAsRead={() => handleMarkAsRead(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState
          icon="notifications-off-outline"
          title={
            searchText || selectedType !== 'all' || selectedStatus !== 'all'
              ? 'No Matching Notifications'
              : 'No Notifications Yet'
          }
          message={
            searchText || selectedType !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your filters or search terms to find notifications'
              : 'You haven\'t received any notifications yet'
          }
          tips={[
            '✓ Enable notifications in Settings → Notifications',
            '✓ Turn on Daily Reminders to receive readings',
            '✓ Notifications appear here when readings are available',
          ]}
          actionButton={
            !searchText && selectedType === 'all' && selectedStatus === 'all'
              ? {
                  label: loadingTestData ? 'Loading...' : 'Load Test Notifications',
                  onPress: handleLoadTestNotifications,
                  variant: 'secondary',
                }
              : undefined
          }
        />
      )}
    </View>
  );
}

/**
 * Individual Notification List Item
 */
function NotificationListItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: NotificationHistory;
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  const isUnread = !notification.readAt;
  const formattedDate = new Date(notification.sentAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.notificationItem, isUnread && styles.notificationItemUnread]}>
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={onMarkAsRead}
        activeOpacity={0.7}
      >
        {/* Unread Indicator */}
        {isUnread && <View style={styles.unreadDot} />}

        {/* Content */}
        <View style={styles.notificationTextContainer}>
          <Text style={[styles.notificationTitle, isUnread && styles.notificationTitleUnread]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>
          <Text style={styles.notificationDate}>{formattedDate}</Text>
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.notificationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onMarkAsRead}
        >
          <Text style={styles.actionButtonText}>
            {isUnread ? '✓' : '✓✓'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  badgeContainer: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  filterToggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterGroup: {
    marginRight: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  notificationItemUnread: {
    backgroundColor: '#E6F0FF',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 12,
    marginTop: 2,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  notificationTitleUnread: {
    fontWeight: '600',
    color: '#000',
  },
  notificationBody: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  notificationActions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 16,
  },
  loadTestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default NotificationCenterScreen;
