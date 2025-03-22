import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profilePreviewService } from '../../api/services';

// Query keys
export const profilePreviewKeys = {
  all: ['profilePreviews'],
  user: (userId) => [...profilePreviewKeys.all, 'user', userId],
  friends: (userId) => [...profilePreviewKeys.user(userId), 'friends'],
  posts: (userId) => [...profilePreviewKeys.user(userId), 'posts'],
  program: (programId) => [...profilePreviewKeys.all, 'program', programId],
  workoutLog: (logId) => [...profilePreviewKeys.all, 'workoutLog', logId],
};

// Get user profile preview data
export const useUserProfilePreview = (userId) => {
  return useQuery({
    queryKey: profilePreviewKeys.user(userId),
    queryFn: () => profilePreviewService.getUserProfilePreview(userId),
    enabled: !!userId,
  });
};

// Get user friends for profile preview
export const useUserFriends = (userId) => {
  return useQuery({
    queryKey: profilePreviewKeys.friends(userId),
    queryFn: () => profilePreviewService.getUserFriends(userId),
    enabled: !!userId,
  });
};

// Get user posts for profile preview
export const useUserPosts = (userId) => {
  return useQuery({
    queryKey: profilePreviewKeys.posts(userId),
    queryFn: () => profilePreviewService.getUserPosts(userId),
    enabled: !!userId,
  });
};

// Get program details for profile preview
// In useProfilePreviewQuery.js
export const useProgramPreviewDetails = (programId) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: profilePreviewKeys.program(programId),
    queryFn: async () => {
      try {
        // Always fetch fresh data from the server for program previews
        // This ensures we get the most up-to-date program data for any user
        const data = await profilePreviewService.getProgramDetails(programId);
        
        // Update the programs list cache with this program to ensure consistency
        queryClient.setQueryData(['programs', 'list'], (oldData) => {
          if (!oldData) return [data];
          // If the program already exists in the list, replace it
          if (oldData.find(p => p.id === data.id)) {
            return oldData.map(p => p.id === data.id ? data : p);
          }
          // Otherwise add it to the list
          return [...oldData, data];
        });
        
        return data;
      } catch (error) {
        console.error(`Error fetching program ${programId}:`, error);
        
        // For 404 errors, remove this program from all caches
        if (error.response && error.response.status === 404) {
          // If the program doesn't exist, clear it from current user if it's set
          queryClient.setQueryData(['users', 'current'], (userData) => {
            if (userData && userData.current_program && userData.current_program.id === programId) {
              return {
                ...userData,
                current_program: null
              };
            }
            return userData;
          });
          
          // Also remove it from the programs list if it's there
          queryClient.setQueryData(['programs', 'list'], (oldData) => {
            if (!oldData) return [];
            return oldData.filter(p => p.id !== programId);
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
export const useWorkoutLogPreviewDetails = (logId) => {
  return useQuery({
    queryKey: profilePreviewKeys.workoutLog(logId),
    queryFn: () => profilePreviewService.getWorkoutLogDetails(logId),
    enabled: !!logId,
  });
};