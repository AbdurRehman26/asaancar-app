import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { pickDropAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ServiceTabs from '@/components/ServiceTabs';
import PickDropFilterDrawer from '@/components/PickDropFilterDrawer';

const PickDropScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    startLocation: '',
    endLocation: '',
    driverGender: '',
    departureTime: '',
    departureDate: '',
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState('pickdrop');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiCurrentPage, setApiCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const [pageSize] = useState(12);

  // Update active tab when screen is focused
  useFocusEffect(
    useCallback(() => {
      setActiveServiceTab('pickdrop');
      loadServices();
    }, [])
  );

  useEffect(() => {
    loadServices();
  }, [filters, currentPage, searchQuery]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: currentPage,
        per_page: pageSize,
      };
      
      // Add search query if provided
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const data = await pickDropAPI.getPickDropServices(params);
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
      
      // Handle pagination - prioritize meta key as user indicated
      let currentPageValue = 1;
      let lastPageValue = 1;
      let totalValue = 0;
      
      if (data?.meta) {
        currentPageValue = parseInt(data.meta.current_page || data.meta.page || currentPage, 10) || 1;
        lastPageValue = parseInt(data.meta.last_page || data.meta.total_pages || 1, 10) || 1;
        totalValue = parseInt(data.meta.total || servicesData.length, 10) || 0;
      } else if (data?.pagination) {
        currentPageValue = parseInt(data.pagination.current_page || data.pagination.page || currentPage, 10) || 1;
        lastPageValue = parseInt(data.pagination.last_page || data.pagination.total_pages || 1, 10) || 1;
        totalValue = parseInt(data.pagination.total || servicesData.length, 10) || 0;
      } else if (data?.data?.meta) {
        currentPageValue = parseInt(data.data.meta.current_page || data.data.meta.page || currentPage, 10) || 1;
        lastPageValue = parseInt(data.data.meta.last_page || data.data.meta.total_pages || 1, 10) || 1;
        totalValue = parseInt(data.data.meta.total || servicesData.length, 10) || 0;
      } else if (data?.data?.pagination) {
        currentPageValue = parseInt(data.data.pagination.current_page || data.data.pagination.page || currentPage, 10) || 1;
        lastPageValue = parseInt(data.data.pagination.last_page || data.data.pagination.total_pages || 1, 10) || 1;
        totalValue = parseInt(data.data.pagination.total || servicesData.length, 10) || 0;
      } else {
        currentPageValue = currentPage || 1;
        lastPageValue = 1;
        totalValue = servicesData.length || 0;
      }
      
      setApiCurrentPage(currentPageValue);
      setTotalPages(lastPageValue);
      setTotalServices(totalValue);
    } catch (error) {
      console.error('Error loading pick and drop services:', error);
      setServices([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceTabChange = (tab) => {
    setActiveServiceTab(tab);
    if (tab === 'rental') {
      navigation.navigate('RentalCars');
    } else if (tab === 'pickdrop') {
      navigation.navigate('PickDrop');
    }
  };

  const handleFilterChange = (key, value) => {
    setTempFilters({ ...tempFilters, [key]: value });
  };

  const clearFilters = () => {
    const emptyFilters = {
      startLocation: '',
      endLocation: '',
      driverGender: '',
      departureTime: '',
      departureDate: '',
    };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const openFilters = () => {
    setTempFilters(filters);
    setShowFilters(true);
  };

  const closeFilters = () => {
    setShowFilters(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
          </View>
          <View style={styles.headerActions}>
          </View>
        </View>
        <ServiceTabs
          activeTab={activeServiceTab}
          onTabChange={handleServiceTabChange}
        />
      </View>

      {/* Filter and Add Service Section (match Rental Cars layout) */}
      <View style={[styles.searchSection, { backgroundColor: theme.colors.background }]}>
        <View style={styles.searchBarContainer}>
          {/* Filter icon (same as Rental Cars) */}
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: theme.colors.primary }]}
            onPress={openFilters}
          >
            <Icon name="tune" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* Add Service aligned to the right */}
          <TouchableOpacity
            onPress={() => {
              if (!user) {
                navigation.navigate('Login');
                return;
              }
              navigation.navigate('CreatePickDropService');
            }}
            style={[styles.addServiceButton, { backgroundColor: theme.colors.primary }]}
          >
            <Icon name="add" size={18} color="#fff" />
            <Text style={styles.addServiceButtonText}>Add Service</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pagination Info */}
      {!loading && services.length > 0 && (
        <View style={[styles.paginationInfo, { backgroundColor: theme.colors.cardBackground, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.paginationText, { color: theme.colors.textSecondary }]}>
            {(() => {
              const currentPageNum = Number(apiCurrentPage) || 1;
              const pageSizeNum = Number(pageSize) || 12;
              const totalNum = Number(totalServices) || 0;
              const startNumber = (currentPageNum - 1) * pageSizeNum + 1;
              const endNumber = Math.min(currentPageNum * pageSizeNum, totalNum);
              return totalNum > 0 
                ? `Showing ${startNumber}-${endNumber} of ${totalNum}`
                : `Showing ${startNumber}-${endNumber}`;
            })()}
          </Text>
        </View>
      )}
      
      <ScrollView>
        {/* Services List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : services.length > 0 ? (
          <View style={styles.servicesContainer}>
            {services.map((service) => (
              <View key={service.id} style={[styles.serviceCard, { backgroundColor: theme.colors.background }]}>
                  {/* Route */}
                  <View style={styles.routeSection}>
                    <View style={styles.locationRow}>
                      <Icon name="location-on" size={16} color={theme.colors.secondary} />
                      <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
                        {service.start_location || 'Start Location'}
                      </Text>
                    </View>
                    <View style={styles.locationRow}>
                      <Icon name="send" size={16} color="#ff4444" />
                      <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
                        {service.end_location || 'End Location'}
                      </Text>
                    </View>
                  </View>

                  {/* Driver */}
                  {service.driver && (
                    <Text style={[styles.driverText, { color: theme.colors.textSecondary }]}>
                      by {service.driver.name || service.driver}
                    </Text>
                  )}

                  {/* Schedule */}
                  {service.schedule && (
                    <View style={styles.scheduleRow}>
                      <Icon name="calendar-today" size={14} color={theme.colors.secondary} />
                      <Text style={[styles.scheduleText, { color: theme.colors.textSecondary }]}>
                        {service.schedule}
                      </Text>
                    </View>
                  )}

                  {/* Availability */}
                  {service.available_seats !== undefined && (
                    <View style={styles.availabilityRow}>
                      <Icon name="person" size={14} color={theme.colors.textSecondary} />
                      <Text style={[styles.availabilityText, { color: theme.colors.textSecondary }]}>
                        {service.available_seats} space{service.available_seats !== 1 ? 's' : ''} available
                      </Text>
                    </View>
                  )}

                  {/* Price */}
                  {service.price && (
                    <Text style={[styles.priceText, { color: theme.colors.primary }]}>
                      PKR {typeof service.price === 'object' ? service.price.perPerson || service.price.amount : service.price} per person
                    </Text>
                  )}

                  {/* Driver Gender */}
                  {service.driver_gender && (
                    <View style={[styles.genderTag, { backgroundColor: service.driver_gender === 'female' ? '#ffb3d9' : '#b3d9ff' }]}>
                      <Text style={styles.genderText}>
                        {service.driver_gender === 'female' ? '♀' : '♂'} {service.driver_gender === 'female' ? 'Female' : 'Male'} driver
                      </Text>
                    </View>
                  )}

                  {/* Car Details */}
                  {service.car && (
                    <Text style={[styles.carText, { color: theme.colors.textSecondary }]}>
                      Car: {service.car.name || service.car} {service.car.color ? `(${service.car.color})` : ''} • {service.car.seats || service.seats || 'N/A'} seats
                    </Text>
                  )}

                  {/* Stops */}
                  {service.stops && service.stops.length > 0 && (
                    <View style={styles.stopsSection}>
                      <Icon name="schedule" size={14} color={theme.colors.textSecondary} />
                      <Text style={[styles.stopsText, { color: theme.colors.textSecondary }]}>
                        Stops ({service.stops.length})
                      </Text>
                      {service.stops.map((stop, index) => {
                        // Handle stop object structure
                        const stopName = stop.location || stop.name || stop.area?.name || stop.city?.name || 'Stop';
                        const stopTime = stop.stop_time || stop.time || '';
                        return (
                          <View key={stop.id || index} style={styles.stopItem}>
                            <View style={[styles.stopDot, { backgroundColor: theme.colors.primary }]} />
                            <Text style={[styles.stopText, { color: theme.colors.textSecondary }]}>
                              {stopName} {stopTime ? `(${stopTime})` : ''}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Description */}
                  {service.description && (
                    <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}

                  {/* View Details Button */}
                  <TouchableOpacity
                    style={[styles.viewDetailsButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => {
                      navigation.navigate('PickDropDetail', { serviceId: service.id });
                    }}
                  >
                    <Text style={styles.viewDetailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="directions-car" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No services found</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Icon name="info" size={24} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Currently available in Karachi only. We'll be expanding to other cities soon!
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Pagination Controls */}
      {!loading && services.length > 0 && (
        <View style={[styles.paginationContainer, { backgroundColor: theme.colors.cardBackground, borderTopColor: theme.colors.border, paddingBottom: Math.max(insets.bottom + 10, 16) }]}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: theme.colors.backgroundSecondary },
              currentPage === 1 && styles.paginationButtonDisabled,
            ]}
            onPress={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
              }
            }}
            disabled={currentPage === 1}
          >
            <Icon name="chevron-left" size={20} color={currentPage === 1 ? theme.colors.textLight : theme.colors.text} />
            <Text style={[styles.paginationButtonText, { color: currentPage === 1 ? theme.colors.textLight : theme.colors.text }]}>Back</Text>
          </TouchableOpacity>

          {!user && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: theme.colors.backgroundSecondary },
              currentPage >= totalPages && styles.paginationButtonDisabled,
            ]}
            onPress={() => {
              if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
              }
            }}
            disabled={currentPage >= totalPages}
          >
            <Text style={[styles.paginationButtonText, { color: currentPage >= totalPages ? theme.colors.textLight : theme.colors.text }]}>Next</Text>
            <Icon name="chevron-right" size={20} color={currentPage >= totalPages ? theme.colors.textLight : theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Drawer */}
      <PickDropFilterDrawer
        visible={showFilters}
        onClose={closeFilters}
        filters={tempFilters}
        onFilterChange={handleFilterChange}
        onClearAll={clearFilters}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitleSection: {
    flex: 1,
    marginRight: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7e246c',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addServiceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Match Rental Cars filter layout
  searchSection: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  servicesContainer: {
    padding: 16,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  serviceCard: {
    width: '100%',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeSection: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  driverText: {
    fontSize: 12,
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 12,
    marginLeft: 6,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  availabilityText: {
    fontSize: 12,
    marginLeft: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  genderTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  carText: {
    fontSize: 12,
    marginBottom: 8,
  },
  stopsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopsText: {
    fontSize: 12,
    marginLeft: 6,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: 4,
    width: '100%',
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stopText: {
    fontSize: 11,
  },
  descriptionText: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  viewDetailsButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewDetailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  paginationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PickDropScreen;

