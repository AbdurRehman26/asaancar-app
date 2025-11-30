import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '@/services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      const response = await authAPI.login(phone, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const loginWithOtp = async (phone, otp) => {
    try {
      const response = await authAPI.verifyLoginOtp(phone, otp);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const setUserFromStorage = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      return null;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      setUser(response.user);
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
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithOtp, register, logout, setUserFromStorage, updateUser }}>
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


