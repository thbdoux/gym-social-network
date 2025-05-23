import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { WorkoutLogFormData } from '../WorkoutLogWizard';
import { Ionicons } from '@expo/vector-icons';

type Step1WorkoutInfoProps = {
  formData: WorkoutLogFormData;
  updateFormData: (data: Partial<WorkoutLogFormData>) => void;
  errors: Record<string, string>;
};

const Step1WorkoutInfo = ({ formData, updateFormData, errors }: Step1WorkoutInfoProps) => {
  const { t } = useLanguage();
  const { workoutLogPalette, palette } = useTheme();
  
  // Handle workout name change
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
        {/* Text input for workout name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: workoutLogPalette.text }]}>
            {t('workout_name')}
          </Text>
          <View style={[
            styles.nameInputContainer,
            { 
              backgroundColor: palette.input_background,
              borderColor: errors.name ? palette.error : palette.border
            }
          ]}>
            <Ionicons 
              name="barbell-outline" 
              size={22} 
              color={workoutLogPalette.highlight} 
              style={styles.inputIcon} 
            />
            <TextInput
              value={formData.name}
              onChangeText={handleNameChange}
              style={[
                styles.nameInput,
                { color: workoutLogPalette.text }
              ]}
              placeholder={t('enter_workout_name')}
              placeholderTextColor={palette.text_tertiary}
              selectionColor={workoutLogPalette.highlight}
              autoCapitalize="words"
            />
          </View>
          {errors.name ? (
            <Text style={[styles.errorText, { color: palette.error }]}>
              {errors.name}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 2,
    overflow: 'hidden',
  },
  inputIcon: {
    padding: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    padding: 12,
    paddingLeft: 0,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  }
});

export default Step1WorkoutInfo;