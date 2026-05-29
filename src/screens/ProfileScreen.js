import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { authAPI, locationAPI } from '@/services/api';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';

const getUploadedImagePath = (uploadResult) => {
  if (!uploadResult) return '';

  const uploadedUrl = uploadResult?.data?.uploaded?.[0]?.url;
  if (uploadedUrl) {
    return uploadedUrl;
  }

  const candidateGroups = [
    uploadResult,
    uploadResult.data,
    uploadResult.data?.uploaded,
    uploadResult.image,
    uploadResult.images,
    uploadResult.data?.image,
    uploadResult.data?.images,
  ];

  for (const candidate of candidateGroups) {
    if (!candidate) continue;

    if (typeof candidate === 'string') {
      return candidate;
    }

    if (Array.isArray(candidate)) {
      const firstMatch = candidate.find(Boolean);
      if (!firstMatch) continue;
      if (typeof firstMatch === 'string') {
        return firstMatch;
      }
      if (typeof firstMatch === 'object') {
        return (
          firstMatch.url ||
          firstMatch.path ||
          firstMatch.image ||
          firstMatch.location ||
          firstMatch.file_path ||
          firstMatch.filePath ||
          firstMatch.full_url ||
          firstMatch.fullUrl ||
          firstMatch.original_url ||
          firstMatch.originalUrl ||
          ''
        );
      }
    }

    if (typeof candidate === 'object') {
      const directPath =
        candidate.url ||
        candidate.path ||
        candidate.image ||
        candidate.location ||
        candidate.profile_image ||
        candidate.file_path ||
        candidate.filePath ||
        candidate.full_url ||
        candidate.fullUrl ||
        candidate.original_url ||
        candidate.originalUrl;

      if (directPath) {
        return directPath;
      }
    }
  }

  return '';
};

const isLocalImageUri = (uri = '') =>
  typeof uri === 'string' &&
  (uri.startsWith('blob:') ||
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('data:'));

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

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, setUserFromStorage } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState(user?.data?.name || '');
  const [profileImageUri, setProfileImageUri] = useState(user?.data?.profile_image || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(user?.data?.city_id ?? normalizeCity(user?.data?.city).id ?? null);
  const [selectedCityName, setSelectedCityName] = useState(normalizeCity(user?.data?.city).name || '');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // User has a password set – trust backend flags (on user.data) or normalized flag
  const hasPasswordSet =
    user?.hasPasswordSet === true ||
    user?.data?.has_password === true ||
    user?.data?.password_set === true ||
    user?.data?.is_password_set === true ||
    user?.data?.hasPasswordSet === true;

  useEffect(() => {
    if (user?.data?.name) {
      setName(user.data.name);
    }
    if (user?.data?.profile_image) {
      setProfileImageUri(user.data.profile_image);
    }
    const normalizedCity = normalizeCity(user?.data?.city);
    setSelectedCityId(user?.data?.city_id ?? normalizedCity.id ?? null);
    setSelectedCityName(normalizedCity.name || '');
  }, [user]);

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
      setErrorMessage(error.response?.data?.message || error.message || t('cityPrompt.loadError'));
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

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setErrorMessage('Failed to pick image');
      setShowErrorModal(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      let finalProfileImage = profileImageUri;

      // If a new local image is selected, upload it first
      if (profileImageUri && !profileImageUri.startsWith('http')) {
        const fileName = profileImageUri.split('/').pop();

        // Fetch the image and convert to blob for binary upload
        const response = await fetch(profileImageUri);
        const blob = await response.blob();

        const uploadResult = await authAPI.uploadImage(blob, fileName);
        const uploadedImagePath = getUploadedImagePath(uploadResult);

        if (!uploadedImagePath || isLocalImageUri(uploadedImagePath)) {
          throw new Error('Image upload succeeded but no usable image path was returned.');
        }

        finalProfileImage = uploadedImagePath;
      }

      const updateData = {
        name: name.trim(),
        profile_image: finalProfileImage,
        city_id: selectedCityId,
        city: selectedCityName || undefined,
      };

      await authAPI.updateProfile(updateData);
      await setUserFromStorage();
      setSuccessMessage('Profile updated successfully');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to update profile');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (hasPasswordSet && !currentPassword) {
      setErrorMessage('Please enter your current password');
      setShowErrorModal(true);
      return;
    }

    if (!newPassword) {
      setErrorMessage('Please enter a new password');
      setShowErrorModal(true);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      setShowErrorModal(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword(
        hasPasswordSet ? currentPassword : '',
        newPassword,
        confirmPassword
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password changed successfully');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to change password');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
      <PageHeader title={t('profile.title')} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Personal Information Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('profile.personalInfo')}</Text>

            {/* Profile Image Section */}
            <View style={styles.imageContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.placeholderImage, { backgroundColor: theme.colors.backgroundTertiary }]}>
                    <Icon name="person" size={50} color={theme.colors.textSecondary} />
                  </View>
                )}
                <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
                  <Icon name="camera-alt" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.imageHint, { color: theme.colors.textSecondary }]}>
                {t('profile.tapToChange')}
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.name')}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                  }
                ]}
                placeholder={t('profile.enterName')}
                placeholderTextColor={theme.colors.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('auth.city')}</Text>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                  }
                ]}
                onPress={openCityModal}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    { color: selectedCityName ? theme.colors.text : theme.colors.placeholder }
                  ]}
                >
                  {selectedCityName || t('auth.selectCity')}
                </Text>
                <Icon name="expand-more" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Change Password Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('profile.changePassword')}</Text>

            {/* Current Password - only when user already has a password set */}
            {hasPasswordSet && (
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.currentPassword')}</Text>
              <View style={[
                styles.passwordInputContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                }
              ]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.colors.text }]}
                  placeholder={t('profile.enterCurrentPassword')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <View style={styles.passwordIcons}>
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={styles.iconButton}
                  >
                    <Icon
                      name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <Icon name="lock" size={16} color={theme.colors.textSecondary} />
                </View>
              </View>
            </View>
            )}

            {/* New Password */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.newPassword')}</Text>
              <View style={[
                styles.passwordInputContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                }
              ]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.colors.text }]}
                  placeholder={t('profile.enterNewPassword')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <View style={styles.passwordIcons}>
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.iconButton}
                  >
                    <Icon
                      name={showNewPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <Icon name="lock" size={16} color={theme.colors.textSecondary} />
                </View>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.confirmNewPassword')}</Text>
              <View style={[
                styles.passwordInputContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                }
              ]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.colors.text }]}
                  placeholder={t('profile.confirmNewPasswordPlaceholder')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <View style={styles.passwordIcons}>
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.iconButton}
                  >
                    <Icon
                      name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <Icon name="lock" size={16} color={theme.colors.textSecondary} />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.changePasswordButton,
                { backgroundColor: theme.colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('profile.changePassword')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

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
                            { color: isSelected ? theme.colors.primary : theme.colors.text }
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

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 50,
  },
  selectButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  passwordIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  changePasswordButton: {
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  imageHint: {
    fontSize: 12,
    marginTop: 8,
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

export default ProfileScreen;
