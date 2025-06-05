// app/(app)/realtime-workout/index.tsx - Updated with new exercise formats
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  BackHandler,
  FlatList,
  ScrollView,
  Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { useLanguage } from '../../../context/LanguageContext';
import { useWorkout } from '../../../context/WorkoutContext';
import { useCreateLog } from '../../../hooks/query/useLogQuery';
import { useCreatePost } from '../../../hooks/query/usePostQuery';
import { useProgram } from '../../../hooks/query/useProgramQuery';
import { useWorkoutTemplate, useWorkoutTemplates } from '../../../hooks/query/useWorkoutQuery';
import { useCurrentUser } from '../../../hooks/query/useUserQuery';
import { useGyms, useGym, useGymDisplay } from '../../../hooks/query/useGymQuery';
import { useTheme } from '../../../context/ThemeContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { createWorkoutRendering } from './workoutRendering';
import GymSelectionModal from '../../../components/workouts/GymSelectionModal';
import TemplateSelectionModal from '../../../components/workouts/TemplateSelectionModal';

interface Gym {
  id: number;
  name: string;
  location: string;
  description?: string;
  is_default?: boolean;
}

// Helper function to create default set based on effort type
const createDefaultSet = (effortType: string = 'reps', order: number = 0, templateSet?: any, weightUnit: string = 'kg') => {
  const baseSet = {
    id: `set-${Date.now()}-${order}`,
    rest_time: templateSet?.rest_time || 60,
    order,
    completed: false,
    rest_time_completed: false,
    weight_unit: templateSet?.weight_unit || weightUnit
  };

  switch (effortType) {
    case 'time':
      return {
        ...baseSet,
        duration: templateSet?.duration || 30, // 30 seconds default
        actual_duration: templateSet?.duration || 30,
        weight: templateSet?.weight || null, // Optional for time exercises
        actual_weight: templateSet?.weight || null,
        reps: null,
        actual_reps: null,
        distance: null,
        actual_distance: null
      };
    
    case 'distance':
      return {
        ...baseSet,
        distance: templateSet?.distance || 100, // 100 meters default
        actual_distance: templateSet?.distance || 100,
        duration: templateSet?.duration || null, // Optional timing
        actual_duration: templateSet?.duration || null,
        weight: null,
        actual_weight: null,
        reps: null,
        actual_reps: null
      };
    
    case 'reps':
    default:
      return {
        ...baseSet,
        reps: templateSet?.reps || 10,
        weight: templateSet?.weight || 0,
        actual_reps: templateSet?.reps || 10,
        actual_weight: templateSet?.weight || 0,
        duration: null,
        actual_duration: null,
        distance: null,
        actual_distance: null
      };
  }
};

