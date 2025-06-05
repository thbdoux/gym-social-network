// api/services/logService.ts
import apiClient from '../index';
import { extractData, formatLogData, transformLogs } from '../utils/responseParser';

interface Exercise {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order?: number;
  effort_type?: 'reps' | 'time' | 'distance';
  effort_type_display?: string;
  superset_with?: number | null;
  is_superset?: boolean;
  superset_rest_time?: number;
  sets: Array<{
    id?: number;
    reps?: number | null;
    weight?: number | null;
    weight_unit?: 'kg' | 'lbs';
    weight_unit_display?: string;
    weight_display?: string;
    duration?: number | null;
    distance?: number | null;
    rest_time: number;
    order?: number;
  }>;
}

interface Log {
  id?: number;
  date: string;
  name: string;
  notes?: string;
  duration?: number; 
  gym?: number | null;   
  gym_name?: string;          
  location?: string;         
  mood_rating?: number;
  perceived_difficulty?: string;  
  completed?: boolean;
  exercises: Exercise[];
  program_id?: number | null;
  program_workout_id?: number | null;
  template_id?: number | null;
  tags?: string[];
  source_type?: 'none' | 'program' | 'template';
  username?: string;          // User who created the log
  // New workout partners fields
  workout_partners?: number[];           // Array of user IDs
  workout_partners_usernames?: string[]; // Array of usernames
  workout_partners_details?: Array<{     // Detailed partner info
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  }>;
  [key: string]: any;
}

interface LogStats {
  weeklyWorkouts: number;
  totalWorkouts: number;
  streak: number;
}

/**
 * Service for workout logs API operations
 */
