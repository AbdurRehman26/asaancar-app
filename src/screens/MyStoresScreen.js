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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { storeAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import ConfirmModal from '@/components/ConfirmModal';
import PageHeader from '@/components/PageHeader';

const MyStoresScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [storeToDelete, setStoreToDelete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadStores();
    }, [])
  );

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await storeAPI.getMyStores({ per_page: 50 });
      let storesData = [];

      // Handle different response structures
      if (data) {
        if (Array.isArray(data.data)) {
          storesData = data.data;
        } else if (Array.isArray(data)) {
          storesData = data;
        } else if (data.stores && Array.isArray(data.stores)) {
          storesData = data.stores;
        } else if (data.data?.data && Array.isArray(data.data.data)) {
          storesData = data.data.data;
        }
      }

      setStores(storesData);
    } catch (error) {
      console.error('Error loading my stores:', error);
      setErrorMessage('Failed to load your stores');
      setShowErrorModal(true);
      setStores([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStores();
  };

  const handleEdit = (store) => {
    // Navigate to edit store screen (you can create this later)
    Alert.alert('Edit Store', 'Edit functionality will be implemented');
    // navigation.navigate('EditStore', { storeId: store.id });
  };

  const handleDelete = (store) => {
    setStoreToDelete(store);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!storeToDelete) return;

    try {
      await storeAPI.deleteStore(storeToDelete.id);
      setSuccessMessage('Store deleted successfully');
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      setStoreToDelete(null);
      loadStores();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to delete store');
      setShowErrorModal(true);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    if (Array.isArray(phone)) {
      return phone.join(' / ');
    }
    return phone;
  };

  const renderStoreItem = ({ item }) => (
    <View style={[styles.storeCard, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <Text style={[styles.storeName, { color: theme.colors.text }]} numberOfLines={1}>
            {item.name || 'Store Name'}
          </Text>
          <Text style={[styles.storeHandle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.handle || item.username || `@${(item.name || '').toLowerCase().replace(/\s+/g, '')}`}
          </Text>
        </View>
      </View>

      <Text style={[styles.storeDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {item.description || 'Professional car rental and transport services.'}
      </Text>

      <View style={styles.storeDetails}>
        <View style={styles.detailRow}>
          <Icon name="location-on" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.address || item.city || 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="phone" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {formatPhone(item.phone || item.contact)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="calendar-today" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            Created {formatDate(item.created_at || item.createdAt)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: '#4A90E2' }]}
        onPress={() => handleEdit(item)}
      >
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const createStoreButton = (
    <TouchableOpacity
      style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
      onPress={() => navigation.navigate('CreateStore')}
    >
      <Icon name="add" size={20} color="#fff" />
      <Text style={styles.addButtonText}>Create Store</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <PageHeader
        title="My Stores"
        backDestination="SettingsMain"
        rightAction={createStoreButton}
      />

      <FlatList
        data={stores}
        renderItem={renderStoreItem}
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
            <Icon name="store" size={64} color={theme.colors.border} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No stores found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Create your first store to get started
            </Text>
          </View>
        }
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
      />

      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setStoreToDelete(null);
        }}
        title="Delete Store"
        message={`Are you sure you want to delete "${storeToDelete?.name || 'this store'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="#ff4444"
        destructive={true}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  storeCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeHeader: {
    marginBottom: 12,
  },
  storeInfo: {
    marginBottom: 4,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  storeHandle: {
    fontSize: 14,
  },
  storeDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  storeDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  editButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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

export default MyStoresScreen;

