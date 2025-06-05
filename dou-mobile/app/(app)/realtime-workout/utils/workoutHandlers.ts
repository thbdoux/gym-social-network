// Updated handlers for index.tsx to support effort_type and new fields

// Helper function to create default set based on effort type
const createDefaultSet = (effortType: string = 'reps', order: number = 0, templateSet?: any) => {
  const baseSet = {
    id: `set-${Date.now()}-${order}`,
    rest_time: templateSet?.rest_time || 60,
    order,
    completed: false,
    rest_time_completed: false,
    weight_unit: templateSet?.weight_unit || 'kg'
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

// Updated handleAddExercise function
const handleAddExercise = async (exercise: any) => {
  if (!activeWorkout) return;
  
  const effortType = exercise.effort_type || 'reps';
  
  const newExercise = {
    ...exercise,
    id: exercise.id || `temp-${Date.now()}`,
    effort_type: effortType,
    sets: exercise.sets || [createDefaultSet(effortType, 0)]
  };
  
  const updatedExercises = [...activeWorkout.exercises, newExercise];
  await updateWorkout({ 
    exercises: updatedExercises,
    currentExerciseIndex: activeWorkout.exercises.length
  });
  setSelectingExercise(false);
};

// Updated handleAddSet function
const handleAddSet = async (exerciseIndex: number) => {
  if (!activeWorkout) return;
  const exercise = activeWorkout.exercises[exerciseIndex];
  const lastSet = exercise.sets[exercise.sets.length - 1];
  const effortType = exercise.effort_type || 'reps';
  
  const newSet = createDefaultSet(effortType, exercise.sets.length, lastSet);
  
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
  
  // Copy weight unit and rest time
  newSet.weight_unit = lastSet.weight_unit || 'kg';
  newSet.rest_time = lastSet.rest_time;
  
  const updatedExercises = [...activeWorkout.exercises];
  updatedExercises[exerciseIndex] = {
    ...exercise,
    sets: [...exercise.sets, newSet]
  };
  
  await updateWorkout({ exercises: updatedExercises });
};

// Updated prepareExercisesFromTemplate function
const prepareExercisesFromTemplate = (template: any) => {
  return template.exercises.map((exercise: any) => ({
    ...exercise,
    effort_type: exercise.effort_type || 'reps', // Ensure effort_type is set
    sets: exercise.sets.map((set: any, index: number) => ({
      ...set,
      id: `set-${Date.now()}-${index}`,
      completed: false,
      rest_time_completed: false,
      weight_unit: set.weight_unit || 'kg',
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

// Updated prepareExercisesFromProgramWorkout function
const prepareExercisesFromProgramWorkout = (workout: any) => {
  return workout.exercises.map((exercise: any) => ({
    ...exercise,
    effort_type: exercise.effort_type || 'reps', // Ensure effort_type is set
    sets: exercise.sets.map((set: any, index: number) => ({
      ...set,
      id: `set-${Date.now()}-${index}`,
      completed: false,
      rest_time_completed: false,
      weight_unit: set.weight_unit || 'kg',
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

// Updated handleSubmitWorkout function to handle new fields
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

// Helper function to get exercise display value (enhanced from logService)
const getExerciseDisplayValue = (exercise: any, setIndex: number = 0): string => {
  const set = exercise.sets[setIndex];
  if (!set) return 'No data';

  const effortType = exercise.effort_type || 'reps';

  switch (effortType) {
    case 'time':
      const duration = set.actual_duration !== undefined ? set.actual_duration : set.duration;
      if (duration) {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        
        const weight = set.actual_weight !== undefined ? set.actual_weight : set.weight;
        return weight && weight > 0 
          ? `${timeStr} @ ${weight}${set.weight_unit || 'kg'}`
          : timeStr;
      }
      return 'Time not set';
    
    case 'distance':
      const distance = set.actual_distance !== undefined ? set.actual_distance : set.distance;
      if (distance) {
        const distanceStr = distance >= 1000 ? `${(distance/1000).toFixed(1)}km` : `${distance}m`;
        const timeTaken = set.actual_duration !== undefined ? set.actual_duration : set.duration;
        return timeTaken 
          ? `${distanceStr} in ${Math.floor(timeTaken / 60)}:${String(timeTaken % 60).padStart(2, '0')}`
          : distanceStr;
      }
      return 'Distance not set';
    
    case 'reps':
    default:
      const reps = set.actual_reps !== undefined ? set.actual_reps : set.reps;
      if (reps) {
        const weight = set.actual_weight !== undefined ? set.actual_weight : set.weight;
        return weight && weight > 0 
          ? `${reps} reps @ ${weight}${set.weight_unit || 'kg'}`
          : `${reps} reps`;
      }
      return 'Reps not set';
  }
};

export {
  createDefaultSet,
  handleAddExercise,
  handleAddSet,
  prepareExercisesFromTemplate,
  prepareExercisesFromProgramWorkout,
  handleSubmitWorkout,
  getExerciseDisplayValue
};