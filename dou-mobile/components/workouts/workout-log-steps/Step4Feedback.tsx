import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { WorkoutLogFormData } from '../WorkoutLogWizard';
import { Ionicons } from '@expo/vector-icons';

type Step4FeedbackProps = {
  formData: WorkoutLogFormData;
  updateFormData: (data: Partial<WorkoutLogFormData>) => void;
  errors: Record<string, string>;
};

// Difficulty levels with translations
const DIFFICULTY_LEVELS = [
  { id: 'easy', iconName: 'sunny-outline' },
  { id: 'moderate', iconName: 'partly-sunny-outline' },
  { id: 'hard', iconName: 'flame-outline' },
  { id: 'very_hard', iconName: 'bonfire-outline' },
];

// Mood ratings with icons
const MOOD_RATINGS = [
  { value: 1, iconName: 'sad-outline' },
  { value: 2, iconName: 'sad-outline' },
  { value: 3, iconName: 'happy-outline' },
  { value: 4, iconName: 'happy-outline' },
  { value: 5, iconName: 'happy-outline' },
];

const Step4Feedback = ({ formData, updateFormData, errors }: Step4FeedbackProps) => {
  const { t } = useLanguage();
  const { workoutLogPalette, palette } = useTheme();
  
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

  // Get difficulty color
  const getDifficultyColor = (difficultyId: string) => {
    switch (difficultyId) {
      case 'easy': return palette.success;
      case 'moderate': return palette.warning;
      case 'hard': return palette.error;
      case 'very_hard': return '#7F1D1D'; // dark red
      default: return palette.text_tertiary;
    }
  };

  // Get mood color
  const getMoodColor = (rating: number) => {
    switch (rating) {
      case 1: return palette.error;
      case 2: return palette.warning;
      case 3: return '#FBBF24'; // yellow
      case 4: return palette.success;
      case 5: return workoutLogPalette.highlight;
      default: return palette.text_tertiary;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: workoutLogPalette.text }]}>
          {t('workout_feedback')}
        </Text>
        
        {/* Difficulty selector */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: workoutLogPalette.text }]}>
            {t('how_was_difficulty')}
          </Text>
          
          <View style={styles.difficultyOptions}>
            {DIFFICULTY_LEVELS.map((level) => {
              const isSelected = formData.difficulty_level === level.id;
              const difficultyColor = getDifficultyColor(level.id);
              
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.difficultyOption,
                    { 
                      backgroundColor: palette.card_background,
                      borderColor: isSelected ? difficultyColor : palette.border,
                      borderWidth: isSelected ? 2 : 1
                    }
                  ]}
                  onPress={() => handleDifficultySelect(level.id)}
                >
                  <View
                    style={[
                      styles.difficultyIconContainer,
                      { backgroundColor: `${difficultyColor}20` } // 20% opacity
                    ]}
                  >
                    <Ionicons 
                      name={level.iconName} 
                      size={24} 
                      color={difficultyColor} 
                    />
                  </View>
                  <Text style={[
                    styles.difficultyText,
                    { 
                      color: isSelected ? difficultyColor : palette.text_secondary,
                      fontWeight: isSelected ? 'bold' : '500'
                    }
                  ]}>
                    {t(level.id)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Mood rating */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: workoutLogPalette.text }]}>
            {t('how_did_you_feel')}
          </Text>
          
          <View style={styles.moodContainer}>
            <View style={styles.moodSlider}>
              {MOOD_RATINGS.map((mood) => {
                const isSelected = formData.mood_rating === mood.value;
                const moodColor = getMoodColor(mood.value);
                
                return (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      styles.moodOption,
                      { 
                        backgroundColor: palette.card_background,
                        borderColor: isSelected ? moodColor : palette.border,
                        borderWidth: isSelected ? 2 : 1
                      }
                    ]}
                    onPress={() => handleMoodSelect(mood.value)}
                  >
                    <Ionicons 
                      name={mood.iconName} 
                      size={32} 
                      color={isSelected ? moodColor : palette.text_tertiary} 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Text style={[
              styles.moodDescription,
              { color: getMoodColor(formData.mood_rating) }
            ]}>
              {getMoodDescription(formData.mood_rating)}
            </Text>
          </View>
        </View>
        
        {/* Workout notes */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: workoutLogPalette.text }]}>
            {t('workout_notes')} ({t('optional')})
          </Text>
          <TextInput
            value={formData.notes || ''}
            onChangeText={handleNotesChange}
            style={[
              styles.textArea,
              { 
                backgroundColor: palette.input_background,
                borderColor: palette.border,
                color: workoutLogPalette.text 
              }
            ]}
            placeholder={t('workout_notes_placeholder')}
            placeholderTextColor={palette.text_tertiary}
            selectionColor={workoutLogPalette.highlight}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <Text style={[styles.helpText, { color: palette.text_secondary }]}>
          {t('feedback_helps_track_progress')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  difficultyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  }
});

export default Step4Feedback;