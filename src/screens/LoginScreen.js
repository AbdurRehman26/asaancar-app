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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import { authAPI } from '@/services/api';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { login, loginWithOtp, setUserFromStorage } = useAuth();
  const [authMethod, setAuthMethod] = useState('otp'); // 'otp' or 'password'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendOTP = async () => {
    if (!phone || phone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      // Format phone number with country code (Pakistan: +92)
      const formattedPhone = `+92${phone}`;
      const response = await authAPI.sendLoginOtp(formattedPhone);
      
      // Check if user is returned in response (auto-login scenario)
      if (response.user && response.token) {
        // User is automatically logged in, no OTP verification needed
        // Token and user are already stored by the API call
        // Update the AuthContext user state
        await setUserFromStorage();
        // Navigation will happen automatically when user state updates
        return;
      }
      
      // If no user in response, show OTP input field
      setOtpSent(true);
      setSuccessMessage('OTP has been sent to your phone number');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to send OTP');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (authMethod === 'otp') {
      if (!otpSent) {
        // If OTP hasn't been sent yet, send it first
        await handleSendOTP();
        return;
      }

      if (!otp || otp.length !== 6) {
        setErrorMessage('Please enter the 6-digit OTP');
        setShowErrorModal(true);
        return;
      }

      try {
        setLoading(true);
        // Format phone number with country code (Pakistan: +92)
        const formattedPhone = `+92${phone}`;
        await loginWithOtp(formattedPhone, otp);
        // Navigation will happen automatically via AuthContext
      } catch (error) {
        setErrorMessage(error.response?.data?.message || error.message || 'Invalid OTP. Please try again.');
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!phone || phone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      setShowErrorModal(true);
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      // Format phone number with country code (Pakistan: +92)
      const formattedPhone = `+92${phone}`;
      await login(formattedPhone, password);
      // Navigation will happen automatically via AuthContext
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Invalid phone number or password');
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
          <TouchableOpacity
            onPress={() => navigation.navigate('RentalCars')}
            style={styles.homeButton}
          >
            <Icon name="home" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Log in to your account
          </Text>

          {/* Authentication Method Toggle */}
          <View style={styles.authMethodContainer}>
            <TouchableOpacity
              style={[
                styles.authMethodButton,
                authMethod === 'otp' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                setAuthMethod('otp');
                setOtpSent(false);
                setOtp('');
              }}
            >
              <Text
                style={[
                  styles.authMethodText,
                  authMethod === 'otp' && { color: '#fff' },
                  authMethod !== 'otp' && { color: theme.colors.text },
                ]}
              >
                OTP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.authMethodButton,
                authMethod === 'password' && { backgroundColor: theme.colors.primary },
                authMethod !== 'password' && {
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                },
              ]}
              onPress={() => {
                setAuthMethod('password');
                setOtpSent(false);
                setOtp('');
              }}
            >
              <Text
                style={[
                  styles.authMethodText,
                  authMethod === 'password' && { color: '#fff' },
                  authMethod !== 'password' && { color: theme.colors.text },
                ]}
              >
                Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* Phone Number Input (for OTP) */}
          {authMethod === 'otp' && (
            <>
              <View style={styles.labelContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Phone Number</Text>
              </View>
              <View style={[styles.phoneInputContainer, { borderColor: theme.colors.border }]}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.flag}>🇵🇰</Text>
                  <Text style={[styles.countryCode, { color: theme.colors.text }]}>+92</Text>
                </View>
                <View style={styles.phoneInputDivider} />
                <TextInput
                  style={[styles.phoneInput, styles.phoneInputNoBorder, { color: theme.colors.text }]}
                  placeholder="3001234567"
                  placeholderTextColor={theme.colors.placeholder}
                  value={phone}
                  onChangeText={(text) => {
                    // Only allow numeric characters
                    const numericText = text.replace(/[^0-9]/g, '');
                    setPhone(numericText);
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

              {otpSent && (
                <>
                  <View style={styles.labelContainer}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>Enter OTP</Text>
                  </View>
                  <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text }]}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor={theme.colors.placeholder}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <View style={styles.inputIcons}>
                      <Icon name="lock" size={16} color={theme.colors.textSecondary} />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleSendOTP}
                    style={styles.resendButton}
                  >
                    <Text style={[styles.resendText, { color: theme.colors.primary }]}>
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* Phone Number and Password Inputs (for Password method) */}
          {authMethod === 'password' && (
            <>
              <View style={styles.labelContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Phone Number</Text>
              </View>
              <View style={[styles.phoneInputContainer, { borderColor: theme.colors.border }]}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.flag}>🇵🇰</Text>
                  <Text style={[styles.countryCode, { color: theme.colors.text }]}>+92</Text>
                </View>
                <View style={styles.phoneInputDivider} />
                <TextInput
                  style={[styles.phoneInput, styles.phoneInputNoBorder, { color: theme.colors.text }]}
                  placeholder="3001234567"
                  placeholderTextColor={theme.colors.placeholder}
                  value={phone}
                  onChangeText={(text) => {
                    // Only allow numeric characters
                    const numericText = text.replace(/[^0-9]/g, '');
                    setPhone(numericText);
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

              <View style={styles.labelContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
              </View>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { color: theme.colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {authMethod === 'otp' ? (otpSent ? 'Verify OTP' : 'Send OTP') : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.linkContainer}>
            <Text style={[styles.linkText, { color: theme.colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.link, { color: theme.colors.primary }]}>Sign up</Text>
            </TouchableOpacity>
          </View>
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
        title="OTP Sent"
        message={successMessage}
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
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  authMethodContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  authMethodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authMethodText: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderWidth: 1,
    minHeight: 56,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderWidth: 1,
    minHeight: 56,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
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
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  phoneInputNoBorder: {
    borderWidth: 0,
    outlineStyle: 'none',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  passwordInput: {
    borderWidth: 0,
    outlineStyle: 'none',
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 16,
  },
  resendButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
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

export default LoginScreen;
