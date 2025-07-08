// utils/analyticsUtils.ts
import { format, endOfWeek, subWeeks, isValid, startOfWeek } from 'date-fns';
import { 
  getPrimaryMuscleGroup, 
  calculateMuscleGroupContribution,
  getExerciseByName,
  getAllMuscleGroupTypes,
  MuscleGroup 
} from './muscleMapping';
import { getAllExercises, useExerciseHelpers } from '../../../../components/workouts/data/exerciseData';

// Define interfaces that match the Django models and serializers
export interface SetLog {
  id?: number;
  reps?: number | null;
  weight?: number | null;
  weight_unit?: 'kg' | 'lbs';
  weight_unit_display?: string;
  weight_display?: string;
  duration?: number | null;
  distance?: number | null;
  rest_time: number;
  order: number;
}

export interface ExerciseLog {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order: number;
  effort_type?: 'reps' | 'time' | 'distance';
  effort_type_display?: string;
  sets: SetLog[];
  superset_with?: number | null;
  is_superset?: boolean;
  muscle_group?: string;
}

export interface WorkoutLog {
  id?: number;
  name: string;
  date: string;
  notes?: string;
  completed?: boolean;
  exercises: ExerciseLog[];
  gym_name?: string;
  mood_rating?: number;
  perceived_difficulty?: number;
  performance_notes?: string;
  username?: string;
  [key: string]: any;
}

export interface WeeklyMetrics {
  startDate: Date;
  endDate: Date;
  label: string;
  totalWeightLifted: number;
  averageWeightPerRep: number;
  totalSets: number;
  setsPerMuscleGroup: Record<string, number>;
  workoutCount: number;
  // Added fields for trend analysis
  percentChangeFromPrevious?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  // New fields for enhanced analytics
  totalReps: number;
  averageSetsPerWorkout: number;
  bodyweightSets: number;
  weightedSets: number;
  durationMinutes: number;
  totalDistance: number;
  uniqueExercises: number;
  exerciseVariety: Record<string, number>;
}

export interface MuscleGroupData {
  label: string;
  value: string;
  count?: number; // Optional count of occurrences
}

export interface ExerciseData {
  label: string;
  value: string;
  muscleGroup?: string;
  count?: number; // Optional count of occurrences
  exerciseItem?: any; // Reference to the exerciseData item
  effortType?: 'reps' | 'time' | 'distance';
  isBodyweight?: boolean;
}

export interface ExerciseSetsData {
  name: string;
  sets: number;
  weight?: number; // Average weight used
  totalReps?: number;
  averageReps?: number;
  totalDuration?: number;
  totalDistance?: number;
  effortType?: 'reps' | 'time' | 'distance';
  isBodyweight?: boolean;
}

export interface MuscleGroupMetrics {
  muscleGroup: string;
  totalSets: number;
  exercises: ExerciseSetsData[];
  percentOfTotal?: number; // Percentage of total workout volume
}

// New interfaces for enhanced analytics
export interface BodyweightAnalytics {
  totalBodyweightSets: number;
  bodyweightExercises: Array<{
    name: string;
    sets: number;
    totalReps: number;
    averageReps: number;
    repProgression: Array<{ week: string; averageReps: number }>;
  }>;
  repProgressionTrend: 'increasing' | 'decreasing' | 'stable';
  mostImprovedExercise?: string;
}

export interface DurationDistanceAnalytics {
  totalDurationMinutes: number;
  totalDistanceKm: number;
  durationExercises: Array<{
    name: string;
    sessions: number;
    totalDuration: number;
    averageDuration: number;
    durationProgression: Array<{ week: string; averageDuration: number }>;
  }>;
  distanceExercises: Array<{
    name: string;
    sessions: number;
    totalDistance: number;
    averageDistance: number;
    distanceProgression: Array<{ week: string; averageDistance: number }>;
  }>;
  enduranceProgression: 'increasing' | 'decreasing' | 'stable';
  bestPerformanceWeek?: string;
}

export interface WorkoutInsights {
  consistency: {
    streak: number;
    averageWorkoutsPerWeek: number;
    missedWeeks: number;
  };
  intensity: {
    averageSetsPerWorkout: number;
    averageDurationPerWorkout: number;
    intensityTrend: 'increasing' | 'decreasing' | 'stable';
  };
  variety: {
    uniqueExercisesPerWeek: number;
    exerciseRotation: number; // How often exercises change
    muscleGroupBalance: Record<string, number>;
  };
  progression: {
    strengthProgression: number; // % increase in average weight
    volumeProgression: number; // % increase in total sets
    enduranceProgression: number; // % increase in duration/distance
  };
}

// Utility function to convert weight to kg
export const convertWeightToKg = (weight: number, unit: 'kg' | 'lbs' = 'kg'): number => {
  if (unit === 'lbs') {
    return weight * 0.453592; // Convert lbs to kg
  }
  return weight;
};

// Utility function to format weight consistently in kg
export const formatWeightInKg = (weight: number, unit: 'kg' | 'lbs' = 'kg'): number => {
  const weightInKg = convertWeightToKg(weight, unit);
  return Math.round(weightInKg * 100) / 100; // Round to 2 decimal places
};

