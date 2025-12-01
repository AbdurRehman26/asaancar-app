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

  // Get user's own cars
  getMyCars: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.per_page) {
      params.append('per_page', filters.per_page);
    }
    
    // Add other filters if needed
    Object.keys(filters).forEach((key) => {
      if (filters[key] && key !== 'page' && key !== 'per_page') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/my-cars?${queryString}` : '/my-cars';
    const response = await api.get(url);
    return response.data;
  },

  // Create car
  createCar: async (carData) => {
    const response = await api.post('/cars', carData);
    return response.data;
  },

  // Update car
  updateCar: async (id, carData) => {
    const response = await api.put(`/cars/${id}`, carData);
    return response.data;
  },

  // Delete car
  deleteCar: async (id) => {
    const response = await api.delete(`/cars/${id}`);
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

  // Get user bookings with pagination
  getBookings: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.per_page) {
      params.append('per_page', filters.per_page);
    }
    
    // Add other filters if needed
    Object.keys(filters).forEach((key) => {
      if (filters[key] && key !== 'page' && key !== 'per_page') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/bookings?${queryString}` : '/bookings';
    const response = await api.get(url);
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

  // Get user's stores (for dropdown)
  getMyStoresList: async () => {
    const response = await api.get('/my-stores?per_page=100');
    return response.data;
  },

  // Get user's own stores
  getMyStores: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.per_page) {
      params.append('per_page', filters.per_page);
    }
    
    // Add other filters if needed
    Object.keys(filters).forEach((key) => {
      if (filters[key] && key !== 'page' && key !== 'per_page') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/my-stores?${queryString}` : '/my-stores';
    const response = await api.get(url);
    return response.data;
  },

  // Get store by ID
  getStoreById: async (id) => {
    const response = await api.get(`/stores/${id}`);
    return response.data;
  },

  // Update store
  updateStore: async (id, storeData) => {
    const response = await api.put(`/stores/${id}`, storeData);
    return response.data;
  },

  // Delete store
  deleteStore: async (id) => {
    const response = await api.delete(`/stores/${id}`);
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

  // Create pick and drop service
  createPickAndDropService: async (serviceData) => {
    const response = await api.post('/pick-and-drop', serviceData);
    return response.data;
  },

  // Get user's own pick and drop services
  getMyPickDropServices: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.per_page) {
      params.append('per_page', filters.per_page);
    }
    
    // Add other filters if needed
    Object.keys(filters).forEach((key) => {
      if (filters[key] && key !== 'page' && key !== 'per_page') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/my-pick-and-drop?${queryString}` : '/my-pick-and-drop';
    const response = await api.get(url);
    return response.data;
  },

  // Update pick and drop service
  updatePickDropService: async (id, serviceData) => {
    const response = await api.put(`/pick-and-drop/${id}`, serviceData);
    return response.data;
  },

  // Delete pick and drop service
  deletePickDropService: async (id) => {
    const response = await api.delete(`/pick-and-drop/${id}`);
    return response.data;
  },
};

export const authAPI = {
  // Login with phone number and password
  login: async (phone, password) => {
    const response = await api.post('/login', { 
      login_method: 'password',
      phone_number: phone,
      password: password
    });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Send login OTP
  sendLoginOtp: async (phone) => {
    const response = await api.post('/send-login-otp', { phone_number: phone });
    // If response includes token and user, store them (auto-login scenario)
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  // Verify login OTP
  verifyLoginOtp: async (phone, otp) => {
    const response = await api.post('/verify-login-otp', { phone_number: phone, otp });
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

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/user/profile', userData);
    if (response.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.post('/user/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },
};

export const chatAPI = {
  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (conversationId, page = 1, perPage = 50) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('per_page', perPage);
    const response = await api.get(`/chat/conversations/${conversationId}/messages?${params.toString()}`);
    return response.data;
  },

  // Send a message
  sendMessage: async (conversationId, message) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      message: message,
    });
    return response.data;
  },

  // Create or get conversation with a user
  getOrCreateConversation: async (userId) => {
    const response = await api.post('/chat/conversations', {
      user_id: userId,
    });
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (conversationId, messageIds = []) => {
    const response = await api.post(`/chat/conversations/${conversationId}/read`, {
      message_ids: messageIds,
    });
    return response.data;
  },
};

export const contactAPI = {
  // Send contact message
  sendContactMessage: async (contactData) => {
    const response = await api.post('/contact-messages', contactData);
    return response.data;
  },
};

export const notificationAPI = {
  // Get all notifications with pagination
  getNotifications: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.per_page) {
      params.append('per_page', filters.per_page);
    }
    
    // Add other filters if needed
    Object.keys(filters).forEach((key) => {
      if (filters[key] && key !== 'page' && key !== 'per_page') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    const response = await api.get(url);
    return response.data;
  },

  // Get notification by ID
  getNotificationById: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default api;

