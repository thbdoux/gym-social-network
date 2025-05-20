import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { ProgramFormData } from '../ProgramWizard';

type Step1BasicInfoProps = {
  formData: ProgramFormData;
  updateFormData: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
};

const Step1BasicInfo = ({ formData, updateFormData, errors }: Step1BasicInfoProps) => {
  const { t } = useLanguage();
  
  // Program name suggestions
  const PROGRAM_SUGGESTIONS = [
    t('program_suggestion_1'),
    t('program_suggestion_2'),
    t('program_suggestion_3')
  ];

  const handleSuggestionClick = (suggestion: string) => {
    updateFormData({ name: suggestion });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t('program_name_question')}</Text>
      
      <TextInput
        value={formData.name}
        onChangeText={(text) => updateFormData({ name: text })}
        style={[
          styles.input,
          errors.name && styles.inputError
        ]}
        placeholder={t('enter_program_name')}
        placeholderTextColor="#6B7280"
        selectionColor="#9333ea"
        autoCapitalize="words"
      />
      
      {errors.name ? (
        <Text style={styles.errorText}>{errors.name}</Text>
      ) : null}
      
      {/* Suggestion chips */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>{t('name_suggestions')}</Text>
        <View style={styles.suggestionsRow}>
          {PROGRAM_SUGGESTIONS.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSuggestionClick(suggestion)}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <Text style={styles.helpText}>
        {t('program_name_help')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444', // red-500
  },
  errorText: {
    alignSelf: 'flex-start',
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  suggestionChip: {
    backgroundColor: 'rgba(126, 34, 206, 0.1)', // purple-700 with opacity
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)', // purple-600 with opacity
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  suggestionText: {
    color: '#c084fc', // purple-400
    fontSize: 14,
  },
  helpText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  }
});

export default Step1BasicInfo;