import React, { useEffect, useRef, useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import { useTranslation } from 'react-i18next';
import { authAPI } from '@/services/api';

const VerifySignupOtpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { registerWithOtp } = useAuth();
  const { t } = useTranslation();

  const phone = route.params?.phone || '';
  const name = route.params?.name || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(90);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErrorMessage(t('auth.enterValidOtp') || 'Please enter the 6-digit OTP');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      await registerWithOtp(phone, otp, name || undefined);
      // User is set in AuthContext; Root will re-render as AuthenticatedTabs
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || t('auth.invalidOtp') || 'Invalid OTP. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      await authAPI.sendSignupOtp(phone, name || undefined);
      setErrorMessage('');
      setShowErrorModal(false);
      setResendCooldown(90);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to resend OTP');
      setShowErrorModal(true);
    } finally {
      setResendLoading(false);
    }
  };

  const renderOtpBoxes = () => (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => otpInputRef.current?.focus()}
      style={styles.otpBoxesContainer}
    >
      {Array.from({ length: 6 }).map((_, index) => {
        const digit = otp[index] || '';
        const isActive = index === otp.length && otp.length < 6;

        return (
          <View
            key={index}
            style={[
              styles.otpBox,
              { borderColor: isActive ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.inputBackground },
            ]}
          >
            <Text style={[styles.otpBoxText, { color: theme.colors.text }]}>{digit}</Text>
          </View>
        );
      })}
      <TextInput
        ref={otpInputRef}
        style={styles.hiddenOtpInput}
        value={otp}
        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.primary} />
          <Text style={[styles.backText, { color: theme.colors.primary }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('auth.verifyOtpTitle') || 'Verify your phone'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.verifyOtpSubtitle') || 'Enter the 6-digit code sent to'}{' '}
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{phone}</Text>
          </Text>

          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('common.enterOtp') || 'Enter OTP'}</Text>
          </View>
          {renderOtpBoxes()}

          {resendCooldown > 0 ? (
            <View style={styles.resendButton}>
              <Text style={[styles.resendCountdownText, { color: theme.colors.textSecondary }]}>
                {`Resend OTP in ${resendCooldown}s`}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resendLoading}
              style={styles.resendButton}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={[styles.resendText, { color: theme.colors.primary }]}>
                  {t('common.resendOtp')}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('common.verifyOtp')}</Text>
            )}
          </TouchableOpacity>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
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
    marginBottom: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputIcons: {
    marginLeft: 8,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
    position: 'relative',
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '700',
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
    minHeight: 24,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resendCountdownText: {
    fontSize: 14,
    fontWeight: '500',
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
});

export default VerifySignupOtpScreen;
