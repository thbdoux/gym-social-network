// hooks/query/useLogQuery.ts
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { logService } from '../../api/services';

// Query keys
export const logKeys = {
  all: ['logs'],
  lists: () => [...logKeys.all, 'list'],
  list: (filters) => [...logKeys.lists(), { ...filters }],
  userLogs: (username) => [...logKeys.lists(), 'user', username],
  details: () => [...logKeys.all, 'detail'],
  detail: (id) => [...logKeys.details(), id],
  stats: () => [...logKeys.all, 'stats'],
  userStats: (username) => [...logKeys.stats(), 'user', username],
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
      
      // Set individual log data
      queryClient.setQueryData(logKeys.detail(newLog.id), newLog);
      
      // Invalidate stats since a new log affects them
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
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
      
      // Update individual log cache
      queryClient.setQueryData(logKeys.detail(updatedLog.id), updatedLog);
      
      // Invalidate stats since updated log might affect them
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
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
      // Get the log before removing it to access its username
      const log = queryClient.getQueryData(logKeys.detail(logId));
      const username = log?.username;
      
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
      
      // Remove individual log cache
      queryClient.removeQueries({ queryKey: logKeys.detail(logId) });
      
      // Invalidate stats since deleting a log affects them
      queryClient.invalidateQueries({ queryKey: logKeys.stats() });
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