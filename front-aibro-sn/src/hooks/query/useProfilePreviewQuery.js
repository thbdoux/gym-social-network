import { useQuery } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: profilePreviewKeys.program(programId),
    queryFn: () => profilePreviewService.getProgramDetails(programId),
    enabled: !!programId,
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