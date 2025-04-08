// api/services/logService.ts
import apiClient from '../index';
import { extractData, formatLogData, transformLogs } from '../utils/responseParser';

interface Exercise {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order?: number;
  superset_with?: number | null;
  is_superset?: boolean;
  superset_rest_time?: number;
  sets: Array<{
    id?: number;
    reps: number;
    weight: number;
    rest_time: number;
  }>;
}

interface Log {
  id?: number;
  date: string;
  name: string;
  notes?: string;
  duration?: number;
  gym?: number | { id: number; name: string };
  mood_rating?: number;
  energy_level?: number;
  perceived_difficulty?: number;
  completed: boolean;
  exercises: Exercise[];
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

  getLogById: async (id: number): Promise<Log> => {
    const response = await apiClient.get(`/workouts/logs/${id}/`);
    const log = response.data;
    return transformLogs([log])[0];
  },

  createLog: async (logData: Log): Promise<Log> => {
    const formattedData = formatLogData(logData);
    const response = await apiClient.post('/workouts/logs/', formattedData);
    return response.data;
  },

  updateLog: async (id: number, logData: Partial<Log>): Promise<Log> => {
    const formattedData = formatLogData(logData);
    const response = await apiClient.patch(`/workouts/logs/${id}/`, formattedData);
    return response.data;
  },

  deleteLog: async (id: number): Promise<void> => {
    await apiClient.delete(`/workouts/logs/${id}/`);
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
      (log.exercises && log.exercises.some(ex => ex.name.toLowerCase().includes(searchQuery)))
    ));
  }
};

export default logService;