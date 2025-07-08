// hooks/query/useUserQuery.ts - Enhanced with auth guards
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
import { useAuth } from '../useAuth';

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
  friendshipStatus: (userId) => [...userKeys.all, 'friendship', userId],
  userFriends: (userId) => [...userKeys.all, 'friends', userId],
};

// Get current user - AUTH PROTECTED
export const useCurrentUser = (options = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching current user...');
      return userService.getCurrentUser();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user &&
      options.enabled !== false,
    
    staleTime: 1000 * 60 * 2, // 2 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
    
    ...options
  });
};

// Get user by ID - AUTH PROTECTED
export const useUser = (userId, options = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching user details:', userId);
      return userService.getUserById(userId);
    },
    enabled: 
      !!userId &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user &&
      options.enabled !== false,
    
    staleTime: 1000 * 60 * 2, // 2 minutes
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
    
    ...options
  });
};

// Get all users - AUTH PROTECTED
export const useUsers = (options = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching all users...');
      return userService.getAllUsers();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user &&
      options.enabled !== false,
    
    staleTime: 1000 * 60 * 2, // 2 minutes
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
    
    ...options
  });
};

// Get friends list - AUTH PROTECTED
export const useFriends = (options = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: userKeys.friends(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching friends list...');
      return userService.getFriends();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user &&
      options.enabled !== false,
    
    staleTime: 1000 * 30, // 30 seconds - shorter stale time for frequently changing data
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
    
    ...options
  });
};

// Get friend requests - AUTH PROTECTED
export const useFriendRequests = (options = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: userKeys.friendRequests(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching friend requests...');
      return userService.getFriendRequests();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user &&
      options.enabled !== false,
    
    staleTime: 1000 * 30, // 30 seconds
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
    
    ...options
  });
};

/**
 * Hook to check friendship status with another user - AUTH PROTECTED
 */
export const useFriendshipStatus = (userId, options = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: userKeys.friendshipStatus(userId),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching friendship status for user:', userId);
      return userService.checkFriendshipStatus(userId);
    },
    enabled: 
      !!userId &&
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user &&
      options.enabled !== false,
    
    staleTime: 1000 * 30, // 30 seconds
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    
    meta: {
      requiresAuth: true,
    },
    
    ...options
  });
};

// Update current user - AUTH PROTECTED
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('✏️ Updating current user...');
      return userService.updateUser(updates);
    },
    onSuccess: (updatedUser) => {
      // Update current user cache
      queryClient.setQueryData(userKeys.current(), updatedUser);
      
      // Update user in details cache if it exists
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Update language preference - AUTH PROTECTED
export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (language) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('🌐 Updating language preference:', language);
      return userService.updateUser({ language_preference: language });
    },
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
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Follow a user - AUTH PROTECTED
export const useFollowUser = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (userId) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('👥 Following user:', userId);
      return userService.followUser(userId);
    },
    onSuccess: () => {
      // Invalidate user queries that could be affected
      queryClient.invalidateQueries({ queryKey: userKeys.detail() });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Unfollow a user - AUTH PROTECTED
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (userId) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('👥 Unfollowing user:', userId);
      return userService.unfollowUser(userId);
    },
    onSuccess: () => {
      // Invalidate user queries that could be affected
      queryClient.invalidateQueries({ queryKey: userKeys.detail() });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Send friend request - AUTH PROTECTED
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (userId) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('👥 Sending friend request to user:', userId);
      return userService.sendFriendRequest(userId);
    },
    onSuccess: () => {
      // Invalidate all affected queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.friendRequests() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail() });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Respond to friend request - AUTH PROTECTED
export const useRespondToFriendRequest = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ userId, response }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('👥 Responding to friend request from user:', userId, 'with response:', response);
      return userService.respondToFriendRequest(userId, response);
    },
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
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Remove friend - AUTH PROTECTED
export const useRemoveFriend = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (userId) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('👥 Removing friend:', userId);
      return userService.removeFriend(userId);
    },
    onSuccess: (data, userId) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: userKeys.friends() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    },
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 1;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Register user - NO AUTH REQUIRED (public)
export const useRegisterUser = () => {
  return useMutation({
    mutationFn: (userData) => {
      console.log('📝 Registering new user...');
      return userService.registerUser(userData);
    },
    
    meta: {
      requiresAuth: false,
    },
  });
};

// Login - NO AUTH REQUIRED (public)
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ username, password }) => {
      console.log('🔐 Logging in user:', username);
      return userService.login(username, password);
    },
    onSuccess: async (data) => {
      try {
        console.log('✅ Login successful, clearing cache and storing token...');
        
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
    
    meta: {
      requiresAuth: false,
    },
  });
};

// Logout - Uses AuthContext logout (which handles auth properly)
export const useLogout = () => {
  const { logout } = useAuth();
  return logout;
};