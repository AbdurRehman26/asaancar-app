import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AppState,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { forceUpdateAPI } from '@/services/api';

const { width } = Dimensions.get('window');

const normalizeBoolean = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'required'].includes(normalized);
  }
  return false;
};

const parseVersionPart = (part) => {
  const numeric = String(part || '0').match(/\d+/);
  return numeric ? Number(numeric[0]) : 0;
};

const parseBuildNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
  }

  return 0;
};

const compareVersionStrings = (currentVersion, minimumVersion) => {
  const currentParts = String(currentVersion || '0').split('.');
  const minimumParts = String(minimumVersion || '0').split('.');
  const maxLength = Math.max(currentParts.length, minimumParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const current = parseVersionPart(currentParts[index]);
    const minimum = parseVersionPart(minimumParts[index]);

    if (current > minimum) return 1;
    if (current < minimum) return -1;
  }

  return 0;
};

const buildDefaultStoreUrls = () => {
  const expoConfig = Constants.expoConfig || Constants.manifest || {};
  const packageName = expoConfig?.android?.package || 'com.asaancar.app';
  const bundleIdentifier = expoConfig?.ios?.bundleIdentifier || packageName;

  return {
    android: {
      primary: `market://details?id=${packageName}`,
      fallback: `https://play.google.com/store/apps/details?id=${packageName}`,
    },
    ios: {
      primary: `itms-apps://itunes.apple.com/app/id${bundleIdentifier}`,
      fallback: `https://apps.apple.com/app/id${bundleIdentifier}`,
    },
  };
};

const getInstalledAppInfo = () => {
  const expoConfig = Constants.expoConfig || Constants.manifest || {};
  const nativeVersion = Constants.nativeAppVersion;
  const nativeBuildVersion = Constants.nativeBuildVersion;
  const configVersion = expoConfig?.version;
  const configVersionCode = expoConfig?.android?.versionCode;
  const parsedNativeBuildVersion = parseBuildNumber(nativeBuildVersion);
  const parsedConfigVersionCode = parseBuildNumber(configVersionCode);

  return {
    version: nativeVersion || configVersion || '0.0.0',
    // On real APK/AAB installs, prefer the native installed build number.
    versionCode: parsedNativeBuildVersion || parsedConfigVersionCode || 0,
  };
};

const shouldSkipForceUpdateCheck = () => {
  // Set this to true to test the force update screen in development/simulator
  const TEST_FORCE_UPDATE = false;
  if (TEST_FORCE_UPDATE) {
    return false;
  }

  return false;
};

const canEnforceForceUpdate = () => Constants.executionEnvironment !== 'storeClient';

const resolveForceUpdateConfig = (remoteConfig, localConfig) => ({
  enabled: remoteConfig?.enabled ?? localConfig?.enabled,
  androidVersion: remoteConfig?.androidVersion ?? null,
  androidBuildCode: remoteConfig?.androidBuildCode ?? null,
  message: remoteConfig?.message || localConfig?.message,
  title: remoteConfig?.title || localConfig?.title,
  storeUrl: remoteConfig?.storeUrl || localConfig?.storeUrl,
});

const normalizeForceUpdateEndpoint = (endpoint) => {
  if (!endpoint) {
    return '/config';
  }

  const normalized = String(endpoint).trim();
  if (
    normalized === '/settings/force-update' ||
    normalized === 'settings/force-update' ||
    normalized.endsWith('/api/settings/force-update')
  ) {
    return '/config';
  }

  return normalized;
};

const getForceUpdateDecision = (config, installedInfo) => {
  const androidVersion = config.androidVersion ? String(config.androidVersion) : null;
  const androidBuildCode =
    config.androidBuildCode !== undefined && config.androidBuildCode !== null
      ? Number(config.androidBuildCode)
      : null;

  const isVersionOutdated =
    androidVersion && compareVersionStrings(installedInfo.version, androidVersion) < 0;
  const isBuildOutdated =
    Number.isFinite(androidBuildCode) &&
    androidBuildCode > 0 &&
    installedInfo.versionCode > 0 &&
    installedInfo.versionCode < androidBuildCode;

  const hasThresholds = Boolean(androidVersion || androidBuildCode);
  const explicitlyRequired = normalizeBoolean(config.enabled);

  return {
    required:
      (hasThresholds && (isVersionOutdated || isBuildOutdated)) ||
      (!hasThresholds && explicitlyRequired),
    minimumVersion: androidVersion,
    minimumVersionCode: androidBuildCode,
  };
};

