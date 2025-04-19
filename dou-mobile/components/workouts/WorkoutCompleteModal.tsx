// components/workouts/WorkoutCompleteModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../../context/LanguageContext';

interface WorkoutCompleteModalProps {
  visible: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  completionPercentage: number;
  hasIncompleteExercises: boolean;
  themePalette: any;
}

const MOOD_OPTIONS = [
  { value: 1, label: 'terrible', icon: 'sad-outline' },
  { value: 2, label: 'bad', icon: 'remove-circle-outline' },
  { value: 3, label: 'okay', icon: 'ellipsis-horizontal-outline' },
  { value: 4, label: 'good', icon: 'add-circle-outline' },
  { value: 5, label: 'great', icon: 'happy-outline' }
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'easy', color: '#10b981' },
  { value: 'moderate', label: 'moderate', color: '#f59e0b' },
  { value: 'hard', label: 'hard', color: '#ef4444' }
];

const WorkoutCompleteModal: React.FC<WorkoutCompleteModalProps> = ({
  visible,
  onSubmit,
  onCancel,
  completionPercentage,
  hasIncompleteExercises,
  themePalette
}) => {
  const { t } = useLanguage();
  const [mood, setMood] = useState(3);
  const [difficulty, setDifficulty] = useState('moderate');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = () => {
    // Confirm submission if there are incomplete exercises
    if (hasIncompleteExercises) {
      Alert.alert(
        t('incomplete_workout'),
        t('incomplete_workout_confirm'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('submit_anyway'), 
            onPress: () => submitWorkout() 
          }
        ]
      );
    } else {
      submitWorkout();
    }
  };

  const submitWorkout = () => {
    const formattedTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
      
    onSubmit({
      mood_rating: mood,
      difficulty_level: difficulty,
      notes,
      tags: formattedTags
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} tint="dark" style={styles.blurView} />
        
        <View style={[styles.modalContent, { backgroundColor: themePalette.card_background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themePalette.text }]}>
              {t('complete_workout')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCancel}
            >
              <Ionicons name="close" size={24} color={themePalette.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Completion status */}
            <View style={styles.completionStatus}>
              <Text style={[styles.completionText, { color: themePalette.text }]}>
                {completionPercentage}% {t('completed')}
              </Text>
              <View style={[styles.completionBar, { backgroundColor: `${themePalette.text_tertiary}30` }]}>
                <View 
                  style={[
                    styles.completionBarFill, 
                    { 
                      width: `${completionPercentage}%`,
                      backgroundColor: completionPercentage === 100 
                        ? themePalette.success 
                        : completionPercentage >= 75
                          ? themePalette.warning
                          : themePalette.error
                    }
                  ]} 
                />
              </View>
              
              {hasIncompleteExercises && (
                <Text style={[styles.incompleteWarning, { color: themePalette.warning }]}>
                  {t('incomplete_exercises_warning')}
                </Text>
              )}
            </View>
            
            {/* Mood rating */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionLabel, { color: themePalette.text }]}>
                {t('how_was_your_workout')}
              </Text>
              
              <View style={styles.moodOptions}>
                {MOOD_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={`mood-${option.value}`}
                    style={[
                      styles.moodOption,
                      mood === option.value && { 
                        backgroundColor: `${themePalette.highlight}20`,
                        borderColor: themePalette.highlight
                      }
                    ]}
                    onPress={() => setMood(option.value)}
                  >
                    <Ionicons 
                      name={option.icon} 
                      size={24} 
                      color={mood === option.value ? themePalette.highlight : themePalette.text_secondary} 
                    />
                    <Text 
                      style={[
                        styles.moodLabel,
                        { color: mood === option.value ? themePalette.highlight : themePalette.text_secondary }
                      ]}
                    >
                      {t(option.label)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Difficulty level */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionLabel, { color: themePalette.text }]}>
                {t('workout_difficulty')}
              </Text>
              
              <View style={styles.difficultyOptions}>
                {DIFFICULTY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={`difficulty-${option.value}`}
                    style={[
                      styles.difficultyOption,
                      difficulty === option.value 
                        ? { backgroundColor: option.color } 
                        : { borderColor: themePalette.border }
                    ]}
                    onPress={() => setDifficulty(option.value)}
                  >
                    <Text 
                      style={[
                        styles.difficultyLabel,
                        difficulty === option.value 
                          ? { color: '#FFFFFF' }
                          : { color: themePalette.text }
                      ]}
                    >
                      {t(option.label)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Notes */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionLabel, { color: themePalette.text }]}>
                {t('notes')} ({t('optional')})
              </Text>
              
              <TextInput
                style={[
                  styles.notesInput,
                  { 
                    color: themePalette.text,
                    backgroundColor: themePalette.input_background,
                    borderColor: themePalette.border
                  }
                ]}
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('enter_workout_notes')}
                placeholderTextColor={themePalette.text_tertiary}
                textAlignVertical="top"
              />
            </View>
            
            {/* Tags */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionLabel, { color: themePalette.text }]}>
                {t('tags')} ({t('optional')}, {t('comma_separated')})
              </Text>
              
              <TextInput
                style={[
                  styles.tagsInput,
                  { 
                    color: themePalette.text,
                    backgroundColor: themePalette.input_background,
                    borderColor: themePalette.border
                  }
                ]}
                value={tags}
                onChangeText={setTags}
                placeholder={t('enter_tags_example')}
                placeholderTextColor={themePalette.text_tertiary}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: themePalette.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: themePalette.text }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: themePalette.success }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {t('save_workout')}
              </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  completionStatus: {
    marginBottom: 24,
  },
  completionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  completionBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionBarFill: {
    height: '100%',
  },
  incompleteWarning: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    width: '18%',
  },
  moodLabel: {
    fontSize: 8,
    marginTop: 4,
  },
  difficultyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
  },
  tagsInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 50,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WorkoutCompleteModal;