import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { forceUpdateAPI } from '@/services/api';

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

  return {
    version: nativeVersion || configVersion || '0.0.0',
    versionCode: Number(nativeBuildVersion || configVersionCode || 0),
  };
};

const resolveForceUpdateConfig = (remoteConfig, localConfig) => ({
  enabled: remoteConfig?.enabled ?? localConfig?.enabled,
  minimumVersion: remoteConfig?.minimumVersion ?? localConfig?.minimumVersion,
  minimumVersionCode: remoteConfig?.minimumVersionCode ?? localConfig?.minimumVersionCode,
  message: remoteConfig?.message || localConfig?.message,
  title: remoteConfig?.title || localConfig?.title,
  storeUrl: remoteConfig?.storeUrl || localConfig?.storeUrl,
});

const getForceUpdateDecision = (config, installedInfo) => {
  const minimumVersion = config.minimumVersion ? String(config.minimumVersion) : null;
  const minimumVersionCode =
    config.minimumVersionCode !== undefined && config.minimumVersionCode !== null
      ? Number(config.minimumVersionCode)
      : null;

  const isVersionOutdated =
    minimumVersion && compareVersionStrings(installedInfo.version, minimumVersion) < 0;
  const isBuildOutdated =
    Number.isFinite(minimumVersionCode) &&
    minimumVersionCode > 0 &&
    installedInfo.versionCode > 0 &&
    installedInfo.versionCode < minimumVersionCode;

  const hasThresholds = Boolean(minimumVersion || minimumVersionCode);
  const explicitlyRequired = normalizeBoolean(config.enabled);

  return {
    required:
      (hasThresholds && (isVersionOutdated || isBuildOutdated)) ||
      (!hasThresholds && explicitlyRequired),
    minimumVersion,
    minimumVersionCode,
  };
};

const ForceUpdateGate = ({ children }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [state, setState] = React.useState({
    checking: true,
    required: false,
    title: null,
    message: null,
    storeUrl: null,
    minimumVersion: null,
    minimumVersionCode: null,
  });

  React.useEffect(() => {
    let isMounted = true;

    const checkForceUpdate = async () => {
      const expoConfig = Constants.expoConfig || Constants.manifest || {};
      const localConfig = expoConfig?.extra?.forceUpdate || {};
      const endpoint = localConfig?.endpoint || expoConfig?.extra?.forceUpdateEndpoint;
      const packageName = expoConfig?.android?.package;

      try {
        let remoteConfig = endpoint ? await forceUpdateAPI.getConfig(endpoint) : null;

        if (!remoteConfig && Platform.OS === 'android' && packageName) {
          const playStoreVersion = await forceUpdateAPI.getPlayStoreVersion(packageName);
          if (playStoreVersion) {
            remoteConfig = {
              enabled: true,
              minimumVersion: playStoreVersion,
              storeUrl: localConfig?.storeUrl,
              message: localConfig?.message,
              title: localConfig?.title,
            };
          }
        }

        const mergedConfig = resolveForceUpdateConfig(remoteConfig, localConfig);
        const installedInfo = getInstalledAppInfo();
        const decision = getForceUpdateDecision(mergedConfig, installedInfo);

        if (!isMounted) {
          return;
        }

        setState({
          checking: false,
          required: decision.required,
          title: mergedConfig.title || null,
          message: mergedConfig.message || null,
          storeUrl: mergedConfig.storeUrl || null,
          minimumVersion: decision.minimumVersion,
          minimumVersionCode: decision.minimumVersionCode,
        });
      } catch (error) {
        console.error('Force update check failed:', error);

        if (!isMounted) {
          return;
        }

        setState((prev) => ({
          ...prev,
          checking: false,
        }));
      }
    };

    checkForceUpdate();

    return () => {
      isMounted = false;
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
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.cardBackground || theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.secondary}20` }]}>
          <Icon name="system-update-alt" size={44} color={theme.colors.secondary} />
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.colors.textLight }]}>{message}</Text>

        <View style={[styles.versionBox, { backgroundColor: theme.colors.backgroundSecondary || theme.colors.background }]}>
          <Text style={[styles.versionLabel, { color: theme.colors.textLight }]}>
            {t('forceUpdate.currentVersion')}
          </Text>
          <Text style={[styles.versionValue, { color: theme.colors.text }]}>
            {installedInfo.version}
            {installedInfo.versionCode ? ` (${installedInfo.versionCode})` : ''}
          </Text>

          {(state.minimumVersion || state.minimumVersionCode) ? (
            <>
              <Text style={[styles.versionLabel, styles.requiredSpacing, { color: theme.colors.textLight }]}>
                {t('forceUpdate.requiredVersion')}
              </Text>
              <Text style={[styles.versionValue, { color: theme.colors.text }]}>
                {state.minimumVersion || t('forceUpdate.latestBuild')}
                {state.minimumVersionCode ? ` (${state.minimumVersionCode})` : ''}
              </Text>
            </>
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={openStore}
        >
          <Text style={styles.buttonText}>{t('forceUpdate.updateNow')}</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
  },
  versionBox: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  versionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  versionValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  requiredSpacing: {
    marginTop: 16,
  },
  button: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default ForceUpdateGate;
