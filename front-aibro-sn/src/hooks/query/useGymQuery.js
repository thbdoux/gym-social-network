import { 
    useQuery, 
    useMutation, 
    useQueryClient 
  } from '@tanstack/react-query';
  import { gymService } from '../../api/services';
  
  // Query keys
  export const gymKeys = {
    all: ['gyms'],
    lists: () => [...gymKeys.all, 'list'],
    list: (filters) => [...gymKeys.lists(), { ...filters }],
    details: () => [...gymKeys.all, 'detail'],
    detail: (id) => [...gymKeys.details(), id],
  };
  
  // Get all gyms
  export const useGyms = () => {
    return useQuery({
      queryKey: gymKeys.lists(),
      queryFn: gymService.getGyms,
    });
  };
  
  // Get gym by id
  export const useGym = (gymId) => {
    return useQuery({
      queryKey: gymKeys.detail(gymId),
      queryFn: () => gymService.getGymById(gymId),
      enabled: !!gymId,
    });
  };
  
  // Create gym
  export const useCreateGym = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: gymService.createGym,
      onSuccess: (newGym) => {
        // Update gyms list
        queryClient.setQueryData(gymKeys.lists(), (oldData) => {
          if (!oldData) return [newGym];
          return [...oldData, newGym];
        });
        
        // Set individual gym data
        queryClient.setQueryData(gymKeys.detail(newGym.id), newGym);
      },
    });
  };
  
  // Update gym
  export const useUpdateGym = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ id, updates }) => gymService.updateGym(id, updates),
      onSuccess: (updatedGym) => {
        // Update gym in list
        queryClient.setQueryData(gymKeys.lists(), (oldData) => {
          if (!oldData) return [];
          return oldData.map(gym => 
            gym.id === updatedGym.id ? updatedGym : gym
          );
        });
        
        // Update individual gym cache
        queryClient.setQueryData(gymKeys.detail(updatedGym.id), updatedGym);
      },
    });
  };
  
  // Delete gym
  export const useDeleteGym = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: gymService.deleteGym,
      onSuccess: (_, gymId) => {
        // Remove from gyms list
        queryClient.setQueryData(gymKeys.lists(), (oldData) => {
          if (!oldData) return [];
          return oldData.filter(gym => gym.id !== gymId);
        });
        
        // Remove individual gym cache
        queryClient.removeQueries({ queryKey: gymKeys.detail(gymId) });
      },
    });
  };