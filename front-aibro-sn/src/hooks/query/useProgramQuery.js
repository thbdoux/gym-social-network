import { 
    useQuery, 
    useMutation, 
    useQueryClient 
  } from '@tanstack/react-query';
  import { programService } from '../../api/services';
  
  // Query keys
  export const programKeys = {
    all: ['programs'],
    lists: () => [...programKeys.all, 'list'],
    list: (filters) => [...programKeys.lists(), { ...filters }],
    details: () => [...programKeys.all, 'detail'],
    detail: (id) => [...programKeys.details(), id],
    workouts: (programId) => [...programKeys.detail(programId), 'workouts'],
    workout: (programId, workoutId) => [...programKeys.workouts(programId), workoutId],
  };
  
  // Get all programs
  export const usePrograms = () => {
    return useQuery({
      queryKey: programKeys.lists(),
      queryFn: programService.getPrograms,
    });
  };
  
  // Get program by id
  export const useProgram = (programId) => {
    return useQuery({
      queryKey: programKeys.detail(programId),
      queryFn: () => programService.getProgramById(programId),
      enabled: !!programId,
    });
  };
  
  // Create program
  export const useCreateProgram = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: programService.createProgram,
      onSuccess: (newProgram) => {
        // Update programs list with new program
        queryClient.setQueryData(programKeys.lists(), (oldData) => {
          if (!oldData) return [newProgram];
          return [...oldData, newProgram];
        });
        
        // Set individual program data
        queryClient.setQueryData(programKeys.detail(newProgram.id), newProgram);
      },
    });
  };
  
  // Update program
  export const useUpdateProgram = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ id, updates }) => programService.updateProgram(id, updates),
      onSuccess: (updatedProgram) => {
        // Update program in list
        queryClient.setQueryData(programKeys.lists(), (oldData) => {
          if (!oldData) return [];
          return oldData.map(program => 
            program.id === updatedProgram.id ? updatedProgram : program
          );
        });
        
        // Update individual program cache
        queryClient.setQueryData(programKeys.detail(updatedProgram.id), updatedProgram);
      },
    });
  };
  
  // Delete program
  export const useDeleteProgram = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: programService.deleteProgram,
      onSuccess: (_, programId) => {
        // Remove from programs list
        queryClient.setQueryData(programKeys.lists(), (oldData) => {
          if (!oldData) return [];
          return oldData.filter(program => program.id !== programId);
        });
        
        // Remove individual program cache
        queryClient.removeQueries({ queryKey: programKeys.detail(programId) });
      },
    });
  };
  
  // Toggle program active
  export const useToggleProgramActive = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: programService.toggleProgramActive,
      onSuccess: (updatedProgram) => {
        // Update program in list
        queryClient.setQueryData(programKeys.lists(), (oldData) => {
          if (!oldData) return [];
          return oldData.map(program => 
            program.id === updatedProgram.id ? updatedProgram : program
          );
        });
        
        // Update individual program cache
        queryClient.setQueryData(programKeys.detail(updatedProgram.id), updatedProgram);
      },
    });
  };
  
  // Add workout to program
  export const useAddWorkoutToProgram = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ programId, templateId, weekday }) => 
        programService.addWorkoutToProgram(programId, templateId, weekday),
      onSuccess: (_, { programId }) => {
        // Invalidate program details since workouts list changed
        queryClient.invalidateQueries({ queryKey: programKeys.detail(programId) });
      },
    });
  };
  
  // Update program workout
  export const useUpdateProgramWorkout = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ programId, workoutId, updates }) => 
        programService.updateProgramWorkout(programId, workoutId, updates),
      onSuccess: (_, { programId }) => {
        // Invalidate program details since a workout was updated
        queryClient.invalidateQueries({ queryKey: programKeys.detail(programId) });
      },
    });
  };
  
  // Remove workout from program
  export const useRemoveWorkoutFromProgram = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ programId, workoutId }) => 
        programService.removeWorkoutFromProgram(programId, workoutId),
      onSuccess: (_, { programId }) => {
        // Invalidate program details since workouts list changed
        queryClient.invalidateQueries({ queryKey: programKeys.detail(programId) });
      },
    });
  };
  
  // Fork program
  export const useForkProgram = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: programService.forkProgram,
      onSuccess: (forkedProgram) => {
        // Add forked program to programs list
        queryClient.setQueryData(programKeys.lists(), (oldData) => {
          if (!oldData) return [forkedProgram];
          return [...oldData, forkedProgram];
        });
        
        // Set individual forked program data
        queryClient.setQueryData(
          programKeys.detail(forkedProgram.id), 
          forkedProgram
        );
      },
    });
  };
  
  // Share program
  export const useShareProgram = () => {
    return useMutation({
      mutationFn: ({ programId, shareData }) => 
        programService.shareProgram(programId, shareData),
    });
  };
  
  // Get program workout
  export const useProgramWorkout = (programId, workoutId) => {
    return useQuery({
      queryKey: programKeys.workout(programId, workoutId),
      queryFn: () => programService.getProgramWorkout(programId, workoutId),
      enabled: !!programId && !!workoutId,
    });
  };