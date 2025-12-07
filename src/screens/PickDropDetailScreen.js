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
          {/* Left Column - Main Content */}
          <View style={styles.mainContent}>
            {/* Route Details Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={styles.cardHeader}>
                <Icon name="send" size={20} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                  Route Details
                </Text>
              </View>

              {/* Pickup Location */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="location-on" size={20} color={theme.colors.secondary} />
                  <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                    Pickup Location
                  </Text>
                </View>
                <Text style={[styles.boldText, { color: theme.colors.text }]}>
                  {startLocation}
                </Text>
                {city && city !== 'City' && city.toLowerCase() !== 'karachi' && (
                  <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
                    {city}
                  </Text>
                )}
              </View>

              {/* Stops */}
              {service.stops && service.stops.length > 0 && (
                <View style={styles.section}>
                  <TouchableOpacity
                    style={styles.stopsHeader}
                    onPress={() => setExpandedStops(!expandedStops)}
                  >
                    <View style={styles.sectionHeader}>
                      <Icon name="schedule" size={20} color={theme.colors.textSecondary} />
                      <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                        Stops ({service.stops.length})
                      </Text>
                    </View>
                    <Icon
                      name={expandedStops ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                  {expandedStops && (
                    <View style={styles.stopsList}>
                      {service.stops.map((stop, index) => {
                        const stopName = stop.location || stop.name || stop.area?.name || stop.city?.name || 'Stop';
                        const stopTime = stop.stop_time || stop.time || '';
                        return (
                          <View key={stop.id || index} style={styles.stopItem}>
                            <View style={[styles.stopDot, { backgroundColor: theme.colors.primary }]} />
                            <View style={styles.stopContent}>
                              <Text style={[styles.boldText, { color: theme.colors.text }]}>
                                {stopName}
                              </Text>
                              {stopTime && (
                                <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
                                  {stopTime}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* Dropoff Location */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="place" size={20} color="#ff4444" />
                  <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                    Dropoff Location
                  </Text>
                </View>
                <Text style={[styles.boldText, { color: theme.colors.text }]}>
                  {endLocation}
                </Text>
                {city && city !== 'City' && city.toLowerCase() !== 'karachi' && (
                  <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
                    {city}
                  </Text>
                )}
              </View>
            </View>

            {/* Service Details Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                Service Details
              </Text>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="calendar-today" size={20} color={theme.colors.textSecondary} />
                  <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                    Departure Time
                  </Text>
                </View>
                <Text style={[styles.boldText, { color: theme.colors.text }]}>
                  {(() => {
                    const departureTime = 
                      service.departure_time ||
                      service.departureTime ||
                      null;
                    const departureDate = 
                      service.departure_date ||
                      service.departureDate ||
                      null;
                    const isEveryday = 
                      service.is_everyday ||
                      service.everyday_service ||
                      service.everydayService ||
                      false;
                    
                    if (isEveryday) {
                      return departureTime ? `Everyday at ${departureTime}` : 'Everyday Service';
                    } else if (departureDate && departureTime) {
                      // Format date if needed
                      const date = new Date(departureDate);
                      const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                      return `${formattedDate} at ${departureTime}`;
                    } else if (departureTime) {
                      return departureTime;
                    } else if (departureDate) {
                      const date = new Date(departureDate);
                      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    }
                    
                    return service.schedule || 'N/A';
                  })()}
                </Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="people" size={20} color={theme.colors.textSecondary} />
                  <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                    Available Spaces
                  </Text>
                </View>
                <Text style={[styles.boldText, { color: theme.colors.text }]}>
                  {(() => {
                    const availableSpaces = 
                      service.available_spaces ||
                      service.availableSpaces ||
                      service.available_seats ||
                      service.availableSeats ||
                      0;
                    return `${availableSpaces} space${availableSpaces !== 1 ? 's' : ''}`;
                  })()}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Price Per Person:
                </Text>
                <Text style={[styles.priceText, { color: theme.colors.primary }]}>
                  {(() => {
                    const price = 
                      service.price_per_person ||
                      service.pricePerPerson ||
                      (service.price && typeof service.price === 'object' ? service.price.perPerson || service.price.amount : null) ||
                      service.price ||
                      '0';
                    const currency = service.currency || 'PKR';
                    const formattedPrice = typeof price === 'number' ? price.toLocaleString() : price;
                    return `${currency} ${formattedPrice}`;
                  })()}
                </Text>
              </View>
            </View>

            {/* Car Information Card */}
            {(() => {
              const hasCarDetails = 
                service.car ||
                service.car_brand ||
                service.car_model ||
                service.car_color ||
                service.car_seats;
              
              if (!hasCarDetails) return null;
              
              return (
                <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Icon name="directions-car" size={20} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                      Car Information
                    </Text>
                  </View>

                  <View style={styles.carInfoGrid}>
                    {service.car && (
                      <View style={[styles.carInfoItem, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                          Car:
                        </Text>
                        <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                          {service.car}
                        </Text>
                      </View>
                    )}
                    {service.car_brand && (
                      <View style={[styles.carInfoItem, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                          Brand:
                        </Text>
                        <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                          {service.car_brand}
                        </Text>
                      </View>
                    )}
                    {service.car_model && (
                      <View style={[styles.carInfoItem, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                          Model:
                        </Text>
                        <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                          {service.car_model}
                        </Text>
                      </View>
                    )}
                    {service.car_color && (
                      <View style={[styles.carInfoItem, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                          Color:
                        </Text>
                        <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                          {service.car_color}
                        </Text>
                      </View>
                    )}
                    {service.car_seats && (
                      <View style={[styles.carInfoItem, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                          Seats:
                        </Text>
                        <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                          {service.car_seats}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* Description Card */}
            {service.description && (
              <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                  Description
                </Text>
                <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
                  {service.description}
                </Text>
              </View>
            )}
          </View>

          {/* Right Sidebar */}
          <View style={styles.sidebar}>
            {/* Service Provider Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={styles.cardHeader}>
                <Icon name="person" size={20} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                  Service Provider
                </Text>
              </View>
              <Text style={[styles.providerName, { color: theme.colors.text }]}>
                {provider?.name || 
                 provider?.user?.name || 
                 provider?.username ||
                 service.driver?.name || 
                 service.driver || 
                 service.user?.name ||
                 service.provider?.name ||
                 'N/A'}
              </Text>

              {/* Call / In-App Chat / WhatsApp icon buttons - always show */}
              <View style={styles.contactButtonsRow}>
                {/* Call Button */}
                <TouchableOpacity
                  style={[styles.contactIconButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    if (!user) {
                      navigation.navigate('Login');
                    } else if (providerPhone) {
                      handleCallProvider();
                    } else {
                      setErrorMessage('Phone number not available');
                      setShowErrorModal(true);
                    }
                  }}
                >
                  <Icon name="call" size={20} color="#fff" />
                </TouchableOpacity>
                
                {/* In-App Chat Button */}
                <TouchableOpacity
                  style={[styles.contactIconButton, { backgroundColor: theme.colors.secondary }]}
                  onPress={() => {
                    if (!user) {
                      navigation.navigate('Login');
                    } else if (provider?.id || provider?.user_id) {
                      const providerUserId = provider.id || provider.user_id;
                      const providerName = provider.name || provider.user?.name || service.driver?.name || service.driver || 'Provider';
                      navigation.navigate('Chat', {
                        userId: providerUserId,
                        userName: providerName,
                        type: 'pick_and_drop',
                        serviceId: service.id || serviceId,
                      });
                    } else {
                      setErrorMessage('Provider information not available');
                      setShowErrorModal(true);
                    }
                  }}
                >
                  <Icon name="forum" size={20} color="#fff" />
                </TouchableOpacity>
                
                {/* WhatsApp Button */}
                <TouchableOpacity
                  style={[styles.contactIconButton, { backgroundColor: '#25D366' }]}
                  onPress={() => {
                    if (!user) {
                      navigation.navigate('Login');
                    } else if (providerWhatsApp) {
                      handleMessageProvider();
                    } else {
                      setErrorMessage('WhatsApp number not available');
                      setShowErrorModal(true);
                    }
                  }}
                >
                  <FontAwesome name="whatsapp" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Contact Service Provider Card for guests */}
            {!user && (
              <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                  Please login to contact the service provider
                </Text>
                <TouchableOpacity
                  style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signUpButton, { borderColor: theme.colors.primary }]}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={[styles.signUpButtonText, { color: theme.colors.primary }]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerBanner: {
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerContent: {
    flex: 1,
  },
  bannerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  bannerRoute: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
  },
  driverGenderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  driverGenderEmoji: {
    fontSize: 16,
  },
  driverGenderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  contentContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    gap: 16,
  },
  mainContent: {
    width: '100%',
    gap: 16,
  },
  sidebar: {
    width: '100%',
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  boldText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    marginBottom: 2,
  },
  stopsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopsList: {
    marginTop: 12,
    marginLeft: 28,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 6,
  },
  stopContent: {
    flex: 1,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  carInfoGrid: {
    gap: 12,
  },
  carInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  carInfoLabel: {
    fontSize: 14,
    flex: 1,
  },
  carInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactHint: {
    fontSize: 12,
    marginTop: 4,
  },
  contactText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  contactIconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default PickDropDetailScreen;

