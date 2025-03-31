// components/workouts/ProgramDetailModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  PanResponder,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

interface Program {
  id: number;
  name: string;
  description?: string;
  focus: string;
  difficulty_level: string;
  creator_username: string;
  is_active: boolean;
  sessions_per_week: number;
  estimated_completion_weeks: number;
  created_at: string;
  workouts?: any[];
  tags?: string[];
  forked_from?: number;
  forks_count?: number;
  is_public?: boolean;
  is_shared_with_me?: boolean;
  activeWeekday?: number;
  activeWorkoutId?: number;
}

interface ProgramDetailModalProps {
  visible: boolean;
  program: Program | null;
  onClose: () => void;
  currentUser?: string;
  onEdit?: (program: Program) => void;
  onDelete?: (programId: number) => void;
  onToggleActive?: (programId: number) => Promise<void>;
  onShare?: (program: Program) => void;
  onFork?: (programId: number) => Promise<void>;
  onWorkoutSelect?: (workoutId: number) => void;
}

const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  visible,
  program,
  onClose,
  currentUser,
  onEdit,
  onDelete,
  onToggleActive,
  onShare,
  onFork,
  onWorkoutSelect
}) => {
  const { t } = useLanguage();
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [activeWeekday, setActiveWeekday] = useState<number | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);
  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});
  
  // For the slide-to-fork functionality
  const [slideAnim] = useState(new Animated.Value(0));
  const screenWidth = Dimensions.get('window').width;
  const slideThreshold = screenWidth * 0.4;
  
  // Initialize PanResponder for the slider
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx <= slideThreshold) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > slideThreshold) {
          // Successful slide
          Animated.timing(slideAnim, {
            toValue: slideThreshold,
            duration: 200,
            useNativeDriver: true
          }).start(() => {
            if (onFork && program) {
              onFork(program.id);
              onClose();
            }
          });
        } else {
          // Return to start
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  // Reset states when modal opens/closes
  useEffect(() => {
    if (visible) {
      setActiveWeekday(program?.activeWeekday !== undefined ? program.activeWeekday : null);
      setDescriptionExpanded(false);
      setExpandedExercises({});
      slideAnim.setValue(0);
    }
  }, [visible, program, slideAnim]);

  if (!program) return null;

  // Permission checks
  const isCreator = program.creator_username === currentUser;
  const canEditProgram = isCreator;
  const canShareProgram = isCreator;
  const canDeleteProgram = isCreator;
  const canToggleActive = isCreator;
  const canForkProgram = !isCreator && (program.is_public || program.is_shared_with_me);

  // Format focus text (convert snake_case to Title Case)
  const formatFocus = (focus: string) => {
    return focus
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleToggleActive = async (): Promise<void> => {
    if (isToggling || !onToggleActive) return;
    
    try {
      setIsToggling(true);
      await onToggleActive(program.id);
    } catch (error) {
      console.error('Failed to toggle active state:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('delete_program'),
      t('confirm_delete_program'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(program.id);
              onClose();
            }
          }
        }
      ]
    );
  };

  // Toggle exercise expansion
  const toggleExercise = (exerciseId: number) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  // Map weekdays
  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Get workouts for the active weekday
  const filteredWorkouts = activeWeekday !== null 
    ? program.workouts?.filter(w => w.preferred_weekday === activeWeekday)
    : program.workouts;

  // Function to get workout color based on focus
  const getWorkoutColor = (focus: string) => {
    switch(focus) {
      case 'strength': return '#7e22ce'; // Purple
      case 'hypertrophy': return '#4f46e5'; // Indigo
      case 'cardio': return '#ef4444'; // Red
      case 'endurance': return '#3b82f6'; // Blue
      case 'weight_loss': return '#10b981'; // Green
      case 'strength_hypertrophy': return '#8b5cf6'; // Violet
      default: return '#6b7280'; // Gray
    }
  };

  // Get the maximum weight for visualization scaling (use 225 as default)
  const calculateMaxWeight = (workouts: any[]) => {
    let maxWeight = 225; // Default
    
    try {
      if (workouts) {
        workouts.forEach(workout => {
          if (workout.exercises) {
            workout.exercises.forEach((exercise: any) => {
              if (exercise.sets) {
                exercise.sets.forEach((set: any) => {
                  if (set.weight && set.weight > maxWeight) {
                    maxWeight = set.weight;
                  }
                });
              }
            });
          }
        });
      }
      return maxWeight;
    } catch (error) {
      console.error("Error calculating max weight:", error);
      return 225;
    }
  };
  
  const maxWeight = calculateMaxWeight(program.workouts || []);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* This TouchableWithoutFeedback handles taps on the background */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        {/* The actual modal content */}
        <View style={styles.modalContent}>
          <View>
              {/* Gradient Header */}
              <LinearGradient
                colors={['#7e22ce', '#9333ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
              >
                {/* Control buttons */}
                <View style={styles.headerControls}>
                  {/* Close Button */}
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={onClose}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  {/* Three-dot menu button for creator */}
                  {isCreator && (
                    <TouchableOpacity 
                      style={styles.menuButton}
                      onPress={() => {
                        Alert.alert(
                          t('program_options'),
                          '',
                          [
                            {
                              text: program.is_active ? t('deactivate') : t('activate'),
                              onPress: handleToggleActive
                            },
                            {
                              text: t('edit'),
                              onPress: () => {
                                onClose();
                                if (onEdit) onEdit(program);
                              }
                            },
                            {
                              text: t('share'),
                              onPress: () => {
                                onClose();
                                if (onShare) onShare(program);
                              }
                            },
                            {
                              text: t('delete'),
                              style: 'destructive',
                              onPress: handleDelete
                            },
                            {
                              text: t('cancel'),
                              style: 'cancel'
                            }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Program Title */}
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle} numberOfLines={1}>{program.name}</Text>
                </View>
                
                {/* Creator Info with active status */}
                <View style={styles.creatorContainer}>
                  <View style={styles.creatorIconContainer}>
                    <Ionicons name="person" size={16} color="rgba(255, 255, 255, 0.8)" />
                  </View>
                  <Text style={styles.creatorName}>{program.creator_username}</Text>
                  
                  {/* Active status badge */}
                  {program.is_active && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>{t('active')}</Text>
                    </View>
                  )}
                  
                  {/* Fork count - only show if available */}
                  {program.forks_count > 0 && (
                    <View style={styles.forkCountContainer}>
                      <Ionicons name="git-branch-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                      <Text style={styles.forkCount}>{program.forks_count}</Text>
                    </View>
                  )}
                </View>
                
                {/* Program Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>{t('focus')}</Text>
                    <Text style={styles.detailValue}>{formatFocus(program.focus)}</Text>
                  </View>
                  
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>{t('level')}</Text>
                    <Text style={styles.detailValue}>{program.difficulty_level}</Text>
                  </View>
                  
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>{t('sessions')}</Text>
                    <Text style={styles.detailValue}>{program.sessions_per_week}x {t('per_week')}</Text>
                  </View>
                  
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>{t('duration')}</Text>
                    <Text style={styles.detailValue}>{program.estimated_completion_weeks} {t('weeks')}</Text>
                  </View>
                </View>
              </LinearGradient>
              
              <ScrollView style={styles.scrollContent}>
                {/* Description Section - Collapsible */}
                {program.description && (
                  <TouchableOpacity 
                    style={styles.sectionHeader}
                    onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionTitle}>{t('description')}</Text>
                    <Ionicons 
                      name={descriptionExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                )}
                
                {program.description && descriptionExpanded && (
                  <View style={styles.section}>
                    <Text style={styles.descriptionText}>{program.description}</Text>
                  </View>
                )}
                
                {/* Weekly Schedule */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('weekly_schedule')}</Text>
                  <View style={styles.weekdaysRow}>
                    {WEEKDAYS.map((day, index) => {
                      const hasWorkout = program.workouts?.some(w => w.preferred_weekday === index);
                      const workoutCount = program.workouts?.filter(w => w.preferred_weekday === index).length || 0;
                      const isSelected = activeWeekday === index;
                      
                      return (
                        <TouchableOpacity 
                          key={index} 
                          style={[
                            styles.weekdayButton,
                            isSelected && styles.weekdayButtonActive,
                            !hasWorkout && styles.weekdayButtonInactive
                          ]}
                          onPress={() => {
                            if (hasWorkout) {
                              setActiveWeekday(activeWeekday === index ? null : index);
                            }
                          }}
                          disabled={!hasWorkout}
                        >
                          <Text style={[
                            styles.weekdayText,
                            isSelected && styles.weekdayTextActive
                          ]}>
                            {day}
                          </Text>
                          
                          <View style={[
                            styles.weekdayIndicator,
                            hasWorkout ? styles.weekdayIndicatorActive : styles.weekdayIndicatorInactive,
                            isSelected && styles.weekdayIndicatorSelected
                          ]} />
                          
                          {/* Show badge for multiple workouts */}
                          {workoutCount > 1 && (
                            <View style={styles.workoutCountBadge}>
                              <Text style={styles.workoutCountText}>{workoutCount}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                
                {/* Workout Details */}
                <View style={styles.section}>
                  <View style={styles.workoutHeader}>
                    <Text style={styles.sectionTitle}>
                      {activeWeekday !== null 
                        ? t('workouts') 
                        : t('all_workouts')}
                    </Text>
                    
                    {activeWeekday !== null && (
                      <TouchableOpacity 
                        style={styles.clearFilterButton}
                        onPress={() => setActiveWeekday(null)}
                      >
                        <Text style={styles.clearFilterText}>{t('show_all')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Workouts List */}
                  {filteredWorkouts && filteredWorkouts.length > 0 ? (
                    <View style={styles.workoutsList}>
                      {filteredWorkouts.map((workout, index) => {
                        const workoutColor = getWorkoutColor(workout.focus || program.focus);
                        
                        return (
                          <View key={workout.id} style={styles.workoutItem}>
                            <View style={styles.workoutHeader}>
                              <Text style={styles.workoutName}>{workout.name}</Text>
                              
                              <View style={styles.workoutMeta}>
                                <View style={[styles.focusBadge, { backgroundColor: `${workoutColor}30` }]}>
                                  <Text style={[styles.focusBadgeText, { color: workoutColor }]}>
                                    {formatFocus(workout.focus || program.focus)}
                                  </Text>
                                </View>
                                
                                {workout.estimated_duration_minutes && (
                                  <Text style={styles.workoutDuration}>
                                    {workout.estimated_duration_minutes} {t('min')}
                                  </Text>
                                )}
                              </View>
                            </View>
                            
                            {/* Exercise List */}
                            {workout.exercises && (
                              <View style={styles.exercisesList}>
                                {(() => {
                                  // Track which exercises we've already rendered
                                  const renderedExercises = new Set();
                                  
                                  return workout.exercises.map((exercise: any) => {
                                    // If already rendered, skip
                                    if (renderedExercises.has(exercise.id)) return null;
                                    
                                    // Find all exercises in this superset group (if any)
                                    const supersetGroup = exercise.superset_group;
                                    const supersetExercises = supersetGroup 
                                      ? workout.exercises.filter((ex: any) => ex.superset_group === supersetGroup)
                                      : [exercise];
                                    
                                    // Mark all as rendered
                                    supersetExercises.forEach((ex: any) => renderedExercises.add(ex.id));
                                    
                                    const isSuperset = supersetExercises.length > 1;
                                    
                                    return (
                                      <View key={exercise.id} style={styles.exerciseGroupContainer}>
                                        {/* Superset indicator */}
                                        {isSuperset && (
                                          <View style={styles.supersetIndicator}>
                                            <View style={styles.supersetIndicatorLine} />
                                            <View style={styles.supersetIndicatorLabel}>
                                              <Text style={styles.supersetIndicatorText}>{t('superset')}</Text>
                                            </View>
                                          </View>
                                        )}
                                        
                                        {/* Exercises */}
                                        <View style={isSuperset ? styles.supersetExercisesContainer : styles.singleExerciseContainer}>
                                          {supersetExercises.map((ex: any, exIndex: number) => {
                                            const isExpanded = expandedExercises[ex.id] === true;
                                            
                                            return (
                                              <View key={ex.id} style={[
                                                styles.exerciseContainer,
                                                exIndex > 0 && styles.exerciseContainerWithMargin
                                              ]}>
                                                <TouchableOpacity
                                                  style={styles.exerciseHeader}
                                                  onPress={() => toggleExercise(ex.id)}
                                                  activeOpacity={0.7}
                                                >
                                                  <Text style={styles.exerciseName}>{ex.name}</Text>
                                                  
                                                  <View style={styles.exerciseHeaderRight}>
                                                    {ex.rest_seconds && (
                                                      <View style={[
                                                        styles.restBadge,
                                                        { backgroundColor: `${workoutColor}20` }
                                                      ]}>
                                                        <Text style={styles.restText}>{ex.rest_seconds}"</Text>
                                                      </View>
                                                    )}
                                                    
                                                    <Ionicons
                                                      name={isExpanded ? "chevron-up" : "chevron-down"}
                                                      size={16}
                                                      color="#FFFFFF"
                                                      style={styles.exerciseExpandIcon}
                                                    />
                                                  </View>
                                                </TouchableOpacity>
                                                
                                                {/* Exercise Sets - Only visible when expanded */}
                                                {isExpanded && ex.sets && (
                                                  <View style={styles.setsContainer}>
                                                    {ex.sets.map((set: any, setIndex: number) => (
                                                      <View key={setIndex} style={styles.setItem}>
                                                        {/* Set visualization with reps and weight */}
                                                        <View style={styles.setVisualization}>
                                                          {/* Left side - Reps visualization */}
                                                          <View style={styles.repsContainer}>
                                                            <Text style={styles.repsText}>{set.reps}</Text>
                                                            <View style={styles.repsDots}>
                                                              {Array.from({ length: Math.min(set.reps, 10) }).map((_, i) => (
                                                                <View 
                                                                  key={i} 
                                                                  style={[
                                                                    styles.repDot,
                                                                    { 
                                                                      backgroundColor: workoutColor,
                                                                      opacity: 0.7 + ((i / Math.min(set.reps, 10)) * 0.3)
                                                                    }
                                                                  ]}
                                                                />
                                                              ))}
                                                            </View>
                                                          </View>
                                                          
                                                          {/* Center - Set label */}
                                                          <View style={[
                                                            styles.setLabelContainer,
                                                            { backgroundColor: `${workoutColor}30` }
                                                          ]}>
                                                            <Text style={styles.setLabelText}>
                                                              {t('set')} {setIndex + 1}
                                                            </Text>
                                                          </View>
                                                          
                                                          {/* Right side - Weight visualization */}
                                                          <View style={styles.weightContainer}>
                                                            <View style={styles.weightBarContainer}>
                                                              <View 
                                                                style={[
                                                                  styles.weightBar,
                                                                  { 
                                                                    width: `${(set.weight / maxWeight) * 100}%`,
                                                                    backgroundColor: workoutColor 
                                                                  }
                                                                ]}
                                                              />
                                                            </View>
                                                            <Text style={styles.weightText}>{set.weight}</Text>
                                                          </View>
                                                        </View>
                                                      </View>
                                                    ))}
                                                  </View>
                                                )}
                                                
                                                {/* Exercise Notes - Only visible when expanded */}
                                                {isExpanded && ex.notes && (
                                                  <View style={styles.notesContainer}>
                                                    <Text style={styles.notesText}>{ex.notes}</Text>
                                                  </View>
                                                )}
                                              </View>
                                            );
                                          })}
                                        </View>
                                      </View>
                                    );
                                  }).filter(Boolean);
                                })()}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        {activeWeekday !== null
                          ? t('no_workouts_for_day')
                          : t('no_workouts_in_program')}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Tags */}
                {program.tags && program.tags.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('tags')}</Text>
                    <View style={styles.tagsContainer}>
                      {program.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Bottom spacing for scrolling */}
                <View style={styles.bottomSpace} />
              </ScrollView>
              
              {/* Fork Button for non-creators */}
              {!isCreator && canForkProgram && (
                <View style={styles.forkSliderContainer}>
                  <LinearGradient
                    colors={['rgba(126, 34, 206, 0.6)', 'rgba(147, 51, 234, 0.5)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.forkSliderGradient}
                  >
                    <View style={styles.forkSliderInstructions}>
                      <Ionicons 
                        name="arrow-forward" 
                        size={16} 
                        color="rgba(255, 255, 255, 0.6)" 
                        style={styles.forkSliderIcon}
                      />
                      <Text style={styles.forkSliderText}>{t('slide_to_fork')}</Text>
                    </View>
                    
                    <Animated.View 
                      style={[
                        styles.forkSliderHandle,
                        {
                          transform: [{ translateX: slideAnim }]
                        }
                      ]}
                      {...panResponder.panHandlers}
                    >
                      <View style={styles.forkHandleInner}>
                        <Ionicons name="download-outline" size={20} color="#7e22ce" />
                      </View>
                    </Animated.View>
                  </LinearGradient>
                </View>
              )}
            </View>
          
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
    backgroundColor: 'transparent',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#1F2937',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  // Header styles
  header: {
    padding: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22c55e',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  creatorName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  forkCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forkCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  detailBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    margin: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Scroll content styles
  scrollContent: {
    maxHeight: 550,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#D1D5DB',
  },
  // Weekday schedule styles
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
  },
  weekdayButton: {
    alignItems: 'center',
    width: 40,
    height: 40,
    justifyContent: 'center',
    borderRadius: 20,
  },
  weekdayButtonActive: {
    backgroundColor: '#7e22ce',
    transform: [{ scale: 1.05 }],
  },
  weekdayButtonInactive: {
    opacity: 0.5,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  weekdayTextActive: {
    color: '#FFFFFF',
  },
  weekdayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekdayIndicatorActive: {
    backgroundColor: '#FFFFFF',
  },
  weekdayIndicatorInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  weekdayIndicatorSelected: {
    transform: [{ scale: 1.2 }],
  },
  workoutCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7e22ce',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  workoutCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Workout header
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a78bfa',
  },
  // Workouts list styles
  workoutsList: {
    marginTop: 8,
  },
  workoutItem: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  focusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  focusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workoutDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Exercise list
  exercisesList: {
    marginTop: 12,
  },
  exerciseGroupContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  supersetIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
  },
  supersetIndicatorLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#8b5cf6',
  },
  supersetIndicatorLabel: {
    position: 'absolute',
    top: '50%',
    left: -30,
    transform: [{ rotate: '-90deg' }, { translateY: -12 }],
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  supersetIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  supersetExercisesContainer: {
    paddingLeft: 16,
  },
  singleExerciseContainer: {},
  exerciseContainer: {
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  exerciseContainerWithMargin: {
    marginTop: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  restText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  exerciseExpandIcon: {
    marginLeft: 4,
  },
  // Sets visualization
  setsContainer: {
    padding: 12,
    paddingTop: 0,
  },
  setItem: {
    marginTop: 8,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 8,
    padding: 8,
  },
  setVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  repsContainer: {
    flex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  repsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  repsDots: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  repDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  setLabelContainer: {
    flex: 2,
    height: 22,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  setLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  weightContainer: {
    flex: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  weightBar: {
    height: '100%',
    borderRadius: 5,
  },
  weightText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
    width: 30,
    textAlign: 'right',
  },
  notesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: 12,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(209, 213, 219, 0.8)',
  },
  // Empty state
  emptyState: {
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  tag: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#c4b5fd',
  },
  // Bottom spacing
  bottomSpace: {
    height: 16,
  },
  // Floating Action Buttons - Removed as we're using the three-dot menu
  activateButton: {
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)',
  },
  deactivateButton: {
    backgroundColor: '#22c55e',
  },
  editButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  shareButton: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  // Fork slider
  forkSliderContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  forkSliderGradient: {
    height: 64,
    borderRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  forkSliderInstructions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forkSliderIcon: {
    marginRight: 8,
  },
  forkSliderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  forkSliderHandle: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  forkHandleInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default ProgramDetailModal;