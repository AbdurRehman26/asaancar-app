import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { contactStatsAPI, rideRequestAPI } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import ErrorModal from '@/components/ErrorModal';

const formatTime = (timeString) => {
  if (!timeString) return '';
  const timePart = timeString.includes('T') ? timeString.split('T')[1] : timeString;
  const [hours, minutes] = timePart.split(':');
  let h = parseInt(hours, 10);
  if (Number.isNaN(h)) return timeString;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h || 12;
  return `${h}:${String(minutes).slice(0, 2)} ${ampm}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
};

const RideRequestDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { requestId, rideRequest: initialRequest } = route.params || {};
  const [rideRequest, setRideRequest] = useState(initialRequest || null);
  const [loading, setLoading] = useState(!initialRequest);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mapLoadError, setMapLoadError] = useState('');
  const glassCardStyle = {
    backgroundColor: isDark ? 'rgba(29, 22, 36, 0.82)' : 'rgba(255, 253, 253, 0.82)',
    borderColor: isDark ? 'rgba(216, 138, 200, 0.18)' : 'rgba(157, 58, 138, 0.16)',
    shadowColor: isDark ? '#000' : theme.colors.primary,
    shadowOpacity: isDark ? 0.28 : 0.12,
  };
  const glassChipStyle = {
    backgroundColor: isDark ? 'rgba(126, 36, 108, 0.22)' : 'rgba(255, 255, 255, 0.52)',
    borderColor: isDark ? 'rgba(216, 138, 200, 0.18)' : 'rgba(157, 58, 138, 0.14)',
  };
  const rawStaticMapsApiKey = Constants.expoConfig?.extra?.googleStaticMapsApiKey;
  const defaultMapsApiKey = Constants.expoConfig?.extra?.googleMapsApiKey;
  const staticMapsApiKey =
    rawStaticMapsApiKey && !rawStaticMapsApiKey.includes('REPLACE_WITH_STATIC_MAPS_KEY')
      ? rawStaticMapsApiKey
      : defaultMapsApiKey;

  useEffect(() => {
    if (!requestId) {
      return;
    }

    const loadRequest = async () => {
      try {
        setLoading(true);
        const data = await rideRequestAPI.getRideRequest(requestId);
        setRideRequest(data?.data || data);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || error.message || 'Failed to load ride request.');
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [requestId]);

  const handleCall = async () => {
    if (!rideRequest?.contact) return;
    const phoneUrl = `tel:${rideRequest.contact}`;
    await recordContactStat('call');
    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (canOpen) {
      await Linking.openURL(phoneUrl);
    }
  };

  const handleWhatsApp = async () => {
    const phone = rideRequest?.contact;
    if (!phone) return;

    const cleanNumber = phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    await recordContactStat('whatsapp');
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!rideRequest) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <Text style={{ color: theme.colors.text }}>Ride request not found.</Text>
      </SafeAreaView>
    );
  }

  const requesterName = user ? rideRequest.user?.name || rideRequest.name || 'Rider' : 'Rider';
  const requesterUserId = rideRequest.user?.id || rideRequest.user_id || null;
  const contactableId = rideRequest.id || requestId || null;

  const recordContactStat = async (contactMethod) => {
    if (!user || !requesterUserId || !contactableId || !contactMethod) {
      return;
    }

    try {
      await contactStatsAPI.storeContactingStat({
        recipient_user_id: requesterUserId,
        contactable_type: 'ride_request',
        contactable_id: contactableId,
        contact_method: contactMethod,
      });
    } catch (error) {
      console.error('Failed to store contact stat:', error?.response?.data || error?.message || error);
    }
  };

  const handleChatInApp = async () => {
    await recordContactStat('chat');
    navigation.navigate('Chat', {
      userId: requesterUserId,
      userName: rideRequest.user?.name || rideRequest.name || 'Rider',
      type: 'ride_request',
      serviceId: rideRequest.id,
    });
  };
  const departureLabel = rideRequest.schedule_type === 'once' && rideRequest.departure_date
    ? formatDate(rideRequest.departure_date)
    : rideRequest.schedule_type === 'everyday'
      ? 'Everyday'
      : rideRequest.schedule_type === 'custom' && Array.isArray(rideRequest.selected_days) && rideRequest.selected_days.length
        ? rideRequest.selected_days.join(', ')
        : rideRequest.schedule_type || 'Flexible';
  const routePoints = [
    rideRequest.start_latitude != null && rideRequest.start_longitude != null
      ? {
          key: 'start',
          label: 'Pick Up',
          title: rideRequest.start_location || 'Start Location',
          latitude: Number(rideRequest.start_latitude),
          longitude: Number(rideRequest.start_longitude),
          markerColor: 'green',
          markerLabel: 'S',
        }
      : null,
    rideRequest.end_latitude != null && rideRequest.end_longitude != null
      ? {
          key: 'end',
          label: 'Drop Off',
          title: rideRequest.end_location || 'End Location',
          latitude: Number(rideRequest.end_latitude),
          longitude: Number(rideRequest.end_longitude),
          markerColor: 'red',
          markerLabel: 'E',
        }
      : null,
  ].filter((point) => point && !Number.isNaN(point.latitude) && !Number.isNaN(point.longitude));

  const staticMapUrl = staticMapsApiKey && routePoints.length
    ? (() => {
        const markerParams = routePoints
          .map((point) => `markers=color:${point.markerColor}%7Clabel:${point.markerLabel}%7C${point.latitude},${point.longitude}`)
          .join('&');
        const pathPoints = routePoints.map((point) => `${point.latitude},${point.longitude}`).join('%7C');
        const pathParam = routePoints.length > 1 ? `&path=color:0x7e246cdd%7Cweight:4%7C${pathPoints}` : '';

        return `https://maps.googleapis.com/maps/api/staticmap?size=1000x520&scale=2${pathParam}&${markerParams}&key=${staticMapsApiKey}`;
      })()
    : null;

  const handleOpenRouteInMaps = () => {
    if (!routePoints.length) return;

    const origin = `${routePoints[0].latitude},${routePoints[0].longitude}`;
    const destination = `${routePoints[routePoints.length - 1].latitude},${routePoints[routePoints.length - 1].longitude}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

    Linking.openURL(mapsUrl).catch(() => {
      setErrorMessage('Unable to open route in Google Maps.');
      setShowErrorModal(true);
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <PageHeader title="Ride Request Details" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.headerBanner, { backgroundColor: isDark ? 'rgba(126, 36, 108, 0.82)' : 'rgba(126, 36, 108, 0.92)', borderColor: glassCardStyle.borderColor }]}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerLocationRow}>
              <Icon name="location-on" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.bannerTitle}>{rideRequest.start_location || 'Start Location'}</Text>
            </View>
            <View style={styles.bannerLocationRow}>
              <Icon name="send" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.bannerRoute}>{rideRequest.end_location || 'End Location'}</Text>
            </View>
            {rideRequest.preferred_driver_gender ? (
              <View style={styles.driverGenderBadge}>
                <Text style={styles.driverGenderBadgeText}>
                  {rideRequest.preferred_driver_gender === 'female' ? '👩 Female Driver' : '👨 Male Driver'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>Route Details</Text>
            <View style={[styles.card, styles.routeCard, glassCardStyle]}>
              <View style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.largeDotGreen, { borderColor: glassCardStyle.backgroundColor }]} />
                  <View style={[styles.verticalLineFull, { backgroundColor: theme.colors.border }]} />
                </View>
                <View style={styles.locationContent}>
                  <Text style={[styles.largeLocationLabel, { color: theme.colors.textSecondary }]}>Pick Up</Text>
                  <Text style={[styles.largeLocationTitle, { color: theme.colors.text }]}>{rideRequest.start_location}</Text>
                </View>
              </View>

              <View style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.verticalLineTop, { backgroundColor: theme.colors.border }]} />
                  <Icon name="location-pin" size={24} color={isDark ? '#c77dba' : theme.colors.primary} style={{ marginLeft: -12 }} />
                </View>
                <View style={styles.locationContent}>
                  <Text style={[styles.largeLocationLabel, { color: theme.colors.textSecondary }]}>Drop Off</Text>
                  <Text style={[styles.largeLocationTitle, { color: theme.colors.text }]}>{rideRequest.end_location}</Text>
                </View>
              </View>
            </View>
          </View>

          {staticMapUrl ? (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>Route Map</Text>
              <View style={[styles.card, styles.mapCard, glassCardStyle]}>
                {mapLoadError ? (
                  <View style={[styles.mapFallback, { backgroundColor: glassChipStyle.backgroundColor }]}>
                    <Icon name="map" size={30} color={theme.colors.primary} />
                    <Text style={[styles.mapFallbackTitle, { color: theme.colors.text }]}>
                      Map unavailable
                    </Text>
                    <Text style={[styles.mapFallbackText, { color: theme.colors.textSecondary }]}>
                      {mapLoadError}
                    </Text>
                    <TouchableOpacity
                      style={[styles.openMapsButton, { backgroundColor: theme.colors.primary }]}
                      onPress={handleOpenRouteInMaps}
                    >
                      <Text style={styles.openMapsButtonText}>Open in Google Maps</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Image
                      source={{ uri: staticMapUrl }}
                      style={styles.mapImage}
                      resizeMode="cover"
                      onError={(event) => {
                        const nativeMessage = event?.nativeEvent?.error || 'Unable to load route map image.';
                        setMapLoadError(nativeMessage);
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.openMapsButton, { backgroundColor: theme.colors.primary }]}
                      onPress={handleOpenRouteInMaps}
                    >
                      <Text style={styles.openMapsButtonText}>Open in Google Maps</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ) : null}

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>Ride Preferences</Text>
            <View style={[styles.card, glassCardStyle]}>
              <View style={styles.tagsRow}>
                <View style={[styles.scheduleTag, glassChipStyle, { borderWidth: 1 }]}>
                  <Icon name="access-time" size={14} color={isDark ? '#c77dba' : theme.colors.primary} />
                  <Text style={[styles.scheduleTagText, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                    {departureLabel} {rideRequest.departure_time ? `• ${formatTime(rideRequest.departure_time)}` : ''}
                  </Text>
                </View>

                <View style={[styles.seatsTag, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.48)', borderWidth: 1, borderColor: isDark ? 'rgba(252, 211, 77, 0.18)' : 'rgba(245, 158, 11, 0.14)' }]}>
                  <Icon name="people-outline" size={14} color={isDark ? '#ffb74d' : '#f57c00'} />
                  <Text style={[styles.seatsTagText, { color: isDark ? '#ffb74d' : '#f57c00' }]}>
                    {rideRequest.required_seats || 1} Seat{(rideRequest.required_seats || 1) !== 1 ? 's' : ''} needed
                  </Text>
                </View>

                {rideRequest.budget_per_seat ? (
                  <View style={[styles.priceTag, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.48)', borderWidth: 1, borderColor: isDark ? 'rgba(147, 197, 253, 0.18)' : 'rgba(59, 130, 246, 0.14)' }]}>
                    <Icon name="payments" size={14} color={isDark ? '#90caf9' : '#2196f3'} />
                    <Text style={[styles.priceTagText, { color: isDark ? '#90caf9' : '#2196f3' }]}>
                      {rideRequest.currency || 'PKR'} {rideRequest.budget_per_seat}/seat
                    </Text>
                  </View>
                ) : null}

                {rideRequest.return_time ? (
                  <View style={[styles.priceTag, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.18)' : 'rgba(255, 255, 255, 0.48)', borderWidth: 1, borderColor: isDark ? 'rgba(165, 214, 167, 0.18)' : 'rgba(46, 125, 50, 0.14)' }]}>
                    <Icon name="reply" size={14} color={isDark ? '#a5d6a7' : '#2e7d32'} />
                    <Text style={[styles.priceTagText, { color: isDark ? '#a5d6a7' : '#2e7d32' }]}>
                      Return • {formatTime(rideRequest.return_time)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>Requester</Text>
            <View style={[styles.card, glassCardStyle]}>
              <View style={styles.requesterRow}>
                <View style={[styles.requesterAvatar, glassChipStyle, { borderWidth: 1 }]}>
                  {user ? (
                    <Text style={[styles.requesterInitial, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                      {requesterName.charAt(0).toUpperCase()}
                    </Text>
                  ) : (
                    <Icon name="lock-outline" size={18} color={isDark ? '#c77dba' : theme.colors.primary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.requesterName, { color: theme.colors.text }]}>{requesterName}</Text>
                  <Text style={[styles.requesterMeta, { color: theme.colors.textSecondary }]}>
                    {user && rideRequest.contact ? rideRequest.contact : 'Login to view contact details'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {rideRequest.description ? (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>Notes</Text>
              <View style={[styles.card, glassCardStyle]}>
                <Text style={[styles.notesText, { color: theme.colors.textSecondary }]}>{rideRequest.description}</Text>
              </View>
            </View>
          ) : null}

          {user ? (
            <View style={styles.actionsColumn}>
              {rideRequest.contact ? (
                <TouchableOpacity style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]} onPress={handleCall}>
                  <Icon name="call" size={18} color="#fff" />
                  <Text style={styles.ctaButtonText}>Call Now</Text>
                </TouchableOpacity>
              ) : null}

              {rideRequest.contact ? (
                <TouchableOpacity style={[styles.ctaButton, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
                  <FontAwesome name="whatsapp" size={18} color="#fff" />
                  <Text style={styles.ctaButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}

              {requesterUserId ? (
                <TouchableOpacity
                  style={[styles.ctaButton, { backgroundColor: theme.colors.secondary }]}
                  onPress={handleChatInApp}
                >
                  <Icon name="forum" size={18} color="#fff" />
                  <Text style={styles.ctaButtonText}>Chat in App</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <TouchableOpacity style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('Login')}>
              <Icon name="lock-open" size={18} color="#fff" />
              <Text style={styles.ctaButtonText}>Login to Contact</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <ErrorModal visible={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  headerBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
  },
  bannerContent: {
    padding: 20,
  },
  bannerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  bannerRoute: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  driverGenderBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  driverGenderBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  routeCard: {
    paddingBottom: 10,
  },
  mapCard: {
    overflow: 'hidden',
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineColumn: {
    width: 24,
    alignItems: 'center',
  },
  largeDotGreen: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00C853',
    borderWidth: 3,
    marginTop: 2,
  },
  verticalLineFull: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  verticalLineTop: {
    width: 2,
    height: 16,
    marginBottom: 6,
  },
  locationContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 18,
  },
  largeLocationLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  largeLocationTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleTag: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  seatsTag: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatsTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceTag: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  requesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requesterAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requesterInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  requesterName: {
    fontSize: 15,
    fontWeight: '700',
  },
  requesterMeta: {
    marginTop: 4,
    fontSize: 13,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  mapImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  mapFallback: {
    borderRadius: 14,
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapFallbackTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  mapFallbackText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  openMapsButton: {
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openMapsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionsColumn: {
    gap: 12,
    marginBottom: 12,
  },
  ctaButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default RideRequestDetailScreen;
