import { 
    useQuery, 
    useMutation, 
    useQueryClient 
  } from '@tanstack/react-query';
  import { programService } from '../../api/services';
  import { programKeys } from './useProgramQuery';
  
  /**
   * Compatibility wrapper for the old useWorkoutPlans hook pattern
   * @returns {Object} Legacy API for workout plans management
   */
  export const useWorkoutPlansLegacy = () => {
    const queryClient = useQueryClient();
    
    // Use React Query for fetching programs
    const { 
      data: workoutPlans = [], 
      isLoading: loading, 
      error, 
      refetch
    } = useQuery({
      queryKey: programKeys.lists(),
      queryFn: programService.getPrograms
    });
    
    // Create plan mutation
    const createPlanMutation = useMutation({
      mutationFn: programService.createProgram,
      onSuccess: (newPlan) => {
        queryClient.setQueryData(programKeys.lists(), (old = []) => [...old, newPlan]);
        queryClient.setQueryData(programKeys.detail(newPlan.id), newPlan);
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      }
    });
    
    // Update plan mutation
    const updatePlanMutation = useMutation({
      mutationFn: ({ planId, updates }) => programService.updateProgram(planId, updates),
      onSuccess: (updatedPlan) => {
        queryClient.setQueryData(programKeys.lists(), (old = []) => 
          old.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan)
        );
        queryClient.setQueryData(programKeys.detail(updatedPlan.id), updatedPlan);
      }
    });
    
    // Delete plan mutation
    const deletePlanMutation = useMutation({
      mutationFn: programService.deleteProgram,
      onSuccess: (_, planId) => {
        queryClient.setQueryData(programKeys.lists(), (old = []) => 
          old.filter(plan => plan.id !== planId)
        );
        queryClient.removeQueries({ queryKey: programKeys.detail(planId) });
      }
    });
    
    // Add workout to plan mutation
    const addWorkoutToPlanMutation = useMutation({
      mutationFn: ({ planId, templateId, weekday }) => 
        programService.addWorkoutToProgram(planId, templateId, weekday),
      onSuccess: (_, { planId }) => {
        queryClient.invalidateQueries({ queryKey: programKeys.detail(planId) });
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      }
    });
    
    // Update workout instance mutation
    const updateWorkoutInstanceMutation = useMutation({
      mutationFn: ({ planId, workoutId, updates }) => 
        programService.updateProgramWorkout(planId, workoutId, updates),
      onSuccess: (_, { planId }) => {
        queryClient.invalidateQueries({ queryKey: programKeys.detail(planId) });
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      }
    });
    
    // Remove workout from plan mutation
    const removeWorkoutFromPlanMutation = useMutation({
      mutationFn: ({ planId, workoutId }) => 
        programService.removeWorkoutFromProgram(planId, workoutId),
      onSuccess: (_, { planId }) => {
        queryClient.invalidateQueries({ queryKey: programKeys.detail(planId) });
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      }
    });
    
    // Return a compatibility interface that matches the old hook API
    return {
      workoutPlans,
      loading,
      error: error?.message || null,
      createPlan: (planData) => createPlanMutation.mutateAsync(planData),
      updatePlan: (planId, updates) => updatePlanMutation.mutateAsync({ planId, updates }),
      deletePlan: (planId) => deletePlanMutation.mutateAsync(planId),
      addWorkoutToPlan: (planId, templateId, weekday) => 
        addWorkoutToPlanMutation.mutateAsync({ planId, templateId, weekday }),
      updateWorkoutInstance: (planId, workoutId, updates) => 
        updateWorkoutInstanceMutation.mutateAsync({ planId, workoutId, updates }),
      removeWorkoutFromPlan: (planId, workoutId) => 
        removeWorkoutFromPlanMutation.mutateAsync({ planId, workoutId }),
      refreshPlans: refetch
    };
  };