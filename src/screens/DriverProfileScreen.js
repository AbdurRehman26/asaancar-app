import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { contactStatsAPI, driversAPI } from '@/services/api';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';
import ErrorModal from '@/components/ErrorModal';

const DriverProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { driverId, driverData } = route.params || {};
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [driver, setDriver] = useState(driverData || null);
  const [loading, setLoading] = useState(!driverData);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (driverId && !driverData) {
      loadDriverProfile();
    }
  }, [driverId, driverData]);

  const loadDriverProfile = async () => {
    try {
      setLoading(true);
      const data = await driversAPI.getDriverById(driverId);
      const profile = data?.data || data;
      setDriver(profile || null);
    } catch (error) {
      console.error('Error loading driver profile:', error);
      setErrorMessage(error?.response?.data?.message || t('drivers.profileLoadError'));
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const openLatestRide = () => {
    if (!driver?.latest_service?.id) return;
    navigation.navigate('PickDropDetail', { serviceId: driver.latest_service.id });
  };

  const latestService = driver?.latest_service || null;
  const driverPhone =
    driver?.phone_number ||
    driver?.phone ||
    driver?.contact_number ||
    driver?.mobile ||
    driver?.mobile_number ||
    null;
  const driverWhatsApp =
    driver?.whatsapp_number ||
    driver?.whatsapp ||
    driver?.contact_whatsapp ||
    driver?.whatsapp_contact ||
    driverPhone ||
    null;
  const driverRecipientUserId = driver?.id || driver?.user_id || null;

  const renderAvatar = () => {
    if (driver?.profile_image) {
      return <Image source={{ uri: driver.profile_image }} style={styles.avatarImage} />;
    }

    return (
      <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>
        {(driver?.name || 'D').charAt(0).toUpperCase()}
      </Text>
    );
  };

  const recordContactStat = async (contactMethod) => {
    if (!user || !driverRecipientUserId || !latestService?.id || !contactMethod) {
      return;
    }

    try {
      await contactStatsAPI.storeContactingStat({
        recipient_user_id: driverRecipientUserId,
        contactable_type: 'pick_and_drop',
        contactable_id: latestService.id,
        contact_method: contactMethod,
      });
    } catch (error) {
      console.error('Failed to store contact stat:', error?.response?.data || error?.message || error);
    }
  };

  const handleCall = () => {
    if (!driverPhone) return;
    recordContactStat('call').finally(() => {
      Linking.openURL(`tel:${driverPhone}`).catch(() => {
        setErrorMessage(t('drivers.phoneUnavailable'));
        setShowErrorModal(true);
      });
    });
  };

  const handleWhatsApp = () => {
    if (!driverWhatsApp) return;
    const cleanNumber = driverWhatsApp.replace(/[^0-9]/g, '');
    const contactName = driver?.name || t('drivers.driver');
    const requesterName = user?.data?.name || user?.name || 'there';
    const routeLabel = latestService
      ? `${latestService.start_location} ${t('drivers.routeSeparator')} ${latestService.end_location}`
      : t('drivers.latestRide');
    const timeLabel = latestService?.formatted_departure_time || '';
    const message = `Hi ${contactName}, I'm ${requesterName} and I saw your route on AsaanCar from ${routeLabel}${timeLabel ? ` at ${timeLabel}` : ''}. Is it still available?`;
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    recordContactStat('whatsapp').finally(() => {
      Linking.openURL(whatsappUrl).catch(() => {
        const smsUrl = `sms:${driverWhatsApp}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
        Linking.openURL(smsUrl).catch(() => {
          setErrorMessage(t('pickDropDetail.errorMsg'));
          setShowErrorModal(true);
        });
      });
    });
  };

  const handleChatWithDriver = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    if (!driverRecipientUserId) {
      setErrorMessage(t('drivers.phoneUnavailable'));
      setShowErrorModal(true);
      return;
    }

    recordContactStat('chat').finally(() => {
      navigation.navigate('Chat', {
        userId: driverRecipientUserId,
        userName: driver?.name || t('drivers.driver'),
        ...(latestService?.id ? { type: 'pick_and_drop', serviceId: latestService.id } : {}),
      });
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!driver) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('drivers.notFound')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['bottom']}>
      <PageHeader title={t('drivers.profileTitle')} />

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? 'rgba(29, 22, 36, 0.82)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(232, 170, 220, 0.28)' : 'rgba(157, 58, 138, 0.16)',
            },
          ]}
        >
          <View style={[styles.avatarWrap, { backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border }]}>
            {renderAvatar()}
          </View>
          <Text style={[styles.driverName, { color: theme.colors.text }]}>{driver.name || t('drivers.driver')}</Text>
          <Text style={[styles.activeCount, { color: theme.colors.textSecondary }]}>
            {t('drivers.activeRides', { count: driver.active_services_count || 0 })}
          </Text>

          <View style={styles.contactActionsColumn}>
            {user && driverPhone ? (
              <TouchableOpacity
                style={[styles.actionBtnFull, { backgroundColor: theme.colors.primary }]}
                onPress={handleCall}
              >
                <Icon name="call" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{t('pickDropDetail.callNow')}</Text>
              </TouchableOpacity>
            ) : null}
            {user && driverWhatsApp ? (
              <TouchableOpacity
                style={[styles.actionBtnFull, { backgroundColor: '#25D366' }]}
                onPress={handleWhatsApp}
              >
                <FontAwesome name="whatsapp" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{t('pickDropDetail.whatsapp')}</Text>
              </TouchableOpacity>
            ) : null}
            {user && driverRecipientUserId ? (
              <TouchableOpacity
                style={[styles.actionBtnFull, { backgroundColor: theme.colors.secondary }]}
                onPress={handleChatWithDriver}
              >
                <Icon name="forum" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{t('pickDropDetail.chatInApp')}</Text>
              </TouchableOpacity>
            ) : null}
            {!user ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtnFull, { backgroundColor: theme.colors.primary }]}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Icon name="lock-open" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>{t('common.login')}</Text>
                </TouchableOpacity>
                <Text style={[styles.loginHint, { color: theme.colors.textSecondary }]}>
                  {t('pickDropDetail.loginToContact')}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {latestService ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('drivers.latestRide')}</Text>
            <Text style={[styles.routeText, { color: theme.colors.text }]}>
              {latestService.start_location} {t('drivers.routeSeparator')} {latestService.end_location}
            </Text>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t('drivers.departure')}</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>{latestService.formatted_departure_time}</Text>
            </View>

            {latestService.price_per_person ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t('drivers.price')}</Text>
                <Text style={[styles.detailValue, { color: theme.colors.primary }]}>
                  {(latestService.currency || 'PKR')} {latestService.price_per_person}
                </Text>
              </View>
            ) : null}

            {latestService.driver_gender ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t('drivers.driverGender')}</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {latestService.driver_gender === 'female' ? t('pickDropDetail.femaleDriver') : t('pickDropDetail.maleDriver')}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={openLatestRide}
            >
              <Text style={styles.primaryButtonText}>{t('drivers.viewRide')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('drivers.latestRide')}</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('drivers.noActiveRide')}</Text>
          </View>
        )}
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    alignItems: 'center',
    padding: 22,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '800',
  },
  driverName: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  activeCount: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 14,
  },
  contactActionsColumn: {
    width: '100%',
    gap: 10,
  },
  actionBtnFull: {
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  loginHint: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: 13,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DriverProfileScreen;
