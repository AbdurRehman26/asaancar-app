import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ServiceTabs = ({ activeTab, onTabChange }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'rental' && [
            styles.activeTab,
            { borderBottomColor: theme.colors.primary },
          ],
        ]}
        onPress={() => onTabChange('rental')}
      >
        <Icon
          name="directions-car"
          size={20}
          color={
            activeTab === 'rental'
              ? theme.colors.primary
              : theme.colors.textSecondary
          }
        />
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === 'rental'
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
            },
          ]}
        >
          Rental Cars
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'pickdrop' && [
            styles.activeTab,
            { borderBottomColor: theme.colors.primary },
          ],
        ]}
        onPress={() => onTabChange('pickdrop')}
      >
        <Icon
          name="location-on"
          size={20}
          color={
            activeTab === 'pickdrop'
              ? theme.colors.primary
              : theme.colors.textSecondary
          }
        />
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === 'pickdrop'
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
            },
          ]}
        >
          Pick & Drop
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceTabs;


