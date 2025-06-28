// app/(app)/log/components/ExercisesList.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseCard } from './ExerciseCard';

interface ExercisesListProps {
  log: any;
  colors: any;
  isCreator: boolean;
  onEditExercises: () => void;
  t: (key: string) => string;
}

export const ExercisesList: React.FC<ExercisesListProps> = ({
  log,
  colors,
  isCreator,
  onEditExercises,
  t,
}) => {
  return (
    <View style={styles.exercisesSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('exercises')}</Text>
        <View style={styles.exerciseControls}>
          {isCreator && (
            <TouchableOpacity 
              style={[styles.editExercisesButton, { backgroundColor: `rgba(${colors.secondary.replace('#', '')}, 0.1)` }]}
              onPress={onEditExercises}
            >
              <Ionicons name="create-outline" size={16} color={colors.secondary} />
              <Text style={[styles.editExercisesText, { color: colors.secondary }]}>
                {t('edit')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Render exercises list or empty state */}
      {log.exercises && log.exercises.length > 0 ? (
        <View style={styles.exercisesList}>
          {log.exercises.map((exercise: any, index: number) => (
            <ExerciseCard
              key={`exercise-${exercise.id || index}`}
              exercise={exercise}
              index={index}
              exercises={log.exercises}
              colors={colors}
              t={t}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Ionicons name="barbell-outline" size={48} color={colors.text.tertiary} />
          <Text style={[styles.emptyStateText, { color: colors.text.tertiary }]}>
            {t('no_exercises')}
          </Text>
          {isCreator && (
            <TouchableOpacity
              style={[styles.emptyStateAddButton, { backgroundColor: `rgba(16, 185, 129, 0.1)` }]}
              onPress={onEditExercises}
            >
              <Ionicons name="add-circle" size={20} color={colors.success} />
              <Text style={[styles.emptyStateAddText, { color: colors.success }]}>
                {t('add_exercises')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tags Section (if any) */}
      {log.tags && log.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('tags')}</Text>
          <View style={styles.tagsContainer}>
            {log.tags.map((tag: string, index: number) => (
              <View 
                key={`tag-${index}`} 
                style={[styles.tag, { backgroundColor: `rgba(66, 153, 225, 0.2)` }]}
              >
                <Text style={[styles.tagText, { color: colors.text.secondary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Source Information */}
      {log.source_type && log.source_type !== 'none' && (
        <View style={styles.sourceSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('source')}</Text>
          <View style={[styles.sourceContainer, { backgroundColor: colors.card }]}>
            <Ionicons 
              name={log.source_type === 'program' ? "list-outline" : "document-outline"} 
              size={20} 
              color={colors.text.secondary} 
            />
            <Text style={[styles.sourceText, { color: colors.text.secondary }]}>
              {t(`from_${log.source_type}`)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  exercisesSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editExercisesText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  exercisesList: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyStateAddText: {
    fontSize: 14,
    marginLeft: 8,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  },
  sourceSection: {
    marginBottom: 16,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  sourceText: {
    fontSize: 14,
    marginLeft: 8,
  },
});