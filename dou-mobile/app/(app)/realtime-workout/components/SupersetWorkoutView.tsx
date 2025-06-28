// components/SupersetWorkoutView.tsx - Shows superset organization and navigation
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../context/LanguageContext';
import { getSupersetLabel, getExerciseDisplayValue } from '../utils/workoutUtils';

interface SupersetWorkoutViewProps {
  supersetGroup: string;
  exercises: any[];
  currentExerciseIndex: number;
  onNavigateToExercise: (index: number) => void;
  onCreateSuperset?: (exerciseIndices: number[]) => void;
  themePalette: any;
}

const SupersetWorkoutView: React.FC<SupersetWorkoutViewProps> = ({
  supersetGroup,
  exercises,
  currentExerciseIndex,
  onNavigateToExercise,
  themePalette
}) => {
  const { t } = useLanguage();

  // Get all exercises in this superset
  const supersetExercises = exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise }) => exercise.superset_group === supersetGroup);

  if (supersetExercises.length < 2) return null;

  const currentSupersetIndex = supersetExercises.findIndex(({ index }) => index === currentExerciseIndex);
  const nextExerciseIndex = currentSupersetIndex !== -1 
    ? (currentSupersetIndex + 1) % supersetExercises.length 
    : 0;

  // Get all superset groups to determine label
  const supersetGroups = Array.from(new Set(
    exercises
      .filter(ex => ex.superset_group)
      .map(ex => ex.superset_group)
  ));
  
  const supersetLabel = getSupersetLabel(supersetGroups, supersetGroup);

  // Calculate superset completion
  const totalSetsInSuperset = supersetExercises.reduce((acc, { exercise }) => 
    acc + exercise.sets.length, 0
  );
  const completedSetsInSuperset = supersetExercises.reduce((acc, { exercise }) => 
    acc + exercise.sets.filter((set: any) => set.completed).length, 0
  );
  const supersetProgress = totalSetsInSuperset > 0 
    ? Math.round((completedSetsInSuperset / totalSetsInSuperset) * 100)
    : 0;

  const handleQuickNavigate = (targetIndex: number) => {
    onNavigateToExercise(targetIndex);
  };

  const handleNextInSuperset = () => {
    const nextIndex = supersetExercises[nextExerciseIndex].index;
    onNavigateToExercise(nextIndex);
  };

  return (
    <View style={[styles.container, { backgroundColor: themePalette.card_background }]}>
      {/* Superset Header */}
      <View style={[styles.header, { backgroundColor: `${themePalette.accent}15` }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.supersetBadge, { backgroundColor: themePalette.accent }]}>
            <Text style={styles.supersetBadgeText}>{supersetLabel}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.supersetTitle, { color: themePalette.text }]}>
              {t('superset')} {supersetLabel}
            </Text>
            <Text style={[styles.supersetSubtitle, { color: themePalette.text_secondary }]}>
              {supersetExercises.length} {t('exercises')} • {supersetProgress}% {t('complete')}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.progressIndicator, { backgroundColor: `${themePalette.accent}30` }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${supersetProgress}%`,
                  backgroundColor: supersetProgress === 100 ? themePalette.success : themePalette.accent
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Exercise Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.exerciseNavigation}
        contentContainerStyle={styles.exerciseNavigationContent}
      >
        {supersetExercises.map(({ exercise, index }, supersetIndex) => {
          const isActive = index === currentExerciseIndex;
          const completedSets = exercise.sets.filter((set: any) => set.completed).length;
          const totalSets = exercise.sets.length;
          const exerciseProgress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
          
          return (
            <TouchableOpacity
              key={`superset-${supersetGroup}-${index}`}
              style={[
                styles.exerciseNavItem,
                { 
                  backgroundColor: isActive ? themePalette.accent : palette.input_background,
                  borderColor: isActive ? themePalette.highlight : themePalette.border
                }
              ]}
              onPress={() => handleQuickNavigate(index)}
              activeOpacity={0.7}
            >
              {/* Exercise number */}
              <View style={[
                styles.exerciseNavNumber,
                { backgroundColor: isActive ? '#FFFFFF' : `${themePalette.accent}20` }
              ]}>
                <Text style={[
                  styles.exerciseNavNumberText,
                  { color: isActive ? themePalette.accent : themePalette.text }
                ]}>
                  {index + 1}
                </Text>
              </View>

              {/* Exercise info */}
              <View style={styles.exerciseNavInfo}>
                <Text 
                  style={[
                    styles.exerciseNavName,
                    { color: isActive ? '#FFFFFF' : themePalette.text }
                  ]}
                  numberOfLines={1}
                >
                  {exercise.name}
                </Text>
                
                {/* Show last set values */}
                {exercise.sets.length > 0 && (
                  <Text 
                    style={[
                      styles.exerciseNavDetails,
                      { color: isActive ? 'rgba(255,255,255,0.8)' : themePalette.text_secondary }
                    ]}
                    numberOfLines={1}
                  >
                    {getExerciseDisplayValue(exercise, exercise.sets.length - 1)}
                  </Text>
                )}
              </View>

              {/* Progress indicator */}
              <View style={styles.exerciseNavProgress}>
                <Text style={[
                  styles.exerciseNavProgressText,
                  { color: isActive ? '#FFFFFF' : themePalette.text_secondary }
                ]}>
                  {completedSets}/{totalSets}
                </Text>
                {exerciseProgress === 100 && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={isActive ? '#FFFFFF' : themePalette.success} 
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Quick Action */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: themePalette.accent }]}
          onPress={handleNextInSuperset}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          <Text style={styles.nextButtonText}>
            {t('next_in_superset')}
          </Text>
        </TouchableOpacity>

        <View style={styles.supersetInstructions}>
          <Ionicons name="information-circle-outline" size={14} color={themePalette.text_tertiary} />
          <Text style={[styles.instructionsText, { color: themePalette.text_tertiary }]}>
            {t('complete_sets_in_sequence')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supersetBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  supersetBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  supersetTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  supersetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  progressIndicator: {
    width: 60,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  exerciseNavigation: {
    paddingVertical: 8,
  },
  exerciseNavigationContent: {
    paddingHorizontal: 12,
  },
  exerciseNavItem: {
    width: 140,
    padding: 10,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'column',
  },
  exerciseNavNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  exerciseNavNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  exerciseNavInfo: {
    flex: 1,
    marginBottom: 4,
  },
  exerciseNavName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseNavDetails: {
    fontSize: 11,
  },
  exerciseNavProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseNavProgressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  quickActions: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  supersetInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsText: {
    fontSize: 11,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});

// Default palette fallback
const palette = {
  input_background: '#f5f5f5',
  border: '#e0e0e0',
  text: '#333333',
  text_secondary: '#666666',
  text_tertiary: '#999999',
  accent: '#4f46e5',
  highlight: '#6366f1',
  success: '#10b981'
};

export default SupersetWorkoutView;