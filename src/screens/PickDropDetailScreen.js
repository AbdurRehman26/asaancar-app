import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { pickDropAPI } from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ErrorModal from '@/components/ErrorModal';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';

const PickDropDetailScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { serviceId, serviceData } = route.params || {};
  const [service, setService] = useState(serviceData || null);
  const [loading, setLoading] = useState(!serviceData);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedStops, setExpandedStops] = useState(false);
  const [mapLoadError, setMapLoadError] = useState('');
  const rawStaticMapsApiKey = Constants.expoConfig?.extra?.googleStaticMapsApiKey;
  const defaultMapsApiKey = Constants.expoConfig?.extra?.googleMapsApiKey;
  const staticMapsApiKey =
    rawStaticMapsApiKey && !rawStaticMapsApiKey.includes('REPLACE_WITH_STATIC_MAPS_KEY')
      ? rawStaticMapsApiKey
      : defaultMapsApiKey;

  const hasRouteCoordinates = (serviceItem) => {
    if (!serviceItem) return false;

    const hasStartCoordinates =
      serviceItem.start_latitude != null && serviceItem.start_longitude != null;
    const hasEndCoordinates =
      serviceItem.end_latitude != null && serviceItem.end_longitude != null;
    const hasStopCoordinates = Array.isArray(serviceItem.stops)
      && serviceItem.stops.some((stop) => stop?.latitude != null && stop?.longitude != null);

    return hasStartCoordinates || hasEndCoordinates || hasStopCoordinates;
  };

  useEffect(() => {
    // Fetch full details when nothing was passed or when listing data lacks map coordinates.
    if (serviceId && (!serviceData || !hasRouteCoordinates(serviceData))) {
      loadServiceDetails();
    }
  }, [serviceId, serviceData]);

  // Debug: Log the service and provider to see the structure
  useEffect(() => {
    if (service) {
      const provider =
        service.user ||
        service.provider ||
        service.owner ||
        service.created_by ||
        null;
    }
  }, [service]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);

      // Fetch service details from API
      const data = await pickDropAPI.getPickDropService(serviceId);

      // Handle different response structures
      let serviceData = null;
      if (data) {
        if (data.data) {
          serviceData = data.data;
        } else if (Array.isArray(data) && data.length > 0) {
          serviceData = data[0];
        } else {
          serviceData = data;
        }
      }

      if (serviceData) {
        setService(serviceData);
      } else {
        setErrorMessage(t('pickDropDetail.serviceNotFound'));
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error loading service details:', error);
      setErrorMessage(
        error.response?.data?.message ||
        error.message ||
        t('pickDropDetail.loadError')
      );
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString) return '';

    const normalizedTime = typeof timeString === 'string' && timeString.includes('T')
      ? timeString.split('T')[1]
      : timeString;

    if (typeof normalizedTime === 'string' && normalizedTime.includes(':')) {
      const [hours, minutes] = normalizedTime.split(':');
      let h = parseInt(hours, 10);
      if (Number.isNaN(h)) return timeString;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${String(minutes).slice(0, 2)} ${ampm}`;
    }

    return timeString;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
  };


  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.errorText}>{t('pickDropDetail.serviceNotFound')}</Text>
      </View>
    );
  }

  const startLocation = service.start_location || service.startLocation || t('pickDropDetail.startLocation');
  const endLocation = service.end_location || service.endLocation || t('pickDropDetail.endLocation');
  const city = service.city || t('pickDropDetail.city');

  const provider =
    service.user ||
    service.provider ||
    service.owner ||
    service.created_by ||
    null;

  const providerPhone =
    provider?.phone_number ||
    provider?.phone ||
    provider?.contact_number ||
    provider?.mobile ||
    provider?.mobile_number ||
    service.contact_phone ||
    service.phone ||
    service.phone_number ||
    service.contact_number ||
    null;

  const providerWhatsApp =
    provider?.whatsapp_number ||
    provider?.whatsapp ||
    provider?.contact_whatsapp ||
    provider?.whatsapp_contact ||
    service.whatsapp_number ||
    service.whatsapp ||
    service.contact_whatsapp ||
    providerPhone ||
    null;
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

  const routePoints = [
    service.start_latitude != null && service.start_longitude != null
      ? {
          key: 'start',
          label: t('pickDropDetail.pickUp'),
          title: startLocation,
          latitude: Number(service.start_latitude),
          longitude: Number(service.start_longitude),
          time: formatDisplayTime(service.departure_time),
          markerColor: 'green',
          markerLabel: 'S',
        }
      : null,
    ...(service.stops || []).map((stop, index) => (
      stop?.latitude != null && stop?.longitude != null
        ? {
            key: `stop-${index}`,
            label: `${t('pickDropDetail.stop')} ${index + 1}`,
            title: stop.location || stop.name || t('pickDropDetail.stop'),
            latitude: Number(stop.latitude),
            longitude: Number(stop.longitude),
            time: formatDisplayTime(stop.stop_time || stop.time),
            markerColor: 'blue',
            markerLabel: String((index + 1) % 10),
          }
        : null
    )),
    service.end_latitude != null && service.end_longitude != null
      ? {
          key: 'end',
          label: t('pickDropDetail.dropOff'),
          title: endLocation,
          latitude: Number(service.end_latitude),
          longitude: Number(service.end_longitude),
          time: formatDisplayTime(service.return_time),
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

  const handleCallProvider = () => {
    if (!providerPhone) return;
    const phoneUrl = `tel:${providerPhone}`;
    Linking.openURL(phoneUrl).catch(() => {
      setErrorMessage(t('pickDropDetail.errorPhone'));
      setShowErrorModal(true);
    });
  };

  const handleMessageProvider = () => {
    if (!providerWhatsApp) return;
    const numericWhatsApp = providerWhatsApp.replace(/[^0-9]/g, '');
    const contactName = provider?.name || provider?.user?.name || service.driver?.name || 'there';
    const requesterName = user?.data?.name || 'there';
    const scheduleDate =
      service.departure_date
        ? formatDisplayDate(service.departure_date)
        : '';
    const scheduleTime = service.departure_time ? formatDisplayTime(service.departure_time) : '';
    const scheduleSuffix = [scheduleDate, scheduleTime].filter(Boolean).join(' at ');
    const rideDescriptor = `${startLocation} to ${endLocation}`;
    const message = `Hi ${contactName}, I'm ${requesterName} and I saw your ride on AsaanCar from ${rideDescriptor}${scheduleSuffix ? ` on ${scheduleSuffix}` : ''}. Is it still available?`;
    const whatsappUrl = `https://wa.me/${numericWhatsApp}?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      const smsUrl = `sms:${providerWhatsApp}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
      Linking.openURL(smsUrl).catch(() => {
        setErrorMessage(t('pickDropDetail.errorMsg'));
        setShowErrorModal(true);
      });
    });
  };

  const handleOpenRouteInMaps = () => {
    if (!routePoints.length) return;

    const origin = `${routePoints[0].latitude},${routePoints[0].longitude}`;
    const destination = `${routePoints[routePoints.length - 1].latitude},${routePoints[routePoints.length - 1].longitude}`;
    const waypoints = routePoints
      .slice(1, -1)
      .map((point) => `${point.latitude},${point.longitude}`)
      .join('|');

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}&travelmode=driving`;

    Linking.openURL(mapsUrl).catch(() => {
      setErrorMessage(t('pickDropDetail.mapOpenError'));
      setShowErrorModal(true);
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <PageHeader title="Ride Details" backDestination="PickDrop" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>

        {/* Header Banner */}
        <View style={[styles.headerBanner, { backgroundColor: isDark ? 'rgba(126, 36, 108, 0.82)' : 'rgba(126, 36, 108, 0.92)', borderColor: glassCardStyle.borderColor }]}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerLocationRow}>
              <Icon name="location-on" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.bannerTitle}>
                {startLocation}
              </Text>
            </View>
            <View style={styles.bannerLocationRow}>
              <Icon name="send" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.bannerRoute}>
                {endLocation}
              </Text>
            </View>
            {service.driver_gender && (
              <View style={styles.driverGenderBadge}>
                <Text style={styles.driverGenderBadgeText}>
                  {service.driver_gender === 'female' ? '👩 Female Driver' : '👨 Male Driver'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentContainer}>

          {/* 1. Route Section - Spacious Timeline */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.routeDetails')}</Text>
            <View style={[styles.card, styles.routeCard, glassCardStyle]}>

              {/* Start Location */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.largeDotGreen, { backgroundColor: '#00C853', borderColor: glassCardStyle.backgroundColor }]} />
                  <View style={[styles.verticalLineFull, { backgroundColor: theme.colors.border }]} />
                </View>
                <View style={styles.locationContent}>
                  <Text style={[styles.largeLocationLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.pickUp')}</Text>
                  <Text style={[styles.largeLocationTitle, { color: theme.colors.text }]}>
                    {startLocation}
                  </Text>
                  {service.pin_address && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Icon name="location-on" size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.largeLocationLabel, { color: theme.colors.textSecondary, marginBottom: 0, textTransform: 'none' }]}>
                        {service.pin_address}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Stops */}
              {service.stops && service.stops.length > 0 && (
                <View style={styles.stopsContainer}>
                  <View style={styles.timelineColumn}>
                    <View style={[styles.verticalLineFull, { backgroundColor: theme.colors.border }]} />
                  </View>
                  <View style={styles.stopsListContent}>
                    <View style={[styles.stopsBadge, glassChipStyle, { borderWidth: 1 }]}>
                      <Text style={[styles.stopsBadgeText, { color: isDark ? '#c77dba' : theme.colors.primary }]}>{service.stops.length} {t('pickDropDetail.stops')}</Text>
                    </View>
                    {service.stops.map((stop, index) => (
                      <View key={index} style={styles.stopRow}>
                        <View style={[styles.stopDot, { backgroundColor: theme.colors.textSecondary }]} />
                        <Text style={[styles.stopText, { color: theme.colors.textSecondary }]}>
                          {stop.location || stop.name || t('pickDropDetail.stop')}
                          {stop.stop_time || stop.time ? ` (${formatDisplayTime(stop.stop_time || stop.time)})` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* End Location */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.verticalLineTop, { backgroundColor: theme.colors.border }]} />
                  <Icon name="location-pin" size={24} color={isDark ? '#c77dba' : theme.colors.primary} style={{ marginLeft: -12 }} />
                </View>
                <View style={styles.locationContent}>
                  <Text style={[styles.largeLocationLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.dropOff')}</Text>
                  <Text style={[styles.largeLocationTitle, { color: theme.colors.text }]}>
                    {endLocation}
                  </Text>
                  {service.dropoff_pin_address && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Icon name="location-on" size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.largeLocationLabel, { color: theme.colors.textSecondary, marginBottom: 0, textTransform: 'none' }]}>
                        {service.dropoff_pin_address}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

            </View>
          </View>

          {staticMapUrl ? (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.routeMap')}</Text>
              <View style={[styles.card, styles.mapCard, glassCardStyle]}>
                {mapLoadError ? (
                  <View style={[styles.mapFallback, { backgroundColor: glassChipStyle.backgroundColor }]}>
                    <Icon name="map" size={30} color={theme.colors.primary} />
                    <Text style={[styles.mapFallbackTitle, { color: theme.colors.text }]}>
                      {t('pickDropDetail.mapUnavailable')}
                    </Text>
                    <Text style={[styles.mapFallbackText, { color: theme.colors.textSecondary }]}>
                      {mapLoadError}
                    </Text>
                    <Text style={[styles.mapDebugText, { color: theme.colors.textSecondary }]}>
                      Key tail: {staticMapsApiKey ? staticMapsApiKey.slice(-6) : 'missing'}
                    </Text>
                    <Text style={[styles.mapDebugText, { color: theme.colors.textSecondary }]}>
                      Points: {routePoints.length}
                    </Text>
                    <TouchableOpacity
                      style={[styles.openMapsButton, { backgroundColor: theme.colors.primary }]}
                      onPress={handleOpenRouteInMaps}
                    >
                      <Text style={styles.openMapsButtonText}>{t('pickDropDetail.openInMaps')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Image
                      source={{ uri: staticMapUrl }}
                      style={styles.mapImage}
                      resizeMode="cover"
                      onError={(event) => {
                        const nativeMessage =
                          event?.nativeEvent?.error ||
                          event?.nativeEvent?.message ||
                          '';
                        setMapLoadError(nativeMessage || t('pickDropDetail.mapLoadError'));
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.openMapsButton, { backgroundColor: theme.colors.primary }]}
                      onPress={handleOpenRouteInMaps}
                    >
                      <Text style={styles.openMapsButtonText}>{t('pickDropDetail.openInMaps')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ) : null}

          {/* 2. Trip Information - Grid Layout */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.tripInformation')}</Text>
            <View style={styles.gridContainer}>

              {/* Price Item */}
              <View style={[styles.gridItem, glassCardStyle]}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(126, 36, 108, 0.3)' : theme.colors.primary }]}>
                  <Icon name="attach-money" size={24} color={isDark ? '#c77dba' : '#fff'} />
                </View>
                <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.pricePerPerson')}</Text>
                <Text style={[styles.gridValueLarge, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                  {(() => {
                    const price =
                      service.price_per_person ||
                      service.pricePerPerson ||
                      (service.price && typeof service.price === 'object' ? service.price.perPerson || service.price.amount : null) ||
                      service.price || '0';
                    const currency = service.currency || 'PKR';
                    const formattedPrice = typeof price === 'number' ? price.toLocaleString() : price;
                    return `${currency}\n${formattedPrice}`;
                  })()}
                </Text>
              </View>

              {/* Schedule Item */}
              <View style={[styles.gridItem, glassCardStyle]}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(126, 36, 108, 0.3)' : theme.colors.secondary }]}>
                  <Icon name="access-time" size={24} color={isDark ? '#c77dba' : '#fff'} />
                </View>
                <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.schedule')}</Text>
                <Text style={[styles.gridValue, { color: theme.colors.text }]}>
                  {(() => {
                    const { schedule_type, selected_days, departure_date, departure_time, is_everyday, everyday_service } = service;
                    let displaySchedule = '';
                    let displayTime = formatDisplayTime(departure_time);

                    if (schedule_type) {
                      switch (schedule_type.toLowerCase()) {
                        case 'everyday':
                          displaySchedule = t('pickDropDetail.everyday');
                          break;
                        case 'weekday':
                        case 'weekdays':
                          displaySchedule = t('pickDropDetail.weekday');
                          break;
                        case 'weekend':
                        case 'weekends':
                          displaySchedule = t('pickDropDetail.weekend');
                          break;
                        case 'custom':
                          displaySchedule = selected_days ? selected_days.replace(/,/g, ', ') : t('pickDropDetail.custom');
                          break;
                        case 'once':
                          displaySchedule = departure_date ? formatDisplayDate(departure_date) : t('pickDropDetail.once');
                          break;
                        default:
                          displaySchedule = schedule_type;
                      }
                    } else {
                      // Fallback
                      if (is_everyday || everyday_service) {
                        displaySchedule = t('pickDropDetail.everyday');
                      } else if (departure_date) {
                        displaySchedule = formatDisplayDate(departure_date);
                      } else {
                        displaySchedule = t('pickDropDetail.flexible');
                      }
                    }

                    return `${displaySchedule}${displayTime ? `\n${t('pickDropDetail.at')} ${displayTime}` : ''}`;
                  })()}
                </Text>
              </View>

              {/* Seats Item */}
              <View style={[styles.gridItem, glassCardStyle]}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.15)' }]}>
                  <Icon name="event-seat" size={24} color={isDark ? '#ffb74d' : '#f57c00'} />
                </View>
                <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.availableSeats')}</Text>
                <Text style={[styles.gridValueLarge, { color: isDark ? '#ffb74d' : '#f57c00' }]}>
                  {service.available_spaces || service.available_seats || 0}
                </Text>
              </View>

              {/* Gender Item */}
              <View style={[styles.gridItem, glassCardStyle]}>
                <View style={[styles.iconCircle, { backgroundColor: service.driver_gender === 'female' ? (isDark ? 'rgba(233, 30, 99, 0.25)' : '#EC407A') : (isDark ? 'rgba(33, 150, 243, 0.25)' : '#42A5F5') }]}>
                  <Icon name="person" size={24} color={service.driver_gender === 'female' ? (isDark ? '#f48fb1' : '#fff') : (isDark ? '#90caf9' : '#fff')} />
                </View>
                <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.driverGender')}</Text>
                <Text style={[styles.gridValue, { color: service.driver_gender === 'female' ? (isDark ? '#f48fb1' : '#e91e63') : (isDark ? '#90caf9' : '#2196f3') }]}>
                  {service.driver_gender === 'female' ? t('pickDropDetail.femaleDriver').replace(' ', '\n') : t('pickDropDetail.maleDriver').replace(' ', '\n')}
                </Text>
              </View>

            </View>
          </View>

          {/* 3. Vehicle Information - List Card */}
          {service.car && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.vehicleDetails')}</Text>
              <View style={[styles.card, styles.vehicleCard, glassCardStyle]}>
                <View style={styles.vehicleHeader}>
                  <View style={[styles.vehicleIconLarge, { backgroundColor: isDark ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 82, 82, 0.1)' }]}>
                    <Icon name="directions-car" size={40} color={isDark ? '#ff8a80' : '#FF5252'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehicleTitleLarge, { color: theme.colors.text }]}>
                      {service.car.name || service.car}
                    </Text>
                    {service.car.color && (
                      <Text style={[styles.vehicleSubtitle, { color: theme.colors.textSecondary }]}>
                        {service.car.color} {t('pickDropDetail.color')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={[styles.vehicleDetailsRow, { backgroundColor: glassChipStyle.backgroundColor, borderColor: glassChipStyle.borderColor, borderWidth: 1 }]}>
                  <View style={styles.vehicleDetailItem}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.brand')}</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{service.car_brand || 'N/A'}</Text>
                  </View>
                  <View style={styles.vehicleDetailItem}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.model')}</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{service.car_model || 'N/A'}</Text>
                  </View>
                  <View style={styles.vehicleDetailItem}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.totalSeats')}</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{service.car_seats || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          {service.description && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.additionalNotes')}</Text>
              <View style={[styles.card, { padding: 16 }, glassCardStyle]}>
                <Text style={[styles.descriptionTextLarge, { color: theme.colors.text }]}>
                  {service.description}
                </Text>
              </View>
            </View>
          )}

          {/* 4. Service Provider - Large Profile */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.serviceProvider')}</Text>
            <View style={[styles.card, styles.providerCard, glassCardStyle]}>

              <View style={styles.providerHeader}>
                <View style={[styles.providerAvatarXLarge, { backgroundColor: glassChipStyle.backgroundColor, borderWidth: 1, borderColor: glassChipStyle.borderColor }]}>
                  <Text style={[styles.providerInitialsXLarge, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
                    {user
                      ? (provider?.name || provider?.user?.name || service.driver?.name || 'U').charAt(0).toUpperCase()
                      : 'L'}
                  </Text>
                </View>
                <View style={styles.providerInfoCenter}>
                  <Text style={[styles.providerNameXLarge, { color: theme.colors.text }]}>
                    {user
                      ? (provider?.name || provider?.user?.name || service.driver?.name || t('pickDropDetail.user'))
                      : t('pickDropDetail.user')}
                  </Text>
                  <Text style={[styles.providerRole, { color: theme.colors.primary, backgroundColor: glassChipStyle.backgroundColor, borderColor: glassChipStyle.borderColor }]}>
                    {user ? t('pickDropDetail.verifiedDriver') : t('pickDropDetail.loginToContact')}
                  </Text>
                </View>
              </View>

              <View style={styles.providerActionsColumn}>
                {user && providerPhone && (
                  <TouchableOpacity style={[styles.actionBtnFull, { backgroundColor: theme.colors.primary }]} onPress={handleCallProvider}>
                    <Icon name="call" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{t('pickDropDetail.callNow')}</Text>
                  </TouchableOpacity>
                )}
                {user && providerWhatsApp && (
                  <TouchableOpacity style={[styles.actionBtnFull, { backgroundColor: '#25D366' }]} onPress={handleMessageProvider}>
                    <FontAwesome name="whatsapp" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{t('pickDropDetail.whatsapp')}</Text>
                  </TouchableOpacity>
                )}
                {user && (provider?.id || provider?.user_id) && (
                  <TouchableOpacity style={[styles.actionBtnFull, { backgroundColor: theme.colors.secondary }]} onPress={() => {
                    if (!user) {
                      navigation.navigate('Login');
                    } else {
                      const pId = provider.id || provider.user_id;
                      const pName = provider.name || provider.user?.name || service.driver?.name || t('pickDropDetail.provider');
                      navigation.navigate('Chat', {
                        userId: pId,
                        userName: pName,
                        type: 'pick_and_drop',
                        serviceId: service.id
                      });
                    }
                  }}>
                    <Icon name="forum" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{t('pickDropDetail.chatInApp')}</Text>
                  </TouchableOpacity>
                )}
                {!user && (
                  <TouchableOpacity
                    style={[styles.actionBtnFull, { backgroundColor: theme.colors.primary }]}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Icon name="lock-open" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{t('common.login')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!user && (
                <Text style={[styles.loginHint, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.loginToContact')}</Text>
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
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
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  routeCard: {
    padding: 16,
    paddingBottom: 10,
  },
  mapCard: {
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#e9e9e9',
  },
  mapFallback: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
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
  mapDebugText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 6,
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
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineColumn: {
    width: 24,
    alignItems: 'center',
  },
  largeDotGreen: {
    width: 14,
    height: 14,
    borderRadius: 7,
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
  stopsContainer: {
    flexDirection: 'row',
  },
  stopsListContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 18,
  },
  stopsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  stopsBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  stopText: {
    fontSize: 14,
  },

  /* Grid Layout */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 166,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  gridValueLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Vehicle Card */
  vehicleCard: {
    padding: 0,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  vehicleIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleTitleLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 14,
  },
  divider: {
    height: 1,
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    padding: 20,
  },
  vehicleDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionTextLarge: {
    fontSize: 16,
    lineHeight: 24,
  },

  /* Provider Card */
  providerCard: {
    padding: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerAvatarXLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerInitialsXLarge: {
    fontSize: 22,
    fontWeight: '700',
  },
  providerInfoCenter: {
    flex: 1,
  },
  providerNameXLarge: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  providerRole: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  providerActionsColumn: {
    width: '100%',
    gap: 12,
  },
  actionBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 14,
    width: '100%',
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginHint: {
    marginTop: 12,
    fontSize: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PickDropDetailScreen;
