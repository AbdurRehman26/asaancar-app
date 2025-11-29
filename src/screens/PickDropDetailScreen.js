import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { pickDropAPI } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '../components/ErrorModal';

const PickDropDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { serviceId } = route.params;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedStops, setExpandedStops] = useState(false);

  useEffect(() => {
    loadServiceDetails();
  }, [serviceId]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);
      // TODO: Implement getServiceById API call
      // const data = await pickDropAPI.getServiceById(serviceId);
      // setService(data.data || data);
      
      // For now, use mock data structure
      setService({
        id: serviceId,
        start_location: 'North Nazimabad - Block C',
        end_location: 'Al-Jadeed Greens',
        city: 'Karachi',
        driver: { name: 'Syed Abdul Rehman' },
        driver_gender: 'male',
        schedule: 'Everyday at 9:50 AM',
        available_seats: 1,
        price: { perPerson: 1495.00, currency: 'PKR' },
        car: {
          brand: 'Changan',
          model: 'Altis',
          color: 'Green',
          seats: 7,
          transmission: 'Automatic',
          fuel_type: 'Hybrid',
        },
        stops: [
          { location: 'Gulistan-e-Zafar', stop_time: '10:47 AM' },
        ],
        description: 'Well-maintained car with experienced driver. Safe and timely journey.',
      });
    } catch (error) {
      console.error('Error loading service details:', error);
      setErrorMessage('Failed to load service details');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
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
            <Text style={styles.bannerTitle}>
              {startLocation} → {endLocation}
            </Text>
            <Text style={styles.bannerSubtitle}>{city} to {city}</Text>
            <Text style={styles.bannerRoute}>{startLocation} → {endLocation}</Text>
          </View>
          {service.driver_gender && (
            <View style={styles.driverGenderBadge}>
              <Text style={styles.driverGenderEmoji}>
                {service.driver_gender === 'female' ? '♀' : '♂'}
              </Text>
              <Text style={styles.driverGenderText}>
                {service.driver_gender === 'female' ? 'Female' : 'Male'} Driver
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          {/* Left Column - Main Content */}
          <View style={styles.mainContent}>
            {/* Route Details Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
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
                <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
                  {city}
                </Text>
                <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
                  Area: {startLocation}
                </Text>
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
                <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
                  {city}
                </Text>
                <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
                  Area: {endLocation}
                </Text>
              </View>
            </View>

            {/* Service Details Card */}
            <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
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
                  {service.schedule || 'N/A'}
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
                  {service.available_seats || service.availableSeats || 0} space
                  {service.available_seats !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                  Price Per Person:
                </Text>
                <Text style={[styles.priceText, { color: theme.colors.primary }]}>
                  PKR {typeof service.price === 'object' 
                    ? service.price.perPerson || service.price.amount || '0' 
                    : service.price || '0'}
                </Text>
              </View>
            </View>

            {/* Car Information Card */}
            {service.car && (
              <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
                <View style={styles.cardHeader}>
                  <Icon name="directions-car" size={20} color={theme.colors.primary} />
                  <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                    Car Information
                  </Text>
                </View>

                <View style={styles.carInfoGrid}>
                  <View style={styles.carInfoItem}>
                    <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                      Brand:
                    </Text>
                    <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                      {service.car.brand || service.car.name || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.carInfoItem}>
                    <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                      Model:
                    </Text>
                    <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                      {service.car.model || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.carInfoItem}>
                    <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                      Color:
                    </Text>
                    <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                      {service.car.color || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.carInfoItem}>
                    <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                      Seats:
                    </Text>
                    <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                      {service.car.seats || service.seats || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.carInfoItem}>
                    <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                      Transmission:
                    </Text>
                    <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                      {service.car.transmission || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.carInfoItem}>
                    <Text style={[styles.carInfoLabel, { color: theme.colors.textSecondary }]}>
                      Fuel Type:
                    </Text>
                    <Text style={[styles.carInfoValue, { color: theme.colors.text }]}>
                      {service.car.fuel_type || service.car.fuelType || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Description Card */}
            {service.description && (
              <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
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
            <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
              <View style={styles.cardHeader}>
                <Icon name="person" size={20} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                  Service Provider
                </Text>
              </View>
              <Text style={[styles.providerName, { color: theme.colors.text }]}>
                {service.driver?.name || service.driver || 'N/A'}
              </Text>
              {!user && (
                <Text style={[styles.contactHint, { color: theme.colors.textSecondary }]}>
                  Please log in to view contact information
                </Text>
              )}
            </View>

            {/* Contact Service Provider Card */}
            {!user && (
              <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
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
    </View>
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
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  bannerRoute: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  driverGenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
    borderBottomColor: '#f0f0f0',
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

