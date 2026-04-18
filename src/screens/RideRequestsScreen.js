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
import { useAuth } from '@/context/AuthContext';
import { rideRequestAPI } from '@/services/api';
import ErrorModal from '@/components/ErrorModal';
import PageHeader from '@/components/PageHeader';

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

const RideRequestsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [rideRequests, setRideRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadRideRequests = async () => {
    try {
      setLoading(true);
      const data = await rideRequestAPI.getRideRequests({ per_page: 20 });
      const requests =
        (Array.isArray(data?.data) && data.data) ||
        (Array.isArray(data?.requests) && data.requests) ||
        (Array.isArray(data) && data) ||
        [];
      setRideRequests(requests);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to load ride requests.');
      setShowErrorModal(true);
      setRideRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRideRequests();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRideRequests();
  };

  const renderRequest = ({ item }) => {
    const requesterName = item.user?.name || item.name || 'Rider';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => navigation.navigate('RideRequestDetail', { requestId: item.id, rideRequest: item })}
      >
        <View style={styles.routeRow}>
          <View style={styles.locationWrap}>
            <Icon name="trip-origin" size={16} color={theme.colors.primary} />
            <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
              {item.start_location}
            </Text>
          </View>
          <Icon name="arrow-forward" size={16} color={theme.colors.textSecondary} />
          <View style={styles.locationWrap}>
            <Icon name="location-on" size={16} color={theme.colors.primary} />
            <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
              {item.end_location}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {item.schedule_type === 'once' && item.departure_date ? `${item.departure_date} • ` : ''}
            {formatTime(item.departure_time)}
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {item.required_seats || 1} seat{item.required_seats !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.subtleText, { color: theme.colors.textSecondary }]}>
            Driver: {item.preferred_driver_gender || 'any'}
          </Text>
          {item.budget_per_seat ? (
            <Text style={[styles.priceText, { color: theme.colors.primary }]}>
              {item.currency || 'PKR'} {item.budget_per_seat}/seat
            </Text>
          ) : null}
        </View>

        <Text style={[styles.requesterText, { color: theme.colors.textSecondary }]}>
          Requested by {requesterName}
        </Text>
      </TouchableOpacity>
    );
  };

  const headerAction = (
    <View style={styles.headerActions}>
      <TouchableOpacity
        style={[styles.topButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        onPress={() => {
          if (!user) {
            navigation.navigate('Login');
            return;
          }

          navigation.navigate('MyRideRequests');
        }}
      >
        <Text style={[styles.topButtonText, { color: theme.colors.text }]}>My Requests</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.topButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          if (!user) {
            navigation.navigate('Login');
            return;
          }

          navigation.navigate('CreateRideRequest');
        }}
      >
        <Icon name="add" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <PageHeader title="Ride Requests" showBack={false} rightAction={headerAction} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rideRequests}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="alt-route" size={56} color={theme.colors.textLight} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No ride requests found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                New ride requests will appear here when riders start posting them.
              </Text>
            </View>
          }
        />
      )}

      <ErrorModal visible={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
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
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subtleText: {
    fontSize: 13,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  requesterText: {
    marginTop: 12,
    fontSize: 12,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  topButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default RideRequestsScreen;
