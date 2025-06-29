// utils/workoutUtils.ts - Utility functions for workout management

// Generate unique IDs
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create default set based on effort type
export const createDefaultSet = (
  effortType: string = 'reps', 
  order: number = 0, 
  templateSet?: any, 
  weightUnit: string = 'kg'
) => {
  const baseSet = {
    id: generateUniqueId(),
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
        duration: templateSet?.duration || 30,
        actual_duration: templateSet?.duration || 30,
        weight: templateSet?.weight || null,
        actual_weight: templateSet?.weight || null,
        reps: null,
        actual_reps: null,
        distance: null,
        actual_distance: null
      };
    
    case 'distance':
      return {
        ...baseSet,
        distance: templateSet?.distance || 100,
        actual_distance: templateSet?.distance || 100,
        duration: templateSet?.duration || null,
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

// Prepare exercises from template
export const prepareExercisesFromTemplate = (template: any) => {
  return template.exercises.map((exercise: any) => ({
    ...exercise,
    id: exercise.id || generateUniqueId(),
    effort_type: exercise.effort_type || 'reps',
    weight_unit: exercise.weight_unit || 'kg',
    equipment: exercise.equipment || '',
    superset_group: null, // Reset superset grouping
    sets: exercise.sets.map((set: any, index: number) => ({
      ...set,
      id: generateUniqueId(),
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

// Prepare exercises from program workout
export const prepareExercisesFromProgramWorkout = (workout: any) => {
  return workout.exercises.map((exercise: any) => ({
    ...exercise,
    id: exercise.id || generateUniqueId(),
    effort_type: exercise.effort_type || 'reps',
    weight_unit: exercise.weight_unit || 'kg',
    equipment: exercise.equipment || '',
    // Preserve superset grouping from program
    superset_group: exercise.superset_group || null,
    is_superset: exercise.is_superset || false,
    superset_rest_time: exercise.superset_rest_time || null,
    superset_with: exercise.superset_with || null,
    sets: exercise.sets.map((set: any, index: number) => ({
      ...set,
      id: generateUniqueId(),
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

// Format time display
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Get exercise completion status
export const getExerciseCompletionStatus = (exercise: any) => {
  if (!exercise || !exercise.sets) return { completed: 0, total: 0, percentage: 0 };
  
  const total = exercise.sets.length;
  const completed = exercise.sets.filter((set: any) => set.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
};

// Calculate workout statistics
export const calculateWorkoutStats = (exercises: any[]) => {
  if (!exercises || exercises.length === 0) {
    return {
      totalSets: 0,
      completedSets: 0,
      completionPercentage: 0,
      hasIncompleteExercises: false
    };
  }

  const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
  const completedSets = exercises.reduce((acc, ex) => {
    return acc + (ex.sets?.filter((set: any) => set.completed).length || 0);
  }, 0);
  const completionPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const hasIncompleteExercises = exercises.some(ex => 
    ex.sets?.some((set: any) => !set.completed)
  );

  return {
    totalSets,
    completedSets,
    completionPercentage,
    hasIncompleteExercises
  };
};

// Group exercises by superset
export const groupExercisesBySuperset = (exercises: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  const standalone: any[] = [];

  exercises.forEach((exercise, index) => {
    if (exercise.superset_group) {
      if (!grouped[exercise.superset_group]) {
        grouped[exercise.superset_group] = [];
      }
      grouped[exercise.superset_group].push({ ...exercise, originalIndex: index });
    } else {
      standalone.push({ ...exercise, originalIndex: index });
    }
  });

  return { supersets: grouped, standalone };
};

// Get superset label (A, B, C, etc.)
export const getSupersetLabel = (supersetGroups: string[], supersetGroup: string): string => {
  const index = supersetGroups.indexOf(supersetGroup);
  return String.fromCharCode(65 + index); // A, B, C, etc.
};

// Get superset exercises for a given group ID
export const getSupersetExercises = (exercises: any[], supersetGroupId: string) => {
  return exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise }) => exercise.superset_group === supersetGroupId);
};

// Check if exercise is part of a superset
export const isExerciseInSuperset = (exercise: any): boolean => {
  return !!(exercise.superset_group || exercise.is_superset);
};

// Get next exercise in superset sequence
export const getNextExerciseInSuperset = (exercises: any[], currentIndex: number): number | null => {
  const currentExercise = exercises[currentIndex];
  if (!currentExercise?.superset_group) return null;

  const supersetExercises = exercises
    .map((ex, index) => ({ exercise: ex, index }))
    .filter(({ exercise }) => exercise.superset_group === currentExercise.superset_group);

  const currentIndexInSuperset = supersetExercises.findIndex(({ index }) => index === currentIndex);
  const nextIndexInSuperset = (currentIndexInSuperset + 1) % supersetExercises.length;

  return supersetExercises[nextIndexInSuperset].index;
};

// Check if exercise is the last in its superset
export const isLastExerciseInSuperset = (exercises: any[], exerciseIndex: number): boolean => {
  const exercise = exercises[exerciseIndex];
  if (!exercise?.superset_group) return false;

  const supersetExercises = getSupersetExercises(exercises, exercise.superset_group);
  const currentIndexInSuperset = supersetExercises.findIndex(({ index }) => index === exerciseIndex);
  
  return currentIndexInSuperset === supersetExercises.length - 1;
};

// Get superset rest time (used between superset rounds)
export const getSupersetRestTime = (exercise: any): number => {
  return exercise.superset_rest_time || exercise.sets?.[0]?.rest_time || 90;
};

// Create superset group
export const createSupersetGroup = (exercises: any[], exerciseIndices: number[]): any[] => {
  if (exerciseIndices.length < 2) return exercises;

  const supersetGroupId = generateUniqueId();
  const updatedExercises = [...exercises];

  exerciseIndices.forEach((index, i) => {
    if (updatedExercises[index]) {
      updatedExercises[index] = {
        ...updatedExercises[index],
        superset_group: supersetGroupId,
        is_superset: true,
        superset_rest_time: 90, // Default superset rest time
        superset_with: i === 0 ? null : updatedExercises[exerciseIndices[0]].id
      };
    }
  });

  return updatedExercises;
};

// Remove exercises from superset
export const removeSupersetGroup = (exercises: any[], supersetGroupId: string): any[] => {
  return exercises.map(exercise => {
    if (exercise.superset_group === supersetGroupId) {
      const { superset_group, is_superset, superset_rest_time, superset_with, ...exerciseWithoutSuperset } = exercise;
      return exerciseWithoutSuperset;
    }
    return exercise;
  });
};

// Validate exercise data
export const validateExercise = (exercise: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!exercise.name || exercise.name.trim().length === 0) {
    errors.push('Exercise name is required');
  }

  if (!exercise.sets || exercise.sets.length === 0) {
    errors.push('At least one set is required');
  }

  if (exercise.sets) {
    exercise.sets.forEach((set: any, index: number) => {
      const effortType = exercise.effort_type || 'reps';
      
      switch (effortType) {
        case 'reps':
          if (!set.reps && !set.actual_reps) {
            errors.push(`Set ${index + 1}: Reps value is required`);
          }
          break;
        case 'time':
          if (!set.duration && !set.actual_duration) {
            errors.push(`Set ${index + 1}: Duration value is required`);
          }
          break;
        case 'distance':
          if (!set.distance && !set.actual_distance) {
            errors.push(`Set ${index + 1}: Distance value is required`);
          }
          break;
      }

      if (set.rest_time < 0) {
        errors.push(`Set ${index + 1}: Rest time cannot be negative`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Get exercise display value for a specific set
export const getExerciseDisplayValue = (exercise: any, setIndex: number = 0): string => {
  const set = exercise.sets?.[setIndex];
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

// Check if exercise can be deleted
export const canDeleteExercise = (exercise: any): boolean => {
  return !exercise.sets?.some((set: any) => set.completed);
};

// Get superset summary for display
export const getSupersetSummary = (exercises: any[], supersetGroupId: string): string => {
  const supersetExercises = getSupersetExercises(exercises, supersetGroupId);
  const exerciseNames = supersetExercises.map(({ exercise }) => exercise.name);
  
  if (exerciseNames.length === 2) {
    return `${exerciseNames[0]} + ${exerciseNames[1]}`;
  } else if (exerciseNames.length > 2) {
    return `${exerciseNames[0]} + ${exerciseNames.length - 1} others`;
  }
  
  return exerciseNames[0] || 'Superset';
};

// Calculate total volume for superset
export const calculateSupersetVolume = (exercises: any[], supersetGroupId: string): number => {
  const supersetExercises = getSupersetExercises(exercises, supersetGroupId);
  
  return supersetExercises.reduce((total, { exercise }) => {
    if (exercise.effort_type === 'reps') {
      const exerciseVolume = exercise.sets.reduce((setTotal: number, set: any) => {
        const reps = set.actual_reps || set.reps || 0;
        const weight = set.actual_weight || set.weight || 0;
        return setTotal + (reps * weight);
      }, 0);
      return total + exerciseVolume;
    }
    return total;
  }, 0);
};

/**
 * Transform exercises from internal superset format to API format
 * Internal format uses superset_group and stores IDs in superset_with
 * API format uses array indices in superset_with and populates superset_paired_exercise
 */
 export const transformExercisesForSubmission = (exercises: any[]): any[] => {
  return exercises.map((exercise, index) => {
    const transformedExercise = {
      ...exercise,
      order: index, // Ensure order matches array index
    };

    // If this exercise is part of a superset, find its paired exercise
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
        transformedExercise.superset_with = pairedExerciseData.index;
        transformedExercise.superset_paired_exercise = {
          id: pairedExerciseData.exercise.id,
          name: pairedExerciseData.exercise.name,
          order: pairedExerciseData.index
        };
      } else {
        // Fallback if paired exercise not found
        transformedExercise.superset_with = null;
        transformedExercise.superset_paired_exercise = null;
      }

      // Clean up internal superset properties that shouldn't be in API format
      delete transformedExercise.superset_group;
      delete transformedExercise.superset_rest_time;
    } else {
      // Not a superset exercise
      transformedExercise.is_superset = false;
      transformedExercise.superset_with = null;
      transformedExercise.superset_paired_exercise = null;
    }

    return transformedExercise;
  });
};

// Equipment options for selector
export const EQUIPMENT_OPTIONS = [
  { id: 'equipment_barbell', iconName: 'barbell-outline' },
  { id: 'equipment_dumbbell', iconName: 'fitness-outline' },
  { id: 'equipment_dumbbells', iconName: 'fitness-outline' },
  { id: 'equipment_cable', iconName: 'grid-outline' },
  { id: 'equipment_machine', iconName: 'desktop-outline' },
  { id: 'equipment_bodyweight', iconName: 'body-outline' },
  { id: 'equipment_kettlebell', iconName: 'ellipse-outline' },
  { id: 'equipment_kettlebells', iconName: 'ellipse-outline' },
  { id: 'equipment_resistance_band', iconName: 'remove-outline' },
  { id: 'equipment_smith_machine', iconName: 'apps-outline' },
  { id: 'equipment_other', iconName: 'help-outline' }
];