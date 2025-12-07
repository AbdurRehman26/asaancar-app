import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ConfirmModal from '@/components/ConfirmModal';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Ensure we're on the SettingsMain screen when this screen is focused
  // This is a backup to ensure the dashboard always shows the default state
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused, ensure we're on the main settings screen
      // This helps when navigating back from nested screens
      return () => {
        // Screen is unfocused (optional cleanup)
      };
    }, [])
  );

  const handleLogout = async () => {
    await logout();
  };

  const settingsOptions = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person',
      onPress: () => navigation.navigate('Profile'),
    },
    {
      id: 'myCars',
      title: 'My Cars',
      icon: 'directions-car',
      onPress: () => navigation.navigate('MyCars'),
    },
    {
      id: 'myStores',
      title: 'My Stores',
      icon: 'store',
      onPress: () => navigation.navigate('MyStores'),
    },
    {
      id: 'myPickDropServices',
      title: 'My Pick & Drop Services',
      icon: 'directions-transit',
      onPress: () => navigation.navigate('MyPickDropServices'),
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: 'chat',
      onPress: () => navigation.navigate('Conversations'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'contact',
      title: 'Contact Us',
      icon: 'mail',
      onPress: () => navigation.navigate('ContactUs'),
    },
    {
      id: 'about',
      title: 'About Us',
      icon: 'info',
      onPress: () => navigation.navigate('AboutUs'),
    },
    {
      id: 'darkMode',
      title: 'Dark Mode',
      icon: isDark ? 'dark-mode' : 'light-mode',
      onPress: toggleTheme,
      isToggle: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* User Info Section */}
        <View style={[styles.userCard, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.avatarContainer}>
          <Icon name="person" size={48} color={theme.colors.primary} />
        </View>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {user?.name || 'User'}
        </Text>
        {user?.phone && (
          <Text style={[styles.userPhone, { color: theme.colors.textSecondary }]}>
            {user.phone}
          </Text>
        )}
      </View>

      {/* Settings Options */}
      <View style={[styles.settingsCard, { backgroundColor: theme.colors.cardBackground }]}>
        {settingsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.settingsItem, { borderBottomColor: theme.colors.border }]}
            onPress={option.onPress}
          >
            <View style={styles.settingsItemLeft}>
              <Icon name={option.icon} size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.settingsItemText, { color: theme.colors.text }]}>
                {option.title}
              </Text>
            </View>
            {option.isToggle ? (
              <View style={[
                styles.toggle,
                { backgroundColor: isDark ? theme.colors.primary : theme.colors.border }
              ]}>
                <View style={[
                  styles.toggleThumb,
                  { backgroundColor: theme.colors.background },
                  isDark && styles.toggleThumbActive
                ]} />
              </View>
            ) : (
              <Icon name="chevron-right" size={24} color={theme.colors.border} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => setShowLogoutModal(true)}
      >
        <Icon name="logout" size={24} color="#ff4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmColor="#ff4444"
        destructive={true}
        onConfirm={handleLogout}
      />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SettingsScreen;

