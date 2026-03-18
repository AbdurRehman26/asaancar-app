import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { favoritesManager } from '@/utils/favorites';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PageHeader from '@/components/PageHeader';
import { useTranslation } from 'react-i18next';
import ErrorModal from '@/components/ErrorModal';

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await favoritesManager.getFavorites();
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setErrorMessage(t('common.errorLoadingData'));
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const toggleFavorite = async (service) => {
    try {
      await favoritesManager.toggleFavorite(service);
      // Remove from list immediately
      setFavorites(prev => prev.filter(fav => fav.id !== service.id));
    } catch (error) {
      console.error('Error removing favorite:', error);
      setErrorMessage(t('common.errorUpdatingData'));
      setShowErrorModal(true);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    if (typeof timeString === 'string' && timeString.includes(':')) {
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        let h = parseInt(parts[0]);
        const m = parts[1].substring(0, 2);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
      }
    }
    return timeString;
  };

  const renderFavoriteItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: isDark ? theme.colors.border : theme.colors.primary,
            shadowColor: isDark ? '#000' : theme.colors.primary,
          }
        ]}
        onPress={() => {
          navigation.navigate('PickDropDetail', { serviceId: item.id, serviceData: item });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.routeContainer}>
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
                {item.start_location || t('pickdrop.startPoint')}
              </Text>
              <TouchableOpacity
                onPress={() => toggleFavorite(item)}
                style={styles.favoriteButton}
              >
                <Icon name="favorite" size={24} color="#FF5252" />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
            
            <View style={styles.locationRow}>
              <Icon name="location-on" size={16} color={theme.colors.primary} style={styles.locationIcon} />
              <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
                {item.end_location || t('pickdrop.destination')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Icon name="access-time" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {item.departure_time ? formatTime(item.departure_time) : t('pickdrop.flexible')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="people-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {item.available_spaces || item.available_seats || 0} {t('pickdrop.seats')}
              </Text>
            </View>
          </View>
          
          <View style={[styles.priceTag, { backgroundColor: isDark ? 'rgba(126, 36, 108, 0.2)' : 'rgba(126, 36, 108, 0.08)' }]}>
            <Text style={[styles.priceValue, { color: isDark ? '#c77dba' : theme.colors.primary }]}>
              {item.currency || 'PKR'} {item.price_per_person || item.price || 0}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <PageHeader
        title={t('common.favorites')}
        backDestination="Profile"
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="favorite-border" size={64} color={theme.colors.textLight} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('pickdrop.noFavoritesFound') || 'No favorites yet'}
              </Text>
              <TouchableOpacity
                style={[styles.exploreButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('PickDrop')}
              >
                <Text style={styles.exploreButtonText}>{t('common.explore') || 'Explore Services'}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

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
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    marginBottom: 12,
  },
  routeContainer: {
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    marginLeft: 4,
  },
  locationIcon: {
    marginRight: 6,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  line: {
    width: 1,
    height: 12,
    marginLeft: 7.5,
    marginVertical: 2,
  },
  favoriteButton: {
    padding: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  priceTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '500',
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default FavoritesScreen;
