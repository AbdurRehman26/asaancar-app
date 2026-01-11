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
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { carAPI, carBrandAPI, carTypeAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ServiceTabs from '@/components/ServiceTabs';
import Dropdown from '@/components/Dropdown';
import FilterDrawer from '@/components/FilterDrawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
    setTempFilters((prev) => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
  };

  const handleApplyFilters = (updatedFilters = null) => {
    // Accept optional updatedFilters parameter to handle slider values
    const filtersToApply = updatedFilters || tempFilters;

    // Create a completely new object to ensure React detects the change
    const newFilters = {
      brand: filtersToApply.brand || '',
      type: filtersToApply.type || '',
      transmission: filtersToApply.transmission || '',
      fuelType: filtersToApply.fuelType || '',
      minSeats: filtersToApply.minSeats || '',
      minPrice: filtersToApply.minPrice || '',
      maxPrice: filtersToApply.maxPrice || '',
    };

    console.log('HomeScreen - newFilters to set:', JSON.stringify(newFilters, null, 2));
    setFilters(newFilters); // Create a new object to ensure state update
    setTempFilters(newFilters); // Sync tempFilters as well
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
      <View style={[styles.carCard, { backgroundColor: theme.colors.cardBackground, shadowColor: theme.colors.shadow || '#000' }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
          style={styles.cardContent}
          activeOpacity={0.9}
        >
          <View style={[styles.imageContainer, { backgroundColor: theme.colors.backgroundSecondary || '#f5f5f5' }]}>
            <Image
              source={{
                uri: getCarImageUrl(item),
              }}
              style={styles.carImage}
              resizeMode="contain"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>
                {(() => {
                  const { priceValue, currency } = formatPrice(item.pricePerDay, item.price);
                  return t('home.pricePerDay', { currency, price: priceValue });
                })()}
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

            {/* Specs Row - Only show if data seems somewhat plausible, otherwise it's just decorative icons */}
            <View style={styles.specsRow}>
              <View style={styles.specItem}>
                <Icon name="local-gas-station" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.specText, { color: theme.colors.textSecondary }]}>{item.fuel_type || t('home.petrol')}</Text>
              </View>
              <View style={styles.specDivider} />
              <View style={styles.specItem}>
                <Icon name="settings" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.specText, { color: theme.colors.textSecondary }]}>{item.transmission || t('home.automatic')}</Text>
              </View>
              <View style={styles.specDivider} />
              <View style={styles.specItem}>
                <Icon name="people" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.specText, { color: theme.colors.textSecondary }]}>{item.seats || t('home.seats', { count: 4 })}</Text>
              </View>
            </View>
          </View>

          {/* Dealer/Store Section */}
          {(item.store || item.dealer) && (
            <>
              <View style={[styles.actionDivider, { backgroundColor: theme.colors.border }]} />
              <TouchableOpacity
                style={styles.dealerSection}
                onPress={() => {
                  const storeId = item.store?.id || item.dealer?.id || item.store_id;
                  if (storeId) {
                    navigation.navigate('StoreProfile', { storeId });
                  }
                }}
              >
                <View style={[styles.dealerIconCircle, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Icon name="store" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.dealerInfoText}>
                  <Text style={[styles.dealerLabel, { color: theme.colors.textSecondary }]}>{t('home.providedBy')}</Text>
                  <Text style={[styles.dealerName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.store?.name || item.dealer?.name || t('home.verifiedPartner')}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <View style={[styles.header, dynamicStyles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
          </View>
          <View style={styles.headerActions}>

          </View>
        </View>

        <ServiceTabs
          activeTab={activeServiceTab}
          onTabChange={handleServiceTabChange}
        />
      </View>

      {/* Filter Button and Info Banner */}
      <View style={[styles.filterSection, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.filterButton, { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }]}
          onPress={openFilters}
        >
          <Icon name="tune" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.infoBanner}>
          <Icon name="info" size={16} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {t('home.carsAvailable', { count: totalCars })}
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
                ? t('home.showing', { start: startNumber, end: endNumber, total: totalCars })
                : t('home.showing', { start: startNumber, end: endNumber, total: endNumber });
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
              <Icon name="directions-car" size={64} color={theme.colors.textLight} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('home.noCarsFound')}</Text>
            </View>
          }
        />
      )}

      {/* Pagination Controls */}
      {!loading && cars.length > 0 && (
        <View style={[styles.paginationContainer, { paddingBottom: user ? 8 : Math.max(insets.bottom + 10, 8) }]}>
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
            <Text style={[styles.paginationButtonText, { color: currentPage === 1 ? theme.colors.textLight : theme.colors.text }]}>{t('common.back')}</Text>
          </TouchableOpacity>

          {!user && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={[styles.loginButton, dynamicStyles.loginButton]}
            >
              <Text style={styles.loginButtonText}>{t('common.login')}</Text>
            </TouchableOpacity>
          )}

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
            <Text style={[styles.paginationButtonText, { color: currentPage >= lastPage ? theme.colors.textLight : theme.colors.text }]}>{t('common.next')}</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    paddingBottom: 6,
  },
  headerTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
  themeToggleButton: {
    padding: 4,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: -4,
  },
  infoText: {
    fontSize: 13,
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
  dealerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dealerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealerInfoText: {
    flex: 1,
  },
  dealerLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  dealerName: {
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
    fontSize: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
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

