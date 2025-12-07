import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { carAPI, storeAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';

const StoreProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { storeId } = route.params;
  const [store, setStore] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carsLoading, setCarsLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadStoreDetails();
    loadStoreCars();
  }, [storeId]);

  const loadStoreDetails = async () => {
    try {
      setLoading(true);
      const data = await storeAPI.getStoreById(storeId);
      const storeData = data.data || data;
      
      // Set store with proper structure
      setStore({
        id: storeData.id || storeId,
        name: storeData.name || 'Store Name',
        handle: storeData.handle || storeData.username || `@${(storeData.name || '').toLowerCase().replace(/\s+/g, '')}`,
        description: storeData.description || 'Professional car rental and transport services',
        address: storeData.address || 'N/A',
        phone: storeData.phone || storeData.contact || 'N/A',
        since: storeData.since || storeData.created_at?.substring(0, 4) || 'N/A',
        totalCars: storeData.total_cars || storeData.cars_count || 0,
      });
    } catch (error) {
      console.error('Error loading store details:', error);
      setErrorMessage('Failed to load store details');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreCars = async () => {
    try {
      setCarsLoading(true);
      const data = await carAPI.getCars({ store_id: storeId, per_page: 50 });
      let carsData = [];
      
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
      console.error('Error loading store cars:', error);
      setCars([]);
    } finally {
      setCarsLoading(false);
    }
  };

  // Helper function to get car image URL
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

  // Helper function to format price
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
            currency = price.currency || 'PKR';
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
    
    return { priceValue, currency };
  };

  const renderCarItem = ({ item }) => {
    const { priceValue, currency } = formatPrice(item.pricePerDay, item.price);
    const carName = `${item.brand?.name || 'Brand'} ${item.name || 'Car Name'}`;

    return (
      <TouchableOpacity
        style={[styles.carCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getCarImageUrl(item) }}
            style={styles.carImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.carInfo}>
          <Text style={[styles.carName, { color: theme.colors.text }]} numberOfLines={1}>
            {carName}
          </Text>
          <Text style={[styles.carBrand, { color: theme.colors.textSecondary }]}>
            {item.brand?.name || 'Brand'}
          </Text>
          <Text style={[styles.carPrice, { color: theme.colors.primary }]}>
            {currency} {priceValue}/day
          </Text>
          
          {item.store && (
            <>
              <View style={styles.divider} />
              <View style={styles.dealerInfo}>
                <Icon name="store" size={16} color={theme.colors.textSecondary} />
                <View style={styles.dealerDetails}>
                  <Text style={[styles.dealerName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {item.store.name || 'N/A'}
                  </Text>
                  {item.store.address && (
                    <Text style={[styles.dealerAddress, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {item.store.address}
                    </Text>
                  )}
                </View>
              </View>
            </>
          )}

          <View style={styles.featuresRow}>
            {item.seats && (
              <View style={styles.featureBadge}>
                <Icon name="people" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  {item.seats}
                </Text>
              </View>
            )}
            {item.fuelType && (
              <View style={styles.featureBadge}>
                <Icon name="local-gas-station" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  {item.fuelType.toLowerCase()}
                </Text>
              </View>
            )}
            {item.transmission && (
              <View style={styles.featureBadge}>
                <Icon name="settings" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  {item.transmission.toLowerCase()}
                </Text>
              </View>
            )}
            {item.type?.name && (
              <View style={styles.featureBadge}>
                <Icon name="directions-car" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  {item.type.name.toLowerCase()}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.viewDetailsButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
          >
            <Icon name="directions-car" size={16} color="#fff" />
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.errorText}>Store not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={theme.colors.text} />
        <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
          Back
        </Text>
      </TouchableOpacity>

      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.storeIconContainer}>
            <Icon name="store" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeHandle}>{store.handle || `@${store.name.toLowerCase().replace(/\s+/g, '')}`}</Text>
            <Text style={styles.storeDescription}>{store.description}</Text>
          </View>
        </View>
      </View>

      {/* Information Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          {/* Left Column */}
          <View style={styles.infoColumn}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primary }]}>
                <Icon name="directions-car" size={20} color="#fff" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Total Cars
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {store.totalCars || cars.length}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primary }]}>
                <Icon name="location-on" size={20} color="#fff" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Address
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {store.address || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.infoColumn}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primary }]}>
                <Icon name="calendar-today" size={20} color="#fff" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Since
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {store.since || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primary }]}>
                <Icon name="phone" size={20} color="#fff" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Phone
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {store.phone || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Available Cars Section */}
      <View style={styles.carsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Available Cars
        </Text>
        
        {carsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : cars.length > 0 ? (
          <FlatList
            data={cars}
            renderItem={renderCarItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            numColumns={1}
            scrollEnabled={false}
            contentContainerStyle={styles.carsList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="directions-car" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No cars available</Text>
          </View>
        )}
      </View>

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </ScrollView>
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
    padding: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerBanner: {
    padding: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  storeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  storeHandle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  storeDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 24,
  },
  infoColumn: {
    flex: 1,
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  carsSection: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  carsList: {
    gap: 16,
  },
  carCard: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carInfo: {
    padding: 12,
  },
  carName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carBrand: {
    fontSize: 12,
    marginBottom: 8,
  },
  carPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  dealerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  dealerDetails: {
    flex: 1,
  },
  dealerName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  dealerAddress: {
    fontSize: 11,
    lineHeight: 16,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  featureText: {
    fontSize: 11,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewDetailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 64,
  },
});

export default StoreProfileScreen;

