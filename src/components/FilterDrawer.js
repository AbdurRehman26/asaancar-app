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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const FilterDrawer = ({ visible, onClose, filters, onFilterChange, onClearAll, onApply, brands, types }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  // Initialize at 0 so drawer is visible by default when modal opens
  const [slideAnim] = React.useState(new Animated.Value(0));
  
  // Price slider state
  const [minPriceValue, setMinPriceValue] = React.useState(0);
  const [maxPriceValue, setMaxPriceValue] = React.useState(50000);
  
  // Price range constants
  const MIN_PRICE = 0;
  const MAX_PRICE = 50000;
  const STEP = 1000;

  React.useEffect(() => {
    if (visible) {
      // Initialize slider values from filters first
      const minPrice = filters.minPrice ? parseInt(filters.minPrice, 10) : MIN_PRICE;
      const maxPrice = filters.maxPrice ? parseInt(filters.maxPrice, 10) : MAX_PRICE;
      
      // Ensure valid range
      const validMinPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, minPrice || MIN_PRICE));
      const validMaxPrice = Math.max(validMinPrice, Math.min(MAX_PRICE, maxPrice || MAX_PRICE));
      
      setMinPriceValue(validMinPrice);
      setMaxPriceValue(validMaxPrice);
      
      // Immediately set drawer to visible position (no animation delay)
      slideAnim.setValue(0);
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: false, // Disabled to avoid native module warning
    }).start(() => {
      onClose();
    });
  };

  const FilterChip = ({ label, value, selected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.backgroundSecondary,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? '#fff' : theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const FilterSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <View style={styles.chipContainer}>{children}</View>
    </View>
  );

  const formatPrice = (price) => {
    if (price === 0) return 'Any';
    return `${price.toLocaleString()} PKR`;
  };

  const handleMinPriceChange = (value) => {
    const newValue = Math.round(value / STEP) * STEP;
    const clampedValue = Math.max(MIN_PRICE, Math.min(maxPriceValue, newValue));
    setMinPriceValue(clampedValue);
    // Update tempFilters immediately
    const priceValue = clampedValue === MIN_PRICE ? '' : clampedValue.toString();
    onFilterChange('minPrice', priceValue);
  };

  const handleMaxPriceChange = (value) => {
    const newValue = Math.round(value / STEP) * STEP;
    const clampedValue = Math.max(minPriceValue, Math.min(MAX_PRICE, newValue));
    setMaxPriceValue(clampedValue);
    // Update tempFilters immediately
    const priceValue = clampedValue === MAX_PRICE ? '' : clampedValue.toString();
    onFilterChange('maxPrice', priceValue);
  };

  const handleMinPriceComplete = (value) => {
    const newValue = Math.round(value / STEP) * STEP;
    const clampedValue = Math.max(MIN_PRICE, Math.min(maxPriceValue, newValue));
    setMinPriceValue(clampedValue);
    // Ensure value is synced on slide complete (important for mobile)
    const priceValue = clampedValue === MIN_PRICE ? '' : clampedValue.toString();
    onFilterChange('minPrice', priceValue);
  };

  const handleMaxPriceComplete = (value) => {
    const newValue = Math.round(value / STEP) * STEP;
    const clampedValue = Math.max(minPriceValue, Math.min(MAX_PRICE, newValue));
    setMaxPriceValue(clampedValue);
    // Ensure value is synced on slide complete (important for mobile)
    const priceValue = clampedValue === MAX_PRICE ? '' : clampedValue.toString();
    onFilterChange('maxPrice', priceValue);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
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
            <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>
              Filters
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.drawerContent}
            contentContainerStyle={styles.drawerContentContainer}
            showsVerticalScrollIndicator={true}
          >
            {/* Brand Filter */}
            <FilterSection title="Brand">
              <FilterChip
                label="All Brands"
                value=""
                selected={!filters.brand}
                onPress={() => onFilterChange('brand', '')}
              />
              {Array.isArray(brands) &&
                brands.map((brand) => (
                  <FilterChip
                    key={brand.id}
                    label={brand.name}
                    value={brand.id}
                    selected={filters.brand === brand.id.toString()}
                    onPress={() => onFilterChange('brand', brand.id.toString())}
                  />
                ))}
            </FilterSection>

            {/* Type Filter */}
            <FilterSection title="Type">
              <FilterChip
                label="All Types"
                value=""
                selected={!filters.type}
                onPress={() => onFilterChange('type', '')}
              />
              {Array.isArray(types) &&
                types.map((type) => (
                  <FilterChip
                    key={type.id}
                    label={type.name}
                    value={type.id}
                    selected={filters.type === type.id.toString()}
                    onPress={() => onFilterChange('type', type.id.toString())}
                  />
                ))}
            </FilterSection>

            {/* Transmission Filter */}
            <FilterSection title="Transmission">
              <FilterChip
                label="All"
                value=""
                selected={!filters.transmission}
                onPress={() => onFilterChange('transmission', '')}
              />
              <FilterChip
                label="Automatic"
                value="Automatic"
                selected={filters.transmission === 'Automatic'}
                onPress={() => onFilterChange('transmission', 'Automatic')}
              />
              <FilterChip
                label="Manual"
                value="Manual"
                selected={filters.transmission === 'Manual'}
                onPress={() => onFilterChange('transmission', 'Manual')}
              />
            </FilterSection>

            {/* Fuel Type Filter */}
            <FilterSection title="Fuel Type">
              <FilterChip
                label="All"
                value=""
                selected={!filters.fuelType}
                onPress={() => onFilterChange('fuelType', '')}
              />
              <FilterChip
                label="Gasoline"
                value="Gasoline"
                selected={filters.fuelType === 'Gasoline'}
                onPress={() => onFilterChange('fuelType', 'Gasoline')}
              />
              <FilterChip
                label="Electric"
                value="Electric"
                selected={filters.fuelType === 'Electric'}
                onPress={() => onFilterChange('fuelType', 'Electric')}
              />
              <FilterChip
                label="Hybrid"
                value="Hybrid"
                selected={filters.fuelType === 'Hybrid'}
                onPress={() => onFilterChange('fuelType', 'Hybrid')}
              />
            </FilterSection>

            {/* Min Seats Filter */}
            <FilterSection title="Minimum Seats">
              <FilterChip
                label="Any"
                value=""
                selected={!filters.minSeats}
                onPress={() => onFilterChange('minSeats', '')}
              />
              <FilterChip
                label="2+"
                value="2"
                selected={filters.minSeats === '2'}
                onPress={() => onFilterChange('minSeats', '2')}
              />
              <FilterChip
                label="4+"
                value="4"
                selected={filters.minSeats === '4'}
                onPress={() => onFilterChange('minSeats', '4')}
              />
              <FilterChip
                label="5+"
                value="5"
                selected={filters.minSeats === '5'}
                onPress={() => onFilterChange('minSeats', '5')}
              />
              <FilterChip
                label="7+"
                value="7"
                selected={filters.minSeats === '7'}
                onPress={() => onFilterChange('minSeats', '7')}
              />
            </FilterSection>

            {/* Price Range Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Price Range
              </Text>
              
              {/* Min Price Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.sliderLabel, { color: theme.colors.text }]}>
                    Minimum Price
                  </Text>
                  <Text style={[styles.sliderValue, { color: theme.colors.primary }]}>
                    {formatPrice(minPriceValue)}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={MIN_PRICE}
                  maximumValue={maxPriceValue}
                  value={minPriceValue}
                  step={STEP}
                  onValueChange={handleMinPriceChange}
                  onSlidingComplete={handleMinPriceComplete}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.primary}
                />
                <View style={styles.sliderRange}>
                  <Text style={[styles.rangeText, { color: theme.colors.textSecondary }]}>
                    {formatPrice(MIN_PRICE)}
                  </Text>
                  <Text style={[styles.rangeText, { color: theme.colors.textSecondary }]}>
                    {formatPrice(maxPriceValue)}
                  </Text>
                </View>
              </View>

              {/* Max Price Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.sliderLabel, { color: theme.colors.text }]}>
                    Maximum Price
                  </Text>
                  <Text style={[styles.sliderValue, { color: theme.colors.primary }]}>
                    {formatPrice(maxPriceValue)}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={minPriceValue}
                  maximumValue={MAX_PRICE}
                  value={maxPriceValue}
                  step={STEP}
                  onValueChange={handleMaxPriceChange}
                  onSlidingComplete={handleMaxPriceComplete}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.primary}
                />
                <View style={styles.sliderRange}>
                  <Text style={[styles.rangeText, { color: theme.colors.textSecondary }]}>
                    {formatPrice(minPriceValue)}
                  </Text>
                  <Text style={[styles.rangeText, { color: theme.colors.textSecondary }]}>
                    {formatPrice(MAX_PRICE)}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.colors.background }}>
            <View style={[styles.drawerFooter, { borderTopColor: theme.colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={() => {
                  // Reset slider values
                  setMinPriceValue(MIN_PRICE);
                  setMaxPriceValue(MAX_PRICE);
                  
                  // Create empty filters object
                  const emptyFilters = {
                    brand: '',
                    type: '',
                    transmission: '',
                    fuelType: '',
                    minSeats: '',
                    minPrice: '',
                    maxPrice: '',
                  };
                  
                  // Clear filters in parent component
                  onClearAll();
                  
                  // Apply empty filters and close drawer
                  onApply(emptyFilters);
                  handleClose();
                }}
              >
                <Text style={[styles.clearButtonText, { color: theme.colors.text }]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  // Ensure slider values are synced before applying
                  const minPriceStr = minPriceValue === MIN_PRICE ? '' : minPriceValue.toString();
                  const maxPriceStr = maxPriceValue === MAX_PRICE ? '' : maxPriceValue.toString();

                  // Create updated filters object with current slider values
                  const updatedFilters = {
                    ...filters,
                    minPrice: minPriceStr,
                    maxPrice: maxPriceStr,
                  };
                  
                  // Update tempFilters to keep them in sync
                  onFilterChange('minPrice', minPriceStr);
                  onFilterChange('maxPrice', maxPriceStr);
                  
                  // Always pass updated filters directly to onApply to avoid state timing issues
                  console.log('FilterDrawer - Calling onApply with updatedFilters:', JSON.stringify(updatedFilters, null, 2));
                  onApply(updatedFilters);
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
    width: width,
    maxHeight: height * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 1000,
    position: 'absolute',
    bottom: 0,
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
  sliderContainer: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeText: {
    fontSize: 12,
  },
});

export default FilterDrawer;

