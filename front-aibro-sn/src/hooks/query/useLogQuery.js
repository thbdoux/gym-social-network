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
    details: () => [...logKeys.all, 'detail'],
    detail: (id) => [...logKeys.details(), id],
    stats: () => [...logKeys.all, 'stats'],
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
        
        // Set individual log data
        queryClient.setQueryData(logKeys.detail(newLog.id), newLog);
        
        // Invalidate stats since a new log affects them
        queryClient.invalidateQueries({ queryKey: logKeys.stats() });
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
        
        // Update individual log cache
        queryClient.setQueryData(logKeys.detail(updatedLog.id), updatedLog);
        
        // Invalidate stats since updated log might affect them
        queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      },
    });
  };
  
  // Delete log
  export const useDeleteLog = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: logService.deleteLog,
      onSuccess: (_, logId) => {
        // Remove from logs list
        queryClient.setQueryData(logKeys.lists(), (oldData) => {
          if (!oldData) return [];
          return oldData.filter(log => log.id !== logId);
        });
        
        // Remove individual log cache
        queryClient.removeQueries({ queryKey: logKeys.detail(logId) });
        
        // Invalidate stats since deleting a log affects them
        queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      },
    });
  };
  
  // Calculate workout stats based on logs
  export const useWorkoutStats = () => {
    const { data: logs, isLoading, error } = useLogs();
    
    return {
      data: logs ? logService.calculateStats(logs) : null,
      isLoading,
      error
    };
  };