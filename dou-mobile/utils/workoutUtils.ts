// utils/workoutUtils.ts

export type EffortType = 'reps' | 'time' | 'distance';
export type WeightUnit = 'kg' | 'lbs';

export interface Set {
  id?: number;
  reps?: number | null;
  weight?: number | null;
  weight_unit?: WeightUnit;
  weight_unit_display?: string;
  weight_display?: string;
  duration?: number | null;
  distance?: number | null;
  rest_time: number;
  order: number;
}

export interface Exercise {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order: number;
  effort_type?: EffortType;
  effort_type_display?: string;
  superset_with?: number | null;
  is_superset?: boolean;
  superset_rest_time?: number;
  sets: Set[];
}

// Conversion constants
const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;

/**
 * Convert weight from one unit to another
 */
export const convertWeight = (weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  if (fromUnit === toUnit) return weight;
  
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return weight * LBS_TO_KG;
  } else if (fromUnit === 'kg' && toUnit === 'lbs') {
    return weight * KG_TO_LBS;
  }
  
  return weight;
};

/**
 * Format weight with unit
 */
export const formatWeight = (weight: number | null, unit: WeightUnit = 'kg', precision: number = 1): string => {
  if (weight === null || weight === undefined) return 'No weight';
  
  const rounded = Math.round(weight * Math.pow(10, precision)) / Math.pow(10, precision);
  return `${rounded}${unit}`;
};

/**
 * Format duration in a human-readable way
 */
export const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return 'No time';
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Format distance
 */
