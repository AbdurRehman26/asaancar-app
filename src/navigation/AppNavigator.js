import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from '@/screens/HomeScreen';
import PickDropScreen from '@/screens/PickDropScreen';
import PickDropDetailScreen from '@/screens/PickDropDetailScreen';
import CarDetailScreen from '@/screens/CarDetailScreen';
import StoreProfileScreen from '@/screens/StoreProfileScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import BookingScreen from '@/screens/BookingScreen';
import MyBookingsScreen from '@/screens/MyBookingsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import MyCarsScreen from '@/screens/MyCarsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main stack accessible without login
const MainStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="RentalCars"
    >
      <Stack.Screen 
        name="RentalCars" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PickDrop" 
        component={PickDropScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PickDropDetail" 
        component={PickDropDetailScreen}
        options={{ 
          headerShown: false,
          presentation: 'card'
        }}
      />
      <Stack.Screen 
        name="CarDetail" 
        component={CarDetailScreen}
        options={{ 
          title: 'Car Details',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="StoreProfile" 
        component={StoreProfileScreen}
        options={{ 
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Booking" 
        component={BookingScreen}
        options={{ 
          title: 'Book Car',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false
        }}
      />
    </Stack.Navigator>
  );
};

// Settings stack (nested inside tabs)
const SettingsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="MyCars"
        component={MyCarsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Authenticated tabs (only shown when logged in)
const AuthenticatedTabs = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Bookings') {
            iconName = 'book';
          } else if (route.name === 'Settings') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={MainStack} />
      <Tab.Screen name="Bookings" component={MyBookingsScreen} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      {user ? <AuthenticatedTabs /> : <MainStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;

