// app/(app)/workout-log/[id].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Keyboard,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  useLog,
  useUpdateLog,
  useDeleteLog,
} from '../../../hooks/query/useLogQuery';

// Components
import GymSelectionModal from '../../../components/workouts/GymSelectionModal';
import WorkoutPartnersManagerModal from '../../../components/workouts/WorkoutPartnersManagerModal';
import ExerciseConfigurator from '../../../components/workouts/ExerciseConfigurator';
import ExerciseSelector from '../../../components/workouts/ExerciseSelector';
import { AnimatedHeader } from './components/AnimatedHeader';
import { ExercisesList } from './components/ExercisesList';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';

import { useGym } from '../../../hooks/query/useGymQuery';

interface WorkoutLogDetailScreenProps {
  overrideUserId?: number;
  overrideLogId?: number;
}

// Define permission types
type PermissionLevel = 'creator' | 'partner' | 'viewer' | 'none';

// Default set templates for different effort types
const getDefaultSetForEffortType = (effortType: 'reps' | 'time' | 'distance') => {
  switch (effortType) {
    case 'time':
      return {
        duration: 30,
        weight: 0,
        weight_unit: 'kg',
        rest_time: 60
      };
    case 'distance':
      return {
        distance: 1000,
        duration: 300,
        rest_time: 60
      };
    case 'reps':
    default:
      return {
        reps: 10,
        weight: 0,
        weight_unit: 'kg',
        rest_time: 60
      };
  }
};

