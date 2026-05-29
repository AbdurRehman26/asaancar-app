import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import LanguageSelector from '@/components/LanguageSelector';

const AppHomeScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  const navigateThroughAvailableNavigator = (primaryRoute, primaryParams, fallbackParams = null) => {
    let currentNavigation = navigation;

    while (currentNavigation) {
      const routeNames = currentNavigation.getState?.()?.routeNames || [];
      if (routeNames.includes(primaryRoute)) {
        currentNavigation.navigate(primaryRoute, primaryParams);
        return;
      }
      currentNavigation = currentNavigation.getParent?.();
    }

    navigation.navigate('Root', fallbackParams || {
      screen: primaryRoute,
      params: primaryParams,
    });
  };

  const openFindRide = () => {
    navigateThroughAvailableNavigator(
      'Home',
      { screen: 'PickDrop' },
      {
        screen: 'Home',
        params: {
          screen: 'PickDrop',
        },
      }
    );
  };

  const openRideRequests = () => {
    navigateThroughAvailableNavigator(
      'RideRequests',
      { screen: 'RideRequestsMain' },
      {
        screen: 'RideRequests',
        params: {
          screen: 'RideRequestsMain',
        },
      }
    );
  };

  const openDrivers = () => {
    navigateThroughAvailableNavigator(
      'DriversTab',
      {
        screen: 'Drivers',
      },
      {
        screen: 'DriversTab',
        params: {
          screen: 'Drivers',
        },
      }
    );
  };

  const openLogin = () => {
    navigateThroughAvailableNavigator(
      'Home',
      { screen: 'Login' },
      {
        screen: 'Home',
        params: {
          screen: 'Login',
        },
      }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <LinearGradient
        colors={isDark ? ['#2a1d33', '#1b1521', '#17131d'] : ['#f9eef7', '#f7f1f8', '#ffffff']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <View style={[styles.logoBadge, { backgroundColor: theme.colors.primary }]}>
              <Icon name="alt-route" size={28} color="#fff" />
            </View>
            <Text style={[styles.heroEyebrow, { color: theme.colors.primary }]}>
              {t('appHome.eyebrow')}
            </Text>
            <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
              {t('appHome.title')}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
              {t('appHome.subtitle')}
            </Text>
          </View>

          <View style={styles.cardsSection}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={openFindRide}
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(126,36,108,0.12)',
                },
              ]}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: 'rgba(14,165,233,0.14)' }]}>
                <Icon name="search" size={24} color="#0EA5E9" />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                  {t('appHome.findRideTitle')}
                </Text>
                <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                  {t('appHome.findRideDescription')}
                </Text>
              </View>
              <Icon name="arrow-forward" size={22} color={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={openDrivers}
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(126,36,108,0.12)',
                },
              ]}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: 'rgba(34,197,94,0.14)' }]}>
                <Icon name="person-pin-circle" size={24} color="#22C55E" />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                  {t('appHome.driversTitle')}
                </Text>
                <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                  {t('appHome.driversDescription')}
                </Text>
              </View>
              <Icon name="arrow-forward" size={22} color={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={openRideRequests}
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(126,36,108,0.12)',
                },
              ]}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
                <Icon name="description" size={24} color="#F59E0B" />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                  {t('appHome.rideRequestsTitle')}
                </Text>
                <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                  {t('appHome.rideRequestsDescription')}
                </Text>
              </View>
              <Icon name="arrow-forward" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {!user ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openLogin}
              style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            >
              <Icon name="login" size={20} color="#fff" />
              <Text style={styles.loginButtonText}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          ) : null}

          <View
            style={[
              styles.languageCard,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(126,36,108,0.12)',
              },
            ]}
          >
            <LanguageSelector />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  cardsSection: {
    gap: 14,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  loginButton: {
    marginTop: 26,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  languageCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AppHomeScreen;
