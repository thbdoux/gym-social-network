// utils/analyticsUtils.ts
import { format, endOfWeek, subWeeks } from 'date-fns';
import { getPrimaryMuscleGroup } from './muscleMapping';

// Define interfaces that match the Django models and serializers
export interface SetLog {
  id?: number;
  reps: number;
  weight: number;
  rest_time: number;
  order: number;
}

export interface ExerciseLog {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order: number;
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
}

export interface MuscleGroupData {
  label: string;
  value: string;
}

export interface ExerciseData {
  label: string;
  value: string;
  muscleGroup?: string;
}

export interface ExerciseSetsData {
  name: string;
  sets: number;
}

export interface MuscleGroupMetrics {
  muscleGroup: string;
  totalSets: number;
  exercises: ExerciseSetsData[];
}

// Parse date string to Date object handling multiple formats
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Clean up the input string
  const trimmed = dateString.trim();
  
  // Try parsing as ISO format
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
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
    
    // Create and validate dates in both European (DD/MM) and US (MM/DD) formats
    // Prioritize European format as requested
    
    // Try European format (DD/MM/YYYY)
    if (first <= 31 && second <= 12) {
      const date = new Date(year, second - 1, first);
      
      // Validate the parsed date matches the input values
      if (!isNaN(date.getTime()) && 
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
      if (!isNaN(date.getTime()) && 
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
      
      if (!isNaN(date.getTime()) && 
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

// Get unique muscle groups from logs (limit to 10 max)
export const getMuscleGroups = (logs: WorkoutLog[]): MuscleGroupData[] => {
  const muscleGroups = new Set<string>();
  
  // Check only the latest 20 logs to improve performance
  const recentLogs = logs.slice(-20);
  
  try {
    for (const log of recentLogs) {
      if (!log.exercises || !Array.isArray(log.exercises)) continue;
      
      for (const exercise of log.exercises) {
        if (!exercise) continue;
        
        // Get muscle group using our improved utility
        const muscleGroup = exercise.muscle_group || getPrimaryMuscleGroup(exercise.name);
        
        if (muscleGroup) {
          muscleGroups.add(muscleGroup);
        }
        
        // Limit to 10 groups max
        if (muscleGroups.size >= 10) break;
      }
      if (muscleGroups.size >= 10) break;
    }
  } catch (error) {
    console.error('Error extracting muscle groups:', error);
  }
  
  return Array.from(muscleGroups)
    .sort() // Sort alphabetically
    .map(group => ({
      label: group.charAt(0).toUpperCase() + group.slice(1), // Capitalize first letter
      value: group
    }));
};

// Get unique exercises from logs, optionally filtered by muscle group (limit to 20 max)
export const getExercises = (logs: WorkoutLog[], muscleGroup?: string): ExerciseData[] => {
  const exercises = new Map<string, ExerciseData>();
  
  // Check only the latest 20 logs to improve performance
  const recentLogs = logs.slice(-20);
  
  try {
    for (const log of recentLogs) {
      if (!log.exercises || !Array.isArray(log.exercises)) continue;
      
      for (const exercise of log.exercises) {
        if (!exercise || !exercise.name) continue;
        
        // Get muscle group for this exercise using our improved utility
        const exerciseMuscleGroup = exercise.muscle_group || getPrimaryMuscleGroup(exercise.name);
        
        // Apply filter if provided
        if (!muscleGroup || exerciseMuscleGroup === muscleGroup) {
          if (!exercises.has(exercise.name)) {
            exercises.set(exercise.name, {
              label: exercise.name,
              value: exercise.name,
              muscleGroup: exerciseMuscleGroup
            });
            
            // Limit to 20 exercises max
            if (exercises.size >= 20) break;
          }
        }
      }
      if (exercises.size >= 20) break;
    }
  } catch (error) {
    console.error('Error extracting exercises:', error);
  }
  
  return Array.from(exercises.values())
    .sort((a, b) => a.label.localeCompare(b.label));
};

// Calculate weekly metrics from workout logs
export const calculateWeeklyMetrics = (
  logs: WorkoutLog[],
  numWeeks: number = 16,
  selectedMuscleGroup?: string,
  selectedExercise?: string
): WeeklyMetrics[] => {
  try {
    // Safety checks
    if (!logs || logs.length === 0) return [];
    
    // Filter out incomplete logs
    const completedLogs = logs.filter(log => log.completed);
    if (completedLogs.length === 0) return [];
    
    // Use fewer weeks if there aren't enough logs
    const actualNumWeeks = Math.min(numWeeks, 20); // Limit to 20 weeks max
    
    // Calculate week boundaries
    const today = new Date();
    const weeks: Date[] = [];
    
    // Generate just the week start dates in reverse (most recent first)
    for (let i = 0; i < actualNumWeeks; i++) {
      weeks.push(subWeeks(today, i));
    }
    
    // Sort weeks in chronological order
    weeks.sort((a, b) => a.getTime() - b.getTime());
    
    // Calculate metrics for each week
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Filter logs for this week
      const weekLogs = completedLogs.filter(log => {
        if (!log.date) return false;
        
        try {
          // Use our custom date parser
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
      const setsPerMuscleGroup: Record<string, number> = {};
      
      // Initialize sets per muscle group counter
      ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio', 'other'].forEach(group => {
        setsPerMuscleGroup[group] = 0;
      });
      
      // Process week logs
      for (const log of weekLogs) {
        if (!log.exercises || !Array.isArray(log.exercises)) continue;
        
        for (const exercise of log.exercises) {
          if (!exercise) continue;
          
          // Get muscle group for this exercise using our improved utility
          const exerciseMuscleGroup = exercise.muscle_group || getPrimaryMuscleGroup(exercise.name);
          
          // Skip if doesn't match filters
          if (
            (selectedMuscleGroup && exerciseMuscleGroup !== selectedMuscleGroup) ||
            (selectedExercise && exercise.name !== selectedExercise)
          ) {
            continue;
          }
          
          if (!exercise.sets || !Array.isArray(exercise.sets)) continue;
          
          for (const set of exercise.sets) {
            if (!set) continue;
            
            // Handle weight as string or number (API might return either)
            let weight = 0;
            let reps = 0;
            
            if (typeof set.weight === 'string') {
              weight = parseFloat(set.weight);
            } else if (typeof set.weight === 'number') {
              weight = set.weight;
            }
            
            if (typeof set.reps === 'string') {
              reps = parseInt(set.reps);
            } else if (typeof set.reps === 'number') {
              reps = set.reps;
            }
            
            if (!isNaN(weight) && !isNaN(reps)) {
              totalWeight += weight * reps;
              totalReps += reps;
              setCount++;
              
              // Increment sets for this muscle group
              if (exerciseMuscleGroup && setsPerMuscleGroup[exerciseMuscleGroup] !== undefined) {
                setsPerMuscleGroup[exerciseMuscleGroup]++;
              } else {
                setsPerMuscleGroup['other'] = (setsPerMuscleGroup['other'] || 0) + 1;
              }
            }
          }
        }
      }
      
      // Format date range for label
      const weekLabel = format(weekStart, 'MMM d');
      
      return {
        startDate: weekStart,
        endDate: weekEnd,
        label: weekLabel,
        totalWeightLifted: totalWeight,
        averageWeightPerRep: totalReps > 0 ? totalWeight / totalReps : 0,
        totalSets: setCount,
        setsPerMuscleGroup,
        workoutCount: weekLogs.length
      };
    });
  } catch (error) {
    console.error('Error in calculateWeeklyMetrics:', error);
    return [];
  }
};

// Calculate muscle group metrics from weekly metrics
export const calculateMuscleGroupMetrics = (
  weeklyMetrics: WeeklyMetrics[],
  selectedWeek?: string,
  logs?: WorkoutLog[]
): MuscleGroupMetrics[] => {
  try {
    // Filter weekly metrics if a specific week is selected
    const filteredMetrics = selectedWeek 
      ? weeklyMetrics.filter(week => week.label === selectedWeek)
      : weeklyMetrics;
    
    // Initialize results
    const muscleGroupMap: Record<string, MuscleGroupMetrics> = {};
    
    // Initialize with all muscle groups
    ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio', 'other'].forEach(group => {
      muscleGroupMap[group] = {
        muscleGroup: group.charAt(0).toUpperCase() + group.slice(1), // Capitalize first letter
        totalSets: 0,
        exercises: []
      };
    });
    
    // Aggregate sets per muscle group across all weeks
    for (const week of filteredMetrics) {
      for (const [muscleGroup, setCount] of Object.entries(week.setsPerMuscleGroup)) {
        if (muscleGroupMap[muscleGroup]) {
          muscleGroupMap[muscleGroup].totalSets += setCount;
        } else {
          muscleGroupMap['other'].totalSets += setCount;
        }
      }
    }
    
    // If logs are provided and a specific week is selected, calculate exercise breakdown
    if (logs && logs.length > 0 && selectedWeek) {
      const selectedWeekData = filteredMetrics[0];
      
      if (selectedWeekData) {
        // Get all logs from this week
        const weekLogs = logs.filter(log => {
          if (!log.date) return false;
          
          try {
            const logDate = parseDate(log.date);
            if (!logDate) return false;
            
            return logDate >= selectedWeekData.startDate && logDate <= selectedWeekData.endDate;
          } catch {
            return false;
          }
        });
        
        // Track exercise sets per muscle group
        const exerciseSets: Record<string, Record<string, number>> = {};
        
        // Initialize
        for (const muscleGroup of Object.keys(muscleGroupMap)) {
          exerciseSets[muscleGroup] = {};
        }
        
        // Count sets per exercise per muscle group
        for (const log of weekLogs) {
          if (!log.exercises) continue;
          
          for (const exercise of log.exercises) {
            if (!exercise || !exercise.name || !exercise.sets) continue;
            
            const muscleGroup = exercise.muscle_group || getPrimaryMuscleGroup(exercise.name);
            const targetMap = exerciseSets[muscleGroup] || exerciseSets['other'];
            
            targetMap[exercise.name] = (targetMap[exercise.name] || 0) + exercise.sets.length;
          }
        }
        
        // Convert to array format and attach to results
        for (const [muscleGroup, exercises] of Object.entries(exerciseSets)) {
          const exerciseArray: ExerciseSetsData[] = Object.entries(exercises)
            .map(([name, sets]) => ({ name, sets }))
            .sort((a, b) => b.sets - a.sets);
          
          if (muscleGroupMap[muscleGroup]) {
            muscleGroupMap[muscleGroup].exercises = exerciseArray;
          }
        }
      }
    } else if (logs && logs.length > 0) {
      // If no specific week is selected, calculate exercise breakdown for all time
      // Track exercise sets per muscle group
      const exerciseSets: Record<string, Record<string, number>> = {};
      
      // Initialize
      for (const muscleGroup of Object.keys(muscleGroupMap)) {
        exerciseSets[muscleGroup] = {};
      }
      
      // Count sets per exercise per muscle group
      for (const log of logs) {
        if (!log.exercises) continue;
        
        for (const exercise of log.exercises) {
          if (!exercise || !exercise.name || !exercise.sets) continue;
          
          const muscleGroup = exercise.muscle_group || getPrimaryMuscleGroup(exercise.name);
          const targetMap = exerciseSets[muscleGroup] || exerciseSets['other'];
          
          targetMap[exercise.name] = (targetMap[exercise.name] || 0) + exercise.sets.length;
        }
      }
      
      // Convert to array format and attach to results
      for (const [muscleGroup, exercises] of Object.entries(exerciseSets)) {
        const exerciseArray: ExerciseSetsData[] = Object.entries(exercises)
          .map(([name, sets]) => ({ name, sets }))
          .sort((a, b) => b.sets - a.sets);
        
        if (muscleGroupMap[muscleGroup]) {
          muscleGroupMap[muscleGroup].exercises = exerciseArray;
        }
      }
    }
    
    // Filter out muscle groups with no sets
    return Object.values(muscleGroupMap)
      .filter(group => group.totalSets > 0);
  } catch (error) {
    console.error('Error calculating muscle group metrics:', error);
    return [];
  }
};

// Calculate max values for chart scaling (with safety checks)
export const getMaxMetrics = (weeklyMetrics: WeeklyMetrics[]) => {
  try {
    if (!weeklyMetrics || weeklyMetrics.length === 0) {
      return { maxWeight: 100, maxAvgWeight: 10, maxSets: 10 };
    }
    
    let maxWeight = 1; // Start with 1 to avoid division by zero
    let maxAvgWeight = 1;
    let maxSets = 1;
    
    weeklyMetrics.forEach(week => {
      maxWeight = Math.max(maxWeight, week.totalWeightLifted || 0);
      maxAvgWeight = Math.max(maxAvgWeight, week.averageWeightPerRep || 0);
      maxSets = Math.max(maxSets, week.totalSets || 0);
    });
    
    return { maxWeight, maxAvgWeight, maxSets };
  } catch (error) {
    console.error('Error in getMaxMetrics:', error);
    return { maxWeight: 100, maxAvgWeight: 10, maxSets: 10 };
  }
};

// Get max sets per muscle group for a given week
export const getMaxSetsPerMuscleGroup = (weeklyMetrics: WeeklyMetrics[], weekLabel?: string) => {
  try {
    // Filter for specific week if provided
    const targetWeeks = weekLabel 
      ? weeklyMetrics.filter(w => w.label === weekLabel)
      : weeklyMetrics;
    
    if (targetWeeks.length === 0) return 10;
    
    let maxSets = 1;
    
    targetWeeks.forEach(week => {
      for (const setCount of Object.values(week.setsPerMuscleGroup)) {
        maxSets = Math.max(maxSets, setCount || 0);
      }
    });
    
    return maxSets;
  } catch (error) {
    console.error('Error getting max sets per muscle group:', error);
    return 10;
  }
};

// Format large numbers for display
export const formatWeight = (weight: number): string => {
  if (!isFinite(weight) || isNaN(weight)) return '0';
  
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(1)}k`;
  }
  return weight.toFixed(0);
};