// hooks/query/useLogQuery.ts
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { logService } from '../../api/services';
import { calculateTotalVolume, calculateWorkoutDuration } from '../../utils/workoutUtils';

// Query keys
export const logKeys = {
  all: ['logs'],
  lists: () => [...logKeys.all, 'list'],
  list: (filters) => [...logKeys.lists(), { ...filters }],
  userLogs: (username) => [...logKeys.lists(), 'user', username],
  partnerLogs: () => [...logKeys.lists(), 'partner'],
  details: () => [...logKeys.all, 'detail'],
  detail: (id) => [...logKeys.details(), id],
  stats: () => [...logKeys.all, 'stats'],
  userStats: (username) => [...logKeys.stats(), 'user', username],
  analytics: () => [...logKeys.all, 'analytics'],
  volume: (filters) => [...logKeys.analytics(), 'volume', filters],
};

// Get all workout logs
export const useLogs = (filters = {}) => {
  return useQuery({
    queryKey: logKeys.list(filters),
    queryFn: async () => {
      const logs = await logService.getLogs();
      
      // Apply filters if they exist
      if (Object.keys(filters).length > 0) {
        return logService.filterLogs(logs, filters.query);
      }
      
      return logs;
    },
  });
};

// Get logs for a specific user
export const useUserLogs = (username) => {
  return useQuery({
    queryKey: logKeys.userLogs(username),
    queryFn: () => logService.getLogsByUsername(username),
    enabled: !!username,
  });
};

// Get logs where current user was a workout partner
export const usePartnerLogs = () => {
  return useQuery({
    queryKey: logKeys.partnerLogs(),
    queryFn: logService.getLogsAsPartner,
  });
};

// Get log by id
export const useLog = (logId) => {
  return useQuery({
    queryKey: logKeys.detail(logId),
    queryFn: () => logService.getLogById(logId),
    enabled: !!logId,
  });
};

// Create log
export const useCreateLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: logService.createLog,
    onSuccess: (newLog) => {
      // Update logs list
      queryClient.setQueryData(logKeys.lists(), (oldData) => {
        if (!oldData) return [newLog];
        return [...oldData, newLog];
      });
      
      // Update user logs if applicable
      if (newLog.username) {
        queryClient.setQueryData(logKeys.userLogs(newLog.username), (oldData) => {
          if (!oldData) return [newLog];
          return [...oldData, newLog];
        });
      }
      
      // Update partner logs if current user is a partner in this log
      if (newLog.workout_partners && newLog.workout_partners.length > 0) {
        queryClient.invalidateQueries({ queryKey: logKeys.partnerLogs() });
      }
      
      // Set individual log data
      queryClient.setQueryData(logKeys.detail(newLog.id), newLog);
      
      // Invalidate stats and analytics since a new log affects them
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      queryClient.invalidateQueries({ queryKey: logKeys.analytics() });
      if (newLog.username) {
        queryClient.invalidateQueries({ queryKey: logKeys.userStats(newLog.username) });
      }
    },
  });
};

// Create log from workout instance
export const useCreateLogFromInstance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: logService.createLogFromInstance,
    onSuccess: (newLog) => {
      // Update logs list
      queryClient.setQueryData(logKeys.lists(), (oldData) => {
        if (!oldData) return [newLog];
        return [...oldData, newLog];
      });
      
      // Update user logs if applicable
      if (newLog.username) {
        queryClient.setQueryData(logKeys.userLogs(newLog.username), (oldData) => {
          if (!oldData) return [newLog];
          return [...oldData, newLog];
        });
      }
      
      // Update partner logs if current user is a partner in this log
      if (newLog.workout_partners && newLog.workout_partners.length > 0) {
        queryClient.invalidateQueries({ queryKey: logKeys.partnerLogs() });
      }
      
      // Set individual log data
      queryClient.setQueryData(logKeys.detail(newLog.id), newLog);
      
      // Invalidate stats and analytics
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      queryClient.invalidateQueries({ queryKey: logKeys.analytics() });
      if (newLog.username) {
        queryClient.invalidateQueries({ queryKey: logKeys.userStats(newLog.username) });
      }
    },
  });
};

// Update log
export const useUpdateLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, logData }) => logService.updateLog(id, logData),
    onSuccess: (updatedLog) => {
      // Update log in list
      queryClient.setQueryData(logKeys.lists(), (oldData) => {
        if (!oldData) return [];
        return oldData.map(log => 
          log.id === updatedLog.id ? updatedLog : log
        );
      });
      
      // Update user logs if applicable
      if (updatedLog.username) {
        queryClient.setQueryData(logKeys.userLogs(updatedLog.username), (oldData) => {
          if (!oldData) return [];
          return oldData.map(log => 
            log.id === updatedLog.id ? updatedLog : log
          );
        });
      }
      
      // Update partner logs if workout partners were modified
      if (updatedLog.workout_partners !== undefined) {
        queryClient.invalidateQueries({ queryKey: logKeys.partnerLogs() });
      }
      
      // Update individual log cache
      queryClient.setQueryData(logKeys.detail(updatedLog.id), updatedLog);
      
      // Invalidate stats and analytics since updated log might affect them
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      queryClient.invalidateQueries({ queryKey: logKeys.analytics() });
      if (updatedLog.username) {
        queryClient.invalidateQueries({ queryKey: logKeys.userStats(updatedLog.username) });
      }
    },
  });
};

