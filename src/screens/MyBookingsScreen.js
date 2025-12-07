import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { bookingAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MyBookingsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadBookings(1);
  }, []);

  const loadBookings = async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const data = await bookingAPI.getBookings({ page: pageNum, per_page: perPage });
      
      // Handle different response structures
      const bookingsList = data.data || data.bookings || data || [];
      const totalPages = data.last_page || data.total_pages || Math.ceil((data.total || bookingsList.length) / perPage);
      
      if (append) {
        setBookings(prev => [...prev, ...bookingsList]);
      } else {
        setBookings(bookingsList);
      }
      
      setHasMore(pageNum < totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadBookings(1, false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'active':
        return '#7e246c';
      case 'pending':
        return '#ffa500';
      case 'cancelled':
        return '#ff4444';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity style={[styles.bookingCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
      <View style={styles.bookingHeader}>
        <View>
          <Text style={[styles.carName, { color: theme.colors.text }]}>
            {item.car?.brand?.name || 'Brand'}{' '}
            {item.car?.name || 'Car Name'}
          </Text>
          <Text style={[styles.bookingId, { color: theme.colors.textSecondary }]}>Booking #{item.id}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status || 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Icon name="calendar-today" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="location-on" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {item.pickupLocation || 'N/A'}
          </Text>
        </View>
        {item.withDriver && (
          <View style={styles.detailRow}>
            <Icon name="person" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>With Driver</Text>
          </View>
        )}
      </View>

      <View style={[styles.bookingFooter, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
          PKR {item.totalAmount || item.total || '0'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Bookings</Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
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
            <Icon name="book" size={64} color={theme.colors.textLight} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No bookings found</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textLight }]}>
              Start by booking a car from the home screen
            </Text>
          </View>
        }
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
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  carName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  bookingFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
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

export default MyBookingsScreen;


