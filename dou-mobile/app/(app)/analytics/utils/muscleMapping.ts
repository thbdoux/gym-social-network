// utils/muscleMapping.ts
// Updated to align with exerciseData.ts structure

import { getAllExercises, ExerciseItem } from '../../../../components/workouts/data/exerciseData';

// Define main muscle groups for analytics (simplified categories)
export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'legs' 
  | 'shoulders' 
  | 'arms' 
  | 'core'
  | 'full_body'
  | 'cardio'
  | 'other';

// Mapping from detailed muscle keys to simplified muscle groups
export const muscleKeyToGroupMap: Record<string, MuscleGroup> = {
  // Chest muscles
  'muscle_pectorals': 'chest',
  'muscle_upper_pectorals': 'chest',
  'muscle_lower_pectorals': 'chest',
  
  // Back muscles
  'muscle_latissimus_dorsi': 'back',
  'muscle_upper_back': 'back',
  'muscle_middle_back': 'back',
  'muscle_lower_back': 'back',
  'muscle_rhomboids': 'back',
  
  // Shoulder muscles
  'muscle_deltoids': 'shoulders',
  'muscle_anterior_deltoids': 'shoulders',
  'muscle_lateral_deltoids': 'shoulders',
  'muscle_posterior_deltoids': 'shoulders',
  'muscle_deltoids_trapezius': 'shoulders',
  'muscle_trapezius': 'shoulders',
  
  // Arm muscles
  'muscle_biceps': 'arms',
  'muscle_triceps': 'arms',
  'muscle_brachialis_biceps': 'arms',
  'muscle_forearms': 'arms',
  
  // Leg muscles
  'muscle_quadriceps': 'legs',
  'muscle_hamstrings': 'legs',
  'muscle_glutes': 'legs',
  'muscle_calves': 'legs',
  'muscle_quadriceps_glutes': 'legs',
  'muscle_hamstrings_glutes': 'legs',
  'muscle_hamstrings_lower_back': 'legs',
  'muscle_legs': 'legs',
  
  // Core muscles
  'muscle_core': 'core',
  'muscle_rectus_abdominis': 'core',
  'muscle_obliques': 'core',
  'muscle_lower_abs': 'core',
  'muscle_deep_core_stabilizers': 'core',
  'muscle_full_core': 'core',
  'muscle_core_hip_flexors': 'core',
  'muscle_rectus_abdominis_obliques': 'core',
  'muscle_hip_flexors': 'core',
  
  // Cardiovascular/Full body
  'muscle_cardiovascular_system': 'cardio',
  'muscle_cardiovascular_system_full_body': 'full_body',
  'muscle_cardiovascular_system_legs': 'cardio',
  'muscle_cardiovascular_system_upper_body': 'cardio',
  'muscle_full_body': 'full_body',
  'muscle_shoulders_core': 'full_body',
  'muscle_grip_core_legs': 'full_body',
};

// Structure for muscle mapping with primary and secondary muscles
export interface MuscleMapping {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
}

/**
 * Get the primary muscle group for an exercise using exerciseData
 * @param exerciseName The name of the exercise (can be translation key or translated name)
 * @param t Translation function (optional)
 * @returns The primary muscle group
 */
export function getPrimaryMuscleGroup(exerciseName: string, t?: (key: string) => string): MuscleGroup {
  if (!exerciseName) return 'other';
  
  // Get all exercises from exerciseData
  const allExercises = getAllExercises();
  
  // First try to find by translated name (if translation function provided)
  if (t) {
    const exerciseByTranslatedName = allExercises.find(ex => {
      const translatedName = t(ex.nameKey);
      return translatedName.toLowerCase() === exerciseName.toLowerCase();
    });
    
    if (exerciseByTranslatedName && exerciseByTranslatedName.targetMuscleKey) {
      return muscleKeyToGroupMap[exerciseByTranslatedName.targetMuscleKey] || 'other';
    }
  }
  
  // Try to find by nameKey directly
  const exerciseByKey = allExercises.find(ex => 
    ex.nameKey.toLowerCase() === exerciseName.toLowerCase()
  );
  
  if (exerciseByKey && exerciseByKey.targetMuscleKey) {
    return muscleKeyToGroupMap[exerciseByKey.targetMuscleKey] || 'other';
  }
  
  // Try partial matching with translated names (if translation function provided)
  if (t) {
    const exerciseByPartialName = allExercises.find(ex => {
      const translatedName = t(ex.nameKey).toLowerCase();
      const searchName = exerciseName.toLowerCase();
      return translatedName.includes(searchName) || searchName.includes(translatedName);
    });
    
    if (exerciseByPartialName && exerciseByPartialName.targetMuscleKey) {
      return muscleKeyToGroupMap[exerciseByPartialName.targetMuscleKey] || 'other';
    }
  }
  
  // Fallback to keyword-based detection
  return detectMuscleGroupByKeywords(exerciseName);
}