// Enhanced date parser that handles a wide variety of formats
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Clean up the input string
  const trimmed = dateString.trim();
  
  // Try parsing as ISO format first (most common from API)
  const isoDate = new Date(trimmed);
  if (isValid(isoDate)) {
    return isoDate;
  }
  
  // Regular expression for common date formats
  // Captures: day/month/year with various separators
  const dateRegex = /^(\d{1,2})([\/\.-])(\d{1,2})([\/\.-])(\d{2,4})$/;
  const match = trimmed.match(dateRegex);
  
  if (match) {
    const first = parseInt(match[1]);
    const second = parseInt(match[3]);
    let year = parseInt(match[5]);
    
    // Adjust 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    // Try European format (DD/MM/YYYY)
    if (first <= 31 && second <= 12) {
      const date = new Date(year, second - 1, first);
      
      // Validate the parsed date matches the input values
      if (isValid(date) && 
          date.getDate() === first && 
          date.getMonth() === second - 1 && 
          date.getFullYear() === year) {
        return date;
      }
    }
    
    // Fallback to US format (MM/DD/YYYY) if European failed
    if (first <= 12 && second <= 31) {
      const date = new Date(year, first - 1, second);
      
      // Validate the parsed date
      if (isValid(date) && 
          date.getDate() === second && 
          date.getMonth() === first - 1 && 
          date.getFullYear() === year) {
        return date;
        
      }
    }
  }
  
  // Also handle YYYY-MM-DD format explicitly
  const isoRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const isoMatch = trimmed.match(isoRegex);
  
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]);
    const day = parseInt(isoMatch[3]);
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      
      if (isValid(date) && 
          date.getDate() === day && 
          date.getMonth() === month - 1 && 
          date.getFullYear() === year) {
        return date;
      }
    }
  }
  
  // If all attempts fail, return null
  return null;
}

// Helper function to determine if an exercise is bodyweight
export const isBodyweightExercise = (exercise: ExerciseLog): boolean => {
  const isBodyweight = exercise.equipment === 'Bodyweight' || exercise.equipment === 'Poids du corps'
  return isBodyweight && exercise.effort_type === 'reps';
};

// Helper function to determine if an exercise is duration/distance based
export const isDurationDistanceExercise = (exercise: ExerciseLog): boolean => {
  return exercise.effort_type === 'time' || exercise.effort_type === 'distance';
};

