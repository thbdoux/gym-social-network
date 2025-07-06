// hooks/query/useNotificationQuery.ts - ENHANCED VERSION with comprehensive auth guards
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { notificationService } from '../../api/services';
import { useAuth } from '../useAuth';
import { type Notification, type NotificationPreference, type NotificationCount } from '../../api/services/notificationService';

// Enhanced query keys with better structure
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters?: any) => [...notificationKeys.lists(), { ...filters }] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  count: () => [...notificationKeys.all, 'count'] as const,
  summary: () => [...notificationKeys.all, 'summary'] as const,
  analytics: (days?: number) => [...notificationKeys.all, 'analytics', days] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  categories: () => [...notificationKeys.preferences(), 'categories'] as const,
  devices: () => [...notificationKeys.all, 'devices'] as const,
  byType: (type?: string) => [...notificationKeys.all, 'by-type', type] as const,
};

// Enhanced notifications query with comprehensive filtering - AUTH PROTECTED
export const useNotifications = (options: {
  type?: string;
  is_read?: boolean;
  priority?: string;
  since?: string;
  limit?: number;
  refetchInterval?: number | false;
  enabled?: boolean;
} = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  const { type, is_read, priority, since, limit, refetchInterval, enabled = true, ...queryOptions } = options;

  const query = useQuery({
    queryKey: notificationKeys.list({ type, is_read, priority, since, limit }),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching notifications...');
      return notificationService.getNotifications({ type, is_read, priority, since, limit });
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user &&
      enabled,
    
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: refetchInterval ?? (isAuthenticated ? 1000 * 60 : false), // 1 minute if authenticated
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    meta: {
      requiresAuth: true,
    },
    
    ...queryOptions
  });

  return query;
};

// Enhanced infinite notifications query for pagination - AUTH PROTECTED
export const useInfiniteNotifications = (options: {
  type?: string;
  is_read?: boolean;
  priority?: string;
  limit?: number;
} = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  const { type, is_read, priority, limit = 20 } = options;

  return useInfiniteQuery({
    queryKey: notificationKeys.list({ type, is_read, priority, infinite: true }),
    queryFn: async ({ pageParam = 1 }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching infinite notifications page:', pageParam);
      return notificationService.getNotifications({ 
        type, 
        is_read, 
        priority, 
        limit,
        offset: (pageParam - 1) * limit 
      });
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.length + 1;
    },
    
    staleTime: 1000 * 30,
    
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
  });
};

// Enhanced unread notifications query - AUTH PROTECTED
export const useUnreadNotifications = (options: { type?: string } = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching unread notifications...');
      return notificationService.getUnreadNotifications(options);
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 3;
    },
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Enhanced notification count with detailed breakdown - AUTH PROTECTED
export const useNotificationCount = (options: {
  refetchInterval?: number | false;
  enabled?: boolean;
} = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  const { refetchInterval, enabled = true } = options;
  
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching notification count...');
      return notificationService.getNotificationCount();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user &&
      enabled,
    
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: refetchInterval ?? 1000 * 30, // 30 seconds
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not authenticated') || 
          error?.code === 'USER_LOGGED_OUT') {
        return false;
      }
      return failureCount < 3;
    },
    
    select: (data: NotificationCount) => ({
      ...data,
      hasUnread: data.unread > 0,
      hasUnseen: data.unseen > 0,
      recentActivity: data.recent_24h > 0,
    }),
    
    meta: {
      requiresAuth: true,
    },
  });
};

// Enhanced notification summary - AUTH PROTECTED
export const useNotificationSummary = () => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.summary(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching notification summary...');
      return notificationService.getNotificationSummary();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // 10 minutes
    
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
  });
};

// Enhanced notification analytics - AUTH PROTECTED
export const useNotificationAnalytics = (days: number = 30) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.analytics(days),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching notification analytics for', days, 'days...');
      return notificationService.getAnalytics(days);
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 30, // 30 minutes
    
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
  });
};

// Enhanced notifications by type - AUTH PROTECTED
export const useNotificationsByType = () => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.byType(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching notifications by type...');
      return notificationService.getNotificationsByType();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 1000 * 60, // 1 minute
    
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
  });
};

