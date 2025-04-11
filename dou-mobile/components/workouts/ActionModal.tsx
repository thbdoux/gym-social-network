// components/workouts/ActionModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';

interface ActionModalProps {
  visible: boolean;
  currentView: string;
  onClose: () => void;
  onCreateProgram: () => void;
  onCreateTemplate: () => void;
  onLogWorkout: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({
  visible,
  currentView,
  onClose,
  onCreateProgram,
  onCreateTemplate,
  onLogWorkout
}) => {
  const { t } = useLanguage();

  // Get action modal title
  const getActionModalTitle = () => {
    switch (currentView) {
      case 'programs':
        return t('program_options');
      case 'workout_history':
        return t('workout_options');
      case 'templates':
        return t('template_options');
      default:
        return t('select_action');
    }
  };

  // Get action gradient colors
  const getActionGradient = () => {
    switch (currentView) {
      case 'programs':
        return ['#7e22ce', '#9333ea'];
      case 'workout_history':
        return ['#16a34a', '#22c55e'];
      case 'templates':
        return ['#2563eb', '#3b82f6'];
      default:
        return ['#9333EA', '#D946EF'];
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
          
          {/* Modal Header with Gradient */}
          <LinearGradient
            colors={getActionGradient()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeaderGradient}
          >
            <Text style={styles.modalTitle}>{getActionModalTitle()}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
          
          {/* Modal Content */}
          <View style={styles.modalContent}>
            {/* Modal Content for Workout History View Options */}
            {currentView === 'workout_history' && (
              <>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    onClose();
                    // This will be implemented later
                    Alert.alert(t('coming_soon'), t('feature_coming_soon'));
                  }}
                >
                  <View style={styles.modalOptionIcon}>
                    <Ionicons name="play-circle" size={24} color="#16a34a" />
                  </View>
                  <View style={styles.modalOptionText}>
                    <Text style={styles.modalOptionTitle}>{t('start_workout')}</Text>
                    <Text style={styles.modalOptionDescription}>
                      {t('start_new_workout_session')}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={onLogWorkout}
                >
                  <View style={styles.modalOptionIcon}>
                    <Ionicons name="add-circle" size={24} color="#16a34a" />
                  </View>
                  <View style={styles.modalOptionText}>
                    <Text style={styles.modalOptionTitle}>{t('log_workout')}</Text>
                    <Text style={styles.modalOptionDescription}>
                      {t('record_completed_workout')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
            
            {/* Programs View Options */}
            {currentView === 'programs' && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={onCreateProgram}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="add-circle" size={24} color="#7e22ce" />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionTitle}>{t('create_program')}</Text>
                  <Text style={styles.modalOptionDescription}>
                    {t('design_new_workout_program')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            
            {/* Templates View Options */}
            {currentView === 'templates' && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={onCreateTemplate}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="add-circle" size={24} color="#2563eb" />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionTitle}>{t('create_template')}</Text>
                  <Text style={styles.modalOptionDescription}>
                    {t('create_new_workout_template')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
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

export default ActionModal;