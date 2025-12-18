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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '@/services/api';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, setUserFromStorage } = useAuth();
  const { theme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImageUri, setProfileImageUri] = useState(user?.profile_image || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.profile_image) {
      setProfileImageUri(user.profile_image);
    }
  }, [user]);

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

    if (!email.trim()) {
      setErrorMessage('Please enter your email');
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
        // Assuming the API returns the path/URL in 'url' or 'path' or 'data.url'
        finalProfileImage = uploadResult.url || uploadResult.path || uploadResult.data?.url || uploadResult.data?.path || uploadResult.image;
      }

      const updateData = {
        name: name.trim(),
        email: email.trim(),
        profile_image: finalProfileImage,
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
    if (!currentPassword) {
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
      await authAPI.changePassword(currentPassword, newPassword, confirmPassword);
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
        <View style={{ width: 28 }} />{/* Spacer for centering */}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Personal Information Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Personal Information</Text>

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
                Tap to change profile picture
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                  }
                ]}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
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
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Change Password Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Change Password</Text>

            {/* Current Password */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Current Password</Text>
              <View style={[
                styles.passwordInputContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                }
              ]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.colors.text }]}
                  placeholder="Enter your current password"
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

            {/* New Password */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>New Password</Text>
              <View style={[
                styles.passwordInputContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                }
              ]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.colors.text }]}
                  placeholder="New password"
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
              <Text style={[styles.label, { color: theme.colors.text }]}>Confirm New Password</Text>
              <View style={[
                styles.passwordInputContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                }
              ]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.colors.text }]}
                  placeholder="Confirm new password"
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
                <Text style={styles.buttonText}>Change Password</Text>
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
});

export default ProfileScreen;
