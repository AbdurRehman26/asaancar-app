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
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { locationAPI, rideRequestAPI } from '@/services/api';
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
const AREA_CITY_ID = 197;

const normalizeArea = (area) => {
  const id = area?.id ?? area?.area_id ?? null;
  const label = area?.name || area?.area || area?.title || area?.location || '';
  return {
    id,
    value: label,
    label,
  };
};

const getAreaLabel = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  return value?.name || value?.area || value?.title || value?.location || '';
};

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
  const [startAreaId, setStartAreaId] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [endAreaId, setEndAreaId] = useState('');
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

  useEffect(() => {
    if (!rideRequest) {
      return;
    }

    setName(rideRequest.name || user?.data?.name || '');
    setContact(rideRequest.contact || user?.data?.phone_number || user?.data?.phone || '');
    setStartLocation(getAreaLabel(rideRequest.start_area) || rideRequest.start_location || '');
    setStartAreaId(
      rideRequest.start_area_id ||
      rideRequest.pickup_area_id ||
      rideRequest.start_area?.id ||
      ''
    );
    setEndLocation(getAreaLabel(rideRequest.end_area) || rideRequest.end_location || '');
    setEndAreaId(
      rideRequest.end_area_id ||
      rideRequest.dropoff_area_id ||
      rideRequest.end_area?.id ||
      ''
    );
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

  const mapAreaOptions = (areas = [], currentValue = '', currentAreaId = '') => {
    const areaOptions = areas.map(normalizeArea).filter((area) => area.id && area.label);
    const hasCurrentValue = currentValue && areaOptions.some((option) => option.value === currentValue || option.id === currentAreaId);

    return [
      ...(hasCurrentValue ? [] : currentValue ? [{ value: currentValue, label: currentValue, id: currentAreaId || `current-${currentValue}` }] : []),
      ...areaOptions,
    ];
  };

  const initialStartOptions = useMemo(
    () => mapAreaOptions([], startLocation, startAreaId),
    [startAreaId, startLocation]
  );

  const initialEndOptions = useMemo(
    () => mapAreaOptions([], endLocation, endAreaId),
    [endAreaId, endLocation]
  );

  useEffect(() => {
    setStartOptions(initialStartOptions);
  }, [initialStartOptions]);

  useEffect(() => {
    setEndOptions(initialEndOptions);
  }, [initialEndOptions]);

  const loadAreas = async (search, target) => {
    const setLoadingState = target === 'start' ? setLoadingStartPlaces : setLoadingEndPlaces;
    const setOptions = target === 'start' ? setStartOptions : setEndOptions;
    const currentValue = target === 'start' ? startLocation : endLocation;
    const currentAreaId = target === 'start' ? startAreaId : endAreaId;

    if (!search.trim()) {
      setOptions(mapAreaOptions([], currentValue, currentAreaId));
      return;
    }

    try {
      setLoadingState(true);
      const response = await locationAPI.getAreas(AREA_CITY_ID, search);
      const areas = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setOptions(mapAreaOptions(areas, currentValue, currentAreaId));
    } catch (error) {
      setOptions(mapAreaOptions([], currentValue, currentAreaId));
    } finally {
      setLoadingState(false);
    }
  };

  const applyAreaSelection = (target, value, option) => {
    const setLocation = target === 'start' ? setStartLocation : setEndLocation;
    const setAreaId = target === 'start' ? setStartAreaId : setEndAreaId;

    setLocation(value || '');
    setAreaId(option?.id || '');

    if (option?.label) {
      setLocation(option.label);
    }
  };

  const resolveAreaSelection = async (locationText, existingAreaId = '') => {
    if (existingAreaId) {
      return { id: existingAreaId, label: locationText || '' };
    }

    if (!locationText?.trim()) {
      return { id: null, label: '' };
    }

    try {
      const response = await locationAPI.getAreas(AREA_CITY_ID, locationText);
      const areas = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const normalizedAreas = areas.map(normalizeArea).filter((area) => area.id && area.label);
      const matchedArea =
        normalizedAreas.find((area) => area.label.toLowerCase() === locationText.trim().toLowerCase()) ||
        normalizedAreas[0];

      return {
        id: matchedArea?.id || null,
        label: matchedArea?.label || locationText,
      };
    } catch (error) {
      return {
        id: null,
        label: locationText,
      };
    }
  };

  const toggleDay = (day) => {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    );
  };

  const clearUnconfirmedPlace = (target) => {
    if (target === 'start' && !startAreaId) {
      setStartLocation('');
      setStartOptions([]);
    }

    if (target === 'end' && !endAreaId) {
      setEndLocation('');
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
      const resolvedStart = await resolveAreaSelection(startLocation, startAreaId);
      const resolvedEnd = await resolveAreaSelection(endLocation, endAreaId);
      if (!resolvedStart.id || !resolvedEnd.id) {
        throw new Error('Please select valid start and end areas.');
      }

      const payload = {
        name: name.trim() || null,
        contact: contact.trim() || null,
        start_location: resolvedStart.label || startLocation,
        start_area_id: resolvedStart.id,
        end_location: resolvedEnd.label || endLocation,
        end_area_id: resolvedEnd.id,
        city_id: AREA_CITY_ID,
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
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
            onSelect={(value, option) => applyAreaSelection('start', value || '', option)}
            placeholder="Search start location"
            searchable
            onSearch={(search) => loadAreas(search, 'start')}
            loading={loadingStartPlaces}
            onClose={() => clearUnconfirmedPlace('start')}
          />

          <SearchableDropdown
            label="End Location"
            options={endOptions}
            value={endLocation}
            onSelect={(value, option) => applyAreaSelection('end', value || '', option)}
            placeholder="Search destination"
            searchable
            onSearch={(search) => loadAreas(search, 'end')}
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
