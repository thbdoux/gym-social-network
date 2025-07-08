// components/workouts/ActionModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { router } from 'expo-router';

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
  const { 
    workoutPalette, 
    programPalette, 
    workoutLogPalette, 
    palette 
  } = useTheme();

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
        return [programPalette.background, programPalette.highlight];
      case 'workout_history':
        return [workoutLogPalette.background, workoutLogPalette.highlight];
      case 'templates':
        return [workoutPalette.background, workoutPalette.highlight];
      default:
        return [palette.accent, palette.highlight];
    }
  };

  // Get appropriate highlight color based on current view
  const getHighlightColor = () => {
    switch (currentView) {
      case 'programs':
        return programPalette.highlight;
      case 'workout_history':
        return workoutLogPalette.highlight;
      case 'templates':
        return workoutPalette.highlight;
      default:
        return palette.highlight;
    }
  };

  // Handle start real-time workout
  const handleStartRealtimeWorkout = () => {
    onClose();
    router.push('/realtime-workout?source=custom');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer,
          { borderColor: palette.border }
        ]}>
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
          <View style={[
            styles.modalContent, 
            { backgroundColor: palette.card_background }
          ]}>
            {/* Modal Content for Workout History View Options */}
            {currentView === 'workout_history' && (
              <>
                {/* NEW: Real-time workout logging option */}
                <TouchableOpacity
                  style={[
                    styles.modalOption, 
                    styles.highlightedOption,
                    { 
                      backgroundColor: 'rgba(22, 163, 74, 0.15)',
                      borderLeftColor: workoutLogPalette.highlight
                    }
                  ]}
                  onPress={handleStartRealtimeWorkout}
                >
                  <View style={[
                    styles.modalOptionIcon,
                    { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  ]}>
                    <Ionicons name="stopwatch-outline" size={24} color={workoutLogPalette.highlight} />
                  </View>
                  <View style={styles.modalOptionText}>
                    <Text style={[styles.modalOptionTitle, { color: palette.text }]}>
                      {t('realtime_workout')}
                    </Text>
                    <Text style={[styles.modalOptionDescription, { color: palette.text_secondary }]}>
                      {t('track_workout_in_realtime')}
                    </Text>
                  </View>
                  <View style={[styles.newFeatureBadge, { backgroundColor: palette.error }]}>
                    <Text style={styles.newFeatureText}>{t('new')}</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { backgroundColor: 'rgba(17, 24, 39, 0.6)' }
                  ]}
                  onPress={onLogWorkout}
                >
                  <View style={[
                    styles.modalOptionIcon,
                    { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  ]}>
                    <Ionicons name="add-circle" size={24} color={workoutLogPalette.highlight} />
                  </View>
                  <View style={styles.modalOptionText}>
                    <Text style={[styles.modalOptionTitle, { color: palette.text }]}>
                      {t('log_workout')}
                    </Text>
                    <Text style={[styles.modalOptionDescription, { color: palette.text_secondary }]}>
                      {t('record_completed_workout')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
            
            {/* Programs View Options */}
            {currentView === 'programs' && (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  { backgroundColor: 'rgba(17, 24, 39, 0.6)' }
                ]}
                onPress={onCreateProgram}
              >
                <View style={[
                  styles.modalOptionIcon,
                  { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                ]}>
                  <Ionicons name="add-circle" size={24} color={programPalette.highlight} />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={[styles.modalOptionTitle, { color: palette.text }]}>
                    {t('create_program')}
                  </Text>
                  <Text style={[styles.modalOptionDescription, { color: palette.text_secondary }]}>
                    {t('design_new_workout_program')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            
            {/* Templates View Options */}
            {currentView === 'templates' && (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  { backgroundColor: 'rgba(17, 24, 39, 0.6)' }
                ]}
                onPress={onCreateTemplate}
              >
                <View style={[
                  styles.modalOptionIcon,
                  { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                ]}>
                  <Ionicons name="add-circle" size={24} color={workoutPalette.highlight} />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={[styles.modalOptionTitle, { color: palette.text }]}>
                    {t('create_template')}
                  </Text>
                  <Text style={[styles.modalOptionDescription, { color: palette.text_secondary }]}>
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
    marginBottom: 10,
    position: 'relative',
  },
  highlightedOption: {
    borderLeftWidth: 4,
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
  },
  newFeatureBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newFeatureText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});

export default ActionModal;