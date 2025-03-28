// components/workouts/WorkoutLogDetailModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

// Get window dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Set {
  id: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed?: boolean;
  rpe?: number;
}

interface Exercise {
  id: number;
  name: string;
  sets?: Set[];
  note?: string;
  muscleGroup?: string;
}

interface WorkoutLog {
  id: number;
  name: string;
  workout_name?: string;
  date: string;
  duration?: number;
  completed: boolean;
  username?: string;
  gym_name?: string;
  gym_location?: string;
  gym?: number;
  program_name?: string;
  exercises?: Exercise[];
  exercise_count?: number;
  mood_rating?: number;
  perceived_difficulty?: number;
  notes?: string;
  activeExerciseId?: number;
}

interface WorkoutLogDetailModalProps {
  visible: boolean;
  log: WorkoutLog | null;
  onClose: () => void;
  currentUser?: string;
  onEdit?: (log: WorkoutLog) => void;
  onDelete?: (log: WorkoutLog) => void;
  onFork?: (log: WorkoutLog) => Promise<void>;
  onExerciseSelect?: (exerciseId: number) => void;
}

// Updated to match the card's color scheme
const EXERCISE_COLORS = [
  "#16a34a", // Primary green (matching card)
  "#15803d", // Darker green
  "#22c55e", // Lighter green
  "#166534", // Deep green (from card)
  "#86efac", // Very light green
  "#4ade80"  // Medium light green
];

