import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  FlatList,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { authAPI, locationAPI } from '@/services/api';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const isPasswordSetTruthy = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === '1' || lower === 'true';
  }
  return false;
};

const normalizeCity = (cityValue) => {
  if (!cityValue) {
    return { id: null, name: '' };
  }

  if (typeof cityValue === 'object') {
    return {
      id: cityValue.id ?? cityValue.city_id ?? null,
      name: cityValue.name ?? cityValue.city ?? '',
    };
  }

  return {
    id: null,
    name: String(cityValue).trim(),
  };
};

const buildProfilePayload = (userData, selectedCity) => {
  const payload = {
    city_id: selectedCity.id,
    city: selectedCity.name,
  };

  if (typeof userData?.name === 'string') {
    payload.name = userData.name;
  }

  if (typeof userData?.email === 'string' && userData.email.trim()) {
    payload.email = userData.email;
  }

  if (typeof userData?.profile_image === 'string' && userData.profile_image.trim()) {
    payload.profile_image = userData.profile_image;
  }

  if (typeof userData?.gender === 'string' && userData.gender.trim()) {
    payload.gender = userData.gender;
  }

  return payload;
};

const RequiredCityModal = () => {
  const { user, setUserFromStorage, updateUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const hasPasswordSet =
    user?.hasPasswordSet === true ||
    isPasswordSetTruthy(user?.data?.has_password) ||
    isPasswordSetTruthy(user?.data?.password_set) ||
    isPasswordSetTruthy(user?.data?.is_password_set) ||
    isPasswordSetTruthy(user?.data?.hasPasswordSet);

  const userCity = normalizeCity(user?.data?.city);
  const userCityId = user?.data?.city_id ?? userCity.id ?? null;
  const userCityName = userCity.name?.trim() || '';
  const isCityMissing = !!user && (!userCityId || !userCityName);
  const visible = !!user && hasPasswordSet && isCityMissing && !isCompleted;

  const filteredCities = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return cities;
    }

    return cities.filter((city) =>
      city.name?.toLowerCase().includes(normalizedQuery)
    );
  }, [cities, searchQuery]);

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === selectedCityId) || null,
    [cities, selectedCityId]
  );

  useEffect(() => {
    if (!visible) {
      setErrorMessage('');
      setSearchQuery('');
      if (!isCityMissing) {
        setIsCompleted(false);
      }
      return;
    }

    if (userCityId) {
      setSelectedCityId(userCityId);
    }

    if (cities.length > 0) {
      return;
    }

    let isMounted = true;

    const loadCities = async () => {
      try {
        setIsLoadingCities(true);
        setErrorMessage('');
        const response = await locationAPI.getCities();
        const cityList = Array.isArray(response?.data) ? response.data : [];
        if (!isMounted) return;
        setCities(cityList);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            t('cityPrompt.loadError')
        );
      } finally {
        if (isMounted) {
          setIsLoadingCities(false);
        }
      }
    };

    loadCities();

    return () => {
      isMounted = false;
    };
  }, [visible, cities.length, isCityMissing, t, userCityId]);

  const handleSaveCity = async () => {
    if (!selectedCityId) {
      setErrorMessage(t('cityPrompt.selectError'));
      return;
    }

    if (!selectedCity?.name) {
      setErrorMessage(t('cityPrompt.selectError'));
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');

      const response = await authAPI.updateProfile(
        buildProfilePayload(user?.data, selectedCity)
      );

      if (response?.user) {
        updateUser(response.user);
      } else {
        await setUserFromStorage();
      }
      setIsCompleted(true);
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('cityPrompt.success'),
      });
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          t('cityPrompt.saveError')
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('cityPrompt.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('cityPrompt.subtitle')}
            </Text>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {isLoadingCities ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  {t('cityPrompt.loading')}
                </Text>
              </View>
            ) : (
              <View style={styles.dropdown}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  {t('auth.city')}
                </Text>
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.inputBackground,
                    },
                  ]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('cityPrompt.searchPlaceholder')}
                  placeholderTextColor={theme.colors.placeholder}
                />
                <View
                  style={[
                    styles.resultsContainer,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.backgroundSecondary,
                    },
                  ]}
                >
                  <FlatList
                    data={filteredCities}
                    keyExtractor={(item) => item.id?.toString() || item.name}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                        {t('common.noResults')}
                      </Text>
                    }
                    renderItem={({ item }) => {
                      const isSelected = selectedCityId === item.id;

                      return (
                        <TouchableOpacity
                          style={[
                            styles.cityOption,
                            isSelected && {
                              backgroundColor: theme.colors.primary + '18',
                            },
                          ]}
                          onPress={() => {
                            setSelectedCityId(item.id);
                            setErrorMessage('');
                          }}
                        >
                          <Text
                            style={[
                              styles.cityOptionText,
                              {
                                color: isSelected
                                  ? theme.colors.primary
                                  : theme.colors.text,
                              },
                            ]}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
                {selectedCity?.name ? (
                  <Text style={[styles.selectedHint, { color: theme.colors.textSecondary }]}>
                    {t('cityPrompt.selectedCity', { city: selectedCity.name })}
                  </Text>
                ) : null}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.colors.primary },
                (isSaving || isLoadingCities) && styles.buttonDisabled,
              ]}
              onPress={handleSaveCity}
              disabled={isSaving || isLoadingCities}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('cityPrompt.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  dropdown: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    marginBottom: 12,
  },
  resultsContainer: {
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 220,
    overflow: 'hidden',
  },
  cityOption: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cityOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyText: {
    paddingHorizontal: 14,
    paddingVertical: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  selectedHint: {
    marginTop: 10,
    fontSize: 13,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RequiredCityModal;
