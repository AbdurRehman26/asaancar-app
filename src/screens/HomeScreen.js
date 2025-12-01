import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { carAPI, carBrandAPI, carTypeAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ServiceTabs from '@/components/ServiceTabs';
import Dropdown from '@/components/Dropdown';
import FilterDrawer from '@/components/FilterDrawer';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [filters, setFilters] = useState({
    brand: '',
    type: '',
    transmission: '',
    fuelType: '',
    minSeats: '',
    minPrice: '',
    maxPrice: '',
  });
  const [showFilters, setShowFilters] = useState(false); // Filter drawer visibility
  const [tempFilters, setTempFilters] = useState(filters); // Temporary filters for drawer
  const [activeServiceTab, setActiveServiceTab] = useState('rental');

  // Update active tab when screen is focused
  useFocusEffect(
    useCallback(() => {
      setActiveServiceTab('rental');
    }, [])
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [apiCurrentPage, setApiCurrentPage] = useState(1); // Current page from API
  const [lastPage, setLastPage] = useState(1);
  const [totalCars, setTotalCars] = useState(0);
  const [pageSize] = useState(9); // 9 cars per page
  const flatListRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // Handle service tab change
  const handleServiceTabChange = (tab) => {
    setActiveServiceTab(tab);
    if (tab === 'pickdrop') {
      navigation.navigate('PickDrop');
    } else if (tab === 'rental') {
      navigation.navigate('RentalCars');
    }
  };

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    loadCars();
  }, [filters, currentPage]);

  const loadData = async () => {
    try {
      const [brandsData, typesData] = await Promise.all([
        carBrandAPI.getBrands(),
        carTypeAPI.getTypes(),
      ]);
      const brandsArray = Array.isArray(brandsData?.data) 
        ? brandsData.data 
        : Array.isArray(brandsData) 
        ? brandsData 
        : [];
      const typesArray = Array.isArray(typesData?.data) 
        ? typesData.data 
        : Array.isArray(typesData) 
        ? typesData 
        : [];
      setBrands(brandsArray);
      setTypes(typesArray);
    } catch (error) {
      console.error('Error loading data:', error);
      setBrands([]);
      setTypes([]);
    }
  };

  const loadCars = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: currentPage,
        per_page: pageSize,
      };
      const data = await carAPI.getCars(params);
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
      
      // Handle pagination - check for current_page and last_page
      let currentPageValue = 1;
      let lastPageValue = 1;
      
      if (data?.pagination) {
        currentPageValue = data.pagination.current_page || data.pagination.page || 1;
        lastPageValue = data.pagination.last_page || 1;
      } else if (data?.meta) {
        currentPageValue = data.meta.current_page || data.meta.page || 1;
        lastPageValue = data.meta.last_page || 1;
      } else if (data?.data?.pagination) {
        currentPageValue = data.data.pagination.current_page || data.data.pagination.page || 1;
        lastPageValue = data.data.pagination.last_page || 1;
      } else if (data?.current_page) {
        currentPageValue = data.current_page;
        lastPageValue = data.last_page || 1;
      }
      
      setApiCurrentPage(currentPageValue);
      setLastPage(lastPageValue);
      
      // Get total cars count
      if (data?.pagination?.total) {
        setTotalCars(data.pagination.total);
      } else if (data?.meta?.total) {
        setTotalCars(data.meta.total);
      } else if (data?.data?.pagination?.total) {
        setTotalCars(data.data.pagination.total);
      } else {
        setTotalCars(carsData.length);
      }
    } catch (error) {
      console.error('Error loading cars:', error);
      setCars([]);
      setTotalPages(1);
      setTotalCars(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCars();
  };

  const clearFilters = () => {
    const emptyFilters = {
      brand: '',
      type: '',
      transmission: '',
      fuelType: '',
      minSeats: '',
      minPrice: '',
      maxPrice: '',
    };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
  };

  const handleFilterChange = (key, value) => {
    setTempFilters({ ...tempFilters, [key]: value });
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1); // Reset to first page when filters change
    setCars([]); // Clear cars when filters change
  };


  const openFilters = () => {
    setTempFilters(filters); // Sync temp filters with current filters
    setShowFilters(true);
  };

  const closeFilters = () => {
    setShowFilters(false);
  };

  // Helper function to format price (handles object or number/string)
  const formatPrice = (pricePerDay, price) => {
    let priceValue = '0';
    let currency = 'PKR';
    
    if (pricePerDay) {
      if (typeof pricePerDay === 'object') {
        // Handle nested structure: price.perDay.withDriver
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
        // Handle nested structure: price.perDay.withDriver
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
    
    return { priceValue, currency };
  };

  // Helper function to get car image URL
  const getCarImageUrl = (car) => {
    // Use image from API if available (can be full URL or relative path)
    if (car.image) {
      // If it's already a full URL, use it directly
      if (car.image.startsWith('http://') || car.image.startsWith('https://')) {
        return car.image;
      }
      // If it's a relative path, prepend the base URL
      if (car.image.startsWith('/')) {
        return `https://asaancar.com${car.image}`;
      }
      // If it's just a filename or path, prepend the base URL
      return `https://asaancar.com/${car.image}`;
    }
    
    // Fallback to placeholder if no image is provided
    return 'https://via.placeholder.com/300x200?text=Car+Image';
  };

  const renderCarItem = ({ item }) => {
    return (
    <TouchableOpacity
      style={[styles.carCard, { borderColor: theme.colors.primary }]}
      onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: getCarImageUrl(item),
          }}
          style={styles.carImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.carInfo}>
        <Text style={styles.carName}>
          {item.name || 'Car Name'}
        </Text>
        <Text style={styles.carBrand}>
          {item.brand?.name || 'Brand'}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: theme.colors.primary }]}>
            {(() => {
              const { priceValue, currency } = formatPrice(item.pricePerDay, item.price);
              return `${currency} ${priceValue}/day`;
            })()}
          </Text>
        </View>
        {(item.store || item.dealer) && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.dealerInfo}
              onPress={() => {
                const storeId = item.store?.id || item.dealer?.id || item.store_id;
                if (storeId) {
                  navigation.navigate('StoreProfile', { storeId });
                }
              }}
            >
              <Icon name="store" size={16} color="#666" />
              <View style={styles.dealerDetails}>
                <Text style={styles.rentalProvider}>
                  {item.store?.name || item.dealer?.name || 'N/A'}
                </Text>
                {(item.store?.address || item.dealer?.address) && (
                  <Text style={styles.address} numberOfLines={2}>
                    {item.store?.address || item.dealer?.address}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  const dynamicStyles = {
    container: { backgroundColor: theme.colors.backgroundTertiary },
    header: {
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: { color: theme.colors.secondary },
    loginButton: { backgroundColor: theme.colors.primary },
    filterChipActive: { backgroundColor: theme.colors.secondary },
    price: { color: theme.colors.primary },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
            <Text style={styles.pageTitle}>Available Cars</Text>
            <Text style={styles.pageSubtitle}>
              Find the perfect car for your journey. Modern, clean, and easy booking experience.
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!user && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={[styles.loginButton, dynamicStyles.loginButton]}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <ServiceTabs
          activeTab={activeServiceTab}
          onTabChange={handleServiceTabChange}
        />
      </View>

      {/* Filter Button and Info Banner */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[styles.filterButton, { borderColor: theme.colors.primary }]}
          onPress={openFilters}
        >
          <Icon name="tune" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.infoBanner}>
          <Icon name="info" size={16} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {totalCars} cars available
          </Text>
        </View>
      </View>

      {/* Pagination Info */}
      {!loading && cars.length > 0 && (
        <View style={[styles.paginationInfo, { backgroundColor: theme.colors.cardBackground, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.paginationText, { color: theme.colors.textSecondary }]}>
            {(() => {
              const startNumber = (apiCurrentPage - 1) * pageSize + 1;
              const endNumber = Math.min(apiCurrentPage * pageSize, totalCars);
              return totalCars > 0 
                ? `Showing ${startNumber}-${endNumber} of ${totalCars}`
                : `Showing ${startNumber}-${endNumber}`;
            })()}
          </Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
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
              <Icon name="directions-car" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No cars found</Text>
            </View>
          }
        />
      )}

      {/* Pagination Controls */}
      {!loading && cars.length > 0 && (
        <View style={[styles.paginationContainer, { backgroundColor: theme.colors.cardBackground, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: theme.colors.backgroundSecondary },
              currentPage === 1 && styles.paginationButtonDisabled,
            ]}
            onPress={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
              }
            }}
            disabled={currentPage === 1}
          >
            <Icon name="chevron-left" size={20} color={currentPage === 1 ? theme.colors.textLight : theme.colors.text} />
            <Text style={[styles.paginationButtonText, { color: currentPage === 1 ? theme.colors.textLight : theme.colors.text }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: theme.colors.backgroundSecondary },
              currentPage >= lastPage && styles.paginationButtonDisabled,
            ]}
            onPress={() => {
              if (currentPage < lastPage) {
                setCurrentPage(currentPage + 1);
              }
            }}
            disabled={currentPage >= lastPage}
          >
            <Text style={[styles.paginationButtonText, { color: currentPage >= lastPage ? theme.colors.textLight : theme.colors.text }]}>Next</Text>
            <Icon name="chevron-right" size={20} color={currentPage >= lastPage ? theme.colors.textLight : theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        visible={showFilters}
        onClose={closeFilters}
        filters={tempFilters}
        onFilterChange={handleFilterChange}
        onClearAll={clearFilters}
        onApply={handleApplyFilters}
        brands={brands}
        types={types}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitleSection: {
    flex: 1,
    marginRight: 16,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7e246c',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#7e246c',
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    gap: 16,
  },
  carCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  carBrand: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  dealerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dealerDetails: {
    flex: 1,
  },
  rentalProvider: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
    fontWeight: '500',
  },
  address: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  carDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7e246c',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  paginationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;

