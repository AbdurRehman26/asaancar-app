import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://asaancar.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API endpoints
export const carAPI = {
  // Get list of cars with filters
  getCars: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.per_page) {
      params.append('per_page', filters.per_page);
    }
    
    // Add filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] && key !== 'page' && key !== 'per_page') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/cars?${params.toString()}`);
    return response.data;
  },

  // Get car by ID
  getCarById: async (id) => {
    const response = await api.get(`/cars/${id}`);
    return response.data;
  },
};

export const carBrandAPI = {
  // Get all car brands
  getBrands: async () => {
    const response = await api.get('/car-brands');
    return response.data;
  },
};

export const carTypeAPI = {
  // Get all car types
  getTypes: async () => {
    const response = await api.get('/car-types');
    return response.data;
  },
};

export const bookingAPI = {
  // Create a booking
  createBooking: async (bookingData) => {
    const response = await api.post('/customer/booking', bookingData);
    return response.data;
  },

  // Get user bookings
  getBookings: async () => {
    const response = await api.get('/customer/booking');
    return response.data;
  },

  // Get booking by ID
  getBookingById: async (id) => {
    const response = await api.get(`/customer/booking/${id}`);
    return response.data;
  },
};

export const storeAPI = {
  // Get all stores
  getStores: async () => {
    const response = await api.get('/customer/store');
    return response.data;
  },

  // Get store by ID
  getStoreById: async (id) => {
    const response = await api.get(`/stores/${id}`);
    return response.data;
  },
};

export const pickDropAPI = {
  // Get pick and drop services with filters
  getPickDropServices: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.per_page) {
      params.append('per_page', filters.per_page);
    }
    
    // Add filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] && key !== 'page' && key !== 'per_page') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/pick-and-drop?${params.toString()}`);
    return response.data;
  },
};

export const authAPI = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default api;

