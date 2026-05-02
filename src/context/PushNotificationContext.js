import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { fcmAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import i18n from '@/i18n';

const PUSH_TOKEN_STORAGE_KEY = 'pushDeviceToken';
const PUSH_PERMISSION_STORAGE_KEY = 'pushPermissionStatus';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PushNotificationContext = createContext(null);

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ||
  Constants.easConfig?.projectId ||
  null;

const setupAndroidNotificationChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7e246c',
  });
};

const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'web') {
    return {
      supported: false,
      status: 'unsupported',
      token: null,
      error: null,
    };
  }

  await setupAndroidNotificationChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const permissionResult = await Notifications.requestPermissionsAsync();
    finalStatus = permissionResult.status;
  }

  if (finalStatus !== 'granted') {
    return {
      supported: true,
      status: finalStatus,
      token: null,
      error: null,
    };
  }

  const projectId = getProjectId();
  const nativePushToken = await Notifications.getDevicePushTokenAsync();
  const expoPushToken = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : null;
  const resolvedToken = nativePushToken?.data || expoPushToken?.data || null;

  return {
    supported: true,
    status: finalStatus,
    token: resolvedToken,
    expoToken: expoPushToken?.data || null,
    error: null,
  };
};

export const PushNotificationProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [devicePushToken, setDevicePushToken] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [hasPromptedThisSession, setHasPromptedThisSession] = useState(false);

  const syncStoredState = useCallback(async () => {
    const [storedStatus, storedToken] = await Promise.all([
      AsyncStorage.getItem(PUSH_PERMISSION_STORAGE_KEY),
      AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY),
    ]);

    if (storedStatus) {
      setPermissionStatus(storedStatus);
    }

    if (storedToken) {
      setDevicePushToken(storedToken);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        await syncStoredState();

        if (Platform.OS !== 'web') {
          await setupAndroidNotificationChannel();
          const permissions = await Notifications.getPermissionsAsync();
          if (isMounted && permissions?.status) {
            setPermissionStatus(permissions.status);
          }
        } else if (isMounted) {
          setPermissionStatus('unsupported');
        }
      } catch (bootstrapError) {
        if (isMounted) {
          setError(bootstrapError?.message || 'Failed to initialize push notifications.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    const receivedSubscription =
      Platform.OS === 'web'
        ? { remove: () => {} }
        : Notifications.addNotificationReceivedListener((notification) => {
            setLastNotification(notification);
          });

    const responseSubscription =
      Platform.OS === 'web'
        ? { remove: () => {} }
        : Notifications.addNotificationResponseReceivedListener((response) => {
            setLastNotification(response?.notification || null);
          });

    return () => {
      isMounted = false;
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [syncStoredState]);

  useEffect(() => {
    if (!user) {
      setHasPromptedThisSession(false);
    }
  }, [user]);

  const enablePushNotifications = useCallback(async () => {
    try {
      setIsRegistering(true);
      setError('');

      const result = await registerForPushNotificationsAsync();

      setPermissionStatus(result.status || 'unknown');
      await AsyncStorage.setItem(PUSH_PERMISSION_STORAGE_KEY, result.status || 'unknown');

      if (result.token) {
        setDevicePushToken(result.token);
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, result.token);

        try {
          await fcmAPI.registerToken({
            token: result.token,
            device_name: Constants.deviceName || Constants.platform?.android?.model || null,
            platform: Platform.OS,
            app_version: Constants.nativeAppVersion || Constants.expoConfig?.version || null,
          });
        } catch (fcmError) {
          const message = fcmError?.response?.data?.message || fcmError?.message || 'Failed to register FCM token.';
          setError(message);
          return {
            ...result,
            error: message,
          };
        }
      }

      if (result.expoToken) {
        setExpoPushToken(result.expoToken);
      }

      return result;
    } catch (registrationError) {
      const message = registrationError?.message || 'Failed to register for push notifications.';
      setError(message);
      return {
        supported: true,
        status: 'error',
        token: null,
        error: message,
      };
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const disablePushNotifications = useCallback(async () => {
    try {
      setIsRegistering(true);
      setError('');
      setHasPromptedThisSession(true);

      const storedToken = devicePushToken || (await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY));

      if (storedToken) {
        try {
          await fcmAPI.deleteToken(storedToken);
        } catch (fcmError) {
          const message = fcmError?.response?.data?.message || fcmError?.message || 'Failed to disable push notifications.';
          setError(message);
          return {
            ok: false,
            error: message,
          };
        }
      }

      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
      setDevicePushToken(null);
      setExpoPushToken(null);

      return { ok: true };
    } catch (disableError) {
      const message = disableError?.message || 'Failed to disable push notifications.';
      setError(message);
      return {
        ok: false,
        error: message,
      };
    } finally {
      setIsRegistering(false);
    }
  }, [devicePushToken]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    if (loading || authLoading || isRegistering || hasPromptedThisSession) {
      return;
    }

    if (!user || devicePushToken) {
      return;
    }

    setHasPromptedThisSession(true);

    Alert.alert(
      i18n.t('notifications.enablePromptTitle'),
      i18n.t('notifications.enablePromptMessage'),
      [
        {
          text: i18n.t('notifications.notNow'),
          style: 'cancel',
        },
        {
          text: i18n.t('notifications.enablePush'),
          onPress: () => {
            enablePushNotifications();
          },
        },
      ]
    );
  }, [
    authLoading,
    devicePushToken,
    enablePushNotifications,
    hasPromptedThisSession,
    isRegistering,
    loading,
    user,
  ]);

  const value = useMemo(
    () => ({
      permissionStatus,
      devicePushToken,
      expoPushToken,
      lastNotification,
      loading,
      isRegistering,
      error,
      isSupported: Platform.OS !== 'web',
      enablePushNotifications,
      disablePushNotifications,
      clearPushError: () => setError(''),
    }),
    [
      permissionStatus,
      devicePushToken,
      expoPushToken,
      lastNotification,
      loading,
      isRegistering,
      error,
      enablePushNotifications,
      disablePushNotifications,
    ]
  );

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
};

export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);

  if (!context) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }

  return context;
};