const WorkoutLogDetailModal: React.FC<WorkoutLogDetailModalProps> = ({
  visible,
  log,
  onClose,
  currentUser,
  onEdit,
  onDelete,
  onFork,
  onExerciseSelect
}) => {
  const { t } = useLanguage();
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [animationValues] = useState(() => ({
    fadeIn: new Animated.Value(0),
    contentFade: new Animated.Value(0),
    barScale: new Animated.Value(0)
  }));

  // Calculate the maximum reps and weight across all exercises
  const { maxReps, maxWeight } = useMemo(() => {
    if (!log?.exercises) return { maxReps: 1, maxWeight: 1 };
    
    let maxR = 0;
    let maxW = 0;
    
    log.exercises.forEach(exercise => {
      exercise.sets?.forEach(set => {
        if (set.reps && set.reps > maxR) maxR = set.reps;
        if (set.weight && set.weight > maxW) maxW = set.weight;
      });
    });
    
    return { maxReps: maxR || 1, maxWeight: maxW || 1 };
  }, [log?.exercises]);

  // Reset and start animations when modal opens
  useEffect(() => {
    if (visible && log?.exercises?.length) {
      setSelectedExerciseIndex(0);
      
      // Reset animations
      Object.values(animationValues).forEach(value => value.setValue(0));
      
      // Start animations
      Animated.sequence([
        Animated.timing(animationValues.fadeIn, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(animationValues.contentFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animationValues.barScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.elastic(1.2)
          })
        ])
      ]).start();
    }
  }, [visible, log]);

  if (!log) return null;

  // Permission checks
  const isCreator = log.username === currentUser;
  const canEditLog = isCreator;
  const canDeleteLog = isCreator;
  const canForkLog = !isCreator;

  // Get exercise color
  const getExerciseColor = (index: number): string => {
    return EXERCISE_COLORS[index % EXERCISE_COLORS.length];
  };

  // Get color with opacity
  const getColorWithOpacity = (color: string, opacity: number): string => {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  // Calculate total workout volume across all exercises
  const calculateTotalVolume = (): number => {
    if (!log.exercises) return 0;
    return log.exercises.reduce((workoutTotal, exercise) => {
      if (!exercise.sets) return workoutTotal;
      const exerciseVolume = exercise.sets.reduce((total, set) => {
        return total + ((set.weight || 0) * (set.reps || 0));
      }, 0);
      return workoutTotal + exerciseVolume;
    }, 0);
  };

  // Get total workout reps across all exercises
  const getTotalReps = (): number => {
    if (!log.exercises) return 0;
    return log.exercises.reduce((workoutTotal, exercise) => {
      if (!exercise.sets) return workoutTotal;
      const exerciseReps = exercise.sets.reduce((total, set) => {
        return total + (set.reps || 0);
      }, 0);
      return workoutTotal + exerciseReps;
    }, 0);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      // Check if date is in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      // Otherwise try standard parsing
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString; // If parsing fails, return the original string
    }
  };

  // Get mood emoji based on rating
  const getMoodEmoji = (rating?: number): string => {
    if (!rating) return '😐';
    if (rating >= 4.5) return '😀';
    if (rating >= 3.5) return '🙂';
    if (rating >= 2.5) return '😐';
    if (rating >= 1.5) return '😕';
    return '😞';
  };

  // Get difficulty indicator based on rating
  const getDifficultyIndicator = (rating?: number): string => {
    if (!rating) return '🔥';
    if (rating >= 8) return '🔥🔥🔥';
    if (rating >= 5) return '🔥🔥';
    return '🔥';
  };

  // Render the exercise visualization with sets
  const renderExerciseVisualization = () => {
    console.log("Rendering exercise visualization", log?.exercises?.length);
    if (!log.exercises || log.exercises.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color="#86efac" />
          <Text style={styles.emptyStateText}>{t('no_exercises_recorded')}</Text>
        </View>
      );
    }

    const exercise = log.exercises[selectedExerciseIndex];
    const exerciseColor = getExerciseColor(selectedExerciseIndex);
    
    if (!exercise.sets || exercise.sets.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('no_sets_recorded')}</Text>
        </View>
      );
    }

    return (
      <Animated.View 
        style={[
          styles.visualizationContainer,
          { opacity: animationValues.contentFade }
        ]}
      >
        {/* Sets visualization */}
        <ScrollView style={styles.setsScrollView} showsVerticalScrollIndicator={false}>
          {/* Legends at the top */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendText}>{t('reps')}</Text>
            <Text style={styles.legendText}>{t('weight')} (lbs)</Text>
          </View>
          
          {/* Sets */}
          {exercise.sets.map((set, idx) => (
            <Animated.View 
              key={idx} 
              style={[
                styles.setContainer,
                { opacity: animationValues.contentFade }
              ]}
            >
              {/* Left side - Reps visualization */}
              <View style={styles.repsSection}>
                <Text style={styles.repCountText}>{set.reps || 0}</Text>
                <View style={styles.repDotsContainer}>
                  {Array.from({ length: Math.min(set.reps || 0, 10) }).map((_, i) => (
                    <View 
                      key={i}
                      style={[
                        styles.repDot,
                        { 
                          backgroundColor: exerciseColor,
                          opacity: 0.7 + ((i / Math.min(set.reps || 1, 10)) * 0.3) 
                        }
                      ]}
                    />
                  ))}
                </View>
              </View>
              
              {/* Center - Set number */}
              <View style={styles.setNumberSection}>
                <View style={[styles.setNumberBadge, { backgroundColor: getColorWithOpacity(exerciseColor, 0.2) }]}>
                  <Text style={[styles.setNumberText, { color: exerciseColor }]}>
                    {t('set')} {idx + 1}
                  </Text>
                </View>
              </View>
              
              {/* Right side - Weight bar */}
              <View style={styles.weightSection}>
                <Animated.View 
                  style={[
                    styles.weightBarContainer,
                    { transform: [{ scaleX: animationValues.barScale }] }
                  ]}
                >
                  <View style={styles.weightBarBackground}>
                    <View 
                      style={[
                        styles.weightBar,
                        { 
                          width: `${((set.weight || 0) / maxWeight) * 100}%`,
                          backgroundColor: exerciseColor 
                        }
                      ]}
                    />
                  </View>
                </Animated.View>
                <Text style={styles.weightText}>{set.weight || 0}</Text>
              </View>
            </Animated.View>
          ))}

          {/* Notes if available */}
          {exercise.note && (
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>{exercise.note}</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  // Render exercise selector buttons - Now as buttons with arrows
  const renderExerciseSelector = () => {
    if (!log.exercises || log.exercises.length === 0) {
      return null;
    }

    return (
      <View style={styles.exerciseSelectorContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.exerciseSelectorScroll}
          contentContainerStyle={styles.exerciseSelectorContent}
        >
          {log.exercises.map((exercise, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <View style={styles.arrowContainer}>
                  <Ionicons name="arrow-forward" size={14} color="rgba(255, 255, 255, 0.4)" />
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.exerciseButton,
                  selectedExerciseIndex === index && [
                    styles.exerciseButtonSelected,
                    { borderColor: getExerciseColor(index) }
                  ]
                ]}
                onPress={() => setSelectedExerciseIndex(index)}
              >
                <Text 
                  style={[
                    styles.exerciseButtonText,
                    selectedExerciseIndex === index && [
                      styles.exerciseButtonTextSelected,
                      { color: '#FFFFFF' }
                    ]
                  ]}
                  numberOfLines={1}
                >
                  {exercise.name}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render compact workout metadata
  const renderMetadataHeader = () => (
    <Animated.View 
      style={[
        styles.metadataContainer,
        { opacity: animationValues.fadeIn }
      ]}
    >
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>{formatDate(log.date)}</Text>
        
        <View style={[
          styles.statusBadge,
          log.completed ? styles.completedBadge : styles.pendingBadge
        ]}>
          <Ionicons 
            name={log.completed ? "checkmark-circle" : "time"} 
            size={12} 
            color={log.completed ? "#FFFFFF" : "#FFFFFF"} 
          />
          <Text style={[
            styles.statusText,
            log.completed ? styles.completedText : styles.pendingText
          ]}>
            {log.completed ? t('completed') : t('in_progress')}
          </Text>
        </View>
      </View>
      
      <View style={styles.metadataRow}>
        {log.gym_name && (
          <View style={styles.metadataItem}>
            <Ionicons name="location" size={12} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.metadataText}>{log.gym_name}</Text>
          </View>
        )}
        
        {log.duration && (
          <View style={styles.metadataItem}>
            <Ionicons name="time" size={12} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.metadataText}>{log.duration}m</Text>
          </View>
        )}
        
        {log.mood_rating && (
          <View style={styles.metadataItem}>
            <Text style={styles.metadataEmoji}>
              {getMoodEmoji(log.mood_rating)}
            </Text>
          </View>
        )}
        
        {log.perceived_difficulty && (
          <View style={styles.metadataItem}>
            <Text style={styles.metadataEmoji}>
              {getDifficultyIndicator(log.perceived_difficulty)}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  // Render Workout Performance component 
  const renderWorkoutPerformance = () => {
    if (!log.exercises || log.exercises.length === 0) return null;
    
    return (
      <View style={styles.performanceContainer}>
        <View style={styles.performanceHeader}>
          <Ionicons name="trophy" size={16} color="#FFFFFF" />
          <Text style={styles.performanceTitle}>{t('workout_performance')}</Text>
        </View>
        
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('total_volume')}</Text>
            <Text style={styles.metricValue}>{calculateTotalVolume()}</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('total_reps')}</Text>
            <Text style={styles.metricValue}>{getTotalReps()}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Handle delete action
  const handleDelete = () => {
    Alert.alert(
      t('delete_log'),
      t('confirm_delete_workout_log'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(log);
              onClose();
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop touchable */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        {/* Modal content */}
        <View style={styles.modalContent}>
          <TouchableWithoutFeedback>
            <View style={styles.contentContainer}>
              {/* Header */}
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                style={styles.header}
              >
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {log.name || log.workout_name || t('workout')}
                  </Text>
                  {log.program_name && (
                    <Text style={styles.programName}>
                      {log.program_name}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
              
              {/* Metadata header */}
              {renderMetadataHeader()}
              
              {/* Exercise selector */}
              {renderExerciseSelector()}
              
              {/* Scrollable content */}
              <View style={styles.exerciseContainer}>
                {renderExerciseVisualization()}
              </View>
              
              {/* Global workout performance metrics - Moved to bottom */}
              {renderWorkoutPerformance()}
              
              {/* Action buttons */}
              <View style={styles.actionsContainer}>
                {canEditLog && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                      onClose();
                      if (onEdit) onEdit(log);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>
                      {t('edit')}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {canForkLog && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.forkButton]}
                    onPress={() => {
                      onClose();
                      if (onFork) onFork(log);
                    }}
                  >
                    <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.forkButtonText]}>
                      {t('fork')}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {canDeleteLog && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                      {t('delete')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '92%',
    height: '80%', // Fixed height instead of maxHeight
    backgroundColor: '#1a1a1a', // Darker background matching card theme
    borderRadius: 24,
    overflow: 'hidden',
    display: 'flex', // Ensure flex display
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.44,
        shadowRadius: 10.32,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  contentContainer: {
    flexDirection: 'column',
    flex: 1, // Take full height
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  programName: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Metadata header styles
  metadataContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  completedText: {
    color: '#FFFFFF',
  },
  pendingText: {
    color: '#FFFFFF',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  metadataText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  metadataEmoji: {
    fontSize: 13,
  },
  // Exercise selector styles - Updated with arrows
  exerciseSelectorContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  exerciseSelectorScroll: {
    maxHeight: 40,
  },
  exerciseSelectorContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exerciseButtonSelected: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
  },
  exerciseButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  exerciseButtonTextSelected: {
    color: '#FFFFFF',
  },
  arrowContainer: {
    paddingHorizontal: 4,
  },
  // Exercise visualization styles - Updated for scrolling
  visualizationContainer: {
    paddingVertical: 8,
    flex: 1,
    minHeight: 200, // Ensure minimum height
  },
  setsScrollView: {
    maxHeight: 280, // Increased for scrollability
    flex: 1, // Add flex to ensure it takes space
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  legendText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  setContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  repsSection: {
    flex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  repCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  repDotsContainer: {
    flexDirection: 'row-reverse',
    gap: 2,
  },
  repDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  setNumberSection: {
    flex: 2,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  setNumberBadge: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 8,
    fontWeight: '600',
  },
  weightSection: {
    flex: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightBarContainer: {
    flex: 1,
    marginRight: 6,
  },
  weightBarBackground: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weightBar: {
    height: '100%',
    borderRadius: 3,
  },
  weightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    width: 28,
    textAlign: 'right',
  },
  // Exercise container
  exerciseContainer: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 300, // Ensure minimum height for visibility
  },
  // Performance metrics styles - Moved to bottom
  performanceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noteContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginHorizontal: 16,
  },
  noteText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Empty state styles
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 16,
  },
  // Action buttons styles
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    minWidth: 90,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    color: '#FFFFFF',
  },
  editButton: {
    backgroundColor: '#16a34a',
  },
  editButtonText: {
    color: '#FFFFFF',
  },
  forkButton: {
    backgroundColor: '#16a34a',
  },
  forkButtonText: {
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#b91c1c',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  }
});

export default WorkoutLogDetailModal;