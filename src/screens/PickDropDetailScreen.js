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
    const whatsappUrl = `https://wa.me/${numericWhatsApp}`;
    Linking.openURL(whatsappUrl).catch(() => {
      const smsUrl = `sms:${providerWhatsApp}`;
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('PickDrop')}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
          <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
            {t('common.backToListing')}
          </Text>
        </TouchableOpacity>

        {/* Header Banner */}
        <View style={[styles.headerBanner, { backgroundColor: theme.colors.primary }]}>
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
              <View style={styles.driverGenderTag}>
                <Text style={styles.driverGenderEmoji}>
                  {service.driver_gender === 'female' ? '♀' : '♂'}
                </Text>
                <Text style={styles.driverGenderText}>
                  <Text style={styles.driverGenderText}>
                    {service.driver_gender === 'female' ? t('pickDropDetail.femaleDriver') : t('pickDropDetail.maleDriver')}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentContainer}>

          {/* 1. Route Section - Spacious Timeline */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.routeDetails')}</Text>
            <View style={[styles.card, styles.routeCard, { backgroundColor: theme.colors.cardBackground, borderColor: isDark ? theme.colors.border : theme.colors.primary, shadowColor: isDark ? '#000' : theme.colors.primary, shadowOpacity: isDark ? 0.3 : 0.08 }]}>

              {/* Start Location */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.largeDotGreen, { backgroundColor: '#00C853', borderColor: theme.colors.cardBackground }]} />
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
                    <View style={[styles.stopsBadge, { backgroundColor: isDark ? 'rgba(126, 36, 108, 0.25)' : 'rgba(126, 36, 108, 0.12)' }]}>
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
              <View style={[styles.card, styles.mapCard, { backgroundColor: theme.colors.cardBackground, borderColor: isDark ? theme.colors.border : theme.colors.primary, shadowColor: isDark ? '#000' : theme.colors.primary, shadowOpacity: isDark ? 0.3 : 0.08 }]}>
                {mapLoadError ? (
                  <View style={[styles.mapFallback, { backgroundColor: theme.colors.backgroundSecondary }]}>
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
                      style={[styles.mapFallbackButton, { backgroundColor: theme.colors.primary }]}
                      onPress={handleOpenRouteInMaps}
                    >
                      <Text style={styles.mapFallbackButtonText}>{t('pickDropDetail.openInMaps')}</Text>
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
                    <View style={styles.mapLegend}>
                      {routePoints.map((point) => (
                        <View key={point.key} style={styles.mapLegendRow}>
                          <View style={[
                            styles.mapMarkerDot,
                            point.markerColor === 'green' && styles.mapMarkerStart,
                            point.markerColor === 'blue' && styles.mapMarkerStop,
                            point.markerColor === 'red' && styles.mapMarkerEnd,
                          ]}>
                            <Text style={styles.mapMarkerText}>{point.markerLabel}</Text>
                          </View>
                          <View style={styles.mapLegendContent}>
                            <Text style={[styles.mapLegendLabel, { color: theme.colors.textSecondary }]}>
                              {point.label}{point.time ? ` • ${point.time}` : ''}
                            </Text>
                            <Text style={[styles.mapLegendTitle, { color: theme.colors.text }]} numberOfLines={2}>
                              {point.title}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
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
              <View style={[styles.gridItem, { backgroundColor: theme.colors.cardBackground, borderColor: isDark ? theme.colors.border : theme.colors.primary, shadowColor: isDark ? '#000' : theme.colors.primary, shadowOpacity: isDark ? 0.3 : 0.08 }]}>
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
              <View style={[styles.gridItem, { backgroundColor: theme.colors.cardBackground, borderColor: isDark ? theme.colors.border : theme.colors.primary, shadowColor: isDark ? '#000' : theme.colors.primary, shadowOpacity: isDark ? 0.3 : 0.08 }]}>
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
              <View style={[styles.gridItem, { backgroundColor: theme.colors.cardBackground, borderColor: isDark ? theme.colors.border : theme.colors.primary, shadowColor: isDark ? '#000' : theme.colors.primary, shadowOpacity: isDark ? 0.3 : 0.08 }]}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.15)' }]}>
                  <Icon name="event-seat" size={24} color={isDark ? '#ffb74d' : '#f57c00'} />
                </View>
                <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.availableSeats')}</Text>
                <Text style={[styles.gridValueLarge, { color: isDark ? '#ffb74d' : '#f57c00' }]}>
                  {service.available_spaces || service.available_seats || 0}
                </Text>
              </View>

              {/* Gender Item */}
              <View style={[styles.gridItem, { backgroundColor: theme.colors.cardBackground, borderColor: isDark ? theme.colors.border : theme.colors.primary, shadowColor: isDark ? '#000' : theme.colors.primary, shadowOpacity: isDark ? 0.3 : 0.08 }]}>
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
              <View style={[styles.card, styles.vehicleCard, { backgroundColor: theme.colors.cardBackground, borderColor: isDark ? theme.colors.border : theme.colors.primary, shadowColor: isDark ? '#000' : theme.colors.primary, shadowOpacity: isDark ? 0.3 : 0.08 }]}>
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
                <View style={[styles.vehicleDetailsRow, { backgroundColor: theme.colors.cardBackground }]}>
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
              <View style={[styles.card, { padding: 16, backgroundColor: theme.colors.cardBackground, borderColor: isDark ? theme.colors.border : theme.colors.primary, shadowColor: isDark ? '#000' : theme.colors.primary, shadowOpacity: isDark ? 0.3 : 0.08 }]}>
                <Text style={[styles.descriptionTextLarge, { color: theme.colors.text }]}>
                  {service.description}
                </Text>
              </View>
            </View>
          )}

          {/* 4. Service Provider - Large Profile */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textSecondary }]}>{t('pickDropDetail.serviceProvider')}</Text>
            <View style={[styles.card, styles.providerCard, { backgroundColor: theme.colors.cardBackground, borderColor: isDark ? theme.colors.border : theme.colors.primary, shadowColor: isDark ? '#000' : theme.colors.primary, shadowOpacity: isDark ? 0.3 : 0.08 }]}>

              <View style={styles.providerHeader}>
                <View style={[styles.providerAvatarXLarge, { backgroundColor: isDark ? 'rgba(126, 36, 108, 0.3)' : 'rgba(126, 36, 108, 0.1)', borderWidth: 2, borderColor: isDark ? theme.colors.border : 'transparent' }]}>
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
                  <Text style={[styles.providerRole, { color: theme.colors.primary, backgroundColor: theme.colors.backgroundSecondary }]}>
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

          {/* Back to listing - bottom */}
          <TouchableOpacity
            style={[styles.backToListingBottom, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('PickDrop')}
            activeOpacity={0.8}
          >
            <Icon name="arrow-back" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.backToListingBottomText}>{t('common.backToListing')}</Text>
          </TouchableOpacity>

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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    zIndex: 10,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerBanner: {
    display: 'none',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  routeCard: {
    padding: 20,
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
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 8,
  },
  mapFallbackText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 14,
  },
  mapDebugText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 6,
  },
  mapFallbackButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  mapFallbackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapLegend: {
    padding: 16,
    gap: 12,
  },
  mapLegendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mapMarkerDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  mapMarkerStart: {
    backgroundColor: '#00C853',
  },
  mapMarkerStop: {
    backgroundColor: '#2196F3',
  },
  mapMarkerEnd: {
    backgroundColor: '#FF5252',
  },
  mapMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  mapLegendContent: {
    flex: 1,
  },
  mapLegendLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  mapLegendTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineColumn: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  largeDotGreen: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    zIndex: 2,
  },
  verticalLineFull: {
    width: 2,
    flex: 1,
    minHeight: 40,
  },
  verticalLineTop: {
    width: 2,
    height: 12,
  },
  locationContent: {
    flex: 1,
    paddingBottom: 20,
  },
  largeLocationLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  largeLocationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  stopsContainer: {
    flexDirection: 'row',
  },
  stopsListContent: {
    flex: 1,
    paddingBottom: 20,
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
    gap: 16,
  },
  gridItem: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
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
    padding: 24,
    alignItems: 'center',
  },
  providerHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  providerAvatarXLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  providerInitialsXLarge: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  providerInfoCenter: {
    alignItems: 'center',
  },
  providerNameXLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerRole: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  providerActionsColumn: {
    width: '100%',
    gap: 12,
  },
  actionBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    gap: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginHint: {
    marginTop: 16,
    fontSize: 12,
  },
  backToListingBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  backToListingBottomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PickDropDetailScreen;
