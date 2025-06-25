// hooks/query/useNotificationQuery.ts - ENHANCED VERSION aligned with backend
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

// Enhanced notifications query with comprehensive filtering
export const useNotifications = (options: {
  type?: string;
  is_read?: boolean;
  priority?: string;
  since?: string;
  limit?: number;
  refetchInterval?: number | false;
  enabled?: boolean;
} = {}) => {
  const { isAuthenticated } = useAuth();
  const { type, is_read, priority, since, limit, refetchInterval, enabled = true, ...queryOptions } = options;

  const query = useQuery({
    queryKey: notificationKeys.list({ type, is_read, priority, since, limit }),
    queryFn: () => notificationService.getNotifications({ type, is_read, priority, since, limit }),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: refetchInterval ?? (isAuthenticated ? 1000 * 60 : false), // 1 minute if authenticated
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: isAuthenticated && enabled,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions
  });

  return query;
};

// Enhanced infinite notifications query for pagination
export const useInfiniteNotifications = (options: {
  type?: string;
  is_read?: boolean;
  priority?: string;
  limit?: number;
} = {}) => {
  const { isAuthenticated } = useAuth();
  const { type, is_read, priority, limit = 20 } = options;

  return useInfiniteQuery({
    queryKey: notificationKeys.list({ type, is_read, priority, infinite: true }),
    queryFn: ({ pageParam = 1 }) => 
      notificationService.getNotifications({ 
        type, 
        is_read, 
        priority, 
        limit,
        offset: (pageParam - 1) * limit 
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 30,
    enabled: isAuthenticated,
    retry: 2,
  });
};

// Enhanced unread notifications query
export const useUnreadNotifications = (options: { type?: string } = {}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationService.getUnreadNotifications(options),
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: isAuthenticated,
    retry: 3,
  });
};

// Enhanced notification count with detailed breakdown
export const useNotificationCount = (options: {
  refetchInterval?: number | false;
  enabled?: boolean;
} = {}) => {
  const { isAuthenticated } = useAuth();
  const { refetchInterval, enabled = true } = options;
  
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: notificationService.getNotificationCount,
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: refetchInterval ?? 1000 * 30, // 30 seconds
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: isAuthenticated && enabled,
    retry: 3,
    select: (data: NotificationCount) => ({
      ...data,
      hasUnread: data.unread > 0,
      hasUnseen: data.unseen > 0,
      recentActivity: data.recent_24h > 0,
    }),
  });
};

// Enhanced notification summary
export const useNotificationSummary = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.summary(),
    queryFn: notificationService.getNotificationSummary,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // 10 minutes
    enabled: isAuthenticated,
    retry: 2,
  });
};

// Enhanced notification analytics
export const useNotificationAnalytics = (days: number = 30) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.analytics(days),
    queryFn: () => notificationService.getAnalytics(days),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 30, // 30 minutes
    enabled: isAuthenticated,
    retry: 2,
  });
};

// Enhanced notifications by type
export const useNotificationsByType = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.byType(),
    queryFn: notificationService.getNotificationsByType,
    staleTime: 1000 * 60, // 1 minute
    enabled: isAuthenticated,
    retry: 2,
  });
};

// Enhanced mark as read with optimistic updates and error handling
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
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
  });
};

// Enhanced mark multiple notifications as read
export const useMarkNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationIds: number[]) => {
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
  });
};

// Enhanced mark all as read with type filtering
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (type?: string) => notificationService.markAllAsRead(type),
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
  });
};

// Enhanced mark as seen
export const useMarkNotificationsAsSeen = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationIds?: number[]) => notificationService.markAsSeen(notificationIds),
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
  });
};

// Enhanced notification preferences
export const useNotificationPreferences = (options = {}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: notificationService.getPreferences,
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: isAuthenticated,
    retry: 2,
    ...options
  });
};

// Enhanced preference categories
export const useNotificationPreferenceCategories = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.categories(),
    queryFn: notificationService.getPreferenceCategories,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - categories don't change often
    enabled: isAuthenticated,
    retry: 1,
  });
};

// Enhanced update preferences
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: Partial<NotificationPreference>) => 
      notificationService.updatePreferences(preferences),
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
  });
};

// Enhanced bulk preference update
export const useBulkUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categories: Record<string, boolean>) => 
      notificationService.bulkUpdatePreferences(categories),
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(notificationKeys.preferences(), updatedPreferences);
    },
  });
};

// Enhanced device management
export const useDeviceTokens = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: notificationKeys.devices(),
    queryFn: notificationService.listDeviceTokens,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isAuthenticated,
    retry: 2,
  });
};

// Enhanced device token registration
export const useRegisterDeviceToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      token, 
      platform, 
      locale, 
      deviceInfo 
    }: {
      token: string;
      platform: 'ios' | 'android' | 'web';
      locale?: string;
      deviceInfo?: Record<string, any>;
    }) => notificationService.registerDeviceToken(token, platform, locale, deviceInfo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
    },
  });
};

// Enhanced device token unregistration
export const useUnregisterDeviceToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (token: string) => notificationService.unregisterDeviceToken(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
    },
  });
};

// Enhanced test notification
export const useSendTestNotification = () => {
  return useMutation({
    mutationFn: ({ 
      deviceId, 
      message 
    }: {
      deviceId?: number;
      message?: string;
    }) => notificationService.sendTestNotification(deviceId, message),
  });
};

// Enhanced clear old notifications
export const useClearOldNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (olderThanDays: number = 30) => 
      notificationService.clearOldNotifications(olderThanDays),
    onSuccess: () => {
      // Refetch all notification data after clearing
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.summary() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.analytics() });
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
  }, [queryClient]);
  
  const updateNotification = useCallback((notificationId: number, updates: Partial<Notification>) => {
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(n => 
          n.id === notificationId ? { ...n, ...updates } : n
        );
      }
    );
  }, [queryClient]);
  
  const removeNotification = useCallback((notificationId: number) => {
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(n => n.id !== notificationId);
      }
    );
  }, [queryClient]);
  
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