import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { notificationAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import ConfirmModal from '@/components/ConfirmModal';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotifications(true);
    }, [])
  );

  const loadNotifications = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const data = await notificationAPI.getNotifications({
        page: currentPage,
        per_page: 20,
      });

      let notificationsData = [];
      if (data) {
        if (Array.isArray(data.data)) {
          notificationsData = data.data;
        } else if (Array.isArray(data)) {
          notificationsData = data;
        } else if (data.notifications && Array.isArray(data.notifications)) {
          notificationsData = data.notifications;
        } else if (data.data?.data && Array.isArray(data.data.data)) {
          notificationsData = data.data.data;
        }
      }

      if (reset) {
        setNotifications(notificationsData);
      } else {
        setNotifications((prev) => [...prev, ...notificationsData]);
      }

      // Check if there are more pages
      const lastPage = data.last_page || data.meta?.last_page || 1;
      setHasMore(currentPage < lastPage);
      if (!reset) {
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setErrorMessage('Failed to load notifications');
      setShowErrorModal(true);
      if (reset) {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadNotifications(false);
    }
  };

  const handleMarkAsRead = async (notification) => {
    try {
      await notificationAPI.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDelete = (notification) => {
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;

    try {
      await notificationAPI.deleteNotification(notificationToDelete.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationToDelete.id));
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'booking':
        return 'event';
      case 'message':
        return 'chat';
      case 'car':
        return 'directions-car';
      case 'store':
        return 'store';
      default:
        return 'notifications';
    }
  };

  const renderNotificationItem = ({ item }) => {
    const isUnread = !item.read;
    const iconName = getNotificationIcon(item.type || item.notification_type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: theme.colors.cardBackground },
          isUnread && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
        ]}
        onPress={() => !item.read && handleMarkAsRead(item)}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <Icon name={iconName} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.notificationInfo}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationTitle,
                  { color: theme.colors.text },
                  isUnread && styles.unreadText,
                ]}
                numberOfLines={2}
              >
                {item.title || item.message || 'Notification'}
              </Text>
              <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
                {formatTime(item.created_at || item.createdAt)}
              </Text>
            </View>
            {item.message && item.message !== item.title && (
              <Text
                style={[
                  styles.notificationMessage,
                  { color: theme.colors.textSecondary },
                  isUnread && { color: theme.colors.text },
                ]}
                numberOfLines={2}
              >
                {item.message}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="delete-outline" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.navigate('SettingsMain')} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={[styles.markAllText, { color: theme.colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off" size={64} color={theme.colors.border} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              You'll see notifications here when you receive them
            </Text>
          </View>
        }
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setNotificationToDelete(null);
        }}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="#ff4444"
        destructive={true}
        onConfirm={confirmDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  markAllButton: {
    padding: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NotificationsScreen;




