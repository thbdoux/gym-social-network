// hooks/query/useUserCountQuery.ts
import { useQuery } from '@tanstack/react-query';
import { userCountService } from '../../api/services';

// Query keys
export const userCountKeys = {
  all: ['userCounts'],
  friends: (userId = null) => userId ? [...userCountKeys.all, 'friends', userId] : [...userCountKeys.all, 'friends'],
  posts: (userId = null) => userId ? [...userCountKeys.all, 'posts', userId] : [...userCountKeys.all, 'posts'],
  workouts: (userId = null) => userId ? [...userCountKeys.all, 'workouts', userId] : [...userCountKeys.all, 'workouts'],
  allCounts: (userId = null) => userId ? [...userCountKeys.all, 'all', userId] : [...userCountKeys.all, 'all']
};

/**
 * Hook to get the count of friends for the current user or a specific user
 */
export const useFriendsCount = (userId = null, options = {}) => {
  return useQuery({
    queryKey: userCountKeys.friends(userId),
    queryFn: () => userId 
      ? userCountService.getUserFriendsCount(userId)
      : userCountService.getFriendsCount(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};

/**
 * Hook to get the count of posts for the current user or a specific user
 */
export const usePostsCount = (userId = null, options = {}) => {
  return useQuery({
    queryKey: userCountKeys.posts(userId),
    queryFn: () => userId 
      ? userCountService.getUserPostsCount(userId)
      : userCountService.getPostsCount(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};

/**
 * Hook to get the count of workouts for the current user or a specific user
 */
export const useWorkoutsCount = (userId = null, options = {}) => {
  return useQuery({
    queryKey: userCountKeys.workouts(userId),
    queryFn: () => userId 
      ? userCountService.getUserWorkoutsCount(userId)
      : userCountService.getWorkoutsCount(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};

/**
 * Hook to get all counts in a single request (more efficient)
 */
export const useAllCounts = (userId = null, options = {}) => {
  return useQuery({
    queryKey: userCountKeys.allCounts(userId),
    queryFn: () => userId 
      ? userCountService.getUserAllCounts(userId)
      : userCountService.getAllCounts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};