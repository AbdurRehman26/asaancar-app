import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark, toggleTheme } = useTheme();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendOTP = async () => {
    if (!formData.name) {
      setErrorMessage('Please enter your name');
      setShowErrorModal(true);
      return;
    }

    if (!formData.phone || formData.phone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement OTP sending API call
      // await authAPI.sendOTP(formData.phone);
      setErrorMessage('OTP functionality will be implemented');
      setShowErrorModal(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to send OTP');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="directions-car" size={32} color={theme.colors.primary} />
            <Icon name="location-on" size={20} color="#ff69b4" style={styles.locationIcon} />
            <Text style={[styles.logoText, { color: theme.colors.primary }]}>AsaanCar</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.themeToggleButton}
            >
              <Icon 
                name={isDark ? 'light-mode' : 'dark-mode'} 
                size={24} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('RentalCars')}
              style={styles.homeButton}
            >
              <Icon name="home" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={[styles.createAccountText, { color: theme.colors.textSecondary }]}>
            Create your account
          </Text>
          <Text style={[styles.accountInfoTitle, { color: theme.colors.text }]}>
            Account Information
          </Text>

          {/* Name Input */}
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
          </View>
          <View style={[styles.inputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
            <TextInput
              style={[styles.input, styles.inputNoBorder, { color: theme.colors.text }]}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <View style={styles.inputIcons}>
              <Icon name="lock" size={16} color={theme.colors.textSecondary} />
            </View>
          </View>

          {/* Phone Number Input */}
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Phone Number</Text>
          </View>
          <View style={[styles.phoneInputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.flag}>🇵🇰</Text>
              <Text style={[styles.countryCode, { color: theme.colors.text }]}>+92</Text>
            </View>
            <View style={[styles.phoneInputDivider, { backgroundColor: theme.colors.border }]} />
            <TextInput
              style={[styles.phoneInput, styles.phoneInputNoBorder, { color: theme.colors.text }]}
              placeholder="3001234567"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.phone}
              onChangeText={(text) => {
                // Only allow numeric characters
                const numericText = text.replace(/[^0-9]/g, '');
                setFormData({ ...formData, phone: numericText });
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={styles.inputIcons}>
              <Icon name="lock" size={16} color={theme.colors.textSecondary} />
            </View>
          </View>
          <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
            Enter your 10-digit phone number without the country code
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.linkContainer}>
            <Text style={[styles.linkText, { color: theme.colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.link, { color: theme.colors.primary }]}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggleButton: {
    padding: 4,
  },
  homeButton: {
    padding: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    marginLeft: -8,
    marginTop: -8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  createAccountText: {
    fontSize: 16,
    marginBottom: 4,
  },
  accountInfoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 50,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 50,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneInputDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
  },
  phoneInputNoBorder: {
    borderWidth: 0,
    outlineStyle: 'none',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputNoBorder: {
    borderWidth: 0,
    outlineStyle: 'none',
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
