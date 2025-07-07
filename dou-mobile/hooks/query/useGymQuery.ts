// hooks/query/useGymQuery.ts - Fixed iterator error
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import gymService, { 
  type Gym, 
  type ExternalGym, 
  type GymSearchParams,
  type GymSearchResponse,
  type ExternalGymSearchResponse 
} from '../../api/services/gymService';
import { useAuth } from '../useAuth';

// Query keys
export const gymKeys = {
  all: ['gyms'],
  lists: () => [...gymKeys.all, 'list'],
  list: (filters: any) => [...gymKeys.lists(), { ...filters }],
  details: () => [...gymKeys.all, 'detail'],
  detail: (id: number) => [...gymKeys.details(), id],
  search: () => [...gymKeys.all, 'search'],
  searchExternal: (params: GymSearchParams) => [...gymKeys.search(), 'external', params],
  searchAll: (params: GymSearchParams) => [...gymKeys.search(), 'all', params],
  externalDetails: (placeId: string) => [...gymKeys.all, 'external-detail', placeId],
};

// --- Fixed local gym hooks ---

export const useGyms = () => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: gymKeys.lists(),
    queryFn: async (): Promise<Gym[]> => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('📡 Fetching gyms...');
      const result = await gymService.getGyms();
      // Ensure we always return an array
      return Array.isArray(result) ? result : [];
    },
    enabled: isInitialized && !authLoading && isAuthenticated && !!user,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    // Add default data to prevent undefined issues
    initialData: [],
    meta: { requiresAuth: true },
  });
};

export const useGym = (gymId: number | undefined) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: gymKeys.detail(gymId as number),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('📡 Fetching gym details:', gymId);
      return gymService.getGymById(gymId as number);
    },
    enabled: !!gymId && isInitialized && !authLoading && isAuthenticated && !!user,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    meta: { requiresAuth: true },
  });
};

export const useGymDisplay = (userId: number | undefined, preferredGymId: number | undefined) => {
  const { data: gym, isLoading, error } = useGym(preferredGymId);
  const { isAuthenticated, user } = useAuth();
  
  let displayText = 'No gym set';
  
  if (!isAuthenticated || !user) {
    displayText = 'Login required';
  } else if (preferredGymId) {
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
  
  return { displayText, gym, isLoading, error };
};

// --- Fixed external API hooks ---

/**
 * Manual search for external gyms - CHANGED to manual trigger
 */
 export const useExternalGymSearch = () => {
  const { isAuthenticated, user } = useAuth();

  return useMutation({
    mutationFn: async (params: GymSearchParams): Promise<ExternalGymSearchResponse> => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('🔍 Searching external gyms...', params);
      const result = await gymService.searchExternalGyms(params);
      return {
        ...result,
        results: Array.isArray(result.results) ? result.results : []
      };
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 2;
    },
    meta: { requiresAuth: true },
  });
};

/**
 * Manual combined search - CHANGED to manual trigger
 */
 export const useAllGymsSearch = () => {
  const { isAuthenticated, user } = useAuth();

  return useMutation({
    mutationFn: async (params: GymSearchParams): Promise<GymSearchResponse> => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('🔍 Searching all gyms...', params);
      const result = await gymService.searchAllGyms(params);
      return {
        local_gyms: Array.isArray(result.local_gyms) ? result.local_gyms : [],
        external_gyms: Array.isArray(result.external_gyms) ? result.external_gyms : [],
        total_count: result.total_count || 0
      };
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 2;
    },
    meta: { requiresAuth: true },
  });
};


/**
 * Get external gym details
 */
export const useExternalGymDetails = (placeId: string | undefined) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: gymKeys.externalDetails(placeId as string),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('📡 Fetching external gym details:', placeId);
      return gymService.getExternalGymDetails(placeId as string);
    },
    enabled: !!placeId && isInitialized && !authLoading && isAuthenticated && !!user,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    meta: { requiresAuth: true },
  });
};

// --- Mutation hooks ---

export const useCreateGym = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (gymData: Partial<Gym>) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('📝 Creating gym...');
      return gymService.createGym(gymData);
    },
    onSuccess: (newGym) => {
      queryClient.setQueryData(gymKeys.lists(), (oldData: Gym[] | undefined) => {
        const currentData = Array.isArray(oldData) ? oldData : [];
        return [...currentData, newGym];
      });
      queryClient.setQueryData(gymKeys.detail(newGym.id), newGym);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 1;
    },
    meta: { requiresAuth: true },
  });
};

export const useUpdateGym = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Gym> }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('✏️ Updating gym:', id);
      return gymService.updateGym(id, updates);
    },
    onSuccess: (updatedGym) => {
      queryClient.setQueryData(gymKeys.lists(), (oldData: Gym[] | undefined) => {
        const currentData = Array.isArray(oldData) ? oldData : [];
        return currentData.map(gym => 
          gym.id === updatedGym.id ? updatedGym : gym
        );
      });
      queryClient.setQueryData(gymKeys.detail(updatedGym.id), updatedGym);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 1;
    },
    meta: { requiresAuth: true },
  });
};

export const useDeleteGym = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (gymId: number) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('🗑️ Deleting gym:', gymId);
      return gymService.deleteGym(gymId);
    },
    onSuccess: (_, gymId) => {
      queryClient.setQueryData(gymKeys.lists(), (oldData: Gym[] | undefined) => {
        const currentData = Array.isArray(oldData) ? oldData : [];
        return currentData.filter(gym => gym.id !== gymId);
      });
      queryClient.removeQueries({ queryKey: gymKeys.detail(gymId) });
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 1;
    },
    meta: { requiresAuth: true },
  });
};

/**
 * Save external gym to local database
 */
export const useSaveExternalGym = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (gymData: ExternalGym) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('💾 Saving external gym to database...');
      return gymService.saveExternalGym(gymData);
    },
    onSuccess: ({ gym, created }) => {
      // Invalidate search queries to reflect new gym
      queryClient.invalidateQueries({ queryKey: gymKeys.search() });
      
      // Update gyms list if created
      if (created) {
        queryClient.setQueryData(gymKeys.lists(), (oldData: Gym[] | undefined) => {
          const currentData = Array.isArray(oldData) ? oldData : [];
          return [...currentData, gym];
        });
        queryClient.setQueryData(gymKeys.detail(gym.id), gym);
      }
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 1;
    },
    meta: { requiresAuth: true },
  });
};

/**
 * Geocode address to coordinates
 */
export const useGeocodeAddress = () => {
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (address: string) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      console.log('🗺️ Geocoding address:', address);
      return gymService.geocodeAddress(address);
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 1;
    },
    meta: { requiresAuth: true },
  });
};