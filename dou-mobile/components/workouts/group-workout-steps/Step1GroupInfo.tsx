import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView
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
  
  // Handle workout title change (previously name)
  const handleTitleChange = (text: string) => {
    updateFormData({ title: text });
  };

  // Handle description change
  const handleDescriptionChange = (text: string) => {
    updateFormData({ description: text });
  };

  // Handle difficulty level change
  const handleDifficultyChange = (level: string) => {
    updateFormData({ difficulty_level: level });
  };

  // Handle privacy toggle (public/private)
  const handlePrivacyToggle = (isPublic: boolean) => {
    // Convert boolean to string privacy setting
    const privacyValue = isPublic ? 'public' : 'private';
    updateFormData({ privacy: privacyValue });
  };

  // Handle max participants change
  const handleMaxParticipantsChange = (value: number) => {
    if (value >= 2 && value <= 50) {
      updateFormData({ max_participants: value });
    }
  };

  // Get color for difficulty level
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy':
        return '#10B981'; // green
      case 'moderate':
        return '#F59E0B'; // amber
      case 'hard':
        return '#EF4444'; // red
      case 'very_hard':
        return '#7F1D1D'; // dark red
      default:
        return '#F59E0B';
    }
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

      {/* Group workout description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('description')} <Text style={styles.optionalText}>({t('optional')})</Text></Text>
        <TextInput
          value={formData.description || ''}
          onChangeText={handleDescriptionChange}
          style={styles.textArea}
          placeholder={t('enter_group_workout_description')}
          placeholderTextColor="#6B7280"
          selectionColor="#f97316"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Difficulty level selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('difficulty_level')}</Text>
        <View style={styles.difficultyContainer}>
          {['easy', 'moderate', 'hard', 'very_hard'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyOption,
                formData.difficulty_level === level && styles.difficultyOptionSelected,
                formData.difficulty_level === level && { borderColor: getDifficultyColor(level) }
              ]}
              onPress={() => handleDifficultyChange(level)}
            >
              <Text style={[
                styles.difficultyText,
                formData.difficulty_level === level && styles.difficultyTextSelected,
                formData.difficulty_level === level && { color: getDifficultyColor(level) }
              ]}>
                {t(level)}
              </Text>
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

      {/* Max participants */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('max_participants')}</Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => handleMaxParticipantsChange(formData.max_participants - 1)}
            disabled={formData.max_participants <= 2}
          >
            <Ionicons 
              name="remove" 
              size={24} 
              color={formData.max_participants <= 2 ? '#6B7280' : '#FFFFFF'} 
            />
          </TouchableOpacity>
          <Text style={styles.counterText}>{formData.max_participants}</Text>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => handleMaxParticipantsChange(formData.max_participants + 1)}
            disabled={formData.max_participants >= 50}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
    paddingBottom: 32, // Extra padding at the bottom
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
  optionalText: {
    color: '#9CA3AF',
    fontWeight: '400',
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
  textArea: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#EF4444', // red-500
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  // Difficulty level styles
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  difficultyOptionSelected: {
    backgroundColor: '#111827',
    borderWidth: 2,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  difficultyTextSelected: {
    fontWeight: 'bold',
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
  // Counter styles
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  counterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  counterText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 24,
  },
});

export default Step1GroupInfo;