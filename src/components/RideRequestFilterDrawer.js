import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { googlePlacesAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SearchableDropdown from '@/components/SearchableDropdown';

const { width, height } = Dimensions.get('window');

const EMPTY_FILTERS = {
  startLocation: '',
  startLatitude: '',
  startLongitude: '',
  endLocation: '',
  endLatitude: '',
  endLongitude: '',
  preferredDriverGender: '',
  requiredSeats: '',
  departureTime: '',
  departureDate: '',
};

const RideRequestFilterDrawer = ({
  visible,
  onClose,
  filters,
  onFilterChange,
  onClearAll,
  onApply,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [slideAnim] = React.useState(new Animated.Value(0));
  const [startLocations, setStartLocations] = React.useState([]);
  const [endLocations, setEndLocations] = React.useState([]);
  const [loadingStartLocations, setLoadingStartLocations] = React.useState(false);
  const [loadingEndLocations, setLoadingEndLocations] = React.useState(false);
  const googleMapsApiKey =
    Constants.expoConfig?.extra?.googleMapsApiKey ||
    Constants.manifest?.extra?.googleMapsApiKey ||
    '';

  React.useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [slideAnim, visible]);

  const mapPredictionsToOptions = React.useCallback((predictions = [], currentValue = '') => {
    const placeOptions = predictions.map((prediction) => ({
      value: prediction.description || prediction.structured_formatting?.main_text || '',
      label: prediction.description || prediction.structured_formatting?.main_text || '',
      id: prediction.place_id,
    }));

    const hasCurrentValue = currentValue && placeOptions.some((option) => option.value === currentValue);

    return [
      { value: '', label: 'Any Location', id: 'any-location' },
      ...(hasCurrentValue ? [] : currentValue ? [{ value: currentValue, label: currentValue, id: `current-${currentValue}` }] : []),
      ...placeOptions,
    ];
  }, []);

  const loadPlaces = async (search = '', target = 'start') => {
    const setLoading = target === 'start' ? setLoadingStartLocations : setLoadingEndLocations;
    const setOptions = target === 'start' ? setStartLocations : setEndLocations;
    const currentValue = target === 'start' ? filters.startLocation : filters.endLocation;

    if (!search.trim()) {
      setOptions(mapPredictionsToOptions([], currentValue));
      return;
    }

    try {
      setLoading(true);
      const predictions = await googlePlacesAPI.autocomplete(search, googleMapsApiKey);
      setOptions(mapPredictionsToOptions(predictions, currentValue));
    } catch (error) {
      console.error(`Error loading ${target} places:`, error);
      setOptions(mapPredictionsToOptions([], currentValue));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setStartLocations(mapPredictionsToOptions([], filters.startLocation));
  }, [filters.startLocation, mapPredictionsToOptions]);

  React.useEffect(() => {
    setEndLocations(mapPredictionsToOptions([], filters.endLocation));
  }, [filters.endLocation, mapPredictionsToOptions]);

  const applyPlaceSelection = async (target, value, option) => {
    const locationKey = target === 'start' ? 'startLocation' : 'endLocation';
    const latitudeKey = target === 'start' ? 'startLatitude' : 'endLatitude';
    const longitudeKey = target === 'start' ? 'startLongitude' : 'endLongitude';

    if (!value) {
      onFilterChange(locationKey, '');
      onFilterChange(latitudeKey, '');
      onFilterChange(longitudeKey, '');
      return;
    }

    onFilterChange(locationKey, value);

    if (!option?.id) {
      onFilterChange(latitudeKey, '');
      onFilterChange(longitudeKey, '');
      return;
    }

    try {
      const details = await googlePlacesAPI.getPlaceDetails(option.id, googleMapsApiKey);
      const location = details?.geometry?.location;
      const latitude = typeof location?.lat === 'function' ? location.lat() : location?.lat;
      const longitude = typeof location?.lng === 'function' ? location.lng() : location?.lng;

      onFilterChange(latitudeKey, latitude ?? '');
      onFilterChange(longitudeKey, longitude ?? '');
    } catch (error) {
      console.error(`Error loading ${target} place details:`, error);
      onFilterChange(latitudeKey, '');
      onFilterChange(longitudeKey, '');
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
  };

  const FilterChip = ({ label, selected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.backgroundSecondary,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, { color: selected ? '#fff' : theme.colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const FilterSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.chipContainer}>{children}</View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      hardwareAccelerated
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.drawerHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>Filters</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.drawerContent}
            contentContainerStyle={styles.drawerContentContainer}
            showsVerticalScrollIndicator
          >
            <View style={styles.section}>
              <SearchableDropdown
                label="Start Location"
                options={startLocations}
                value={filters.startLocation}
                onSelect={(value, option) => applyPlaceSelection('start', value || '', option)}
                placeholder="Select start location"
                searchable
                onSearch={(query) => loadPlaces(query, 'start')}
                loading={loadingStartLocations}
                style={styles.dropdownStyle}
              />
            </View>

            <View style={styles.section}>
              <SearchableDropdown
                label="End Location"
                options={endLocations}
                value={filters.endLocation}
                onSelect={(value, option) => applyPlaceSelection('end', value || '', option)}
                placeholder="Select end location"
                searchable
                onSearch={(query) => loadPlaces(query, 'end')}
                loading={loadingEndLocations}
                style={styles.dropdownStyle}
              />
            </View>

            <FilterSection title="Preferred Driver Gender">
              <FilterChip
                label="All"
                selected={!filters.preferredDriverGender}
                onPress={() => onFilterChange('preferredDriverGender', '')}
              />
              <FilterChip
                label="Male"
                selected={filters.preferredDriverGender === 'male'}
                onPress={() => onFilterChange('preferredDriverGender', 'male')}
              />
              <FilterChip
                label="Female"
                selected={filters.preferredDriverGender === 'female'}
                onPress={() => onFilterChange('preferredDriverGender', 'female')}
              />
            </FilterSection>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Required Seats</Text>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                <Icon name="people-outline" size={20} color={theme.colors.primary} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Any"
                  placeholderTextColor={theme.colors.placeholder}
                  value={filters.requiredSeats}
                  onChangeText={(value) => onFilterChange('requiredSeats', value.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Departure Time</Text>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                <Icon name="access-time" size={20} color={theme.colors.primary} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="--:--"
                  placeholderTextColor={theme.colors.placeholder}
                  value={filters.departureTime}
                  onChangeText={(value) => onFilterChange('departureTime', value)}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Departure Date</Text>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                <Icon name="calendar-today" size={20} color={theme.colors.primary} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="dd.mm.yyyy"
                  placeholderTextColor={theme.colors.placeholder}
                  value={filters.departureDate}
                  onChangeText={(value) => onFilterChange('departureDate', value)}
                />
              </View>
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.colors.background }}>
            <View style={[styles.drawerFooter, { borderTopColor: theme.colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={() => {
                  onClearAll();
                  onApply(EMPTY_FILTERS);
                  handleClose();
                }}
              >
                <Text style={[styles.clearButtonText, { color: theme.colors.text }]}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  onApply(filters);
                  handleClose();
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width,
    maxHeight: height * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    position: 'absolute',
    bottom: 0,
    elevation: 10,
    zIndex: 1000,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'column',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  drawerContent: {
    flex: 1,
  },
  drawerContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  dropdownStyle: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  drawerFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideRequestFilterDrawer;
