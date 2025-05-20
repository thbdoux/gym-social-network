// hooks/query/useGymQuery.ts
import { 
    useQuery, 
    useMutation, 
    useQueryClient 
  } from '@tanstack/react-query';
  import { gymService } from '../../api/services';
  
  interface Gym {
    id: number;
    name: string;
    location: string;
    description?: string;
    is_default?: boolean;
    [key: string]: any;
  }
  
  // Query keys
  export const gymKeys = {
    all: ['gyms'],
    lists: () => [...gymKeys.all, 'list'],
    list: (filters: any) => [...gymKeys.lists(), { ...filters }],
    details: () => [...gymKeys.all, 'detail'],
    detail: (id: number) => [...gymKeys.details(), id],
  };
  
  // Get all gyms
  export const useGyms = () => {
    return useQuery({
      queryKey: gymKeys.lists(),
      queryFn: gymService.getGyms,
    });
  };
  
  // Get gym by id
  export const useGym = (gymId: number | undefined) => {
    return useQuery({
      queryKey: gymKeys.detail(gymId as number),
      queryFn: () => gymService.getGymById(gymId as number),
      enabled: !!gymId,
    });
  };
  
  // Custom hook for displaying gym information
  export const useGymDisplay = (userId: number | undefined, preferredGymId: number | undefined) => {
    // Get gym data using the existing useGym hook
    const { data: gym, isLoading, error } = useGym(preferredGymId);
    
    // Determine the display text based on query state
    let displayText = 'No gym set';
    
    if (preferredGymId) {
      if (isLoading) {
        displayText = 'Loading gym info...';
      } else if (error) {
        displayText = 'Error loading gym info';
      } else if (gym) {
        displayText = `${gym.name} - ${gym.location}`;
      } else {
        displayText = 'Gym not found';
      }
    }
    
    return {
      displayText,
      gym,
      isLoading,
      error
    };
  };
  
  // Create gym
  export const useCreateGym = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (gymData: Partial<Gym>) => gymService.createGym(gymData),
      onSuccess: (newGym) => {
        // Update gyms list
        queryClient.setQueryData(gymKeys.lists(), (oldData: Gym[] | undefined) => {
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
      mutationFn: ({ id, updates }: { id: number; updates: Partial<Gym> }) => gymService.updateGym(id, updates),
      onSuccess: (updatedGym) => {
        // Update gym in list
        queryClient.setQueryData(gymKeys.lists(), (oldData: Gym[] | undefined) => {
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
      mutationFn: (gymId: number) => gymService.deleteGym(gymId),
      onSuccess: (_, gymId) => {
        // Remove from gyms list
        queryClient.setQueryData(gymKeys.lists(), (oldData: Gym[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter(gym => gym.id !== gymId);
        });
        
        // Remove individual gym cache
        queryClient.removeQueries({ queryKey: gymKeys.detail(gymId) });
      },
    });
  };