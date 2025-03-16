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
export const useProgramPreviewDetails = (programId) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: profilePreviewKeys.program(programId),
    queryFn: async () => {
      try {
        // If the program doesn't exist in cache, try fetching it
        const data = await profilePreviewService.getProgramDetails(programId);
        
        // Update the programs list cache with this program to ensure consistency
        // Only do this if the program was successfully fetched
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
    // Don't keep stale data for too long - refresh more frequently
    staleTime: 1000 * 60 * 2, // 2 minutes
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