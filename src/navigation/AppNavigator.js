import React from 'react';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
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
import MyStoresScreen from '@/screens/MyStoresScreen';
import MyPickDropServicesScreen from '@/screens/MyPickDropServicesScreen';
import CreatePickDropServiceScreen from '@/screens/CreatePickDropServiceScreen';
import AddCarScreen from '@/screens/AddCarScreen';
import ChatScreen from '@/screens/ChatScreen';
import ConversationsScreen from '@/screens/ConversationsScreen';
import ContactUsScreen from '@/screens/ContactUsScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import AboutUsScreen from '@/screens/AboutUsScreen';
import CreateStoreScreen from '@/screens/CreateStoreScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main stack accessible without login
const MainStack = () => {
  const { theme } = useTheme();

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
        name="CreatePickDropService"
        component={CreatePickDropServiceScreen}
        options={{
          headerShown: false,
          presentation: 'card'
        }}
      />
      <Stack.Screen
        name="CarDetail"
        component={CarDetailScreen}
        options={{
          headerShown: false,
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
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            color: theme.colors.text,
          },
        }}
      />
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false
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
    <Stack.Navigator
      initialRouteName="SettingsMain"
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MyCars"
        component={MyCarsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddCar"
        component={AddCarScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MyStores"
        component={MyStoresScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateStore"
        component={CreateStoreScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MyPickDropServices"
        component={MyPickDropServicesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ContactUs"
        component={ContactUsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AboutUs"
        component={AboutUsScreen}
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
          } else if (route.name === 'Dashboard') {
            iconName = 'dashboard';
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
      <Tab.Screen
        name="Dashboard"
        component={SettingsStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Always navigate to SettingsMain when Dashboard tab is pressed
            // This ensures we always go to the default dashboard state
            const state = navigation.getState();
            const dashboardTab = state.routes.find(r => r.name === 'Dashboard');

            if (dashboardTab?.state) {
              const stackState = dashboardTab.state;
              // If we're not on SettingsMain, navigate to it
              if (stackState.index > 0 || stackState.routes[stackState.index]?.name !== 'SettingsMain') {
                e.preventDefault();
                navigation.navigate('Dashboard', {
                  screen: 'SettingsMain',
                });
              }
            }
          },
        })}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You can add a loading screen here
  }

  // If user is logged in, show Authenticated Tabs (skip onboarding)
  // If not logged in AND first launch, show Onboarding
  // Otherwise show MainStack

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Root" component={AuthenticatedTabs} />
        ) : (
          <Stack.Screen name="Root" component={MainStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

