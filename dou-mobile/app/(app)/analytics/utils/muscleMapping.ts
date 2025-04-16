// utils/muscleMapping.ts
// A comprehensive mapping of exercises to muscle groups

// Define main muscle groups
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

// Structure for muscle mapping with primary and secondary muscles
export interface MuscleMapping {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
}

// Comprehensive exercise to muscle group mapping
export const exerciseMuscleMap: Record<string, MuscleMapping> = {
  // Chest exercises
  'Bench Press': { primary: 'chest', secondary: ['arms', 'shoulders'] },
  'Incline Bench Press': { primary: 'chest', secondary: ['shoulders'] },
  'Decline Bench Press': { primary: 'chest', secondary: ['arms'] },
  'Dumbbell Press': { primary: 'chest', secondary: ['shoulders'] },
  'Incline Dumbbell Press': { primary: 'chest', secondary: ['shoulders'] },
  'Decline Dumbbell Press': { primary: 'chest', secondary: ['arms'] },
  'Push-Up': { primary: 'chest', secondary: ['arms', 'shoulders'] },
  'Dumbbell Fly': { primary: 'chest' },
  'Cable Fly': { primary: 'chest' },
  'Chest Press Machine': { primary: 'chest' },
  'Pec Deck': { primary: 'chest' },
  
  // Back exercises
  'Deadlift': { primary: 'back', secondary: ['legs'] },
  'Pull-Up': { primary: 'back', secondary: ['arms'] },
  'Chin-Up': { primary: 'back', secondary: ['arms'] },
  'Bent Over Row': { primary: 'back', secondary: ['arms'] },
  'T-Bar Row': { primary: 'back' },
  'Seated Row': { primary: 'back', secondary: ['arms'] },
  'Lat Pulldown': { primary: 'back', secondary: ['arms'] },
  'Pendlay Row': { primary: 'back' },
  'Face Pull': { primary: 'back', secondary: ['shoulders'] },
  'Shrug': { primary: 'back', secondary: ['shoulders'] },
  'Romanian Deadlift': { primary: 'back', secondary: ['legs'] },
  'Good Morning': { primary: 'back', secondary: ['legs'] },
  'Reverse Fly': { primary: 'back', secondary: ['shoulders'] },
  'Superman': { primary: 'back' },
  
  // Leg exercises
  'Squat': { primary: 'legs', secondary: ['core'] },
  'Front Squat': { primary: 'legs', secondary: ['core'] },
  'Leg Press': { primary: 'legs' },
  'Lunge': { primary: 'legs' },
  'Bulgarian Split Squat': { primary: 'legs' },
  'Leg Extension': { primary: 'legs' },
  'Leg Curl': { primary: 'legs' },
  'Calf Raise': { primary: 'legs' },
  'Hip Thrust': { primary: 'legs', secondary: ['core'] },
  'Glute Bridge': { primary: 'legs' },
  'Hack Squat': { primary: 'legs' },
  'Box Jump': { primary: 'legs', secondary: ['cardio'] },
  'Step-Up': { primary: 'legs' },
  
  // Shoulder exercises
  'Overhead Press': { primary: 'shoulders', secondary: ['arms'] },
  'Military Press': { primary: 'shoulders', secondary: ['arms'] },
  'Shoulder Press': { primary: 'shoulders', secondary: ['arms'] },
  'Lateral Raise': { primary: 'shoulders' },
  'Front Raise': { primary: 'shoulders' },
  'Reverse Fly': { primary: 'shoulders', secondary: ['back'] },
  'Upright Row': { primary: 'shoulders', secondary: ['back'] },
  'Arnold Press': { primary: 'shoulders', secondary: ['arms'] },
  
  // Arm exercises
  'Bicep Curl': { primary: 'arms' },
  'Hammer Curl': { primary: 'arms' },
  'Preacher Curl': { primary: 'arms' },
  'Concentration Curl': { primary: 'arms' },
  'Tricep Extension': { primary: 'arms' },
  'Tricep Pushdown': { primary: 'arms' },
  'Skull Crusher': { primary: 'arms' },
  'Diamond Push-Up': { primary: 'arms', secondary: ['chest'] },
  'Dip': { primary: 'arms', secondary: ['chest'] },
  'Wrist Curl': { primary: 'arms' },
  
  // Core exercises
  'Crunch': { primary: 'core' },
  'Sit-Up': { primary: 'core' },
  'Plank': { primary: 'core' },
  'Russian Twist': { primary: 'core' },
  'Leg Raise': { primary: 'core' },
  'Mountain Climber': { primary: 'core', secondary: ['cardio'] },
  'Ab Wheel Rollout': { primary: 'core' },
  'Flutter Kick': { primary: 'core' },
  'Side Plank': { primary: 'core' },
  'Bicycle Crunch': { primary: 'core' },
  'V-Up': { primary: 'core' },
  'Hanging Leg Raise': { primary: 'core' },
  'Dragon Flag': { primary: 'core' },
  
  // Full body exercises
  'Burpee': { primary: 'full_body', secondary: ['cardio'] },
  'Thruster': { primary: 'full_body' },
  'Clean and Jerk': { primary: 'full_body' },
  'Snatch': { primary: 'full_body' },
  'Turkish Get-Up': { primary: 'full_body' },
  'Kettlebell Swing': { primary: 'full_body' },
  
  // Cardio exercises
  'Running': { primary: 'cardio' },
  'Cycling': { primary: 'cardio', secondary: ['legs'] },
  'Rowing': { primary: 'cardio', secondary: ['back', 'arms'] },
  'Jump Rope': { primary: 'cardio', secondary: ['legs'] },
  'Elliptical': { primary: 'cardio' },
  'Stair Climber': { primary: 'cardio', secondary: ['legs'] },
  'Swimming': { primary: 'cardio', secondary: ['full_body'] },
  'Battle Ropes': { primary: 'cardio', secondary: ['arms', 'shoulders'] }
};

