import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { carAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';

const CarDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { carId } = route.params;
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Booking form state
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [notes, setNotes] = useState('');
  const [numberOfDays, setNumberOfDays] = useState('1');
  const [bookAsGuest, setBookAsGuest] = useState(false);
  
  // Inquiry form state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  useEffect(() => {
    loadCarDetails();
  }, [carId]);

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      const data = await carAPI.getCarById(carId);
      setCar(data.data || data);
    } catch (error) {
      console.error('Error loading car details:', error);
      setErrorMessage('Failed to load car details');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format price
  const formatPrice = (pricePerDay, price) => {
    let priceValue = '0';
    let currency = 'PKR';
    
    if (pricePerDay) {
      if (typeof pricePerDay === 'object') {
        if (pricePerDay.perDay) {
          if (typeof pricePerDay.perDay === 'object') {
            priceValue = pricePerDay.perDay.withDriver || pricePerDay.perDay.withoutDriver || pricePerDay.perDay.value || '0';
            currency = pricePerDay.perDay.currency || pricePerDay.currency || 'PKR';
          } else {
            priceValue = pricePerDay.perDay;
          }
        } else {
          priceValue = pricePerDay.value || pricePerDay.amount || '0';
          currency = pricePerDay.currency || 'PKR';
        }
      } else {
        priceValue = pricePerDay;
      }
    } else if (price) {
      if (typeof price === 'object') {
        if (price.perDay) {
          if (typeof price.perDay === 'object') {
            priceValue = price.perDay.withDriver || price.perDay.withoutDriver || price.perDay.value || '0';
            currency = price.perDay.currency || price.currency || 'PKR';
          } else {
            priceValue = price.perDay;
          }
        } else {
          priceValue = price.value || price.amount || '0';
          currency = price.currency || 'PKR';
        }
      } else {
        priceValue = price;
      }
    }
    
    return { priceValue, currency };
  };

  // Helper function to get car image URL
  const getCarImageUrl = (car) => {
    if (car.image) {
      if (car.image.startsWith('http://') || car.image.startsWith('https://')) {
        return car.image;
      }
      if (car.image.startsWith('/')) {
        return `https://asaancar.com${car.image}`;
      }
      return `https://asaancar.com/${car.image}`;
    }
    return 'https://via.placeholder.com/400x300?text=Car+Image';
  };

  const calculateTotal = () => {
    const { priceValue } = formatPrice(car?.pricePerDay, car?.price);
    const days = parseInt(numberOfDays) || 1;
    const price = parseFloat(priceValue) || 0;
    return (price * days).toFixed(2);
  };

  const handleBookAsGuest = () => {
    if (!pickupAddress || !pickupDate || !pickupTime) {
      setErrorMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }
    // TODO: Implement booking API call
    console.log('Book as guest:', { pickupAddress, pickupDate, pickupTime, notes, numberOfDays });
  };

  const handleLoginToBook = () => {
    navigation.navigate('Login');
  };

  const handleSendInquiry = () => {
    if (!inquiryName || !inquiryContact || !inquiryMessage) {
      setErrorMessage('Please fill in all inquiry fields');
      setShowErrorModal(true);
      return;
    }
    // TODO: Implement inquiry API call
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.errorText}>Car not found</Text>
      </View>
    );
  }

  const { priceValue, currency } = formatPrice(car.pricePerDay, car.price);
  const totalAmount = calculateTotal();
  const carName = `${car.brand?.name || 'Brand'} ${car.name || 'Car Name'}`;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}>
      <View style={styles.contentContainer}>
        {/* Left Panel */}
        <View style={styles.leftPanel}>
          {/* Car Image */}
          <View style={[styles.imageContainer, { backgroundColor: theme.colors.border }]}>
            <Image
              source={{ uri: getCarImageUrl(car) }}
              style={styles.carImage}
              resizeMode="contain"
            />
          </View>

          {/* Car Name */}
          <Text style={[styles.carName, { color: theme.colors.primary }]}>
            {carName}
          </Text>

          {/* Rate Details */}
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Rate Details</Text>
            <View style={[styles.rateTable, { borderColor: theme.colors.border }]}>
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.backgroundSecondary, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
                  Hours/Day
                </Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
                  Amount
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { color: theme.colors.text }]}>
                  10 hrs/day
                </Text>
                <Text style={[styles.tableCell, { color: theme.colors.text }]}>
                  {currency} {priceValue}
                </Text>
              </View>
            </View>
          </View>

          {/* Additional Terms and Conditions */}
          <View style={[styles.infoCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
            <Icon name="info" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Additional terms and conditions including fuel charges, overtime rates, and other service details will be discussed verbally with the store owner upon booking confirmation. Please contact the store directly for any specific requirements or questions.
            </Text>
          </View>

          {/* Store Information */}
          {car.store && (
            <TouchableOpacity
              style={[styles.card, styles.clickableCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
              onPress={() => {
                const storeId = car.store?.id || car.store_id;
                if (storeId) {
                  navigation.navigate('StoreProfile', { storeId });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.storeHeader}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Store Information
                </Text>
                <Icon name="chevron-right" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.storeName, { color: theme.colors.primary }]}>
                {car.store.name || 'Store Name'}
              </Text>
              <Text style={[styles.storeDescription, { color: theme.colors.textSecondary }]}>
                {car.store.description || 'Professional car rental and transport services'}
              </Text>
              
              {car.store.address && (
                <View style={styles.storeInfoRow}>
                  <Icon name="location-on" size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.storeInfoText, { color: theme.colors.textSecondary }]}>
                    {car.store.address}
                  </Text>
                </View>
              )}
              
              {car.store.phone && (
                <View style={styles.storeInfoRow}>
                  <Icon name="phone" size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.storeInfoText, { color: theme.colors.textSecondary }]}>
                    {car.store.phone}
                  </Text>
                </View>
              )}
              
              {car.store.rating && (
                <View style={styles.storeInfoRow}>
                  <Icon name="star" size={18} color="#ffa500" />
                  <Text style={[styles.storeInfoText, { color: theme.colors.textSecondary }]}>
                    {car.store.rating}/5 ({car.store.reviews || 0} reviews)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Right Panel */}
        <View style={styles.rightPanel}>
          {/* Pick-up & Drop-off Details */}
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Pick-up & Drop-off Details
            </Text>

            {/* Pick-up Detail */}
            <View style={styles.pickupSection}>
              <View style={styles.sectionHeader}>
                <Icon name="location-on" size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Pick-up Detail
                </Text>
              </View>

              <View style={[styles.inputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Pick-up address"
                  placeholderTextColor={theme.colors.placeholder}
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                />
                <Icon name="location-on" size={20} color={theme.colors.textSecondary} />
              </View>

              <View style={[styles.inputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
                <Icon name="access-time" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="--:-- --"
                  placeholderTextColor={theme.colors.placeholder}
                  value={pickupTime}
                  onChangeText={setPickupTime}
                />
                <Icon name="access-time" size={20} color={theme.colors.textSecondary} />
              </View>

              <View style={[styles.inputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
                <Icon name="calendar-today" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="dd.mm.yyyy"
                  placeholderTextColor={theme.colors.placeholder}
                  value={pickupDate}
                  onChangeText={setPickupDate}
                />
                <Icon name="calendar-today" size={20} color={theme.colors.textSecondary} />
              </View>

              <View style={[styles.textAreaContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
                <TextInput
                  style={[styles.textArea, { color: theme.colors.text }]}
                  placeholder="Notes (optional)"
                  placeholderTextColor={theme.colors.placeholder}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* No. of Days */}
            <View style={styles.daysSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>No. of Days</Text>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={numberOfDays}
                  onChangeText={setNumberOfDays}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Total Amount */}
          <View style={[styles.totalCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
              {currency} {totalAmount}
            </Text>
          </View>

          {/* Booking Options */}
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setBookAsGuest(!bookAsGuest)}
            >
              <View style={[
                styles.checkbox,
                { borderColor: theme.colors.primary },
                bookAsGuest && { backgroundColor: theme.colors.primary }
              ]}>
                {bookAsGuest && (
                  <Icon name="check" size={16} color="#fff" />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
                Book as guest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bookButton, { backgroundColor: theme.colors.primary + '80' }]}
              onPress={handleBookAsGuest}
            >
              <Text style={styles.bookButtonText}>Book as Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleLoginToBook}
            >
              <Text style={styles.loginButtonText}>Please Login to Book</Text>
            </TouchableOpacity>
          </View>

          {/* Send an Inquiry */}
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Send an Inquiry to Store Owner
            </Text>

            <View style={[styles.inputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Your Name"
                placeholderTextColor={theme.colors.placeholder}
                value={inquiryName}
                onChangeText={setInquiryName}
              />
              <Icon name="lock" size={16} color={theme.colors.textSecondary} />
            </View>

            <View style={[styles.inputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Phone Number"
                placeholderTextColor={theme.colors.placeholder}
                value={inquiryContact}
                onChangeText={(text) => {
                  // Only allow numeric characters
                  const numericText = text.replace(/[^0-9+]/g, '');
                  setInquiryContact(numericText);
                }}
                keyboardType="phone-pad"
              />
              <Icon name="lock" size={16} color={theme.colors.textSecondary} />
            </View>

            <View style={[styles.textAreaContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
              <TextInput
                style={[styles.textArea, { color: theme.colors.text }]}
                placeholder="Your Message"
                placeholderTextColor={theme.colors.placeholder}
                value={inquiryMessage}
                onChangeText={setInquiryMessage}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.inquiryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSendInquiry}
            >
              <Text style={styles.inquiryButtonText}>Send Inquiry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </ScrollView>
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
  contentContainer: {
    flexDirection: 'column',
    padding: 16,
    gap: 16,
  },
  leftPanel: {
    width: '100%',
    gap: 16,
  },
  rightPanel: {
    width: '100%',
    gap: 16,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
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
  clickableCard: {
    // borderWidth and borderColor applied dynamically
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  rateTable: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  storeDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  storeInfoText: {
    flex: 1,
    fontSize: 14,
  },
  pickupSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    minHeight: 100,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  daysSection: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  totalCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  bookButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inquiryButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  inquiryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 64,
  },
});

export default CarDetailScreen;