// Enhanced mark as read with optimistic updates and error handling - AUTH PROTECTED
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('✅ Marking notification as read:', notificationId);
      return notificationService.markAsRead(notificationId);
    },
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.count() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.unread() });
      
      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData(notificationKeys.lists());
      const previousCount = queryClient.getQueryData(notificationKeys.count());
      const previousUnread = queryClient.getQueryData(notificationKeys.unread());
      
      // Optimistically update notifications
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true, is_seen: true }
              : notification
          );
        }
      );
      
      // Optimistically update count
      queryClient.setQueryData(
        notificationKeys.count(),
        (oldData: NotificationCount | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            unread: Math.max(0, oldData.unread - 1),
          };
        }
      );
      
      // Optimistically update unread list
      queryClient.setQueryData(
        notificationKeys.unread(),
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(notification => notification.id !== notificationId);
        }
      );
      
      return { previousNotifications, previousCount, previousUnread };
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.lists(), context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(notificationKeys.count(), context.previousCount);
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(notificationKeys.unread(), context.previousUnread);
      }
      
      console.error('Failed to mark notification as read:', err);
    },
    onSuccess: () => {
      // Invalidate related queries for fresh data
      queryClient.invalidateQueries({ queryKey: notificationKeys.summary() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.analytics() });
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

// Enhanced mark multiple notifications as read - AUTH PROTECTED
export const useMarkNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (notificationIds: number[]) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('✅ Marking multiple notifications as read:', notificationIds.length);
      // Use bulk API if available, otherwise individual calls
      const promises = notificationIds.map(id => notificationService.markAsRead(id));
      return Promise.all(promises);
    },
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.count() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.unread() });
      
      const previousData = {
        notifications: queryClient.getQueryData(notificationKeys.lists()),
        count: queryClient.getQueryData(notificationKeys.count()),
        unread: queryClient.getQueryData(notificationKeys.unread()),
      };
      
      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(notification => 
            notificationIds.includes(notification.id)
              ? { ...notification, is_read: true, is_seen: true }
              : notification
          );
        }
      );
      
      queryClient.setQueryData(
        notificationKeys.count(),
        (oldData: NotificationCount | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            unread: Math.max(0, oldData.unread - notificationIds.length),
          };
        }
      );
      
      return previousData;
    },
    onError: (err, notificationIds, context) => {
      if (context) {
        queryClient.setQueryData(notificationKeys.lists(), context.notifications);
        queryClient.setQueryData(notificationKeys.count(), context.count);
        queryClient.setQueryData(notificationKeys.unread(), context.unread);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.summary() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.analytics() });
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

// Enhanced mark all as read with type filtering - AUTH PROTECTED
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (type?: string) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('✅ Marking all notifications as read. Type filter:', type || 'none');
      return notificationService.markAllAsRead(type);
    },
    onMutate: async (type) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.count() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.unread() });
      
      const previousData = {
        notifications: queryClient.getQueryData(notificationKeys.lists()),
        count: queryClient.getQueryData(notificationKeys.count()),
        unread: queryClient.getQueryData(notificationKeys.unread()),
      };
      
      // Optimistically mark all (or filtered) as read
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(notification => 
            !type || notification.notification_type === type
              ? { ...notification, is_read: true, is_seen: true }
              : notification
          );
        }
      );
      
      // Update count
      queryClient.setQueryData(
        notificationKeys.count(),
        (oldData: NotificationCount | undefined) => {
          if (!oldData) return oldData;
          if (type) {
            // Calculate reduction for specific type
            const typeCount = oldData.by_type?.[type]?.unread || 0;
            return {
              ...oldData,
              unread: Math.max(0, oldData.unread - typeCount),
              by_type: {
                ...oldData.by_type,
                [type]: {
                  ...oldData.by_type[type],
                  unread: 0,
                }
              }
            };
          } else {
            return {
              ...oldData,
              unread: 0,
            };
          }
        }
      );
      
      return previousData;
    },
    onError: (err, type, context) => {
      if (context) {
        queryClient.setQueryData(notificationKeys.lists(), context.notifications);
        queryClient.setQueryData(notificationKeys.count(), context.count);
        queryClient.setQueryData(notificationKeys.unread(), context.unread);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.summary() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.analytics() });
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