export default function WorkoutLogDetailScreen({ 
  overrideUserId, 
  overrideLogId 
}: WorkoutLogDetailScreenProps = {}) {
  
  // Get theme context
  const { workoutLogPalette, palette } = useTheme();
  
  // Animation setup with dynamic header height
  const scrollY = useRef(new Animated.Value(0)).current;
  const [dynamicHeaderHeight, setDynamicHeaderHeight] = useState(230);
  
  // Create dynamic theme colors
  const COLORS = {
    primary: workoutLogPalette.background,
    secondary: workoutLogPalette.highlight,
    tertiary: workoutLogPalette.border,
    background: palette.page_background,
    card: "#1F2937",
    text: {
      primary: workoutLogPalette.text,
      secondary: workoutLogPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.5)"
    },
    border: workoutLogPalette.border,
    success: "#10b981",
    danger: "#ef4444"
  };
  
  const { t, language } = useLanguage();
  const { id } = useLocalSearchParams();
  const logId = typeof id === 'string' ? parseInt(id, 10) : 0;
  
  const { user } = useAuth();
  const targetUserId = overrideUserId || user?.id;

  // State for log details
  const [logName, setLogName] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logDuration, setLogDuration] = useState(0);
  const [logDifficulty, setLogDifficulty] = useState(0);
  const [logMoodRating, setLogMoodRating] = useState(5);
  const [logCompleted, setLogCompleted] = useState(false);
  const [logDate, setLogDate] = useState('');
  const [selectedGym, setSelectedGym] = useState(null);
  const [workoutPartners, setWorkoutPartners] = useState<number[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // UI state for new exercise editing
  const [isGymSelectionVisible, setIsGymSelectionVisible] = useState(false);
  const [isPartnersManagerVisible, setIsPartnersManagerVisible] = useState(false);
  const [exerciseConfiguratorVisible, setExerciseConfiguratorVisible] = useState(false);
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [currentEditingExercise, setCurrentEditingExercise] = useState(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(-1);
  
  // Hooks
  const { data: log, isLoading, error, refetch } = useLog(logId);
  const { mutateAsync: updateLog, isPending: isUpdating } = useUpdateLog();
  const { mutateAsync: deleteLog } = useDeleteLog();
  const { data: gymData, isLoading: isGymLoading } = useGym(log?.gym || undefined);

  // Enhanced permission logic
  const getPermissionLevel = (): PermissionLevel => {
    if (!log || !user) return 'none';
    
    if (log.username === user.username) {
      return 'creator';
    }
    
    if (log.workout_partners && log.workout_partners.includes(user.id)) {
      return 'partner';
    }
    
    return 'viewer';
  };

  const permissionLevel = getPermissionLevel();
  const canEdit = permissionLevel === 'creator';
  const canView = permissionLevel !== 'none';
  const isCreator = permissionLevel === 'creator';
  
  // Handle header height changes
  const handleHeaderHeightChange = useCallback((height: number) => {
    setDynamicHeaderHeight(height);
  }, []);
  
  // Initialize form state when log data is loaded
  useEffect(() => {
    if (log) {
      setLogName(log.name);
      setLogNotes(log.notes || '');
      setLogDuration(log.duration || 0);
      setLogDifficulty(log.perceived_difficulty || 0);
      setLogMoodRating(log.mood_rating || 5);
      setLogCompleted(log.completed || false);
      setLogDate(log.date || '');
      setWorkoutPartners(log.workout_partners || []);
      
      if (gymData) {
        setSelectedGym({
          id: gymData.id,
          name: gymData.name,
          location: gymData.location || ''
        });
      } else if (log.gym && log.gym_name) {
        setSelectedGym({
          id: log.gym,
          name: log.gym_name,
          location: log.location || ''
        });
      } else {
        setSelectedGym(null);
      }
    }
  }, [log, gymData]);
  
  // Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle saving individual log field
  const handleSaveLogField = async (field: string, value: any) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      const updates = { 
        [field]: value,
        exercises: log?.exercises || [],
        workout_partners: workoutPartners
      };
      
      await updateLog({
        id: logId,
        logData: updates
      });
      await refetch();
    } catch (error) {
      console.error(`Failed to update log ${field}:`, error);
      Alert.alert(t('error'), t('failed_to_update_log'));
    }
  };

  // Handle deleting the log
  const handleDeleteLog = () => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_delete'));
      return;
    }
    
    Alert.alert(
      t('delete_log'),
      t('confirm_delete_log'),
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

  // Handle updating workout partners
  const handleUpdatePartners = async (partners: number[]) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      setWorkoutPartners(partners);
      const updatedData = {
        workout_partners: partners,
        exercises: log?.exercises || []
      };
      
      await updateLog({
        id: logId,
        logData: updatedData
      });
      await refetch();
    } catch (error) {
      console.error('Failed to update workout partners:', error);
      Alert.alert(t('error'), t('failed_to_update_partners'));
      setWorkoutPartners(log?.workout_partners || []);
    }
  };

  // Handle gym selection
  const handleGymSelection = async (gym: any) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      setSelectedGym(gym);
      const gymData = gym ? {
        gym: gym.id,
        gym_name: gym.name,
        location: gym.location
      } : {
        gym: null,
        gym_name: null,
        location: 'Home'
      };
      
      const updatedData = {
        ...gymData,
        exercises: log?.exercises || [],
        workout_partners: workoutPartners
      };
      
      await updateLog({
        id: logId,
        logData: updatedData
      });
      await refetch();
    } catch (error) {
      console.error('Failed to update gym:', error);
      Alert.alert(t('error'), t('failed_to_update_gym'));
    }
  };

  // Handle clicking on workout partners section
  const handlePartnersPress = () => {
    if (canEdit || workoutPartners.length > 0) {
      setIsPartnersManagerVisible(true);
    }
  };

  // New exercise management functions
  const handleAddNewExercise = () => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    setExerciseSelectorVisible(true);
  };

  const handleSelectExercise = (selectedExercise) => {
    const effortType = selectedExercise.effort_type || 'reps';
    const defaultSet = getDefaultSetForEffortType(effortType);
    
    const newExercise = {
      id: Date.now(),
      name: selectedExercise.name,
      equipment: selectedExercise.equipment || '',
      effort_type: effortType,
      sets: [{ 
        ...defaultSet,
        id: Date.now() + Math.floor(Math.random() * 1000)
      }],
      order: (log?.exercises?.length || 0),
      notes: selectedExercise.notes || ''
    };
    
    setCurrentEditingExercise(newExercise);
    setEditingExerciseIndex(-1); // -1 indicates new exercise
    setExerciseSelectorVisible(false);
    setExerciseConfiguratorVisible(true);
  };

  const handleEditExercise = (exercise, index) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    setCurrentEditingExercise({ ...exercise });
    setEditingExerciseIndex(index);
    setExerciseConfiguratorVisible(true);
  };

  const handleDeleteExercise = (exerciseIndex) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }

    Alert.alert(
      t('delete_exercise'),
      t('delete_exercise_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedExercises = [...(log?.exercises || [])];
              updatedExercises.splice(exerciseIndex, 1);
              
              // Update order for remaining exercises
              updatedExercises.forEach((exercise, index) => {
                exercise.order = index;
              });

              await updateLog({
                id: logId,
                logData: { exercises: updatedExercises }
              });
              await refetch();
            } catch (error) {
              console.error('Failed to delete exercise:', error);
              Alert.alert(t('error'), t('failed_to_delete_exercise'));
            }
          }
        }
      ]
    );
  };

  const handleCreateSuperset = (sourceIndex) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    const exercises = log?.exercises || [];
    if (exercises.length < 2) {
      Alert.alert(t('error'), t('need_two_exercises_for_superset'));
      return;
    }

    // Show selection modal for pairing
    const availableExercises = exercises
      .map((ex, idx) => ({ ...ex, originalIndex: idx }))
      .filter((_, idx) => idx !== sourceIndex && !_.is_superset);

    Alert.alert(
      t('create_superset'),
      t('select_exercise_to_pair'),
      [
        { text: t('cancel'), style: 'cancel' },
        ...availableExercises.map((ex, idx) => ({
          text: ex.name,
          onPress: () => createSupersetPair(sourceIndex, ex.originalIndex)
        }))
      ]
    );
  };

  const createSupersetPair = async (sourceIndex, targetIndex) => {
    try {
      const updatedExercises = [...(log?.exercises || [])];
      
      // Create superset relationship
      updatedExercises[sourceIndex] = {
        ...updatedExercises[sourceIndex],
        is_superset: true,
        superset_with: updatedExercises[targetIndex].order,
        superset_rest_time: 90
      };
      
      updatedExercises[targetIndex] = {
        ...updatedExercises[targetIndex],
        is_superset: true,
        superset_with: updatedExercises[sourceIndex].order,
        superset_rest_time: 90
      };

      await updateLog({
        id: logId,
        logData: { exercises: updatedExercises }
      });
      await refetch();
    } catch (error) {
      console.error('Failed to create superset:', error);
      Alert.alert(t('error'), t('failed_to_create_superset'));
    }
  };

  // Handle breaking superset
  const handleBreakSuperset = async (exerciseIndex) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      const updatedExercises = [...(log?.exercises || [])];
      const currentExercise = updatedExercises[exerciseIndex];
      
      if (currentExercise.is_superset && currentExercise.superset_with !== null) {
        // Find the paired exercise
        const pairedExerciseIndex = updatedExercises.findIndex(
          ex => ex.order === currentExercise.superset_with
        );
        
        // Remove superset relationship from current exercise
        updatedExercises[exerciseIndex] = {
          ...currentExercise,
          is_superset: false,
          superset_with: null,
          superset_rest_time: undefined
        };
        
        // Remove superset relationship from paired exercise if found
        if (pairedExerciseIndex !== -1) {
          updatedExercises[pairedExerciseIndex] = {
            ...updatedExercises[pairedExerciseIndex],
            is_superset: false,
            superset_with: null,
            superset_rest_time: undefined
          };
        }
        
        await updateLog({
          id: logId,
          logData: { exercises: updatedExercises }
        });
        await refetch();
      }
    } catch (error) {
      console.error('Failed to break superset:', error);
      Alert.alert(t('error'), t('failed_to_break_superset'));
    }
  };

  const handleSaveExercise = async (exercise) => {
    try {
      const updatedExercises = [...(log?.exercises || [])];
      
      if (editingExerciseIndex === -1) {
        // Adding new exercise
        const newExercise = {
          ...exercise,
          id: exercise.id || Date.now(),
          order: updatedExercises.length
        };
        updatedExercises.push(newExercise);
      } else {
        // Updating existing exercise
        updatedExercises[editingExerciseIndex] = {
          ...exercise,
          id: currentEditingExercise?.id,
          order: currentEditingExercise?.order
        };
      }
      

      await updateLog({
        id: logId,
        logData: { exercises: updatedExercises }
      });
      
      setExerciseConfiguratorVisible(false);
      setCurrentEditingExercise(null);
      setEditingExerciseIndex(-1);
      await refetch();
    } catch (error) {
      console.error('Failed to save exercise:', error);
      Alert.alert(t('error'), t('failed_to_save_exercise'));
    }
  };

  // Render loading state
  if (isLoading) {
    return <LoadingState colors={COLORS} t={t} />;
  }
  
  // Render error state if there's an error or no access
  if (error || !log || !canView) {
    return (
      <ErrorState 
        colors={COLORS} 
        t={t} 
        onBack={() => router.back()} 
        error={error}
      />
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Safe Area with Header Colors */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.safeAreaGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        </SafeAreaView>
      </LinearGradient>
      
      {/* Animated Header */}
      <AnimatedHeader
        scrollY={scrollY}
        log={log}
        colors={COLORS}
        isCreator={isCreator}
        selectedGym={selectedGym}
        workoutPartners={workoutPartners}
        logDuration={logDuration}
        logMoodRating={logMoodRating}
        onDeleteLog={handleDeleteLog}
        onPartnersPress={handlePartnersPress}
        onFieldUpdate={handleSaveLogField}
        setLogName={setLogName}
        setLogNotes={setLogNotes}
        setLogDuration={setLogDuration}
        setLogDifficulty={setLogDifficulty}
        setLogMoodRating={setLogMoodRating}
        setIsGymSelectionVisible={setIsGymSelectionVisible}
        onHeaderHeightChange={handleHeaderHeightChange}
        t={t}
        language={language}
      />
      
      {/* Main Content */}
      <Animated.ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={[
          styles.contentContainer, 
          { paddingTop: dynamicHeaderHeight + 16 }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <ExercisesList
          log={log}
          colors={COLORS}
          isCreator={isCreator}
          canEdit={canEdit}
          permissionLevel={permissionLevel}
          onAddExercise={handleAddNewExercise}
          onEditExercise={handleEditExercise}
          onDeleteExercise={handleDeleteExercise}
          onCreateSuperset={handleCreateSuperset}
          onBreakSuperset={handleBreakSuperset}
          t={t}
        />
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
      
      {/* Modals */}
      {canEdit && (
        <>
          <GymSelectionModal
            visible={isGymSelectionVisible}
            onClose={() => setIsGymSelectionVisible(false)}
            onSelectGym={handleGymSelection}
            selectedGym={selectedGym}
          />
          
          <WorkoutPartnersManagerModal
            visible={isPartnersManagerVisible}
            onClose={() => setIsPartnersManagerVisible(false)}
            currentPartnerIds={workoutPartners}
            onUpdatePartners={handleUpdatePartners}
            workoutName={log?.name}
            isCreator={isCreator}
          />

          <ExerciseSelector
            visible={exerciseSelectorVisible}
            onClose={() => setExerciseSelectorVisible(false)}
            onSelectExercise={handleSelectExercise}
          />

          {currentEditingExercise && (
            <ExerciseConfigurator
              visible={exerciseConfiguratorVisible}
              onClose={() => {
                setExerciseConfiguratorVisible(false);
                setCurrentEditingExercise(null);
                setEditingExerciseIndex(-1);
              }}
              onSave={handleSaveExercise}
              exercise={currentEditingExercise}
              isEdit={editingExerciseIndex !== -1}
            />
          )}
        </>
      )}
      
      {/* View-only partners modal for non-editors */}
      {!canEdit && (
        <WorkoutPartnersManagerModal
          visible={isPartnersManagerVisible}
          onClose={() => setIsPartnersManagerVisible(false)}
          currentPartnerIds={workoutPartners}
          onUpdatePartners={() => {}}
          workoutName={log?.name}
          isCreator={false}
          viewOnly={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    zIndex: 1001,
  },
  safeArea: {
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  bottomPadding: {
    height: 80,
  },
});