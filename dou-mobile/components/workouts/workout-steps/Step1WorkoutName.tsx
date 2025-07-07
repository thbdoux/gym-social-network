import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { WorkoutTemplateFormData } from '../WorkoutTemplateWizard';
import { Ionicons } from '@expo/vector-icons';

type Step1WorkoutNameProps = {
  formData: WorkoutTemplateFormData;
  updateFormData: (data: Partial<WorkoutTemplateFormData>) => void;
  errors: Record<string, string>;
};

const Step1WorkoutName = ({ formData, updateFormData, errors }: Step1WorkoutNameProps) => {
  const { t } = useLanguage();
  const { workoutPalette, palette } = useTheme();
  
  // Handle custom name input
  const handleNameChange = (text: string) => {
    updateFormData({ name: text });
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
        <Text style={[styles.title, { color: workoutPalette.text }]}>
          {t('workout_name_question')}
        </Text>
        
        {/* Text input for workout name */}
        <TextInput
          value={formData.name}
          onChangeText={handleNameChange}
          style={[
            styles.input,
            { 
              backgroundColor: palette.input_background,
              borderColor: errors.name ? palette.error : palette.border,
              color: workoutPalette.text
            }
          ]}
          placeholder={t('enter_workout_name')}
          placeholderTextColor={palette.text_tertiary}
          selectionColor={workoutPalette.highlight}
          autoCapitalize="words"
        />
        
        {errors.name ? (
          <Text style={[styles.errorText, { color: palette.error }]}>
            {errors.name}
          </Text>
        ) : null}
        
        <Text style={[styles.helpText, { color: palette.text_secondary }]}>
          {t('workout_name_help')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  }
});

export default Step1WorkoutName;