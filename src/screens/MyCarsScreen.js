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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { carAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import ConfirmModal from '@/components/ConfirmModal';

const MyCarsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [carToDelete, setCarToDelete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadCars();
    }, [])
  );

  const loadCars = async () => {
    try {
      setLoading(true);
      const data = await carAPI.getMyCars({ per_page: 50 });
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
      setErrorMessage('Failed to load your cars');
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
    // Navigate to edit car screen (you can create this later)
    // For now, show an alert
    Alert.alert('Edit Car', 'Edit functionality will be implemented');
    // navigation.navigate('EditCar', { carId: car.id });
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
    <View style={[styles.carCard, { backgroundColor: theme.colors.cardBackground }]}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
        style={styles.carImageContainer}
      >
        <Image
          source={{ uri: getCarImageUrl(item) }}
          style={styles.carImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <View style={styles.carInfo}>
        <Text style={[styles.carName, { color: theme.colors.text }]} numberOfLines={1}>
          {item.name || 'Car Name'}
        </Text>
        <Text style={[styles.carBrand, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {item.brand?.name || item.brand || 'Brand'}
        </Text>
        <Text style={[styles.carPrice, { color: theme.colors.primary }]}>
          {formatPrice(item.price_per_day, item.price)}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleEdit(item)}
        >
          <Icon name="edit" size={18} color="#fff" />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: '#ff4444' }]}
          onPress={() => handleDelete(item)}
        >
          <Icon name="delete" size={18} color="#fff" />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Cars</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            // Navigate to add car screen (you can create this later)
            Alert.alert('Add Car', 'Add car functionality will be implemented');
            // navigation.navigate('AddCar');
          }}
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Car</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cars}
        renderItem={renderCarItem}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  carCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carImageContainer: {
    width: '100%',
    height: 200,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carBrand: {
    fontSize: 14,
    marginBottom: 8,
  },
  carPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    color: '#fff',
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
  },
});

export default MyCarsScreen;

