// src/api/services/logService.js
import apiClient from '../index';
import { extractData, formatLogData, transformLogs } from '../utils/responseParser';

/**
 * Service for workout logs API operations
 */
const logService = {

  getLogs: async () => {
    const response = await apiClient.get('/workouts/logs/');
    const logs = extractData(response);
    return transformLogs(logs);
  },

  getLogById: async (id) => {
    const response = await apiClient.get(`/workouts/logs/${id}/`);
    const log = response.data;
    console.log("LOG : ", log)
    return transformLogs([log])[0];
  },

  createLog: async (logData) => {
    const formattedData = formatLogData(logData);
    const response = await apiClient.post('/workouts/logs/', formattedData);
    return response.data;
  },

  updateLog: async (id, logData) => {
    const formattedData = formatLogData(logData);
    const response = await apiClient.patch(`/workouts/logs/${id}/`, formattedData);
    return response.data;
  },

  deleteLog: async (id) => {
    await apiClient.delete(`/workouts/logs/${id}/`);
  },

  calculateStats: (logs) => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyWorkouts = logs.filter(log => 
      new Date(log.date) >= oneWeekAgo && log.completed
    ).length;
    
    const totalWorkouts = logs.filter(log => log.completed).length;
    
    // Calculate streak
    let streak = 0;
    const dayMap = {};
    
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
        break;
      }
    }
    
    return { weeklyWorkouts, totalWorkouts, streak };
  },

  filterLogs: (logs, query) => {
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