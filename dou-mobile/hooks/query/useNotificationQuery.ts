// hooks/queries/useNotificationQuery.ts
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { notificationService } from '../../api/services';
import { useAuth } from '../useAuth';

// Query keys
export const notificationKeys = {
  all: ['notifications'],
  lists: () => [...notificationKeys.all, 'list'],
  list: (filters) => [...notificationKeys.lists(), { ...filters }],
  unread: () => [...notificationKeys.all, 'unread'],
  count: () => [...notificationKeys.all, 'count'],
  preferences: () => [...notificationKeys.all, 'preferences'],
};

// Enhanced notifications query with better real-time capabilities
export const useNotifications = (options = {}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: notificationKeys.lists(),
    queryFn: notificationService.getNotifications,
    staleTime: 1000 * 30, // Reduced to 30 seconds for more frequent updates
    refetchInterval: 1000 * 60, // Auto-refetch every minute as fallback
    refetchIntervalInBackground: false, // Don't refetch in background
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
    refetchOnReconnect: true, // Refetch when network reconnects
    enabled: isAuthenticated, // Only run when authenticated
    ...options
  });

  return query;
};

// Enhanced unread notifications query
export const useUnreadNotifications = (options = {}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: notificationService.getUnreadNotifications,
    staleTime: 1000 * 15, // Very short stale time for unread notifications
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: isAuthenticated,
    ...options
  });
};

// Enhanced notification count query with aggressive updates
export const useNotificationCount = (options = {}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: notificationService.getNotificationCount,
    staleTime: 1000 * 15, // Very short stale time
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: isAuthenticated,
    retry: 3, // Retry failed requests
    ...options
  });
};

// Enhanced mark as read with optimistic updates
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // **NEW: Optimistic update**
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.count() });
      
      const previousNotifications = queryClient.getQueryData(notificationKeys.lists());
      const previousCount = queryClient.getQueryData(notificationKeys.count());
      
      // Optimistically update notification
      queryClient.setQueryData(notificationKeys.lists(), (oldData: any[] = []) => {
        return oldData.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, is_seen: true }
            : notification
        );
      });
      
      // Optimistically update count
      queryClient.setQueryData(notificationKeys.count(), (oldData: any) => {
        if (oldData && oldData.unread > 0) {
          return {
            ...oldData,
            unread: oldData.unread - 1,
          };
        }
        return oldData;
      });
      
      return { previousNotifications, previousCount };
    },
    onError: (err, notificationId, context) => {
      // **NEW: Rollback on error**
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.lists(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(notificationKeys.count(), context.previousCount);
      }
    },
    onSuccess: () => {
      // Invalidate queries for fresh data
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
    },
  });
};

// Enhanced mark all as read with optimistic updates
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onMutate: async () => {
      // **NEW: Optimistic update**
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.count() });
      
      const previousNotifications = queryClient.getQueryData(notificationKeys.lists());
      const previousCount = queryClient.getQueryData(notificationKeys.count());
      
      // Optimistically mark all as read
      queryClient.setQueryData(notificationKeys.lists(), (oldData: any[] = []) => {
        return oldData.map(notification => ({ 
          ...notification, 
          is_read: true, 
          is_seen: true 
        }));
      });
      
      // Optimistically update count to 0
      queryClient.setQueryData(notificationKeys.count(), (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            unread: 0,
          };
        }
        return oldData;
      });
      
      return { previousNotifications, previousCount };
    },
    onError: (err, variables, context) => {
      // **NEW: Rollback on error**
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.lists(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(notificationKeys.count(), context.previousCount);
      }
    },
    onSuccess: () => {
      // Invalidate queries for fresh data
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
    },
  });
};

// Get notification preferences
export const useNotificationPreferences = (options = {}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: notificationService.getPreferences,
    staleTime: 1000 * 60 * 60, // 1 hour - preferences don't change often
    enabled: isAuthenticated,
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

// **NEW: Custom hook for manual refresh**
export const useRefreshNotifications = () => {
  const queryClient = useQueryClient();
  
  const refreshAll = async () => {
    console.log('🔄 Manually refreshing all notification data');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.count() }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() }),
    ]);
  };
  
  const refetchAll = async () => {
    console.log('🔄 Refetching all notification data');
    await Promise.all([
      queryClient.refetchQueries({ queryKey: notificationKeys.lists() }),
      queryClient.refetchQueries({ queryKey: notificationKeys.count() }),
      queryClient.refetchQueries({ queryKey: notificationKeys.unread() }),
    ]);
  };
  
  return { refreshAll, refetchAll };
};