// Get all unique muscle groups from logs with weighted contribution system
export const getMuscleGroups = (
  logs: WorkoutLog[], 
  t?: (key: string) => string
): MuscleGroupData[] => {
  const muscleGroupMap = new Map<string, number>();
  
  try {
    for (const log of logs) {
      if (!log.exercises || !Array.isArray(log.exercises)) continue;
      
      for (const exercise of log.exercises) {
        if (!exercise || !exercise.sets || !Array.isArray(exercise.sets)) continue;
        
        const setCount = exercise.sets.length;
        
        // Use the weighted contribution system from the updated muscleMapping
        const muscleContribution = calculateMuscleGroupContribution(exercise.name, setCount, t);
        
        // Add the contributions to our muscle group map
        for (const [muscleGroup, contribution] of Object.entries(muscleContribution)) {
          const currentCount = muscleGroupMap.get(muscleGroup) || 0;
          muscleGroupMap.set(muscleGroup, currentCount + contribution);
        }
      }
    }
  } catch (error) {
    console.error('Error extracting muscle groups:', error);
  }
  
  // Convert to array and sort by frequency (most frequent first)
  return Array.from(muscleGroupMap.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .map(([group, count]) => ({
      label: group.charAt(0).toUpperCase() + group.slice(1), // Capitalize first letter
      value: group,
      count: Math.round(count * 10) / 10 // Round to 1 decimal place for weighted counts
    }));
};

// Get all unique exercises from logs with enhanced muscle group detection
export const getExercises = (
  logs: WorkoutLog[], 
  muscleGroup?: string,
  t?: (key: string) => string,
): ExerciseData[] => {
  const exerciseMap = new Map<string, { 
    muscleGroup?: string; 
    count: number; 
    exerciseItem?: any;
    effortType?: 'reps' | 'time' | 'distance';
    isBodyweight?: boolean;
  }>();
  
  try {
    for (const log of logs) {
      if (!log.exercises || !Array.isArray(log.exercises)) continue;
      
      for (const exercise of log.exercises) {
        if (!exercise || !exercise.name) continue;
        
        // Find the exercise in our database
        const exerciseItem = getExerciseByName(exercise.name, t);
        
        // Get muscle group for this exercise using the enhanced system
        let exerciseMuscleGroup: string;
        
        if (exerciseItem && exerciseItem.targetMuscleKey) {
          // Use the primary muscle group from exerciseData
          exerciseMuscleGroup = getPrimaryMuscleGroup(exercise.name, t);
        } else {
          // Fallback to the muscle_group field or keyword detection
          exerciseMuscleGroup = exercise.muscle_group || getPrimaryMuscleGroup(exercise.name, t);
        }
        
        // Apply filter if provided - check if the exercise targets the filtered muscle group
        if (muscleGroup) {
          let exerciseMatchesFilter = false;
          
          if (exerciseItem) {
            // Get all muscle groups this exercise targets (primary + secondary)
            const muscleContribution = calculateMuscleGroupContribution(exercise.name, 1, t);
            const targetedMuscleGroups = Object.keys(muscleContribution);
            
            // Check if any of the targeted muscle groups match the filter
            exerciseMatchesFilter = targetedMuscleGroups.includes(muscleGroup);
          } else {
            // Fallback to simple string comparison
            exerciseMatchesFilter = exerciseMuscleGroup === muscleGroup;
          }
          
          if (!exerciseMatchesFilter) continue;
        }
        
        const effortType = exercise.effort_type || 'reps';
        const isBodyweight = isBodyweightExercise(exercise);
        
        const existing = exerciseMap.get(exercise.name);
        if (existing) {
          exerciseMap.set(exercise.name, { 
            muscleGroup: exerciseMuscleGroup,
            count: existing.count + 1,
            exerciseItem: exerciseItem || existing.exerciseItem,
            effortType,
            isBodyweight
          });
        } else {
          exerciseMap.set(exercise.name, { 
            muscleGroup: exerciseMuscleGroup,
            count: 1,
            exerciseItem: exerciseItem,
            effortType,
            isBodyweight
          });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting exercises:', error);
  }
  
  // Convert to array and sort by frequency (most frequent first)
  return Array.from(exerciseMap.entries())
    .sort((a, b) => b[1].count - a[1].count) // Sort by count descending
    .map(([name, data]) => ({
      label: name,
      value: name,
      muscleGroup: data.muscleGroup,
      count: data.count,
      exerciseItem: data.exerciseItem,
      effortType: data.effortType,
      isBodyweight: data.isBodyweight
    }));
};

// Enhanced weekly metrics calculation with weight unit conversion
export const calculateWeeklyMetrics = (
  logs: WorkoutLog[],
  t?: (key: string) => string,
  numWeeks: number = 0, // 0 means no limit
  selectedMuscleGroup?: string,
  selectedExercise?: string
): WeeklyMetrics[] => {
  try {
    // Safety checks
    if (!logs || logs.length === 0) return [];
    
    // Filter out incomplete logs
    const completedLogs = logs.filter(log => log.completed);
    if (completedLogs.length === 0) return [];
    
    // Use the number of weeks requested, or calculate based on available data
    let actualNumWeeks = numWeeks;
    if (actualNumWeeks <= 0) {
      // Find the date range in the logs
      let earliestDate: Date | null = null;
      let latestDate: Date | null = null;
      
      for (const log of completedLogs) {
        if (!log.date) continue;
        
        const logDate = parseDate(log.date);
        if (!logDate) continue;
        
        if (!earliestDate || logDate < earliestDate) {
          earliestDate = logDate;
        }
        
        if (!latestDate || logDate > latestDate) {
          latestDate = logDate;
        }
      }
      
      if (earliestDate && latestDate) {
        // Calculate weeks between earliest and latest dates
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        actualNumWeeks = Math.ceil((latestDate.getTime() - earliestDate.getTime()) / msPerWeek) + 1;
      } else {
        // Default to 16 weeks if we couldn't determine the range
        actualNumWeeks = 16;
      }
    }
    
    // Calculate week boundaries
    const today = new Date();
    const weeks: Date[] = [];
    
    // Generate week start dates properly
    for (let i = 0; i < actualNumWeeks; i++) {
      // Get a date from i weeks ago
      const dateFromPast = subWeeks(today, i);
      
      // Find the start of that week (Monday)
      const weekStart = startOfWeek(dateFromPast, { weekStartsOn: 1 });
      
      weeks.push(weekStart);
    }
    
    // Sort weeks in chronological order
    weeks.sort((a, b) => a.getTime() - b.getTime());
    
    // Calculate metrics for each week
    const weeklyMetrics = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Filter logs for this week
      const weekLogs = completedLogs.filter(log => {
        if (!log.date) return false;
        
        try {
          const logDate = parseDate(log.date);
          if (!logDate) return false;
          return logDate >= weekStart && logDate <= weekEnd;
        } catch (err) {
          console.warn('Error processing date:', err);
          return false; // Skip logs with invalid dates
        }
      });
      
      let totalWeight = 0;
      let totalReps = 0;
      let setCount = 0;
      let bodyweightSets = 0;
      let weightedSets = 0;
      let durationMinutes = 0;
      let totalDistance = 0;
      const uniqueExercises = new Set<string>();
      const exerciseVariety: Record<string, number> = {};
      const setsPerMuscleGroup: Record<string, number> = {};
      
      // Initialize sets per muscle group counter with all known muscle groups
      const allMuscleGroups = getAllMuscleGroupTypes();
      allMuscleGroups.forEach(group => {
        setsPerMuscleGroup[group] = 0;
      });
      
      // Process week logs with weighted muscle group contribution
      for (const log of weekLogs) {
        if (!log.exercises || !Array.isArray(log.exercises)) continue;
        
        for (const exercise of log.exercises) {
          if (!exercise) continue;
          
          // Skip if doesn't match exercise filter
          if (selectedExercise && exercise.name !== selectedExercise) {
            continue;
          }
          
          if (!exercise.sets || !Array.isArray(exercise.sets)) continue;
          
          uniqueExercises.add(exercise.name);
          exerciseVariety[exercise.name] = (exerciseVariety[exercise.name] || 0) + 1;
          
          let exerciseWeight = 0;
          let exerciseReps = 0;
          let exerciseSets = 0;
          let exerciseDuration = 0;
          let exerciseDistance = 0;
          
          // Calculate total sets for this exercise
          const validSets = exercise.sets.filter(set => set && 
            ((!isNaN(Number(set.reps)) && set.reps !== null) || 
             (!isNaN(Number(set.duration)) && set.duration !== null) ||
             (!isNaN(Number(set.distance)) && set.distance !== null))
          );
          exerciseSets = validSets.length;
          
          if (exerciseSets === 0) continue;
          
          // Calculate muscle group contributions for this exercise
          const muscleContributions = calculateMuscleGroupContribution(exercise.name, exerciseSets, t);
          
          // Check if any of the muscle groups match the filter
          if (selectedMuscleGroup) {
            const muscleGroupMatches = Object.keys(muscleContributions).some(muscle => 
              muscle === selectedMuscleGroup || muscle.includes(selectedMuscleGroup)
            );
            
            if (!muscleGroupMatches) continue;
          }
          
          const effortType = exercise.effort_type || 'reps';
          const isBodyweight = isBodyweightExercise(exercise);
          
          // Process each set for weight, rep, duration, and distance calculations
          for (const set of validSets) {
            let weight = 0;
            let reps = 0;
            let duration = 0;
            let distance = 0;
            
            // Handle weight conversion to kg
            if (set.weight !== null && set.weight !== undefined && !isNaN(Number(set.weight))) {
              const weightUnit = set.weight_unit || 'kg';
              weight = formatWeightInKg(Number(set.weight), weightUnit);
            }
            
            if (set.reps !== null && set.reps !== undefined && !isNaN(Number(set.reps))) {
              reps = Number(set.reps);
            }
            
            if (set.duration !== null && set.duration !== undefined && !isNaN(Number(set.duration))) {
              duration = Number(set.duration);
            }
            
            if (set.distance !== null && set.distance !== undefined && !isNaN(Number(set.distance))) {
              distance = Number(set.distance);
            }
            
            // Calculate metrics based on effort type
            if (effortType === 'reps') {
              if (reps > 0) {
                totalReps += reps;
                setCount++;
                
                if (isBodyweight) {
                  bodyweightSets++;
                } else {
                  weightedSets++;
                  if (weight > 0) {
                    const setWeight = weight * reps;
                    totalWeight += setWeight;
                    exerciseWeight += setWeight;
                  }
                }
                exerciseReps += reps;
              }
            } else if (effortType === 'time') {
              if (duration > 0) {
                durationMinutes += duration / 60; // Convert seconds to minutes
                exerciseDuration += duration;
                setCount++;
              }
            } else if (effortType === 'distance') {
              if (distance > 0) {
                totalDistance += distance / 1000; // Convert meters to km
                exerciseDistance += distance;
                setCount++;
              }
            }
          }
          
          // Distribute the weight and sets across muscle groups based on contribution
          for (const [muscleGroup, contribution] of Object.entries(muscleContributions)) {
            if (setsPerMuscleGroup[muscleGroup] !== undefined) {
              setsPerMuscleGroup[muscleGroup] += contribution;
            } else {
              // Handle unmapped muscle groups
              setsPerMuscleGroup['other'] = (setsPerMuscleGroup['other'] || 0) + contribution;
            }
          }
        }
      }
      
      // Format date label
      const weekLabel = format(weekStart, 'MMM d');
      
      const averageSetsPerWorkout = weekLogs.length > 0 ? setCount / weekLogs.length : 0;
      
      return {
        startDate: weekStart,
        endDate: weekEnd,
        label: weekLabel,
        totalWeightLifted: totalWeight,
        averageWeightPerRep: totalReps > 0 ? totalWeight / totalReps : 0,
        totalSets: setCount,
        setsPerMuscleGroup,
        workoutCount: weekLogs.length,
        totalReps,
        averageSetsPerWorkout,
        bodyweightSets,
        weightedSets,
        durationMinutes,
        totalDistance,
        uniqueExercises: uniqueExercises.size,
        exerciseVariety
      };
    });
    
    // Calculate trend information
    for (let i = 1; i < weeklyMetrics.length; i++) {
      const currentWeek = weeklyMetrics[i];
      const previousWeek = weeklyMetrics[i - 1];
      
      if (previousWeek.totalWeightLifted > 0) {
        const percentChange = ((currentWeek.totalWeightLifted - previousWeek.totalWeightLifted) / previousWeek.totalWeightLifted) * 100;
        currentWeek.percentChangeFromPrevious = percentChange;
        
        // Determine trend
        if (percentChange > 5) {
          currentWeek.trend = 'increasing';
        } else if (percentChange < -5) {
          currentWeek.trend = 'decreasing';
        } else {
          currentWeek.trend = 'stable';
        }
      }
    }
    
    return weeklyMetrics;
  } catch (error) {
    console.error('Error in calculateWeeklyMetrics:', error);
    return [];
  }
};

// Calculate bodyweight exercise analytics
export const calculateBodyweightAnalytics = (
  logs: WorkoutLog[],
  weeklyMetrics: WeeklyMetrics[],
  t?: (key: string) => string
): BodyweightAnalytics => {
  const bodyweightExercises = new Map<string, {
    sets: number;
    totalReps: number;
    weeklyReps: Map<string, number[]>;
  }>();
  
  // Process logs to find bodyweight exercises
  for (const log of logs) {
    if (!log.exercises || !log.completed) continue;
    
    const logDate = parseDate(log.date);
    if (!logDate) continue;
    
    const weekLabel = format(logDate, 'MMM d');
    
    for (const exercise of log.exercises) {
      if (!isBodyweightExercise(exercise)) continue;
      
      const exerciseData = bodyweightExercises.get(exercise.name) || {
        sets: 0,
        totalReps: 0,
        weeklyReps: new Map()
      };
      
      let exerciseReps = 0;
      for (const set of exercise.sets) {
        if (set.reps && set.reps > 0) {
          exerciseReps += set.reps;
          exerciseData.totalReps += set.reps;
          exerciseData.sets++;
        }
      }
      
      if (exerciseReps > 0) {
        const weekReps = exerciseData.weeklyReps.get(weekLabel) || [];
        weekReps.push(exerciseReps);
        exerciseData.weeklyReps.set(weekLabel, weekReps);
      }
      
      bodyweightExercises.set(exercise.name, exerciseData);
    }
  }
  
  // Calculate progression for each exercise
  const exercises = Array.from(bodyweightExercises.entries()).map(([name, data]) => {
    const repProgression = Array.from(data.weeklyReps.entries()).map(([week, reps]) => ({
      week,
      averageReps: reps.reduce((sum, r) => sum + r, 0) / reps.length
    })).sort((a, b) => a.week.localeCompare(b.week));
    
    return {
      name,
      sets: data.sets,
      totalReps: data.totalReps,
      averageReps: data.sets > 0 ? data.totalReps / data.sets : 0,
      repProgression
    };
  }).sort((a, b) => b.totalReps - a.totalReps);
  
  // Calculate overall trend
  const totalBodyweightSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  let repProgressionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  if (exercises.length > 0) {
    const avgProgression = exercises.map(ex => {
      if (ex.repProgression.length < 2) return 0;
      const first = ex.repProgression[0].averageReps;
      const last = ex.repProgression[ex.repProgression.length - 1].averageReps;
      return first > 0 ? ((last - first) / first) * 100 : 0;
    });
    
    const overallProgression = avgProgression.reduce((sum, p) => sum + p, 0) / avgProgression.length;
    
    if (overallProgression > 5) {
      repProgressionTrend = 'increasing';
    } else if (overallProgression < -5) {
      repProgressionTrend = 'decreasing';
    }
  }
  
  // Find most improved exercise
  let mostImprovedExercise: string | undefined;
  let bestImprovement = 0;
  
  for (const exercise of exercises) {
    if (exercise.repProgression.length >= 2) {
      const first = exercise.repProgression[0].averageReps;
      const last = exercise.repProgression[exercise.repProgression.length - 1].averageReps;
      const improvement = first > 0 ? ((last - first) / first) * 100 : 0;
      
      if (improvement > bestImprovement) {
        bestImprovement = improvement;
        mostImprovedExercise = exercise.name;
      }
    }
  }
  
  return {
    totalBodyweightSets,
    bodyweightExercises: exercises,
    repProgressionTrend,
    mostImprovedExercise
  };
};

// Calculate duration/distance exercise analytics
export const calculateDurationDistanceAnalytics = (
  logs: WorkoutLog[],
  weeklyMetrics: WeeklyMetrics[],
  t?: (key: string) => string
): DurationDistanceAnalytics => {
  const durationExercises = new Map<string, {
    sessions: number;
    totalDuration: number;
    weeklyDuration: Map<string, number[]>;
  }>();
  
  const distanceExercises = new Map<string, {
    sessions: number;
    totalDistance: number;
    weeklyDistance: Map<string, number[]>;
  }>();
  
  let totalDurationMinutes = 0;
  let totalDistanceKm = 0;
  
  // Process logs to find duration/distance exercises
  for (const log of logs) {
    if (!log.exercises || !log.completed) continue;
    
    const logDate = parseDate(log.date);
    if (!logDate) continue;
    
    const weekLabel = format(logDate, 'MMM d');
    
    for (const exercise of log.exercises) {
      if (!isDurationDistanceExercise(exercise)) continue;
      
      if (exercise.effort_type === 'time') {
        const exerciseData = durationExercises.get(exercise.name) || {
          sessions: 0,
          totalDuration: 0,
          weeklyDuration: new Map()
        };
        
        let exerciseDuration = 0;
        for (const set of exercise.sets) {
          if (set.duration && set.duration > 0) {
            exerciseDuration += set.duration;
            exerciseData.totalDuration += set.duration;
            totalDurationMinutes += set.duration / 60;
          }
        }
        
        if (exerciseDuration > 0) {
          exerciseData.sessions++;
          const weekDurations = exerciseData.weeklyDuration.get(weekLabel) || [];
          weekDurations.push(exerciseDuration);
          exerciseData.weeklyDuration.set(weekLabel, weekDurations);
          durationExercises.set(exercise.name, exerciseData);
        }
        
      } else if (exercise.effort_type === 'distance') {
        const exerciseData = distanceExercises.get(exercise.name) || {
          sessions: 0,
          totalDistance: 0,
          weeklyDistance: new Map()
        };
        
        let exerciseDistance = 0;
        for (const set of exercise.sets) {
          if (set.distance && set.distance > 0) {
            exerciseDistance += set.distance;
            exerciseData.totalDistance += set.distance;
            totalDistanceKm += set.distance / 1000;
          }
        }
        
        if (exerciseDistance > 0) {
          exerciseData.sessions++;
          const weekDistances = exerciseData.weeklyDistance.get(weekLabel) || [];
          weekDistances.push(exerciseDistance);
          exerciseData.weeklyDistance.set(weekLabel, weekDistances);
          distanceExercises.set(exercise.name, exerciseData);
        }
      }
    }
  }
  
  // Process duration exercises
  const processedDurationExercises = Array.from(durationExercises.entries()).map(([name, data]) => {
    const durationProgression = Array.from(data.weeklyDuration.entries()).map(([week, durations]) => ({
      week,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length
    })).sort((a, b) => a.week.localeCompare(b.week));
    
    return {
      name,
      sessions: data.sessions,
      totalDuration: data.totalDuration,
      averageDuration: data.sessions > 0 ? data.totalDuration / data.sessions : 0,
      durationProgression
    };
  }).sort((a, b) => b.totalDuration - a.totalDuration);
  
  // Process distance exercises
  const processedDistanceExercises = Array.from(distanceExercises.entries()).map(([name, data]) => {
    const distanceProgression = Array.from(data.weeklyDistance.entries()).map(([week, distances]) => ({
      week,
      averageDistance: distances.reduce((sum, d) => sum + d, 0) / distances.length
    })).sort((a, b) => a.week.localeCompare(b.week));
    
    return {
      name,
      sessions: data.sessions,
      totalDistance: data.totalDistance,
      averageDistance: data.sessions > 0 ? data.totalDistance / data.sessions : 0,
      distanceProgression
    };
  }).sort((a, b) => b.totalDistance - a.totalDistance);
  
  // Calculate endurance progression
  let enduranceProgression: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  const allProgressions = [
    ...processedDurationExercises.map(ex => {
      if (ex.durationProgression.length < 2) return 0;
      const first = ex.durationProgression[0].averageDuration;
      const last = ex.durationProgression[ex.durationProgression.length - 1].averageDuration;
      return first > 0 ? ((last - first) / first) * 100 : 0;
    }),
    ...processedDistanceExercises.map(ex => {
      if (ex.distanceProgression.length < 2) return 0;
      const first = ex.distanceProgression[0].averageDistance;
      const last = ex.distanceProgression[ex.distanceProgression.length - 1].averageDistance;
      return first > 0 ? ((last - first) / first) * 100 : 0;
    })
  ];
  
  if (allProgressions.length > 0) {
    const avgProgression = allProgressions.reduce((sum, p) => sum + p, 0) / allProgressions.length;
    if (avgProgression > 5) {
      enduranceProgression = 'increasing';
    } else if (avgProgression < -5) {
      enduranceProgression = 'decreasing';
    }
  }
  
  // Find best performance week
  let bestPerformanceWeek: string | undefined;
  
  return {
    totalDurationMinutes: Math.round(totalDurationMinutes * 100) / 100,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    durationExercises: processedDurationExercises,
    distanceExercises: processedDistanceExercises,
    enduranceProgression,
    bestPerformanceWeek
  };
};

// Calculate comprehensive workout insights
export const calculateWorkoutInsights = (
  logs: WorkoutLog[],
  weeklyMetrics: WeeklyMetrics[],
  t?: (key: string) => string
): WorkoutInsights => {
  // Consistency metrics
  let streak = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let missedWeeks = 0;
  const totalWeeks = weeklyMetrics.length;
  const totalWorkouts = weeklyMetrics.reduce((sum, week) => sum + week.workoutCount, 0);
  const averageWorkoutsPerWeek = totalWeeks > 0 ? totalWorkouts / totalWeeks : 0;
  
  // Calculate streaks and missed weeks
  for (let i = weeklyMetrics.length - 1; i >= 0; i--) {
    const week = weeklyMetrics[i];
    if (week.workoutCount > 0) {
      currentStreak++;
      if (i === weeklyMetrics.length - 1) {
        streak = currentStreak;
      }
    } else {
      if (i === weeklyMetrics.length - 1) {
        streak = 0;
      }
      missedWeeks++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
      currentStreak = 0;
    }
  }
  
  // Intensity metrics
  const averageSetsPerWorkout = totalWorkouts > 0 ? 
    weeklyMetrics.reduce((sum, week) => sum + (week.totalSets * week.workoutCount), 0) / totalWorkouts : 0;
  
  const averageDurationPerWorkout = totalWorkouts > 0 ?
    weeklyMetrics.reduce((sum, week) => sum + (week.durationMinutes * week.workoutCount), 0) / totalWorkouts : 0;
  
  // Calculate intensity trend
  let intensityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (weeklyMetrics.length >= 4) {
    const firstHalf = weeklyMetrics.slice(0, Math.floor(weeklyMetrics.length / 2));
    const secondHalf = weeklyMetrics.slice(Math.floor(weeklyMetrics.length / 2));
    
    const firstHalfAvgSets = firstHalf.reduce((sum, week) => sum + week.averageSetsPerWorkout, 0) / firstHalf.length;
    const secondHalfAvgSets = secondHalf.reduce((sum, week) => sum + week.averageSetsPerWorkout, 0) / secondHalf.length;
    
    const intensityChange = firstHalfAvgSets > 0 ? ((secondHalfAvgSets - firstHalfAvgSets) / firstHalfAvgSets) * 100 : 0;
    
    if (intensityChange > 10) {
      intensityTrend = 'increasing';
    } else if (intensityChange < -10) {
      intensityTrend = 'decreasing';
    }
  }
  
  // Variety metrics
  const allUniqueExercises = new Set<string>();
  const muscleGroupBalance: Record<string, number> = {};
  
  weeklyMetrics.forEach(week => {
    Object.entries(week.exerciseVariety).forEach(([exercise, count]) => {
      allUniqueExercises.add(exercise);
    });
    
    Object.entries(week.setsPerMuscleGroup).forEach(([muscle, sets]) => {
      muscleGroupBalance[muscle] = (muscleGroupBalance[muscle] || 0) + sets;
    });
  });
  
  const uniqueExercisesPerWeek = totalWeeks > 0 ? allUniqueExercises.size / totalWeeks : 0;
  
  // Calculate exercise rotation (how often exercises change)
  let exerciseRotation = 0;
  if (weeklyMetrics.length > 1) {
    let rotationSum = 0;
    for (let i = 1; i < weeklyMetrics.length; i++) {
      const prevExercises = new Set(Object.keys(weeklyMetrics[i - 1].exerciseVariety));
      const currExercises = new Set(Object.keys(weeklyMetrics[i].exerciseVariety));
      const intersection = new Set([...prevExercises].filter(x => currExercises.has(x)));
      const union = new Set([...prevExercises, ...currExercises]);
      
      rotationSum += union.size > 0 ? (union.size - intersection.size) / union.size : 0;
    }
    exerciseRotation = (rotationSum / (weeklyMetrics.length - 1)) * 100;
  }
  
  // Progression metrics
  const firstWeek = weeklyMetrics[0];
  const lastWeek = weeklyMetrics[weeklyMetrics.length - 1];
  
  const strengthProgression = firstWeek?.averageWeightPerRep > 0 ? 
    ((lastWeek?.averageWeightPerRep - firstWeek?.averageWeightPerRep) / firstWeek?.averageWeightPerRep) * 100 : 0;
    
  const volumeProgression = firstWeek?.totalSets > 0 ?
    ((lastWeek?.totalSets - firstWeek?.totalSets) / firstWeek?.totalSets) * 100 : 0;
    
  const enduranceProgression = firstWeek?.durationMinutes > 0 ?
    ((lastWeek?.durationMinutes - firstWeek?.durationMinutes) / firstWeek?.durationMinutes) * 100 : 0;
  
  return {
    consistency: {
      streak: Math.max(streak, maxStreak),
      averageWorkoutsPerWeek: Math.round(averageWorkoutsPerWeek * 100) / 100,
      missedWeeks
    },
    intensity: {
      averageSetsPerWorkout: Math.round(averageSetsPerWorkout * 100) / 100,
      averageDurationPerWorkout: Math.round(averageDurationPerWorkout * 100) / 100,
      intensityTrend
    },
    variety: {
      uniqueExercisesPerWeek: Math.round(uniqueExercisesPerWeek * 100) / 100,
      exerciseRotation: Math.round(exerciseRotation * 100) / 100,
      muscleGroupBalance
    },
    progression: {
      strengthProgression: Math.round(strengthProgression * 100) / 100,
      volumeProgression: Math.round(volumeProgression * 100) / 100,
      enduranceProgression: Math.round(enduranceProgression * 100) / 100
    }
  };
};

// Calculate muscle group metrics with enhanced details and weighted contributions
export const calculateMuscleGroupMetrics = (
  weeklyMetrics: WeeklyMetrics[],
  selectedWeek?: string,
  logs?: WorkoutLog[],
  t?: (key: string) => string
): MuscleGroupMetrics[] => {
  try {
    // Filter weekly metrics if a specific week is selected
    const filteredMetrics = selectedWeek 
      ? weeklyMetrics.filter(week => week.label === selectedWeek)
      : weeklyMetrics;
    
    // Initialize results
    const muscleGroupMap: Record<string, MuscleGroupMetrics> = {};
    
    // Initialize with all muscle groups
    const allMuscleGroups = getAllMuscleGroupTypes();
    allMuscleGroups.forEach(group => {
      muscleGroupMap[group] = {
        muscleGroup: group.charAt(0).toUpperCase() + group.slice(1), // Capitalize and format
        totalSets: 0,
        exercises: []
      };
    });
    
    // Aggregate sets per muscle group across all weeks
    let totalSetsAllGroups = 0;
    
    for (const week of filteredMetrics) {
      for (const [muscleGroup, setCount] of Object.entries(week.setsPerMuscleGroup)) {
        if (muscleGroupMap[muscleGroup]) {
          muscleGroupMap[muscleGroup].totalSets += setCount;
          totalSetsAllGroups += setCount;
        } else {
          muscleGroupMap['other'].totalSets += setCount;
          totalSetsAllGroups += setCount;
        }
      }
    }
    
    // Calculate percentage of total for each muscle group
    if (totalSetsAllGroups > 0) {
      for (const group of Object.values(muscleGroupMap)) {
        group.percentOfTotal = (group.totalSets / totalSetsAllGroups) * 100;
      }
    }
    
    // Process workout logs for detailed exercise breakdown with weighted contributions
    if (logs && logs.length > 0) {
      // Get date range for filtering logs
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (selectedWeek && filteredMetrics.length > 0) {
        // Use selected week's date range
        startDate = filteredMetrics[0].startDate;
        endDate = filteredMetrics[0].endDate;
      } else if (filteredMetrics.length > 0) {
        // Use all weeks in filtered metrics
        startDate = filteredMetrics[0].startDate;
        endDate = filteredMetrics[filteredMetrics.length - 1].endDate;
      }
      
      // Filter logs based on date range
      const filteredLogs = logs.filter(log => {
        if (!log.date) return false;
        
        try {
          const logDate = parseDate(log.date);
          if (!logDate) return false;
          
          // Include all logs if no date range specified
          if (!startDate || !endDate) return true;
          
          return logDate >= startDate && logDate <= endDate;
        } catch {
          return false;
        }
      });
      
      // Track exercise stats per muscle group with weighted contributions
      const exerciseStats: Record<string, Record<string, { 
        sets: number; 
        totalWeight: number; 
        reps: number;
        totalReps?: number;
        averageReps?: number;
        totalDuration?: number;
        totalDistance?: number;
        effortType?: 'reps' | 'time' | 'distance';
        isBodyweight?: boolean;
      }>> = {};
      
      // Initialize stats for each muscle group
      for (const muscleGroup of Object.keys(muscleGroupMap)) {
        exerciseStats[muscleGroup] = {};
      }
      
      // Process logs to gather exercise stats
      for (const log of filteredLogs) {
        if (!log.exercises) continue;
        
        for (const exercise of log.exercises) {
          if (!exercise || !exercise.name || !exercise.sets) continue;
          
          const setCount = exercise.sets.length;
          const muscleContributions = calculateMuscleGroupContribution(exercise.name, setCount, t);
          const effortType = exercise.effort_type || 'reps';
          const isBodyweight = isBodyweightExercise(exercise);
          
          // Process each muscle group contribution
          for (const [muscleGroup, contribution] of Object.entries(muscleContributions)) {
            const targetMap = exerciseStats[muscleGroup] || exerciseStats['other'];
            
            if (!targetMap[exercise.name]) {
              targetMap[exercise.name] = {
                sets: 0,
                totalWeight: 0,
                reps: 0,
                totalReps: 0,
                averageReps: 0,
                totalDuration: 0,
                totalDistance: 0,
                effortType,
                isBodyweight
              };
            }
            
            // Add the weighted contribution
            targetMap[exercise.name].sets += contribution;
            
            // Process each set for calculations
            for (const set of exercise.sets) {
              if (!set) continue;
              
              let weight = 0;
              let reps = 0;
              let duration = 0;
              let distance = 0;
              
              // Handle weight conversion to kg
              if (set.weight !== null && set.weight !== undefined && !isNaN(Number(set.weight))) {
                const weightUnit = set.weight_unit || 'kg';
                weight = formatWeightInKg(Number(set.weight), weightUnit);
              }
              
              if (set.reps !== null && set.reps !== undefined && !isNaN(Number(set.reps))) {
                reps = Number(set.reps);
              }
              
              if (set.duration !== null && set.duration !== undefined && !isNaN(Number(set.duration))) {
                duration = Number(set.duration);
              }
              
              if (set.distance !== null && set.distance !== undefined && !isNaN(Number(set.distance))) {
                distance = Number(set.distance);
              }
              
              if (effortType === 'reps' && reps > 0) {
                // Weight contribution proportional to muscle involvement
                const weightContribution = (weight * reps * contribution) / setCount;
                const repContribution = (reps * contribution) / setCount;
                
                targetMap[exercise.name].totalWeight += weightContribution;
                targetMap[exercise.name].reps += repContribution;
                targetMap[exercise.name].totalReps! += reps;
              } else if (effortType === 'time' && duration > 0) {
                const durationContribution = (duration * contribution) / setCount;
                targetMap[exercise.name].totalDuration! += durationContribution;
              } else if (effortType === 'distance' && distance > 0) {
                const distanceContribution = (distance * contribution) / setCount;
                targetMap[exercise.name].totalDistance! += distanceContribution;
              }
            }
          }
        }
      }
      
      // Convert to array format and attach to results
      for (const [muscleGroup, exercises] of Object.entries(exerciseStats)) {
        const exerciseArray: ExerciseSetsData[] = Object.entries(exercises)
          .map(([name, stats]) => {
            const result: ExerciseSetsData = {
              name,
              sets: Math.round(stats.sets * 10) / 10, // Round to 1 decimal place for weighted sets
              weight: stats.reps > 0 ? stats.totalWeight / stats.reps : 0,
              effortType: stats.effortType,
              isBodyweight: stats.isBodyweight
            };
            
            if (stats.effortType === 'reps') {
              result.totalReps = Math.round(stats.totalReps || 0);
              result.averageReps = result.totalReps > 0 ? Math.round((result.totalReps / stats.sets) * 10) / 10 : 0;
            } else if (stats.effortType === 'time') {
              result.totalDuration = Math.round((stats.totalDuration || 0) / 60 * 100) / 100; // Convert to minutes
            } else if (stats.effortType === 'distance') {
              result.totalDistance = Math.round((stats.totalDistance || 0) / 1000 * 100) / 100; // Convert to km
            }
            
            return result;
          })
          .sort((a, b) => b.sets - a.sets);
        
        if (muscleGroupMap[muscleGroup]) {
          muscleGroupMap[muscleGroup].exercises = exerciseArray;
        }
      }
    }
    
    // Filter out muscle groups with no sets and sort by total sets
    return Object.values(muscleGroupMap)
      .filter(group => group.totalSets > 0)
      .sort((a, b) => b.totalSets - a.totalSets);
  } catch (error) {
    console.error('Error calculating muscle group metrics:', error);
    return [];
  }
};

// Calculate max values for chart scaling with better defaults
export const getMaxMetrics = (weeklyMetrics: WeeklyMetrics[]) => {
  try {
    if (!weeklyMetrics || weeklyMetrics.length === 0) {
      return { maxWeight: 100, maxAvgWeight: 10, maxSets: 10 };
    }
    
    // Start with small non-zero values to avoid division by zero
    let maxWeight = 1; 
    let maxAvgWeight = 1;
    let maxSets = 1;
    
    // Calculate maximum values
    weeklyMetrics.forEach(week => {
      maxWeight = Math.max(maxWeight, week.totalWeightLifted || 0);
      maxAvgWeight = Math.max(maxAvgWeight, week.averageWeightPerRep || 0);
      maxSets = Math.max(maxSets, week.totalSets || 0);
    });
    
    // Add a small buffer (10%) for better visualization
    return { 
      maxWeight: maxWeight * 1.1, 
      maxAvgWeight: maxAvgWeight * 1.1, 
      maxSets: maxSets * 1.1 
    };
  } catch (error) {
    console.error('Error in getMaxMetrics:', error);
    return { maxWeight: 100, maxAvgWeight: 10, maxSets: 10 };
  }
};

// Get max sets per muscle group with better defaults
export const getMaxSetsPerMuscleGroup = (weeklyMetrics: WeeklyMetrics[], weekLabel?: string) => {
  try {
    // Filter for specific week if provided
    const targetWeeks = weekLabel 
      ? weeklyMetrics.filter(w => w.label === weekLabel)
      : weeklyMetrics;
    
    if (targetWeeks.length === 0) return 10;
    
    let maxSets = 1;
    
    // Find maximum sets across all muscle groups
    targetWeeks.forEach(week => {
      for (const setCount of Object.values(week.setsPerMuscleGroup)) {
        maxSets = Math.max(maxSets, setCount || 0);
      }
    });
    
    // Add a small buffer (10%) for better visualization
    return maxSets * 1.1;
  } catch (error) {
    console.error('Error getting max sets per muscle group:', error);
    return 10;
  }
};

// Get trend data for a specific metric
export const calculateMetricTrend = (
  weeklyMetrics: WeeklyMetrics[],
  metricKey: keyof WeeklyMetrics,
  periodCount: number = 4 // Number of periods to analyze
) => {
  try {
    if (!weeklyMetrics || weeklyMetrics.length < 2) {
      return { 
        trend: 'stable',
        avgChange: 0,
        percentChange: 0
      };
    }
    
    // Get the most recent weeks for trend analysis
    const recentWeeks = weeklyMetrics.slice(-Math.min(periodCount + 1, weeklyMetrics.length));
    
    // Calculate average change
    let totalChange = 0;
    let validPeriods = 0;
    
    for (let i = 1; i < recentWeeks.length; i++) {
      const current = recentWeeks[i][metricKey];
      const previous = recentWeeks[i-1][metricKey];
      
      if (typeof current === 'number' && typeof previous === 'number' && previous > 0) {
        totalChange += ((current - previous) / previous) * 100;
        validPeriods++;
      }
    }
    
    const avgChange = validPeriods > 0 ? totalChange / validPeriods : 0;
    
    // Calculate total percent change from first to last period
    const first = recentWeeks[0][metricKey];
    const last = recentWeeks[recentWeeks.length - 1][metricKey];
    const percentChange = (typeof first === 'number' && typeof last === 'number' && first > 0)
      ? ((last - first) / first) * 100
      : 0;
    
    // Determine trend direction
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (avgChange > 5) {
      trend = 'increasing';
    } else if (avgChange < -5) {
      trend = 'decreasing';
    }
    
    return {
      trend,
      avgChange,
      percentChange
    };
  } catch (error) {
    console.error(`Error calculating trend for ${String(metricKey)}:`, error);
    return { 
      trend: 'stable',
      avgChange: 0,
      percentChange: 0
    };
  }
};

// Format large numbers for display with kg units
export const formatWeight = (weight: number): string => {
  if (!isFinite(weight) || isNaN(weight)) return '0 kg';
  
  if (weight >= 1000000) {
    return `${(weight / 1000000).toFixed(1)}M kg`;
  } else if (weight >= 1000) {
    return `${(weight / 1000).toFixed(1)}k kg`;
  }
  
  // Round to nearest integer for better readability
  return `${Math.round(weight)} kg`;
};

// Format percentage changes
export const formatPercentChange = (percent: number): string => {
  if (!isFinite(percent) || isNaN(percent)) return '0%';
  
  const formattedValue = Math.abs(percent) < 0.1 
    ? '0' 
    : Math.abs(percent) < 10 
      ? percent.toFixed(1) 
      : Math.round(percent).toString();
      
  return `${percent >= 0 ? '+' : ''}${formattedValue}%`;
};

// Format duration for display
export const formatDuration = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

// Format distance for display
export const formatDistance = (meters: number): string => {
  if (!isFinite(meters) || isNaN(meters)) return '0m';
  
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  } else {
    return `${Math.round(meters)} m`;
  }
};