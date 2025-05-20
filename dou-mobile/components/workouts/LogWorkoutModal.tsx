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
  themePalette: any;
}

const LogWorkoutModal: React.FC<LogWorkoutModalProps> = ({
  visible,
  onClose,
  onLogFromProgram,
  onLogFromTemplate,
  onLogFromScratch,
  themePalette
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
            colors={[themePalette.accent, themePalette.highlight]}
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
          
          <View style={[styles.modalContent, { backgroundColor: themePalette.card_background }]}>
            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: `${themePalette.accent}15` }]}
              onPress={onLogFromProgram}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: `${themePalette.accent}20` }]}>
                <Ionicons name="albums-outline" size={24} color={themePalette.accent} />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: themePalette.text }]}>
                  {t('from_program')}
                </Text>
                <Text style={[styles.modalOptionDescription, { color: themePalette.text_secondary }]}>
                  {t('log_from_current_program')}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: `${themePalette.accent}15` }]}
              onPress={onLogFromTemplate}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: `${themePalette.accent}20` }]}>
                <Ionicons name="document-text-outline" size={24} color={themePalette.accent} />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: themePalette.text }]}>
                  {t('from_template')}
                </Text>
                <Text style={[styles.modalOptionDescription, { color: themePalette.text_secondary }]}>
                  {t('log_from_workout_template')}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: `${themePalette.accent}15` }]}
              onPress={onLogFromScratch}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: `${themePalette.accent}20` }]}>
                <Ionicons name="create-outline" size={24} color={themePalette.accent} />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: themePalette.text }]}>
                  {t('from_scratch')}
                </Text>
                <Text style={[styles.modalOptionDescription, { color: themePalette.text_secondary }]}>
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
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginBottom: 4,
  },
  modalOptionDescription: {
    fontSize: 13,
  }
});

export default LogWorkoutModal;