// Enhanced mark as seen - AUTH PROTECTED
export const useMarkNotificationsAsSeen = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (notificationIds?: number[]) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('👁️ Marking notifications as seen:', notificationIds?.length || 'all');
      return notificationService.markAsSeen(notificationIds);
    },
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.count() });
      
      const previousData = {
        notifications: queryClient.getQueryData(notificationKeys.lists()),
        count: queryClient.getQueryData(notificationKeys.count()),
      };
      
      // Optimistically mark as seen
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(notification => {
            if (!notificationIds || notificationIds.includes(notification.id)) {
              return { ...notification, is_seen: true };
            }
            return notification;
          });
        }
      );
      
      // Update unseen count
      queryClient.setQueryData(
        notificationKeys.count(),
        (oldData: NotificationCount | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            unseen: notificationIds ? Math.max(0, oldData.unseen - notificationIds.length) : 0,
          };
        }
      );
      
      return previousData;
    },
    onError: (err, notificationIds, context) => {
      if (context) {
        queryClient.setQueryData(notificationKeys.lists(), context.notifications);
        queryClient.setQueryData(notificationKeys.count(), context.count);
      }
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

// Enhanced notification preferences - AUTH PROTECTED
export const useNotificationPreferences = (options = {}) => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching notification preferences...');
      return notificationService.getPreferences();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 1000 * 60 * 60, // 1 hour
    
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

// Enhanced preference categories - AUTH PROTECTED
export const useNotificationPreferenceCategories = () => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.categories(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching notification preference categories...');
      return notificationService.getPreferenceCategories();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - categories don't change often
    
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

// Enhanced update preferences - AUTH PROTECTED
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreference>) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('⚙️ Updating notification preferences...');
      return notificationService.updatePreferences(preferences);
    },
    onMutate: async (newPreferences) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences() });
      
      const previousPreferences = queryClient.getQueryData(notificationKeys.preferences());
      
      // Optimistically update
      queryClient.setQueryData(
        notificationKeys.preferences(),
        (oldData: NotificationPreference | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...newPreferences };
        }
      );
      
      return { previousPreferences };
    },
    onError: (err, newPreferences, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(notificationKeys.preferences(), context.previousPreferences);
      }
    },
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(notificationKeys.preferences(), updatedPreferences);
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

// Enhanced bulk preference update - AUTH PROTECTED
export const useBulkUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (categories: Record<string, boolean>) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('⚙️ Bulk updating notification preferences...');
      return notificationService.bulkUpdatePreferences(categories);
    },
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(notificationKeys.preferences(), updatedPreferences);
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

// Enhanced device management - AUTH PROTECTED
export const useDeviceTokens = () => {
  const { isAuthenticated, user, isInitialized, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.devices(),
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📡 Fetching device tokens...');
      return notificationService.listDeviceTokens();
    },
    enabled: 
      isInitialized &&
      !authLoading &&
      isAuthenticated &&
      !!user,
    
    staleTime: 1000 * 60 * 5, // 5 minutes
    
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
  });
};

