// hooks/query/useUserCountQuery.ts
import { useQuery } from '@tanstack/react-query';
import { userCountService } from '../../api/services';

// Query keys
export const userCountKeys = {
  all: ['userCounts'],
  friends: () => [...userCountKeys.all, 'friends'],
  posts: () => [...userCountKeys.all, 'posts'],
  workouts: () => [...userCountKeys.all, 'workouts'],
  allCounts: () => [...userCountKeys.all, 'all']
};

/**
 * Hook to get the count of friends for the current user
 */
export const useFriendsCount = (options = {}) => {
  return useQuery({
    queryKey: userCountKeys.friends(),
    queryFn: userCountService.getFriendsCount,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};

/**
 * Hook to get the count of posts for the current user
 */
export const usePostsCount = (options = {}) => {
  return useQuery({
    queryKey: userCountKeys.posts(),
    queryFn: userCountService.getPostsCount,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};

/**
 * Hook to get the count of workouts for the current user
 */
export const useWorkoutsCount = (options = {}) => {
  return useQuery({
    queryKey: userCountKeys.workouts(),
    queryFn: userCountService.getWorkoutsCount,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};

/**
 * Hook to get all counts in a single request (more efficient)
 */
export const useAllCounts = (options = {}) => {
  return useQuery({
    queryKey: userCountKeys.allCounts(),
    queryFn: userCountService.getAllCounts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};