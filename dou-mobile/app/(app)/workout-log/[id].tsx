// app/(app)/workout-log/[id].tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  Animated,
  Dimensions,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import {
  useLog,
  useUpdateLog,
  useDeleteLog,
} from '../../../hooks/query/useLogQuery';

// Get window dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Updated green color scheme
const COLORS = {
  primary: "#4ade80", // Light green
  secondary: "#10b981", // Emerald
  tertiary: "#059669", // Green-teal
  accent: "#f59e0b", // Amber
  success: "#10b981", // Emerald
  danger: "#ef4444", // Red
  background: "#111827", // Dark background
  card: "#1F2937", // Card background
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    tertiary: "rgba(255, 255, 255, 0.5)"
  },
  border: "rgba(255, 255, 255, 0.1)"
};

// Exercise colors - green variants with complementary colors
const EXERCISE_COLORS = [
  "#4ade80", // Light green
  "#34d399", // Emerald
  "#2dd4bf", // Teal
  "#a3e635", // Lime
  "#fbbf24", // Amber
  "#f472b6"  // Pink
];

export default function WorkoutLogDetailScreen() {
  // Get log ID from route params
  const { id } = useLocalSearchParams();
  const logId = typeof id === 'string' ? parseInt(id, 10) : 0;
  
  // State
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('exercises');
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [logName, setLogName] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logDate, setLogDate] = useState('');
  const [logDuration, setLogDuration] = useState(0);
  const [logMoodRating, setLogMoodRating] = useState(0);
  const [logDifficulty, setLogDifficulty] = useState(0);
  
  // Animations
  const [animatedValues] = useState(() => ({
    tabIndicator: new Animated.Value(0),
    barScale: new Animated.Value(1),
    contentFade: new Animated.Value(1)
  }));
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: log, isLoading, refetch } = useLog(logId);
  const { mutateAsync: updateLog } = useUpdateLog();
  const { mutateAsync: deleteLog } = useDeleteLog();
  
  // Initialize form state when log data is loaded
  useEffect(() => {
    if (log) {
      setLogName(log.name);
      setLogNotes(log.notes || '');
      setLogDate(log.date);
      setLogDuration(log.duration || 0);
      setLogMoodRating(log.mood_rating || 0);
      setLogDifficulty(log.perceived_difficulty || 0);
    }
  }, [log]);
  
  // Animate tab indicator
  useEffect(() => {
    Animated.timing(animatedValues.tabIndicator, {
      toValue: activeTab === 'exercises' ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);
  
  // Check if current user is the log creator
  const isCreator = log?.username === user?.username;
  
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
  
  // Handle saving log edits
  const handleSaveLog = async () => {
    try {
      // Format the date properly to ISO format
      let formattedDate = logDate;
      
      // Check if the date is in DD/MM/YYYY format and convert it
      if (typeof logDate === 'string' && logDate.includes('/')) {
        const [day, month, year] = logDate.split('/');
        // Create a date object and convert to ISO string
        const dateObj = new Date(`${year}-${month}-${day}T12:00:00Z`);
        formattedDate = dateObj.toISOString();
      } else if (typeof logDate === 'string' && !logDate.includes('T')) {
        // If it's just a date without time, add the time portion
        formattedDate = `${logDate}T12:00:00Z`;
      }
      
      // Create the update data object
      const updateData = {
        name: logName,
        notes: logNotes,
        date: formattedDate,
        duration: logDuration,
        mood_rating: logMoodRating,
        perceived_difficulty: logDifficulty
      };
  
      // Important: Include the existing exercises to prevent them from being deleted
      if (log && log.exercises) {
        updateData.exercises = log.exercises;
      }
      
      await updateLog({
        id: logId,
        logData: updateData
      });
      
      setEditMode(false);
      await refetch();
    } catch (error) {
      console.error('Failed to update log:', error);
      Alert.alert(t('error'), t('failed_to_update_log'));
    }
  };
  
  // Handle canceling edit mode
  const handleCancelEdit = () => {
    // Reset form to original values
    if (log) {
      setLogName(log.name);
      setLogNotes(log.notes || '');
      setLogDate(log.date);
      setLogDuration(log.duration || 0);
      setLogMoodRating(log.mood_rating || 0);
      setLogDifficulty(log.perceived_difficulty || 0);
    }
    setEditMode(false);
  };
  
  // Handle deleting the log
  const handleDeleteLog = () => {
    Alert.alert(
      t('delete_log'),
      t('confirm_delete_workout_log'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLog(logId);
              router.back();
            } catch (error) {
              console.error('Failed to delete log:', error);
              Alert.alert(t('error'), t('failed_to_delete_log'));
            }
          }
        }
      ]
    );
  };
  
  // Render the exercise visualization with sets
  const renderExerciseVisualization = () => {
    if (!log?.exercises || log.exercises.length === 0) {
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
      <Animated.View style={[styles.visualizationContainer, { opacity: animatedValues.contentFade }]}>
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
              style={[styles.setContainer, { opacity: animatedValues.contentFade }]}
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
                    { transform: [{ scaleX: animatedValues.barScale }] }
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
    if (!log?.exercises || log.exercises.length === 0) {
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
  
  // Render tab navigation
  const renderTabNavigation = () => {
    // Calculate the translateX for the tab indicator
    const translateX = animatedValues.tabIndicator.interpolate({
      inputRange: [0, 1],
      outputRange: [0, SCREEN_WIDTH / 2]
    });
    
    return (
      <View style={styles.tabNavigationContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'exercises' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('exercises')}
          disabled={editMode}
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
          disabled={editMode}
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
              width: SCREEN_WIDTH / 4 // Half of a tab width for a more subtle indicator
            }
          ]} 
        />
      </View>
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state if log not found
  if (!log) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>{t('workout_log_not_found')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('back_to_workouts')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {/* Header */}
      <LinearGradient
        colors={['#16a34a', '#10b981']}
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
                  onPress={handleDeleteLog}
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
                  onPress={handleSaveLog}
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
            value={logName}
            onChangeText={setLogName}
            placeholder={t('workout_name')}
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
          />
        ) : (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {log.name}
          </Text>
        )}
        
        {/* Workout Details */}
        <View style={styles.workoutDetailsContainer}>
          {/* Date and completion status */}
          <View style={styles.workoutDetailsRow}>
            <View style={styles.workoutDetailItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
              {editMode ? (
                <TextInput
                  style={styles.detailInput}
                  value={logDate}
                  onChangeText={setLogDate}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              ) : (
                <Text style={styles.workoutDetailText}>{formatDate(log.date)}</Text>
              )}
            </View>
            
            <View style={[
              styles.statusBadge,
              log.completed ? styles.completedBadge : styles.pendingBadge
            ]}>
              <Ionicons 
                name={log.completed ? "checkmark-circle" : "time"} 
                size={12} 
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {log.completed ? t('completed') : t('in_progress')}
              </Text>
            </View>
          </View>
          
          {/* Additional workout details */}
          <View style={styles.workoutDetailsRow}>
            {(log.gym_name || editMode) && (
              <View style={styles.workoutDetailItem}>
                <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
                <Text style={styles.workoutDetailText}>{log.gym_name}</Text>
              </View>
            )}
            
            <View style={styles.workoutDetailItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
              {editMode ? (
                <TextInput
                  style={styles.detailInput}
                  value={logDuration.toString()}
                  onChangeText={(text) => setLogDuration(parseInt(text) || 0)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              ) : (
                <Text style={styles.workoutDetailText}>{log.duration}m</Text>
              )}
            </View>
            
            {/* Mood rating */}
            <View style={styles.workoutDetailItem}>
              {editMode ? (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingLabel}>{t('mood')}</Text>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingOption,
                        logMoodRating === rating && styles.ratingOptionSelected
                      ]}
                      onPress={() => setLogMoodRating(rating)}
                    >
                      <Text>{getMoodEmoji(rating)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.workoutDetailEmoji}>
                  {getMoodEmoji(log.mood_rating)}
                </Text>
              )}
            </View>
            
            {/* Difficulty rating */}
            <View style={styles.workoutDetailItem}>
              {editMode ? (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingLabel}>{t('difficulty')}</Text>
                  {[1, 5, 10].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingOption,
                        logDifficulty === rating && styles.ratingOptionSelected
                      ]}
                      onPress={() => setLogDifficulty(rating)}
                    >
                      <Text>{getDifficultyIndicator(rating)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.workoutDetailEmoji}>
                  {getDifficultyIndicator(log.perceived_difficulty)}
                </Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Notes (editable in edit mode) */}
        {(editMode || log.notes) && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>{t('notes')}</Text>
            {editMode ? (
              <TextInput
                style={styles.notesInput}
                value={logNotes}
                onChangeText={setLogNotes}
                placeholder={t('workout_notes')}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.notesText}>{log.notes}</Text>
            )}
          </View>
        )}
      </LinearGradient>
      
      {!editMode && (
        <>
          {/* Tab Navigation */}
          {renderTabNavigation()}
          
          {/* Tab Content */}
          <View style={styles.tabContentContainer}>
            {activeTab === 'exercises' ? (
              <View style={styles.exercisesTabContent}>
                {/* Exercise selector */}
                {renderExerciseSelector()}
                
                {/* Exercise visualization */}
                {renderExerciseVisualization()}
              </View>
            ) : (
              <View style={styles.statsTabContent}>
                {/* Advanced stats */}
                {renderAdvancedStats()}
              </View>
            )}
          </View>
        </>
      )}
      
      {/* Edit form (shown only in edit mode) */}
      {editMode && (
        <ScrollView style={styles.editFormContainer}>
          <View style={styles.editFormSection}>
            <Text style={styles.editFormSectionTitle}>{t('workout_info')}</Text>
            <Text style={styles.editFormHelp}>
              {t('edit_workout_help')}
            </Text>
            
            {/* Note that we can't edit exercises directly - would need a more complex form */}
            <Text style={styles.editFormNote}>
              {t('exercise_edit_note')}
            </Text>
          </View>
        </ScrollView>
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
    backgroundColor: '#22c55e',
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
  workoutDetailsContainer: {
    marginBottom: 16,
  },
  workoutDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  workoutDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  workoutDetailText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  workoutDetailEmoji: {
    fontSize: 16,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 16,
  },
  completedBadge: {
    backgroundColor: 'rgba(22, 101, 52, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(22, 101, 52, 0.3)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#FFFFFF',
  },
  notesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  notesLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  notesInput: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 8,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  detailInput: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 50,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 4,
    marginLeft: 6,
  },
  ratingLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginRight: 4,
  },
  ratingOption: {
    padding: 4,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  ratingOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Tab navigation styles
  tabNavigationContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
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
    backgroundColor: COLORS.background,
  },
  exercisesTabContent: {
    flex: 1,
  },
  statsTabContent: {
    flex: 1,
  },
  // Exercise selector styles
  exerciseSelectorContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    backgroundColor: COLORS.card,
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    minWidth: 100,
  },
  exerciseButtonSelected: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
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
    flex: 1,
    paddingVertical: 12,
  },
  setsScrollView: {
    flex: 1,
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: COLORS.background,
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
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
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
  // Edit form styles
  editFormContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  editFormSection: {
    marginBottom: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  editFormSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  editFormHelp: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  editFormNote: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});