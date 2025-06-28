// hooks/useWorkoutHandlers.ts - Centralized workout event handlers
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '../../../../context/LanguageContext';
import { useCreateLog } from '../../../../hooks/query/useLogQuery';
import { useCreatePost } from '../../../../hooks/query/usePostQuery';
import { createDefaultSet, prepareExercisesFromTemplate, prepareExercisesFromProgramWorkout } from '../utils/workoutUtils';

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
    createSuperset,
    removeFromSuperset,
    addExerciseToSuperset,
    template,
    programWorkout,
    config
  } = workoutManager;

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
      const formattedExercises = activeWorkout.exercises.map((exercise: any, index: number) => ({
        name: exercise.name,
        equipment: exercise.equipment || '',
        notes: exercise.notes || '',
        order: index,
        effort_type: exercise.effort_type || 'reps',
        superset_group: exercise.superset_group || null,
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
      
      // Create the workout log
      const result = await createLog(workoutData);
      
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
    
    if (currentSet.rest_time > 0) {
      const restTimer = {
        isActive: true,
        totalSeconds: currentSet.rest_time,
        startTime: new Date().toISOString(),
        remainingSeconds: currentSet.rest_time
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

  // Superset handlers
  const handleCreateSuperset = async (exerciseIndices: number[]) => {
    await createSuperset(exerciseIndices);
  };

  const handleRemoveFromSuperset = async (exerciseIndex: number) => {
    await removeFromSuperset(exerciseIndex);
  };

  const handleAddToSuperset = async (exerciseIndex: number, targetSupersetGroup: string) => {
    await addExerciseToSuperset(exerciseIndex, targetSupersetGroup);
  };

  // Helper function to create workout post
  const createWorkoutPost = async (workoutLogId: number, additionalData: any) => {
    try {
      const exercises = activeWorkout?.exercises || [];
      const workoutDuration = activeWorkout?.duration || 0;

      const formData = new FormData();
      
      const workoutStats = {
        name: activeWorkout?.name || workoutName,
        duration: Math.floor(workoutDuration / 60),
        exercises_count: exercises.length,
        sets_completed: exercises.reduce((acc: number, ex: any) => 
          acc + ex.sets.filter((set: any) => set.completed).length, 0
        ),
        completion_percentage: calculateCompletionPercentage(),
        mood: getMoodOptions().find((m: any) => m.value === additionalData.mood_rating)?.label || 'good',
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
    
    // Set management
    handleCompleteSet,
    handleUncompleteSet,
    handleUpdateSet,
    handleAddSet,
    handleRemoveSet,
    
    // Superset management
    handleCreateSuperset,
    handleRemoveFromSuperset,
    handleAddToSuperset,
    
    // UI state
    setSelectingExercise
  };
};