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
  export const useCurrentUser = () => {
    return useQuery({
      queryKey: userKeys.current(),
      queryFn: userService.getCurrentUser,
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 60, // 1 hour
      retry: false, // Don't retry if the token is invalid
      // Only attempt to fetch if there's a token
      enabled: !!localStorage.getItem('token')
    });
  };
  
  // Get a user by ID
  export const useUser = (userId) => {
    return useQuery({
      queryKey: userKeys.detail(userId),
      queryFn: () => userService.getUserById(userId),
      enabled: !!userId,
    });
  };
  
  // Get all users
  export const useUsers = () => {
    return useQuery({
      queryKey: userKeys.lists(),
      queryFn: userService.getAllUsers,
    });
  };
  
  // Get friends list
  export const useFriends = () => {
    return useQuery({
      queryKey: userKeys.friends(),
      queryFn: userService.getFriends,
    });
  };
  
  // Get friend requests
  export const useFriendRequests = () => {
    return useQuery({
      queryKey: userKeys.friendRequests(),
      queryFn: userService.getFriendRequests,
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
        // Invalidate affected queries
        queryClient.invalidateQueries({ queryKey: userKeys.detail() });
        queryClient.invalidateQueries({ queryKey: userKeys.friendRequests() });
      },
    });
  };
  
  // Respond to friend request
  export const useRespondToFriendRequest = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ userId, response }) => userService.respondToFriendRequest(userId, response),
      onSuccess: () => {
        // Invalidate affected queries
        queryClient.invalidateQueries({ queryKey: userKeys.friendRequests() });
        queryClient.invalidateQueries({ queryKey: userKeys.friends() });
      },
    });
  };
  
  // Remove friend
  export const useRemoveFriend = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (userId) => userService.removeFriend(userId),
      onSuccess: () => {
        // Invalidate affected queries
        queryClient.invalidateQueries({ queryKey: userKeys.friends() });
      },
    });
  };
  
  // Register user (no need to invalidate cache since it happens before auth)
  export const useRegisterUser = () => {
    return useMutation({
      mutationFn: (userData) => userService.registerUser(userData),
    });
  };
  
  // Login user
  export const useLogin = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ username, password }) => userService.login(username, password),
      onSuccess: (data) => {
        // Store the token
        localStorage.setItem('token', data.access);
        
        // Reset queries and fetch user data
        queryClient.resetQueries({ queryKey: userKeys.current() });
      },
    });
  };