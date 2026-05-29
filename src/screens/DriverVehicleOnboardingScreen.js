import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';
import ErrorModal from '@/components/ErrorModal';
import { userVehiclesAPI } from '@/services/api';

const VEHICLE_TYPES = ['car', 'bike'];
const TRANSMISSIONS = ['automatic', 'manual'];
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid'];

const DriverVehicleOnboardingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const fromSignup = route.params?.fromSignup || false;

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showNextStepModal, setShowNextStepModal] = useState(false);
  const [savedVehicle, setSavedVehicle] = useState(null);

  const [vehicleType, setVehicleType] = useState('car');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [seats, setSeats] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [showVehicleTypeDropdown, setShowVehicleTypeDropdown] = useState(false);
  const [showTransmissionDropdown, setShowTransmissionDropdown] = useState(false);
  const [showFuelTypeDropdown, setShowFuelTypeDropdown] = useState(false);

  useEffect(() => {
    loadSavedVehicles();
  }, []);

  const loadSavedVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const data = await userVehiclesAPI.listUserVehicles();
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setSavedVehicles(items);
      if (items.length > 0) {
        const defaultVehicle = items.find((item) => item?.is_default) || items[0];
        setIsDefault(false);
        setSavedVehicle(defaultVehicle);
      }
    } catch (error) {
      setSavedVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const existingVehiclesText = useMemo(() => {
    if (!savedVehicles.length) return '';
    return savedVehicles
      .map((item) => {
        const typeLabel = item.vehicle_type === 'bike' ? t('driverOnboarding.bike') : t('driverOnboarding.car');
        const detail = [item.brand, item.model].filter(Boolean).join(' ');
        return detail ? `${typeLabel} • ${detail}` : typeLabel;
      })
      .join('\n');
  }, [savedVehicles, t]);

  const getApiErrorMessage = (error, fallbackMessage) => {
    const data = error?.response?.data;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      const validationMessages = Object.values(data.errors).flat().filter(Boolean).join('\n');
      if (validationMessages) {
        return validationMessages;
      }
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    return error?.message || fallbackMessage;
  };

  const renderDropdown = (items, selectedValue, onSelect, visible, setVisible, getLabel) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
        <Pressable onPress={() => {}}>
          <View style={[styles.dropdownModal, { backgroundColor: theme.colors.cardBackground }]}>
            <ScrollView>
              {items.map((item) => {
                const value = typeof item === 'string' ? item : item?.id;
                const label = getLabel(item);
                const isSelected = selectedValue === value;

                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.dropdownOption,
                      isSelected && { backgroundColor: `${theme.colors.primary}20` },
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
                        isSelected && { color: theme.colors.primary, fontWeight: '700' },
                      ]}
                    >
                      {label}
                    </Text>
                    {isSelected ? <Icon name="check" size={20} color={theme.colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const handleSaveVehicle = async () => {
    if (!vehicleType) {
      setErrorMessage(t('driverOnboarding.selectVehicleTypeError'));
      setShowErrorModal(true);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        vehicle_type: vehicleType,
        brand: brand.trim() || null,
        model: model.trim() || null,
        color: color.trim() || null,
        seats: seats ? parseInt(seats, 10) : null,
        transmission: transmission || null,
        fuel_type: fuelType || null,
        is_default: savedVehicles.length === 0 ? true : isDefault,
      };

      const response = await userVehiclesAPI.storeUserVehicle(payload);
      const createdVehicle = response?.data || payload;
      setSavedVehicle(createdVehicle);
      setShowNextStepModal(true);
      await loadSavedVehicles();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('driverOnboarding.saveError')));
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRouteNow = () => {
    setShowNextStepModal(false);
    navigation.navigate('CreatePickDropService', {
      initialStep: 1,
      selectedVehicle: savedVehicle,
      selectedVehicleId: savedVehicle?.id || null,
      returnToHomeOnSuccess: fromSignup,
    });
  };

  const handleMaybeLater = () => {
    setShowNextStepModal(false);
    if (fromSignup) {
      navigation.navigate('SettingsMain');
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
      <PageHeader title={t('driverOnboarding.title')} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('driverOnboarding.formTitle')}</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            {t('driverOnboarding.formSubtitle')}
          </Text>

          {loadingVehicles ? (
            <View style={styles.savedVehiclesLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : savedVehicles.length > 0 ? (
            <View style={[styles.savedVehiclesCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
              <Text style={[styles.savedVehiclesTitle, { color: theme.colors.text }]}>{t('driverOnboarding.savedVehiclesTitle')}</Text>
              <Text style={[styles.savedVehiclesText, { color: theme.colors.textSecondary }]}>{existingVehiclesText}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('driverOnboarding.vehicleType')} *</Text>
            <TouchableOpacity
              style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
              onPress={() => setShowVehicleTypeDropdown(true)}
            >
              <Text style={[styles.inputText, { color: theme.colors.text }]}>
                {vehicleType === 'bike' ? t('driverOnboarding.bike') : t('driverOnboarding.car')}
              </Text>
              <Icon name="keyboard-arrow-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('driverOnboarding.brand')}</Text>
              <TextInput
                style={[styles.input, styles.textInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                value={brand}
                onChangeText={setBrand}
                placeholder={t('driverOnboarding.brandPlaceholder')}
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('driverOnboarding.model')}</Text>
              <TextInput
                style={[styles.input, styles.textInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                value={model}
                onChangeText={setModel}
                placeholder={t('driverOnboarding.modelPlaceholder')}
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('driverOnboarding.color')}</Text>
              <TextInput
                style={[styles.input, styles.textInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                value={color}
                onChangeText={setColor}
                placeholder={t('driverOnboarding.colorPlaceholder')}
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
            <View style={[styles.inputGroup, { width: '32%', marginLeft: 8 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('driverOnboarding.seats')}</Text>
              <TextInput
                style={[styles.input, styles.textInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.inputBackground }]}
                value={seats}
                onChangeText={setSeats}
                keyboardType="numeric"
                placeholder={vehicleType === 'bike' ? '2' : '4'}
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('driverOnboarding.transmission')}</Text>
              <TouchableOpacity
                style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                onPress={() => setShowTransmissionDropdown(true)}
              >
                <Text style={[styles.inputText, { color: transmission ? theme.colors.text : theme.colors.placeholder }]}>
                  {transmission ? t(`driverOnboarding.${transmission}`) : t('driverOnboarding.select')}
                </Text>
                <Icon name="keyboard-arrow-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('driverOnboarding.fuelType')}</Text>
              <TouchableOpacity
                style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                onPress={() => setShowFuelTypeDropdown(true)}
              >
                <Text style={[styles.inputText, { color: fuelType ? theme.colors.text : theme.colors.placeholder }]}>
                  {fuelType ? t(`driverOnboarding.${fuelType}`) : t('driverOnboarding.select')}
                </Text>
                <Icon name="keyboard-arrow-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {savedVehicles.length > 0 ? (
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsDefault(!isDefault)}>
              <View style={[styles.checkbox, { borderColor: theme.colors.primary }, isDefault && { backgroundColor: theme.colors.primary }]}>
                {isDefault ? <Icon name="check" size={16} color="#fff" /> : null}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>{t('driverOnboarding.makeDefault')}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, saving && styles.disabledButton]}
            onPress={handleSaveVehicle}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>{t('driverOnboarding.saveVehicle')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderDropdown(VEHICLE_TYPES, vehicleType, setVehicleType, showVehicleTypeDropdown, setShowVehicleTypeDropdown, (item) => (
        item === 'bike' ? t('driverOnboarding.bike') : t('driverOnboarding.car')
      ))}
      {renderDropdown(TRANSMISSIONS, transmission, setTransmission, showTransmissionDropdown, setShowTransmissionDropdown, (item) => (
        t(`driverOnboarding.${item}`)
      ))}
      {renderDropdown(FUEL_TYPES, fuelType, setFuelType, showFuelTypeDropdown, setShowFuelTypeDropdown, (item) => (
        t(`driverOnboarding.${item}`)
      ))}

      <Modal
        visible={showNextStepModal}
        transparent
        animationType="fade"
        onRequestClose={handleMaybeLater}
      >
        <Pressable style={styles.modalOverlay} onPress={handleMaybeLater}>
          <Pressable onPress={() => {}}>
            <View style={[styles.nextStepModal, { backgroundColor: theme.colors.cardBackground }]}>
              <Icon name="check-circle" size={48} color={theme.colors.primary} />
              <Text style={[styles.nextStepTitle, { color: theme.colors.text }]}>{t('driverOnboarding.routePromptTitle')}</Text>
              <Text style={[styles.nextStepMessage, { color: theme.colors.textSecondary }]}>
                {t('driverOnboarding.routePromptMessage')}
              </Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]} onPress={handleAddRouteNow}>
                <Text style={styles.primaryButtonText}>{t('driverOnboarding.addFirstRoute')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }]} onPress={handleMaybeLater}>
                <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>{t('driverOnboarding.maybeLater')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  savedVehiclesLoading: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  savedVehiclesCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  savedVehiclesTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  savedVehiclesText: {
    fontSize: 13,
    lineHeight: 19,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  textInput: {
    paddingVertical: 12,
    fontSize: 16,
  },
  inputText: {
    fontSize: 15,
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 15,
    flex: 1,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownModal: {
    width: 320,
    maxWidth: '92%',
    maxHeight: 320,
    borderRadius: 14,
    padding: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
  },
  dropdownOptionText: {
    fontSize: 15,
  },
  nextStepModal: {
    width: 340,
    maxWidth: '92%',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  nextStepTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  nextStepMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
});

export default DriverVehicleOnboardingScreen;