/**
 * Get secondary muscle groups for an exercise using exerciseData
 * @param exerciseName The name of the exercise
 * @param t Translation function (optional)
 * @returns Array of secondary muscle groups
 */
export function getSecondaryMuscleGroups(exerciseName: string, t?: (key: string) => string): MuscleGroup[] {
  if (!exerciseName) return [];
  
  const allExercises = getAllExercises();
  let targetExercise: ExerciseItem | undefined;
  
  // First try to find by translated name
  if (t) {
    targetExercise = allExercises.find(ex => {
      const translatedName = t(ex.nameKey);
      return translatedName.toLowerCase() === exerciseName.toLowerCase();
    });
  }
  
  // Try to find by nameKey directly
  if (!targetExercise) {
    targetExercise = allExercises.find(ex => 
      ex.nameKey.toLowerCase() === exerciseName.toLowerCase()
    );
  }
  
  // Try partial matching
  if (!targetExercise && t) {
    targetExercise = allExercises.find(ex => {
      const translatedName = t(ex.nameKey).toLowerCase();
      const searchName = exerciseName.toLowerCase();
      return translatedName.includes(searchName) || searchName.includes(translatedName);
    });
  }
  
  if (targetExercise && targetExercise.secondaryMuscleKeys) {
    return targetExercise.secondaryMuscleKeys
      .map(muscleKey => muscleKeyToGroupMap[muscleKey])
      .filter((group): group is MuscleGroup => group !== undefined);
  }
  
  return [];
}

/**
 * Get all muscle groups (primary and secondary) for an exercise
 * @param exerciseName The name of the exercise
 * @param t Translation function (optional)
 * @returns Array of all muscle groups
 */
export function getAllMuscleGroups(exerciseName: string, t?: (key: string) => string): MuscleGroup[] {
  const primary = getPrimaryMuscleGroup(exerciseName, t);
  const secondary = getSecondaryMuscleGroups(exerciseName, t);
  
  // Remove duplicates and filter out undefined values
  const allGroups = [primary, ...secondary].filter((group, index, arr) => 
    group && arr.indexOf(group) === index
  );
  
  return allGroups;
}

/**
 * Get muscle mapping (primary and secondary) for an exercise
 * @param exerciseName The name of the exercise
 * @param t Translation function (optional)
 * @returns MuscleMapping object
 */
export function getMuscleMapping(exerciseName: string, t?: (key: string) => string): MuscleMapping {
  const primary = getPrimaryMuscleGroup(exerciseName, t);
  const secondary = getSecondaryMuscleGroups(exerciseName, t);
  
  return {
    primary,
    secondary: secondary.length > 0 ? secondary : undefined
  };
}

/**
 * Calculate weighted muscle group contribution for an exercise
 * This function provides a more nuanced view of muscle involvement
 * @param exerciseName The name of the exercise
 * @param setCount Number of sets performed
 * @param t Translation function (optional)
 * @returns Record of muscle groups and their weighted contribution
 */
export function calculateMuscleGroupContribution(
  exerciseName: string, 
  setCount: number, 
  t?: (key: string) => string
): Record<string, number> {
  const allExercises = getAllExercises();
  let targetExercise: ExerciseItem | undefined;
  
  // Find the exercise in our database
  if (t) {
    targetExercise = allExercises.find(ex => {
      const translatedName = t(ex.nameKey);
      return translatedName.toLowerCase() === exerciseName.toLowerCase();
    });
  }
  
  if (!targetExercise) {
    targetExercise = allExercises.find(ex => 
      ex.nameKey.toLowerCase() === exerciseName.toLowerCase()
    );
  }
  
  if (!targetExercise && t) {
    targetExercise = allExercises.find(ex => {
      const translatedName = t(ex.nameKey).toLowerCase();
      const searchName = exerciseName.toLowerCase();
      return translatedName.includes(searchName) || searchName.includes(translatedName);
    });
  }
  
  const contribution: Record<string, number> = {};
  
  if (targetExercise) {
    // Primary muscle gets full contribution
    if (targetExercise.targetMuscleKey) {
      const primaryGroup = muscleKeyToGroupMap[targetExercise.targetMuscleKey] || 'other';
      contribution[primaryGroup] = setCount;
    }
    
    // Secondary muscles get 50% contribution
    if (targetExercise.secondaryMuscleKeys && targetExercise.secondaryMuscleKeys.length > 0) {
      targetExercise.secondaryMuscleKeys.forEach(muscleKey => {
        const secondaryGroup = muscleKeyToGroupMap[muscleKey] || 'other';
        contribution[secondaryGroup] = (contribution[secondaryGroup] || 0) + (setCount * 0.5);
      });
    }
  } else {
    // Fallback to keyword-based detection
    const primaryGroup = detectMuscleGroupByKeywords(exerciseName);
    contribution[primaryGroup] = setCount;
  }
  
  return contribution;
}

