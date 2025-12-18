import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { pickDropAPI, locationAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreatePickDropServiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { service } = route.params || {};
  const isEditing = !!service;
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Stepper State
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { title: 'Route', required: true, subtitle: 'Locations & Schedule' },
    { title: 'Service', required: true, subtitle: 'Details & Price' },
    { title: 'Car', required: false, subtitle: 'Optional' },
    { title: 'Stops', required: false, subtitle: 'Optional' },
  ];

  // Route Information
  const [startArea, setStartArea] = useState('');
  const [startAreaId, setStartAreaId] = useState(null);
  const [endArea, setEndArea] = useState('');
  const [endAreaId, setEndAreaId] = useState(null);
  const [areaList, setAreaList] = useState([]);
  const [scheduleType, setScheduleType] = useState('once'); // 'once', 'everyday', 'weekday', 'weekends', 'custom'
  const [selectedDays, setSelectedDays] = useState([]);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [departureDate, setDepartureDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [returnTime, setReturnTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);

  // Contact Information
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Service Details
  const [availableSpaces, setAvailableSpaces] = useState('1');
  const [driverGender, setDriverGender] = useState('male');
  const [pricePerPerson, setPricePerPerson] = useState('');
  const [currency] = useState('PKR'); // Hardcoded to PKR
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState('');

  // Car Details (Optional)
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [seats, setSeats] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');

  // Stops
  const [stops, setStops] = useState([]);
  const [showStopModal, setShowStopModal] = useState(false);
  const [newStop, setNewStop] = useState({ location: '', stop_time: '' });

  // Dropdown states
  const [showStartAreaDropdown, setShowStartAreaDropdown] = useState(false);
  const [showEndAreaDropdown, setShowEndAreaDropdown] = useState(false);
  const [showDriverGenderDropdown, setShowDriverGenderDropdown] = useState(false);
  // Currency dropdown removed
  const [showTransmissionDropdown, setShowTransmissionDropdown] = useState(false);
  const [showFuelTypeDropdown, setShowFuelTypeDropdown] = useState(false);



  const driverGenders = ['Male', 'Female', 'Any'];
  const currencies = ['PKR', 'USD', 'EUR'];
  const transmissions = ['Automatic', 'Manual'];
  const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'];

  // Initialize form
  useEffect(() => {
    // Fetch areas
    const fetchAreas = async () => {
      try {
        const response = await locationAPI.getAreas();
        // Assuming response is array of objects { id, name, ... } or similar
        // Adjust based on actual API response structure if needed
        if (Array.isArray(response)) {
          setAreaList(response);
        } else if (response.data && Array.isArray(response.data)) {
          setAreaList(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch areas:', error);
      }
    };
    fetchAreas();

    // Always set contact info from user profile
    if (user) {
      setContactName(user.name || '');
      setContactPhone(user.phone_number || user.phone || '');
    }

    if (service) {
      setStartArea(service.start_area || service.start_location || '');
      setEndArea(service.end_area || service.end_location || '');

      // Map legacy boolean to schedule type if needed
      if (service.schedule_type) {
        setScheduleType(service.schedule_type);
      } else if (service.everyday_service || service.is_everyday) {
        setScheduleType('everyday');
      } else {
        setScheduleType('once');
      }

      if (service.selected_days && Array.isArray(service.selected_days)) {
        setSelectedDays(service.selected_days);
      } else if (service.schedule_days && Array.isArray(service.schedule_days)) {
        setSelectedDays(service.schedule_days);
      }

      setIsRoundTrip(service.is_roundtrip || false);

      if (service.departure_date) {
        setDepartureDate(new Date(service.departure_date));
      }

      // Parse time if string "HH:MM"
      const parseTime = (timeStr) => {
        if (!timeStr) return new Date();
        if (typeof timeStr === 'string' && timeStr.includes(':')) {
          const [hours, minutes] = timeStr.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes));
          return date;
        }
        return new Date(timeStr);
      };

      if (service.departure_time) {
        setDepartureTime(parseTime(service.departure_time));
      }

      if (service.return_time) {
        setReturnTime(parseTime(service.return_time));
      }

      // Override contact info if editing (optional, but requirements say "should be fetched from user")
      // We'll stick to user profile data as per "should not be editable" + "fetched from user"
      // If the service has specific contact info that differs, we might want to show that,
      // but the requirement implies standardized contact info based on the account.

      setAvailableSpaces(service.available_spaces?.toString() || '1');
      setDriverGender(service.driver_gender || 'male');
      setPricePerPerson(service.price_per_person?.toString() || '');
      setCurrency(service.currency || 'PKR');
      setActive(service.active !== undefined ? service.active : true);
      setDescription(service.description || '');

      setCarBrand(service.car_brand || '');
      setCarModel(service.car_model || '');
      setCarColor(service.car_color || '');
      setSeats(service.seats?.toString() || '');
      setTransmission(service.transmission || '');
      setFuelType(service.fuel_type || '');

      if (service.stops && Array.isArray(service.stops)) {
        setStops(service.stops.map(s => ({ ...s, id: s.id || Date.now() + Math.random() })));
      }
    }
  }, [service, user]);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleAddStop = () => {
    if (newStop.location && newStop.stop_time) {
      setStops([...stops, { ...newStop, id: Date.now() }]);
      setNewStop({ location: '', stop_time: '' });
      setShowStopModal(false);
    }
  };

  const handleRemoveStop = (id) => {
    setStops(stops.filter((stop) => stop.id !== id));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Route
        if (!startArea || !endArea) {
          setErrorMessage('Please select start and end areas');
          return false;
        }
        if (scheduleType === 'once' && !departureDate) {
          setErrorMessage('Please select departure date');
          return false;
        }
        if (scheduleType === 'custom' && selectedDays.length === 0) {
          setErrorMessage('Please select at least one day for custom schedule');
          return false;
        }
        if (!departureTime) {
          setErrorMessage('Please select departure time');
          return false;
        }
        if (isRoundTrip && !returnTime) {
          setErrorMessage('Please select return time for round trip');
          return false;
        }
        return true;

      case 1: // Service (Was 2)
        if (!availableSpaces || parseInt(availableSpaces) < 1) {
          setErrorMessage('Please enter available spaces (minimum 1)');
          return false;
        }
        if (!driverGender) {
          setErrorMessage('Please select driver gender');
          return false;
        }
        return true;

      case 2: // Car (Was 3)
        return true;

      case 3: // Stops (Was 4)
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      setShowErrorModal(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Strict payload construction
      const serviceData = {
        schedule_type: scheduleType,
        selected_days: scheduleType === 'custom' ? selectedDays : null,
        is_roundtrip: isRoundTrip,
        departure_date: scheduleType === 'once' ? formatDate(departureDate) : "",
        departure_time: departureTime.toISOString().split('.')[0], // "2000-01-01T07:03:00" format
        return_time: isRoundTrip ? formatTime(returnTime) : "",

        // Location (IDs are critical)
        pickup_area_id: startAreaId,
        pickup_city_id: 197, // Hardcoded as per request
        dropoff_area_id: endAreaId,
        dropoff_city_id: 197, // Hardcoded as per request
        start_location: startArea,
        end_location: endArea,

        // Contact
        name: contactName || "",
        contact: contactPhone || "",

        // Service Details
        available_spaces: parseInt(availableSpaces) || 1,
        driver_gender: driverGender.toLowerCase(),
        price_per_person: pricePerPerson ? parseFloat(pricePerPerson) : 0,
        currency: 'PKR',
        is_active: active, // "is_active" not "active"
        description: description || "",
        is_everyday: scheduleType === 'everyday',

        // Car Details
        car_brand: carBrand || "",
        car_model: carModel || "",
        car_color: carColor || "",
        car_seats: seats ? parseInt(seats) : null,
        car_transmission: transmission || "",
        car_fuel_type: fuelType || "",

        // Stops
        stops: stops.length > 0 ? stops.map((stop) => ({
          location: stop.location,
          stop_time: stop.stop_time,
        })) : [],
      };

      if (isEditing) {
        await pickDropAPI.updatePickDropService(service.id, serviceData);
        setSuccessMessage('Service updated successfully!');
      } else {
        await pickDropAPI.createPickAndDropService(serviceData);
        setSuccessMessage('Service created successfully!');
      }
      setShowSuccessModal(true);

      // Navigate back after success
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
        error.message ||
        'Failed to create service. Please try again.'
      );
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Helper renderers
  const renderDropdown = (items, selectedValue, onSelect, visible, setVisible, isObject = false, labelKey = 'name', valueKey = 'id') => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setVisible(false)}
      >
        <View style={[styles.dropdownModal, { backgroundColor: theme.colors.cardBackground }]}>
          <ScrollView style={{ maxHeight: 300 }}>
            {items.map((item, index) => {
              const itemLabel = isObject ? item[labelKey] : item;
              const itemValue = isObject ? item[valueKey] : item;
              const isSelected = isObject ? selectedValue === itemValue : selectedValue === itemValue;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownOption,
                    isSelected && { backgroundColor: theme.colors.primary + '20' },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      { color: theme.colors.text },
                      isSelected && { color: theme.colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {itemLabel}
                  </Text>
                  {isSelected && (
                    <Icon name="check" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const scheduleOptions = [
    { id: 'once', label: 'One-time' },
    { id: 'everyday', label: 'Everyday' },
    { id: 'weekday', label: 'Weekdays' },
    { id: 'weekends', label: 'Weekends' },
    { id: 'custom', label: 'Custom' },
  ];

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Render Steps Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Route
        return (
          <View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Start Area *</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowStartAreaDropdown(true)}
                >
                  <Text style={[styles.inputText, { color: startArea ? theme.colors.text : theme.colors.placeholder }]} numberOfLines={1}>
                    {startArea || 'Search area...'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>End Area *</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowEndAreaDropdown(true)}
                >
                  <Text style={[styles.inputText, { color: endArea ? theme.colors.text : theme.colors.placeholder }]} numberOfLines={1}>
                    {endArea || 'Search area...'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Schedule Type</Text>
              <View style={styles.scheduleContainer}>
                {scheduleOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.scheduleButton,
                      { borderColor: theme.colors.border },
                      scheduleType === opt.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    ]}
                    onPress={() => setScheduleType(opt.id)}
                  >
                    <Text style={[
                      styles.scheduleButtonText,
                      { color: theme.colors.textSecondary },
                      scheduleType === opt.id && { color: '#fff', fontWeight: '600' }
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {scheduleType === 'custom' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Select Days</Text>
                <View style={[styles.scheduleContainer, { gap: 6 }]}>
                  {daysOfWeek.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        { borderColor: theme.colors.border },
                        selectedDays.includes(day) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                      ]}
                      onPress={() => toggleDay(day)}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        { color: theme.colors.textSecondary },
                        selectedDays.includes(day) && { color: '#fff', fontWeight: 'bold' }
                      ]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsRoundTrip(!isRoundTrip)}
            >
              <View style={[styles.checkbox, { borderColor: theme.colors.primary }, isRoundTrip && { backgroundColor: theme.colors.primary }]}>
                {isRoundTrip && <Icon name="check" size={16} color="#fff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
                Round Trip (Return on the same day/schedule)
              </Text>
            </TouchableOpacity>

            {scheduleType === 'once' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Departure Date *</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.inputText, { color: theme.colors.text }]}>
                    {formatDate(departureDate)}
                  </Text>
                  <Icon name="calendar-today" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Departure Time *</Text>
              <TouchableOpacity
                style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.inputText, { color: theme.colors.text }]}>
                  {formatTime(departureTime)}
                </Text>
                <Icon name="access-time" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {isRoundTrip && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Return Time *</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowReturnTimePicker(true)}
                >
                  <Text style={[styles.inputText, { color: theme.colors.text }]}>
                    {formatTime(returnTime)}
                  </Text>
                  <Icon name="access-time" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 1: // Service (Was 2)
        return (
          <View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Available Spaces *</Text>
                <TextInput
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                  value={availableSpaces}
                  onChangeText={setAvailableSpaces}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>
              <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Driver Gender *</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowDriverGenderDropdown(true)}
                >
                  <Text style={[styles.inputText, { color: theme.colors.text }]}>
                    {driverGender.charAt(0).toUpperCase() + driverGender.slice(1)}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Price Per Person</Text>
                <View style={[styles.priceRow, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 8 }]}>
                  <TextInput
                    style={[styles.priceInputText, { color: theme.colors.text, flex: 1, padding: 12 }]}
                    value={pricePerPerson}
                    onChangeText={setPricePerPerson}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.placeholder}
                  />
                  <View style={{ width: 1, backgroundColor: theme.colors.border, height: '60%' }} />
                  <View
                    style={[styles.currencyButton]}
                  >
                    <Text style={[styles.currencyText, { color: theme.colors.text }]}>PKR</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.inputGroup, { marginLeft: 8, justifyContent: 'center' }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Active</Text>
                <TouchableOpacity
                  onPress={() => setActive(!active)}
                >
                  <View style={[styles.checkbox, { borderColor: theme.colors.primary, width: 28, height: 28 }, active && { backgroundColor: theme.colors.primary }]}>
                    {active && <Icon name="check" size={18} color="#fff" />}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholder="Enter service description..."
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          </View>
        );

      case 2: // Car (Was 3)
        return (
          <View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Car Brand</Text>
                <TextInput
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                  value={carBrand}
                  onChangeText={setCarBrand}
                  placeholder="Enter car brand"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>
              <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Car Model</Text>
                <TextInput
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                  value={carModel}
                  onChangeText={setCarModel}
                  placeholder="Enter car model"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Car Color</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                value={carColor}
                onChangeText={setCarColor}
                placeholder="Enter car color"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { width: '30%', marginRight: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Seats</Text>
                <TextInput
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                  value={seats}
                  onChangeText={setSeats}
                  keyboardType="numeric"
                  placeholder="4"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Transmission</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowTransmissionDropdown(true)}
                >
                  <Text style={[styles.inputText, { color: transmission ? theme.colors.text : theme.colors.placeholder }]} numberOfLines={1}>
                    {transmission || 'Select'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Fuel Type</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowFuelTypeDropdown(true)}
                >
                  <Text style={[styles.inputText, { color: fuelType ? theme.colors.text : theme.colors.placeholder }]} numberOfLines={1}>
                    {fuelType || 'Select'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 3: // Stops (Was 4)
        return (
          <View>
            {stops.length === 0 ? (
              <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontStyle: 'italic', marginBottom: 12 }]}>
                No stops added. Click "Add Stop" to add intermediate stops.
              </Text>
            ) : (
              stops.map((stop) => (
                <View key={stop.id} style={[styles.stopItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <View style={styles.stopInfo}>
                    <Text style={[styles.stopLocation, { color: theme.colors.text }]}>
                      {stop.location}
                    </Text>
                    <Text style={[styles.stopTime, { color: theme.colors.textSecondary }]}>
                      {stop.stop_time}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveStop(stop.id)}
                    style={styles.removeStopButton}
                  >
                    <Icon name="close" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            <View style={{ alignItems: 'flex-end' }}>
              <TouchableOpacity
                style={[styles.addStopButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowStopModal(true)}
              >
                <Icon name="add" size={18} color="#fff" />
                <Text style={styles.addStopButtonText}>Add Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? 'Edit Service' : 'Create Service'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stepper Header */}
      <View style={[styles.stepperContainer, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepperContent}
        >
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                {
                  borderColor: index <= currentStep ? theme.colors.primary : theme.colors.border,
                  backgroundColor: index <= currentStep ? theme.colors.primary : 'transparent'
                }
              ]}>
                {index < currentStep ? (
                  <Icon name="check" size={12} color="#fff" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    { color: index === currentStep ? '#fff' : theme.colors.textSecondary }
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.stepTitle,
                { color: index === currentStep ? theme.colors.primary : theme.colors.textSecondary }
              ]}>
                {step.title}
              </Text>
              {index < steps.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: index < currentStep ? theme.colors.primary : theme.colors.border }]} />
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Content */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 4 }]}>
            {steps[currentStep].title}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
            {steps[currentStep].subtitle}
          </Text>
          {renderStepContent()}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.navButtonsRow}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={[styles.navButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={handleBack}
              >
                <Text style={[styles.navButtonText, { color: theme.colors.text }]}>Back</Text>
              </TouchableOpacity>
            )}

            {!steps[currentStep].required && (
              <TouchableOpacity
                style={[styles.navButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                onPress={handleSkip}
              >
                <Text style={[styles.navButtonText, { color: theme.colors.textSecondary }]}>Skip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.colors.primary, flex: 1, marginLeft: 8 }]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.navButtonText, { color: '#fff', fontWeight: 'bold' }]}>
                  {currentStep === steps.length - 1 ? (isEditing ? 'Update' : 'Create') : 'Next'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Dropdowns */}
      {renderDropdown(areaList, startAreaId, (item) => {
        setStartArea(item.name);
        setStartAreaId(item.id);
      }, showStartAreaDropdown, setShowStartAreaDropdown, true, 'name', 'id')}

      {renderDropdown(areaList, endAreaId, (item) => {
        setEndArea(item.name);
        setEndAreaId(item.id);
      }, showEndAreaDropdown, setShowEndAreaDropdown, true, 'name', 'id')}

      {renderDropdown(driverGenders, driverGender.charAt(0).toUpperCase() + driverGender.slice(1), (val) => setDriverGender(val.toLowerCase()), showDriverGenderDropdown, setShowDriverGenderDropdown)}

      {renderDropdown(transmissions, transmission, setTransmission, showTransmissionDropdown, setShowTransmissionDropdown)}
      {renderDropdown(fuelTypes, fuelType, setFuelType, showFuelTypeDropdown, setShowFuelTypeDropdown)}

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={departureDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDepartureDate(selectedDate);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={departureTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (selectedTime) {
              setDepartureTime(selectedTime);
            }
          }}
        />
      )}

      {showReturnTimePicker && (
        <DateTimePicker
          value={returnTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowReturnTimePicker(Platform.OS === 'ios');
            if (selectedTime) {
              setReturnTime(selectedTime);
            }
          }}
        />
      )}

      {/* Add Stop Modal */}
      <Modal
        visible={showStopModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.stopModal, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Stop</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Location</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                value={newStop.location}
                onChangeText={(text) => setNewStop({ ...newStop, location: text })}
                placeholder="Enter stop location"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Stop Time</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                value={newStop.stop_time}
                onChangeText={(text) => setNewStop({ ...newStop, stop_time: text })}
                placeholder="e.g., 10:47 AM"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={() => {
                  setShowStopModal(false);
                  setNewStop({ location: '', stop_time: '' });
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddStop}
              >
                <Text style={styles.modalButtonTextWhite}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  stepperContainer: {
    paddingVertical: 12,
  },
  stepperContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  stepLine: {
    width: 24,
    height: 2,
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputText: {
    fontSize: 16,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  flex1: {
    flex: 1,
  },
  scheduleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
  },
  dayButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  dayButtonText: {
    fontSize: 12,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
    minWidth: 70,
  },
  currencyText: {
    fontSize: 16,
    marginRight: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  stopInfo: {
    flex: 1,
  },
  stopLocation: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  stopTime: {
    fontSize: 14,
  },
  removeStopButton: {
    padding: 4,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-end',
  },
  addStopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    marginBottom: 32,
  },
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '80%',
    borderRadius: 12,
    padding: 8,
    maxHeight: 300,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  dropdownOptionText: {
    fontSize: 16,
  },
  stopModal: {
    width: '90%',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextWhite: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputText: {
    fontSize: 16,
  },
});

export default CreatePickDropServiceScreen;