// Delete log
export const useDeleteLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: logService.deleteLog,
    onSuccess: (_, logId) => {
      // Get the log before removing it to access its username and partners
      const log = queryClient.getQueryData(logKeys.detail(logId));
      const username = log?.username;
      const hasPartners = log?.workout_partners && log.workout_partners.length > 0;
      
      // Remove from logs list
      queryClient.setQueryData(logKeys.lists(), (oldData) => {
        if (!oldData) return [];
        return oldData.filter(log => log.id !== logId);
      });
      
      // Remove from user logs if username is known
      if (username) {
        queryClient.setQueryData(logKeys.userLogs(username), (oldData) => {
          if (!oldData) return [];
          return oldData.filter(log => log.id !== logId);
        });
      }
      
      // Update partner logs if this log had partners
      if (hasPartners) {
        queryClient.invalidateQueries({ queryKey: logKeys.partnerLogs() });
      }
      
      // Remove individual log cache
      queryClient.removeQueries({ queryKey: logKeys.detail(logId) });
      
      // Invalidate stats and analytics since deleting a log affects them
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      queryClient.invalidateQueries({ queryKey: logKeys.analytics() });
      if (username) {
        queryClient.invalidateQueries({ queryKey: logKeys.userStats(username) });
      }
    },
  });
};

// Calculate workout stats based on logs
export const useWorkoutStats = (username = null) => {
  const { data: logs, isLoading, error } = username 
    ? useUserLogs(username)
    : useLogs();
  
  return {
    data: logs ? logService.calculateStats(logs) : null,
    isLoading,
    error
  };
};

// Get volume analytics for logs
export const useVolumeAnalytics = (filters = {}) => {
  const { data: logs, isLoading, error } = useLogs(filters);
  
  return useQuery({
    queryKey: logKeys.volume(filters),
    queryFn: () => {
      if (!logs) return null;
      
      const targetUnit = filters.unit || 'kg';
      const volumeData = logs.map(log => ({
        id: log.id,
        date: log.date,
        name: log.name,
        volume: logService.calculateTotalVolume(log.exercises, targetUnit),
        exercises: log.exercises,
        completed: log.completed
      }));
      
      const totalVolume = volumeData.reduce((sum, log) => sum + log.volume, 0);
      const averageVolume = volumeData.length > 0 ? totalVolume / volumeData.length : 0;
      
      return {
        logs: volumeData,
        totalVolume,
        averageVolume,
        unit: targetUnit
      };
    },
    enabled: !!logs && !isLoading && !error,
  });
};

// Get exercise-specific analytics
export const useExerciseAnalytics = (exerciseName, filters = {}) => {
  const { data: logs, isLoading, error } = useLogs(filters);
  
  return useQuery({
    queryKey: [...logKeys.analytics(), 'exercise', exerciseName, filters],
    queryFn: () => {
      if (!logs || !exerciseName) return null;
      
      const exerciseData = [];
      
      logs.forEach(log => {
        const exercise = log.exercises.find(ex => ex.name === exerciseName);
        if (exercise && exercise.effort_type === 'reps') {
          const maxWeight = Math.max(...exercise.sets
            .filter(set => set.weight && set.reps)
            .map(set => {
              // Convert to target unit for comparison
              const targetUnit = filters.unit || 'kg';
              return set.weight_unit === targetUnit 
                ? set.weight 
                : (set.weight_unit === 'lbs' && targetUnit === 'kg')
                  ? set.weight * 0.453592
                  : set.weight * 2.20462;
            })
          );
          
          if (maxWeight > 0) {
            exerciseData.push({
              date: log.date,
              maxWeight,
              sets: exercise.sets.filter(set => set.weight && set.reps),
              logId: log.id
            });
          }
        }
      });
      
      // Sort by date
      exerciseData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const progression = exerciseData.length > 1 
        ? exerciseData[exerciseData.length - 1].maxWeight - exerciseData[0].maxWeight
        : 0;
      
      return {
        exerciseName,
        data: exerciseData,
        progression,
        sessions: exerciseData.length,
        unit: filters.unit || 'kg'
      };
    },
    enabled: !!logs && !!exerciseName && !isLoading && !error,
  });
};