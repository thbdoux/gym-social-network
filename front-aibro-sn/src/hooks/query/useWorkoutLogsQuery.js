import { 
    useQuery, 
    useMutation, 
    useQueryClient 
  } from '@tanstack/react-query';
  import { logService, programService } from '../../api/services';
  import { logKeys } from './useLogQuery';
  import { programKeys } from './useProgramQuery';
  
  /**
   * Compatibility wrapper for the old useWorkoutLogs hook pattern
   * @param {Object} activeProgram - Active workout program
   * @returns {Object} Legacy API for workout logs management
   */
  export const useWorkoutLogsLegacy = (activeProgram) => {
    const queryClient = useQueryClient();
    
    // Fetch logs
    const { 
      data: logs = [], 
      isLoading: loading, 
      error, 
      refetch 
    } = useQuery({
      queryKey: logKeys.lists(),
      queryFn: logService.getLogs
    });
    
    // Calculate next workout based on active program
    const nextWorkout = activeProgram?.workouts?.length
      ? programService.getNextWorkout(activeProgram)
      : null;
    
    // Create log mutation
    const createLogMutation = useMutation({
      mutationFn: logService.createLog,
      onSuccess: (newLog) => {
        queryClient.setQueryData(logKeys.lists(), (old = []) => 
          [newLog, ...old]
        );
        queryClient.setQueryData(logKeys.detail(newLog.id), newLog);
        // Invalidate stats since a new log affects them
        queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      }
    });
    
    // Update log mutation
    const updateLogMutation = useMutation({
      mutationFn: ({ logId, logData }) => logService.updateLog(logId, logData),
      onSuccess: (updatedLog) => {
        queryClient.setQueryData(logKeys.lists(), (old = []) => 
          old.map(log => log.id === updatedLog.id ? updatedLog : log)
        );
        queryClient.setQueryData(logKeys.detail(updatedLog.id), updatedLog);
        // Invalidate stats since updated log might affect them
        queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      }
    });
    
    // Delete log mutation
    const deleteLogMutation = useMutation({
      mutationFn: logService.deleteLog,
      onSuccess: (_, logId) => {
        queryClient.setQueryData(logKeys.lists(), (old = []) => 
          old.filter(log => log.id !== logId)
        );
        queryClient.removeQueries({ queryKey: logKeys.detail(logId) });
        // Invalidate stats since deleting a log affects them
        queryClient.invalidateQueries({ queryKey: logKeys.stats() });
      }
    });
    
    return {
      logs,
      nextWorkout,
      loading,
      error: error?.message || null,
      createLog: (logData) => createLogMutation.mutateAsync(logData),
      updateLog: (logId, logData) => updateLogMutation.mutateAsync({ logId, logData }),
      deleteLog: (logId) => deleteLogMutation.mutateAsync(logId),
      refreshLogs: refetch
    };
  };