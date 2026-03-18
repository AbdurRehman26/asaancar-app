import AsyncStorage from '@react-native-async-storage/async-storage';
import { pickDropFavoriteAPI } from '../services/api';

const FAVORITES_KEY = 'favorites_pick_drop';

export const favoritesManager = {
  // Get all favorites
  getFavorites: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const response = await pickDropFavoriteAPI.getFavorites();
        // The API returns a pagination object, the services are in the 'data' property
        let services = [];
        if (response && response.data) {
          services = response.data;
        } else if (Array.isArray(response)) {
          services = response;
        }
        
        // Sync local storage with server (optional but good for offline)
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(services));
        return services;
      }

      const favoritesStr = await AsyncStorage.getItem(FAVORITES_KEY);
      return favoritesStr ? JSON.parse(favoritesStr) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      // Fallback to local storage on error
      const favoritesStr = await AsyncStorage.getItem(FAVORITES_KEY);
      return favoritesStr ? JSON.parse(favoritesStr) : [];
    }
  },

  // Check if a service is favorite
  isFavorite: async (serviceId) => {
    try {
      const favorites = await favoritesManager.getFavorites();
      return favorites.some(fav => fav.id === serviceId);
    } catch (error) {
      return false;
    }
  },

  // Toggle favorite
  toggleFavorite: async (service) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const favorites = await favoritesManager.getFavorites();
      const index = favorites.findIndex(fav => fav.id === service.id);
      
      if (token) {
        if (index >= 0) {
          // Remove from server
          // Note: The API might expect the FAVORITE ID or the SERVICE ID.
          // The docs said the path is /favorites/{id} where id is the service ID.
          await pickDropFavoriteAPI.deleteFavorite(service.id);
        } else {
          // Add to server
          await pickDropFavoriteAPI.addFavorite(service.id);
        }
      }

      // Local update for immediate UI response and guest support
      let newFavorites = [...favorites];
      if (index >= 0) {
        newFavorites.splice(index, 1);
      } else {
        newFavorites.push({
          id: service.id,
          start_location: service.start_location,
          end_location: service.end_location,
          price_per_person: service.price_per_person,
          departure_time: service.departure_time,
          departure_date: service.departure_date,
          driver_gender: service.driver_gender,
          car: service.car,
          added_at: new Date().toISOString()
        });
      }
      
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      return index < 0; // Returns true if added, false if removed
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
};
