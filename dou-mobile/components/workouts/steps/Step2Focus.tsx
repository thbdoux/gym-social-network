import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { ProgramFormData } from '../ProgramWizard';
import { Check } from 'react-native-feather';

type Step2FocusProps = {
  formData: ProgramFormData;
  updateFormData: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
};

type FocusOption = {
  value: string;
  label: string;
  icon: string;
};

type DifficultyOption = {
  value: string;
  label: string;
  icon: string;
};

const Step2Focus = ({ formData, updateFormData }: Step2FocusProps) => {
  const { t } = useLanguage();

  // Constant focus choices - using translation keys
  const FOCUS_CHOICES: FocusOption[] = [
    { value: 'strength', label: t('strength'), icon: '💪' },
    { value: 'hypertrophy', label: t('hypertrophy'), icon: '🏋️' },
    { value: 'endurance', label: t('endurance'), icon: '🏃' },
    { value: 'weight_loss', label: t('weight_loss'), icon: '⚖️' },
    { value: 'strength_hypertrophy', label: t('strength_and_size'), icon: '💯' },
    { value: 'general_fitness', label: t('general_fitness'), icon: '🔄' }
  ];

  // Difficulty levels - using translation keys
  const DIFFICULTY_LEVELS: DifficultyOption[] = [
    { value: 'beginner', label: t('beginner'), icon: '🌱' },
    { value: 'intermediate', label: t('intermediate'), icon: '🔄' },
    { value: 'advanced', label: t('advanced'), icon: '🔥' }
  ];

  // Handle focus selection
  const handleFocusSelect = (focus: string) => {
    updateFormData({ focus });
  };

  // Handle difficulty selection
  const handleDifficultySelect = (level: string) => {
    updateFormData({ 
      difficulty_level: level,
      recommended_level: level 
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Focus Selection - Grid Layout */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('program_focus_question')}</Text>
        
        <View style={styles.focusGrid}>
          {FOCUS_CHOICES.map((focus) => {
            const isSelected = formData.focus === focus.value;
            
            return (
              <TouchableOpacity
                key={focus.value}
                style={[
                  styles.focusCard,
                  isSelected && styles.focusCardSelected
                ]}
                onPress={() => handleFocusSelect(focus.value)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.focusIconContainer,
                  isSelected && styles.focusIconSelected
                ]}>
                  <Text style={styles.focusIcon}>{focus.icon}</Text>
                </View>
                
                <Text style={styles.focusLabel}>{focus.label}</Text>
                
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Check width={14} height={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Difficulty Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('select_difficulty')}</Text>
        
        <View style={styles.difficultyContainer}>
          {DIFFICULTY_LEVELS.map((level) => {
            const isSelected = formData.difficulty_level === level.value;
            
            return (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.difficultyCard,
                  isSelected && styles.difficultyCardSelected
                ]}
                onPress={() => handleDifficultySelect(level.value)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.difficultyIconContainer,
                  isSelected && styles.difficultyIconSelected
                ]}>
                  <Text style={styles.difficultyIcon}>{level.icon}</Text>
                </View>
                
                <Text style={styles.difficultyLabel}>{level.label}</Text>
                
                {isSelected && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  focusCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  focusCardSelected: {
    borderColor: '#9333ea',
    backgroundColor: 'rgba(126, 34, 206, 0.1)', // purple-700 with opacity
  },
  focusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  focusIconSelected: {
    backgroundColor: '#9333ea', // purple-600
  },
  focusIcon: {
    fontSize: 24,
  },
  focusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  checkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#9333ea', // purple-600
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  difficultyCardSelected: {
    borderWidth: 1,
    borderColor: '#9333ea',
    backgroundColor: 'rgba(126, 34, 206, 0.1)', // purple-700 with opacity
  },
  difficultyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  difficultyIconSelected: {
    backgroundColor: '#9333ea', // purple-600
  },
  difficultyIcon: {
    fontSize: 24,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: '#9333ea', // purple-600
  }
});

export default Step2Focus;