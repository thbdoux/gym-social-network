import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  FlatList
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { GroupWorkoutFormData } from '../GroupWorkoutWizard';
import { Ionicons } from '@expo/vector-icons';

type Step1GroupInfoProps = {
  formData: GroupWorkoutFormData;
  updateFormData: (data: Partial<GroupWorkoutFormData>) => void;
  errors: Record<string, string>;
  user: any;
};

const Step1GroupInfo = ({ formData, updateFormData, errors, user }: Step1GroupInfoProps) => {
  const { t } = useLanguage();
  
  // Title suggestions based on common workout types
  const titleSuggestions = [
    t('group_workout_suggestion_1'),
    t('group_workout_suggestion_2'),
    t('group_workout_suggestion_3'),
  ];
  
  // Handle workout title change
  const handleTitleChange = (text: string) => {
    updateFormData({ title: text });
  };

  // Handle privacy toggle (public/private)
  const handlePrivacyToggle = (isPublic: boolean) => {
    // Convert boolean to string privacy setting
    const privacyValue = isPublic ? 'public' : 'private';
    updateFormData({ privacy: privacyValue });
  };

  // Apply a suggested title
  const applySuggestion = (suggestion: string) => {
    updateFormData({ title: suggestion });
  };

  // Get whether the workout is public
  const isPublic = formData.privacy === 'public';

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Group workout title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('group_workout_name')}</Text>
        <View style={styles.nameInputContainer}>
          <Ionicons name="people-outline" size={22} color="#f97316" style={styles.inputIcon} />
          <TextInput
            value={formData.title}
            onChangeText={handleTitleChange}
            style={[
              styles.nameInput,
              errors.title && styles.inputError
            ]}
            placeholder={t('enter_group_workout_name')}
            placeholderTextColor="#6B7280"
            selectionColor="#f97316"
            autoCapitalize="words"
          />
        </View>
        {errors.title ? (
          <Text style={styles.errorText}>{errors.title}</Text>
        ) : null}
      </View>

      {/* Title suggestions */}
      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionsWrapper}>
          {titleSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => applySuggestion(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Public/Private toggle (now maps to 'privacy' field) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('visibility')}</Text>
        <View style={styles.toggleContainer}>
          <View style={styles.toggleOption}>
            <Text style={styles.toggleText}>{t('private')}</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={handlePrivacyToggle}
            trackColor={{ false: '#374151', true: '#fb923c' }}
            thumbColor={isPublic ? '#f97316' : '#9CA3AF'}
          />
          <View style={styles.toggleOption}>
            <Text style={styles.toggleText}>{t('public')}</Text>
          </View>
        </View>
        <Text style={styles.helpText}>
          {isPublic ? 
            t('public_workout_description') : 
            t('private_workout_description')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingBottom: 32,
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
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  // Title suggestions styles
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
    marginLeft: 4,
  },
  suggestionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  suggestionChip: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 4,
  },
  suggestionText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  toggleOption: {
    marginHorizontal: 12,
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    marginLeft: 4,
  },
});

export default Step1GroupInfo;