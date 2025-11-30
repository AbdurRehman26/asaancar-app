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
  const [totalPages, setTotalPages] = useState(1);
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
      
      // Handle pagination
      if (data?.pagination) {
        setTotalPages(data.pagination.total_pages || data.pagination.last_page || 1);
      } else if (data?.meta) {
        setTotalPages(data.meta.last_page || data.meta.total_pages || 1);
      } else if (data?.data?.pagination) {
        setTotalPages(data.data.pagination.total_pages || data.data.pagination.last_page || 1);
      } else {
        setTotalPages(1);
      }
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
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
            <Text style={styles.pageTitle}>Pick & Drop Services</Text>
            <Text style={styles.pageSubtitle}>
              Share rides or find passengers for your journey. Multiple stops available.
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!user && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ServiceTabs
          activeTab={activeServiceTab}
          onTabChange={handleServiceTabChange}
        />
      </View>

      {/* Search and Filter Section */}
      <View style={[styles.searchSection, { backgroundColor: theme.colors.background }]}>
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchBar, { borderColor: theme.colors.border }]}>
            <Icon name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search by start or end location..."
              placeholderTextColor={theme.colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: theme.colors.primary }]}
            onPress={openFilters}
          >
            <Icon name="tune" size={20} color={theme.colors.primary} />
            <Text style={[styles.filterButtonText, { color: theme.colors.primary }]}>
              Filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView>
        {/* Services List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : services.length > 0 ? (
          <View style={styles.servicesContainer}>
            <View style={styles.servicesHeader}>
              <Text style={[styles.servicesTitle, { color: theme.colors.text }]}>
                Available Services ({services.length})
              </Text>
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

      {/* Filter Drawer */}
      <PickDropFilterDrawer
        visible={showFilters}
        onClose={closeFilters}
        filters={tempFilters}
        onFilterChange={handleFilterChange}
        onClearAll={clearFilters}
        onApply={handleApplyFilters}
      />
    </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
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
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    gap: 6,
    backgroundColor: '#fff',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
});

export default PickDropScreen;

