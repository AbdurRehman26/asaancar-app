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
import { pickDropAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import ConfirmModal from '@/components/ConfirmModal';

const MyPickDropServicesScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [serviceToDelete, setServiceToDelete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [])
  );

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await pickDropAPI.getMyPickDropServices({ per_page: 50 });
      let servicesData = [];
      
      // Handle different response structures
      if (data) {
        if (Array.isArray(data.data)) {
          servicesData = data.data;
        } else if (Array.isArray(data)) {
          servicesData = data;
        } else if (data.services && Array.isArray(data.services)) {
          servicesData = data.services;
        } else if (data.data?.data && Array.isArray(data.data.data)) {
          servicesData = data.data.data;
        }
      }
      
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading my pick and drop services:', error);
      setErrorMessage('Failed to load your services');
      setShowErrorModal(true);
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const handleEdit = (service) => {
    // Navigate to edit service screen (you can create this later)
    Alert.alert('Edit Service', 'Edit functionality will be implemented');
    // navigation.navigate('EditPickDropService', { serviceId: service.id });
  };

  const handleDelete = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await pickDropAPI.deletePickDropService(serviceToDelete.id);
      setSuccessMessage('Service deleted successfully');
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      setServiceToDelete(null);
      loadServices();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to delete service');
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

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const renderServiceItem = ({ item }) => {
    const startLocation = item.start_location || item.start_area || 'N/A';
    const endLocation = item.end_location || item.end_area || 'N/A';
    const departureDate = item.departure_date || item.departureDate || null;
    const departureTime = item.departure_time || item.departureTime || null;
    const everydayService =
      item.is_everyday || item.everyday_service || item.everydayService || false;
    const availableSpaces = item.available_spaces || item.availableSpaces || 0;
    const driverGender = item.driver_gender || item.driverGender || 'N/A';
    const price = item.price_per_person || item.pricePerPerson || null;
    const currency = item.currency || 'PKR';

    return (
      <View style={[styles.serviceCard, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <View style={styles.routeInfo}>
              <Icon name="location-on" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
                {startLocation}
              </Text>
            </View>
            <Icon name="arrow-forward" size={16} color={theme.colors.textSecondary} style={styles.arrowIcon} />
            <View style={styles.routeInfo}>
              <Icon name="location-on" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
                {endLocation}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.serviceDetails}>
          <View style={styles.detailRow}>
            <Icon name="schedule" size={14} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {everydayService 
                ? 'Everyday Service' 
                : departureDate 
                  ? `${formatDate(departureDate)} at ${formatTime(departureTime)}`
                  : formatTime(departureTime) || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="people" size={14} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {availableSpaces} space{availableSpaces !== 1 ? 's' : ''} available
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="person" size={14} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              Driver: {driverGender.charAt(0).toUpperCase() + driverGender.slice(1)}
            </Text>
          </View>

          {price && (
            <View style={styles.detailRow}>
              <Icon name="attach-money" size={14} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {currency} {parseFloat(price).toLocaleString()} per person
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleEdit(item)}
          >
            <Icon name="edit" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#ff4444' }]}
            onPress={() => handleDelete(item)}
          >
            <Icon name="delete" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.navigate('SettingsMain')} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            navigation.navigate('CreatePickDropService');
          }}
        >
          <Icon name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.addButtonText}>Add Service</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        renderItem={renderServiceItem}
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
            <Icon name="directions-transit" size={64} color={theme.colors.border} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No services found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Create your first pick and drop service to get started
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
          setServiceToDelete(null);
        }}
        title="Delete Service"
        message={`Are you sure you want to delete this service from ${serviceToDelete?.start_location || serviceToDelete?.start_area || 'start'} to ${serviceToDelete?.end_location || serviceToDelete?.end_area || 'end'}? This action cannot be undone.`}
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
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  serviceCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  serviceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 6,
  },
  buttonText: {
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

export default MyPickDropServicesScreen;

