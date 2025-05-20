// hooks/queries/useNotificationQuery.ts
import { 
    useQuery, 
    useMutation, 
    useQueryClient,
  } from '@tanstack/react-query';
  import { notificationService } from '../../api/services';
  
  // Query keys
  export const notificationKeys = {
    all: ['notifications'],
    lists: () => [...notificationKeys.all, 'list'],
    list: (filters) => [...notificationKeys.lists(), { ...filters }],
    unread: () => [...notificationKeys.all, 'unread'],
    count: () => [...notificationKeys.all, 'count'],
    preferences: () => [...notificationKeys.all, 'preferences'],
  };
  
  // Get all notifications
  export const useNotifications = (options = {}) => {
    return useQuery({
      queryKey: notificationKeys.lists(),
      queryFn: notificationService.getNotifications,
      staleTime: 1000 * 60, // 1 minute
      ...options
    });
  };
  
  // Get unread notifications
  export const useUnreadNotifications = (options = {}) => {
    return useQuery({
      queryKey: notificationKeys.unread(),
      queryFn: notificationService.getUnreadNotifications,
      staleTime: 1000 * 30, // 30 seconds - shorter for unread which changes frequently
      ...options
    });
  };
  
  // Get notification count
  export const useNotificationCount = (options = {}) => {
    return useQuery({
      queryKey: notificationKeys.count(),
      queryFn: notificationService.getNotificationCount,
      staleTime: 1000 * 30, // 30 seconds
      refetchInterval: 1000 * 60, // Refresh every minute
      ...options
    });
  };
  
  // Mark notification as read
  export const useMarkNotificationAsRead = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
      onSuccess: () => {
        // Update notification lists and counts
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
      },
    });
  };
  
  // Mark all notifications as read
  export const useMarkAllNotificationsAsRead = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: notificationService.markAllAsRead,
      onSuccess: () => {
        // Update notification lists and counts
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
      },
    });
  };
  
  // Get notification preferences
  export const useNotificationPreferences = (options = {}) => {
    return useQuery({
      queryKey: notificationKeys.preferences(),
      queryFn: notificationService.getPreferences,
      staleTime: 1000 * 60 * 60, // 1 hour - preferences don't change often
      ...options
    });
  };
  
  // Update notification preferences
  export const useUpdateNotificationPreferences = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (preferences) => notificationService.updatePreferences(preferences),
      onSuccess: (updatedPreferences) => {
        // Update preferences in cache
        queryClient.setQueryData(notificationKeys.preferences(), updatedPreferences);
      },
    });
  };