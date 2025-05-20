import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { WorkoutTemplateFormData } from '../WorkoutTemplateWizard';
import { Ionicons } from '@expo/vector-icons';

type Step1WorkoutNameProps = {
  formData: WorkoutTemplateFormData;
  updateFormData: (data: Partial<WorkoutTemplateFormData>) => void;
  errors: Record<string, string>;
};

type WorkoutSuggestion = {
  id: string;
  name: string;
  icon: string;
  focus: string;
  difficulty_level: string;
};

const Step1WorkoutName = ({ formData, updateFormData, errors }: Step1WorkoutNameProps) => {
  const { t } = useLanguage();
  
  // Simplified workout suggestions
  const WORKOUT_SUGGESTIONS: WorkoutSuggestion[] = [
    { id: 'u1', name: t('upper_body_strength'), icon: 'body-outline', focus: 'strength', difficulty_level: 'intermediate' },
    { id: 'l1', name: t('leg_day'), icon: 'barbell-outline', focus: 'strength', difficulty_level: 'intermediate' },
    { id: 'f1', name: t('full_body_workout'), icon: 'fitness-outline', focus: 'strength', difficulty_level: 'intermediate' },
    { id: 'p1', name: t('push_day'), icon: 'arrow-up-outline', focus: 'strength', difficulty_level: 'intermediate' },
    { id: 'pu1', name: t('pull_day'), icon: 'arrow-down-outline', focus: 'strength', difficulty_level: 'intermediate' },
    { id: 'c1', name: t('cardio_session'), icon: 'heart-outline', focus: 'endurance', difficulty_level: 'intermediate' },
    { id: 'h1', name: t('hiit_workout'), icon: 'stopwatch-outline', focus: 'endurance', difficulty_level: 'advanced' },
    { id: 'cus', name: t('custom_workout'), icon: 'create-outline', focus: 'general_fitness', difficulty_level: 'intermediate' }
  ];

  // Handle workout selection
  const selectWorkout = (workout: WorkoutSuggestion) => {
    // If custom workout, just update focus and difficulty
    if (workout.id === 'cus') {
      updateFormData({
        focus: workout.focus,
        difficulty_level: workout.difficulty_level
      });
    } else {
      updateFormData({
        name: workout.name,
        focus: workout.focus,
        difficulty_level: workout.difficulty_level
      });
    }
  };
  
  // Handle custom name input
  const handleNameChange = (text: string) => {
    updateFormData({ name: text });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t('workout_name_question')}</Text>
      
      {/* Text input for workout name */}
      <TextInput
        value={formData.name}
        onChangeText={handleNameChange}
        style={[
          styles.input,
          errors.name && styles.inputError
        ]}
        placeholder={t('enter_workout_name')}
        placeholderTextColor="#6B7280"
        selectionColor="#0ea5e9"
        autoCapitalize="words"
      />
      
      {errors.name ? (
        <Text style={styles.errorText}>{errors.name}</Text>
      ) : null}
      
      
      <Text style={styles.helpText}>
        {t('workout_name_help')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444', // red-500
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginTop: 20,
    marginBottom: 16,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  suggestionCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  suggestionCardSelected: {
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)', // blue-500 with opacity
  },
  suggestionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    textAlign: 'center',
  },
  helpText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  }
});

export default Step1WorkoutName;