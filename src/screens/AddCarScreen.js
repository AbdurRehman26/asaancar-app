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
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { carAPI, carBrandAPI, carTypeAPI, storeAPI } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';

const AddCarScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [type, setType] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [seats, setSeats] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [withDriver, setWithDriver] = useState('');
  const [withoutDriver, setWithoutDriver] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);

  // Dropdown data
  const [stores, setStores] = useState([]);
  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [colors, setColors] = useState([]);

  // Dropdown visibility
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showTransmissionDropdown, setShowTransmissionDropdown] = useState(false);
  const [showFuelTypeDropdown, setShowFuelTypeDropdown] = useState(false);

  // Generate years (current year to 20 years back)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearList = [];
    for (let i = currentYear; i >= currentYear - 20; i--) {
      yearList.push(i.toString());
    }
    setYears(yearList);
  }, []);

  // Common colors
  useEffect(() => {
    setColors([
      'Beige', 'Black', 'Blue', 'Brown', 'Gold', 'Gray', 'Green', 'Orange',
      'Pink', 'Purple', 'Red', 'Silver', 'White', 'Yellow'
    ]);
  }, []);

  const transmissions = ['Automatic', 'Manual'];
  const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (brand) {
      loadModels(brand);
    } else {
      setModels([]);
    }
  }, [brand]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [storesData, brandsData, typesData] = await Promise.all([
        storeAPI.getMyStoresList(),
        carBrandAPI.getBrands(),
        carTypeAPI.getTypes(),
      ]);

      // Process stores
      let storesArray = [];
      if (storesData) {
        if (Array.isArray(storesData.data)) {
          storesArray = storesData.data;
        } else if (Array.isArray(storesData)) {
          storesArray = storesData;
        }
      }
      setStores(storesArray);

      // Process brands
      let brandsArray = [];
      if (brandsData) {
        if (Array.isArray(brandsData.data)) {
          brandsArray = brandsData.data;
        } else if (Array.isArray(brandsData)) {
          brandsArray = brandsData;
        }
      }
      setBrands(brandsArray);

      // Process types
      let typesArray = [];
      if (typesData) {
        if (Array.isArray(typesData.data)) {
          typesArray = typesData.data;
        } else if (Array.isArray(typesData)) {
          typesArray = typesData;
        }
      }
      setTypes(typesArray);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadModels = async (brandId) => {
    try {
      // TODO: Implement API call to get models by brand
      // For now, set empty array
      setModels([]);
    } catch (error) {
      console.error('Error loading models:', error);
      setModels([]);
    }
  };

  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images');
      return false;
    }
    return true;
  };

  const handleImageUpload = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit reached', 'You can upload up to 5 images');
      return;
    }

    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.slice(0, 5 - images.length);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      setErrorMessage('Failed to pick images');
      setShowErrorModal(true);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const moveImage = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      setImages(newImages);
    } else if (direction === 'down' && index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      setImages(newImages);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!store) {
      setErrorMessage('Please select a store');
      setShowErrorModal(true);
      return;
    }

    if (!type) {
      setErrorMessage('Please select a type');
      setShowErrorModal(true);
      return;
    }

    if (!brand) {
      setErrorMessage('Please select a brand');
      setShowErrorModal(true);
      return;
    }

    if (!seats || parseInt(seats) < 1) {
      setErrorMessage('Please enter number of seats (minimum 1)');
      setShowErrorModal(true);
      return;
    }

    if (!transmission) {
      setErrorMessage('Please select transmission type');
      setShowErrorModal(true);
      return;
    }

    if (!fuelType) {
      setErrorMessage('Please select fuel type');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      const carData = {
        name: name || null,
        store_id: store,
        type_id: type,
        brand_id: brand,
        model_id: model || null,
        year: year || null,
        color: color || null,
        seats: parseInt(seats),
        transmission: transmission.toLowerCase(),
        fuel_type: fuelType.toLowerCase(),
        price_per_day: {
          withDriver: withDriver ? parseFloat(withDriver) : null,
          withoutDriver: withoutDriver ? parseFloat(withoutDriver) : null,
        },
        description: description || null,
      };

      // TODO: Upload images if any
      // For now, create car without images
      await carAPI.createCar(carData);
      setSuccessMessage('Car added successfully!');
      setShowSuccessModal(true);
      
      // Navigate back after success
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
        error.message ||
        'Failed to create car. Please try again.'
      );
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const renderDropdown = (items, selectedValue, onSelect, visible, setVisible, getLabel = (item) => item.name || item) => (
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
          <ScrollView>
            {items.map((item, index) => {
              const value = item.id || item;
              const label = getLabel(item);
              const isSelected = selectedValue === value || selectedValue === item;
              
              return (
                <TouchableOpacity
                  key={value || index}
                  style={[
                    styles.dropdownOption,
                    isSelected && { backgroundColor: theme.colors.primary + '20' },
                  ]}
                  onPress={() => {
                    onSelect(value);
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
                    {label}
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

  const getSelectedLabel = (items, value, getLabel = (item) => item.name || item) => {
    if (!value) return '';
    const item = items.find((i) => (i.id || i) === value);
    return item ? getLabel(item) : '';
  };

  if (loadingData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.navigate('SettingsMain')} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Add Car</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Name (optional)</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter car name"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        {/* Store */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Store</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.colors.border }]}
            onPress={() => setShowStoreDropdown(true)}
          >
            <Text style={[styles.inputText, { color: store ? theme.colors.text : theme.colors.placeholder }]}>
              {getSelectedLabel(stores, store) || 'Select store'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Type</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.colors.border }]}
            onPress={() => setShowTypeDropdown(true)}
          >
            <Text style={[styles.inputText, { color: type ? theme.colors.text : theme.colors.placeholder }]}>
              {getSelectedLabel(types, type) || 'Select type'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Brand */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Brand</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.colors.border }]}
            onPress={() => setShowBrandDropdown(true)}
          >
            <Text style={[styles.inputText, { color: brand ? theme.colors.text : theme.colors.placeholder }]}>
              {getSelectedLabel(brands, brand) || 'Select brand'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Model */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Model</Text>
          <View style={[styles.input, { borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center' }]}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setShowModelDropdown(true)}
              disabled={!brand}
            >
              <Text style={[styles.inputText, { color: model ? theme.colors.text : theme.colors.placeholder }]}>
                {getSelectedLabel(models, model) || (brand ? 'Select model' : 'Select brand first')}
              </Text>
            </TouchableOpacity>
            {model && (
              <TouchableOpacity
                onPress={() => setModel('')}
                style={styles.clearButton}
              >
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
            <Icon name="keyboard-arrow-down" size={24} color={theme.colors.textSecondary} />
          </View>
        </View>

        {/* Year */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Year</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.colors.border }]}
            onPress={() => setShowYearDropdown(true)}
          >
            <Text style={[styles.inputText, { color: year ? theme.colors.text : theme.colors.placeholder }]}>
              {year || 'Select year'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Color */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Color</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.colors.border }]}
            onPress={() => setShowColorDropdown(true)}
          >
            <Text style={[styles.inputText, { color: color ? theme.colors.text : theme.colors.placeholder }]}>
              {color || 'Select color'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Number of Seats */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Number of Seats</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            value={seats}
            onChangeText={setSeats}
            keyboardType="numeric"
            placeholder="Enter number of seats"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        {/* Transmission */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Transmission</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.colors.border }]}
            onPress={() => setShowTransmissionDropdown(true)}
          >
            <Text style={[styles.inputText, { color: transmission ? theme.colors.text : theme.colors.placeholder }]}>
              {transmission || 'Select transmission'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Fuel Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Fuel Type</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.colors.border }]}
            onPress={() => setShowFuelTypeDropdown(true)}
          >
            <Text style={[styles.inputText, { color: fuelType ? theme.colors.text : theme.colors.placeholder }]}>
              {fuelType || 'Select fuel type'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Rate Details Section */}
        <View style={[styles.rateSection, { backgroundColor: '#F5F5F5' }]}>
          <Text style={[styles.rateSectionTitle, { color: theme.colors.text }]}>Rate Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>With Driver (10 hrs/day)</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              value={withDriver}
              onChangeText={setWithDriver}
              keyboardType="numeric"
              placeholder="e.g., 14000"
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Without Driver (24 hrs/day)</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              value={withoutDriver}
              onChangeText={setWithoutDriver}
              keyboardType="numeric"
              placeholder="e.g., 5000"
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>

          <View style={styles.rateInfo}>
            <Text style={[styles.rateInfoText, { color: theme.colors.primary }]}>
              Refill fuel at the end of the day or pay PKR 32/KM
            </Text>
            <Text style={[styles.rateInfoText, { color: theme.colors.primary }]}>
              Overtime: PKR 400/hr
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { borderColor: theme.colors.border, color: theme.colors.text }]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Describe the car's features, condition, and any special notes..."
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        {/* Car Images */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Car Images</Text>
          <Text style={[styles.imageInfo, { color: theme.colors.textSecondary }]}>
            Images are displayed in upload order. Use ↑↓ buttons to reorder.
          </Text>
          
          <TouchableOpacity
            style={[styles.uploadArea, { borderColor: theme.colors.border }]}
            onPress={handleImageUpload}
          >
            <Icon name="cloud-upload" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.uploadText, { color: theme.colors.text }]}>
              Click to upload or drag and drop
            </Text>
            <Text style={[styles.uploadSubtext, { color: theme.colors.textSecondary }]}>
              PNG, JPG, GIF, WEBP up to 2MB each
            </Text>
            <Text style={[styles.uploadCount, { color: theme.colors.textSecondary }]}>
              {images.length}/5 images uploaded
            </Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={styles.imagesList}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={[styles.imageButton, index === 0 && styles.imageButtonDisabled]}
                      onPress={() => moveImage(index, 'up')}
                      disabled={index === 0}
                    >
                      <Icon name="keyboard-arrow-up" size={20} color={index === 0 ? theme.colors.textLight : theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.imageButton, index === images.length - 1 && styles.imageButtonDisabled]}
                      onPress={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                    >
                      <Icon name="keyboard-arrow-down" size={20} color={index === images.length - 1 ? theme.colors.textLight : theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Icon name="delete" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdowns */}
      {renderDropdown(stores, store, setStore, showStoreDropdown, setShowStoreDropdown)}
      {renderDropdown(types, type, setType, showTypeDropdown, setShowTypeDropdown)}
      {renderDropdown(brands, brand, setBrand, showBrandDropdown, setShowBrandDropdown)}
      {renderDropdown(models, model, setModel, showModelDropdown, setShowModelDropdown)}
      {renderDropdown(years, year, setYear, showYearDropdown, setShowYearDropdown)}
      {renderDropdown(colors, color, setColor, showColorDropdown, setShowColorDropdown)}
      {renderDropdown(transmissions, transmission, setTransmission, showTransmissionDropdown, setShowTransmissionDropdown)}
      {renderDropdown(fuelTypes, fuelType, setFuelType, showFuelTypeDropdown, setShowFuelTypeDropdown)}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
    backgroundColor: '#fff',
  },
  inputText: {
    fontSize: 16,
    flex: 1,
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
  },
  rateSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rateSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  rateInfo: {
    marginTop: 8,
    gap: 4,
  },
  rateInfoText: {
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginTop: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  uploadCount: {
    fontSize: 12,
    marginTop: 8,
  },
  imageInfo: {
    fontSize: 12,
    marginBottom: 8,
  },
  imagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imageItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  imageActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  imageButton: {
    padding: 4,
  },
  imageButtonDisabled: {
    opacity: 0.3,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
});

export default AddCarScreen;