export default function RealtimeWorkoutLogger() {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { mutateAsync: createLog } = useCreateLog();
  const { mutateAsync: createPost } = useCreatePost();
  
  // User and gym data
  const { data: currentUser } = useCurrentUser();
  const { data: gyms } = useGyms();
  const { data: templates, isLoading: templatesLoading } = useWorkoutTemplates();
  
  // Context is the SINGLE source of truth
  const workoutContext = useWorkout();
  const {
    activeWorkout,
    hasActiveWorkout,
    startWorkout,
    updateWorkout,
    endWorkout,
    toggleTimer
  } = workoutContext;
  
  // Get search params
  const params = useLocalSearchParams();
  const sourceType = params.source as string || 'custom';
  const templateId = params.templateId ? Number(params.templateId) : null;
  const programId = params.programId ? Number(params.programId) : null;
  const workoutId = params.workoutId ? Number(params.workoutId) : null;
  const isResuming = params.resume === 'true';
  
  // Fetch template/program data for initial setup only
  const { data: template } = useWorkoutTemplate(templateId);
  const { data: program } = useProgram(programId);
  const programWorkout = program?.workouts?.find(w => w.id === workoutId);
  
  // Local UI state only (not workout data)
  const [workoutName, setWorkoutName] = useState('');
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [selectingExercise, setSelectingExercise] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeSeconds, setRestTimeSeconds] = useState(0);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  
  // UI refs
  const exerciseFlatListRef = useRef<FlatList>(null);
  const exerciseScrollViewRef = useRef<ScrollView>(null);
  
  
  // Initialize workout name from context or template/program
  useEffect(() => {
    if (isResuming && activeWorkout) {
      setWorkoutName(activeWorkout.name);
      // Also restore selected gym if it was saved in the workout
      if (activeWorkout.gym_id && gyms) {
        const gym = gyms.find(g => g.id === activeWorkout.gym_id);
        if (gym) setSelectedGym(gym);
      }
    } else if (!hasActiveWorkout) {
      let initialName = '';
      if (sourceType === 'template' && template) {
        initialName = template.name;
      } else if (sourceType === 'program' && programWorkout) {
        initialName = programWorkout.name;
      }
      setWorkoutName(initialName);
    }
  }, [isResuming, activeWorkout, template, programWorkout, gyms]);

  // Initialize preferred gym from user data
  useEffect(() => {
    if (currentUser?.preferred_gym_id && gyms && !selectedGym && !isResuming) {
      const preferredGym = gyms.find(gym => gym.id === currentUser.preferred_gym_id);
      if (preferredGym) {
        setSelectedGym(preferredGym);
      }
    }
  }, [currentUser, gyms, selectedGym, isResuming]);
  
  // Helper functions
  const prepareExercisesFromTemplate = (template: any) => {
    return template.exercises.map((exercise: any) => ({
      ...exercise,
      effort_type: exercise.effort_type || 'reps', // Ensure effort_type is set
      weight_unit: exercise.weight_unit || 'kg', // Ensure weight_unit is set
      sets: exercise.sets.map((set: any, index: number) => ({
        ...set,
        id: `set-${Date.now()}-${index}`,
        completed: false,
        rest_time_completed: false,
        weight_unit: set.weight_unit || exercise.weight_unit || 'kg',
        // Set actual values based on effort type
        ...(exercise.effort_type === 'time' ? {
          actual_duration: set.duration,
          actual_weight: set.weight || null,
          actual_reps: null,
          actual_distance: null
        } : exercise.effort_type === 'distance' ? {
          actual_distance: set.distance,
          actual_duration: set.duration || null,
          actual_weight: null,
          actual_reps: null
        } : {
          actual_reps: set.reps,
          actual_weight: set.weight,
          actual_duration: null,
          actual_distance: null
        })
      }))
    }));
  };
  
  const prepareExercisesFromProgramWorkout = (workout: any) => {
    return workout.exercises.map((exercise: any) => ({
      ...exercise,
      effort_type: exercise.effort_type || 'reps', // Ensure effort_type is set
      weight_unit: exercise.weight_unit || 'kg', // Ensure weight_unit is set
      sets: exercise.sets.map((set: any, index: number) => ({
        ...set,
        id: `set-${Date.now()}-${index}`,
        completed: false,
        rest_time_completed: false,
        weight_unit: set.weight_unit || exercise.weight_unit || 'kg',
        // Set actual values based on effort type
        ...(exercise.effort_type === 'time' ? {
          actual_duration: set.duration,
          actual_weight: set.weight || null,
          actual_reps: null,
          actual_distance: null
        } : exercise.effort_type === 'distance' ? {
          actual_distance: set.distance,
          actual_duration: set.duration || null,
          actual_weight: null,
          actual_reps: null
        } : {
          actual_reps: set.reps,
          actual_weight: set.weight,
          actual_duration: null,
          actual_distance: null
        })
      }))
    }));
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getExerciseCompletionStatus = (exercise: any) => {
    if (!exercise || !exercise.sets) return { completed: 0, total: 0, percentage: 0 };
    
    const total = exercise.sets.length;
    const completed = exercise.sets.filter((set: any) => set.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  // Helper functions for post creation (from WorkoutHandlers)
  const getMoodOptions = () => [
    { value: 1, label: 'terrible', icon: 'sad-outline', color: '#ef4444' },
    { value: 2, label: 'bad', icon: 'thumbs-down-outline', color: '#f97316' },
    { value: 3, label: 'okay', icon: 'remove-outline', color: '#eab308' },
    { value: 4, label: 'good', icon: 'thumbs-up-outline', color: '#22c55e' },
    { value: 5, label: 'great', icon: 'happy-outline', color: '#10b981' }
  ];

  const calculateCompletionPercentage = () => {
    const exercises = activeWorkout?.exercises || [];
    if (exercises.length === 0) return 0;
    
    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = exercises.reduce((acc, ex) => 
      acc + ex.sets.filter((set: any) => set.completed).length, 0
    );
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  const createWorkoutPost = async (workoutLogId: number, additionalData: any) => {
    console.log(workoutLogId, additionalData);
    try {
      if (!additionalData.will_share_to_social) {
        console.log('Not sharing to social media');
        return;
      }

      const exercises = activeWorkout?.exercises || [];
      const workoutDuration = activeWorkout?.duration || 0;

      const formData = new FormData();
      
      const workoutStats = {
        name: activeWorkout?.name || workoutName,
        duration: Math.floor(workoutDuration / 60),
        exercises_count: exercises.length,
        sets_completed: exercises.reduce((acc, ex) => 
          acc + ex.sets.filter((set: any) => set.completed).length, 0
        ),
        completion_percentage: calculateCompletionPercentage(),
        mood: getMoodOptions().find(m => m.value === additionalData.mood_rating)?.label || 'good',
        difficulty: additionalData.difficulty_level,
        gym_name: selectedGym?.name || null,
        gym_location: selectedGym?.location || null
      };

      let postContent = additionalData.post_content || 
        `Just finished "${workoutStats.name}"! 💪\n\n` +
        `⏱️ ${workoutStats.duration} minutes\n` +
        `✅ ${workoutStats.sets_completed} sets completed\n` +
        `🏋️ ${workoutStats.exercises_count} exercises\n` +
        `📊 ${workoutStats.completion_percentage}% complete\n`;

      if (selectedGym) {
        postContent += `🏢 ${selectedGym.name} - ${selectedGym.location}\n`;
      }

      postContent += `\n#fitness #workout #training`;

      formData.append('content', postContent);
      formData.append('post_type', 'workout_log');
      formData.append('workout_log_id', workoutLogId.toString());
      formData.append('workout_stats', JSON.stringify(workoutStats));
      
      const allTags = [
        ...additionalData.tags || [],
        'fitness', 'workout'
      ];
      formData.append('tags', JSON.stringify(allTags));

      await createPost(formData);
      console.log('Workout post created successfully');
    } catch (error) {
      console.error('Error creating workout post:', error);
      Alert.alert(
        t('warning'),
        t('workout_saved_but_post_failed') || 'Workout saved successfully, but failed to share to social media.',
        [{ text: t('ok') }]
      );
    }
  };
  
  // HANDLERS
  
  const handleBackPress = () => {
    if (activeWorkout?.started) {
      Alert.alert(
        t('exit_workout'),
        t('workout_will_continue_in_background'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('continue_later'),
            onPress: () => router.back()
          },
          {
            text: t('end_workout'),
            style: 'destructive',
            onPress: () => endWorkout(true)
          }
        ]
      );
      return true;
    }
    
    router.back();
    return true;
  };
  
  // Updated to include gym selection validation and template handling
  const handleStartWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert(t('error'), t('please_enter_workout_name'));
      return;
    }
    
    let initialExercises: any[] = [];
    
    // Priority: selected template > URL template > program workout
    if (selectedTemplate) {
      initialExercises = prepareExercisesFromTemplate(selectedTemplate);
    } else if (sourceType === 'template' && template) {
      initialExercises = prepareExercisesFromTemplate(template);
    } else if (sourceType === 'program' && programWorkout) {
      initialExercises = prepareExercisesFromProgramWorkout(programWorkout);
    }
    
    await startWorkout({
      name: workoutName,
      exercises: initialExercises,
      sourceType: selectedTemplate ? 'template' : sourceType,
      templateId: selectedTemplate ? selectedTemplate.id : templateId,
      programId,
      workoutId,
      currentExerciseIndex: 0,
      gym_id: selectedGym?.id || null
    });
    
    if (initialExercises.length === 0) {
      setSelectingExercise(true);
    }
  };

  // Template selection handlers
  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setWorkoutName(template.name); // Auto-fill workout name
    setTemplateModalVisible(false);
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setWorkoutName(''); // Clear workout name
  };

  const handleOpenTemplateModal = () => {
    setTemplateModalVisible(true);
  };

  const handleCloseTemplateModal = () => {
    setTemplateModalVisible(false);
  };

  // Gym selection handlers
  const handleSelectGym = (gym: Gym | null) => {
    setSelectedGym(gym);
  };

  const handleOpenGymModal = () => {
    setGymModalVisible(true);
  };

  const handleCloseGymModal = () => {
    setGymModalVisible(false);
  };
  
  // Updated handleAddExercise function to support effort types
  const handleAddExercise = async (exercise: any) => {
    if (!activeWorkout) return;
    
    const effortType = exercise.effort_type || 'reps';
    const weightUnit = exercise.weight_unit || 'kg';
    
    const newExercise = {
      ...exercise,
      id: exercise.id || `temp-${Date.now()}`,
      effort_type: effortType,
      weight_unit: weightUnit,
      sets: exercise.sets || [createDefaultSet(effortType, 0, null, weightUnit)]
    };
    
    const updatedExercises = [...activeWorkout.exercises, newExercise];
    await updateWorkout({ 
      exercises: updatedExercises,
      currentExerciseIndex: activeWorkout.exercises.length
    });
    setSelectingExercise(false);
  };
  
  const handleCompleteSet = async (exerciseIndex: number, setIndex: number, setData: any) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const exercise = {...updatedExercises[exerciseIndex]};
    const sets = [...exercise.sets];
    sets[setIndex] = {
      ...sets[setIndex],
      ...setData,
      completed: true
    };
    exercise.sets = sets;
    updatedExercises[exerciseIndex] = exercise;
    
    await updateWorkout({ exercises: updatedExercises });
  };

  const handleUncompleteSet = async (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const exercise = {...updatedExercises[exerciseIndex]};
    const sets = [...exercise.sets];
    sets[setIndex] = {
      ...sets[setIndex],
      completed: false
    };
    exercise.sets = sets;
    updatedExercises[exerciseIndex] = exercise;
    
    await updateWorkout({ exercises: updatedExercises });
  };
  
  const handleUpdateSet = async (exerciseIndex: number, setIndex: number, setData: any) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const exercise = {...updatedExercises[exerciseIndex]};
    const sets = [...exercise.sets];
    sets[setIndex] = { ...sets[setIndex], ...setData };
    exercise.sets = sets;
    updatedExercises[exerciseIndex] = exercise;
    
    await updateWorkout({ exercises: updatedExercises });
  };

  // NEW: Handle exercise updates (name, effort_type, weight_unit)
  const handleUpdateExercise = async (exerciseIndex: number, exerciseData: any) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const currentExercise = updatedExercises[exerciseIndex];
    
    // If effort type changed, we might need to update sets structure
    if (exerciseData.effort_type && exerciseData.effort_type !== currentExercise.effort_type) {
      // Convert existing sets to new effort type format
      const convertedSets = currentExercise.sets.map((set: any) => {
        const baseSet = {
          ...set,
          weight_unit: exerciseData.weight_unit || currentExercise.weight_unit || 'kg'
        };

        // Reset actual values when changing effort type
        switch (exerciseData.effort_type) {
          case 'time':
            return {
              ...baseSet,
              duration: set.duration || 30,
              actual_duration: set.actual_duration || set.duration || 30,
              weight: set.weight || null,
              actual_weight: set.actual_weight || set.weight || null,
              reps: null,
              actual_reps: null,
              distance: null,
              actual_distance: null
            };
          case 'distance':
            return {
              ...baseSet,
              distance: set.distance || 100,
              actual_distance: set.actual_distance || set.distance || 100,
              duration: set.duration || null,
              actual_duration: set.actual_duration || set.duration || null,
              weight: null,
              actual_weight: null,
              reps: null,
              actual_reps: null
            };
          case 'reps':
          default:
            return {
              ...baseSet,
              reps: set.reps || 10,
              actual_reps: set.actual_reps || set.reps || 10,
              weight: set.weight || 0,
              actual_weight: set.actual_weight || set.weight || 0,
              duration: null,
              actual_duration: null,
              distance: null,
              actual_distance: null
            };
        }
      });

      updatedExercises[exerciseIndex] = {
        ...currentExercise,
        ...exerciseData,
        sets: convertedSets
      };
    } else {
      // Simple update without effort type change
      updatedExercises[exerciseIndex] = {
        ...currentExercise,
        ...exerciseData
      };
    }
    
    await updateWorkout({ exercises: updatedExercises });
  };

  // Updated handleAddSet to support effort types
  const handleAddSet = async (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const exercise = activeWorkout.exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    console.log(lastSet)
    const effortType = exercise.effort_type || 'reps';
    const weightUnit = lastSet.weight_unit || 'kg';
    
    const newSet = createDefaultSet(effortType, exercise.sets.length, lastSet, weightUnit);
    console.log(newSet)
    // Copy actual values from last set for better UX
    switch (effortType) {
      case 'time':
        newSet.actual_duration = lastSet.actual_duration || lastSet.duration;
        if (lastSet.weight !== null || lastSet.actual_weight !== null) {
          newSet.actual_weight = lastSet.actual_weight || lastSet.weight;
          newSet.weight = lastSet.actual_weight || lastSet.weight;
        }
        break;
      case 'distance':
        newSet.actual_distance = lastSet.actual_distance || lastSet.distance;
        if (lastSet.duration !== null || lastSet.actual_duration !== null) {
          newSet.actual_duration = lastSet.actual_duration || lastSet.duration;
          newSet.duration = lastSet.actual_duration || lastSet.duration;
        }
        break;
      case 'reps':
      default:
        newSet.actual_reps = lastSet.actual_reps || lastSet.reps;
        newSet.actual_weight = lastSet.actual_weight || lastSet.weight;
        newSet.reps = lastSet.actual_reps || lastSet.reps;
        newSet.weight = lastSet.actual_weight || lastSet.weight;
        break;
    }
    
    // Copy rest time
    newSet.rest_time = lastSet.rest_time;
    
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: [...exercise.sets, newSet]
    };
    
    await updateWorkout({ exercises: updatedExercises });
  };

  const handleRemoveSet = async (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const exercise = activeWorkout.exercises[exerciseIndex];
    
    if (exercise.sets.length <= 1) {
      Alert.alert(t('error'), t('cannot_remove_only_set'));
      return;
    }
    
    const updatedSets = exercise.sets.filter((_, idx) => idx !== setIndex);
    updatedSets.forEach((set, idx) => {
      set.order = idx;
    });
    
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };
    
    await updateWorkout({ exercises: updatedExercises });
  };

  const handleDeleteExercise = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const exercise = activeWorkout.exercises[exerciseIndex];
    const hasCompletedSets = exercise.sets.some((set: any) => set.completed);
    
    if (hasCompletedSets) {
      Alert.alert(
        t('cannot_delete_exercise'),
        t('exercise_has_completed_sets'),
        [{ text: t('ok'), style: 'default' }]
      );
      return;
    }
    
    Alert.alert(
      t('delete_exercise'),
      t('delete_exercise_confirmation', { name: exercise.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'),
          style: 'destructive',
          onPress: () => confirmDeleteExercise(exerciseIndex)
        }
      ]
    );
  };

  const confirmDeleteExercise = async (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises.splice(exerciseIndex, 1);
    
    let newCurrentIndex = activeWorkout.currentExerciseIndex;
    if (newCurrentIndex >= exerciseIndex && newCurrentIndex > 0) {
      newCurrentIndex = newCurrentIndex - 1;
    } else if (updatedExercises.length === 0) {
      newCurrentIndex = 0;
    } else if (newCurrentIndex >= updatedExercises.length) {
      newCurrentIndex = updatedExercises.length - 1;
    }
    
    await updateWorkout({ 
      exercises: updatedExercises,
      currentExerciseIndex: newCurrentIndex
    });
  };
  
  const handleNavigateToExercise = async (index: number) => {
    await updateWorkout({ currentExerciseIndex: index });
  };
  
  const handleCompleteWorkout = () => setCompleteModalVisible(true);
  
  // ENHANCED - Updated handleSubmitWorkout to handle new fields
  const handleSubmitWorkout = async (additionalData: any = {}) => {
    if (!activeWorkout) return;
    
    try {
      const formattedExercises = activeWorkout.exercises.map((exercise, index) => ({
        name: exercise.name,
        equipment: exercise.equipment || '',
        notes: exercise.notes || '',
        order: index,
        effort_type: exercise.effort_type || 'reps',
        superset_with: exercise.superset_with || null,
        is_superset: !!exercise.is_superset,
        sets: exercise.sets.map((set: any, idx: number) => {
          const baseSet = {
            rest_time: set.rest_time,
            order: idx,
            weight_unit: set.weight_unit || 'kg'
          };

          // Add fields based on effort type
          switch (exercise.effort_type) {
            case 'time':
              return {
                ...baseSet,
                duration: set.actual_duration || set.duration,
                weight: (set.actual_weight !== null && set.actual_weight !== undefined) ? set.actual_weight : set.weight,
                reps: null,
                distance: null
              };
            case 'distance':
              return {
                ...baseSet,
                distance: set.actual_distance || set.distance,
                duration: (set.actual_duration !== null && set.actual_duration !== undefined) ? set.actual_duration : set.duration,
                weight: null,
                reps: null
              };
            case 'reps':
            default:
              return {
                ...baseSet,
                reps: set.actual_reps || set.reps,
                weight: (set.actual_weight !== null && set.actual_weight !== undefined) ? set.actual_weight : set.weight,
                duration: null,
                distance: null
              };
          }
        })
      }));
      
      const workoutData = {
        date: new Date().toISOString().split('T')[0],
        name: activeWorkout.name,
        description: '',
        notes: additionalData.notes || '',
        duration_minutes: Math.round(activeWorkout.duration / 60),
        mood_rating: additionalData.mood_rating || 3,
        difficulty_level: additionalData.difficulty_level || 'moderate',
        completed: true,
        exercises: formattedExercises,
        template_id: activeWorkout.templateId,
        program_id: activeWorkout.programId,
        program_workout_id: activeWorkout.workoutId,
        gym: selectedGym?.id,
        tags: additionalData.tags || [],
        source_type: activeWorkout.sourceType === 'custom' ? 'none' : activeWorkout.sourceType
      };
      
      console.log('Submitting workout with exercises:', formattedExercises.length);
      console.log('Gym information:', selectedGym);
      console.log('Sample exercise:', formattedExercises[0]);
      
      // First, create the workout log
      const result = await createLog(workoutData);
      console.log('Workout log created successfully:', result);
      
      // Then create the post if sharing is enabled
      await createWorkoutPost(result.id, additionalData);
      
      // End workout (clears context)
      await endWorkout(true);
      
      // Close modal and show success
      setCompleteModalVisible(false);
      Alert.alert(
        t('success'), 
        t('workout_logged_successfully'),
        [{ text: t('ok'), onPress: () => router.replace('/(app)/feed') }]
      );
      
      return { success: true, workoutId: result?.id, workout: result };
    } catch (error) {
      console.error('Error saving workout log:', error);
      Alert.alert(t('error'), t('error_saving_workout_log'));
      throw error;
    }
  };
  
  const handleCancelCompleteWorkout = () => setCompleteModalVisible(false);
  const startRestTimer = (seconds: number) => {
    setRestTimeSeconds(seconds);
    setRestTimerActive(true);
  };
  const stopRestTimer = () => setRestTimerActive(false);
  
  // Calculate stats from active workout
  const exercises = activeWorkout?.exercises || [];
  const currentExerciseIndex = activeWorkout?.currentExerciseIndex || 0;
  const workoutDuration = activeWorkout?.duration || 0;
  const workoutStarted = activeWorkout?.started || false;
  const workoutTimerActive = activeWorkout?.isTimerActive || false;
  
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((set: any) => set.completed).length;
  }, 0);
  const completionPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const hasIncompleteExercises = exercises.some(ex => 
    ex.sets.some((set: any) => !set.completed)
  );
  
  // Complete handlers object
  const handlers = {
    handleBackPress,
    handleStartWorkout,
    handleAddExercise,
    handleCompleteSet,
    handleUncompleteSet,
    handleUpdateSet,
    handleUpdateExercise, // NEW HANDLER
    handleAddSet,
    handleRemoveSet,
    handleDeleteExercise,
    handleNavigateToExercise,
    handleCompleteWorkout,
    handleSubmitWorkout,
    handleCancelCompleteWorkout,
    toggleWorkoutTimer: toggleTimer,
    startRestTimer,
    stopRestTimer,
    workoutTimerActive,
    // Gym handlers
    handleSelectGym,
    handleOpenGymModal,
    handleCloseGymModal,
    // Template handlers
    handleSelectTemplate,
    handleClearTemplate,
    handleOpenTemplateModal,
    handleCloseTemplateModal
  };
  
  // Set up back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);
  
  // Create rendering
  const { renderStartScreen, renderWorkoutScreen } = createWorkoutRendering({
    styles,
    palette,
    t,
    workoutName,
    setWorkoutName,
    workoutStarted,
    workoutDuration,
    exercises,
    currentExerciseIndex,
    selectingExercise,
    setSelectingExercise,
    restTimerActive,
    restTimeSeconds,
    completeModalVisible,
    exerciseFlatListRef,
    exerciseScrollViewRef,
    handlers,
    formatTime,
    getExerciseCompletionStatus,
    completionPercentage,
    completedSets,
    totalSets,
    hasIncompleteExercises,
    // Gym related props
    selectedGym,
    gymModalVisible,
    // Template related props
    selectedTemplate,
    templateModalVisible,
    templates,
    templatesLoading
  });
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={palette.accent} />
      <View style={styles.container}>
        {workoutStarted ? renderWorkoutScreen() : renderStartScreen()}
        
        {/* Gym Selection Modal */}
        <GymSelectionModal
          visible={gymModalVisible}
          onClose={handleCloseGymModal}
          onSelectGym={handleSelectGym}
          selectedGym={selectedGym}
          themePalette={palette}
        />
        
        {/* Template Selection Modal */}
        <TemplateSelectionModal
          visible={templateModalVisible}
          onClose={handleCloseTemplateModal}
          onTemplateSelected={handleSelectTemplate}
          templates={templates || []}
          templatesLoading={templatesLoading}
          user={currentUser}
        />
      </View>
    </SafeAreaView>
  );
}