/**
 * Fallback function to detect muscle group by keywords
 * @param exerciseName The exercise name
 * @returns The detected muscle group
 */
function detectMuscleGroupByKeywords(exerciseName: string): MuscleGroup {
  const lowerName = exerciseName.toLowerCase();
  
  if (
    lowerName.includes('chest') || 
    lowerName.includes('pec') || 
    lowerName.includes('bench') ||
    lowerName.includes('fly') || 
    lowerName.includes('press') && (lowerName.includes('chest') || lowerName.includes('incline') || lowerName.includes('decline'))
  ) {
    return 'chest';
  } else if (
    lowerName.includes('back') || 
    lowerName.includes('row') || 
    lowerName.includes('pull') || 
    lowerName.includes('lat') || 
    lowerName.includes('deadlift') ||
    lowerName.includes('chin') ||
    lowerName.includes('pulldown')
  ) {
    return 'back';
  } else if (
    lowerName.includes('leg') || 
    lowerName.includes('squat') || 
    lowerName.includes('lunge') || 
    lowerName.includes('calf') || 
    lowerName.includes('hamstring') || 
    lowerName.includes('quad') || 
    lowerName.includes('glute') ||
    lowerName.includes('thigh')
  ) {
    return 'legs';
  } else if (
    lowerName.includes('shoulder') || 
    lowerName.includes('delt') || 
    lowerName.includes('lateral') || 
    lowerName.includes('overhead') ||
    lowerName.includes('raise') ||
    lowerName.includes('shrug')
  ) {
    return 'shoulders';
  } else if (
    lowerName.includes('arm') || 
    lowerName.includes('bicep') || 
    lowerName.includes('tricep') || 
    lowerName.includes('curl') ||
    lowerName.includes('extension') ||
    lowerName.includes('dip')
  ) {
    return 'arms';
  } else if (
    lowerName.includes('ab') || 
    lowerName.includes('core') || 
    lowerName.includes('crunch') || 
    lowerName.includes('plank') ||
    lowerName.includes('twist') ||
    lowerName.includes('sit')
  ) {
    return 'core';
  } else if (
    lowerName.includes('run') || 
    lowerName.includes('cardio') || 
    lowerName.includes('sprint') || 
    lowerName.includes('jog') || 
    lowerName.includes('cycling') ||
    lowerName.includes('treadmill') ||
    lowerName.includes('elliptical') ||
    lowerName.includes('bike') ||
    lowerName.includes('jump')
  ) {
    return 'cardio';
  } else if (
    lowerName.includes('burpee') ||
    lowerName.includes('thruster') ||
    lowerName.includes('kettlebell') ||
    lowerName.includes('clean') ||
    lowerName.includes('snatch') ||
    lowerName.includes('turkish')
  ) {
    return 'full_body';
  }
  
  return 'other';
}

/**
 * Get exercise by name from exerciseData
 * @param exerciseName The name to search for
 * @param t Translation function (optional)
 * @returns The exercise item if found
 */
export function getExerciseByName(exerciseName: string, t?: (key: string) => string): ExerciseItem | undefined {
  const allExercises = getAllExercises();
  
  // Try exact match with translated name
  if (t) {
    const exerciseByTranslatedName = allExercises.find(ex => {
      const translatedName = t(ex.nameKey);
      return translatedName.toLowerCase() === exerciseName.toLowerCase();
    });
    if (exerciseByTranslatedName) return exerciseByTranslatedName;
  }
  
  // Try exact match with nameKey
  const exerciseByKey = allExercises.find(ex => 
    ex.nameKey.toLowerCase() === exerciseName.toLowerCase()
  );
  if (exerciseByKey) return exerciseByKey;
  
  // Try partial match with translated name
  if (t) {
    const exerciseByPartialName = allExercises.find(ex => {
      const translatedName = t(ex.nameKey).toLowerCase();
      const searchName = exerciseName.toLowerCase();
      return translatedName.includes(searchName) || searchName.includes(translatedName);
    });
    if (exerciseByPartialName) return exerciseByPartialName;
  }
  
  return undefined;
}

/**
 * Get all muscle groups available in the system
 * @returns Array of all muscle groups
 */
export function getAllMuscleGroupTypes(): MuscleGroup[] {
  return ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio', 'other'];
}

/**
 * Get muscle group color for UI consistency
 * @param muscleGroup The muscle group
 * @returns Hex color string
 */
export function getMuscleGroupColor(muscleGroup: MuscleGroup): string {
  const muscleGroupColors = {
    'chest': '#f87171', // red
    'back': '#60a5fa', // blue
    'legs': '#4ade80', // green
    'shoulders': '#a78bfa', // purple
    'arms': '#fbbf24', // yellow
    'core': '#f97316', // orange
    'full_body': '#64748b', // slate
    'cardio': '#ec4899', // pink
    'other': '#94a3b8', // gray
  };
  
  return muscleGroupColors[muscleGroup] || '#94a3b8';
}