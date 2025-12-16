import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { pickDropAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ErrorModal from '@/components/ErrorModal';

const PickDropDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { serviceId, serviceData } = route.params || {};
  const [service, setService] = useState(serviceData || null);
  const [loading, setLoading] = useState(!serviceData);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedStops, setExpandedStops] = useState(false);

  useEffect(() => {
    // Only fetch if we don't have service data passed from listing
    if (!serviceData && serviceId) {
      loadServiceDetails();
    }
  }, [serviceId, serviceData]);

  // Debug: Log the service and provider to see the structure
  useEffect(() => {
    if (service) {
      const provider =
        service.user ||
        service.provider ||
        service.owner ||
        service.created_by ||
        null;
    }
  }, [service]);

  useEffect(() => {
    // Only fetch if we don't have service data passed from listing
    if (!serviceData && serviceId) {
      loadServiceDetails();
    }
  }, [serviceId, serviceData]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);

      // Fetch service details from API
      const data = await pickDropAPI.getPickDropService(serviceId);

      // Handle different response structures
      let serviceData = null;
      if (data) {
        if (data.data) {
          serviceData = data.data;
        } else if (Array.isArray(data) && data.length > 0) {
          serviceData = data[0];
        } else {
          serviceData = data;
        }
      }

      if (serviceData) {
        setService(serviceData);
      } else {
        setErrorMessage('Service not found');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error loading service details:', error);
      setErrorMessage(
        error.response?.data?.message ||
        error.message ||
        'Failed to load service details. Please try again.'
      );
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have service data passed from listing
    if (!serviceData && serviceId) {
      loadServiceDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.errorText}>Service not found</Text>
      </View>
    );
  }

  const startLocation = service.start_location || service.startLocation || 'Start Location';
  const endLocation = service.end_location || service.endLocation || 'End Location';
  const city = service.city || 'City';

  const provider =
    service.user ||
    service.provider ||
    service.owner ||
    service.created_by ||
    null;

  const providerPhone =
    provider?.phone_number ||
    provider?.phone ||
    provider?.contact_number ||
    provider?.mobile ||
    provider?.mobile_number ||
    service.contact_phone ||
    service.phone ||
    service.phone_number ||
    service.contact_number ||
    null;

  const providerWhatsApp =
    provider?.whatsapp_number ||
    provider?.whatsapp ||
    provider?.contact_whatsapp ||
    provider?.whatsapp_contact ||
    service.whatsapp_number ||
    service.whatsapp ||
    service.contact_whatsapp ||
    providerPhone ||
    null;

  const handleCallProvider = () => {
    if (!providerPhone) return;
    const phoneUrl = `tel:${providerPhone}`;
    Linking.openURL(phoneUrl).catch(() => {
      setErrorMessage('Unable to open phone dialer on this device.');
      setShowErrorModal(true);
    });
  };

  const handleMessageProvider = () => {
    if (!providerWhatsApp) return;
    const numericWhatsApp = providerWhatsApp.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${numericWhatsApp}`;
    Linking.openURL(whatsappUrl).catch(() => {
      const smsUrl = `sms:${providerWhatsApp}`;
      Linking.openURL(smsUrl).catch(() => {
        setErrorMessage('Unable to open messaging app on this device.');
        setShowErrorModal(true);
      });
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('PickDrop')}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
          <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
            Back to Listing
          </Text>
        </TouchableOpacity>

        {/* Header Banner */}
        <View style={[styles.headerBanner, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerLocationRow}>
              <Icon name="location-on" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.bannerTitle}>
                {startLocation}
              </Text>
            </View>
            <View style={styles.bannerLocationRow}>
              <Icon name="send" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.bannerRoute}>
                {endLocation}
              </Text>
            </View>
            {service.driver_gender && (
              <View style={styles.driverGenderTag}>
                <Text style={styles.driverGenderEmoji}>
                  {service.driver_gender === 'female' ? '♀' : '♂'}
                </Text>
                <Text style={styles.driverGenderText}>
                  {service.driver_gender === 'female' ? 'Female' : 'Male'} Driver
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentContainer}>

          {/* 1. Route Section - Spacious Timeline */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>ROUTE DETAILS</Text>
            <View style={[styles.card, styles.routeCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>

              {/* Start Location */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.largeDotGreen, { backgroundColor: theme.colors.primary, borderColor: theme.colors.cardBackground }]} />
                  <View style={[styles.verticalLineFull, { backgroundColor: theme.colors.border }]} />
                </View>
                <View style={styles.locationContent}>
                  <Text style={[styles.largeLocationLabel, { color: theme.colors.textSecondary }]}>Pick Up</Text>
                  <Text style={[styles.largeLocationTitle, { color: theme.colors.text }]}>
                    {startLocation}
                  </Text>
                </View>
              </View>

              {/* Stops */}
              {service.stops && service.stops.length > 0 && (
                <View style={styles.stopsContainer}>
                  <View style={styles.timelineColumn}>
                    <View style={[styles.verticalLineFull, { backgroundColor: theme.colors.border }]} />
                  </View>
                  <View style={styles.stopsListContent}>
                    <View style={[styles.stopsBadge, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      <Text style={[styles.stopsBadgeText, { color: theme.colors.primary }]}>{service.stops.length} Stops</Text>
                    </View>
                    {service.stops.map((stop, index) => (
                      <View key={index} style={styles.stopRow}>
                        <View style={[styles.stopDot, { backgroundColor: theme.colors.textSecondary }]} />
                        <Text style={[styles.stopText, { color: theme.colors.textSecondary }]}>
                          {stop.location || stop.name || 'Stop'}
                          {stop.time ? ` (${stop.time})` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* End Location */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.verticalLineTop, { backgroundColor: theme.colors.border }]} />
                  <Icon name="location-pin" size={24} color={theme.colors.secondary} style={{ marginLeft: -12 }} />
                </View>
                <View style={styles.locationContent}>
                  <Text style={[styles.largeLocationLabel, { color: theme.colors.textSecondary }]}>Drop Off</Text>
                  <Text style={[styles.largeLocationTitle, { color: theme.colors.text }]}>
                    {endLocation}
                  </Text>
                </View>
              </View>

            </View>
          </View>

          {/* 2. Trip Information - Grid Layout */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>TRIP INFORMATION</Text>
            <View style={styles.gridContainer}>

              {/* Price Item */}
              <View style={[styles.gridItem, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary }]}>
                  <Icon name="attach-money" size={24} color="#fff" />
                </View>
                <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>Price Per Person</Text>
                <Text style={[styles.gridValueLarge, { color: theme.colors.text }]}>
                  {(() => {
                    const price =
                      service.price_per_person ||
                      service.pricePerPerson ||
                      (service.price && typeof service.price === 'object' ? service.price.perPerson || service.price.amount : null) ||
                      service.price || '0';
                    const currency = service.currency || 'PKR';
                    const formattedPrice = typeof price === 'number' ? price.toLocaleString() : price;
                    return `${currency}\n${formattedPrice}`;
                  })()}
                </Text>
              </View>

              {/* Schedule Item */}
              <View style={[styles.gridItem, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.secondary }]}>
                  <Icon name="access-time" size={24} color="#fff" />
                </View>
                <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>Schedule</Text>
                <Text style={[styles.gridValue, { color: theme.colors.text }]}>
                  {(() => {
                    const { schedule_type, selected_days, departure_date, departure_time, is_everyday, everyday_service } = service;
                    let displaySchedule = '';
                    let displayTime = departure_time || '';

                    if (schedule_type) {
                      switch (schedule_type.toLowerCase()) {
                        case 'everyday':
                          displaySchedule = 'Everyday';
                          break;
                        case 'weekday':
                        case 'weekdays':
                          displaySchedule = 'Mon-Fri';
                          break;
                        case 'weekend':
                        case 'weekends':
                          displaySchedule = 'Sat-Sun';
                          break;
                        case 'custom':
                          displaySchedule = selected_days ? selected_days.replace(/,/g, ', ') : 'Custom Types';
                          break;
                        case 'once':
                          displaySchedule = departure_date ? new Date(departure_date).toLocaleDateString() : 'Once';
                          break;
                        default:
                          displaySchedule = schedule_type;
                      }
                    } else {
                      // Fallback
                      if (is_everyday || everyday_service) {
                        displaySchedule = 'Everyday';
                      } else if (departure_date) {
                        displaySchedule = new Date(departure_date).toLocaleDateString();
                      } else {
                        displaySchedule = 'Flexible';
                      }
                    }

                    return `${displaySchedule}${displayTime ? `\nat ${displayTime}` : ''}`;
                  })()}
                </Text>
              </View>

              {/* Seats Item */}
              <View style={[styles.gridItem, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Icon name="event-seat" size={24} color={theme.colors.text} />
                </View>
                <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>Available Seats</Text>
                <Text style={[styles.gridValueLarge, { color: theme.colors.text }]}>
                  {service.available_spaces || service.available_seats || 0}
                </Text>
              </View>

              {/* Gender Item */}
              <View style={[styles.gridItem, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: service.driver_gender === 'female' ? '#EC407A' : '#42A5F5' }]}>
                  <Icon name="person" size={24} color="#fff" />
                </View>
                <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>Driver Gender</Text>
                <Text style={[styles.gridValue, { color: theme.colors.text }]}>
                  {service.driver_gender === 'female' ? 'Female\nDriver' : 'Male\nDriver'}
                </Text>
              </View>

            </View>
          </View>

          {/* 3. Vehicle Information - List Card */}
          {service.car && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>VEHICLE DETAILS</Text>
              <View style={[styles.card, styles.vehicleCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <View style={styles.vehicleHeader}>
                  <View style={[styles.vehicleIconLarge, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Icon name="directions-car" size={40} color={theme.colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehicleTitleLarge, { color: theme.colors.text }]}>
                      {service.car.name || service.car}
                    </Text>
                    {service.car.color && (
                      <Text style={[styles.vehicleSubtitle, { color: theme.colors.textSecondary }]}>
                        {service.car.color} Color
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={[styles.vehicleDetailsRow, { backgroundColor: theme.colors.cardBackground }]}>
                  <View style={styles.vehicleDetailItem}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Brand</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{service.car_brand || 'N/A'}</Text>
                  </View>
                  <View style={styles.vehicleDetailItem}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Model</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{service.car_model || 'N/A'}</Text>
                  </View>
                  <View style={styles.vehicleDetailItem}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Total Seats</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{service.car_seats || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          {service.description && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>ADDITIONAL NOTES</Text>
              <View style={[styles.card, { padding: 16, backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <Text style={[styles.descriptionTextLarge, { color: theme.colors.text }]}>
                  {service.description}
                </Text>
              </View>
            </View>
          )}

          {/* 4. Service Provider - Large Profile */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>SERVICE PROVIDER</Text>
            <View style={[styles.card, styles.providerCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>

              <View style={styles.providerHeader}>
                <View style={[styles.providerAvatarXLarge, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Text style={[styles.providerInitialsXLarge, { color: theme.colors.textSecondary }]}>
                    {(provider?.name || provider?.user?.name || service.driver?.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.providerInfoCenter}>
                  <Text style={[styles.providerNameXLarge, { color: theme.colors.text }]}>
                    {provider?.name || provider?.user?.name || service.driver?.name || 'User'}
                  </Text>
                  <Text style={[styles.providerRole, { color: theme.colors.primary, backgroundColor: theme.colors.backgroundSecondary }]}>Verified Driver</Text>
                </View>
              </View>

              <View style={styles.providerActionsColumn}>
                {providerPhone && (
                  <TouchableOpacity style={[styles.actionBtnFull, { backgroundColor: theme.colors.primary }]} onPress={handleCallProvider}>
                    <Icon name="call" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Call Now</Text>
                  </TouchableOpacity>
                )}
                {providerWhatsApp && (
                  <TouchableOpacity style={[styles.actionBtnFull, { backgroundColor: '#25D366' }]} onPress={handleMessageProvider}>
                    <FontAwesome name="whatsapp" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                )}
                {(provider?.id || provider?.user_id) && (
                  <TouchableOpacity style={[styles.actionBtnFull, { backgroundColor: theme.colors.secondary }]} onPress={() => {
                    if (!user) {
                      navigation.navigate('Login');
                    } else {
                      const pId = provider.id || provider.user_id;
                      const pName = provider.name || provider.user?.name || service.driver?.name || 'Provider';
                      navigation.navigate('Chat', {
                        userId: pId,
                        userName: pName,
                        type: 'pick_and_drop',
                        serviceId: service.id
                      });
                    }
                  }}>
                    <Icon name="forum" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Chat in App</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!user && (
                <Text style={[styles.loginHint, { color: theme.colors.textSecondary }]}>Login to contact the driver</Text>
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    zIndex: 10,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerBanner: {
    display: 'none',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  routeCard: {
    padding: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineColumn: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  largeDotGreen: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    zIndex: 2,
  },
  verticalLineFull: {
    width: 2,
    flex: 1,
    minHeight: 40,
  },
  verticalLineTop: {
    width: 2,
    height: 12,
  },
  locationContent: {
    flex: 1,
    paddingBottom: 20,
  },
  largeLocationLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  largeLocationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  stopsContainer: {
    flexDirection: 'row',
  },
  stopsListContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stopsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  stopsBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  stopText: {
    fontSize: 14,
  },

  /* Grid Layout */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  gridValueLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Vehicle Card */
  vehicleCard: {
    padding: 0,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  vehicleIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleTitleLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 14,
  },
  divider: {
    height: 1,
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    padding: 20,
  },
  vehicleDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionTextLarge: {
    fontSize: 16,
    lineHeight: 24,
  },

  /* Provider Card */
  providerCard: {
    padding: 24,
    alignItems: 'center',
  },
  providerHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  providerAvatarXLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  providerInitialsXLarge: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  providerInfoCenter: {
    alignItems: 'center',
  },
  providerNameXLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerRole: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  providerActionsColumn: {
    width: '100%',
    gap: 12,
  },
  actionBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    gap: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginHint: {
    marginTop: 16,
    fontSize: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PickDropDetailScreen;

