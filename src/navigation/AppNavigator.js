import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';


// Screens
import PickDropScreen from '@/screens/PickDropScreen';
import PickDropDetailScreen from '@/screens/PickDropDetailScreen';
import StoreProfileScreen from '@/screens/StoreProfileScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import MyBookingsScreen from '@/screens/MyBookingsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import MyPickDropServicesScreen from '@/screens/MyPickDropServicesScreen';
import CreatePickDropServiceScreen from '@/screens/CreatePickDropServiceScreen';
import ChatScreen from '@/screens/ChatScreen';
import ConversationsScreen from '@/screens/ConversationsScreen';
import ContactUsScreen from '@/screens/ContactUsScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import AboutUsScreen from '@/screens/AboutUsScreen';
import CreateStoreScreen from '@/screens/CreateStoreScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerifySignupOtpScreen from '@/screens/VerifySignupOtpScreen';
import SetPasswordModal from '@/components/SetPasswordModal';
import RideRequestsScreen from '@/screens/RideRequestsScreen';
import RideRequestDetailScreen from '@/screens/RideRequestDetailScreen';
import RideRequestFormScreen from '@/screens/RideRequestFormScreen';
import MyRideRequestsScreen from '@/screens/MyRideRequestsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main stack accessible without login
const MainStack = ({ initialScreen }) => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName={initialScreen || 'PickDrop'}
    >
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
        name="StoreProfile"
        component={StoreProfileScreen}
        options={{
          headerShown: false
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
      <Stack.Screen
        name="VerifySignupOtp"
        component={VerifySignupOtpScreen}
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
        name="CreatePickDropService"
        component={CreatePickDropServiceScreen}
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

const RideRequestsStack = () => {
  return (
    <Stack.Navigator initialRouteName="RideRequestsMain">
      <Stack.Screen
        name="RideRequestsMain"
        component={RideRequestsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RideRequestDetail"
        component={RideRequestDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateRideRequest"
        component={RideRequestFormScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyRideRequests"
        component={MyRideRequestsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Authenticated tabs (only shown when logged in)
const AuthenticatedTabs = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'alt-route';
          } else if (route.name === 'RideRequests') {
            iconName = 'description';
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
      <Tab.Screen
        name="Home"
        component={MainStack}
        options={{ tabBarLabel: 'Find Ride' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Always reset Home tab to PickDrop when pressed
            e.preventDefault();
            navigation.navigate('Home', {
              screen: 'PickDrop',
            });
          },
        })}
      />
      <Tab.Screen
        name="RideRequests"
        component={RideRequestsStack}
        options={{ tabBarLabel: 'Ride Requests' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('RideRequests', {
              screen: 'RideRequestsMain',
            });
          },
        })}
      />
      <Tab.Screen
        name="Dashboard"
        component={SettingsStack}
        options={{ tabBarLabel: t('navigation.dashboard') }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Always reset Dashboard tab to SettingsMain when pressed
            e.preventDefault();
            navigation.navigate('Dashboard', {
              screen: 'SettingsMain',
            });
          },
        })}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [isOnboardingVisible, setIsOnboardingVisible] = React.useState(null);

  React.useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('IS_ONBOARDING_COMPLETE');
      setIsOnboardingVisible(value === null);
    } catch (error) {
      setIsOnboardingVisible(false);
    }
  };

  if (loading || isOnboardingVisible === null) {
    return null; // You can add a loading screen here
  }

  // If user is logged in, show Authenticated Tabs (skip onboarding)
  // If not logged in AND first launch, show Onboarding
  // Otherwise show MainStack

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={user ? 'Root' : isOnboardingVisible ? 'Onboarding' : 'Root'}
        >
          <Stack.Screen name="Root">
            {({ route }) => (user ? <AuthenticatedTabs /> : <MainStack initialScreen={route.params?.screen} />)}
          </Stack.Screen>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <SetPasswordModal />
    </View>
  );
};

export default AppNavigator;
