import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { driversAPI, locationAPI } from '@/services/api';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';
import ErrorModal from '@/components/ErrorModal';

const DriversScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCityName, setSelectedCityName] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [cities, setCities] = useState([]);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const pageSize = 12;

  useFocusEffect(
    useCallback(() => {
      loadDrivers(1);
    }, [selectedCityId, selectedGender])
  );

  const loadDrivers = async (page = 1) => {
    try {
      setLoading(true);
      const data = await driversAPI.getDrivers({
        page,
        per_page: pageSize,
        city_id: selectedCityId,
        gender: selectedGender,
      });

      let driversData = [];
      if (Array.isArray(data?.data)) {
        driversData = data.data;
      } else if (Array.isArray(data)) {
        driversData = data;
      }

      const meta = data?.meta || data?.data?.meta || {};
      setDrivers(driversData);
      setCurrentPage(Number(meta.current_page || page) || 1);
      setTotalPages(Number(meta.last_page || 1) || 1);
      setTotalDrivers(Number(meta.total || driversData.length || 0) || 0);
    } catch (error) {
      console.error('Error loading drivers:', error);
      setDrivers([]);
      setTotalPages(1);
      setTotalDrivers(0);
      setErrorMessage(error?.response?.data?.message || t('drivers.loadError'));
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (service) => {
    if (!service?.price_per_person) {
      return null;
    }

    const currency = service.currency || 'PKR';
    return `${currency} ${service.price_per_person}`;
  };

  const getDriverImage = (driver) =>
    driver?.profile_image || null;

  const getDriverCity = (driver) =>
    driver?.city?.name ||
    driver?.city?.city ||
    driver?.city_name ||
    driver?.city ||
    '';

  const filteredCities = cities.filter((city) =>
    city.name?.toLowerCase().includes(citySearchQuery.trim().toLowerCase())
  );

  const loadCities = async () => {
    if (cities.length > 0) {
      return;
    }

    try {
      setLoadingCities(true);
      const response = await locationAPI.getCities();
      setCities(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || t('cityPrompt.loadError'));
      setShowErrorModal(true);
    } finally {
      setLoadingCities(false);
    }
  };

  const openCityModal = async () => {
    setCitySearchQuery('');
    setIsCityModalVisible(true);
    await loadCities();
  };

  const openDriverProfile = (driverId) => {
    navigation.navigate('DriverProfile', { driverId });
  };

  const openLatestRide = (serviceId) => {
    navigation.navigate('PickDropDetail', { serviceId });
  };

  const openAddDriver = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    navigation.navigate('DriverVehicleOnboarding');
  };

  const renderDriverItem = ({ item }) => {
    const latestService = item?.latest_service;
    const latestPrice = formatCurrency(latestService);
    const driverCity = getDriverCity(item);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => openDriverProfile(item.id)}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(29, 22, 36, 0.82)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(232, 170, 220, 0.28)' : 'rgba(157, 58, 138, 0.16)',
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.driverIdentity}>
            <View style={[styles.avatarWrap, { backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border }]}>
              {getDriverImage(item) ? (
                <Image source={{ uri: getDriverImage(item) }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>
                  {(item?.name || 'D').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            <View style={styles.headerTextBlock}>
              <Text style={[styles.driverName, { color: theme.colors.text }]} numberOfLines={1}>
                {item?.name || t('drivers.driver')}
              </Text>
              <Text style={[styles.driverMeta, { color: theme.colors.textSecondary }]}>
                {t('drivers.activeRides', { count: item?.active_services_count || 0 })}
              </Text>
              {driverCity ? (
                <Text style={[styles.driverMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {driverCity}
                </Text>
              ) : null}
            </View>
          </View>

          <Icon name="chevron-right" size={22} color={theme.colors.textSecondary} />
        </View>

        {latestService ? (
          <View style={[styles.latestRideCard, { backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border }]}>
            <Text style={[styles.latestRideLabel, { color: theme.colors.textSecondary }]}>
              {t('drivers.latestRide')}
            </Text>
            <Text style={[styles.routeText, { color: theme.colors.text }]} numberOfLines={2}>
              {latestService.start_location} {t('drivers.routeSeparator')} {latestService.end_location}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaPill, { color: theme.colors.textSecondary, backgroundColor: theme.colors.cardBackground }]}>
                {latestService.formatted_departure_time}
              </Text>
              {latestPrice ? (
                <Text style={[styles.metaPill, { color: theme.colors.primary, backgroundColor: theme.colors.cardBackground }]}>
                  {latestPrice}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }]}
            onPress={() => openDriverProfile(item.id)}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
              {t('drivers.viewProfile')}
            </Text>
          </TouchableOpacity>
          {latestService?.id ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => openLatestRide(latestService.id)}
            >
              <Text style={styles.primaryButtonText}>{t('drivers.viewRide')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
      <PageHeader title={t('drivers.title')} />

      <FlatList
        data={drivers}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        renderItem={renderDriverItem}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <TouchableOpacity
              style={[styles.addDriverButton, { backgroundColor: theme.colors.primary }]}
              onPress={openAddDriver}
            >
              <Icon name="person-add" size={18} color="#fff" />
              <Text style={styles.addDriverButtonText}>{t('drivers.addDriver')}</Text>
            </TouchableOpacity>
            <View style={styles.filtersWrap}>
              <TouchableOpacity
                style={[styles.cityFilterButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }]}
                onPress={openCityModal}
              >
                <Text
                  style={[
                    styles.cityFilterText,
                    { color: selectedCityName ? theme.colors.text : theme.colors.textSecondary }
                  ]}
                  numberOfLines={1}
                >
                  {selectedCityName || t('drivers.allCities')}
                </Text>
                <Icon name="expand-more" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <View style={styles.genderChipsRow}>
                {[
                  { value: '', label: t('drivers.allGenders') },
                  { value: 'male', label: t('pickDropDetail.maleDriver') },
                  { value: 'female', label: t('pickDropDetail.femaleDriver') },
                ].map((option) => {
                  const isSelected = selectedGender === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value || 'all'}
                      style={[
                        styles.genderChip,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.cardBackground,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => setSelectedGender(option.value)}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          { color: isSelected ? '#fff' : theme.colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {(selectedCityId || selectedGender) ? (
                  <TouchableOpacity
                    style={[styles.clearFilterButton, { borderColor: theme.colors.border }]}
                    onPress={() => {
                      setSelectedCityId(null);
                      setSelectedCityName('');
                      setSelectedGender('');
                    }}
                  >
                    <Text style={[styles.clearFilterText, { color: theme.colors.textSecondary }]}>
                      {t('common.clear')}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            {totalDrivers > 0 ? (
              <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
                {t('drivers.availableDrivers', { count: totalDrivers })}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="person-search" size={60} color={theme.colors.border} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {t('drivers.noDrivers')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              {t('drivers.noDriversSubtitle')}
            </Text>
          </View>
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={[styles.paginationRow, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              <TouchableOpacity
                style={[styles.paginationButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }]}
                onPress={() => loadDrivers(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <Text style={[styles.paginationButtonText, { color: currentPage <= 1 ? theme.colors.textSecondary : theme.colors.text }]}>
                  {t('common.back')}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.paginationText, { color: theme.colors.textSecondary }]}>
                {currentPage} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }]}
                onPress={() => loadDrivers(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <Text style={[styles.paginationButtonText, { color: currentPage >= totalPages ? theme.colors.textSecondary : theme.colors.text }]}>
                  {t('common.next')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      <Modal
        visible={isCityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCityModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.cityModalCard, { backgroundColor: theme.colors.cardBackground }]}
            onPress={() => {}}
          >
            <Text style={[styles.cityModalTitle, { color: theme.colors.text }]}>
              {t('auth.selectCity')}
            </Text>

            <TextInput
              style={[
                styles.citySearchInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                }
              ]}
              placeholder={t('cityPrompt.searchPlaceholder')}
              placeholderTextColor={theme.colors.placeholder}
              value={citySearchQuery}
              onChangeText={setCitySearchQuery}
            />

            {loadingCities ? (
              <View style={styles.cityLoader}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredCities}
                keyExtractor={(item) => item.id?.toString() || item.name}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                  <TouchableOpacity
                    style={[
                      styles.cityOption,
                      !selectedCityId && { backgroundColor: theme.colors.primary + '18' },
                    ]}
                    onPress={() => {
                      setSelectedCityId(null);
                      setSelectedCityName('');
                      setIsCityModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.cityOptionText,
                        { color: !selectedCityId ? theme.colors.primary : theme.colors.text },
                      ]}
                    >
                      {t('drivers.allCities')}
                    </Text>
                  </TouchableOpacity>
                }
                ListEmptyComponent={
                  <Text style={[styles.cityEmptyText, { color: theme.colors.textSecondary }]}>
                    {t('common.noResults')}
                  </Text>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedCityId === item.id;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.cityOption,
                        isSelected && { backgroundColor: theme.colors.primary + '18' },
                      ]}
                      onPress={() => {
                        setSelectedCityId(item.id);
                        setSelectedCityName(item.name);
                        setIsCityModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.cityOptionText,
                          { color: isSelected ? theme.colors.primary : theme.colors.text },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  listContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  listHeader: {
    marginBottom: 12,
  },
  filtersWrap: {
    marginBottom: 12,
    gap: 10,
  },
  addDriverButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addDriverButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  cityFilterButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityFilterText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  genderChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearFilterButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerTextBlock: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  driverMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  latestRideCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  latestRideLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 20,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paginationButton: {
    minWidth: 84,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  cityModalCard: {
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  cityModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  citySearchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    marginBottom: 12,
  },
  cityLoader: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityOption: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
  },
  cityOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  cityEmptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    fontSize: 14,
  },
});

export default DriversScreen;
