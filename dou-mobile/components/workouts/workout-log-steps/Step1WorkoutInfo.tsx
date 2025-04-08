import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { WorkoutLogFormData } from '../WorkoutLogWizard';
import { Ionicons } from '@expo/vector-icons';

type Step1WorkoutInfoProps = {
  formData: WorkoutLogFormData;
  updateFormData: (data: Partial<WorkoutLogFormData>) => void;
  errors: Record<string, string>;
};

const Step1WorkoutInfo = ({ formData, updateFormData, errors }: Step1WorkoutInfoProps) => {
  const { t } = useLanguage();
  
  // Handle workout name change
  const handleNameChange = (text: string) => {
    updateFormData({ name: text });
  };

  return (
    <View style={styles.container}>
      {/* Text input for workout name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('workout_name')}</Text>
        <View style={styles.nameInputContainer}>
          <Ionicons name="barbell-outline" size={22} color="#16a34a" style={styles.inputIcon} />
          <TextInput
            value={formData.name}
            onChangeText={handleNameChange}
            style={[
              styles.nameInput,
              errors.name && styles.inputError
            ]}
            placeholder={t('enter_workout_name')}
            placeholderTextColor="#6B7280"
            selectionColor="#16a34a"
            autoCapitalize="words"
          />
        </View>
        {errors.name ? (
          <Text style={styles.errorText}>{errors.name}</Text>
        ) : null}
      </View>
    </View>
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
    color: '#E5E7EB',
    marginBottom: 12,
    marginLeft: 4,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
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
    color: '#FFFFFF',
    padding: 12,
    paddingLeft: 0,
  },
  inputError: {
    borderColor: '#EF4444', // red-500
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  }
});

export default Step1WorkoutInfo;