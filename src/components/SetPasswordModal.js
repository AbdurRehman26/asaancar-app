import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { authAPI } from '@/services/api';

const SetPasswordModal = () => {

  const { user, setUserFromStorage, updateUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [modalNewPassword, setModalNewPassword] = useState('');
  const [modalConfirmPassword, setModalConfirmPassword] = useState('');
  const [showModalNewPassword, setShowModalNewPassword] = useState(false);
  const [showModalConfirmPassword, setShowModalConfirmPassword] = useState(false);
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [setPasswordModalError, setSetPasswordModalError] = useState('');

  // Use backend flags (on user.data) or normalized flag so modal hides when password exists
  const hasPasswordSet =
    user?.hasPasswordSet === true ||
    user?.data?.has_password === true ||
    user?.data?.password_set === true ||
    user?.data?.is_password_set === true ||
    user?.data?.hasPasswordSet === true;

  const handleSetPassword = async () => {
    if (!modalNewPassword) {
      setSetPasswordModalError('Please enter a new password');
      return;
    }
    if (modalNewPassword.length < 6) {
      setSetPasswordModalError('Password must be at least 6 characters');
      return;
    }
    if (modalNewPassword !== modalConfirmPassword) {
      setSetPasswordModalError('Passwords do not match');
      return;
    }
    try {
      setSetPasswordLoading(true);
      setSetPasswordModalError('');
      await authAPI.changePassword('', modalNewPassword, modalConfirmPassword);

      // Refresh user and force local flags so modal stays closed
      const freshUser = await setUserFromStorage();

      if (freshUser) {
        updateUser({
          ...freshUser,
          has_password: true,
          password_set: true,
          is_password_set: true,
          hasPasswordSet: true,
        });
      }
      setModalNewPassword('');
      setModalConfirmPassword('');
      Toast.show({
        type: 'success',
        text1: t('profile.passwordSetSuccess') || 'Password set successfully',
      });
    } catch (error) {
      setSetPasswordModalError(
        error.response?.data?.message || error.message || 'Failed to set password'
      );
    } finally {
      setSetPasswordLoading(false);
    }
  };

  const visible = !!user && !hasPasswordSet;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('profile.setPasswordTitle') || 'Set your password'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('profile.setPasswordSubtitle') || 'Create a password to sign in with phone and password.'}
            </Text>

            {setPasswordModalError ? (
              <Text style={styles.errorText}>{setPasswordModalError}</Text>
            ) : null}

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.newPassword')}</Text>
              <View style={[
                styles.passwordInputContainer,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }
              ]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.colors.text }]}
                  placeholder={t('profile.enterNewPassword')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={modalNewPassword}
                  onChangeText={setModalNewPassword}
                  secureTextEntry={!showModalNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowModalNewPassword(!showModalNewPassword)}
                  style={styles.iconButton}
                >
                  <Icon
                    name={showModalNewPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.confirmNewPassword')}</Text>
              <View style={[
                styles.passwordInputContainer,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }
              ]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.colors.text }]}
                  placeholder={t('profile.confirmNewPasswordPlaceholder')}
                  placeholderTextColor={theme.colors.placeholder}
                  value={modalConfirmPassword}
                  onChangeText={setModalConfirmPassword}
                  secureTextEntry={!showModalConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowModalConfirmPassword(!showModalConfirmPassword)}
                  style={styles.iconButton}
                >
                  <Icon
                    name={showModalConfirmPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.colors.primary },
                setPasswordLoading && styles.buttonDisabled,
              ]}
              onPress={handleSetPassword}
              disabled={setPasswordLoading}
            >
              {setPasswordLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {t('profile.setPassword') || 'Set password'}
                </Text>
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
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
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
  iconButton: {
    padding: 4,
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

export default SetPasswordModal;
