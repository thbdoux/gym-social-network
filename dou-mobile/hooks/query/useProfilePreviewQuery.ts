// hooks/query/useProfilePreviewQuery.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profilePreviewService } from '../../api/services';

// Query keys
export const profilePreviewKeys = {
  all: ['profilePreviews'],
  user: (userId: number) => [...profilePreviewKeys.all, 'user', userId],
  friends: (userId: number) => [...profilePreviewKeys.user(userId), 'friends'],
  posts: (userId: number) => [...profilePreviewKeys.user(userId), 'posts'],
  program: (programId: number) => [...profilePreviewKeys.all, 'program', programId],
  workoutLog: (logId: number) => [...profilePreviewKeys.all, 'workoutLog', logId],
};

// Get user profile preview data
export const useUserProfilePreview = (userId: number, options = {}) => {
  return useQuery({
    queryKey: profilePreviewKeys.user(userId),
    queryFn: () => profilePreviewService.getUserProfilePreview(userId),
    enabled: !!userId,
    ...options,
  });
};

// Get user friends for profile preview
export const useUserFriends = (userId: number, options = {}) => {
  return useQuery({
    queryKey: profilePreviewKeys.friends(userId),
    queryFn: () => profilePreviewService.getUserFriends(userId),
    enabled: !!userId,
    ...options,
  });
};

// Get user posts for profile preview
export const useUserPosts = (userId: number, options = {}) => {
  return useQuery({
    queryKey: profilePreviewKeys.posts(userId),
    queryFn: () => profilePreviewService.getUserPosts(userId),
    enabled: !!userId,
    ...options,
  });
};

// Get program details for profile preview
export const useProgramPreviewDetails = (programId: number) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: profilePreviewKeys.program(programId),
    queryFn: async () => {
      try {
        // Always fetch fresh data from the server for program previews
        // This ensures we get the most up-to-date program data for any user
        const data = await profilePreviewService.getProgramDetails(programId);
        
        // Update the programs list cache with this program to ensure consistency
        queryClient.setQueryData(['programs', 'list'], (oldData: any) => {
          if (!oldData) return [data];
          // If the program already exists in the list, replace it
          if (oldData.find((p: any) => p.id === data.id)) {
            return oldData.map((p: any) => p.id === data.id ? data : p);
          }
          // Otherwise add it to the list
          return [...oldData, data];
        });
        
        return data;
      } catch (error: any) {
        console.error(`Error fetching program ${programId}:`, error);
        
        // For 404 errors, remove this program from all caches
        if (error.response && error.response.status === 404) {
          // If the program doesn't exist, clear it from current user if it's set
          queryClient.setQueryData(['users', 'current'], (userData: any) => {
            if (userData && userData.current_program && userData.current_program.id === programId) {
              return {
                ...userData,
                current_program: null
              };
            }
            return userData;
          });
          
          // Also remove it from the programs list if it's there
          queryClient.setQueryData(['programs', 'list'], (oldData: any) => {
            if (!oldData) return [];
            return oldData.filter((p: any) => p.id !== programId);
          });
        }
        
        throw error;
      }
    },
    enabled: !!programId,
    // We want to retry a couple times in case of network issues
    retry: 2,
    // Set staleTime to 0 to always fetch fresh data when viewing a profile
    staleTime: 0, 
    // Don't cache data for too long
    cacheTime: 1000 * 60 * 5, // 5 minutes
    // Always refetch when component mounts
    refetchOnMount: true
  });
};

// Get workout log details for profile preview
export const useWorkoutLogPreviewDetails = (logId: number, options = {}) => {
  return useQuery({
    queryKey: profilePreviewKeys.workoutLog(logId),
    queryFn: () => profilePreviewService.getWorkoutLogDetails(logId),
    enabled: !!logId,
    ...options,
  });
};