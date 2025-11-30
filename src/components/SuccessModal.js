import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';

const SuccessModal = ({ visible, onClose, title = 'Success', message, onConfirm }) => {
  const { theme } = useTheme();

  if (!theme) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View 
              style={[
                styles.modalContainer, 
                { 
                  backgroundColor: theme.colors.cardBackground || theme.colors.background 
                }
              ]}
            >
              <View style={styles.header}>
                <Icon 
                  name="check-circle" 
                  size={48} 
                  color={theme.colors.primary || '#7e246c'} 
                />
                <Text 
                  style={[
                    styles.title, 
                    { color: theme.colors.text || '#1a1a1a' }
                  ]}
                >
                  {title}
                </Text>
                <Text 
                  style={[
                    styles.message, 
                    { color: theme.colors.textSecondary || '#666666' }
                  ]}
                >
                  {message}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button, 
                  { backgroundColor: theme.colors.primary || '#7e246c' }
                ]}
                onPress={() => {
                  if (onConfirm) {
                    onConfirm();
                  }
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SuccessModal;


