// app/(app)/workout/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  TextInput,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  useWorkoutTemplate,
  useUpdateWorkoutTemplate,
  useDeleteWorkoutTemplate,
  useUpdateTemplateExercise,
  useAddExerciseToTemplate,
  useDeleteTemplateExercise
} from '../../../hooks/query/useWorkoutQuery';

// Shared components
import ExerciseManager from './ExerciseManager';
import { formatRestTime } from './formatters';

export default function WorkoutDetailScreen() {
  // Get workout ID from route params
  const { id } = useLocalSearchParams();
  const workoutId = typeof id === 'string' ? parseInt(id, 10) : 0;
  
  // Get theme context
  const { workoutPalette, palette } = useTheme();
  
  // Create dynamic theme colors
  const COLORS = {
    primary: workoutPalette.background,
    secondary: workoutPalette.highlight,
    tertiary: workoutPalette.border,
    background: palette.page_background,
    card: "#1F2937",
    text: {
      primary: workoutPalette.text,
      secondary: workoutPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.5)"
    },
    border: workoutPalette.border,
    success: "#10b981",
    danger: "#ef4444"
  };
  
  // State for workout details
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutDifficulty, setWorkoutDifficulty] = useState('beginner');
  const [workoutFocus, setWorkoutFocus] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Exercise management state
  const [isExerciseManagerVisible, setIsExerciseManagerVisible] = useState(false);
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: workout, isLoading, refetch } = useWorkoutTemplate(workoutId);
  const { mutateAsync: updateWorkout } = useUpdateWorkoutTemplate();
  const { mutateAsync: deleteWorkout } = useDeleteWorkoutTemplate();
  
  // Initialize form state when workout data is loaded
  useEffect(() => {
    if (workout) {
      setWorkoutName(workout.name);
      setWorkoutDescription(workout.description || '');
      setWorkoutDuration(workout.estimated_duration || 0);
      setWorkoutDifficulty(workout.difficulty_level || 'beginner');
    }
  }, [workout]);
  
  // Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Check if current user is the workout creator
  const isCreator = workout?.creator_username === user?.username;
  const isTemplate = !workout?.preferred_weekday; // If it has preferred_weekday, it's an instance
  
  // Get weekday name
  const getWeekdayName = (day?: number): string => {
    if (day === undefined) return '';
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[day];
  };
  
  // Get difficulty indicator based on level
  const getDifficultyIndicator = (level?: string): string => {
    if (!level) return '🔥';
    switch(level?.toLowerCase()) {
      case 'beginner': return '🔥';
      case 'intermediate': return '🔥🔥';
      case 'advanced': return '🔥🔥🔥';
      default: return '🔥';
    }
  };
  
  // Handle options menu
  const handleOptionsMenu = () => {
    Alert.alert(
      t('workout_options'),
      t('select_an_option'),
      [
        {
          text: t('edit_workout_info'),
          onPress: () => handleEditWorkoutInfo()
        },
        {
          text: t('edit_exercises'),
          onPress: () => setIsExerciseManagerVisible(true)
        },
        {
          text: t('delete_workout'),
          style: 'destructive',
          onPress: handleDeleteWorkout
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle editing workout info
  const handleEditWorkoutInfo = () => {
    Alert.alert(
      t('edit_workout_info'),
      t('select_field_to_edit'),
      [
        {
          text: t('name'),
          onPress: () => handleEditWorkoutName()
        },
        {
          text: t('description'),
          onPress: () => handleEditWorkoutDescription()
        },
        {
          text: t('duration'),
          onPress: () => handleEditWorkoutDuration()
        },
        {
          text: t('difficulty'),
          onPress: () => handleEditWorkoutDifficulty()
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle editing workout name
  const handleEditWorkoutName = () => {
    Alert.prompt(
      t('edit_name'),
      t('enter_new_workout_name'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (name) => {
            if (name && name.trim() !== '') {
              setWorkoutName(name);
              handleSaveWorkoutField('name', name);
            }
          }
        }
      ],
      'plain-text',
      workoutName
    );
  };

  // Handle editing workout description
  const handleEditWorkoutDescription = () => {
    Alert.prompt(
      t('edit_description'),
      t('enter_new_workout_description'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (description) => {
            setWorkoutDescription(description || '');
            handleSaveWorkoutField('description', description || '');
          }
        }
      ],
      'plain-text',
      workoutDescription
    );
  };

  // Handle editing workout duration
  const handleEditWorkoutDuration = () => {
    Alert.prompt(
      t('edit_duration'),
      t('enter_duration_in_minutes'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (durationText) => {
            const duration = parseInt(durationText || '0', 10);
            setWorkoutDuration(duration);
            handleSaveWorkoutField('estimated_duration', duration);
          }
        }
      ],
      'plain-text',
      workoutDuration.toString(),
      'numeric'
    );
  };

  // Handle editing workout difficulty
  const handleEditWorkoutDifficulty = () => {
    Alert.alert(
      t('edit_difficulty'),
      t('select_difficulty_level'),
      [
        {
          text: t('beginner'),
          onPress: () => {
            setWorkoutDifficulty('beginner');
            handleSaveWorkoutField('difficulty_level', 'beginner');
          }
        },
        {
          text: t('intermediate'),
          onPress: () => {
            setWorkoutDifficulty('intermediate');
            handleSaveWorkoutField('difficulty_level', 'intermediate');
          }
        },
        {
          text: t('advanced'),
          onPress: () => {
            setWorkoutDifficulty('advanced');
            handleSaveWorkoutField('difficulty_level', 'advanced');
          }
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle saving individual workout field
  const handleSaveWorkoutField = async (field, value) => {
    try {
      const updates = { [field]: value };
      await updateWorkout({
        id: workoutId,
        updates
      });
      await refetch();
    } catch (error) {
      console.error(`Failed to update workout ${field}:`, error);
      Alert.alert(t('error'), t('failed_to_update_workout'));
    }
  };
  
  // Handle deleting the workout
  const handleDeleteWorkout = () => {
    Alert.alert(
      t('delete_workout'),
      isTemplate ? t('confirm_delete_template') : t('confirm_delete_workout'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkout(workoutId);
              router.back();
            } catch (error) {
              console.error('Failed to delete workout:', error);
              Alert.alert(t('error'), t('failed_to_delete_workout'));
            }
          }
        }
      ]
    );
  };

  // Handle exercise management completion
  const handleExerciseManagerComplete = async () => {
    setIsExerciseManagerVisible(false);
    await refetch();
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: COLORS.text.primary }]}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state if workout not found
  if (!workout) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: COLORS.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.danger} />
        <Text style={[styles.errorTitle, { color: COLORS.text.primary }]}>
          {isTemplate ? t('template_not_found') : t('workout_not_found')}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: COLORS.text.primary }]}>{t('back_to_workouts')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {/* Top Row: Back button, Title, Options */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {workout.name}
            </Text>
          </View>
          
          {isCreator && (
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={handleOptionsMenu}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Creator info row */}
        <View style={styles.creatorRow}>
          <View style={styles.creatorInfo}>
            <Ionicons name="person" size={14} color={COLORS.text.secondary} />
            <Text style={styles.creatorText}>{workout.creator_username}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Text style={styles.typeBadgeText}>
              {isTemplate ? t('template') : t('workout')}
            </Text>
          </View>
        </View>
        
        {/* Workout Info Row */}
        <View style={styles.workoutInfoRow}>
          
          {/* Duration */}
          <View style={styles.workoutInfoItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.infoText}>
              {workout.estimated_duration} {t('min')}
            </Text>
          </View>
          
          {/* Difficulty */}
          <View style={styles.workoutInfoItem}>
            <Text style={styles.infoIcon}>
              {getDifficultyIndicator(workout.difficulty_level)}
            </Text>
            <Text style={styles.infoText}>
              {t(workout.difficulty_level || 'beginner')}
            </Text>
          </View>
          
          {/* Weekday for scheduled workouts */}
          {!isTemplate && workout.preferred_weekday !== undefined && (
            <View style={styles.workoutInfoItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>
                {getWeekdayName(workout.preferred_weekday)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Description - only if available */}
        {workout.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText} numberOfLines={2}>
              {workout.description}
            </Text>
          </View>
        )}
      </LinearGradient>
      
      {/* Main Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.exercisesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>{t('exercises')}</Text>
            <View style={styles.exerciseControls}>
              <Text style={[styles.exerciseCount, { color: COLORS.text.secondary }]}>
                {workout.exercises?.length || 0} {t('total')}
              </Text>
              
              {isCreator && (
                <TouchableOpacity 
                  style={styles.editExercisesButton}
                  onPress={() => setIsExerciseManagerVisible(true)}
                >
                  <Ionicons name="create-outline" size={16} color={COLORS.secondary} />
                  <Text style={[styles.editExercisesText, { color: COLORS.secondary }]}>
                    {t('edit')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Render exercises list or empty state */}
          {workout.exercises && workout.exercises.length > 0 ? (
            <View style={styles.exercisesList}>
              {workout.exercises.map((exercise, index) => {
                // Find paired exercise name if this is a superset
                const pairedExerciseName = exercise.is_superset && exercise.superset_with !== null
                  ? workout.exercises.find(ex => ex.order === exercise.superset_with)?.name
                  : null;
                
                return (
                  <View 
                    key={`exercise-${exercise.id || index}`}
                    style={[
                      styles.exerciseCard, 
                      exercise.is_superset && styles.supersetCard,
                      { backgroundColor: COLORS.card }
                    ]}
                  >
                    {/* Exercise Header */}
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseHeaderLeft}>
                        {/* Exercise index badge */}
                        <View style={styles.exerciseIndexBadge}>
                          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                        </View>
                        
                        <View style={styles.exerciseTitleContainer}>
                          <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                          
                          {/* Superset info */}
                          {exercise.is_superset && pairedExerciseName && (
                            <View style={styles.supersetInfo}>
                              <Ionicons name="git-branch-outline" size={14} color="#0ea5e9" />
                              <Text style={styles.supersetInfoText}>
                                {t('paired_with')}: {pairedExerciseName}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {/* Set count badge */}
                      <View style={styles.setCountBadge}>
                        <Text style={styles.setCountText}>
                          {exercise.sets.length} {exercise.sets.length === 1 ? t('set') : t('sets')}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Exercise Sets Table */}
                    <View style={styles.setsTable}>
                      {/* Table Header */}
                      <View style={styles.setsTableHeader}>
                        <Text style={styles.setColumnHeader}>{t('set')}</Text>
                        <Text style={styles.setColumnHeader}>{t('reps')}</Text>
                        <Text style={styles.setColumnHeader}>{t('weight')}</Text>
                        <Text style={styles.setColumnHeader}>{t('rest')}</Text>
                      </View>
                      
                      {/* Table Rows */}
                      {exercise.sets.map((set, setIndex) => (
                        <View 
                          key={`set-${setIndex}`}
                          style={[
                            styles.setRow,
                            setIndex % 2 === 1 && { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
                          ]}
                        >
                          <Text style={styles.setCell}>{setIndex + 1}</Text>
                          <Text style={styles.setCell}>{set.reps || '-'}</Text>
                          <Text style={styles.setCell}>{set.weight ? `${set.weight}kg` : '-'}</Text>
                          <Text style={styles.setCell}>{formatRestTime(set.rest_time)}</Text>
                        </View>
                      ))}
                    </View>
                    
                    {/* Exercise Notes */}
                    {exercise.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>{t('notes')}:</Text>
                        <Text style={styles.notesText}>{exercise.notes}</Text>
                      </View>
                    )}
                    
                    {/* Superset Rest Time */}
                    {exercise.is_superset && exercise.superset_rest_time && (
                      <View style={styles.supersetRestContainer}>
                        <Text style={styles.supersetRestLabel}>{t('superset_rest')}:</Text>
                        <Text style={styles.supersetRestValue}>
                          {formatRestTime(exercise.superset_rest_time)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: COLORS.card }]}>
              <Ionicons name="barbell-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={[styles.emptyStateText, { color: COLORS.text.tertiary }]}>
                {t('no_exercises')}
              </Text>
              {isCreator && (
                <TouchableOpacity
                  style={[styles.emptyStateAddButton, { backgroundColor: `rgba(16, 185, 129, 0.1)` }]}
                  onPress={() => setIsExerciseManagerVisible(true)}
                >
                  <Ionicons name="add-circle" size={20} color={COLORS.success} />
                  <Text style={[styles.emptyStateAddText, { color: COLORS.success }]}>
                    {t('add_exercises')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Tags Section (if any) */}
        {workout.tags && workout.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>{t('tags')}</Text>
            <View style={styles.tagsContainer}>
              {workout.tags.map((tag, index) => (
                <View 
                  key={`tag-${index}`} 
                  style={[styles.tag, { backgroundColor: `rgba(66, 153, 225, 0.2)` }]}
                >
                  <Text style={[styles.tagText, { color: COLORS.text.secondary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Exercise Manager Modal */}
      {isExerciseManagerVisible && (
        <ExerciseManager
          visible={isExerciseManagerVisible}
          workoutId={workoutId}
          exercises={workout.exercises || []}
          onClose={handleExerciseManagerComplete}
          colors={COLORS}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 5,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  creatorRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  creatorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  workoutInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  infoIcon: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
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
  exerciseCount: {
    fontSize: 14,
    marginRight: 12,
  },
  editExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editExercisesText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  supersetCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  exerciseTitleContainer: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  supersetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  supersetInfoText: {
    fontSize: 12,
    color: '#0ea5e9',
    marginLeft: 4,
  },
  setCountBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  setCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  setsTable: {
    padding: 12,
  },
  setsTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  setColumnHeader: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderRadius: 4,
  },
  setCell: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  notesContainer: {
    margin: 12,
    marginTop: 4,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  supersetRestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    padding: 8,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
  },
  supersetRestLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  supersetRestValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
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
  bottomPadding: {
    height: 80,
  },
});