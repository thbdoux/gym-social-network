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
import { BlurView } from 'expo-blur';

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
  inFeedMode?: boolean;
}

// Updated subtle green color scheme
const COLORS = {
  primary: "#4ade80", // Light green
  secondary: "#10b981", // Emerald
  tertiary: "#059669", // Green-teal
  accent: "#f59e0b", // Amber
  success: "#10b981", // Emerald
  danger: "#ef4444", // Red
  background: "#18181b", // Zinc-900
  card: "#27272a", // Zinc-800
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    tertiary: "rgba(255, 255, 255, 0.5)"
  },
  border: "rgba(255, 255, 255, 0.1)"
};

// Exercise colors - subtle green variants with complementary colors
const EXERCISE_COLORS = [
  "#4ade80", // Light green
  "#34d399", // Emerald
  "#2dd4bf", // Teal
  "#a3e635", // Lime
  "#fbbf24", // Amber
  "#f472b6"  // Pink
];

const WorkoutLogDetailModal: React.FC<WorkoutLogDetailModalProps> = ({
  visible,
  log,
  onClose,
  currentUser,
  onEdit,
  onDelete,
  onFork,
  onExerciseSelect,
  inFeedMode = false
}) => {
  const { t } = useLanguage();
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('exercises'); // 'exercises' or 'stats'
  const [animationValues] = useState(() => ({
    fadeIn: new Animated.Value(0),
    contentFade: new Animated.Value(0),
    barScale: new Animated.Value(0),
    tabIndicator: new Animated.Value(0)
  }));

  // Memoized calculations for workout statistics
  const workoutStats = useMemo(() => {
    if (!log?.exercises) return {
      maxReps: 1,
      maxWeight: 1,
      totalWeight: 0,
      totalSets: 0,
      totalReps: 0,
      meanWeightPerRep: 0,
      exerciseStats: [],
      muscleGroupStats: {}
    };
    
    let maxReps = 0;
    let maxWeight = 0;
    let totalWeight = 0;
    let totalSets = 0;
    let totalReps = 0;
    let weightedReps = 0;
    const muscleGroupStats = {};
    
    // Calculate per-exercise stats
    const exerciseStats = log.exercises.map(exercise => {
      if (!exercise.sets) return {
        name: exercise.name,
        totalSets: 0,
        totalReps: 0,
        totalWeight: 0,
        meanWeightPerRep: 0
      };
      
      let exerciseTotalWeight = 0;
      let exerciseTotalReps = 0;
      let exerciseWeightedReps = 0;
      
      // Accumulate set data for this exercise
      exercise.sets.forEach(set => {
        const reps = set.reps || 0;
        const weight = set.weight || 0;
        
        // Update max values
        if (reps > maxReps) maxReps = reps;
        if (weight > maxWeight) maxWeight = weight;
        
        // Accumulate totals
        exerciseTotalReps += reps;
        exerciseTotalWeight += (weight * reps);
        exerciseWeightedReps += (weight > 0 && reps > 0) ? reps : 0;
        
        // Global totals
        totalSets++;
      });
      
      // Accumulate global totals
      totalReps += exerciseTotalReps;
      totalWeight += exerciseTotalWeight;
      weightedReps += exerciseWeightedReps;
      
      // Track by muscle group if available
      if (exercise.muscleGroup) {
        if (!muscleGroupStats[exercise.muscleGroup]) {
          muscleGroupStats[exercise.muscleGroup] = {
            totalSets: 0,
            totalReps: 0,
            totalWeight: 0
          };
        }
        
        muscleGroupStats[exercise.muscleGroup].totalSets += exercise.sets.length;
        muscleGroupStats[exercise.muscleGroup].totalReps += exerciseTotalReps;
        muscleGroupStats[exercise.muscleGroup].totalWeight += exerciseTotalWeight;
      }
      
      return {
        name: exercise.name,
        totalSets: exercise.sets.length,
        totalReps: exerciseTotalReps,
        totalWeight: exerciseTotalWeight,
        meanWeightPerRep: exerciseWeightedReps > 0 ? 
          (exerciseTotalWeight / exerciseWeightedReps).toFixed(1) : 0
      };
    });
    
    // Compute mean weight per rep for muscle groups
    Object.keys(muscleGroupStats).forEach(group => {
      const stats = muscleGroupStats[group];
      stats.meanWeightPerRep = stats.totalReps > 0 ? 
        (stats.totalWeight / stats.totalReps).toFixed(1) : 0;
    });
    
    return {
      maxReps,
      maxWeight,
      totalWeight,
      totalSets,
      totalReps,
      meanWeightPerRep: weightedReps > 0 ? (totalWeight / weightedReps).toFixed(1) : 0,
      exerciseStats,
      muscleGroupStats
    };
  }, [log?.exercises]);

  // Reset and start animations when modal opens
  useEffect(() => {
    if (visible && log?.exercises?.length) {
      setSelectedExerciseIndex(0);
      setActiveTab('exercises');
      
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

  // Animate tab indicator
  useEffect(() => {
    Animated.timing(animationValues.tabIndicator, {
      toValue: activeTab === 'exercises' ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

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
    // Check if the color is in hex format (#rrggbb)
    if (color.startsWith('#') && color.length === 7) {
      return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
    }
    return color; // Return as is if not in expected format
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
    if (!log.exercises || log.exercises.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color={COLORS.text.secondary} />
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
            <Text style={styles.legendText}>{t('weight')} (kg)</Text>
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
                          width: `${((set.weight || 0) / workoutStats.maxWeight) * 100}%`,
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

  // Render exercise selector buttons
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
            <TouchableOpacity
              key={index}
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
                  selectedExerciseIndex === index && {
                    color: COLORS.text.primary,
                    fontWeight: '700'
                  }
                ]}
                numberOfLines={1}
              >
                {exercise.name}
              </Text>
              {exercise.muscleGroup && (
                <Text style={styles.exerciseMuscleGroup}>
                  {exercise.muscleGroup}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render advanced stats content
  const renderAdvancedStats = () => {
    return (
      <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
        {/* Overall workout summary */}
        <View style={styles.statsSectionContainer}>
          <View style={styles.statsSectionHeader}>
            <Ionicons name="trending-up" size={16} color={COLORS.text.primary} />
            <Text style={styles.statsSectionTitle}>{t('workout_summary')}</Text>
          </View>
          
          <View style={styles.statsCardsRow}>
            <View style={[styles.statsCard, { borderColor: COLORS.primary }]}>
              <Text style={styles.statsCardLabel}>{t('total_weight')}</Text>
              <Text style={styles.statsCardValue}>{workoutStats.totalWeight} kg</Text>
            </View>
            
            <View style={[styles.statsCard, { borderColor: COLORS.secondary }]}>
              <Text style={styles.statsCardLabel}>{t('total_sets')}</Text>
              <Text style={styles.statsCardValue}>{workoutStats.totalSets}</Text>
            </View>
            
            <View style={[styles.statsCard, { borderColor: COLORS.tertiary }]}>
              <Text style={styles.statsCardLabel}>{t('total_reps')}</Text>
              <Text style={styles.statsCardValue}>{workoutStats.totalReps}</Text>
            </View>
          </View>
          
          <View style={[styles.statsCard, { borderColor: COLORS.accent, marginTop: 8 }]}>
            <Text style={styles.statsCardLabel}>{t('avg_weight_per_rep')}</Text>
            <Text style={styles.statsCardValue}>{workoutStats.meanWeightPerRep} kg</Text>
          </View>
        </View>
        
        {/* Exercise breakdown */}
        <View style={styles.statsSectionContainer}>
          <View style={styles.statsSectionHeader}>
            <Ionicons name="barbell-outline" size={16} color={COLORS.text.primary} />
            <Text style={styles.statsSectionTitle}>{t('exercise_breakdown')}</Text>
          </View>
          
          {workoutStats.exerciseStats.map((stat, index) => (
            <View key={index} style={styles.exerciseStatCard}>
              <View style={styles.exerciseStatHeader}>
                <View style={[styles.exerciseColorDot, { backgroundColor: getExerciseColor(index) }]} />
                <Text style={styles.exerciseStatName}>{stat.name}</Text>
              </View>
              
              <View style={styles.exerciseStatGrid}>
                <View style={styles.exerciseStatItem}>
                  <Text style={styles.exerciseStatLabel}>{t('sets')}</Text>
                  <Text style={styles.exerciseStatValue}>{stat.totalSets}</Text>
                </View>
                
                <View style={styles.exerciseStatItem}>
                  <Text style={styles.exerciseStatLabel}>{t('reps')}</Text>
                  <Text style={styles.exerciseStatValue}>{stat.totalReps}</Text>
                </View>
                
                <View style={styles.exerciseStatItem}>
                  <Text style={styles.exerciseStatLabel}>{t('weight')}</Text>
                  <Text style={styles.exerciseStatValue}>{stat.totalWeight} kg</Text>
                </View>
                
                <View style={styles.exerciseStatItem}>
                  <Text style={styles.exerciseStatLabel}>{t('avg_per_rep')}</Text>
                  <Text style={styles.exerciseStatValue}>{stat.meanWeightPerRep} kg</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        
        {/* Muscle group breakdown */}
        {Object.keys(workoutStats.muscleGroupStats).length > 0 && (
          <View style={styles.statsSectionContainer}>
            <View style={styles.statsSectionHeader}>
              <Ionicons name="body-outline" size={16} color={COLORS.text.primary} />
              <Text style={styles.statsSectionTitle}>{t('muscle_group_breakdown')}</Text>
            </View>
            
            {Object.entries(workoutStats.muscleGroupStats).map(([group, stats], index) => (
              <View key={group} style={styles.muscleGroupStatCard}>
                <Text style={styles.muscleGroupName}>{group}</Text>
                
                <View style={styles.muscleGroupStatGrid}>
                  <View style={styles.muscleGroupStatItem}>
                    <Text style={styles.muscleGroupStatLabel}>{t('sets')}</Text>
                    <Text style={styles.muscleGroupStatValue}>{stats.totalSets}</Text>
                  </View>
                  
                  <View style={styles.muscleGroupStatItem}>
                    <Text style={styles.muscleGroupStatLabel}>{t('reps')}</Text>
                    <Text style={styles.muscleGroupStatValue}>{stats.totalReps}</Text>
                  </View>
                  
                  <View style={styles.muscleGroupStatItem}>
                    <Text style={styles.muscleGroupStatLabel}>{t('weight')}</Text>
                    <Text style={styles.muscleGroupStatValue}>{stats.totalWeight} kg</Text>
                  </View>
                  
                  <View style={styles.muscleGroupStatItem}>
                    <Text style={styles.muscleGroupStatLabel}>{t('avg_per_rep')}</Text>
                    <Text style={styles.muscleGroupStatValue}>{stats.meanWeightPerRep} kg</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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

  // Fancy header with workout details
  const renderFancyHeader = () => (
    <View style={styles.fancyHeaderContainer}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(74, 222, 128, 0.8)', 'rgba(16, 185, 129, 0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      />
      
      {/* Header content */}
      <View style={styles.headerContentContainer}>
        {/* Close button */}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
        >
          <Ionicons name="close" size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        {/* Workout title and info */}
        <View style={styles.workoutTitleContainer}>
          <Text style={styles.workoutTitle} numberOfLines={1}>
            {log.name || log.workout_name || t('workout')}
          </Text>
          
          {log.program_name && (
            <Text style={styles.programName} numberOfLines={1}>
              {log.program_name}
            </Text>
          )}
        </View>
        
        {/* Workout details */}
        <View style={styles.workoutDetailsContainer}>
          {/* Top row - Date and completion status */}
          <View style={styles.workoutDetailsRow}>
            <View style={styles.workoutDetailItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
              <Text style={styles.workoutDetailText}>{formatDate(log.date)}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              log.completed ? { backgroundColor: COLORS.success } : { backgroundColor: COLORS.accent }
            ]}>
              <Ionicons 
                name={log.completed ? "checkmark-circle" : "time"} 
                size={12} 
                color={COLORS.text.primary}
              />
              <Text style={styles.statusText}>
                {log.completed ? t('completed') : t('in_progress')}
              </Text>
            </View>
          </View>
          
          {/* Bottom row - Location, duration, mood, difficulty */}
          <View style={styles.workoutDetailsRow}>
            {log.gym_name && (
              <View style={styles.workoutDetailItem}>
                <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
                <Text style={styles.workoutDetailText}>{log.gym_name}</Text>
              </View>
            )}
            
            {log.duration && (
              <View style={styles.workoutDetailItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
                <Text style={styles.workoutDetailText}>{log.duration}m</Text>
              </View>
            )}
            
            {log.mood_rating && (
              <View style={styles.workoutDetailItem}>
                <Text style={styles.workoutDetailEmoji}>
                  {getMoodEmoji(log.mood_rating)}
                </Text>
              </View>
            )}
            
            {log.perceived_difficulty && (
              <View style={styles.workoutDetailItem}>
                <Text style={styles.workoutDetailEmoji}>
                  {getDifficultyIndicator(log.perceived_difficulty)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  // Render tab navigation
  const renderTabNavigation = () => {
    // Calculate the translateX for the tab indicator
    const translateX = animationValues.tabIndicator.interpolate({
      inputRange: [0, 1],
      outputRange: [0, SCREEN_WIDTH * 0.92 / 2]
    });
    
    return (
      <View style={styles.tabNavigationContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'exercises' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('exercises')}
        >
          <Ionicons 
            name="barbell-outline" 
            size={18} 
            color={activeTab === 'exercises' ? COLORS.primary : COLORS.text.secondary} 
          />
          <Text 
            style={[
              styles.tabButtonText,
              activeTab === 'exercises' && { color: COLORS.primary }
            ]}
          >
            {t('exercises')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'stats' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons 
            name="stats-chart" 
            size={18} 
            color={activeTab === 'stats' ? COLORS.primary : COLORS.text.secondary} 
          />
          <Text 
            style={[
              styles.tabButtonText,
              activeTab === 'stats' && { color: COLORS.primary }
            ]}
          >
            {t('advanced_stats')}
          </Text>
        </TouchableOpacity>
        
        {/* Animated tab indicator */}
        <Animated.View 
          style={[
            styles.tabIndicator,
            { 
              backgroundColor: COLORS.primary,
              transform: [{ translateX }],
              width: SCREEN_WIDTH * 0.92 / 4 // Half of a tab width for a more subtle indicator
            }
          ]} 
        />
      </View>
    );
  };

  // Render action buttons
  const renderActionButtons = () => {
    // Don't render buttons in feed mode
    if (inFeedMode) return null;
    
    return (
      <View style={styles.actionsContainer}>
        {canEditLog && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: COLORS.primary }]}
            onPress={() => {
              onClose();
              if (onEdit) onEdit(log);
            }}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
              {t('edit')}
            </Text>
          </TouchableOpacity>
        )}
        
        {canForkLog && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: COLORS.tertiary }]}
            onPress={() => {
              onClose();
              if (onFork) onFork(log);
            }}
          >
            <Ionicons name="download-outline" size={16} color={COLORS.tertiary} />
            <Text style={[styles.actionButtonText, { color: COLORS.tertiary }]}>
              {t('fork')}
            </Text>
          </TouchableOpacity>
        )}
        
        {canDeleteLog && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: COLORS.danger }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>
              {t('delete')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop touchable */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        {/* Modal content */}
        <View style={styles.modalContent}>
            <View style={styles.contentContainer}>
              {/* Fancy header with workout details */}
              {renderFancyHeader()}
              
              {/* Tab navigation */}
              {renderTabNavigation()}
              
              <View style={styles.tabContentContainer}>
                  {activeTab === 'exercises' ? (
                    <View style={styles.exercisesTabContent}>
                      {/* Exercise selector - keep this ScrollView as it's horizontal */}
                      {renderExerciseSelector()}
                      
                      {/* Exercise visualization - this will be the only vertical ScrollView */}
                      {renderExerciseVisualization()}
                    </View>
                  ) : (
                    <View style={styles.statsTabContent}>
                      {/* Advanced stats - already has ScrollView inside */}
                      {renderAdvancedStats()}
                    </View>
                  )}
                </View>
              
              {/* Action buttons */}
              {renderActionButtons()}
            </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal base styles
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
    height: '80%',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    overflow: 'hidden',
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
    flex: 1,
  },
  
  // Fancy header styles
  fancyHeaderContainer: {
    position: 'relative',
    height: 140,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContentContainer: {
    flex: 1,
    padding: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 10,
  },
  workoutTitleContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  programName: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  workoutDetailsContainer: {
    marginTop: 'auto',
  },
  workoutDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  workoutDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  workoutDetailText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  workoutDetailEmoji: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    color: COLORS.text.primary,
  },
  
  // Tab navigation styles
  tabNavigationContainer: {
    flexDirection: 'row',
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.05)', // Very subtle primary color background
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  
  // Tab content container
  tabContentContainer: {
    flex: 1,
  },
  exercisesTabContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  statsTabContent: {
    flex: 1,
  },
  
  // Exercise selector styles
  exerciseSelectorContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    paddingTop: 6,
  },
  exerciseSelectorScroll: {
    maxHeight: 60,
  },
  exerciseSelectorContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  exerciseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    minWidth: 100,
  },
  exerciseButtonSelected: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  exerciseButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  exerciseMuscleGroup: {
    fontSize: 10,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  
  // Exercise visualization styles
  visualizationContainer: {
    paddingVertical: 12,
    flex: 1,
  },
  setsScrollView: {
    flex: 1,
  },
  setsScrollViewContent: {
    paddingBottom: 20, // Add some bottom padding for better scrolling experience
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.text.tertiary,
    fontWeight: '500',
  },
  setContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
  },
  repsSection: {
    flex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  repCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginRight: 8,
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
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 9,
    fontWeight: '600',
  },
  weightSection: {
    flex: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightBarContainer: {
    flex: 1,
    marginRight: 8,
  },
  weightBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weightBar: {
    height: '100%',
    borderRadius: 3,
  },
  weightText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    width: 30,
    textAlign: 'right',
  },
  noteContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  // Stats styles
  statsContainer: {
    flex: 1,
    paddingTop: 16,
  },
  statsSectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  statsCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statsCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
  },
  statsCardLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontWeight: '500',
  },
  statsCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  exerciseStatCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  exerciseStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  exerciseStatName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  exerciseStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  exerciseStatItem: {
    width: '50%',
    padding: 4,
  },
  exerciseStatLabel: {
    fontSize: 10,
    color: COLORS.text.tertiary,
    marginBottom: 2,
  },
  exerciseStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  muscleGroupStatCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  muscleGroupName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  muscleGroupStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  muscleGroupStatItem: {
    width: '50%',
    padding: 4,
  },
  muscleGroupStatLabel: {
    fontSize: 10,
    color: COLORS.text.tertiary,
    marginBottom: 2,
  },
  muscleGroupStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  
  // Empty state styles
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: 16,
  },
  
  // Action buttons styles
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 100,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    color: COLORS.text.primary,
  },
});

export default WorkoutLogDetailModal;