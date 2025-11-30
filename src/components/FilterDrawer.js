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
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const FilterDrawer = ({ visible, onClose, filters, onFilterChange, onClearAll, onApply, brands, types }) => {
  const { theme } = useTheme();
  const [slideAnim] = React.useState(new Animated.Value(height));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const FilterChip = ({ label, value, selected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : '#f0f0f0',
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
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
          <View style={styles.drawerHeader}>
            <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>
              Filters
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.drawerContent}
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

            {/* Min Price Filter */}
            <FilterSection title="Minimum Price">
              <FilterChip
                label="Any Price"
                value=""
                selected={!filters.minPrice}
                onPress={() => onFilterChange('minPrice', '')}
              />
              <FilterChip
                label="1,000 PKR"
                value="1000"
                selected={filters.minPrice === '1000'}
                onPress={() => onFilterChange('minPrice', '1000')}
              />
              <FilterChip
                label="3,000 PKR"
                value="3000"
                selected={filters.minPrice === '3000'}
                onPress={() => onFilterChange('minPrice', '3000')}
              />
              <FilterChip
                label="5,000 PKR"
                value="5000"
                selected={filters.minPrice === '5000'}
                onPress={() => onFilterChange('minPrice', '5000')}
              />
              <FilterChip
                label="10,000 PKR"
                value="10000"
                selected={filters.minPrice === '10000'}
                onPress={() => onFilterChange('minPrice', '10000')}
              />
              <FilterChip
                label="15,000 PKR"
                value="15000"
                selected={filters.minPrice === '15000'}
                onPress={() => onFilterChange('minPrice', '15000')}
              />
              <FilterChip
                label="20,000 PKR"
                value="20000"
                selected={filters.minPrice === '20000'}
                onPress={() => onFilterChange('minPrice', '20000')}
              />
              <FilterChip
                label="25,000 PKR"
                value="25000"
                selected={filters.minPrice === '25000'}
                onPress={() => onFilterChange('minPrice', '25000')}
              />
              <FilterChip
                label="30,000 PKR"
                value="30000"
                selected={filters.minPrice === '30000'}
                onPress={() => onFilterChange('minPrice', '30000')}
              />
            </FilterSection>

            {/* Max Price Filter */}
            <FilterSection title="Maximum Price">
              <FilterChip
                label="Any Price"
                value=""
                selected={!filters.maxPrice}
                onPress={() => onFilterChange('maxPrice', '')}
              />
              <FilterChip
                label="3,000 PKR"
                value="3000"
                selected={filters.maxPrice === '3000'}
                onPress={() => onFilterChange('maxPrice', '3000')}
              />
              <FilterChip
                label="6,000 PKR"
                value="6000"
                selected={filters.maxPrice === '6000'}
                onPress={() => onFilterChange('maxPrice', '6000')}
              />
              <FilterChip
                label="10,000 PKR"
                value="10000"
                selected={filters.maxPrice === '10000'}
                onPress={() => onFilterChange('maxPrice', '10000')}
              />
              <FilterChip
                label="15,000 PKR"
                value="15000"
                selected={filters.maxPrice === '15000'}
                onPress={() => onFilterChange('maxPrice', '15000')}
              />
              <FilterChip
                label="20,000 PKR"
                value="20000"
                selected={filters.maxPrice === '20000'}
                onPress={() => onFilterChange('maxPrice', '20000')}
              />
              <FilterChip
                label="25,000 PKR"
                value="25000"
                selected={filters.maxPrice === '25000'}
                onPress={() => onFilterChange('maxPrice', '25000')}
              />
              <FilterChip
                label="30,000 PKR"
                value="30000"
                selected={filters.maxPrice === '30000'}
                onPress={() => onFilterChange('maxPrice', '30000')}
              />
              <FilterChip
                label="50,000 PKR"
                value="50000"
                selected={filters.maxPrice === '50000'}
                onPress={() => onFilterChange('maxPrice', '50000')}
              />
            </FilterSection>
          </ScrollView>

          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: '#f0f0f0' }]}
              onPress={onClearAll}
            >
              <Text style={[styles.clearButtonText, { color: theme.colors.text }]}>
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                onApply();
                handleClose();
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
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
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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

export default FilterDrawer;

