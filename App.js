import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import AppNavigator from '@/navigation/AppNavigator';
import SplashScreen from '@/components/SplashScreen';
import '@/i18n'; // Initialize i18n

const AppContent = () => {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AppNavigator />
      <Toast />
    </>
  );
};

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleSplashFinish = () => {
    setIsSplashVisible(false);
  };

  if (isSplashVisible) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <SplashScreen onFinish={handleSplashFinish} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

