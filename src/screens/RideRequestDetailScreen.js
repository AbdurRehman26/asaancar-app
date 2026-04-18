import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { rideRequestAPI } from '@/services/api';
import PageHeader from '@/components/PageHeader';
import ErrorModal from '@/components/ErrorModal';

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  const timePart = timeString.includes('T') ? timeString.split('T')[1] : timeString;
  const [hours, minutes] = timePart.split(':');
  let h = parseInt(hours, 10);
  if (Number.isNaN(h)) return timeString;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h || 12;
  return `${h}:${String(minutes).slice(0, 2)} ${ampm}`;
};

const RideRequestDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { requestId, rideRequest: initialRequest } = route.params || {};
  const [rideRequest, setRideRequest] = useState(initialRequest || null);
  const [loading, setLoading] = useState(!initialRequest);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!rideRequest) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
        <Text style={{ color: theme.colors.text }}>Ride request not found.</Text>
      </SafeAreaView>
    );
  }

  const requesterName = user ? rideRequest.user?.name || rideRequest.name || 'Rider' : 'Rider';
  const requesterUserId = rideRequest.user?.id || rideRequest.user_id || null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <PageHeader title="Ride Request Details" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Route</Text>
          <Text style={[styles.locationText, { color: theme.colors.text }]}>From: {rideRequest.start_location}</Text>
          <Text style={[styles.locationText, { color: theme.colors.text }]}>To: {rideRequest.end_location}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Schedule</Text>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {rideRequest.schedule_type === 'once' && rideRequest.departure_date ? `${rideRequest.departure_date} • ` : ''}
            {formatTime(rideRequest.departure_time)}
          </Text>
          {rideRequest.return_time ? (
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>Return: {formatTime(rideRequest.return_time)}</Text>
          ) : null}
          {Array.isArray(rideRequest.selected_days) && rideRequest.selected_days.length > 0 ? (
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              Days: {rideRequest.selected_days.join(', ')}
            </Text>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            Seats needed: {rideRequest.required_seats || 1}
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            Preferred driver: {rideRequest.preferred_driver_gender || 'any'}
          </Text>
          {rideRequest.budget_per_seat ? (
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              Budget: {rideRequest.currency || 'PKR'} {rideRequest.budget_per_seat}/seat
            </Text>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Requester</Text>
          <Text style={[styles.locationText, { color: theme.colors.text }]}>{requesterName}</Text>
          {user && rideRequest.contact ? (
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{rideRequest.contact}</Text>
          ) : (
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>Login to view contact details.</Text>
          )}
        </View>

        {rideRequest.description ? (
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notes</Text>
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{rideRequest.description}</Text>
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
                onPress={() => navigation.navigate('Chat', {
                  userId: requesterUserId,
                  userName: rideRequest.user?.name || rideRequest.name || 'Rider',
                  type: 'ride_request',
                  serviceId: rideRequest.id,
                })}
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
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  ctaButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionsColumn: {
    gap: 12,
  },
});

export default RideRequestDetailScreen;
