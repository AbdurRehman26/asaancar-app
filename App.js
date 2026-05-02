import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '@/context/AuthContext';
import { PushNotificationProvider } from '@/context/PushNotificationContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import AppNavigator from '@/navigation/AppNavigator';
import SplashScreen from '@/components/SplashScreen';
import ForceUpdateGate from '@/components/ForceUpdateGate';
import '@/i18n'; // Initialize i18n

const AppContent = () => {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ForceUpdateGate>
        <AppNavigator />
      </ForceUpdateGate>
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
        <PushNotificationProvider>
          <AppContent />
        </PushNotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
