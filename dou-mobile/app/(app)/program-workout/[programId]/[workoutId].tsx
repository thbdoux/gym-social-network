// app/(app)/program-workout/[programId]/[workoutId].tsx
import React, { useState, useEffect } from 'react';
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
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useAuth } from '../../../../hooks/useAuth';
import { useLanguage } from '../../../../context/LanguageContext';
import { useProgramWorkout, useUpdateProgramWorkout, useRemoveWorkoutFromProgram } from '../../../../hooks/query/useProgramQuery';
import { useProgram } from '../../../../hooks/query/useProgramQuery';

// Colors - using the same color scheme as the workout template page for consistency
const COLORS = {
  primary: "#0ea5e9", // Blue
  secondary: "#0284c7", // Darker blue
  tertiary: "#0369a1", // Even darker blue
  background: "#111827", // Dark background
  card: "#1F2937", // Card background
  text: {
    primary: "#FFFFFF",
    secondary: "rgba(255, 255, 255, 0.7)",
    tertiary: "rgba(255, 255, 255, 0.5)"
  },
  border: "rgba(255, 255, 255, 0.1)",
  success: "#10b981", // Green
  danger: "#ef4444" // Red
};

export default function ProgramWorkoutDetailScreen() {
  // Get IDs from route params
  const params = useLocalSearchParams();
  console.log("Program workout route params:", params);
  
  // Extract IDs with fallbacks
  const rawProgramId = params.programId;
  const rawWorkoutId = params.workoutId;
  
  let programId: number = 0;
  let workoutId: number = 0;
  
  // Handle different types of program ID that might come through
  if (typeof rawProgramId === 'string') {
    programId = parseInt(rawProgramId, 10) || 0;
  } else if (typeof rawProgramId === 'number') {
    programId = rawProgramId;
  } else if (Array.isArray(rawProgramId) && rawProgramId.length > 0) {
    const firstId = rawProgramId[0];
    programId = typeof firstId === 'string' ? parseInt(firstId, 10) || 0 : 
                typeof firstId === 'number' ? firstId : 0;
  }
  
  // Handle different types of workout ID that might come through
  if (typeof rawWorkoutId === 'string') {
    workoutId = parseInt(rawWorkoutId, 10) || 0;
  } else if (typeof rawWorkoutId === 'number') {
    workoutId = rawWorkoutId;
  } else if (Array.isArray(rawWorkoutId) && rawWorkoutId.length > 0) {
    const firstId = rawWorkoutId[0];
    workoutId = typeof firstId === 'string' ? parseInt(firstId, 10) || 0 : 
                typeof firstId === 'number' ? firstId : 0;
  }
  
  console.log("Parsed programId:", programId, "workoutId:", workoutId);
  
  // State
  const [editMode, setEditMode] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutDifficulty, setWorkoutDifficulty] = useState('beginner');
  const [workoutFocus, setWorkoutFocus] = useState('');
  const [preferredWeekday, setPreferredWeekday] = useState(0);
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: workout, isLoading: isWorkoutLoading, refetch: refetchWorkout } = useProgramWorkout(programId, workoutId);
  const { data: program, isLoading: isProgramLoading } = useProgram(programId);
  const { mutateAsync: updateProgramWorkout } = useUpdateProgramWorkout();
  const { mutateAsync: removeWorkoutFromProgram } = useRemoveWorkoutFromProgram();
  
  // Initialize form state when workout data is loaded
  useEffect(() => {
    if (workout) {
      setWorkoutName(workout.name);
      setWorkoutDescription(workout.description || '');
      setWorkoutDuration(workout.estimated_duration || 0);
      setWorkoutDifficulty(workout.difficulty_level || 'beginner');
      setWorkoutFocus(workout.focus || '');
      setPreferredWeekday(workout.preferred_weekday || 0);
    }
  }, [workout]);
  
  // Check if current user is the program creator
  const isCreator = program?.creator_username === user?.username;
  
  // Format focus text (convert snake_case to Title Case)
  const formatFocus = (focus?: string): string => {
    if (!focus) return '';
    return focus
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
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
  
  // Handle saving workout edits
  const handleSaveWorkout = async () => {
    try {
      await updateProgramWorkout({
        programId,
        workoutId,
        updates: {
          name: workoutName,
          description: workoutDescription,
          estimated_duration: workoutDuration,
          difficulty_level: workoutDifficulty,
          focus: workoutFocus,
          preferred_weekday: preferredWeekday
        }
      });
      setEditMode(false);
      await refetchWorkout();
    } catch (error) {
      console.error('Failed to update program workout:', error);
      Alert.alert(t('error'), t('failed_to_update_workout'));
    }
  };
  
  // Handle canceling edit mode
  const handleCancelEdit = () => {
    // Reset form to original values
    if (workout) {
      setWorkoutName(workout.name);
      setWorkoutDescription(workout.description || '');
      setWorkoutDuration(workout.estimated_duration || 0);
      setWorkoutDifficulty(workout.difficulty_level || 'beginner');
      setWorkoutFocus(workout.focus || '');
      setPreferredWeekday(workout.preferred_weekday || 0);
    }
    setEditMode(false);
  };
  
  // Handle removing the workout from program
  const handleRemoveWorkout = () => {
    Alert.alert(
      t('remove_workout'),
      t('confirm_remove_workout'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('remove'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWorkoutFromProgram({
                programId,
                workoutId
              });
              router.back();
            } catch (error) {
              console.error('Failed to remove workout:', error);
              Alert.alert(t('error'), t('failed_to_remove_workout'));
            }
          }
        }
      ]
    );
  };
  
  // Handle exercise selection
  const handleExerciseSelect = (index: number) => {
    if (selectedExerciseIndex === index) {
      setSelectedExerciseIndex(null); // Toggle off if already selected
    } else {
      setSelectedExerciseIndex(index);
    }
  };
  
  // Render a single exercise
  const renderExercise = (exercise: any, index: number) => {
    const isExpanded = selectedExerciseIndex === index;
    
    return (
      <View key={index} style={styles.exerciseContainer}>
        <TouchableOpacity
          style={[
            styles.exerciseHeader,
            isExpanded && styles.exerciseHeaderExpanded
          ]}
          onPress={() => handleExerciseSelect(index)}
          disabled={editMode}
        >
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          
          <View style={styles.exerciseHeaderRight}>
            {exercise.sets?.length > 0 && (
              <View style={styles.setCountBadge}>
                <Text style={styles.setCountText}>{exercise.sets.length} {t('sets')}</Text>
              </View>
            )}
            
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.text.secondary} 
            />
          </View>
        </TouchableOpacity>
        
        {/* Exercise sets - visible when expanded */}
        {isExpanded && exercise.sets && (
          <View style={styles.setsContainer}>
            {/* Sets header */}
            <View style={styles.setsHeader}>
              <Text style={styles.setsHeaderText}>{t('set')}</Text>
              <Text style={styles.setsHeaderText}>{t('reps')}</Text>
              <Text style={styles.setsHeaderText}>{t('weight')} (kg)</Text>
              <Text style={styles.setsHeaderText}>{t('rest')} (s)</Text>
            </View>
            
            {/* Sets list */}
            {exercise.sets.map((set: any, setIndex: number) => (
              <View key={setIndex} style={styles.setRow}>
                <Text style={styles.setNumber}>{setIndex + 1}</Text>
                <Text style={styles.setValue}>{set.reps || '-'}</Text>
                <Text style={styles.setValue}>{set.weight || '-'}</Text>
                <Text style={styles.setValue}>{set.rest_time || '-'}</Text>
              </View>
            ))}
            
            {/* Exercise notes if present */}
            {exercise.notes && (
              <View style={styles.exerciseNotes}>
                <Text style={styles.exerciseNotesLabel}>{t('notes')}:</Text>
                <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };
  
  // Calculate loading state
  const isLoading = isWorkoutLoading || isProgramLoading;
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state if workout not found
  if (!workout || !program) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>{t('workout_not_found')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('back_to_program')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {isCreator && !editMode && (
              <>
                <TouchableOpacity 
                  style={styles.headerAction}
                  onPress={() => setEditMode(true)}
                >
                  <Ionicons name="create-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.headerAction}
                  onPress={handleRemoveWorkout}
                >
                  <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
            
            {editMode && (
              <>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveWorkout}
                >
                  <Text style={styles.saveButtonText}>{t('save')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        {/* Workout Title (editable in edit mode) */}
        {editMode ? (
          <TextInput
            style={styles.headerTitleInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder={t('workout_name')}
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
          />
        ) : (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {workout.name}
          </Text>
        )}
        
        {/* Type badge & program info */}
        <View style={styles.typeBadgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{t('workout')}</Text>
          </View>
          
          <View style={styles.programInfo}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.programText}>{program.name}</Text>
          </View>
        </View>
        
        {/* Workout Details (in 2 columns) */}
        <View style={styles.detailsGrid}>
          {/* Left Column */}
          <View style={styles.detailsColumn}>
            {/* Focus */}
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>{t('focus')}</Text>
              {editMode ? (
                <View style={styles.focusOptions}>
                  {['strength', 'hypertrophy', 'cardio', 'endurance'].map((focus) => (
                    <TouchableOpacity
                      key={focus}
                      style={[
                        styles.focusOption,
                        workoutFocus === focus && styles.focusOptionSelected
                      ]}
                      onPress={() => setWorkoutFocus(focus)}
                    >
                      <Text 
                        style={[
                          styles.focusOptionText,
                          workoutFocus === focus && styles.focusOptionTextSelected
                        ]}
                      >
                        {t(focus)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.detailValue}>
                  {formatFocus(workout.focus)}
                </Text>
              )}
            </View>
            
            {/* Duration */}
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>{t('duration')}</Text>
              {editMode ? (
                <TextInput
                  style={styles.detailInput}
                  value={workoutDuration.toString()}
                  onChangeText={(text) => setWorkoutDuration(parseInt(text) || 0)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              ) : (
                <Text style={styles.detailValue}>
                  {workout.estimated_duration} {t('minutes')}
                </Text>
              )}
            </View>
          </View>
          
          {/* Right Column */}
          <View style={styles.detailsColumn}>
            {/* Difficulty */}
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>{t('difficulty')}</Text>
              {editMode ? (
                <View style={styles.difficultyOptions}>
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyOption,
                        workoutDifficulty === level && styles.difficultyOptionSelected
                      ]}
                      onPress={() => setWorkoutDifficulty(level)}
                    >
                      <Text 
                        style={[
                          styles.difficultyOptionText,
                          workoutDifficulty === level && styles.difficultyOptionTextSelected
                        ]}
                      >
                        {getDifficultyIndicator(level)} {t(level)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.detailValue}>
                  {getDifficultyIndicator(workout.difficulty_level)} {t(workout.difficulty_level)}
                </Text>
              )}
            </View>
            
            {/* Weekday - Instance-specific field */}
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>{t('scheduled_day')}</Text>
              {editMode ? (
                <View style={styles.weekdayOptions}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.weekdayOption,
                        preferredWeekday === index && styles.weekdayOptionSelected
                      ]}
                      onPress={() => setPreferredWeekday(index)}
                    >
                      <Text 
                        style={[
                          styles.weekdayOptionText,
                          preferredWeekday === index && styles.weekdayOptionTextSelected
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.weekdayBadge}>
                  <Text style={styles.weekdayBadgeText}>
                    {getWeekdayName(workout.preferred_weekday)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Description (editable in edit mode) */}
        {(editMode || workout.description) && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>{t('description')}</Text>
            {editMode ? (
              <TextInput
                style={styles.descriptionInput}
                value={workoutDescription}
                onChangeText={setWorkoutDescription}
                placeholder={t('workout_description')}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.descriptionText}>{workout.description}</Text>
            )}
          </View>
        )}
      </LinearGradient>
      
      {/* Exercise List */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.exercisesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('exercises')}</Text>
            <Text style={styles.exerciseCount}>
              {workout.exercises?.length || 0} {t('total')}
            </Text>
          </View>
          
          {workout.exercises && workout.exercises.length > 0 ? (
            <View style={styles.exercisesList}>
              {workout.exercises.map((exercise, index) => renderExercise(exercise, index))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateText}>{t('no_exercises')}</Text>
            </View>
          )}
        </View>
        
        {/* Program Info Section */}
        <View style={styles.programSection}>
          <Text style={styles.sectionTitle}>{t('program_info')}</Text>
          <TouchableOpacity 
            style={styles.programCard}
            onPress={() => router.push(`/program/${programId}`)}
          >
            <Text style={styles.programTitle}>{program.name}</Text>
            
            <View style={styles.programDetails}>
              <View style={styles.programDetailItem}>
                <Text style={styles.programDetailLabel}>{t('focus')}</Text>
                <Text style={styles.programDetailValue}>{formatFocus(program.focus)}</Text>
              </View>
              
              <View style={styles.programDetailItem}>
                <Text style={styles.programDetailLabel}>{t('level')}</Text>
                <Text style={styles.programDetailValue}>{program.difficulty_level}</Text>
              </View>
              
              <View style={styles.programDetailItem}>
                <Text style={styles.programDetailLabel}>{t('creator')}</Text>
                <Text style={styles.programDetailValue}>{program.creator_username}</Text>
              </View>
            </View>
            
            <View style={styles.goToProgramButton}>
              <Text style={styles.goToProgramText}>{t('view_program')}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.text.secondary} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Tags Section (if any) */}
        {workout.tags && workout.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>{t('tags')}</Text>
            <View style={styles.tagsContainer}>
              {workout.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Edit mode reminder (if in edit mode) */}
      {editMode && (
        <View style={styles.editModeReminder}>
          <Text style={styles.editModeText}>
            {t('exercise_edit_note')}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 24,
  },
  // Header styles
  header: {
    padding: 16,
    paddingBottom: 20,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerTitleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  programInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailsColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  detailBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 4,
  },
  focusOptions: {
    marginTop: 8,
  },
  focusOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  focusOptionSelected: {
    backgroundColor: 'rgba(14, 165, 233, 0.3)',
  },
  focusOptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  focusOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  difficultyOptions: {
    marginTop: 8,
  },
  difficultyOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  difficultyOptionSelected: {
    backgroundColor: 'rgba(14, 165, 233, 0.3)',
  },
  difficultyOptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  difficultyOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weekdayOptions: {
    marginTop: 8,
  },
  weekdayOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  weekdayOptionSelected: {
    backgroundColor: 'rgba(14, 165, 233, 0.3)',
  },
  weekdayOptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  weekdayOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weekdayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  weekdayBadgeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  descriptionInput: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 8,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  // Content styles
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  exercisesSection: {
    padding: 16,
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
    color: '#FFFFFF',
  },
  exerciseCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseContainer: {
    marginBottom: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  exerciseHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setCountBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 10,
  },
  setCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  setsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  setsHeaderText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  setNumber: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  setValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.text.primary,
  },
  exerciseNotes: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
  },
  exerciseNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  exerciseNotesText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    marginTop: 16,
  },
  // Program section
  programSection: {
    padding: 16,
    paddingTop: 0,
  },
  programCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  programDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  programDetailItem: {
    width: '50%',
    marginBottom: 8,
  },
  programDetailLabel: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginBottom: 2,
  },
  programDetailValue: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  goToProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  goToProgramText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600',
    marginRight: 4,
  },
  tagsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  bottomPadding: {
    height: 40,
  },
  // Edit mode reminder
  editModeReminder: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  editModeText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});