// Styles remain the same with additions for template selection
const themedStyles = createThemedStyles((palette) => ({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: palette.page_background,
  },
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  
  // Simplified Start Screen Styles
  startScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.page_background,
  },
  startScreenContent: {
    width: '80%',
    alignItems: 'center',
  },
  inputSection: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Template selection styles
  templateSection: {
    width: '100%',
    marginBottom: 24,
  },
  templateSelector: {
    width: '100%',
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateIcon: {
    marginRight: 12,
  },
  templateSelectorText: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
  },
  templateInfo: {
    fontSize: 14,
    marginTop: 2,
  },
  templateClearButton: {
    padding: 4,
    marginRight: 8,
  },
  
  // Gym selection styles
  gymSection: {
    width: '100%',
    marginBottom: 32,
  },
  gymSelector: {
    width: '100%',
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gymSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gymIcon: {
    marginRight: 12,
  },
  gymSelectorText: {
    flex: 1,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '500',
  },
  gymLocation: {
    fontSize: 14,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonIcon: {
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Rest of styles...
  modalContainer: {
    flex: 1,
    backgroundColor: palette.page_background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 3,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  timerIcon: {
    marginRight: 6,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completeWorkoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 28,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.card_background,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    opacity: 0.7,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    zIndex: 1,
  },
  exerciseListContainer: {
    backgroundColor: palette.card_background,
    paddingVertical: 14,
  },
  exerciseListContent: {
    paddingHorizontal: 12,
  },
  exerciseCard: {
    width: 110,
    height: 90,
    marginRight: 10,
    padding: 10,
    backgroundColor: palette.input_background,
    borderRadius: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeExerciseCard: {
    backgroundColor: palette.accent,
    borderWidth: 2,
    borderColor: palette.highlight,
  },
  deleteExerciseButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeExerciseNumberBadge: {
    backgroundColor: '#FFFFFF',
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeExerciseNumberText: {
    color: palette.accent,
  },
  partialCompleteText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  exerciseCardName: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.text_secondary,
    flex: 1,
  },
  activeExerciseCardName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  exerciseProgressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 6,
  },
  exerciseProgress: {
    height: '100%',
    borderRadius: 2,
  },
  addExerciseCard: {
    width: 80,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addExerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addExerciseText: {
    fontSize: 12,
    fontWeight: '500',
  },
  workoutContent: {
    flex: 1,
  },
  exerciseArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    backgroundColor: palette.card_background,
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  addExerciseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 80,
  }
}));