/**
 * Get the primary muscle group for an exercise
 * @param exerciseName The name of the exercise
 * @returns The primary muscle group
 */
export function getPrimaryMuscleGroup(exerciseName: string): MuscleGroup {
  if (!exerciseName) return 'other';
  
  // First try exact match
  const normalizedName = exerciseName.trim();
  if (exerciseMuscleMap[normalizedName]) {
    return exerciseMuscleMap[normalizedName].primary;
  }
  
  // Try case-insensitive match
  const lowerName = normalizedName.toLowerCase();
  for (const [key, value] of Object.entries(exerciseMuscleMap)) {
    if (key.toLowerCase() === lowerName) {
      return value.primary;
    }
  }
  
  // Try partial match (contains)
  for (const [key, value] of Object.entries(exerciseMuscleMap)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value.primary;
    }
  }
  
  // Check for keywords
  if (
    lowerName.includes('chest') || 
    lowerName.includes('pec') || 
    lowerName.includes('fly') || 
    lowerName.includes('press')
  ) {
    return 'chest';
  } else if (
    lowerName.includes('back') || 
    lowerName.includes('row') || 
    lowerName.includes('pull') || 
    lowerName.includes('lat') || 
    lowerName.includes('deadlift')
  ) {
    return 'back';
  } else if (
    lowerName.includes('leg') || 
    lowerName.includes('squat') || 
    lowerName.includes('lunge') || 
    lowerName.includes('calf') || 
    lowerName.includes('hamstring') || 
    lowerName.includes('quad') || 
    lowerName.includes('glute')
  ) {
    return 'legs';
  } else if (
    lowerName.includes('shoulder') || 
    lowerName.includes('delt') || 
    lowerName.includes('lateral') || 
    lowerName.includes('overhead')
  ) {
    return 'shoulders';
  } else if (
    lowerName.includes('arm') || 
    lowerName.includes('bicep') || 
    lowerName.includes('tricep') || 
    lowerName.includes('curl')
  ) {
    return 'arms';
  } else if (
    lowerName.includes('ab') || 
    lowerName.includes('core') || 
    lowerName.includes('crunch') || 
    lowerName.includes('plank')
  ) {
    return 'core';
  } else if (
    lowerName.includes('run') || 
    lowerName.includes('cardio') || 
    lowerName.includes('sprint') || 
    lowerName.includes('jog') || 
    lowerName.includes('cycling')
  ) {
    return 'cardio';
  }
  
  return 'other';
}

/**
 * Get secondary muscle groups for an exercise
 * @param exerciseName The name of the exercise
 * @returns Array of secondary muscle groups, or empty array if none
 */
export function getSecondaryMuscleGroups(exerciseName: string): MuscleGroup[] {
  if (!exerciseName) return [];
  
  // Try exact match
  const normalizedName = exerciseName.trim();
  if (exerciseMuscleMap[normalizedName] && exerciseMuscleMap[normalizedName].secondary) {
    return exerciseMuscleMap[normalizedName].secondary || [];
  }
  
  // Try case-insensitive match
  const lowerName = normalizedName.toLowerCase();
  for (const [key, value] of Object.entries(exerciseMuscleMap)) {
    if (key.toLowerCase() === lowerName) {
      return value.secondary || [];
    }
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(exerciseMuscleMap)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value.secondary || [];
    }
  }
  
  return [];
}

/**
 * Get all muscle groups (primary and secondary) for an exercise
 * @param exerciseName The name of the exercise
 * @returns Array of all muscle groups
 */
export function getAllMuscleGroups(exerciseName: string): MuscleGroup[] {
  const primary = getPrimaryMuscleGroup(exerciseName);
  const secondary = getSecondaryMuscleGroups(exerciseName);
  
  return [primary, ...secondary];
}