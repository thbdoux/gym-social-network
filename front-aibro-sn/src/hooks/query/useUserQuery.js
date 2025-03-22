import { 
  useQuery, 
  useMutation, 
  useQueryClient,
} from '@tanstack/react-query';
import { userService } from '../../api/services';

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
    staleTime: 1000 * 60 * 2, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    retry: false, // Don't retry if the token is invalid
    // Only attempt to fetch if there's a token
    enabled: !!localStorage.getItem('token'),
    ...options
  });
};

export const useUser = (userId, options = {}) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getUserById(userId),
    enabled: !!userId,
    // Default to a relatively short stale time for user data
    // This ensures we're not using very old data
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
    staleTime: 1000 * 30, // 30 seconds - shorter stale time for frequently changing data
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

// Register user (no need to invalidate cache since it happens before auth)
export const useRegisterUser = () => {
  return useMutation({
    mutationFn: (userData) => userService.registerUser(userData),
  });
};

// In useUserQuery.js
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ username, password }) => userService.login(username, password),
    onSuccess: (data) => {
      // Store the token
      localStorage.setItem('token', data.access);
      
      // COMPLETELY clear the query client cache to remove any previous user's data
      queryClient.clear();
      
      // Then refetch current user data
      queryClient.resetQueries({ queryKey: userKeys.current() });
    },
  });
};

// Add a logout function if not already present
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return () => {
    localStorage.removeItem('token');
    queryClient.clear(); // Complete cache purge
  };
};