const ForceUpdateGate = ({ children }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const appState = useRef(AppState.currentState);
  const [state, setState] = useState({
    checking: true,
    required: false,
    title: null,
    message: null,
    storeUrl: null,
    minimumVersion: null,
    minimumVersionCode: null,
  });

  const checkForceUpdate = async (isManual = false) => {
    console.log('[ForceUpdate] Initiating version check. isManual:', isManual);
    if (shouldSkipForceUpdateCheck()) {
      console.log('[ForceUpdate] Version check skipped based on shouldSkipForceUpdateCheck rules.');
      setState((prev) => ({
        ...prev,
        checking: false,
        required: false,
      }));
      return;
    }

    if (isManual) {
      setState((prev) => ({ ...prev, checking: true }));
    }

    const expoConfig = Constants.expoConfig || Constants.manifest || {};
    const localConfig = expoConfig?.extra?.forceUpdate || {};
    const endpoint = normalizeForceUpdateEndpoint(
      localConfig?.endpoint || expoConfig?.extra?.forceUpdateEndpoint
    );

    const packageName = expoConfig?.android?.package;
    console.log('[ForceUpdate] Config resolved:', { endpoint, packageName, localConfig });

    try {
      console.log('[ForceUpdate] Fetching remote config from endpoint:', endpoint);
      // Try to get remote config from endpoint first
      let remoteConfig = endpoint ? await forceUpdateAPI.getConfig(endpoint) : null;
      console.log('[ForceUpdate] Remote config response:', remoteConfig);

      // If no endpoint or fetch failed, and we're on Android, try Play Store scraping
      if (!remoteConfig && Platform.OS === 'android' && packageName) {
        console.log('[ForceUpdate] No remote config or fetch failed. Attempting Play Store scraping...');
        try {
          const playStoreVersion = await forceUpdateAPI.getPlayStoreVersion(packageName);
          console.log('[ForceUpdate] Play Store version resolved:', playStoreVersion);
          if (playStoreVersion) {
            remoteConfig = {
              enabled: true,
              androidVersion: playStoreVersion,
              storeUrl: localConfig?.storeUrl,
              message: localConfig?.message,
              title: localConfig?.title,
            };
          }
        } catch (scrapeError) {
          console.warn('[ForceUpdate] Play Store scraping failed:', scrapeError);
        }
      }

      const mergedConfig = resolveForceUpdateConfig(remoteConfig, localConfig);
      const installedInfo = getInstalledAppInfo();
      const decision = getForceUpdateDecision(mergedConfig, installedInfo);
      const shouldEnforce = canEnforceForceUpdate();

      console.log('[ForceUpdate] Decision resolved:', {
        installedInfo,
        mergedConfig,
        decision,
        enforced: shouldEnforce,
        executionEnvironment: Constants.executionEnvironment,
      });

      setState({
        checking: false,
        required: shouldEnforce ? decision.required : false,
        title: mergedConfig.title || null,
        message: mergedConfig.message || null,
        storeUrl: mergedConfig.storeUrl || null,
        minimumVersion: decision.minimumVersion,
        minimumVersionCode: decision.minimumVersionCode,
      });
    } catch (error) {
      console.error('[ForceUpdate] Force update check failed with error:', error);
      setState((prev) => ({
        ...prev,
        checking: false,
      }));
    }
  };

  useEffect(() => {
    checkForceUpdate();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        checkForceUpdate();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const openStore = async () => {
    const defaultUrls = buildDefaultStoreUrls();
    const configuredStoreUrl = state.storeUrl;
    const platformUrls = defaultUrls[Platform.OS] || defaultUrls.android;
    const primaryUrl = configuredStoreUrl || platformUrls.primary;
    const fallbackUrl = platformUrls.fallback;

    try {
      const supported = await Linking.canOpenURL(primaryUrl);
      if (supported) {
        await Linking.openURL(primaryUrl);
        return;
      }
    } catch (error) {
      console.error('Failed to open primary store URL:', error);
    }

    try {
      await Linking.openURL(fallbackUrl);
    } catch (error) {
      console.error('Failed to open fallback store URL:', error);
    }
  };

  if (state.checking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          {t('forceUpdate.checking')}
        </Text>
      </View>
    );
  }

  if (!state.required) {
    return children;
  }

  const installedInfo = getInstalledAppInfo();
  const title = state.title || t('forceUpdate.title');
  const message = state.message || t('forceUpdate.message');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.secondary + '20', theme.colors.background]}
        style={styles.gradient}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.cardBackground || theme.colors.backgroundSecondary || '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 5,
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.secondary, theme.colors.secondary + 'CC']}
            style={styles.iconWrap}
          >
            <Icon name="system-update-alt" size={40} color="#fff" />
          </LinearGradient>

          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textLight || '#666' }]}>
            {message}
          </Text>

          <View style={[styles.versionBox, { backgroundColor: theme.colors.background + '80' }]}>
            <View style={styles.versionRow}>
              <View>
                <Text style={[styles.versionLabel, { color: theme.colors.textLight || '#666' }]}>
                  {t('forceUpdate.currentVersion')}
                </Text>
                <Text style={[styles.versionValue, { color: theme.colors.text }]}>
                  {installedInfo.version}
                  {installedInfo.versionCode ? ` (${installedInfo.versionCode})` : ''}
                </Text>
              </View>
              
              {(state.minimumVersion || state.minimumVersionCode) ? (
                <View style={styles.versionDivider} />
              ) : null}

              {(state.minimumVersion || state.minimumVersionCode) ? (
                <View>
                  <Text style={[styles.versionLabel, { color: theme.colors.textLight || '#666' }]}>
                    {t('forceUpdate.requiredVersion')}
                  </Text>
                  <Text style={[styles.versionValue, { color: theme.colors.secondary }]}>
                    {state.minimumVersion || t('forceUpdate.latestBuild')}
                    {state.minimumVersionCode ? ` (${state.minimumVersionCode})` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.buttonContainer}
            onPress={openStore}
          >
            <LinearGradient
              colors={[theme.colors.secondary, theme.colors.secondary + 'EE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{t('forceUpdate.updateNow')}</Text>
              <Icon name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => checkForceUpdate(true)}
            style={styles.retryButton}
          >
            <Text style={[styles.retryText, { color: theme.colors.textLight || '#666' }]}>
              Already updated? Tap to check again
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    width: '100%',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  versionBox: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 32,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  versionDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  versionValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  buttonContainer: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default ForceUpdateGate;
