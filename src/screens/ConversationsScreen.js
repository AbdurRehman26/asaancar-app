import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { chatAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';

const ConversationsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getConversations();
      
      let conversationsData = [];
      if (data) {
        if (Array.isArray(data.data)) {
          conversationsData = data.data;
        } else if (Array.isArray(data)) {
          conversationsData = data;
        } else if (data.conversations && Array.isArray(data.conversations)) {
          conversationsData = data.conversations;
        } else if (data.data?.data && Array.isArray(data.data.data)) {
          conversationsData = data.data.data;
        }
      }
      
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setErrorMessage('Failed to load conversations');
      setShowErrorModal(true);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const getOtherUser = (conversation) => {
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return null;
    }
    return conversation.participants.find((p) => p.id !== user?.id) || conversation.participants[0];
  };

  const getLastMessage = (conversation) => {
    if (conversation.last_message) {
      return conversation.last_message;
    }
    if (conversation.messages && conversation.messages.length > 0) {
      return conversation.messages[conversation.messages.length - 1];
    }
    return null;
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

  const handleConversationPress = (conversation) => {
    const otherUser = getOtherUser(conversation);
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      userId: otherUser?.id,
      userName: otherUser?.name || 'User',
    });
  };

  const renderConversationItem = ({ item }) => {
    const otherUser = getOtherUser(item);
    const lastMessage = getLastMessage(item);
    const unreadCount = item.unread_count || item.unreadCount || 0;
    const isUnread = unreadCount > 0;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Icon name="person" size={32} color={theme.colors.primary} />
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.conversationName,
                { color: theme.colors.text },
                isUnread && styles.unreadText,
              ]}
              numberOfLines={1}
            >
              {otherUser?.name || 'Unknown User'}
            </Text>
            {lastMessage && (
              <Text style={[styles.conversationTime, { color: theme.colors.textSecondary }]}>
                {formatTime(lastMessage.created_at || lastMessage.createdAt)}
              </Text>
            )}
          </View>
          {lastMessage && (
            <View style={styles.lastMessageRow}>
              <Text
                style={[
                  styles.lastMessage,
                  { color: theme.colors.textSecondary },
                  isUnread && { color: theme.colors.text, fontWeight: '500' },
                ]}
                numberOfLines={1}
              >
                {lastMessage.message || lastMessage.content || ''}
              </Text>
              {isUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.navigate('SettingsMain')} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Messages</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chat-bubble-outline" size={64} color={theme.colors.border} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No conversations yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Start a conversation by messaging someone
            </Text>
          </View>
        }
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
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
  placeholder: {
    width: 32,
  },
  listContainer: {
    padding: 16,
  },
  conversationItem: {
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
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  conversationTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
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

export default ConversationsScreen;

