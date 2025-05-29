// utils/analyticsUtils.ts
import { format, endOfWeek, subWeeks, isValid, startOfWeek } from 'date-fns';
import { getPrimaryMuscleGroup } from './muscleMapping';
import { calculateMuscleGroupContribution, getAllExercises, getExerciseName } from '../../../../components/workouts/data/exerciseData';

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
  // Added fields for trend analysis
  percentChangeFromPrevious?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
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
}

export interface ExerciseSetsData {
  name: string;
  sets: number;
  weight?: number; // Average weight used
}

export interface MuscleGroupMetrics {
  muscleGroup: string;
  totalSets: number;
  exercises: ExerciseSetsData[];
  percentOfTotal?: number; // Percentage of total workout volume
}

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

// Get all unique muscle groups from logs with weighted contribution system
export const getMuscleGroups = (logs: WorkoutLog[]): MuscleGroupData[] => {
  const muscleGroupMap = new Map<string, number>();
  
  try {
    for (const log of logs) {
      if (!log.exercises || !Array.isArray(log.exercises)) continue;
      
      for (const exercise of log.exercises) {
        if (!exercise || !exercise.sets || !Array.isArray(exercise.sets)) continue;
        
        const setCount = exercise.sets.length;
        
        // Use the new weighted contribution system
        const muscleContribution = calculateMuscleGroupContribution(exercise.name, setCount);
        
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
export const getExercises = (logs: WorkoutLog[], muscleGroup?: string): ExerciseData[] => {
  const exerciseMap = new Map<string, { muscleGroup?: string; count: number }>();
  
  try {
    for (const log of logs) {
      if (!log.exercises || !Array.isArray(log.exercises)) continue;
      
      for (const exercise of log.exercises) {
        if (!exercise || !exercise.name) continue;
        
        // Get muscle group for this exercise using the enhanced system
        let exerciseMuscleGroup: string;
        
        // First try to find the exercise in our database
        const exerciseData = getAllExercises().find(ex => 
          getExerciseName(ex, 'en').toLowerCase() === exercise.name.toLowerCase()
        );
        
        if (exerciseData && exerciseData.targetMuscleKey) {
          exerciseMuscleGroup = exerciseData.targetMuscleKey.replace('muscle_', '');
        } else {
          // Fallback to the old muscle mapping system
          exerciseMuscleGroup = exercise.muscle_group || getPrimaryMuscleGroup(exercise.name);
        }
        
        // Apply filter if provided - check if the exercise targets the filtered muscle group
        // (either as primary or secondary muscle)
        if (muscleGroup) {
          let exerciseMatchesFilter = false;
          
          if (exerciseData) {
            // Check primary muscle
            const primaryMuscle = exerciseData.targetMuscleKey?.replace('muscle_', '');
            if (primaryMuscle === muscleGroup) {
              exerciseMatchesFilter = true;
            }
            
            // Check secondary muscles
            if (!exerciseMatchesFilter && exerciseData.secondaryMuscleKeys) {
              const secondaryMuscles = exerciseData.secondaryMuscleKeys.map(key => key.replace('muscle_', ''));
              if (secondaryMuscles.includes(muscleGroup)) {
                exerciseMatchesFilter = true;
              }
            }
          } else {
            // Fallback to simple string comparison
            exerciseMatchesFilter = exerciseMuscleGroup === muscleGroup;
          }
          
          if (!exerciseMatchesFilter) continue;
        }
        
        const existing = exerciseMap.get(exercise.name);
        if (existing) {
          exerciseMap.set(exercise.name, { 
            muscleGroup: exerciseMuscleGroup,
            count: existing.count + 1 
          });
        } else {
          exerciseMap.set(exercise.name, { 
            muscleGroup: exerciseMuscleGroup,
            count: 1 
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
      count: data.count
    }));
};

// Calculate weekly metrics from workout logs with weighted muscle group system
export const calculateWeeklyMetrics = (
  logs: WorkoutLog[],
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
      const setsPerMuscleGroup: Record<string, number> = {};
      const weightPerMuscleGroup: Record<string, number> = {};
      
      // Initialize sets per muscle group counter with all known muscle groups
      const allMuscleGroups = [
        'pectorals', 'upper_pectorals', 'lower_pectorals',
        'latissimus_dorsi', 'upper_back', 'middle_back', 'lower_back', 'rhomboids',
        'deltoids', 'anterior_deltoids', 'lateral_deltoids', 'posterior_deltoids', 'trapezius',
        'biceps', 'triceps', 'brachialis_biceps', 'forearms',
        'quadriceps', 'hamstrings', 'glutes', 'calves', 'quadriceps_glutes', 'hamstrings_glutes', 'hamstrings_lower_back',
        'core', 'rectus_abdominis', 'obliques', 'lower_abs', 'deep_core_stabilizers', 'full_core', 'core_hip_flexors', 'rectus_abdominis_obliques',
        'cardiovascular_system', 'cardiovascular_system_full_body', 'cardiovascular_system_legs', 'cardiovascular_system_upper_body',
        'full_body', 'shoulders_core', 'grip_core_legs',
        'other'
      ];
      
      allMuscleGroups.forEach(group => {
        setsPerMuscleGroup[group] = 0;
        weightPerMuscleGroup[group] = 0;
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
          
          let exerciseWeight = 0;
          let exerciseReps = 0;
          let exerciseSets = 0;
          
          // Calculate total sets for this exercise
          const validSets = exercise.sets.filter(set => set && !isNaN(Number(set.reps)) && !isNaN(Number(set.weight)));
          exerciseSets = validSets.length;
          
          if (exerciseSets === 0) continue;
          
          // Calculate muscle group contributions for this exercise
          const muscleContributions = calculateMuscleGroupContribution(exercise.name, exerciseSets);
          
          // Check if any of the muscle groups match the filter
          if (selectedMuscleGroup) {
            const muscleGroupMatches = Object.keys(muscleContributions).some(muscle => 
              muscle === selectedMuscleGroup || muscle.includes(selectedMuscleGroup)
            );
            
            if (!muscleGroupMatches) continue;
          }
          
          // Process each set for weight and rep calculations
          for (const set of validSets) {
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
              const setWeight = weight * reps;
              totalWeight += setWeight;
              totalReps += reps;
              setCount++;
              exerciseWeight += setWeight;
              exerciseReps += reps;
            }
          }
          
          // Distribute the weight and sets across muscle groups based on contribution
          for (const [muscleGroup, contribution] of Object.entries(muscleContributions)) {
            if (setsPerMuscleGroup[muscleGroup] !== undefined) {
              setsPerMuscleGroup[muscleGroup] += contribution;
              weightPerMuscleGroup[muscleGroup] += exerciseWeight * (contribution / exerciseSets);
            } else {
              // Handle unmapped muscle groups
              setsPerMuscleGroup['other'] = (setsPerMuscleGroup['other'] || 0) + contribution;
              weightPerMuscleGroup['other'] = (weightPerMuscleGroup['other'] || 0) + (exerciseWeight * (contribution / exerciseSets));
            }
          }
        }
      }
      
      // Format date label
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

// Calculate muscle group metrics with enhanced details and weighted contributions
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
    
    // Initialize with all muscle groups (using more specific muscle names now)
    const allMuscleGroups = [
      'pectorals', 'upper_pectorals', 'lower_pectorals',
      'latissimus_dorsi', 'upper_back', 'middle_back', 'lower_back', 'rhomboids',
      'deltoids', 'anterior_deltoids', 'lateral_deltoids', 'posterior_deltoids', 'trapezius',
      'biceps', 'triceps', 'brachialis_biceps', 'forearms',
      'quadriceps', 'hamstrings', 'glutes', 'calves', 'quadriceps_glutes', 'hamstrings_glutes',
      'core', 'rectus_abdominis', 'obliques', 'lower_abs', 'deep_core_stabilizers', 'full_core',
      'cardiovascular_system', 'cardiovascular_system_full_body', 'cardiovascular_system_legs',
      'full_body', 'shoulders_core', 'grip_core_legs',
      'other'
    ];
    
    allMuscleGroups.forEach(group => {
      muscleGroupMap[group] = {
        muscleGroup: group.charAt(0).toUpperCase() + group.slice(1).replace(/_/g, ' '), // Capitalize and format
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
      const exerciseStats: Record<string, Record<string, { sets: number, totalWeight: number, reps: number }>> = {};
      
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
          const muscleContributions = calculateMuscleGroupContribution(exercise.name, setCount);
          
          // Process each muscle group contribution
          for (const [muscleGroup, contribution] of Object.entries(muscleContributions)) {
            const targetMap = exerciseStats[muscleGroup] || exerciseStats['other'];
            
            if (!targetMap[exercise.name]) {
              targetMap[exercise.name] = {
                sets: 0,
                totalWeight: 0,
                reps: 0
              };
            }
            
            // Add the weighted contribution
            targetMap[exercise.name].sets += contribution;
            
            // Process each set for weight calculation
            for (const set of exercise.sets) {
              if (!set) continue;
              
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
                // Weight contribution proportional to muscle involvement
                const weightContribution = (weight * reps * contribution) / setCount;
                const repContribution = (reps * contribution) / setCount;
                
                targetMap[exercise.name].totalWeight += weightContribution;
                targetMap[exercise.name].reps += repContribution;
              }
            }
          }
        }
      }
      
      // Convert to array format and attach to results
      for (const [muscleGroup, exercises] of Object.entries(exerciseStats)) {
        const exerciseArray: ExerciseSetsData[] = Object.entries(exercises)
          .map(([name, stats]) => ({
            name,
            sets: Math.round(stats.sets * 10) / 10, // Round to 1 decimal place for weighted sets
            weight: stats.reps > 0 ? stats.totalWeight / stats.reps : 0
          }))
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

// Calculate max values for chart scaling with better defaults (unchanged)
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

// Get max sets per muscle group with better defaults (unchanged)
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

// Get trend data for a specific metric (unchanged)
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

// Format large numbers for display (unchanged)
export const formatWeight = (weight: number): string => {
  if (!isFinite(weight) || isNaN(weight)) return '0';
  
  if (weight >= 1000000) {
    return `${(weight / 1000000).toFixed(1)}M`;
  } else if (weight >= 1000) {
    return `${(weight / 1000).toFixed(1)}k`;
  }
  
  // Round to nearest integer for better readability
  return Math.round(weight).toString();
};

// Format percentage changes (unchanged)
export const formatPercentChange = (percent: number): string => {
  if (!isFinite(percent) || isNaN(percent)) return '0%';
  
  const formattedValue = Math.abs(percent) < 0.1 
    ? '0' 
    : Math.abs(percent) < 10 
      ? percent.toFixed(1) 
      : Math.round(percent).toString();
      
  return `${percent >= 0 ? '+' : ''}${formattedValue}%`;
};