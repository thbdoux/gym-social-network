// components/workouts/LogWorkoutModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';

interface LogWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onLogFromProgram: () => void;
  onLogFromTemplate: () => void;
  onLogFromScratch: () => void;
}

const LogWorkoutModal: React.FC<LogWorkoutModalProps> = ({
  visible,
  onClose,
  onLogFromProgram,
  onLogFromTemplate,
  onLogFromScratch
}) => {
  const { t } = useLanguage();

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
            colors={['#16a34a', '#22c55e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeaderGradient}
          >
            <Text style={styles.modalTitle}>{t('log_workout_method')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={onLogFromProgram}
            >
              <View style={styles.modalOptionIcon}>
                <Ionicons name="albums-outline" size={24} color="#16a34a" />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>{t('from_program')}</Text>
                <Text style={styles.modalOptionDescription}>
                  {t('log_from_current_program')}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={onLogFromTemplate}
            >
              <View style={styles.modalOptionIcon}>
                <Ionicons name="document-text-outline" size={24} color="#16a34a" />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>{t('from_template')}</Text>
                <Text style={styles.modalOptionDescription}>
                  {t('log_from_workout_template')}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={onLogFromScratch}
            >
              <View style={styles.modalOptionIcon}>
                <Ionicons name="create-outline" size={24} color="#16a34a" />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>{t('from_scratch')}</Text>
                <Text style={styles.modalOptionDescription}>
                  {t('create_new_workout_log')}
                </Text>
              </View>
            </TouchableOpacity>
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
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    marginBottom: 10,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalOptionDescription: {
    fontSize: 13,
    color: '#D1D5DB',
  },
});

export default LogWorkoutModal;