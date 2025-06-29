// hooks/useWorkoutHandlers.ts - Centralized workout event handlers
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '../../../../context/LanguageContext';
import { useCreateLog } from '../../../../hooks/query/useLogQuery';
import { useCreatePost } from '../../../../hooks/query/usePostQuery';
import { createDefaultSet, prepareExercisesFromTemplate, prepareExercisesFromProgramWorkout, generateUniqueId } from '../utils/workoutUtils';

export const useWorkoutHandlers = (workoutManager: any) => {
  const { t } = useLanguage();
  const { mutateAsync: createLog } = useCreateLog();
  const { mutateAsync: createPost } = useCreatePost();

  const {
    workoutName,
    setWorkoutName,
    selectedGym,
    setSelectedGym,
    selectedTemplate,
    setSelectedTemplate,
    setSelectingExercise,
    setCompleteModalVisible,
    setGymModalVisible,
    setTemplateModalVisible,
    activeWorkout,
    startWorkout,
    updateWorkout,
    endWorkout,
    toggleTimer,
    addExercise,
    updateExercise,
    deleteExercise,
    template,
    programWorkout,
    config
  } = workoutManager;

  // Helper function to transform exercises for API submission
  const transformExercisesForSubmission = (exercises: any[]): any[] => {
    return exercises.map((exercise: any, index: number) => {
      const transformedExercise = {
        name: exercise.name,
        equipment: exercise.equipment || '',
        notes: exercise.notes || '',
        order: index,
        effort_type: exercise.effort_type || 'reps',
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
      };

      // Handle superset transformation
      if (exercise.superset_group) {
        // Find all exercises in the same superset group
        const supersetExercises = exercises
          .map((ex, idx) => ({ exercise: ex, index: idx }))
          .filter(({ exercise: ex }) => ex.superset_group === exercise.superset_group);

        // Find the paired exercise (the other one in the superset)
        const pairedExerciseData = supersetExercises.find(
          ({ exercise: ex, index: idx }) => idx !== index
        );

        if (pairedExerciseData) {
          transformedExercise.is_superset = true;
          transformedExercise.superset_with = pairedExerciseData.index;
          transformedExercise.superset_paired_exercise = {
            id: pairedExerciseData.exercise.id,
            name: pairedExerciseData.exercise.name,
            order: pairedExerciseData.index
          };
        } else {
          // Fallback if paired exercise not found
          transformedExercise.is_superset = exercise.is_superset || false;
          transformedExercise.superset_with = null;
          transformedExercise.superset_paired_exercise = null;
        }
      } else {
        // Not a superset exercise
        transformedExercise.is_superset = false;
        transformedExercise.superset_with = null;
        transformedExercise.superset_paired_exercise = null;
      }

      return transformedExercise;
    });
  };

  // Workout lifecycle handlers
  const handleStartWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert(t('error'), t('please_enter_workout_name'));
      return;
    }
    
    let initialExercises: any[] = [];
    
    // Priority: selected template > URL template > program workout
    if (selectedTemplate) {
      initialExercises = prepareExercisesFromTemplate(selectedTemplate);
    } else if (config.sourceType === 'template' && template) {
      initialExercises = prepareExercisesFromTemplate(template);
    } else if (config.sourceType === 'program' && programWorkout) {
      initialExercises = prepareExercisesFromProgramWorkout(programWorkout);
    }
    
    await startWorkout({
      name: workoutName,
      exercises: initialExercises,
      sourceType: selectedTemplate ? 'template' : config.sourceType,
      templateId: selectedTemplate ? selectedTemplate.id : config.templateId,
      programId: config.programId,
      workoutId: config.workoutId,
      currentExerciseIndex: 0,
      gym_id: selectedGym?.id || null
    });
    
    if (initialExercises.length === 0) {
      setSelectingExercise(true);
    }
  };

  const handleCompleteWorkout = () => {
    setCompleteModalVisible(true);
  };

  const handleSubmitWorkout = async (additionalData: any = {}) => {
    if (!activeWorkout) return;
    
    try {
      // Transform exercises from internal format to API format
      const formattedExercises = transformExercisesForSubmission(activeWorkout.exercises);
      
      const workoutData = {
        date: new Date().toISOString().split('T')[0],
        name: activeWorkout.name,
        description: '',
        notes: additionalData.notes || '',
        duration: Math.round(activeWorkout.duration / 60),
        mood_rating: additionalData.mood_rating || 3,
        perceived_difficulty: additionalData.difficulty_level || 2,
        completed: true,
        exercises: formattedExercises,
        template_id: activeWorkout.templateId,
        program_id: activeWorkout.programId,
        program_workout_id: activeWorkout.workoutId,
        gym: selectedGym?.id,
        tags: additionalData.tags || [],
        source_type: activeWorkout.sourceType === 'custom' ? 'none' : activeWorkout.sourceType
      };
      
      // Create the workout log
      const result = await createLog(workoutData);
      console.log("API RESULT : ", result);
      // Create post if sharing is enabled
      if (additionalData.will_share_to_social) {
        await createWorkoutPost(result.id, additionalData);
      }
      
      // End workout
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

  const handleCancelCompleteWorkout = () => {
    setCompleteModalVisible(false);
  };

  // Template handlers
  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setWorkoutName(template.name);
    setTemplateModalVisible(false);
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setWorkoutName('');
  };

  const handleOpenTemplateModal = () => {
    setTemplateModalVisible(true);
  };

  const handleCloseTemplateModal = () => {
    setTemplateModalVisible(false);
  };

  // Gym handlers
  const handleSelectGym = (gym: any) => {
    setSelectedGym(gym);
    setGymModalVisible(false);
  };

  const handleOpenGymModal = () => {
    setGymModalVisible(true);
  };

  const handleCloseGymModal = () => {
    setGymModalVisible(false);
  };

  // Exercise handlers
  const handleAddExercise = async (exercise: any) => {
    await addExercise(exercise);
  };

  const handleUpdateExercise = async (exerciseIndex: number, exerciseData: any) => {
    await updateExercise(exerciseIndex, exerciseData);
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
      t('delete'),
      t('delete_exercise_confirmation', { name: exercise.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteExercise(exerciseIndex)
        }
      ]
    );
  };

  const handleNavigateToExercise = async (index: number) => {
    await updateWorkout({ currentExerciseIndex: index });
  };

  // Enhanced superset handlers
  const handleCreateSuperset = async (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const exercise = activeWorkout.exercises[exerciseIndex];
    
    // Check if exercise is already in a superset
    if (exercise.superset_group) {
      Alert.alert(
        t('already_in_superset'),
        t('exercise_already_in_superset'),
        [{ text: t('ok') }]
      );
      return;
    }
    
    // Get available exercises for superset linking (exclude current and already in superset)
    const availableExercises = activeWorkout.exercises
      .map((ex: any, idx: number) => ({ ...ex, originalIndex: idx }))
      .filter((ex: any, idx: number) => idx !== exerciseIndex && !ex.superset_group);

    if (availableExercises.length === 0) {
      // No available exercises, go straight to exercise selector
      const supersetGroupId = generateUniqueId();
      
      // Update current exercise to be part of superset
      const updatedExercises = [...activeWorkout.exercises];
      updatedExercises[exerciseIndex] = {
        ...exercise,
        superset_group: supersetGroupId,
        is_superset: true,
        superset_rest_time: 90
      };
      
      await updateWorkout({ exercises: updatedExercises });
      
      // Set pending superset for when new exercise is selected
      workoutManager.setPendingSuperset({
        groupId: supersetGroupId,
        exerciseIndex: exerciseIndex
      });
      
      // Open exercise selector
      setSelectingExercise(true);
    } else {
      // Show superset options - this will be handled by the UI showing the SupersetLinkModal
      // The modal will either call handleLinkWithExisting or handleLinkWithNew
      return { availableExercises, exerciseIndex };
    }
  };

  // Handle linking current exercise with an existing exercise
  const handleLinkWithExisting = async (sourceExerciseIndex: number, targetExercise: any, targetIndex: number) => {
    if (!activeWorkout) return;
    
    const sourceExercise = activeWorkout.exercises[sourceExerciseIndex];
    
    // Check if either exercise is already in a superset
    if (sourceExercise.superset_group || targetExercise.superset_group) {
      Alert.alert(t('error'), t('exercises_already_in_superset'));
      return;
    }

    // Generate superset group ID
    const supersetGroupId = generateUniqueId();
    
    // Update both exercises
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[sourceExerciseIndex] = {
      ...sourceExercise,
      superset_group: supersetGroupId,
      is_superset: true,
      superset_rest_time: 90,
      superset_with: targetExercise.id
    };
    
    updatedExercises[targetIndex] = {
      ...targetExercise,
      superset_group: supersetGroupId,
      is_superset: true,
      superset_rest_time: 90,
      superset_with: sourceExercise.id
    };
    
    await updateWorkout({ exercises: updatedExercises });
  };

  // Handle linking current exercise with a new exercise (opens exercise selector)
  const handleLinkWithNew = async (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const exercise = activeWorkout.exercises[exerciseIndex];
    
    // Check if exercise is already in a superset
    if (exercise.superset_group) {
      Alert.alert(
        t('already_in_superset'),
        t('exercise_already_in_superset'),
        [{ text: t('ok') }]
      );
      return;
    }
    
    // Generate superset group ID
    const supersetGroupId = generateUniqueId();
    
    // Update current exercise to be part of superset
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      superset_group: supersetGroupId,
      is_superset: true,
      superset_rest_time: 90
    };
    
    await updateWorkout({ exercises: updatedExercises });
    
    // Set pending superset for when new exercise is selected
    workoutManager.setPendingSuperset({
      groupId: supersetGroupId,
      exerciseIndex: exerciseIndex
    });
    
    // Open exercise selector
    setSelectingExercise(true);
  };

  const handleRemoveFromSuperset = async (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const exercise = activeWorkout.exercises[exerciseIndex];
    if (!exercise.superset_group) return;
    
    const supersetGroupId = exercise.superset_group;
    
    Alert.alert(
      t('remove_from_superset'),
      t('remove_superset_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            // Get all exercises in this superset
            const supersetExercises = activeWorkout.exercises.filter((ex: any) => 
              ex.superset_group === supersetGroupId
            );
            
            if (supersetExercises.length === 2) {
              // If only 2 exercises, remove superset properties from both
              const updatedExercises = activeWorkout.exercises.map((ex: any) => {
                if (ex.superset_group === supersetGroupId) {
                  const { superset_group, is_superset, superset_rest_time, superset_with, ...exerciseWithoutSuperset } = ex;
                  return exerciseWithoutSuperset;
                }
                return ex;
              });
              
              await updateWorkout({ exercises: updatedExercises });
            } else {
              // More than 2 exercises, just remove this one from superset
              const updatedExercises = [...activeWorkout.exercises];
              const { superset_group, is_superset, superset_rest_time, superset_with, ...exerciseWithoutSuperset } = exercise;
              updatedExercises[exerciseIndex] = exerciseWithoutSuperset;
              
              await updateWorkout({ exercises: updatedExercises });
            }
          }
        }
      ]
    );
  };

  const handleAddExerciseToSuperset = async (exercise: any, supersetInfo: any) => {
    if (!activeWorkout) return;
    
    const effortType = exercise.effort_type || 'reps';
    const weightUnit = exercise.weight_unit || 'kg';
    
    const newExercise = {
      ...exercise,
      id: exercise.id || generateUniqueId(),
      effort_type: effortType,
      weight_unit: weightUnit,
      equipment: exercise.equipment || '',
      superset_group: supersetInfo.groupId,
      is_superset: true,
      superset_rest_time: 90,
      superset_with: activeWorkout.exercises[supersetInfo.exerciseIndex].id,
      sets: exercise.sets || [createDefaultSet(effortType, 0, null, weightUnit)]
    };
    
    // Insert the new exercise right after the superset partner
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises.splice(supersetInfo.exerciseIndex + 1, 0, newExercise);
    
    // Update the original exercise's superset_with field
    updatedExercises[supersetInfo.exerciseIndex] = {
      ...updatedExercises[supersetInfo.exerciseIndex],
      superset_with: newExercise.id
    };
    
    await updateWorkout({ exercises: updatedExercises });
    setSelectingExercise(false);
    
    // Clear pending superset
    workoutManager.setPendingSuperset(null);
  };

  // Set handlers
  const handleCompleteSet = async (exerciseIndex: number, setIndex: number, setData: any) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const exercise = {...updatedExercises[exerciseIndex]};
    const sets = [...exercise.sets];
    const currentSet = sets[setIndex];
    
    sets[setIndex] = {
      ...sets[setIndex],
      ...setData,
      completed: true
    };
    exercise.sets = sets;
    updatedExercises[exerciseIndex] = exercise;
    
    // Combine set completion and rest timer start
    const updates: any = { exercises: updatedExercises };
    
    // For supersets, use superset rest time if it's the last exercise in the superset
    const isSuperset = exercise.superset_group;
    let restTime = currentSet.rest_time;
    
    if (isSuperset) {
      const supersetExercises = activeWorkout.exercises.filter((ex: any) => 
        ex.superset_group === exercise.superset_group
      );
      const currentSupersetIndex = supersetExercises.findIndex((ex: any) => ex.id === exercise.id);
      const isLastInSuperset = currentSupersetIndex === supersetExercises.length - 1;
      
      if (isLastInSuperset) {
        restTime = exercise.superset_rest_time || currentSet.rest_time;
      } else {
        // Move to next exercise in superset immediately
        const nextSupersetExercise = supersetExercises[currentSupersetIndex + 1];
        const nextExerciseIndex = activeWorkout.exercises.findIndex((ex: any) => ex.id === nextSupersetExercise.id);
        updates.currentExerciseIndex = nextExerciseIndex;
        restTime = 0; // No rest between superset exercises
      }
    }
    
    if (restTime > 0) {
      const restTimer = {
        isActive: true,
        totalSeconds: restTime,
        startTime: new Date().toISOString(),
        remainingSeconds: restTime
      };
      updates.restTimer = restTimer;
    }

    await updateWorkout(updates);
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

  const handleAddSet = async (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const exercise = activeWorkout.exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const effortType = exercise.effort_type || 'reps';
    const weightUnit = lastSet.weight_unit || 'kg';
    
    const newSet = createDefaultSet(effortType, exercise.sets.length, lastSet, weightUnit);
    
    // Copy values from last set
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
    
    const updatedSets = exercise.sets.filter((_: any, idx: number) => idx !== setIndex);
    updatedSets.forEach((set: any, idx: number) => {
      set.order = idx;
    });
    
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };
    
    await updateWorkout({ exercises: updatedExercises });
  };

  // Helper function to create workout post
  const createWorkoutPost = async (workoutLogId: number, additionalData: any) => {
    try {
      const exercises = activeWorkout?.exercises || [];
      const workoutDuration = activeWorkout?.duration || 0;

      const formData = new FormData();
      
      let postContent = additionalData.post_content;

      if (selectedGym) {
        postContent += `${t('at')} 🏢 ${selectedGym.name} - ${selectedGym.location}\n`;
      }

      console.log("WORKOUT LOG ID : ", workoutLogId);
      formData.append('content', postContent);
      formData.append('post_type', 'workout_log');
      formData.append('workout_log_id', workoutLogId.toString());

      await createPost(formData);
    } catch (error) {
      console.error('Error creating workout post:', error);
      Alert.alert(
        t('warning'),
        t('workout_saved_but_post_failed') || 'Workout saved successfully, but failed to share to social media.',
        [{ text: t('ok') }]
      );
    }
  };

  // Helper functions
  const calculateCompletionPercentage = () => {
    const exercises = activeWorkout?.exercises || [];
    if (exercises.length === 0) return 0;
    
    const totalSets = exercises.reduce((acc: number, ex: any) => acc + ex.sets.length, 0);
    const completedSets = exercises.reduce((acc: number, ex: any) => 
      acc + ex.sets.filter((set: any) => set.completed).length, 0
    );
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  const getMoodOptions = () => [
    { value: 1, label: 'terrible', icon: 'sad-outline', color: '#ef4444' },
    { value: 2, label: 'bad', icon: 'thumbs-down-outline', color: '#f97316' },
    { value: 3, label: 'okay', icon: 'remove-outline', color: '#eab308' },
    { value: 4, label: 'good', icon: 'thumbs-up-outline', color: '#22c55e' },
    { value: 5, label: 'great', icon: 'happy-outline', color: '#10b981' }
  ];

  return {
    // Workout lifecycle
    handleStartWorkout,
    handleCompleteWorkout,
    handleSubmitWorkout,
    handleCancelCompleteWorkout,
    endWorkout,
    toggleTimer,
    
    // Template management
    handleSelectTemplate,
    handleClearTemplate,
    handleOpenTemplateModal,
    handleCloseTemplateModal,
    
    // Gym management
    handleSelectGym,
    handleOpenGymModal,
    handleCloseGymModal,
    
    // Exercise management
    handleAddExercise,
    handleUpdateExercise,
    handleDeleteExercise,
    handleNavigateToExercise,
    
    // Enhanced superset management
    handleCreateSuperset,
    handleRemoveFromSuperset,
    handleAddExerciseToSuperset,
    handleLinkWithExisting,
    handleLinkWithNew,
    
    // Set management
    handleCompleteSet,
    handleUncompleteSet,
    handleUpdateSet,
    handleAddSet,
    handleRemoveSet,
    
    // UI state
    setSelectingExercise
  };
};