const logService = {

  getLogs: async (): Promise<Log[]> => {
    const response = await apiClient.get('/workouts/logs/');
    const logs = extractData(response);
    return transformLogs(logs);
  },

  /**
   * Get logs for a specific user by username
   */
   getLogsByUsername: async (username: string): Promise<Log[]> => {
    const response = await apiClient.get(`/workouts/logs/user/${username}/`);
    const logs = extractData(response);
    return transformLogs(logs);
  },

  getLogById: async (id: number): Promise<Log> => {
    const response = await apiClient.get(`/workouts/logs/${id}/`);
    const log = response.data;
    return transformLogs([log])[0];
  },

  createLog: async (logData: Log): Promise<Log> => {
    // Ensure workout_partners is properly formatted for the backend
    const formattedData = {
      ...logData,
      // Convert workout_partners to proper format if needed
      workout_partners: logData.workout_partners || [],
      // Ensure exercises have proper effort_type and weight units
      exercises: logData.exercises.map(exercise => ({
        ...exercise,
        effort_type: exercise.effort_type || 'reps',
        sets: exercise.sets.map((set, idx) => ({
          ...set,
          weight_unit: set.weight_unit || 'kg',
          order: set.order || idx
        }))
      }))
    };
    
    const response = await apiClient.post('/workouts/logs/', formattedData);
    return response.data;
  },

  updateLog: async (id: number, logData: Partial<Log>): Promise<Log> => {
    // Format the data similar to create
    const formattedData = {
      ...logData,
      // Ensure exercises have proper effort_type and weight units if provided
      exercises: logData.exercises ? logData.exercises.map(exercise => ({
        ...exercise,
        effort_type: exercise.effort_type || 'reps',
        sets: exercise.sets.map((set, idx) => ({
          ...set,
          weight_unit: set.weight_unit || 'kg',
          order: set.order || idx
        }))
      })) : undefined
    };
    
    const response = await apiClient.patch(`/workouts/logs/${id}/`, formattedData);
    return response.data;
  },

  deleteLog: async (id: number): Promise<void> => {
    await apiClient.delete(`/workouts/logs/${id}/`);
  },

  /**
   * Get logs where the current user was a workout partner
   */
  getLogsAsPartner: async (): Promise<Log[]> => {
    const response = await apiClient.get('/workouts/logs/with_partners/');
    const logs = extractData(response);
    return transformLogs(logs);
  },

  /**
   * Create a log from a workout instance (program workout)
   */
  createLogFromInstance: async (instanceData: {
    instance_id: number;
    date: string;
    gym_id?: number;
    notes?: string;
    mood_rating?: number;
    perceived_difficulty?: number;
    performance_notes?: string;
    completed?: boolean;
    workout_partners?: number[];
  }): Promise<Log> => {
    const response = await apiClient.post('/workouts/logs/log_from_instance/', instanceData);
    return response.data;
  },

  calculateStats: (logs: Log[]): LogStats => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyWorkouts = logs.filter(log => 
      new Date(log.date) >= oneWeekAgo && log.completed
    ).length;
    
    const totalWorkouts = logs.filter(log => log.completed).length;
    
    // Calculate streak
    let streak = 0;
    const dayMap: Record<string, boolean> = {};
    
    // Map logs to days
    logs.forEach(log => {
      if (log.completed) {
        const dateStr = new Date(log.date).toDateString();
        dayMap[dateStr] = true;
      }
    });
    
    // Count streak
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toDateString();
      
      if (dayMap[checkDateStr]) {
        streak++;
      } else if (i < 7) {
        // Break only if we're within the first week and found a gap
        break;
      }
    }
    
    return { weeklyWorkouts, totalWorkouts, streak };
  },

  filterLogs: (logs: Log[], query?: string): Log[] => {
    if (!query) return logs;
    
    const searchQuery = query.toLowerCase();
    return logs.filter(log => (
      (log.workout_name && log.workout_name.toLowerCase().includes(searchQuery)) ||
      (log.gym_name && log.gym_name.toLowerCase().includes(searchQuery)) ||
      (log.exercises && log.exercises.some(ex => ex.name.toLowerCase().includes(searchQuery))) ||
      (log.workout_partners_usernames && log.workout_partners_usernames.some(username => 
        username.toLowerCase().includes(searchQuery)
      ))
    ));
  },

  /**
   * Utility functions for working with different exercise types
   */
  getExerciseDisplayValue: (exercise: Exercise, setIndex: number = 0): string => {
    const set = exercise.sets[setIndex];
    if (!set) return 'No data';

    switch (exercise.effort_type) {
      case 'time':
        if (set.duration) {
          const minutes = Math.floor(set.duration / 60);
          const seconds = set.duration % 60;
          const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          return set.weight && set.weight > 0 
            ? `${timeStr} @ ${set.weight_display || `${set.weight}${set.weight_unit || 'kg'}`}`
            : timeStr;
        }
        return 'Time not set';
      
      case 'distance':
        if (set.distance) {
          const distanceStr = `${set.distance}m`;
          return set.duration 
            ? `${distanceStr} in ${Math.floor(set.duration / 60)}:${String(set.duration % 60).padStart(2, '0')}`
            : distanceStr;
        }
        return 'Distance not set';
      
      case 'reps':
      default:
        if (set.reps) {
          return set.weight && set.weight > 0 
            ? `${set.reps} reps @ ${set.weight_display || `${set.weight}${set.weight_unit || 'kg'}`}`
            : `${set.reps} reps`;
        }
        return 'Reps not set';
    }
  },

  calculateTotalVolume: (exercises: Exercise[], targetUnit: 'kg' | 'lbs' = 'kg'): number => {
    let totalVolume = 0;
    
    exercises.forEach(exercise => {
      if (exercise.effort_type === 'reps') {
        exercise.sets.forEach(set => {
          if (set.reps && set.weight) {
            let weight = set.weight;
            
            // Convert weight if needed
            if (set.weight_unit !== targetUnit) {
              if (set.weight_unit === 'lbs' && targetUnit === 'kg') {
                weight = weight * 0.453592;
              } else if (set.weight_unit === 'kg' && targetUnit === 'lbs') {
                weight = weight * 2.20462;
              }
            }
            
            totalVolume += weight * set.reps;
          }
        });
      }
    });
    
    return Math.round(totalVolume * 100) / 100; // Round to 2 decimal places
  }
};

export default logService;