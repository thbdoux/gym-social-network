import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { WorkoutLogFormData } from '../WorkoutLogWizard';
import { Ionicons } from '@expo/vector-icons';

type Step4FeedbackProps = {
  formData: WorkoutLogFormData;
  updateFormData: (data: Partial<WorkoutLogFormData>) => void;
  errors: Record<string, string>;
};

// Difficulty levels with translations and colors
const DIFFICULTY_LEVELS = [
  { id: 'easy', iconName: 'sunny-outline', color: '#10B981' }, // green
  { id: 'moderate', iconName: 'partly-sunny-outline', color: '#F59E0B' }, // amber
  { id: 'hard', iconName: 'flame-outline', color: '#EF4444' }, // red
  { id: 'very_hard', iconName: 'bonfire-outline', color: '#7F1D1D' }, // dark red
];

// Mood ratings with icons and colors
const MOOD_RATINGS = [
  { value: 1, iconName: 'sad-outline', color: '#EF4444' }, // Terrible - red
  { value: 2, iconName: 'sad-outline', color: '#F59E0B' }, // Bad - amber
  { value: 3, iconName: 'happy-outline', color: '#FBBF24' }, // Okay - yellow
  { value: 4, iconName: 'happy-outline', color: '#34D399' }, // Good - green
  { value: 5, iconName: 'happy-outline', color: '#10B981' }, // Great - emerald
];

const Step4Feedback = ({ formData, updateFormData, errors }: Step4FeedbackProps) => {
  const { t } = useLanguage();
  
  // Handle difficulty selection
  const handleDifficultySelect = (difficultyLevel: string) => {
    updateFormData({ difficulty_level: difficultyLevel });
  };
  
  // Handle mood rating selection
  const handleMoodSelect = (rating: number) => {
    updateFormData({ mood_rating: rating });
  };
  
  // Handle notes change
  const handleNotesChange = (text: string) => {
    updateFormData({ notes: text });
  };
  
  // Get mood description
  const getMoodDescription = (rating: number): string => {
    switch (rating) {
      case 1: return t('terrible');
      case 2: return t('bad');
      case 3: return t('okay');
      case 4: return t('good');
      case 5: return t('great');
      default: return '';
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t('workout_feedback')}</Text>
      
      {/* Difficulty selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('how_was_difficulty')}</Text>
        
        <View style={styles.difficultyOptions}>
          {DIFFICULTY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.difficultyOption,
                formData.difficulty_level === level.id && styles.difficultyOptionSelected,
                formData.difficulty_level === level.id && { borderColor: level.color }
              ]}
              onPress={() => handleDifficultySelect(level.id)}
            >
              <View
                style={[
                  styles.difficultyIconContainer,
                  { backgroundColor: `${level.color}20` } // 20% opacity
                ]}
              >
                <Ionicons name={level.iconName} size={24} color={level.color} />
              </View>
              <Text style={[
                styles.difficultyText,
                formData.difficulty_level === level.id && styles.difficultyTextSelected,
                formData.difficulty_level === level.id && { color: level.color }
              ]}>
                {t(level.id)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Mood rating */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('how_did_you_feel')}</Text>
        
        <View style={styles.moodContainer}>
          <View style={styles.moodSlider}>
            {MOOD_RATINGS.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodOption,
                  formData.mood_rating === mood.value && styles.moodOptionSelected,
                  formData.mood_rating === mood.value && { borderColor: mood.color }
                ]}
                onPress={() => handleMoodSelect(mood.value)}
              >
                <Ionicons 
                  name={mood.iconName} 
                  size={32} 
                  color={formData.mood_rating === mood.value ? mood.color : '#9CA3AF'} 
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.moodDescription}>
            {getMoodDescription(formData.mood_rating)}
          </Text>
        </View>
      </View>
      
      {/* Workout notes */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('workout_notes')} ({t('optional')})</Text>
        <TextInput
          value={formData.notes || ''}
          onChangeText={handleNotesChange}
          style={styles.textArea}
          placeholder={t('workout_notes_placeholder')}
          placeholderTextColor="#6B7280"
          selectionColor="#16a34a"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
      
      <Text style={styles.helpText}>
        {t('feedback_helps_track_progress')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  difficultyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyOptionSelected: {
    backgroundColor: '#111827',
    borderWidth: 2,
  },
  difficultyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  difficultyTextSelected: {
    fontWeight: 'bold',
  },
  moodContainer: {
    alignItems: 'center',
  },
  moodSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  moodOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodOptionSelected: {
    borderWidth: 2,
    backgroundColor: '#111827',
  },
  moodDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textArea: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 120,
  },
  helpText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  }
});

export default Step4Feedback;