export const formatDistance = (meters: number | null): string => {
  if (meters === null || meters === undefined) return 'No distance';
  
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)}km`;
  }
  
  return `${meters}m`;
};

/**
 * Get display value for a set based on exercise effort type
 */
export const getSetDisplayValue = (exercise: Exercise, setIndex: number = 0): string => {
  const set = exercise.sets[setIndex];
  if (!set) return 'No data';

  switch (exercise.effort_type) {
    case 'time':
      if (set.duration) {
        const timeStr = formatDuration(set.duration);
        return set.weight && set.weight > 0 
          ? `${timeStr} @ ${set.weight_display || formatWeight(set.weight, set.weight_unit)}`
          : timeStr;
      }
      return 'Time not set';
    
    case 'distance':
      if (set.distance) {
        const distanceStr = formatDistance(set.distance);
        return set.duration 
          ? `${distanceStr} in ${formatDuration(set.duration)}`
          : distanceStr;
      }
      return 'Distance not set';
    
    case 'reps':
    default:
      if (set.reps) {
        return set.weight && set.weight > 0 
          ? `${set.reps} reps @ ${set.weight_display || formatWeight(set.weight, set.weight_unit)}`
          : `${set.reps} reps`;
      }
      return 'Reps not set';
  }
};

/**
 * Get effort type display name
 */
export const getEffortTypeDisplay = (effortType: EffortType): string => {
  switch (effortType) {
    case 'reps':
      return 'Repetition-based';
    case 'time':
      return 'Time-based';
    case 'distance':
      return 'Distance-based';
    default:
      return 'Repetition-based';
  }
};

/**
 * Get weight unit display name
 */
export const getWeightUnitDisplay = (unit: WeightUnit): string => {
  switch (unit) {
    case 'kg':
      return 'Kilograms';
    case 'lbs':
      return 'Pounds';
    default:
      return 'Kilograms';
  }
};

/**
 * Calculate total volume for rep-based exercises
 */
export const calculateTotalVolume = (exercises: Exercise[], targetUnit: WeightUnit = 'kg'): number => {
  let totalVolume = 0;
  
  exercises.forEach(exercise => {
    if (exercise.effort_type === 'reps') {
      exercise.sets.forEach(set => {
        if (set.reps && set.weight) {
          const weight = convertWeight(set.weight, set.weight_unit || 'kg', targetUnit);
          totalVolume += weight * set.reps;
        }
      });
    }
  });
  
  return Math.round(totalVolume * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate estimated workout duration
 */
export const calculateWorkoutDuration = (exercises: Exercise[]): number => {
  let totalDuration = 0;
  
  exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      // Add set time based on effort type
      switch (exercise.effort_type) {
        case 'time':
          totalDuration += set.duration || 0;
          break;
        case 'reps':
          // Estimate 30 seconds per set for reps
          totalDuration += 30;
          break;
        case 'distance':
          totalDuration += set.duration || 60; // Default 1 minute if no time
          break;
      }
      
      // Add rest time
      totalDuration += set.rest_time;
    });
  });
  
  return Math.round(totalDuration / 60); // Convert to minutes
};

/**
 * Validate set data based on effort type
 */
export const validateSet = (set: Partial<Set>, effortType: EffortType): string[] => {
  const errors: string[] = [];
  
  switch (effortType) {
    case 'reps':
      if (!set.reps || set.reps <= 0) {
        errors.push('Reps are required for repetition-based exercises');
      }
      break;
    case 'time':
      if (!set.duration || set.duration <= 0) {
        errors.push('Duration is required for time-based exercises');
      }
      break;
    case 'distance':
      if (!set.distance || set.distance <= 0) {
        errors.push('Distance is required for distance-based exercises');
      }
      break;
  }
  
  if (!set.rest_time || set.rest_time < 0) {
    errors.push('Rest time must be specified');
  }
  
  return errors;
};

/**
 * Get default set values based on effort type
 */
export const getDefaultSetValues = (effortType: EffortType, weightUnit: WeightUnit = 'kg'): Partial<Set> => {
  const baseValues = {
    rest_time: 60,
    weight_unit: weightUnit,
    order: 0
  };
  
  switch (effortType) {
    case 'reps':
      return {
        ...baseValues,
        reps: 10,
        weight: 0
      };
    case 'time':
      return {
        ...baseValues,
        duration: 30,
        weight: null
      };
    case 'distance':
      return {
        ...baseValues,
        distance: 100,
        duration: null
      };
    default:
      return baseValues;
  }
};

/**
 * Create a new exercise with default values
 */
export const createDefaultExercise = (name: string, order: number, effortType: EffortType = 'reps'): Exercise => {
  return {
    name,
    order,
    effort_type: effortType,
    equipment: '',
    notes: '',
    superset_with: null,
    is_superset: false,
    sets: [getDefaultSetValues(effortType) as Set]
  };
};

/**
 * Progressive overload suggestions
 */
export const getProgressionSuggestions = (
  currentWeight: number, 
  unit: WeightUnit, 
  progressionType: 'percentage' | 'linear' = 'percentage'
): Array<{ weight: number; description: string; display: string }> => {
  const suggestions = [];
  
  if (progressionType === 'percentage') {
    const progressions = [
      { factor: 1.025, description: 'Conservative (+2.5%)' },
      { factor: 1.05, description: 'Moderate (+5%)' },
      { factor: 1.075, description: 'Aggressive (+7.5%)' }
    ];
    
    progressions.forEach(({ factor, description }) => {
      const newWeight = currentWeight * factor;
      suggestions.push({
        weight: newWeight,
        description,
        display: formatWeight(newWeight, unit)
      });
    });
  } else {
    const increments = unit === 'kg' 
      ? [
          { increment: 1.25, description: 'Small increase (+1.25kg)' },
          { increment: 2.5, description: 'Standard increase (+2.5kg)' },
          { increment: 5, description: 'Large increase (+5kg)' }
        ]
      : [
          { increment: 2.5, description: 'Small increase (+2.5lbs)' },
          { increment: 5, description: 'Standard increase (+5lbs)' },
          { increment: 10, description: 'Large increase (+10lbs)' }
        ];
    
    increments.forEach(({ increment, description }) => {
      const newWeight = currentWeight + increment;
      suggestions.push({
        weight: newWeight,
        description,
        display: formatWeight(newWeight, unit)
      });
    });
  }
  
  return suggestions;
};

/**
 * Calculate estimated 1RM (One Rep Max)
 */
export const calculateOneRepMax = (
  weight: number, 
  reps: number, 
  formula: 'epley' | 'brzycki' | 'lander' = 'epley'
): number => {
  if (reps === 1) return weight;
  
  switch (formula) {
    case 'epley':
      return weight * (1 + reps / 30);
    case 'brzycki':
      return weight * 36 / (37 - reps);
    case 'lander':
      return (100 * weight) / (101.3 - 2.67123 * reps);
    default:
      return weight * (1 + reps / 30);
  }
};

/**
 * Get required fields for a given effort type
 */
export const getRequiredFields = (effortType: EffortType): string[] => {
  const baseFields = ['rest_time'];
  
  switch (effortType) {
    case 'reps':
      return [...baseFields, 'reps'];
    case 'time':
      return [...baseFields, 'duration'];
    case 'distance':
      return [...baseFields, 'distance'];
    default:
      return baseFields;
  }
};

/**
 * Check if exercise allows weight
 */
export const allowsWeight = (effortType: EffortType): boolean => {
  // All effort types can optionally have weight
  return true;
};

/**
 * Get effort type options for dropdowns
 */
export const getEffortTypeOptions = () => [
  { value: 'reps', label: 'Repetition-based', description: 'Traditional weight lifting' },
  { value: 'time', label: 'Time-based', description: 'Planks, holds, etc.' },
  { value: 'distance', label: 'Distance-based', description: 'Running, cycling, etc.' }
];

/**
 * Get weight unit options for dropdowns
 */
export const getWeightUnitOptions = () => [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'lbs', label: 'Pounds (lbs)' }
];