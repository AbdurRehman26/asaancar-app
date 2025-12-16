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

  /* Redesigned Dashboard Component */
  const menuGridItems = [
    {
      id: 'myCars',
      title: 'My Cars',
      icon: 'directions-car',
      color: '#4F46E5', // Indigo
      onPress: () => navigation.navigate('MyCars'),
    },
    {
      id: 'myPickDrop',
      title: 'My Pick & Drop',
      icon: 'directions-transit',
      color: '#0EA5E9', // Sky Blue
      onPress: () => navigation.navigate('MyPickDropServices'),
    },
    {
      id: 'myStores',
      title: 'My Stores',
      icon: 'store',
      color: '#EC4899', // Pink
      onPress: () => navigation.navigate('MyStores'),
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: 'chat-bubble',
      color: '#10B981', // Emerald
      onPress: () => navigation.navigate('Conversations'),
    },
  ];

  const secondaryMenuItems = [
    {
      id: 'profile',
      title: 'Edit Profile',
      icon: 'person',
      onPress: () => navigation.navigate('Profile'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'contact',
      title: 'Contact Support',
      icon: 'support-agent',
      onPress: () => navigation.navigate('ContactUs'),
    },
    {
      id: 'about',
      title: 'About Us',
      icon: 'info',
      onPress: () => navigation.navigate('AboutUs'),
    }
  ];

  const renderGridItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.gridCard, { backgroundColor: theme.colors.cardBackground }]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.gridIconContainer, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={[styles.gridTitle, { color: theme.colors.text }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Modern Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>Welcome back,</Text>
              <Text style={[styles.headerName, { color: theme.colors.text }]}>{user?.name || 'Guest'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarContainer}>
              <Icon name="person" size={32} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
        </View>

        <View style={styles.gridContainer}>
          {menuGridItems.map(renderGridItem)}
        </View>

        {/* Secondary Menu List */}
        <View style={[styles.menuListContainer, { backgroundColor: theme.colors.cardBackground }]}>
          {secondaryMenuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuListItem,
                index < secondaryMenuItems.length - 1 && { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuListLeft}>
                <View style={[styles.smallIconBox, { backgroundColor: theme.colors.backgroundTertiary }]}>
                  <Icon name={item.icon} size={20} color={theme.colors.text} />
                </View>
                <Text style={[styles.menuListText, { color: theme.colors.text }]}>{item.title}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}

          {/* Dark Mode Toggle */}
          <View style={[styles.menuListItem, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <View style={styles.menuListLeft}>
              <View style={[styles.smallIconBox, { backgroundColor: theme.colors.backgroundTertiary }]}>
                <Icon name={isDark ? "dark-mode" : "light-mode"} size={20} color={theme.colors.text} />
              </View>
              <Text style={[styles.menuListText, { color: theme.colors.text }]}>Dark Mode</Text>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.toggle,
                { backgroundColor: isDark ? theme.colors.primary : theme.colors.border }
              ]}
            >
              <View style={[
                styles.toggleThumb,
                { backgroundColor: '#fff' },
                isDark && styles.toggleThumbActive
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: '#ff4444' }]}
          onPress={() => setShowLogoutModal(true)}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerName: {
    fontSize: 26,
    fontWeight: '800', // Extra bold for premium feel
    letterSpacing: -0.5,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6', // Light gray default
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16, // Use gap for spacing (RN 0.71+)
  },
  gridCard: {
    width: '47%', // Slightly less than half to account for gap
    aspectRatio: 1.1, // Almost square but slightly rectangular
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  menuListContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 8,
    marginBottom: 24,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  menuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  smallIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuListText: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 0,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
  },
});

export default SettingsScreen;

