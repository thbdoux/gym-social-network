// components/workouts/WorkoutSummary.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

interface WorkoutSummaryProps {
  exercises: any[];
  currentExerciseIndex: number;
  onSelectExercise: (index: number) => void;
  themePalette: any;
}

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  exercises,
  currentExerciseIndex,
  onSelectExercise,
  themePalette
}) => {
  const { t } = useLanguage();

  // Calculate completion status for each exercise
  const getExerciseCompletionStatus = (exercise: any) => {
    if (!exercise.sets || exercise.sets.length === 0) return 0;
    
    const totalSets = exercise.sets.length;
    const completedSets = exercise.sets.filter(set => set.completed).length;
    
    return {
      completed: completedSets,
      total: totalSets,
      percentage: Math.round((completedSets / totalSets) * 100)
    };
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themePalette.text }]}>
        {t('exercises')}
      </Text>
      
      <ScrollView style={styles.exerciseList}>
        {exercises.map((exercise, index) => {
          const status = getExerciseCompletionStatus(exercise);
          const isActive = index === currentExerciseIndex;
          
          return (
            <TouchableOpacity
              key={`summary-${index}`}
              style={[
                styles.exerciseItem,
                isActive && { backgroundColor: `${themePalette.highlight}20` }
              ]}
              onPress={() => onSelectExercise(index)}
            >
              <View style={styles.exerciseHeader}>
                <View style={[
                  styles.exerciseNumber,
                  isActive 
                    ? { backgroundColor: themePalette.highlight } 
                    : { backgroundColor: `${themePalette.text_tertiary}40` }
                ]}>
                  <Text style={[
                    styles.exerciseNumberText,
                    isActive 
                      ? { color: '#FFFFFF' } 
                      : { color: themePalette.text_secondary }
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                
                {status.completed === status.total && status.total > 0 ? (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={themePalette.success} 
                    style={styles.completeIcon}
                  />
                ) : status.completed > 0 ? (
                  <View style={styles.partialCompleteIcon}>
                    <Text style={[styles.partialCompleteText, { color: themePalette.warning }]}>
                      {status.completed}/{status.total}
                    </Text>
                  </View>
                ) : null}
              </View>
              
              <Text 
                style={[
                  styles.exerciseName,
                  isActive 
                    ? { color: themePalette.highlight, fontWeight: '600' } 
                    : { color: themePalette.text }
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {exercise.name}
              </Text>
              
              {/* Progress bar */}
              <View style={[styles.progressBarContainer, { backgroundColor: `${themePalette.text_tertiary}20` }]}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${status.percentage}%`,
                      backgroundColor: status.percentage === 100 
                        ? themePalette.success 
                        : themePalette.warning
                    }
                  ]} 
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {exercises.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: themePalette.text_tertiary }]}>
            {t('no_exercises_added')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItem: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumberText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  completeIcon: {
    marginLeft: 'auto',
  },
  partialCompleteIcon: {
    marginLeft: 'auto',
  },
  partialCompleteText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  exerciseName: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  }
});

export default WorkoutSummary;