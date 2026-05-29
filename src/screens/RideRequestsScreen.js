import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { rideRequestAPI } from '@/services/api';
import ErrorModal from '@/components/ErrorModal';
import PageHeader from '@/components/PageHeader';
import RideRequestFilterDrawer from '@/components/RideRequestFilterDrawer';

const EMPTY_FILTERS = {
  startLocation: '',
  startAreaId: '',
  endLocation: '',
  endAreaId: '',
  preferredDriverGender: '',
  requiredSeats: '',
  departureDate: '',
  departureTime: '',
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString;
  }
};

const formatTime = (timeString) => {
  if (!timeString) return null;
  try {
    const timePart = typeof timeString === 'string' && timeString.includes('T')
      ? timeString.split('T')[1]
      : timeString;

    if (typeof timePart === 'string' && timePart.includes(':')) {
      const [hours, minutes] = timePart.split(':');
      let h = parseInt(hours, 10);
      if (Number.isNaN(h)) return timeString;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h || 12;
      return `${h}:${String(minutes).slice(0, 2)} ${ampm}`;
    }

    return timeString;
  } catch (error) {
    return timeString;
  }
};

const getAreaLabel = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  return value?.name || value?.area || value?.title || value?.location || '';
};

const getRequestRouteLabel = (request, target) => {
  const areaKey = target === 'start' ? 'start_area' : 'end_area';
  const locationKey = target === 'start' ? 'start_location' : 'end_location';
  const areaLabel = getAreaLabel(request?.[areaKey]);

  return areaLabel || request?.[locationKey] || '';
};

const RideRequestsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [rideRequests, setRideRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiCurrentPage, setApiCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [pageSize] = useState(12);

  const glassCardStyle = {
    backgroundColor: isDark ? 'rgba(29, 22, 36, 0.82)' : '#FFFFFF',
    borderColor: isDark ? 'rgba(232, 170, 220, 0.28)' : 'rgba(157, 58, 138, 0.16)',
    shadowColor: isDark ? '#000' : theme.colors.primary,
    shadowOpacity: isDark ? 0.28 : 0.12,
  };
  const glassChipStyle = {
    backgroundColor: isDark ? 'rgba(126, 36, 108, 0.22)' : '#FFFFFF',
    borderColor: isDark ? 'rgba(232, 170, 220, 0.24)' : 'rgba(157, 58, 138, 0.14)',
  };

  const loadRideRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await rideRequestAPI.getRideRequests({
        ...filters,
        page: currentPage,
        per_page: pageSize,
      });

      const requests =
        (Array.isArray(data?.data) && data.data) ||
        (Array.isArray(data?.requests) && data.requests) ||
        (Array.isArray(data?.data?.data) && data.data.data) ||
        (Array.isArray(data) && data) ||
        [];

      setRideRequests(requests);

      let currentPageValue = 1;
      let lastPageValue = 1;
      let totalValue = requests.length;

      if (data?.meta) {
        currentPageValue = parseInt(data.meta.current_page || data.meta.page || currentPage, 10) || 1;
        lastPageValue = parseInt(data.meta.last_page || data.meta.total_pages || 1, 10) || 1;
        totalValue = parseInt(data.meta.total || requests.length, 10) || requests.length;
      } else if (data?.pagination) {
        currentPageValue = parseInt(data.pagination.current_page || data.pagination.page || currentPage, 10) || 1;
        lastPageValue = parseInt(data.pagination.last_page || data.pagination.total_pages || 1, 10) || 1;
        totalValue = parseInt(data.pagination.total || requests.length, 10) || requests.length;
      } else if (data?.data?.meta) {
        currentPageValue = parseInt(data.data.meta.current_page || currentPage, 10) || 1;
        lastPageValue = parseInt(data.data.meta.last_page || 1, 10) || 1;
        totalValue = parseInt(data.data.meta.total || requests.length, 10) || requests.length;
      }

      setApiCurrentPage(currentPageValue);
      setTotalPages(lastPageValue);
      setTotalRequests(totalValue);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to load ride requests.');
      setShowErrorModal(true);
      setRideRequests([]);
      setApiCurrentPage(1);
      setTotalPages(1);
      setTotalRequests(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, pageSize]);

  useEffect(() => {
    loadRideRequests();
  }, [loadRideRequests]);

  const openFilters = () => {
    setTempFilters(filters);
    setShowFilters(true);
  };

  const closeFilters = () => {
    setTempFilters(filters);
    setShowFilters(false);
  };

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = (appliedFilters = tempFilters) => {
    setFilters(appliedFilters);
    setTempFilters(appliedFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setTempFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  const renderRequestCard = (item) => {
    const startLabel = getRequestRouteLabel(item, 'start');
    const endLabel = getRequestRouteLabel(item, 'end');
    const requesterName = item.user?.name || item.name || 'Rider';
    const requesterCity =
      item.user?.city?.name ||
      item.user?.city?.city ||
      item.user?.city_name ||
      item.user?.city ||
      item.city?.name ||
      item.city_name ||
      item.city ||
      null;
    const budget = item.budget_per_seat || item.budgetPerSeat || null;
    const seats = item.required_seats || item.requiredSeats || 1;
    const departureLabel = item.schedule_type === 'once' && item.departure_date
      ? formatDate(item.departure_date)
      : item.schedule_type === 'everyday'
        ? 'Everyday'
        : item.schedule_type === 'custom' && Array.isArray(item.selected_days) && item.selected_days.length
          ? item.selected_days.join(', ')
          : item.schedule_type || 'Flexible';

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.serviceCard, glassCardStyle]}
        onPress={() => navigation.navigate('RideRequestDetail', { requestId: item.id, rideRequest: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.routeContainer}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDotGreen, { borderColor: glassCardStyle.backgroundColor }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.locationTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {startLabel || 'Start Location'}
                </Text>
                <Text style={[styles.locationLabel, { color: theme.colors.textLight }]}>Start Point</Text>
              </View>
            </View>

            <View style={[styles.timelineLineContainer, { borderLeftColor: isDark ? theme.colors.border : '#E0E0E0' }]}>
              <View style={styles.timelineLine} />
            </View>

            <View style={styles.timelineItem}>
              <Icon name="location-pin" size={18} color={isDark ? '#c77dba' : theme.colors.primary} style={{ marginLeft: -1 }} />
              <View style={styles.timelineContent}>
                <Text style={[styles.locationTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {endLabel || 'End Location'}
                </Text>
                <Text style={[styles.locationLabel, { color: theme.colors.textLight }]}>Destination</Text>
              </View>
            </View>
          </View>

        </View>

        {budget ? (
          <View style={styles.priceRow}>
            <View style={[styles.priceContainer, glassChipStyle, { borderWidth: 1 }]}>
              <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Budget / Seat</Text>
              <Text style={[styles.priceValue, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                {item.currency || 'PKR'} {budget}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.tagsRow}>
          <View style={[styles.scheduleTag, glassChipStyle, { borderWidth: 1 }]}>
            <Icon name="access-time" size={14} color={isDark ? '#c77dba' : theme.colors.primary} />
            <Text style={[styles.scheduleTagText, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
              {departureLabel} {item.departure_time ? `• ${formatTime(item.departure_time)}` : ''}
            </Text>
          </View>

          <View style={[styles.seatsTag, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.48)', borderWidth: 1, borderColor: isDark ? 'rgba(252, 211, 77, 0.18)' : 'rgba(245, 158, 11, 0.14)' }]}>
            <Icon name="people-outline" size={14} color={isDark ? '#ffb74d' : '#f57c00'} />
            <Text style={[styles.seatsTagText, { color: isDark ? '#ffb74d' : '#f57c00' }]}>
              {seats} Seat{seats !== 1 ? 's' : ''} needed
            </Text>
          </View>

          {item.preferred_driver_gender ? (
            <View style={[styles.driverGenderTag, {
              backgroundColor: item.preferred_driver_gender === 'female'
                ? (isDark ? 'rgba(233, 30, 99, 0.18)' : 'rgba(255, 255, 255, 0.48)')
                : (isDark ? 'rgba(33, 150, 243, 0.18)' : 'rgba(255, 255, 255, 0.48)'),
              borderWidth: 1,
              borderColor: item.preferred_driver_gender === 'female'
                ? (isDark ? 'rgba(244, 143, 177, 0.18)' : 'rgba(233, 30, 99, 0.14)')
                : (isDark ? 'rgba(144, 202, 249, 0.18)' : 'rgba(33, 150, 243, 0.14)'),
            }]}>
              <Text style={[styles.driverGenderText, {
                color: item.preferred_driver_gender === 'female'
                  ? (isDark ? '#f48fb1' : '#e91e63')
                  : (isDark ? '#90caf9' : '#2196f3'),
              }]}>
                {item.preferred_driver_gender === 'female' ? '👩 Female Driver' : '👨 Male Driver'}
              </Text>
            </View>
          ) : null}
        </View>

        {item.description ? (
          <Text style={[styles.requestNote, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={[styles.cardDivider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.cardFooter}>
          <View style={styles.driverInfo}>
            <View style={[styles.driverAvatar, glassChipStyle, { borderWidth: 1 }]}>
              {user ? (
                <Text style={[styles.driverInitials, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                  {requesterName.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Icon name="lock-outline" size={18} color={isDark ? '#c77dba' : theme.colors.primary} />
              )}
            </View>
            <View>
              <Text style={[styles.driverName, { color: theme.colors.text }]}>
                {user ? requesterName : 'Rider'}
              </Text>
              <Text style={[styles.driverPhone, { color: theme.colors.textSecondary }]}>
                {user ? (item.contact || 'Contact on details page') : 'Login to view contact details'}
              </Text>
              {user && requesterCity ? (
                <Text style={[styles.driverPhone, { color: theme.colors.textSecondary }]}>
                  {requesterCity}
                </Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.viewDetailsButtonSmall, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('RideRequestDetail', { requestId: item.id, rideRequest: item })}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
      <PageHeader title="Ride Requests" showBack={false} />

      <View style={[styles.searchSection, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={styles.searchBarContainer}>
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }]}
            onPress={openFilters}
          >
            <Icon name="tune" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!user) {
                navigation.navigate('Login');
                return;
              }
              navigation.navigate('CreateRideRequest');
            }}
            style={[styles.addServiceButton, { backgroundColor: theme.colors.primary }]}
          >
            <Icon name="add" size={18} color="#fff" />
            <Text style={styles.addServiceButtonText}>Add Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : rideRequests.length > 0 ? (
          <View style={styles.listContent}>
            {rideRequests.map(renderRequestCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="alt-route" size={64} color={theme.colors.textLight} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No ride requests found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              New ride requests will appear here when riders start posting them.
            </Text>
          </View>
        )}
      </ScrollView>

      {!loading && rideRequests.length > 0 && (
        <View
          style={[
            styles.paginationContainer,
            { marginBottom: user ? -Math.max(insets.bottom, 0) + 2 : 0, paddingBottom: 0 },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: glassCardStyle.backgroundColor, borderColor: glassCardStyle.borderColor, borderWidth: 1 },
              currentPage === 1 && styles.paginationButtonDisabled,
            ]}
            onPress={() => {
              if (currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
              }
            }}
            disabled={currentPage === 1}
          >
            <Icon name="chevron-left" size={20} color={currentPage === 1 ? theme.colors.textLight : theme.colors.text} />
            <Text style={[styles.paginationButtonText, { color: currentPage === 1 ? theme.colors.textLight : theme.colors.text }]}>Back</Text>
          </TouchableOpacity>

          <View style={[styles.pageIndicator, { backgroundColor: glassCardStyle.backgroundColor, borderColor: glassCardStyle.borderColor, borderWidth: 1 }]}>
            <Text style={[styles.pageIndicatorText, { color: theme.colors.text }]}>
              {apiCurrentPage} / {totalPages}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: glassCardStyle.backgroundColor, borderColor: glassCardStyle.borderColor, borderWidth: 1 },
              currentPage >= totalPages && styles.paginationButtonDisabled,
            ]}
            onPress={() => {
              if (currentPage < totalPages) {
                setCurrentPage((prev) => prev + 1);
              }
            }}
            disabled={currentPage >= totalPages}
          >
            <Text style={[styles.paginationButtonText, { color: currentPage >= totalPages ? theme.colors.textLight : theme.colors.text }]}>Next</Text>
            <Icon name="chevron-right" size={20} color={currentPage >= totalPages ? theme.colors.textLight : theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {!loading && rideRequests.length > 0 && !user && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={[
            styles.loginButton,
            {
              backgroundColor: theme.colors.primary,
              marginBottom: -Math.max(insets.bottom, 0) + 2,
            },
          ]}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      )}

      <RideRequestFilterDrawer
        visible={showFilters}
        onClose={closeFilters}
        filters={tempFilters}
        onFilterChange={handleFilterChange}
        onClearAll={clearFilters}
        onApply={handleApplyFilters}
      />

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
    paddingVertical: 40,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  searchSection: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    flex: 1,
  },
  addServiceButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  topButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  serviceCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  routeContainer: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C853',
    marginRight: 8,
    borderWidth: 2,
    elevation: 2,
  },
  timelineContent: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  locationLabel: {
    fontSize: 11,
  },
  timelineLineContainer: {
    marginLeft: 5,
    borderLeftWidth: 2,
    paddingLeft: 14,
    minHeight: 34,
    justifyContent: 'center',
  },
  timelineLine: {},
  priceRow: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  priceContainer: {
    minWidth: 96,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  scheduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  scheduleTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  seatsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  seatsTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  driverGenderTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  driverGenderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestNote: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardDivider: {
    height: 1,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  driverInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 12,
  },
  viewDetailsButtonSmall: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingHorizontal: 24,
    paddingVertical: 56,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    flex: 1,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pageIndicator: {
    minWidth: 76,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
  },
  loginButton: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 2,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default RideRequestsScreen;
