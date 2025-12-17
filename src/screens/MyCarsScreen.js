import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { carAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

const MyCarsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, loading: authLoading } = useAuth(); // Get user and loading state
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadCars();
      } else if (!authLoading) {
        setLoading(false); // Stop loading if not logged in
        setCars([]);
      }
    }, [user, authLoading])
  );

  const loadCars = async () => {
    if (!user) return; // Double check
    try {
      setLoading(true);
      const data = await carAPI.getMyCars({ per_page: 50 });
      // ... same logic ...
      let carsData = [];

      // Handle different response structures
      if (data) {
        if (Array.isArray(data.data)) {
          carsData = data.data;
        } else if (Array.isArray(data)) {
          carsData = data;
        } else if (data.cars && Array.isArray(data.cars)) {
          carsData = data.cars;
        } else if (data.data?.data && Array.isArray(data.data.data)) {
          carsData = data.data.data;
        }
      }

      setCars(carsData);
    } catch (error) {
      console.error('Error loading my cars:', error);
      if (error.response && error.response.status === 401) {
        // Token might be expired or invalid
        setErrorMessage('Session expired. Please login again.');
      } else {
        setErrorMessage('Failed to load your cars');
      }
      setShowErrorModal(true);
      setCars([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCars();
  };

  const handleEdit = (car) => {
    navigation.navigate('AddCar', { carId: car.id, isEditing: true });
  };

  const handleDelete = (car) => {
    setCarToDelete(car);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!carToDelete) return;

    try {
      await carAPI.deleteCar(carToDelete.id);
      setSuccessMessage('Car deleted successfully');
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      setCarToDelete(null);
      loadCars();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to delete car');
      setShowErrorModal(true);
      setShowDeleteModal(false);
    }
  };

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
    return 'https://via.placeholder.com/300x200?text=Car+Image';
  };

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

    const numPrice = parseFloat(priceValue);
    if (!isNaN(numPrice)) {
      return `${currency} ${numPrice.toLocaleString()}/day`;
    }
    return `${currency} ${priceValue}/day`;
  };

  const renderCarItem = ({ item }) => (
    <View style={[styles.carCard, { backgroundColor: theme.colors.cardBackground, shadowColor: theme.colors.shadow || '#000' }]}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
        style={styles.cardContent}
        activeOpacity={0.9}
      >
        <View style={[styles.imageContainer, { backgroundColor: theme.colors.backgroundSecondary || '#f5f5f5' }]}>
          <Image
            source={{ uri: getCarImageUrl(item) }}
            style={styles.carImage}
            resizeMode="contain"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              {formatPrice(item.price_per_day, item.price)}
            </Text>
          </View>
        </View>

        <View style={styles.carInfo}>
          <View style={styles.infoHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.carBrand, { color: theme.colors.primary }]} numberOfLines={1}>
                {item.brand?.name || item.brand || 'Brand'}
              </Text>
              <Text style={[styles.carName, { color: theme.colors.text }]} numberOfLines={1}>
                {item.name || 'Car Name'}
              </Text>
            </View>
          </View>

          {/* Add dummy specs if real ones aren't available to complete the look, or just hide */}
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Icon name="local-gas-station" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.specText, { color: theme.colors.textSecondary }]}>{item.fuel_type || 'Petrol'}</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Icon name="settings" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.specText, { color: theme.colors.textSecondary }]}>{item.transmission || 'Automatic'}</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Icon name="people" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.specText, { color: theme.colors.textSecondary }]}>{item.seats || '4 Seats'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.actionDivider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="edit" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Edit Car</Text>
          </TouchableOpacity>

          <View style={[styles.verticalDivider, { backgroundColor: theme.colors.border }]} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#ff444415' }]}>
              <Icon name="delete-outline" size={20} color="#ff4444" />
            </View>
            <Text style={[styles.actionText, { color: '#ff4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (authLoading || (loading && !refreshing && user)) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsMain')} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="lock" size={64} color={theme.colors.border} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>Login Required</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
            Please login to manage your cars
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.addButtonText}>Login Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate('SettingsMain')} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Cars</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            navigation.navigate('AddCar');
          }}
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Car</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cars}
        renderItem={renderCarItem}
        // ... rest of list ...
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="directions-car" size={64} color={theme.colors.border} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No cars found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Add your first car to get started
            </Text>
          </View>
        }
      />

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

      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCarToDelete(null);
        }}
        title="Delete Car"
        message={`Are you sure you want to delete "${carToDelete?.name || 'this car'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="#ff4444"
        destructive={true}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
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
    padding: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 40,
  },
  carCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardContent: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  priceTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
  },
  priceText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  carInfo: {
    padding: 16,
    paddingBottom: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  carBrand: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  carName: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 13,
    fontWeight: '500',
  },
  specDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginHorizontal: 8,
  },
  actionDivider: {
    height: 1,
    width: '100%',
    opacity: 0.1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  verticalDivider: {
    width: 1,
    height: '60%',
    opacity: 0.1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
});

export default MyCarsScreen;