// Enhanced device token registration - AUTH PROTECTED
export const useRegisterDeviceToken = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      token, 
      platform, 
      locale, 
      deviceInfo 
    }: {
      token: string;
      platform: 'ios' | 'android' | 'web';
      locale?: string;
      deviceInfo?: Record<string, any>;
    }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📱 Registering device token for platform:', platform);
      return notificationService.registerDeviceToken(token, platform, locale, deviceInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
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

// Enhanced device token unregistration - AUTH PROTECTED
export const useUnregisterDeviceToken = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (token: string) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('📱 Unregistering device token...');
      return notificationService.unregisterDeviceToken(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
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

// Enhanced test notification - AUTH PROTECTED
export const useSendTestNotification = () => {
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      deviceId, 
      message 
    }: {
      deviceId?: number;
      message?: string;
    }) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('🧪 Sending test notification...');
      return notificationService.sendTestNotification(deviceId, message);
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

// Enhanced clear old notifications - AUTH PROTECTED
export const useClearOldNotifications = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  return useMutation({
    mutationFn: async (olderThanDays: number = 30) => {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('🧹 Clearing old notifications older than', olderThanDays, 'days...');
      return notificationService.clearOldNotifications(olderThanDays);
    },
    onSuccess: () => {
      // Refetch all notification data after clearing
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.summary() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.analytics() });
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

// Enhanced manual refresh with coordination
export const useRefreshNotifications = () => {
  const queryClient = useQueryClient();
  
  const refreshAll = useCallback(async () => {
    console.log('🔄 Manually refreshing all notification data');
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.count() }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.summary() }),
    ]);
  }, [queryClient]);
  
  const refetchAll = useCallback(async () => {
    console.log('🔄 Refetching all notification data');
    await Promise.allSettled([
      queryClient.refetchQueries({ queryKey: notificationKeys.lists() }),
      queryClient.refetchQueries({ queryKey: notificationKeys.count() }),
      queryClient.refetchQueries({ queryKey: notificationKeys.unread() }),
      queryClient.refetchQueries({ queryKey: notificationKeys.summary() }),
    ]);
  }, [queryClient]);
  
  const refreshSpecific = useCallback(async (type: string) => {
    console.log(`🔄 Refreshing ${type} notifications`);
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: notificationKeys.list({ type }) }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.count() }),
    ]);
  }, [queryClient]);
  
  return { refreshAll, refetchAll, refreshSpecific };
};

// Enhanced notification subscription with real-time updates
export const useNotificationSubscription = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  const addNotification = useCallback((notification: Notification) => {
    if (!isAuthenticated) return;
    
    // Add to notifications list
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (oldData: Notification[] | undefined) => {
        if (!oldData) return [notification];
        return [notification, ...oldData];
      }
    );
    
    // Update count
    queryClient.setQueryData(
      notificationKeys.count(),
      (oldData: NotificationCount | undefined) => {
        if (!oldData) return { unread: 1, unseen: 1, total: 1, recent_24h: 1, by_type: {}, by_priority: {} };
        return {
          ...oldData,
          unread: oldData.unread + 1,
          unseen: oldData.unseen + 1,
          total: oldData.total + 1,
          recent_24h: oldData.recent_24h + 1,
        };
      }
    );
    
    // Add to unread list
    queryClient.setQueryData(
      notificationKeys.unread(),
      (oldData: Notification[] | undefined) => {
        if (!oldData) return [notification];
        return [notification, ...oldData];
      }
    );
  }, [queryClient, isAuthenticated]);
  
  const updateNotification = useCallback((notificationId: number, updates: Partial<Notification>) => {
    if (!isAuthenticated) return;
    
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(n => 
          n.id === notificationId ? { ...n, ...updates } : n
        );
      }
    );
  }, [queryClient, isAuthenticated]);
  
  const removeNotification = useCallback((notificationId: number) => {
    if (!isAuthenticated) return;
    
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(n => n.id !== notificationId);
      }
    );
  }, [queryClient, isAuthenticated]);
  
  return {
    addNotification,
    updateNotification,
    removeNotification,
  };
};

// Enhanced performance monitoring
export const useNotificationPerformance = () => {
  const queryClient = useQueryClient();
  
  const getQueryStates = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const notificationQueries = queryCache.findAll({ 
      queryKey: notificationKeys.all 
    });
    
    return notificationQueries.map(query => ({
      queryKey: query.queryKey,
      state: query.state.status,
      dataUpdatedAt: query.state.dataUpdatedAt,
      isFetching: query.state.isFetching,
      isStale: query.isStale(),
    }));
  }, [queryClient]);
  
  const getMetrics = useCallback(() => {
    const states = getQueryStates();
    return {
      totalQueries: states.length,
      fetchingQueries: states.filter(s => s.isFetching).length,
      staleQueries: states.filter(s => s.isStale).length,
      errorQueries: states.filter(s => s.state === 'error').length,
      lastUpdate: Math.max(...states.map(s => s.dataUpdatedAt), 0),
    };
  }, [getQueryStates]);
  
  return {
    getQueryStates,
    getMetrics,
  };
};