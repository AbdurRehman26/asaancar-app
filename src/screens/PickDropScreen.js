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
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';

const PickDropScreen = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    startLocation: '',
    startAreaId: '',
    endLocation: '',
    endAreaId: '',
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
        h = h ? h : 12;
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

  const getServiceRouteLabel = (service, target) => {
    const areaKeys = target === 'start'
      ? ['pickup_area', 'start_area']
      : ['dropoff_area', 'end_area'];
    const locationKey = target === 'start' ? 'start_location' : 'end_location';

    for (const key of areaKeys) {
      const label = getAreaLabel(service?.[key]);
      if (label) return label;
    }

    return service?.[locationKey] || '';
  };

  // Helper function to handle phone calls
  const handleCall = async (phoneNumber) => {
    if (!phoneNumber) {
      setErrorMessage(t('pickDropDetail.errorPhoneUnavailable'));
      setShowErrorModal(true);
      return;
    }

    const phoneUrl = `tel:${phoneNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        setErrorMessage(t('pickDropDetail.errorPhone'));
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error opening phone dialer:', error);
      setErrorMessage(t('pickDropDetail.errorPhone'));
      setShowErrorModal(true);
    }
  };

  // Helper function to handle messages (WhatsApp or SMS)
  const handleMessage = async (phoneNumber, whatsappNumber = null) => {
    const numberToUse = whatsappNumber || phoneNumber;
    if (!numberToUse) {
      setErrorMessage(t('pickDropDetail.errorContactUnavailable'));
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
        setErrorMessage(t('pickDropDetail.errorMsg'));
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error opening messaging app:', error);
      setErrorMessage(t('pickDropDetail.errorMsg'));
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


  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
  };

  const clearFilters = () => {
    const emptyFilters = {
      startLocation: '',
      startAreaId: '',
      endLocation: '',
      endAreaId: '',
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
      startAreaId: filtersToApply.startAreaId || '',
      endLocation: filtersToApply.endLocation || '',
      endAreaId: filtersToApply.endAreaId || '',
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
      <PageHeader title={t('pickdrop.title')} showBack={false} />

      {/* Filter and Add Service Section (match Rental Cars layout) */}
      <View style={[styles.searchSection, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={styles.searchBarContainer}>
          {/* Filter icon (same as Rental Cars) */}
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }]}
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
              navigation.navigate('Dashboard', { screen: 'CreatePickDropService' });
            }}
            style={[styles.addServiceButton, { backgroundColor: theme.colors.primary }]}
          >
            <Icon name="add" size={18} color="#fff" />
            <Text style={styles.addServiceButtonText}>{t('pickdrop.addService')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reverting to use ScrollView with ref for minimal impact */}
      <ScrollView>
        {/* Services List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>{t('common.loading')}</Text>
          </View>
        ) : services.length > 0 ? (
          <View style={styles.servicesContainer}>
            {services.map((service) => {
              const startLabel = getServiceRouteLabel(service, 'start');
              const endLabel = getServiceRouteLabel(service, 'end');

              return (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    glassCardStyle,
                  ]}
                  onPress={() => {
                    navigation.navigate('PickDropDetail', { serviceId: service.id, serviceData: service });
                  }}
                  activeOpacity={0.7}
                >
                  {/* Top Section: Route */}
                  <View style={styles.cardHeader}>
                    <View style={styles.routeContainer}>
                      {/* Start Point */}
                      <View style={styles.timelineItem}>
                        <View style={[styles.timelineDotGreen, { borderColor: glassCardStyle.backgroundColor }]} />
                        <View style={styles.timelineContent}>
                          <Text style={[styles.locationTitle, { color: theme.colors.text }]} numberOfLines={1}>
                            {startLabel || t('pickDropDetail.startLocation')}
                          </Text>
                          <Text style={[styles.locationLabel, { color: theme.colors.textLight }]}>{t('pickdrop.startPoint')}</Text>
                        </View>
                      </View>

                      {/* Connecting Line & Stops */}
                      <View
                        style={[
                          styles.timelineLineContainer,
                          !service.stops?.length && styles.timelineLineContainerCompact,
                          { borderLeftColor: isDark ? theme.colors.border : '#E0E0E0' },
                        ]}
                      >
                        <View style={styles.timelineLine} />
                        {service.stops && service.stops.length > 0 && (
                          <View style={[styles.stopsTag, glassChipStyle]}>
                            <Text style={[styles.stopsTagText, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                              {t('pickdrop.stopsInBetween', { count: service.stops.length })}
                            </Text>
                            <Icon name="keyboard-arrow-down" size={14} color={isDark ? '#c77dba' : theme.colors.primary} />
                          </View>
                        )}
                      </View>

                      {/* Destination */}
                      <View style={styles.timelineItem}>
                        <Icon name="location-pin" size={18} color={isDark ? '#c77dba' : theme.colors.primary} style={{ marginLeft: -1 }} />
                        <View style={styles.timelineContent}>
                          <Text style={[styles.locationTitle, { color: theme.colors.text }]} numberOfLines={1}>
                            {endLabel || t('pickDropDetail.endLocation')}
                          </Text>
                          <Text style={[styles.locationLabel, { color: theme.colors.textLight }]}>{t('pickdrop.destination')}</Text>
                        </View>
                      </View>
                    </View>

                  </View>

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
                    <View style={styles.priceRow}>
                      <View style={[styles.priceContainer, glassChipStyle, { borderWidth: 1 }]}>
                        <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>{t('pickdrop.perPerson')}</Text>
                        <Text style={[styles.priceValue, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                          {currency} {typeof price === 'number' ? price.toLocaleString() : price}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

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
                          labelText = t('pickDropDetail.everyday');
                          break;
                        case 'weekday':
                        case 'weekdays':
                          labelText = t('pickDropDetail.weekday');
                          break;
                        case 'weekend':
                        case 'weekends':
                          labelText = t('pickDropDetail.weekend');
                          break;
                        case 'custom':
                          labelText = selected_days || t('pickDropDetail.custom');
                          break;
                        case 'once':
                          labelText = departure_date ? formatDate(departure_date) : t('pickDropDetail.once');
                          break;
                        default:
                          labelText = schedule_type;
                      }
                    } else {
                      // Fallback logic
                      const isEverydayService = is_everyday || everyday_service;
                      if (isEverydayService) {
                        labelText = t('pickDropDetail.everyday');
                      } else if (departure_date) {
                        labelText = formatDate(departure_date);
                      } else {
                        labelText = t('pickDropDetail.flexible');
                      }
                    }

                    return (
                      <View style={[styles.scheduleTag, glassChipStyle, { borderWidth: 1 }]}>
                        <Icon name="access-time" size={14} color={isDark ? '#c77dba' : theme.colors.primary} />
                        <Text style={[styles.scheduleTagText, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                          {labelText} {timeText ? `• ${timeText}` : ''}
                        </Text>
                      </View>
                    );
                  })()}

                  {service.return_time && (
                    <View style={[styles.scheduleTag, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.48)', borderWidth: 1, borderColor: isDark ? 'rgba(147, 197, 253, 0.18)' : 'rgba(59, 130, 246, 0.14)' }]}>
                      <Icon name="reply" size={14} color={isDark ? '#90caf9' : '#2196f3'} />
                      <Text style={[styles.scheduleTagText, { color: isDark ? '#90caf9' : '#2196f3' }]}>
                        {t('pickdrop.return')} • {formatTime(service.return_time)}
                      </Text>
                    </View>
                  )}

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
                      <View style={[styles.seatsTag, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.48)', borderWidth: 1, borderColor: isDark ? 'rgba(252, 211, 77, 0.18)' : 'rgba(245, 158, 11, 0.14)' }]}>
                        <Icon name="people-outline" size={14} color={isDark ? '#ffb74d' : '#f57c00'} />
                        <Text style={[styles.seatsTagText, { color: isDark ? '#ffb74d' : '#f57c00' }]}>
                          {t('pickdrop.seatsLeft', { count: availableSpaces })}
                        </Text>
                      </View>
                    );
                  })()}

                  {/* Driver Gender Tag */}
                  {service.driver_gender && (
                    <View style={[styles.driverGenderTag, {
                      backgroundColor: service.driver_gender === 'female'
                        ? (isDark ? 'rgba(233, 30, 99, 0.18)' : 'rgba(255, 255, 255, 0.48)')
                        : (isDark ? 'rgba(33, 150, 243, 0.18)' : 'rgba(255, 255, 255, 0.48)'),
                      borderWidth: 1,
                      borderColor: service.driver_gender === 'female'
                        ? (isDark ? 'rgba(244, 143, 177, 0.18)' : 'rgba(233, 30, 99, 0.14)')
                        : (isDark ? 'rgba(144, 202, 249, 0.18)' : 'rgba(33, 150, 243, 0.14)'),
                    }]}>
                      <Text style={[styles.driverGenderText, {
                        color: service.driver_gender === 'female'
                          ? (isDark ? '#f48fb1' : '#e91e63')
                          : (isDark ? '#90caf9' : '#2196f3')
                      }]}>
                        {service.driver_gender === 'female'
                          ? `👩 ${t('pickDropDetail.femaleDriver')}`
                          : `👨 ${t('pickDropDetail.maleDriver')}`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Vehicle Info */}
                {service.car && (
                  <View style={styles.vehicleSection}>
                    <Text style={[styles.vehicleLabel, { color: theme.colors.textLight }]}>VEHICLE</Text>
                    <View style={styles.vehicleRow}>
                      <Icon name="directions-car" size={16} color={isDark ? '#ff8a80' : '#FF5252'} />
                      <Text style={[styles.vehicleText, { color: theme.colors.text }]}>
                        {service.car.name || service.car} <Text style={{ color: theme.colors.textSecondary }}>{service.car.color ? `(${service.car.color})` : ''}</Text>
                      </Text>
                    </View>
                  </View>
                )}

                {/* Divider */}
                <View style={[styles.cardDivider, { backgroundColor: theme.colors.border }]} />

                {/* Footer: Driver & Action */}
                <View style={styles.cardFooter}>
                  {(() => {
                    const provider = service.user || service.provider || service.owner || service.created_by || null;
                    const providerName =
                      provider?.name ||
                      provider?.user?.name ||
                      service.driver?.name ||
                      service.driver ||
                      service.name ||
                      service.contact_name ||
                      t('pickDropDetail.user');
                    const phone =
                      provider?.phone_number ||
                      provider?.phone ||
                      service.contact_number ||
                      service.contact_phone ||
                      service.phone ||
                      null;
                    const providerCity =
                      provider?.city?.name ||
                      provider?.city?.city ||
                      provider?.city_name ||
                      provider?.city ||
                      provider?.user?.city?.name ||
                      provider?.user?.city?.city ||
                      provider?.user?.city_name ||
                      provider?.user?.city ||
                      service.city?.name ||
                      service.city_name ||
                      service.city ||
                      null;
                    const providerImage =
                      provider?.profile_image ||
                      provider?.profileImage ||
                      provider?.avatar ||
                      provider?.image ||
                      provider?.photo ||
                      provider?.image_url ||
                      provider?.imageUrl ||
                      provider?.photo_url ||
                      provider?.photoUrl ||
                      provider?.user?.profile_image ||
                      provider?.user?.profileImage ||
                      provider?.user?.avatar ||
                      provider?.user?.image ||
                      provider?.user?.photo ||
                      provider?.user?.image_url ||
                      provider?.user?.imageUrl ||
                      service.driver?.profile_image ||
                      service.driver?.avatar ||
                      service.driver?.image ||
                      service.driver?.photo ||
                      service.user_profile_image ||
                      service.userProfileImage ||
                      service.profile_image ||
                      service.profileImage ||
                      service.owner_profile_image ||
                      service.ownerProfileImage ||
                      service.provider_image ||
                      service.providerImage ||
                      null;

                    return (
                      <View style={styles.driverInfo}>
                        {user ? (
                          <>
                            <View style={[styles.driverAvatar, glassChipStyle, { borderWidth: 1 }]}>
                              {providerImage ? (
                                <Image
                                  source={{ uri: providerImage }}
                                  style={styles.driverAvatarImage}
                                />
                              ) : (
                                <Text style={[styles.driverInitials, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                                  {providerName.charAt(0).toUpperCase()}
                                </Text>
                              )}
                            </View>
                            <View>
                              <Text style={[styles.driverName, { color: theme.colors.text }]}>
                                {providerName}
                              </Text>
                              {phone ? (
                                <Text style={[styles.driverPhone, { color: theme.colors.textSecondary }]}>{phone}</Text>
                              ) : null}
                              {providerCity ? (
                                <Text style={[styles.driverPhone, { color: theme.colors.textSecondary }]}>{providerCity}</Text>
                              ) : null}
                            </View>
                          </>
                        ) : (
                          <>
                            <View style={[styles.driverAvatar, glassChipStyle, { borderWidth: 1 }]}>
                              <Icon name="lock-outline" size={18} color={isDark ? '#c77dba' : theme.colors.primary} />
                            </View>
                            <View>
                              <Text style={[styles.driverName, { color: theme.colors.text }]}>
                                {t('pickDropDetail.user')}
                              </Text>
                              <Text style={[styles.driverPhone, { color: theme.colors.textSecondary }]}>
                                {t('pickDropDetail.loginToContact')}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    );
                  })()}

                  <TouchableOpacity
                    style={[styles.viewDetailsButtonSmall, { backgroundColor: theme.colors.primary }]}
                    onPress={() => {
                      navigation.navigate('PickDropDetail', { serviceId: service.id, serviceData: service });
                    }}
                  >
                    <Text style={styles.viewDetailsText}>{t('common.viewDetails')}</Text>
                  </TouchableOpacity>
                </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="directions-car" size={64} color={theme.colors.textLight} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('pickdrop.noServicesFound')}</Text>
          </View>
        )}

      </ScrollView>

      {/* Pagination Controls */}
      {!loading && services.length > 0 && (
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
                setCurrentPage(currentPage - 1);
              }
            }}
            disabled={currentPage === 1}
          >
            <Icon name="chevron-left" size={20} color={currentPage === 1 ? theme.colors.textLight : theme.colors.text} />
            <Text style={[styles.paginationButtonText, { color: currentPage === 1 ? theme.colors.textLight : theme.colors.text }]}>{t('common.back')}</Text>
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
                setCurrentPage(currentPage + 1);
              }
            }}
            disabled={currentPage >= totalPages}
          >
            <Text style={[styles.paginationButtonText, { color: currentPage >= totalPages ? theme.colors.textLight : theme.colors.text }]}>{t('common.next')}</Text>
            <Icon name="chevron-right" size={20} color={currentPage >= totalPages ? theme.colors.textLight : theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {!loading && services.length > 0 && !user && (
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
          <Text style={styles.loginButtonText}>{t('common.login')}</Text>
        </TouchableOpacity>
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
    color: '#ffffff',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#b0b0b0',
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
  themeToggleButton: {
    padding: 4,
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
    fontWeight: '700',
    fontSize: 14,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  addServiceButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Match Rental Cars filter layout
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#d0d0d0',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999999',
  },
  servicesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
    marginHorizontal: 0,
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
    marginBottom: 0,
  },
  timelineDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C853', // Green for start
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
    minHeight: 55,
    justifyContent: 'center',
    position: 'relative',
  },
  timelineLineContainerCompact: {
    minHeight: 26,
  },
  timelineLine: {
    // handled by container border
  },
  stopsTag: {
    position: 'absolute',
    left: -2,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  stopsTagText: {
    fontSize: 11,
    marginRight: 2,
    fontWeight: '600',
  },
  priceRow: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  priceContainer: {
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
  },
  priceLabel: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  scheduleTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  seatsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  seatsTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  driverGenderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  driverGenderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleSection: {
    marginBottom: 16,
  },
  vehicleLabel: {
    fontSize: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
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
    marginVertical: 10,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  driverAvatarImage: {
    width: '100%',
    height: '100%',
  },
  driverInitials: {
    fontSize: 17,
    fontWeight: '700',
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewDetailsText: {
    color: '#ffffff',
    fontSize: 13,
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
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
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
});

export default PickDropScreen;
