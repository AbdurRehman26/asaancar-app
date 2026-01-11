import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { chatAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import PageHeader from '@/components/PageHeader';

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { conversationId, userId, userName, type, serviceId } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const flatListRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      if (currentConversationId) {
        loadMessages();
      } else if (userId) {
        initializeConversation();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentConversationId, userId])
  );

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const initializeConversation = async () => {
    try {
      setLoading(true);
      // For pick_and_drop type, recipient_user_id is required (current logged-in user)
      const recipientUserId = type === 'pick_and_drop' && user?.id ? user.id : null;
      const response = await chatAPI.getOrCreateConversation(userId, type, serviceId, recipientUserId);
      const convId = response.data?.id || response.id || response.conversation_id;
      setCurrentConversationId(convId);
      if (convId) {
        await loadMessages(convId);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      setErrorMessage('Failed to start conversation');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId = currentConversationId, pageNum = 1, append = false) => {
    if (!convId) return;

    try {
      if (!append) {
        setLoading(true);
      }
      const data = await chatAPI.getMessages(convId, pageNum, 50);

      let messagesData = [];
      if (data) {
        if (Array.isArray(data.data)) {
          messagesData = data.data;
        } else if (Array.isArray(data)) {
          messagesData = data;
        } else if (data.messages && Array.isArray(data.messages)) {
          messagesData = data.messages;
        } else if (data.data?.data && Array.isArray(data.data.data)) {
          messagesData = data.data.data;
        }
      }

      // Reverse messages if appending (loading older messages)
      if (append) {
        setMessages((prev) => [...messagesData.reverse(), ...prev]);
      } else {
        setMessages(messagesData.reverse());
      }

      // Check if there are more messages
      if (data?.pagination) {
        setHasMore(data.pagination.current_page < data.pagination.last_page);
      } else if (data?.meta) {
        setHasMore(data.meta.current_page < data.meta.last_page);
      } else {
        setHasMore(messagesData.length === 50);
      }

      setPage(pageNum);
    } catch (error) {
      console.error('Error loading messages:', error);
      setErrorMessage('Failed to load messages');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages(currentConversationId, 1, false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadMessages(currentConversationId, page + 1, true);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversationId) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistically add message to UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      message: messageText,
      sender_id: user?.id,
      sender: user,
      created_at: new Date().toISOString(),
      is_sent: true,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await chatAPI.sendMessage(currentConversationId, messageText);

      // Handle different response structures
      let sentMessage = null;
      if (response) {
        if (response.data) {
          sentMessage = response.data;
        } else if (response.message) {
          sentMessage = response.message;
        } else if (response.id || response.message_id) {
          sentMessage = response;
        } else {
          sentMessage = response;
        }
      }

      // Ensure the message has required fields
      const finalMessage = {
        ...tempMessage,
        ...sentMessage,
        id: sentMessage?.id || sentMessage?.message_id || tempMessage.id,
        message: sentMessage?.message || sentMessage?.text || messageText,
        sender_id: sentMessage?.sender_id || sentMessage?.user_id || user?.id,
        sender: sentMessage?.sender || sentMessage?.user || user,
        created_at: sentMessage?.created_at || sentMessage?.created_at || tempMessage.created_at,
        is_sent: true,
      };

      // Replace temp message with actual message
      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === tempMessage.id ? finalMessage : msg
        );
        // If message wasn't found (shouldn't happen), add it
        const found = updated.find(msg => msg.id === finalMessage.id);
        if (!found) {
          return [...updated, finalMessage];
        }
        return updated;
      });

      // Mark as read
      if (finalMessage.id && finalMessage.id !== tempMessage.id) {
        try {
          await chatAPI.markAsRead(currentConversationId, [finalMessage.id]);
        } catch (readError) {
          console.error('Error marking as read:', readError);
        }
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.response?.data);
      // Keep the temp message but mark it as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, is_sent: false, is_failed: true } : msg
        )
      );
      setNewMessage(messageText);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to send message');
      setShowErrorModal(true);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user?.id || item.sender?.id === user?.id;
    const messageTime = item.created_at
      ? new Date(item.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      : '';

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.colors.cardBackground },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? { color: '#fff' } : { color: theme.colors.text },
            ]}
          >
            {item.message || item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.colors.textSecondary },
            ]}
          >
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <PageHeader title={userName || 'Chat'} />

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
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
                No messages yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Start the conversation by sending a message
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.cardBackground }]}>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.placeholder}
            multiline
            maxLength={1000}
          />
          <View style={{ width: 8 }} />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Icon name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <ErrorModal
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          message={errorMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
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

export default ChatScreen;

