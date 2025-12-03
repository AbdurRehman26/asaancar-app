import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { contactAPI } from '@/services/api';
import SuccessModal from '@/components/SuccessModal';
import ErrorModal from '@/components/ErrorModal';

const ContactUsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendMessage = async () => {
    // Validation
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
      setShowErrorModal(true);
      return;
    }

    if (!contactInfo.trim()) {
      setErrorMessage('Please enter your contact information');
      setShowErrorModal(true);
      return;
    }

    if (!message.trim()) {
      setErrorMessage('Please enter your message');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      await contactAPI.sendContactMessage({
        name: name.trim(),
        contact_information: contactInfo.trim(),
        message: message.trim(),
      });
      
      setShowSuccessModal(true);
      // Reset form
      setName('');
      setContactInfo('');
      setMessage('');
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        'Failed to send message. Please try again.'
      );
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Contact Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Contact Us</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Have a question or need help? Fill out the form below and our team will get back to you soon.
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, { backgroundColor: theme.colors.cardBackground }]}>
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.placeholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Contact Information Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Contact Information</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Email or phone number"
                placeholderTextColor={theme.colors.placeholder}
                value={contactInfo}
                onChangeText={setContactInfo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Message Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Message</Text>
            <View style={[styles.textAreaWrapper, { borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.textArea, { color: theme.colors.text }]}
                placeholder="Enter your message"
                placeholderTextColor={theme.colors.placeholder}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
              loading && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Message</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Message Sent"
        message="Thank you for contacting us! We'll get back to you soon."
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 120,
  },
  textArea: {
    fontSize: 16,
    padding: 0,
    minHeight: 100,
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactUsScreen;





