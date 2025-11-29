import React, { createContext, useContext, useState, useEffect } from 'react';
import { theme, darkTheme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    setCurrentTheme(isDark ? darkTheme : theme);
    AsyncStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setIsDark(true);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

