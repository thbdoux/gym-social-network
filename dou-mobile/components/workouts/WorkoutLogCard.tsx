// components/workouts/WorkoutLogCard.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Modal, 
  Pressable,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkoutFork } from '../../hooks/query/useWorkoutFork';
import { useWorkoutTemplates } from '../../hooks/query/useWorkoutQuery';

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
  exercises?: any[];
  exercise_count?: number;
  mood_rating?: number;
  perceived_difficulty?: number;
  notes?: string;
}

interface WorkoutLogCardProps {
  log: WorkoutLog;
  currentUser?: string;
  onEdit?: (log: WorkoutLog) => void;
  onDelete?: (log: WorkoutLog) => void;
  onFork?: (log: WorkoutLog) => void;
  onSelect?: (log: WorkoutLog) => void;
  compact?: boolean;
  feedMode?: boolean;
}

const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({ 
  log, 
  currentUser,
  onEdit, 
  onDelete, 
  onFork,
  onSelect,
  compact = false,
  feedMode = false,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  
  // Get fork hook and templates data for fork functionality
  const { data: templates = [] } = useWorkoutTemplates();
  const { 
    isForking, 
    forkSuccess,
    forkWorkout,
    showForkWarning,
    cancelFork
  } = useWorkoutFork();
  
  // Animation for expand/collapse
  const expandAnim = useRef(new Animated.Value(0)).current;
  
  if (!log) {
    return null;
  }
  
  const isCreator = log.username === currentUser;
  const canFork = !isCreator;
  
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      // Check if date is in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
      // Otherwise try standard parsing
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString; // If parsing fails, return the original string
    }
  };
  
  const getMoodEmoji = (rating?: number): string => {
    if (!rating) return '🙂';
    if (rating >= 4.5) return '😀';
    if (rating >= 3.5) return '🙂';
    if (rating >= 2.5) return '😐';
    if (rating >= 1.5) return '😕';
    return '😞';
  };

  const getDifficultyLevel = (rating?: number): string => {
    if (!rating) return '🔥';
    if (rating >= 8) return '🔥🔥🔥';
    if (rating >= 6) return '🔥🔥';
    if (rating >= 4) return '🔥';
    return '✓';
  };
  
  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.timing(expandAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false
    }).start();
    setIsExpanded(!isExpanded);
  };
  
  // Calculate max height for animation - even more reduced since we only show exercises
  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300] // Increased to accommodate potentially more exercises
  });
  
  const handleDelete = (): void => {
    Alert.alert(
      t('delete_log'),
      t('confirm_delete_workout_log'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          onPress: () => onDelete?.(log),
          style: 'destructive'
        }
      ]
    );
  };
  
  // Handle fork using the fork hook
  const handleFork = async () => {
    if (onFork) {
      // Use custom fork implementation if provided
      onFork(log);
    } else {
      // Otherwise use the hook implementation
      await forkWorkout(log, templates);
      if (forkSuccess) {
        Alert.alert(
          t('success'),
          t('workout_forked_successfully'),
          [{ text: t('ok') }]
        );
      }
    }
    setShowOptionsMenu(false);
  };
  
  // Handle fork confirmation if already forked
  const handleForkConfirm = () => {
    if (showForkWarning) {
      Alert.alert(
        t('already_forked'),
        t('already_forked_workout_message'),
        [
          { 
            text: t('cancel'),
            onPress: cancelFork,
            style: 'cancel'
          },
          {
            text: t('fork_again'),
            onPress: () => forkWorkout(log, templates, true),
          }
        ]
      );
    } else {
      handleFork();
    }
  };
  
  const exerciseCount = log.exercise_count || log.exercises?.length || 0;
  const gymName = log.gym_name || t('unknown_gym');

  return (
    <View style={[
      styles.container, 
      log.completed ? styles.containerCompleted : styles.containerRegular
    ]}>
      {/* Main Card Content */}
      <TouchableOpacity 
        style={styles.mainCard}
        onPress={feedMode ? () => onSelect && onSelect(log) : toggleExpand}
        activeOpacity={0.7}
      >
        {/* Date Column */}
        <View style={styles.dateColumn}>
          <Text style={styles.dateText}>{formatDate(log.date)}</Text>
          <View style={[
            styles.statusIndicator, 
            log.completed ? styles.statusCompleted : styles.statusIncomplete
          ]} />
        </View>
        
        {/* Content Column */}
        <View style={styles.contentColumn}>
          {/* Title and Program */}
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={2}>
              {log.name || log.workout_name || t('workout')}
            </Text>
            
            {/* Program and Gym Info Row */}
            <View style={styles.infoRow}>
              {log.program_name && (
                <View style={styles.infoTag}>
                  <Ionicons name="barbell-outline" size={12} color="#c084fc" style={styles.infoIcon} />
                  <Text style={styles.programText} numberOfLines={1}>
                    {log.program_name}
                  </Text>
                </View>
              )}
              
              {log.gym_name && (
                <View style={styles.infoTag}>
                  <Ionicons name="location-outline" size={12} color="#60a5fa" style={styles.infoIcon} />
                  <Text style={styles.gymText} numberOfLines={1}>
                    {log.gym_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            {/* Exercise Count */}
            <View style={styles.metricItem}>
              <Ionicons name="barbell-outline" size={14} style={styles.barbellIcon} />
              <Text style={styles.metricText}>{exerciseCount}</Text>
            </View>
            
            {/* Duration */}
            {log.duration && (
              <View style={styles.metricItem}>
                <Ionicons name="time-outline" size={14} style={styles.durationIcon} />
                <Text style={styles.metricText}>{log.duration}m</Text>
              </View>
            )}
            
            {/* Mood */}
            {log.mood_rating && (
              <View style={styles.moodItem}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(log.mood_rating)}</Text>
              </View>
            )}
            
            {/* Difficulty */}
            {log.perceived_difficulty && (
              <View style={[
                styles.difficultyItem,
                { opacity: Math.min(0.4 + (log.perceived_difficulty / 10) * 0.6, 1) }
              ]}>
                <Text style={styles.difficultyText}>
                  {getDifficultyLevel(log.perceived_difficulty)}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Actions Column */}
        <View style={styles.actionsColumn}>
          {/* Options Menu - Always first/top */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowOptionsMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
          </TouchableOpacity>
          
          {/* Fork button for non-creators - Using download icon now */}
          {canFork && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleForkConfirm}
            >
              <Ionicons name="download-outline" size={18} color="#60a5fa" />
            </TouchableOpacity>
          )}
          
          {/* Show expand indicator in non-feed mode - Always last/bottom */}
          {!feedMode && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={toggleExpand}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={18} 
                color="#9ca3af" 
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Exercise Progress Bar */}
      {exerciseCount > 0 && (
        <View style={styles.progressContainer}>
          {Array(Math.min(exerciseCount, 8)).fill(0).map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.progressSegment,
                log.completed ? styles.progressCompleted : styles.progressIncomplete,
                { width: `${100 / Math.min(exerciseCount, 8)}%` }
              ]}
            />
          ))}
        </View>
      )}
      
      {/* Expandable Content - Only exercises as requested */}
      {!feedMode && (
        <Animated.View style={[styles.expandedSection, { maxHeight }]}>
          <View style={styles.expandedContent}>
            {/* Enhanced Exercise Preview - Only showing exercises now */}
            {log.exercises && log.exercises.length > 0 && (
              <View style={styles.exercisesPreviewEnhanced}>
                <Text style={styles.sectionTitle}>{t('exercises')}</Text>
                <View style={styles.exerciseGrid}>
                  {log.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseGridItem}>
                      <TouchableOpacity 
                        style={styles.exerciseTouchable}
                        onPress={() => {
                          if (onSelect) {
                            // Select the workout log with focus on this specific exercise
                            onSelect({...log, activeExerciseId: exercise.id});
                          }
                        }}
                      >
                        <View style={styles.exerciseIconContainer}>
                          <Ionicons name="barbell" size={16} color="#c084fc" />
                        </View>
                        <View style={styles.exerciseDetails}>
                          <Text style={styles.exerciseName} numberOfLines={1}>
                            {exercise.name}
                          </Text>
                          <Text style={styles.exerciseSets}>
                            {exercise.sets?.length || 0} {t('sets')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* View Details Button */}
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => onSelect && onSelect(log)}
            >
              <Text style={styles.viewDetailsText}>{t('view_full_details')}</Text>
              <Ionicons name="arrow-forward" size={16} color="#60a5fa" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      
      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            <Text style={styles.optionsTitle}>{log.name || log.workout_name || t('workout')}</Text>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                onSelect && onSelect(log);
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#60a5fa" />
              <Text style={styles.optionText}>{t('view_details')}</Text>
            </TouchableOpacity>
            
            {isCreator && onEdit && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onEdit(log);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>{t('edit_workout')}</Text>
              </TouchableOpacity>
            )}
            
            {canFork && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleForkConfirm}
                disabled={isForking}
              >
                <Ionicons name="download-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>
                  {isForking ? t('forking_workout') : t('fork_workout')}
                </Text>
              </TouchableOpacity>
            )}
            
            {isCreator && onDelete && (
              <TouchableOpacity 
                style={[styles.optionItem, styles.deleteOption]}
                onPress={() => {
                  setShowOptionsMenu(false);
                  handleDelete();
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={styles.deleteOptionText}>{t('delete_workout')}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.cancelOption}
              onPress={() => setShowOptionsMenu(false)}
            >
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(34, 197, 94, 0.07)', // Light green background for all cards
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)', // Green border for all cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  containerRegular: {
    // Styles shared by all cards now
  },
  containerCompleted: {
    // Styles shared by all cards now
  },
  mainCard: {
    flexDirection: 'row',
    minHeight: 80,
  },
  dateColumn: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(55, 65, 81, 0.2)',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d1d5db',
    textAlign: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  statusCompleted: {
    backgroundColor: '#22c55e',
  },
  statusIncomplete: {
    backgroundColor: '#9ca3af',
  },
  contentColumn: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  programText: {
    fontSize: 10,
    color: '#c084fc',
    fontWeight: '500',
  },
  gymText: {
    fontSize: 10,
    color: '#60a5fa',
    fontWeight: '500',
  },
  infoIcon: {
    marginRight: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metricText: {
    fontSize: 12,
    color: '#d1d5db',
    marginLeft: 4,
  },
  moodItem: {
    marginRight: 12,
  },
  moodEmoji: {
    fontSize: 16,
  },
  // Colorized icons
  barbellIcon: {
    color: '#c084fc', // Purple
  },
  durationIcon: {
    color: '#22d3ee', // Cyan
  },
  locationIcon: {
    color: '#60a5fa', // Blue
  },
  difficultyIcon: {
    color: '#f87171', // Red
  },
  difficultyItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 12,
  },
  actionsColumn: {
    width: 40,
    alignItems: 'center',
    paddingVertical: 8,
    justifyContent: 'space-around',
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    height: 3,
  },
  progressSegment: {
    height: '100%',
    marginRight: 1,
  },
  progressCompleted: {
    backgroundColor: '#22c55e',
  },
  progressIncomplete: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
  },
  expandedSection: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.2)',
  },
  expandedContent: {
    padding: 16,
  },
  indicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  indicatorItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 70,
  },
  indicatorLabel: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 4,
    textAlign: 'center',
  },
  bigEmoji: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  exercisesPreviewEnhanced: {
    marginBottom: 16,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  exerciseGridItem: {
    width: '100%', // Changed from 50% to show exercises as a list
    paddingHorizontal: 4,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.1)',
  },
  exerciseIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  exerciseTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  exerciseSets: {
    fontSize: 10,
    color: '#9ca3af',
  },
  moreExercises: {
    fontSize: 12,
    color: '#60a5fa',
    marginTop: 8,
    textAlign: 'center',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#60a5fa',
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  optionsMenu: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.3)',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.2)',
  },
  optionText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#e5e7eb',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#ef4444',
  },
  cancelOption: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#60a5fa',
  },
});

export default WorkoutLogCard;