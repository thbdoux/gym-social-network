import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { ProgramFormData } from '../ProgramWizard';

type Step1BasicInfoProps = {
  formData: ProgramFormData;
  updateFormData: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
};

const Step1BasicInfo = ({ formData, updateFormData, errors }: Step1BasicInfoProps) => {
  const { t } = useLanguage();
  const { programPalette, palette } = useTheme();
  
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: programPalette.text }]}>
          {t('program_name_question')}
        </Text>
        
        <TextInput
          value={formData.name}
          onChangeText={(text) => updateFormData({ name: text })}
          style={[
            styles.input,
            { 
              backgroundColor: palette.input_background,
              borderColor: errors.name ? palette.error : palette.border,
              color: programPalette.text
            }
          ]}
          placeholder={t('enter_program_name')}
          placeholderTextColor={palette.text_tertiary}
          selectionColor={programPalette.highlight}
          autoCapitalize="words"
        />
        
        {errors.name ? (
          <Text style={[styles.errorText, { color: palette.error }]}>
            {errors.name}
          </Text>
        ) : null}
        
        {/* Suggestion chips */}
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: palette.text_secondary }]}>
            {t('name_suggestions')}
          </Text>
          <View style={styles.suggestionsRow}>
            {PROGRAM_SUGGESTIONS.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSuggestionClick(suggestion)}
                style={[
                  styles.suggestionChip,
                  { 
                    backgroundColor: 'rgba(126, 34, 206, 0.1)',
                    borderColor: 'rgba(147, 51, 234, 0.3)'
                  }
                ]}
              >
                <Text style={[styles.suggestionText, { color: programPalette.highlight }]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <Text style={[styles.helpText, { color: palette.text_secondary }]}>
          {t('program_name_help')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 8,
  },
  errorText: {
    alignSelf: 'flex-start',
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
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  suggestionText: {
    fontSize: 14,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  }
});

export default Step1BasicInfo;