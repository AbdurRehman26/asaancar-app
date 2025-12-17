import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { storeAPI } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';

const CreateStoreScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('Karachi');
  const [storeUsername, setStoreUsername] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUri, setLogoUri] = useState('');

  // City options
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta'];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (error) {
      setErrorMessage('Failed to pick image');
      setShowErrorModal(true);
    }
  };

  const handleCreateStore = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter store name');
      setShowErrorModal(true);
      return;
    }

    if (!contactPhone.trim()) {
      setErrorMessage('Please enter contact phone');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('city', city);
      formData.append('store_username', storeUsername);
      formData.append('description', description);
      formData.append('contact_phone', contactPhone);
      formData.append('address', address);

      if (logoUri) {
        const fileName = logoUri.split('/').pop();
        const fileType = `image/${fileName.split('.').pop()}`;
        formData.append('logo', {
          uri: logoUri,
          name: fileName,
          type: fileType,
        });
      }

      const response = await storeAPI.createStore(formData);
      
      // Check if response has data or is successful
      const hasData = response && (response.data || response.id || response.success !== false);
      
      if (hasData) {
        setSuccessMessage('Store created successfully!');
        setShowSuccessModal(true);
        setTimeout(() => {
          navigation.navigate('MyStores');
        }, 1500);
      } else {
        setErrorMessage(response?.message || 'Failed to create store');
        setShowErrorModal(true);
      }
    } catch (error) {
      // Handle validation errors (422) and other error responses
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // Handle 422 validation errors
        if (status === 422 && data.errors) {
          // Extract all validation error messages
          const errorMessages = Object.values(data.errors)
            .flat()
            .join('\n');
          setErrorMessage(errorMessages || 'Validation failed. Please check your inputs.');
        } else if (data.message) {
          // Use message from response if available
          setErrorMessage(data.message);
        } else {
          setErrorMessage(`Error: ${status}. Please try again.`);
        }
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to create store');
      }
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Create Store</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* Name Field */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Enter store name"
              placeholderTextColor={theme.colors.placeholder}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* City Field */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>City</Text>
              <View style={[styles.select, { 
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border
              }]}>
                <Text style={[styles.selectText, { color: theme.colors.text }]}>{city}</Text>
                <TouchableOpacity style={styles.selectIcon}>
                  <Icon name="expand-more" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Store Username Field */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Store Username (optional)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="e.g., downtown_rental"
              placeholderTextColor={theme.colors.placeholder}
              value={storeUsername}
              onChangeText={setStoreUsername}
            />
          </View>

          {/* Description Field */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Enter store description"
              placeholderTextColor={theme.colors.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Logo Upload */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Logo</Text>
            <TouchableOpacity 
              style={[styles.uploadBox, { 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.backgroundSecondary
              }]}
              onPress={pickImage}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <>
                  <Icon name="cloud-upload" size={32} color={theme.colors.primary} />
                  <Text style={[styles.uploadText, { color: theme.colors.textSecondary }]}>
                    Click to upload or drag and drop
                  </Text>
                  <Text style={[styles.uploadSubtext, { color: theme.colors.textLight }]}>
                    PNG, JPG, GIF, WEBP up to 2MB each
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Contact Phone */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Contact Phone</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="+92..."
              placeholderTextColor={theme.colors.placeholder}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Address Field */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Address</Text>
            <TextInput
              style={[styles.input, styles.textarea, { 
                backgroundColor: theme.colors.backgroundSecondary, 
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Enter store address"
              placeholderTextColor={theme.colors.placeholder}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Create Store Button */}
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateStore}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.buttonText} />
            ) : (
              <Text style={[styles.createButtonText, { color: theme.colors.buttonText }]}>
                Create Store
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  select: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 14,
  },
  selectIcon: {
    padding: 4,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  createButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateStoreScreen;
