import { 
  useQuery, 
  useMutation, 
  useQueryClient,
} from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { userService } from '../../api/services';
import { postKeys } from './usePostQuery';
import { programKeys } from './useProgramQuery';
import { workoutKeys } from './useWorkoutQuery';
import { logKeys } from './useLogQuery';
import { gymKeys } from './useGymQuery';
import { profilePreviewKeys } from './useProfilePreviewQuery';

// Query keys
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), { ...filters }],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
  current: () => [...userKeys.all, 'current'],
  friends: () => [...userKeys.all, 'friends'],
  friendRequests: () => [...userKeys.all, 'friendRequests'],
};
  // Get current user
  export const useCurrentUser = (options = {}) => {
    return useQuery({
      queryKey: userKeys.current(),
      queryFn: userService.getCurrentUser,
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: false, // Don't retry if the token is invalid
      // Only attempt to fetch if there's a token
      enabled: true, // Will be checked inside the service
      ...options
    });
  };
  
  export const useUser = (userId, options = {}) => {
    return useQuery({
      queryKey: userKeys.detail(userId),
      queryFn: () => userService.getUserById(userId),
      enabled: !!userId,
      // Default to a relatively short stale time for user data
      staleTime: 1000 * 60 * 2, // 2 minutes
      ...options
    });
  };
  
  // Get all users
  export const useUsers = (options = {}) => {
    return useQuery({
      queryKey: userKeys.lists(),
      queryFn: userService.getAllUsers,
      staleTime: 1000 * 60 * 2, // 2 minutes
      ...options
    });
  };
  
  // Get friends list
  export const useFriends = (options = {}) => {
    return useQuery({
      queryKey: userKeys.friends(),
      queryFn: userService.getFriends,
      staleTime: 1000 * 30, // 30 seconds - shorter stale time for frequently changing data
      ...options
    });
  };
  
  // Get friend requests
  export const useFriendRequests = (options = {}) => {
    return useQuery({
      queryKey: userKeys.friendRequests(),
      queryFn: userService.getFriendRequests,
      staleTime: 1000 * 30, // 30 seconds
      ...options
    });
  };
  
  // Update current user
  export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (updates) => userService.updateUser(updates),
      onSuccess: (updatedUser) => {
        // Update current user cache
        queryClient.setQueryData(userKeys.current(), updatedUser);
        
        // Update user in details cache if it exists
        queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
      },
    });
  };
  
  // Update language preference
  export const useUpdateLanguage = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (language) => userService.updateUser({ language_preference: language }),
      onSuccess: (userData, language) => {
        // Update current user in cache with new language preference
        queryClient.setQueryData(userKeys.current(), (oldData) => {
          if (!oldData) return null;
          
          return {
            ...oldData,
            language_preference: language
          };
        });
      },
      onError: (error) => {
        console.error('Failed to update language preference:', error);
      }
    });
  };
  
  // Follow a user
  export const useFollowUser = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (userId) => userService.followUser(userId),
      onSuccess: () => {
        // Invalidate user queries that could be affected
        queryClient.invalidateQueries({ queryKey: userKeys.detail() });
        queryClient.invalidateQueries({ queryKey: userKeys.current() });
      },
    });
  };
  
  // Unfollow a user
  export const useUnfollowUser = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (userId) => userService.unfollowUser(userId),
      onSuccess: () => {
        // Invalidate user queries that could be affected
        queryClient.invalidateQueries({ queryKey: userKeys.detail() });
        queryClient.invalidateQueries({ queryKey: userKeys.current() });
      },
    });
  };
  
  // Send friend request
  export const useSendFriendRequest = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (userId) => userService.sendFriendRequest(userId),
      onSuccess: () => {
        // Invalidate all affected queries to ensure consistency
        queryClient.invalidateQueries({ queryKey: userKeys.friendRequests() });
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        queryClient.invalidateQueries({ queryKey: userKeys.detail() });
      },
    });
  };
  
  // Respond to friend request
  export const useRespondToFriendRequest = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ userId, response }) => userService.respondToFriendRequest(userId, response),
      onSuccess: (data, variables) => {
        // Invalidate affected queries
        queryClient.invalidateQueries({ queryKey: userKeys.friendRequests() });
        
        // If the request was accepted, also update friends list
        if (variables.response === 'accept') {
          queryClient.invalidateQueries({ queryKey: userKeys.friends() });
        }
        
        // Invalidate user lists to update recommended users
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        
        // Invalidate specific user details that might have changed
        queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
      },
    });
  };
  
  // Remove friend
  export const useRemoveFriend = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (userId) => userService.removeFriend(userId),
      onSuccess: (data, userId) => {
        // Invalidate affected queries
        queryClient.invalidateQueries({ queryKey: userKeys.friends() });
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      },
    });
  };
  
  // Register user 
  export const useRegisterUser = () => {
    return useMutation({
      mutationFn: (userData) => userService.registerUser(userData),
    });
  };
  
  export const useLogin = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ username, password }) => userService.login(username, password),
      onSuccess: async (data) => {
        try {
          // STEP 1: Perform a complete cache purge
          queryClient.clear();
          
          // STEP 2: Store the new token
          await SecureStore.setItemAsync('token', data.access);
          
          // STEP 3: Force explicit removal of specific cached queries
          // This is redundant with clear() but serves as a safety measure
          const allQueryKeys = [
            userKeys.all,
            postKeys.all,
            programKeys.all,
            workoutKeys.all,
            logKeys.all,
            gymKeys.all,
            profilePreviewKeys.all
          ];
          
          // Remove each query key specifically
          allQueryKeys.forEach(key => {
            queryClient.removeQueries({ queryKey: key, exact: false });
          });
          
          // STEP 4: Force a reset of the current user query to trigger refetch
          queryClient.resetQueries({ queryKey: userKeys.current(), exact: true });
          
          // STEP 5: Force immediate refetch of current user data
          queryClient.invalidateQueries({ 
            queryKey: userKeys.current(),
            refetchType: 'active',
            exact: true
          });
        } catch (error) {
          console.error('Error handling login cache operations:', error);
        }
      },
    });
  };
  
  export const useLogout = () => {
    const queryClient = useQueryClient();
    
    return async () => {
      try {
        // STEP 1: Remove token first
        await SecureStore.deleteItemAsync('token');
        
        // STEP 2: Force explicit removal of specific cached queries
        const allQueryKeys = [
          userKeys.all,
          postKeys.all,
          programKeys.all,
          workoutKeys.all,
          logKeys.all,
          gymKeys.all,
          profilePreviewKeys.all
        ];
        
        // Remove each query key specifically
        allQueryKeys.forEach(key => {
          queryClient.removeQueries({ queryKey: key, exact: false });
        });
        
        // STEP 3: Perform a complete cache purge
        queryClient.clear();
        
        // STEP 4: Reset cache to initial state
        queryClient.resetQueries();
        
        // STEP 5: Add a small delay to ensure cache operations complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // STEP 6: Navigate to login screen
        router.replace('/login');
      } catch (error) {
        console.error('Error during logout:', error);
        // Still attempt to navigate to login even if there was an error
        router.replace('/login');
      }
    };
  };