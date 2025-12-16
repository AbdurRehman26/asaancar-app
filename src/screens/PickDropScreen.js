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
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { pickDropAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ServiceTabs from '@/components/ServiceTabs';
import PickDropFilterDrawer from '@/components/PickDropFilterDrawer';
import ErrorModal from '@/components/ErrorModal';

const PickDropScreen = () => {
  const { theme, isDark, toggleTheme } = useTheme();
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
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
    return timeString;
  };

  // Helper function to handle phone calls
  const handleCall = async (phoneNumber) => {
    if (!phoneNumber) {
      setErrorMessage('Phone number not available');
      setShowErrorModal(true);
      return;
    }

    const phoneUrl = `tel:${phoneNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        setErrorMessage('Unable to open phone dialer');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error opening phone dialer:', error);
      setErrorMessage('Failed to make call');
      setShowErrorModal(true);
    }
  };

  // Helper function to handle messages (WhatsApp or SMS)
  const handleMessage = async (phoneNumber, whatsappNumber = null) => {
    const numberToUse = whatsappNumber || phoneNumber;
    if (!numberToUse) {
      setErrorMessage('Contact number not available');
      setShowErrorModal(true);
      return;
    }

    // Remove any non-digit characters except + for WhatsApp
    const cleanNumber = numberToUse.replace(/[^\d+]/g, '');

    // Try WhatsApp first
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    try {
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
        return;
      }
    } catch (error) {
    }

    // Fallback to SMS
    const smsUrl = `sms:${phoneNumber}`;
    try {
      const canOpenSMS = await Linking.canOpenURL(smsUrl);
      if (canOpenSMS) {
        await Linking.openURL(smsUrl);
      } else {
        setErrorMessage('Unable to open messaging app');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error opening messaging app:', error);
      setErrorMessage('Failed to open messaging app');
      setShowErrorModal(true);
    }
  };

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
    setTempFilters((prev) => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
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

  const handleApplyFilters = (updatedFilters = null) => {
    // Accept optional updatedFilters parameter to handle direct filter updates
    const filtersToApply = updatedFilters || tempFilters;

    // Create a completely new object to ensure React detects the change
    const newFilters = {
      startLocation: filtersToApply.startLocation || '',
      endLocation: filtersToApply.endLocation || '',
      driverGender: filtersToApply.driverGender || '',
      departureTime: filtersToApply.departureTime || '',
      departureDate: filtersToApply.departureDate || '',
    };

    setFilters(newFilters);
    setTempFilters(newFilters);
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
            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.themeToggleButton}
            >
              <Icon
                name={isDark ? 'light-mode' : 'dark-mode'}
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
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
              <View key={service.id} style={[styles.serviceCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                {/* Top Section: Route & Price */}
                <View style={styles.cardHeader}>
                  {/* Left: Route Timeline */}
                  <View style={styles.routeContainer}>
                    {/* Start Point */}
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineDotGreen} />
                      <View style={styles.timelineContent}>
                        <Text style={[styles.locationTitle, { color: theme.colors.text }]} numberOfLines={1}>
                          {service.start_location || 'Start Location'}
                        </Text>
                        <Text style={styles.locationLabel}>Start Point</Text>
                      </View>
                    </View>

                    {/* Connecting Line & Stops */}
                    <View style={styles.timelineLineContainer}>
                      <View style={styles.timelineLine} />
                      {service.stops && service.stops.length > 0 && (
                        <View style={styles.stopsTag}>
                          <Text style={styles.stopsTagText}>
                            {service.stops.length} Stop{service.stops.length > 1 ? 's' : ''} in between
                          </Text>
                          <Icon name="keyboard-arrow-down" size={14} color="#C2185B" />
                        </View>
                      )}
                    </View>

                    {/* Destination */}
                    <View style={styles.timelineItem}>
                      <Icon name="location-pin" size={18} color="#8E24AA" style={{ marginLeft: -1 }} />
                      <View style={styles.timelineContent}>
                        <Text style={[styles.locationTitle, { color: theme.colors.text }]} numberOfLines={1}>
                          {service.end_location || 'End Location'}
                        </Text>
                        <Text style={styles.locationLabel}>Destination</Text>
                      </View>
                    </View>
                  </View>

                  {/* Right: Price */}
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Per Person</Text>
                    {(() => {
                      const price =
                        service.price_per_person ||
                        service.pricePerPerson ||
                        (service.price && typeof service.price === 'object' ? service.price.perPerson || service.price.amount : null) ||
                        service.price ||
                        null;
                      const currency = service.currency || 'PKR';

                      if (!price) return null;

                      return (
                        <Text style={styles.priceValue}>
                          {currency} {typeof price === 'number' ? price.toLocaleString() : price}
                        </Text>
                      );
                    })()}
                  </View>
                </View>

                {/* Tags Row: Schedule, Seats, Gender */}
                <View style={styles.tagsRow}>
                  {/* Schedule Tag */}
                  {(() => {
                    const { schedule_type, selected_days, departure_date, departure_time, is_everyday, everyday_service } = service;

                    let labelText = '';
                    let timeText = departure_time ? formatTime(departure_time) : '';

                    if (schedule_type) {
                      switch (schedule_type.toLowerCase()) {
                        case 'everyday':
                          labelText = 'Everyday';
                          break;
                        case 'weekday':
                        case 'weekdays':
                          labelText = 'Mon-Fri';
                          break;
                        case 'weekend':
                        case 'weekends':
                          labelText = 'Sat-Sun';
                          break;
                        case 'custom':
                          labelText = selected_days || 'Custom';
                          break;
                        case 'once':
                          labelText = departure_date ? formatDate(departure_date) : 'Once';
                          break;
                        default:
                          labelText = schedule_type;
                      }
                    } else {
                      // Fallback logic
                      const isEverydayService = is_everyday || everyday_service;
                      if (isEverydayService) {
                        labelText = 'Everyday';
                      } else if (departure_date) {
                        labelText = formatDate(departure_date);
                      } else {
                        labelText = 'Flexible';
                      }
                    }

                    return (
                      <View style={styles.scheduleTag}>
                        <Icon name="access-time" size={14} color="#0056cb" />
                        <Text style={styles.scheduleTagText}>
                          {labelText} {timeText ? `• ${timeText}` : ''}
                        </Text>
                      </View>
                    );
                  })()}

                  {/* Seats Tag */}
                  {(() => {
                    const availableSpaces =
                      service.available_spaces ||
                      service.availableSpaces ||
                      service.available_seats ||
                      service.availableSeats ||
                      null;

                    if (availableSpaces === null || availableSpaces === undefined) return null;

                    return (
                      <View style={styles.seatsTag}>
                        <Icon name="people-outline" size={14} color="#E65100" />
                        <Text style={styles.seatsTagText}>
                          {availableSpaces} Seat{availableSpaces !== 1 ? 's' : ''} left
                        </Text>
                      </View>
                    );
                  })()}

                  {/* Driver Gender Tag */}
                  {service.driver_gender && (
                    <View style={[styles.driverGenderTag, {
                      backgroundColor: service.driver_gender === 'female' ? '#FCE4EC' : '#E3F2FD'
                    }]}>
                      <Text style={styles.driverGenderText}>
                        {service.driver_gender === 'female' ? '👩 Female Driver' : '👨 Male Driver'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Vehicle Info */}
                {service.car && (
                  <View style={styles.vehicleSection}>
                    <Text style={styles.vehicleLabel}>VEHICLE</Text>
                    <View style={styles.vehicleRow}>
                      <Icon name="directions-car" size={16} color="#FF5252" />
                      <Text style={[styles.vehicleText, { color: theme.colors.text }]}>
                        {service.car.name || service.car} <Text style={{ color: theme.colors.textSecondary }}>{service.car.color ? `(${service.car.color})` : ''}</Text>
                      </Text>
                    </View>
                  </View>
                )}

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Footer: Driver & Action */}
                <View style={styles.cardFooter}>
                  <View style={styles.driverInfo}>
                    {/* Avatar */}
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverInitials}>
                        {(service.driver?.name || service.driver || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.driverName, { color: theme.colors.text }]}>
                        {service.driver?.name || service.driver || 'User'}
                      </Text>
                      {(() => {
                        const provider = service.user || service.provider || service.owner || null;
                        const phone = provider?.phone_number || service.contact_number || service.phone || null;
                        if (phone) {
                          return (
                            <Text style={styles.driverPhone}>{phone}</Text>
                          )
                        }
                        return null;
                      })()}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewDetailsButtonSmall}
                    onPress={() => {
                      navigation.navigate('PickDropDetail', { serviceId: service.id, serviceData: service });
                    }}
                  >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                  </TouchableOpacity>
                </View>
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
        <View style={[styles.paginationContainer, { paddingBottom: user ? 8 : Math.max(insets.bottom + 10, 8) }]}>
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

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
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
  themeToggleButton: {
    padding: 4,
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeContainer: {
    flex: 1,
    marginRight: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  timelineDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C853', // Green for start
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#fff',
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
    fontSize: 10,
    color: '#9E9E9E',
  },
  timelineLineContainer: {
    marginLeft: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
    paddingLeft: 12,
    minHeight: 50, // Increased height to prevent overlap
    justifyContent: 'center', // Center content vertically
    position: 'relative',
  },
  timelineLine: {
    // handled by container border
  },
  stopsTag: {
    position: 'absolute',
    left: -2,
    // top: '30%' -> Removed to use centering
    alignSelf: 'flex-start', // Keeps it near the line
    backgroundColor: '#F8BBD0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1, // Ensure it sits on top of the line
  },
  stopsTagText: {
    fontSize: 10,
    color: '#880E4F',
    marginRight: 2,
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: '#757575',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8E24AA', // Purple
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  scheduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD', // Light Blue
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scheduleTagText: {
    fontSize: 11,
    color: '#0D47A1',
    fontWeight: '600',
  },
  seatsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0', // Light Orange
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  seatsTagText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '600',
  },
  driverGenderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  driverGenderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  vehicleSection: {
    marginBottom: 16,
  },
  vehicleLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#616161',
  },
  driverName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  driverPhone: {
    fontSize: 11,
    color: '#757575',
  },
  viewDetailsButtonSmall: {
    backgroundColor: '#8E24AA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Keep required non-card styles
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
    paddingTop: 8,
    paddingBottom: 8,
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

