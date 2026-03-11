import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '@/services/api';

const AuthContext = createContext({});

// Normalize password-set flags coming from the API into a single boolean
const isPasswordSetTruthy = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === '1' || lower === 'true';
  }
  return false;
};

const normalizeUser = (userData) => {
  if (!userData) return null;

  // Backend may return { data: user } or just user
  const raw = userData.data || userData;

  const hasPasswordSet =
    isPasswordSetTruthy(raw.has_password) ||
    isPasswordSetTruthy(raw.password_set) ||
    isPasswordSetTruthy(raw.is_password_set) ||
    isPasswordSetTruthy(raw.hasPasswordSet);

  return {
    data: raw,
    hasPasswordSet,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(normalizeUser(userData));
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      const response = await authAPI.login(phone, password);
      setUser(normalizeUser(response.user));
      return response;
    } catch (error) {
      throw error;
    }
  };

  const loginWithOtp = async (phone, otp) => {
    try {
      const response = await authAPI.verifyLoginOtp(phone, otp);
      setUser(normalizeUser(response.user));
      return response;
    } catch (error) {
      throw error;
    }
  };

  const registerWithOtp = async (phone, otp, name = null) => {
    try {
      const response = await authAPI.verifySignupOtp(phone, otp, name);
      setUser(normalizeUser(response.user));
      return response;
    } catch (error) {
      throw error;
    }
  };

  const setUserFromStorage = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      const normalized = normalizeUser(userData);
      setUser(normalized);
      return normalized;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      return null;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      setUser(normalizeUser(response.user));
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = (userData) => {
    setUser(normalizeUser(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithOtp, register, registerWithOtp, logout, setUserFromStorage, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


