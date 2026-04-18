import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { googlePlacesAPI, rideRequestAPI } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import SearchableDropdown from '@/components/SearchableDropdown';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SCHEDULE_OPTIONS = ['once', 'everyday', 'weekdays', 'weekends', 'custom'];
const DRIVER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'any', label: 'Any' },
];

const formatDateForApi = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeForApi = (date) => {
  if (!date) return null;
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

const parseTime = (timeString) => {
  const date = new Date();
  if (typeof timeString !== 'string') {
    return date;
  }

  const timePart = timeString.includes('T') ? timeString.split('T')[1] : timeString;
  const [hours, minutes] = timePart.split(':');

  if (!Number.isNaN(parseInt(hours, 10))) {
    date.setHours(parseInt(hours, 10));
  }

  if (!Number.isNaN(parseInt(minutes, 10))) {
    date.setMinutes(parseInt(minutes, 10));
  }

  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

const formatTimeForDisplay = (date) => {
  if (!date) return '';
  let hours = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours || 12;
  return `${hours}:${minutes} ${ampm}`;
};

const RideRequestFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { rideRequest } = route.params || {};
  const isEditing = !!rideRequest;

  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [name, setName] = useState(user?.data?.name || '');
  const [contact, setContact] = useState(user?.data?.phone_number || user?.data?.phone || '');
  const [startLocation, setStartLocation] = useState('');
  const [startPlaceId, setStartPlaceId] = useState('');
  const [startLatitude, setStartLatitude] = useState(null);
  const [startLongitude, setStartLongitude] = useState(null);
  const [endLocation, setEndLocation] = useState('');
  const [endPlaceId, setEndPlaceId] = useState('');
  const [endLatitude, setEndLatitude] = useState(null);
  const [endLongitude, setEndLongitude] = useState(null);
  const [scheduleType, setScheduleType] = useState('once');
  const [selectedDays, setSelectedDays] = useState([]);
  const [departureDate, setDepartureDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [returnTime, setReturnTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [requiredSeats, setRequiredSeats] = useState('1');
  const [preferredDriverGender, setPreferredDriverGender] = useState('any');
  const [budgetPerSeat, setBudgetPerSeat] = useState('');
  const [currency] = useState('PKR');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startOptions, setStartOptions] = useState([]);
  const [endOptions, setEndOptions] = useState([]);
  const [loadingStartPlaces, setLoadingStartPlaces] = useState(false);
  const [loadingEndPlaces, setLoadingEndPlaces] = useState(false);

  const googleMapsApiKey =
    Constants.expoConfig?.extra?.googleMapsApiKey ||
    Constants.manifest?.extra?.googleMapsApiKey ||
    '';

  useEffect(() => {
    if (!rideRequest) {
      return;
    }

    setName(rideRequest.name || user?.data?.name || '');
    setContact(rideRequest.contact || user?.data?.phone_number || user?.data?.phone || '');
    setStartLocation(rideRequest.start_location || '');
    setStartPlaceId(rideRequest.start_place_id || '');
    setStartLatitude(rideRequest.start_latitude ?? null);
    setStartLongitude(rideRequest.start_longitude ?? null);
    setEndLocation(rideRequest.end_location || '');
    setEndPlaceId(rideRequest.end_place_id || '');
    setEndLatitude(rideRequest.end_latitude ?? null);
    setEndLongitude(rideRequest.end_longitude ?? null);
    setScheduleType(rideRequest.schedule_type || 'once');
    setSelectedDays(Array.isArray(rideRequest.selected_days) ? rideRequest.selected_days : []);
    setIsRoundTrip(!!rideRequest.is_roundtrip);
    setRequiredSeats(rideRequest.required_seats ? String(rideRequest.required_seats) : '1');
    setPreferredDriverGender(rideRequest.preferred_driver_gender || 'any');
    setBudgetPerSeat(
      rideRequest.budget_per_seat !== null && rideRequest.budget_per_seat !== undefined
        ? String(rideRequest.budget_per_seat)
        : ''
    );
    setDescription(rideRequest.description || '');
    setIsActive(rideRequest.is_active !== undefined ? !!rideRequest.is_active : true);

    if (rideRequest.departure_date) {
      setDepartureDate(new Date(rideRequest.departure_date));
    }

    if (rideRequest.departure_time) {
      setDepartureTime(parseTime(rideRequest.departure_time));
    }

    if (rideRequest.return_time) {
      setReturnTime(parseTime(rideRequest.return_time));
    }
  }, [rideRequest, user]);

  const mapPredictionsToOptions = (predictions = [], currentValue = '') => {
    const placeOptions = predictions.map((prediction) => ({
      value: prediction.description || prediction.structured_formatting?.main_text || '',
      label: prediction.description || prediction.structured_formatting?.main_text || '',
      id: prediction.place_id,
    }));

    const hasCurrentValue = currentValue && placeOptions.some((option) => option.value === currentValue);

    return [
      ...(hasCurrentValue ? [] : currentValue ? [{ value: currentValue, label: currentValue, id: `current-${currentValue}` }] : []),
      ...placeOptions,
    ];
  };

  const initialStartOptions = useMemo(
    () => mapPredictionsToOptions([], startLocation),
    [startLocation]
  );

  const initialEndOptions = useMemo(
    () => mapPredictionsToOptions([], endLocation),
    [endLocation]
  );

  useEffect(() => {
    setStartOptions(initialStartOptions);
  }, [initialStartOptions]);

  useEffect(() => {
    setEndOptions(initialEndOptions);
  }, [initialEndOptions]);

  const loadPlaces = async (search, target) => {
    const setLoadingState = target === 'start' ? setLoadingStartPlaces : setLoadingEndPlaces;
    const setOptions = target === 'start' ? setStartOptions : setEndOptions;
    const currentValue = target === 'start' ? startLocation : endLocation;

    if (!search.trim()) {
      setOptions(mapPredictionsToOptions([], currentValue));
      return;
    }

    try {
      setLoadingState(true);
      const predictions = await googlePlacesAPI.autocomplete(search, googleMapsApiKey);
      setOptions(mapPredictionsToOptions(predictions, currentValue));
    } catch (error) {
      setOptions(mapPredictionsToOptions([], currentValue));
    } finally {
      setLoadingState(false);
    }
  };

  const applyPlaceSelection = async (target, value, option) => {
    const setLocation = target === 'start' ? setStartLocation : setEndLocation;
    const setPlaceId = target === 'start' ? setStartPlaceId : setEndPlaceId;
    const setLatitude = target === 'start' ? setStartLatitude : setEndLatitude;
    const setLongitude = target === 'start' ? setStartLongitude : setEndLongitude;

    setLocation(value || '');
    setPlaceId(option?.id || '');

    if (!option?.id) {
      setLatitude(null);
      setLongitude(null);
      return;
    }

    try {
      const details = await googlePlacesAPI.getPlaceDetails(option.id, googleMapsApiKey);
      const location = details?.geometry?.location;
      const latitude = typeof location?.lat === 'function' ? location.lat() : location?.lat;
      const longitude = typeof location?.lng === 'function' ? location.lng() : location?.lng;

      setLatitude(latitude ?? null);
      setLongitude(longitude ?? null);
      setLocation(details?.formatted_address || details?.name || value || '');
      setPlaceId(details?.place_id || option.id);
    } catch (error) {
      setLatitude(null);
      setLongitude(null);
    }
  };

  const toggleDay = (day) => {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    );
  };

  const clearUnconfirmedPlace = (target) => {
    if (target === 'start' && !startPlaceId) {
      setStartLocation('');
      setStartLatitude(null);
      setStartLongitude(null);
      setStartOptions([]);
    }

    if (target === 'end' && !endPlaceId) {
      setEndLocation('');
      setEndLatitude(null);
      setEndLongitude(null);
      setEndOptions([]);
    }
  };

  const handleSubmit = async () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      setErrorMessage('Please select start and end locations.');
      setShowErrorModal(true);
      return;
    }

    if (scheduleType === 'custom' && selectedDays.length === 0) {
      setErrorMessage('Please select at least one day for a custom schedule.');
      setShowErrorModal(true);
      return;
    }

    if (!requiredSeats || parseInt(requiredSeats, 10) <= 0) {
      setErrorMessage('Please enter the required seats.');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: name.trim() || null,
        contact: contact.trim() || null,
        start_location: startLocation,
        start_place_id: startPlaceId || null,
        start_latitude: startLatitude,
        start_longitude: startLongitude,
        end_location: endLocation,
        end_place_id: endPlaceId || null,
        end_latitude: endLatitude,
        end_longitude: endLongitude,
        departure_date: scheduleType === 'once' ? formatDateForApi(departureDate) : null,
        departure_time: formatTimeForApi(departureTime),
        schedule_type: scheduleType,
        selected_days: scheduleType === 'custom' ? selectedDays : null,
        is_roundtrip: isRoundTrip,
        return_time: isRoundTrip ? formatTimeForApi(returnTime) : null,
        required_seats: parseInt(requiredSeats, 10),
        preferred_driver_gender: preferredDriverGender,
        budget_per_seat: budgetPerSeat ? parseInt(budgetPerSeat, 10) : null,
        currency,
        description: description.trim() || null,
        is_active: isActive,
      };

      if (isEditing) {
        await rideRequestAPI.updateRideRequest(rideRequest.id, payload);
      } else {
        await rideRequestAPI.createRideRequest(payload);
      }

      setSuccessMessage(isEditing ? 'Ride request updated successfully.' : 'Ride request created successfully.');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to save ride request.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <PageHeader title={isEditing ? 'Edit Ride Request' : 'Create Ride Request'} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact</Text>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            value={name}
            placeholder="Your name"
            placeholderTextColor={theme.colors.textLight}
            editable={false}
          />

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Contact</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            value={contact}
            placeholder="Phone or contact number"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="phone-pad"
            editable={false}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Route</Text>

          <SearchableDropdown
            label="Start Location"
            options={startOptions}
            value={startLocation}
            onSelect={(value, option) => applyPlaceSelection('start', value || '', option)}
            placeholder="Search start location"
            searchable
            onSearch={(search) => loadPlaces(search, 'start')}
            loading={loadingStartPlaces}
            onClose={() => clearUnconfirmedPlace('start')}
          />

          <SearchableDropdown
            label="End Location"
            options={endOptions}
            value={endLocation}
            onSelect={(value, option) => applyPlaceSelection('end', value || '', option)}
            placeholder="Search destination"
            searchable
            onSearch={(search) => loadPlaces(search, 'end')}
            loading={loadingEndPlaces}
            onClose={() => clearUnconfirmedPlace('end')}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Schedule</Text>

          <View style={styles.chipsRow}>
            {SCHEDULE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  {
                    backgroundColor: scheduleType === option ? theme.colors.primary : theme.colors.background,
                    borderColor: scheduleType === option ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setScheduleType(option)}
              >
                <Text style={{ color: scheduleType === option ? '#fff' : theme.colors.text }}>
                  {option === 'once' ? 'Once' : option === 'everyday' ? 'Everyday' : option === 'weekdays' ? 'Weekdays' : option === 'weekends' ? 'Weekends' : 'Custom'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {scheduleType === 'custom' && (
            <View style={[styles.dayWrap, { marginTop: 8 }]}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: selectedDays.includes(day) ? theme.colors.primary : theme.colors.background,
                      borderColor: selectedDays.includes(day) ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={{ color: selectedDays.includes(day) ? '#fff' : theme.colors.text }}>{day.slice(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {scheduleType === 'once' && (
            <>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Departure Date</Text>
              <TouchableOpacity
                style={[styles.inputButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: theme.colors.text }}>{formatDateForApi(departureDate)}</Text>
                <Icon name="calendar-today" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </>
          )}

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Departure Time</Text>
          <TouchableOpacity
            style={[styles.inputButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={{ color: theme.colors.text }}>{formatTimeForDisplay(departureTime)}</Text>
            <Icon name="access-time" size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 0 }]}>Round Trip</Text>
            <Switch value={isRoundTrip} onValueChange={setIsRoundTrip} trackColor={{ true: theme.colors.primary }} />
          </View>

          {isRoundTrip && (
            <>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Return Time</Text>
              <TouchableOpacity
                style={[styles.inputButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                onPress={() => setShowReturnTimePicker(true)}
              >
                <Text style={{ color: theme.colors.text }}>{formatTimeForDisplay(returnTime)}</Text>
                <Icon name="reply" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Required Seats</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            value={requiredSeats}
            onChangeText={(value) => setRequiredSeats(value.replace(/[^0-9]/g, ''))}
            placeholder="Seats needed"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="number-pad"
          />

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Preferred Driver Gender</Text>
          <View style={styles.chipsRow}>
            {DRIVER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: preferredDriverGender === option.value ? theme.colors.primary : theme.colors.background,
                    borderColor: preferredDriverGender === option.value ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setPreferredDriverGender(option.value)}
              >
                <Text style={{ color: preferredDriverGender === option.value ? '#fff' : theme.colors.text }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Budget Per Seat</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            value={budgetPerSeat}
            onChangeText={(value) => setBudgetPerSeat(value.replace(/[^0-9]/g, ''))}
            placeholder="Optional budget"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="number-pad"
          />

          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 0 }]}>Active</Text>
            <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: theme.colors.primary }} />
          </View>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Notes</Text>
          <TextInput
            style={[styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add any ride details"
            placeholderTextColor={theme.colors.textLight}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{isEditing ? 'Update Ride Request' : 'Create Ride Request'}</Text>}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={departureDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDepartureDate(selectedDate);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={departureTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowTimePicker(false);
            if (selectedDate) {
              setDepartureTime(selectedDate);
            }
          }}
        />
      )}

      {showReturnTimePicker && (
        <DateTimePicker
          value={returnTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowReturnTimePicker(false);
            if (selectedDate) {
              setReturnTime(selectedDate);
            }
          }}
        />
      )}

      <ErrorModal visible={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        title="Success"
        message={successMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 110,
    fontSize: 16,
  },
  inputButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    width: 56,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default RideRequestFormScreen;
