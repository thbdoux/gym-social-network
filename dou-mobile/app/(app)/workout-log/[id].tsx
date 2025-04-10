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
  TextInput,
  Keyboard
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

// Shared components
import ExerciseSelector from '../../../components/workouts/ExerciseSelector';
import ExerciseConfigurator, { Exercise, ExerciseSet } from '../../../components/workouts/ExerciseConfigurator';
import ExerciseCard from '../../../components/workouts/ExerciseCard';
import { SupersetManager } from '../../../components/workouts/utils/SupersetManager';

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
  
  // State for workout log details
  const [logName, setLogName] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logDate, setLogDate] = useState('');
  const [logDuration, setLogDuration] = useState(0);
  const [logMoodRating, setLogMoodRating] = useState(0);
  const [logDifficulty, setLogDifficulty] = useState(0);
  
  // State for edit modes
  const [editExercisesMode, setEditExercisesMode] = useState(false);
  const [activeTab, setActiveTab] = useState('exercises');
  
  // State for exercise management
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [exerciseConfiguratorVisible, setExerciseConfiguratorVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
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

  // Handle options menu - similar to workout page
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
          onPress: () => setEditExercisesMode(true)
        },
        {
          text: t('remove_workout'),
          style: 'destructive',
          onPress: handleDeleteLog
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
          text: t('date'),
          onPress: () => handleEditWorkoutDate()
        },
        {
          text: t('duration'),
          onPress: () => handleEditWorkoutDuration()
        },
        {
          text: t('notes'),
          onPress: () => handleEditWorkoutNotes()
        },
        {
          text: t('mood'),
          onPress: () => handleEditWorkoutMood()
        },
        {
          text: t('edit_difficulty'),
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
              setLogName(name);
              handleSaveWorkoutField('name', name);
            }
          }
        }
      ],
      'plain-text',
      logName
    );
  };

  // Handle editing workout date
  const handleEditWorkoutDate = () => {
    Alert.prompt(
      t('date'),
      t('enter_date_format'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (date) => {
            if (date && date.trim() !== '') {
              setLogDate(date);
              handleSaveWorkoutField('date', date);
            }
          }
        }
      ],
      'plain-text',
      logDate
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
            setLogDuration(duration);
            handleSaveWorkoutField('duration', duration);
          }
        }
      ],
      'plain-text',
      logDuration.toString(),
      'numeric'
    );
  };

  // Handle editing workout notes
  const handleEditWorkoutNotes = () => {
    Alert.prompt(
      t('notes'),
      t('enter_workout_notes'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (notes) => {
            setLogNotes(notes || '');
            handleSaveWorkoutField('notes', notes || '');
          }
        }
      ],
      'plain-text',
      logNotes
    );
  };

  // Handle editing workout mood
  const handleEditWorkoutMood = () => {
    const moodOptions = [
      { emoji: '😀', value: 5, label: t('excellent') },
      { emoji: '🙂', value: 4, label: t('good') },
      { emoji: '😐', value: 3, label: t('neutral') },
      { emoji: '😕', value: 2, label: t('poor') },
      { emoji: '😞', value: 1, label: t('terrible') }
    ];
    
    const alertOptions = moodOptions.map(option => ({
      text: `${option.emoji} ${option.label}`,
      onPress: () => {
        setLogMoodRating(option.value);
        handleSaveWorkoutField('mood', option.value);
      }
    }));
    
    // Add cancel option
    alertOptions.push({
      text: t('cancel'),
      style: 'cancel'
    });
    
    Alert.alert(
      t('mood'),
      t('how_was_your_workout'),
      alertOptions
    );
  };

  // Handle editing workout difficulty
  const handleEditWorkoutDifficulty = () => {
    const difficultyOptions = [
      { emoji: '🔥', value: 3, label: t('easy') },
      { emoji: '🔥🔥', value: 5, label: t('medium') },
      { emoji: '🔥🔥🔥', value: 8, label: t('hard') }
    ];
    
    const alertOptions = difficultyOptions.map(option => ({
      text: `${option.emoji} ${option.label}`,
      onPress: () => {
        setLogDifficulty(option.value);
        handleSaveWorkoutField('perceived_difficulty', option.value);
      }
    }));
    
    // Add cancel option
    alertOptions.push({
      text: t('cancel'),
      style: 'cancel'
    });
    
    Alert.alert(
      t('select_difficulty'),
      t('how_was_your_workout'),
      alertOptions
    );
  };

  // Handle saving individual workout field
  const handleSaveWorkoutField = async (field, value) => {
    try {
      // Format date properly if saving a date field
      let formattedValue = value;
      if (field === 'date') {
        // Check if the date is in DD/MM/YYYY format and convert it
        if (typeof value === 'string' && value.includes('/')) {
          const [day, month, year] = value.split('/');
          // Create a date object and convert to ISO string
          const dateObj = new Date(`${year}-${month}-${day}T12:00:00Z`);
          formattedValue = dateObj.toISOString();
        } else if (typeof value === 'string' && !value.includes('T')) {
          // If it's just a date without time, add the time portion
          formattedValue = `${value}T12:00:00Z`;
        }
      }
      
      // Create update data with the single field
      const updateData = { [field]: formattedValue };
      
      // Important: Include the existing exercises to prevent them from being deleted
      if (log && log.exercises) {
        updateData.exercises = log.exercises;
      }
      
      await updateLog({
        id: logId,
        logData: updateData
      });
      
      await refetch();
    } catch (error) {
      console.error(`Failed to update log ${field}:`, error);
      Alert.alert(t('error'), t('failed_to_update_log'));
    }
  };
  
  // Handle saving exercise edits (for exercise editing mode)
  const handleDoneEditingExercises = async () => {
    setEditExercisesMode(false);
    await refetch();
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
  
  // Handle updating a set
  const handleUpdateSet = (exercise, setIndex, field, value) => {
    const exerciseIndex = log.exercises.findIndex(e => e.id === exercise.id);
    if (exerciseIndex === -1) return;
    
    // Create a deep copy of the exercises array
    const updatedExercises = JSON.parse(JSON.stringify(log.exercises));
    
    // Update the specific set
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    
    // Prepare the update data
    const updateData = {
      ...log,
      exercises: updatedExercises
    };
    
    // Update the log
    updateLog({
      id: logId,
      logData: updateData
    }).then(() => {
      refetch();
    });
  };
  
  // Handle adding a set
  const handleAddSet = (exercise) => {
    const exerciseIndex = log.exercises.findIndex(e => e.id === exercise.id);
    if (exerciseIndex === -1) return;
    
    // Create a deep copy of the exercises array
    const updatedExercises = JSON.parse(JSON.stringify(log.exercises));
    
    // Get last set for reference or create default
    const lastSet = exercise.sets.length > 0 
      ? {...exercise.sets[exercise.sets.length - 1]} 
      : { reps: 10, weight: 0, rest_time: 60 };
    
    // Add the new set
    updatedExercises[exerciseIndex].sets.push(lastSet);
    
    // Prepare the update data
    const updateData = {
      ...log,
      exercises: updatedExercises
    };
    
    // Update the log
    updateLog({
      id: logId,
      logData: updateData
    }).then(() => {
      refetch();
    });
  };
  
  // Handle removing a set
  const handleRemoveSet = (exercise, setIndex) => {
    if (exercise.sets.length <= 1) {
      Alert.alert(t('error'), t('exercise_needs_at_least_one_set'));
      return;
    }
    
    const exerciseIndex = log.exercises.findIndex(e => e.id === exercise.id);
    if (exerciseIndex === -1) return;
    
    // Create a deep copy of the exercises array
    const updatedExercises = JSON.parse(JSON.stringify(log.exercises));
    
    // Remove the set
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    
    // Prepare the update data
    const updateData = {
      ...log,
      exercises: updatedExercises
    };
    
    // Update the log
    updateLog({
      id: logId,
      logData: updateData
    }).then(() => {
      refetch();
    });
  };
  
  // Handle editing an exercise
  const handleEditExercise = (index) => {
    const exercise = log.exercises[index];
    setCurrentExercise({...exercise});
    setExerciseConfiguratorVisible(true);
  };
  
  // Handle updating exercise notes
  const handleUpdateExerciseNotes = (exercise, notes) => {
    const exerciseIndex = log.exercises.findIndex(e => e.id === exercise.id);
    if (exerciseIndex === -1) return;
    
    // Create a deep copy of the exercises array
    const updatedExercises = JSON.parse(JSON.stringify(log.exercises));
    
    // Update the notes
    updatedExercises[exerciseIndex].notes = notes;
    
    // Prepare the update data
    const updateData = {
      ...log,
      exercises: updatedExercises
    };
    
    // Update the log
    updateLog({
      id: logId,
      logData: updateData
    }).then(() => {
      refetch();
    });
  };
  
  // Handle saving an exercise (edited)
  const handleSaveExercise = (exercise) => {
    if (currentExercise?.id) {
      const exerciseIndex = log.exercises.findIndex(e => e.id === currentExercise.id);
      if (exerciseIndex === -1) {
        setExerciseConfiguratorVisible(false);
        setCurrentExercise(null);
        return;
      }
      
      // Create a deep copy of the exercises array
      const updatedExercises = JSON.parse(JSON.stringify(log.exercises));
      
      // Update the exercise
      updatedExercises[exerciseIndex] = {
        ...exercise,
        id: currentExercise.id,
        order: currentExercise.order
      };
      
      // Prepare the update data
      const updateData = {
        ...log,
        exercises: updatedExercises
      };
      
      // Update the log
      updateLog({
        id: logId,
        logData: updateData
      }).then(() => {
        refetch();
      });
    }
    
    setExerciseConfiguratorVisible(false);
    setCurrentExercise(null);
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
    return (
      <View style={styles.tabNavigationContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'exercises' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('exercises')}
          disabled={editExercisesMode}
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
          disabled={editExercisesMode}
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
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {log.name}
            </Text>
          </View>
          
          {isCreator && !editExercisesMode ? (
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={handleOptionsMenu}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : editExercisesMode ? (
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={handleDoneEditingExercises}
            >
              <Text style={styles.doneButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* User info row */}
        <View style={styles.creatorRow}>
          <View style={styles.creatorInfo}>
            <Ionicons name="person" size={14} color={COLORS.text.secondary} />
            <Text style={styles.creatorText}>{log.username}</Text>
          </View>
          <View style={styles.statusBadge}>
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
        
        {/* Workout Info Row */}
        <View style={styles.workoutInfoRow}>
          {/* Date */}
          <View style={styles.workoutInfoItem}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.infoText}>{formatDate(log.date)}</Text>
          </View>
          
          {/* Gym */}
          {log.gym_name && (
            <View style={styles.workoutInfoItem}>
              <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>{log.gym_name}</Text>
            </View>
          )}
          
          {/* Duration */}
          <View style={styles.workoutInfoItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.infoText}>{log.duration}m</Text>
          </View>
          
          {/* Mood rating */}
          <View style={styles.workoutInfoItem}>
            <Text style={styles.infoIcon}>{getMoodEmoji(log.mood_rating)}</Text>
            <Text style={styles.infoText}>{t('mood')}</Text>
          </View>
          
          {/* Difficulty rating */}
          <View style={styles.workoutInfoItem}>
            <Text style={styles.infoIcon}>{getDifficultyIndicator(log.perceived_difficulty)}</Text>
            <Text style={styles.infoText}>{t('difficulty')}</Text>
          </View>
        </View>
        
        {/* Notes - only if available */}
        {log.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText} numberOfLines={3}>
              {log.notes}
            </Text>
          </View>
        )}
      </LinearGradient>
      
      {/* Tab Navigation (only show when not in edit mode) */}
      {!editExercisesMode && renderTabNavigation()}
      
      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {activeTab === 'exercises' ? (
          /* Exercises Tab */
          <ScrollView style={styles.exercisesContainer}>
            {/* Exercises Section */}
            <View style={styles.exercisesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('exercises')}</Text>
                <View style={styles.exerciseControls}>
                  <Text style={styles.exerciseCount}>
                    {log.exercises?.length || 0} {t('total')}
                  </Text>
                </View>
              </View>
              
              {/* Exercise List */}
              {log.exercises && log.exercises.length > 0 ? (
                <View style={styles.exercisesList}>
                  {log.exercises.map((exercise, index) => (
                    <ExerciseCard
                      key={index}
                      exercise={exercise}
                      showAllSets={true} // Always show detailed view in workout log detail
                      editMode={editExercisesMode}
                      isFirst={index === 0}
                      isLast={index === log.exercises.length - 1}
                      exerciseIndex={index}
                      onEdit={() => handleEditExercise(index)}
                      onAddSet={() => handleAddSet(exercise)}
                      onRemoveSet={(setIndex) => handleRemoveSet(exercise, setIndex)}
                      onUpdateSet={(setIndex, field, value) => 
                        handleUpdateSet(exercise, setIndex, field, value)
                      }
                      onUpdateNotes={(notes) => handleUpdateExerciseNotes(exercise, notes)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="barbell-outline" size={48} color={COLORS.text.tertiary} />
                  <Text style={styles.emptyStateText}>{t('no_exercises_recorded')}</Text>
                </View>
              )}
            </View>
            
            {/* Bottom padding */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        ) : (
          /* Statistics Tab */
          renderAdvancedStats()
        )}
      </View>
      
      {/* Edit mode reminder (if in edit mode) */}
      {editExercisesMode && (
        <View style={styles.editModeReminder}>
          <Text style={styles.editModeText}>
            {t('tap_exercises_to_edit')}
          </Text>
        </View>
      )}
      
      {/* Exercise Configurator Modal */}
      {currentExercise && (
        <ExerciseConfigurator
          visible={exerciseConfiguratorVisible}
          onClose={() => setExerciseConfiguratorVisible(false)}
          onSave={handleSaveExercise}
          exerciseName={currentExercise?.name || ''}
          initialSets={currentExercise?.sets || []}
          initialNotes={currentExercise?.notes || ''}
          isEdit={!!currentExercise?.id}
        />
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
  
  // Header styles
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  doneButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  creatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  creatorText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 101, 52, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(22, 101, 52, 0.3)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#FFFFFF',
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
    color: COLORS.text.primary,
    marginLeft: 4,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  notesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  
  // Tab Navigation Styles
  tabNavigationContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  
  // Content Container Styles
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  exercisesContainer: {
    flex: 1,
    padding: 0,
  },
  exercisesSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  exercisesList: {
    padding: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    marginTop: 16,
    textAlign: 'center',
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
});