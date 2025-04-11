// components/workouts/DeleteConfirmationModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedItems: number[];
  currentView: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  selectedItems,
  currentView
}) => {
  const { t } = useLanguage();

  // Get the type name based on current view and item count
  const getTypeName = () => {
    switch (currentView) {
      case 'programs':
        return selectedItems.length === 1 ? t('program') : t('programs');
      case 'workout_history':
        return selectedItems.length === 1 ? t('workout_log') : t('workout_logs');
      case 'templates':
        return selectedItems.length === 1 ? t('template') : t('templates');
      default:
        return selectedItems.length === 1 ? t('item') : t('items');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
          
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeaderGradient}
          >
            <Text style={styles.modalTitle}>{t('confirm_delete')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={styles.modalContent}>
            <Text style={styles.deleteConfirmText}>
              {t('delete_confirm_message', { 
                count: selectedItems.length,
                type: getTypeName()
              })}
            </Text>
            
            <View style={styles.deleteButtons}>
              <TouchableOpacity 
                style={styles.cancelDeleteButton}
                onPress={onClose}
              >
                <Text style={styles.cancelDeleteText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmDeleteButton}
                onPress={onConfirm}
              >
                <Text style={styles.confirmDeleteText}>{t('delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  modalBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelDeleteButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelDeleteText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default DeleteConfirmationModal;