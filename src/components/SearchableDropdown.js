import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SearchableDropdown = ({
  label,
  options = [],
  value,
  onSelect,
  placeholder = 'Select...',
  style,
  searchable = true,
  onSearch,
  loading = false,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const searchTimeoutRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value || opt.id === value);

  useEffect(() => {
    if (searchable && onSearch && searchQuery) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
    } else if (searchable && !searchQuery) {
      // Reset to all options when search is cleared
      setFilteredOptions(options);
    } else if (!searchable) {
      // Filter locally if not using API search
      if (searchQuery) {
        const filtered = options.filter((opt) =>
          opt.label?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredOptions(filtered);
      } else {
        setFilteredOptions(options);
      }
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, options, searchable, onSearch]);

  useEffect(() => {
    // Update filtered options when options change
    if (!searchable || !onSearch) {
      setFilteredOptions(options);
    }
  }, [options, searchable, onSearch]);

  const handleSelect = (selectedValue) => {
    onSelect(selectedValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchQuery('');
    setFilteredOptions(options);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[styles.dropdown, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
        onPress={handleOpen}
      >
        <Text style={[styles.dropdownText, { color: selectedOption ? theme.colors.text : theme.colors.textSecondary }]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Icon name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Search Input */}
            {searchable && (
              <View style={[styles.searchContainer, { borderColor: theme.colors.border }]}>
                <Icon name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.text }]}
                  placeholder="Search locations..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {loading && (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                )}
              </View>
            )}

            {/* Options List */}
            {filteredOptions.length > 0 ? (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.value?.toString() || item.id?.toString() || item.label}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      (value === item.value || value === item.id) && [
                        styles.optionSelected,
                        { backgroundColor: theme.colors.primary + '20' },
                      ],
                    ]}
                    onPress={() => handleSelect(item.value || item.id)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: theme.colors.text },
                        (value === item.value || value === item.id) && { color: theme.colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {(value === item.value || value === item.id) && (
                      <Icon name="check" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {loading ? 'Loading...' : 'No locations found'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: 12,
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default SearchableDropdown;









