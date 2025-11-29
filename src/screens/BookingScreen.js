import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { bookingAPI } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import LoginModal from '../components/LoginModal';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';

const BookingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { car } = route.params;
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [withDriver, setWithDriver] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
    }
  }, [user]);

  const handleBooking = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!pickupLocation || !dropoffLocation) {
      setErrorMessage('Please fill in pickup and dropoff locations');
      setShowErrorModal(true);
      return;
    }

    if (endDate <= startDate) {
      setErrorMessage('End date must be after start date');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        carId: car.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pickupLocation,
        dropoffLocation,
        withDriver,
      };

      await bookingAPI.createBooking(bookingData);
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Failed to create booking'
      );
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    const dailyPrice = car.pricePerDay || car.price || 0;
    return days * dailyPrice;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.carInfo}>
        <Text style={styles.carName}>
          {car.brand?.name || 'Brand'} {car.name || 'Car Name'}
        </Text>
        <Text style={styles.price}>
          PKR {car.pricePerDay || car.price || '0'}/day
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rental Period</Text>

        <View style={styles.dateRow}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Icon name="calendar-today" size={20} color="#85ea2d" />
              <Text style={styles.dateText}>
                {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowStartPicker(false);
                  }
                  if (selectedDate) {
                    setStartDate(selectedDate);
                    if (Platform.OS === 'ios') {
                      // Keep picker open on iOS
                    } else {
                      setShowStartPicker(false);
                    }
                  }
                }}
              />
            )}
            {Platform.OS === 'ios' && showStartPicker && (
              <View style={styles.iosPickerActions}>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(false)}
                  style={styles.pickerButton}
                >
                  <Text style={styles.pickerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>End Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Icon name="calendar-today" size={20} color="#85ea2d" />
              <Text style={styles.dateText}>
                {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={startDate}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowEndPicker(false);
                  }
                  if (selectedDate) {
                    setEndDate(selectedDate);
                    if (Platform.OS === 'ios') {
                      // Keep picker open on iOS
                    } else {
                      setShowEndPicker(false);
                    }
                  }
                }}
              />
            )}
            {Platform.OS === 'ios' && showEndPicker && (
              <View style={styles.iosPickerActions}>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(false)}
                  style={styles.pickerButton}
                >
                  <Text style={styles.pickerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.daysContainer}>
          <Text style={styles.daysText}>
            {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locations</Text>

        <View style={styles.inputContainer}>
          <Icon name="location-on" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Pickup Location"
            placeholderTextColor="#999"
            value={pickupLocation}
            onChangeText={setPickupLocation}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="location-on" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Dropoff Location"
            placeholderTextColor="#999"
            value={dropoffLocation}
            onChangeText={setDropoffLocation}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Options</Text>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setWithDriver(!withDriver)}
        >
          <Icon
            name={withDriver ? 'check-circle' : 'radio-button-unchecked'}
            size={24}
            color={withDriver ? '#85ea2d' : '#ccc'}
          />
          <Text style={styles.optionText}>With Driver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({calculateDays()} days)</Text>
          <Text style={styles.summaryValue}>
            PKR {calculateTotal().toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryTotal}>
            PKR {calculateTotal().toLocaleString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.bookButton,
          { backgroundColor: theme.colors.primary },
          loading && styles.bookButtonDisabled,
        ]}
        onPress={handleBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>Confirm Booking</Text>
        )}
      </TouchableOpacity>

      <LoginModal
        visible={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          if (!user) {
            navigation.goBack();
          }
        }}
        onLogin={() => {
          setShowLoginModal(false);
          navigation.navigate('Login');
        }}
        onRegister={() => {
          setShowLoginModal(false);
          navigation.navigate('Register');
        }}
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Booking created successfully!"
        onConfirm={() => {
          navigation.navigate('HomeMain');
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  carInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  carName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    color: '#85ea2d',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateContainer: {
    flex: 1,
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  daysContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  daysText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#85ea2d',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  summary: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#85ea2d',
  },
  bookButton: {
    paddingVertical: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerButtonText: {
    color: '#85ea2d',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingScreen;

