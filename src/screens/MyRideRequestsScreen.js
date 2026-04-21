import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { rideRequestAPI } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import ConfirmModal from '@/components/ConfirmModal';

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  const timePart = timeString.includes('T') ? timeString.split('T')[1] : timeString;
  const [hours, minutes] = timePart.split(':');
  let h = parseInt(hours, 10);
  if (Number.isNaN(h)) return timeString;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h || 12;
  return `${h}:${String(minutes).slice(0, 2)} ${ampm}`;
};

const MyRideRequestsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [rideRequests, setRideRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [requestToDelete, setRequestToDelete] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await rideRequestAPI.getMyRideRequests({ per_page: 50 });
      const requests =
        (Array.isArray(data?.data) && data.data) ||
        (Array.isArray(data?.requests) && data.requests) ||
        (Array.isArray(data) && data) ||
        [];
      setRideRequests(requests);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to load your ride requests.');
      setShowErrorModal(true);
      setRideRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;

    try {
      await rideRequestAPI.deleteRideRequest(requestToDelete.id);
      setSuccessMessage('Ride request deleted successfully.');
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      setRequestToDelete(null);
      loadRequests();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to delete ride request.');
      setShowErrorModal(true);
      setShowDeleteModal(false);
    }
  };

  const renderRequest = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
      <TouchableOpacity onPress={() => navigation.navigate('RideRequestDetail', { requestId: item.id, rideRequest: item })}>
        <Text style={[styles.routeText, { color: theme.colors.text }]} numberOfLines={1}>
          {item.start_location} -> {item.end_location}
        </Text>
        <Text style={[styles.subtleText, { color: theme.colors.textSecondary }]}>
          {item.schedule_type === 'once' && item.departure_date ? `${item.departure_date} • ` : ''}
          {formatTime(item.departure_time)}
        </Text>
        <Text style={[styles.subtleText, { color: theme.colors.textSecondary }]}>
          {item.required_seats || 1} seat{item.required_seats !== 1 ? 's' : ''} • {item.preferred_driver_gender || 'any'} driver
        </Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => navigation.navigate('CreateRideRequest', { rideRequest: item })}
        >
          <Icon name="edit" size={16} color={theme.colors.text} />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
          onPress={() => {
            setRequestToDelete(item);
            setShowDeleteModal(true);
          }}
        >
          <Icon name="delete-outline" size={16} color="#dc2626" />
          <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const addButton = (
    <TouchableOpacity
      style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
      onPress={() => navigation.navigate('CreateRideRequest')}
    >
      <Icon name="add" size={18} color="#fff" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
      <PageHeader title="My Ride Requests" rightAction={addButton} />

      <FlatList
        data={rideRequests}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="playlist-remove" size={56} color={theme.colors.textLight} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No ride requests yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Create your first ride request to start finding a match.
            </Text>
          </View>
        }
      />

      <ErrorModal visible={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
      <SuccessModal visible={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Success" message={successMessage} />
      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRequestToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Ride Request"
        message="Are you sure you want to delete this ride request?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtleText: {
    fontSize: 13,
    marginBottom: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MyRideRequestsScreen;
