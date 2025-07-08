// hooks/query/useLogQuery.ts - Enhanced with auth guards
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { logService } from '../../api/services';
import { useAuth } from '../useAuth';
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
  recentExercises: (days, limit) => [...logKeys.all, 'recent-exercises', { days, limit }], 
  recentExerciseNames: (days, limit) => [...logKeys.all, 'recent-exercise-names', { days, limit }], 
};

// Get all workout logs - AUTH PROTECTED
export const useLogs = (filters = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: logKeys.list(filters),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching workout logs...');
      const logs = await logService.getLogs();
      
      // Apply filters if they exist
      if (Object.keys(filters).length > 0) {
        return logService.filterLogs(logs, filters.query);
      }
      
      return logs;
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Get logs for a specific user - AUTH PROTECTED
export const useUserLogs = (username) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: logKeys.userLogs(username),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching logs for user:', username);
      return logService.getLogsByUsername(username);
    },
    enabled: 
      !!username &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Get logs where current user was a workout partner - AUTH PROTECTED
export const usePartnerLogs = () => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: logKeys.partnerLogs(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching partner logs...');
      return logService.getLogsAsPartner();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Enhanced log fetching with better error handling - AUTH PROTECTED
export const useLog = (logId) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: logKeys.detail(logId),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      try {
        console.log('📡 Fetching log details:', logId);
        return await logService.getLogById(logId);
      } catch (error) {
        // Enhance error with type information for better handling
        if (error.response?.status === 403) {
          const enhancedError = new Error('Access denied to this workout log');
          enhancedError.name = 'UNAUTHORIZED';
          enhancedError.status = 403;
          throw enhancedError;
        } else if (error.response?.status === 404) {
          const enhancedError = new Error('Workout log not found');
          enhancedError.name = 'NOT_FOUND';
          enhancedError.status = 404;
          throw enhancedError;
        }
        // Re-throw other errors as-is
        throw error;
      }
    },
    enabled: 
      !!logId &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    retry: (failureCount, error) => {
      // Don't retry on permission errors or auth errors
      if (error?.name === 'UNAUTHORIZED' || error?.name === 'NOT_FOUND' ||
          error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 3;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

/**
 * Get recently used exercises with detailed information - AUTH PROTECTED
 */
export const useRecentExercises = (days: number = 30, limit: number = 10) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: logKeys.recentExercises(days, limit),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching recent exercises...');
      return logService.getRecentExercises(days, limit);
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

/**
 * Get recently used exercise names (for exercise selector) - AUTH PROTECTED
 */
export const useRecentExerciseNames = (days: number = 30, limit: number = 15) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: logKeys.recentExerciseNames(days, limit),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching recent exercise names...');
      return logService.getRecentExerciseNames(days, limit);
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Create log - AUTH PROTECTED
export const useCreateLog = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (logData) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📝 Creating workout log...');
      return logService.createLog(logData);
    },
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
      
      queryClient.invalidateQueries({ queryKey: logKeys.recentExercises(30,15) });
      queryClient.invalidateQueries({ queryKey: logKeys.recentExerciseNames(30,15) });
      // Invalidate stats and analytics since a new log affects them
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      queryClient.invalidateQueries({ queryKey: logKeys.analytics() });
      if (newLog.username) {
        queryClient.invalidateQueries({ queryKey: logKeys.userStats(newLog.username) });
      }
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Create log from workout instance - AUTH PROTECTED
export const useCreateLogFromInstance = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (instanceData) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📝 Creating log from workout instance...');
      return logService.createLogFromInstance(instanceData);
    },
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
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Update log - AUTH PROTECTED
export const useUpdateLog = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, logData }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('✏️ Updating workout log:', id);
      return logService.updateLog(id, logData);
    },
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
      queryClient.invalidateQueries({ queryKey: logKeys.recentExercises(30,15) });
      queryClient.invalidateQueries({ queryKey: logKeys.recentExerciseNames(30,15) });
      
      // Invalidate stats and analytics since updated log might affect them
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      queryClient.invalidateQueries({ queryKey: logKeys.analytics() });
      if (updatedLog.username) {
        queryClient.invalidateQueries({ queryKey: logKeys.userStats(updatedLog.username) });
      }
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Delete log - AUTH PROTECTED
export const useDeleteLog = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (logId) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('🗑️ Deleting workout log:', logId);
      return logService.deleteLog(logId);
    },
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
      queryClient.invalidateQueries({ queryKey: logKeys.recentExercises(30,15) });
      queryClient.invalidateQueries({ queryKey: logKeys.recentExerciseNames(30,15) });
      // Invalidate stats and analytics since deleting a log affects them
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      queryClient.invalidateQueries({ queryKey: logKeys.analytics() });
      if (username) {
        queryClient.invalidateQueries({ queryKey: logKeys.userStats(username) });
      }
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Calculate workout stats based on logs - AUTH PROTECTED
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

// Get volume analytics for logs - AUTH PROTECTED
export const useVolumeAnalytics = (filters = {}) => {
  const { data: logs, isLoading, error } = useLogs(filters);
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  
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
    enabled: 
      !!logs && 
      !isLoading && 
      !error &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Get exercise-specific analytics - AUTH PROTECTED
export const useExerciseAnalytics = (exerciseName, filters = {}) => {
  const { data: logs, isLoading, error } = useLogs(filters);
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  
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
    enabled: 
      !!logs && 
      !!exerciseName && 
      !isLoading && 
      !error &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    meta: {
      requiresAuth: true,
    },
  });
};