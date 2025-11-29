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
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const PickDropFilterDrawer = ({ 
  visible, 
  onClose, 
  filters, 
  onFilterChange, 
  onClearAll, 
  onApply 
}) => {
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
            {/* Start Location Filter */}
            <FilterSection title="Start Location">
              <FilterChip
                label="Any Location"
                value=""
                selected={!filters.startLocation}
                onPress={() => onFilterChange('startLocation', '')}
              />
              <FilterChip
                label="North Nazimabad"
                value="north-nazimabad"
                selected={filters.startLocation === 'north-nazimabad'}
                onPress={() => onFilterChange('startLocation', 'north-nazimabad')}
              />
              <FilterChip
                label="Yaseenabad"
                value="yaseenabad"
                selected={filters.startLocation === 'yaseenabad'}
                onPress={() => onFilterChange('startLocation', 'yaseenabad')}
              />
              <FilterChip
                label="Saadabad"
                value="saadabad"
                selected={filters.startLocation === 'saadabad'}
                onPress={() => onFilterChange('startLocation', 'saadabad')}
              />
              <FilterChip
                label="Clifton"
                value="clifton"
                selected={filters.startLocation === 'clifton'}
                onPress={() => onFilterChange('startLocation', 'clifton')}
              />
              <FilterChip
                label="Bahria Town"
                value="bahria-town"
                selected={filters.startLocation === 'bahria-town'}
                onPress={() => onFilterChange('startLocation', 'bahria-town')}
              />
            </FilterSection>

            {/* End Location Filter */}
            <FilterSection title="End Location">
              <FilterChip
                label="Any Location"
                value=""
                selected={!filters.endLocation}
                onPress={() => onFilterChange('endLocation', '')}
              />
              <FilterChip
                label="Al-Jadeed Greens"
                value="al-jadeed-greens"
                selected={filters.endLocation === 'al-jadeed-greens'}
                onPress={() => onFilterChange('endLocation', 'al-jadeed-greens')}
              />
              <FilterChip
                label="Bahria Town Karachi"
                value="bahria-town-karachi"
                selected={filters.endLocation === 'bahria-town-karachi'}
                onPress={() => onFilterChange('endLocation', 'bahria-town-karachi')}
              />
              <FilterChip
                label="Blue Sky Residency"
                value="blue-sky-residency"
                selected={filters.endLocation === 'blue-sky-residency'}
                onPress={() => onFilterChange('endLocation', 'blue-sky-residency')}
              />
              <FilterChip
                label="Gulistan-e-Zafar"
                value="gulistan-e-zafar"
                selected={filters.endLocation === 'gulistan-e-zafar'}
                onPress={() => onFilterChange('endLocation', 'gulistan-e-zafar')}
              />
            </FilterSection>

            {/* Driver Gender Filter */}
            <FilterSection title="Driver Gender">
              <FilterChip
                label="All"
                value=""
                selected={!filters.driverGender}
                onPress={() => onFilterChange('driverGender', '')}
              />
              <FilterChip
                label="Male"
                value="male"
                selected={filters.driverGender === 'male'}
                onPress={() => onFilterChange('driverGender', 'male')}
              />
              <FilterChip
                label="Female"
                value="female"
                selected={filters.driverGender === 'female'}
                onPress={() => onFilterChange('driverGender', 'female')}
              />
            </FilterSection>

            {/* Departure Time Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Departure Time
              </Text>
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

            {/* Departure Date Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Departure Date
              </Text>
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

export default PickDropFilterDrawer;

