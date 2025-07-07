// hooks/useRealTimeNotifications.ts - ENHANCED VERSION aligned with backend
import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from './useAuth';
import { useNotificationSocket } from './useNotificationSocket';
import { useNotificationSubscription, notificationKeys } from './query/useNotificationQuery';
import { useQueryClient } from '@tanstack/react-query';
import { cacheManager } from '../utils/cacheManager';

interface RealTimeNotificationOptions {
  enablePushUpdates?: boolean;
  enableWebSocketUpdates?: boolean;
  enableAppStateUpdates?: boolean;
  enablePeriodicUpdates?: boolean;
  periodicInterval?: number;
  debugMode?: boolean;
  coordinateWithBackend?: boolean; // NEW: Coordinate with backend services
  enableAnalytics?: boolean; // NEW: Track real-time performance
}

interface NotificationSource {
  id: string;
  type: 'push' | 'websocket' | 'appstate' | 'periodic' | 'manual' | 'backend'; // Added backend
  isActive: boolean;
  lastActivity: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  errorCount: number; // NEW: Error tracking
  successCount: number; // NEW: Success tracking
  metadata?: Record<string, any>; // NEW: Additional metadata
}

interface RealTimeMetrics {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  averageResponseTime: number;
  activeSources: number;
  lastUpdate: number;
  uptime: number;
}

/**
 * Enhanced real-time notification hook aligned with backend architecture
 */
export const useRealTimeNotifications = (options: RealTimeNotificationOptions = {}) => {
  const {
    enablePushUpdates = true,
    enableWebSocketUpdates = true,
    enableAppStateUpdates = true,
    enablePeriodicUpdates = true,
    periodicInterval = 60000, // 1 minute
    debugMode = __DEV__,
    coordinateWithBackend = true,
    enableAnalytics = true,
  } = options;

  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const { addNotification, updateNotification } = useNotificationSubscription();
  
  // Enhanced state management
  const appState = useRef(AppState.currentState);
  const periodicUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTime = useRef<number>(0);
  const mountedRef = useRef(true);
  const startTime = useRef(Date.now());
  
  // Enhanced source tracking with metrics
  const sourcesRef = useRef<Record<string, NotificationSource>>({});
  const metricsRef = useRef<RealTimeMetrics>({
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    averageResponseTime: 0,
    activeSources: 0,
    lastUpdate: 0,
    uptime: 0,
  });
  
  // Public state for debugging and UI
  const [publicSources, setPublicSources] = useState<Record<string, NotificationSource>>({});
  const [metrics, setMetrics] = useState<RealTimeMetrics>(metricsRef.current);
  
  // WebSocket integration
  const {
    isConnected: socketConnected,
    error: socketError,
    lastMessage: socketMessage,
    markAsRead: socketMarkAsRead,
    markAllAsRead: socketMarkAllAsRead,
  } = useNotificationSocket();

  /**
   * Enhanced source management with error tracking
   */
  const updateSource = useCallback((
    sourceId: string, 
    updates: Partial<NotificationSource>,
    incrementSuccess = false,
    incrementError = false
  ) => {
    if (!mountedRef.current) return;
    
    const currentTime = Date.now();
    const existingSource = sourcesRef.current[sourceId];
    
    sourcesRef.current[sourceId] = {
      id: sourceId,
      type: existingSource?.type || 'manual',
      isActive: false,
      lastActivity: currentTime,
      priority: 'normal',
      errorCount: existingSource?.errorCount || 0,
      successCount: existingSource?.successCount || 0,
      ...existingSource,
      ...updates,
      lastActivity: currentTime,
      errorCount: incrementError ? (existingSource?.errorCount || 0) + 1 : (existingSource?.errorCount || 0),
      successCount: incrementSuccess ? (existingSource?.successCount || 0) + 1 : (existingSource?.successCount || 0),
    };
    
    // Update metrics
    if (incrementSuccess) {
      metricsRef.current.successfulUpdates++;
      metricsRef.current.totalUpdates++;
      metricsRef.current.lastUpdate = currentTime;
    }
    if (incrementError) {
      metricsRef.current.failedUpdates++;
      metricsRef.current.totalUpdates++;
    }
    
    metricsRef.current.activeSources = Object.values(sourcesRef.current).filter(s => s.isActive).length;
    metricsRef.current.uptime = currentTime - startTime.current;
    
    // Update public state for debugging
    if (debugMode || enableAnalytics) {
      setPublicSources({ ...sourcesRef.current });
      setMetrics({ ...metricsRef.current });
    }
  }, [debugMode, enableAnalytics]);

  /**
   * Enhanced update scheduling with backend coordination
   */
  const scheduleUpdate = useCallback((
    source: string,
    trigger: string,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal',
    data?: any
  ) => {
    if (!isAuthenticated || !mountedRef.current) return;

    const startTime = Date.now();
    
    try {
      // Get affected query keys based on trigger
      const queryKeys = getQueryKeysForTrigger(trigger);
      
      // Schedule coordinated updates
      queryKeys.forEach(queryKey => {
        if (coordinateWithBackend) {
          cacheManager.scheduleUpdate({
            queryKey,
            source: `${source}:${trigger}`,
            priority,
            data: {
              ...data,
              timestamp: startTime,
              backend_coordinated: true,
            }
          });
        } else {
          // Direct query invalidation
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
      });

      // Update source with success
      updateSource(source, { 
        isActive: true, 
        priority,
        metadata: { trigger, queryKeys }
      }, true, false);

      if (debugMode) {
        const duration = Date.now() - startTime;
        console.log(`📡 Scheduled ${priority} update from ${source}:${trigger} (${duration}ms)`, queryKeys);
      }

    } catch (error) {
      // Update source with error
      updateSource(source, { 
        isActive: false,
        metadata: { trigger, error: error.message }
      }, false, true);

      if (debugMode) {
        console.error(`❌ Failed to schedule update from ${source}:${trigger}:`, error);
      }
    }
  }, [isAuthenticated, coordinateWithBackend, queryClient, updateSource, debugMode]);

  /**
   * Enhanced query key mapping with backend alignment
   */
  const getQueryKeysForTrigger = useCallback((trigger: string): string[] => {
    const queryMap: Record<string, string[]> = {
      // Real-time notification events
      'new-notification': [
        'notifications',
        'notification-count',
        'notifications-unread',
        'notifications-summary'
      ],
      'notification-read': [
        'notifications',
        'notification-count',
        'notifications-unread'
      ],
      'notification-deleted': [
        'notifications',
        'notification-count',
        'notifications-summary'
      ],
      'notification-updated': [
        'notifications'
      ],
      
      // Backend-specific triggers
      'preferences-updated': [
        'notification-preferences'
      ],
      'device-registered': [
        'notification-devices'
      ],
      'analytics-updated': [
        'notification-analytics'
      ],
      
      // App state triggers
      'app-foreground': [
        'notifications',
        'notification-count'
      ],
      'app-background': [],
      
      // Sync triggers
      'periodic-sync': [
        'notifications'
      ],
      'manual-refresh': [
        'notifications',
        'notification-count',
        'notifications-unread',
        'notifications-summary'
      ],
      'websocket-reconnect': [
        'notifications',
        'notification-count'
      ],
      
      // Error recovery
      'error-recovery': [
        'notifications',
        'notification-count'
      ],
    };

    return queryMap[trigger] || ['notifications'];
  }, []);

  /**
   * Enhanced push notification handling with backend coordination
   */
  useEffect(() => {
    if (!enablePushUpdates || !isAuthenticated) {
      updateSource('push', { isActive: false, type: 'push' });
      return;
    }

    updateSource('push', { 
      type: 'push', 
      isActive: true, 
      priority: 'high' 
    });

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      
      if (data?.notification_type) {
        // Add notification directly to cache for immediate UI update
        if (data.notification_id && coordinateWithBackend) {
          const newNotification = {
            id: parseInt(data.notification_id),
            recipient: user?.id || 0,
            notification_type: data.notification_type,
            title_key: data.title_key || '',
            body_key: data.body_key || '',
            translation_params: data.translation_params || {},
            translated_title: notification.request.content.title,
            translated_body: notification.request.content.body,
            content: notification.request.content.body || '',
            metadata: data.metadata || {},
            is_read: false,
            is_seen: false,
            created_at: new Date().toISOString(),
            priority: data.priority || 'normal',
            object_id: data.object_id ? parseInt(data.object_id) : undefined,
            sender: data.sender_id ? { 
              id: parseInt(data.sender_id), 
              username: data.translation_params?.sender_username || 'Unknown',
              display_name: data.translation_params?.sender_display_name || 'Unknown'
            } : undefined,
            related_object_info: data.related_object_info,
            available_actions: data.available_actions,
            time_ago: 'Just now',
            is_recent: true,
          };
          
          // Add to subscription system
          addNotification(newNotification);
        }
        
        // Schedule coordinated update
        scheduleUpdate('push', 'new-notification', 'critical', {
          notification: data,
          realtime: true,
          source: 'push'
        });
      }
    });

    return () => {
      subscription.remove();
      updateSource('push', { isActive: false });
    };
  }, [enablePushUpdates, isAuthenticated, user?.id, scheduleUpdate, updateSource, addNotification, coordinateWithBackend]);

  /**
   * Enhanced WebSocket handling with backend coordination
   */
  useEffect(() => {
    if (!enableWebSocketUpdates) {
      updateSource('websocket', { isActive: false, type: 'websocket' });
      return;
    }

    updateSource('websocket', {
      type: 'websocket',
      isActive: socketConnected,
      priority: 'high',
      metadata: { 
        connected: socketConnected,
        error: socketError?.message 
      }
    });

    if (socketConnected) {
      if (debugMode) console.log('🔌 WebSocket connected - backend coordinated');
      
      // Check for missed updates during disconnection
      const lastActivity = sourcesRef.current.websocket?.lastActivity || 0;
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (timeSinceLastActivity > 30000) { // 30 seconds
        scheduleUpdate('websocket', 'websocket-reconnect', 'high');
      }
    } else if (socketError) {
      updateSource('websocket', { 
        isActive: false,
        metadata: { error: socketError.message }
      }, false, true);
      
      if (debugMode) console.log('❌ WebSocket error, enabling fallback updates');
      scheduleUpdate('websocket', 'error-recovery', 'normal');
    }

  }, [socketConnected, socketError, enableWebSocketUpdates, scheduleUpdate, updateSource, debugMode]);

  /**
   * Enhanced WebSocket message handling with real-time updates
   */
  useEffect(() => {
    if (!socketMessage || !enableWebSocketUpdates) return;

    const { type, notification, message } = socketMessage;
    
    try {
      switch (type) {
        case 'notification_message':
          if (notification && coordinateWithBackend) {
            // Add notification directly to cache
            addNotification(notification);
          }
          scheduleUpdate('websocket', 'new-notification', 'critical', {
            notification,
            realtime: true,
            websocket: true
          });
          break;
        
        case 'notification_read':
          if (notification?.id) {
            updateNotification(notification.id, { is_read: true, is_seen: true });
          }
          scheduleUpdate('websocket', 'notification-read', 'normal');
          break;
          
        case 'notification_deleted':
          scheduleUpdate('websocket', 'notification-deleted', 'normal');
          break;
          
        case 'notification_updated':
          if (notification?.id && coordinateWithBackend) {
            updateNotification(notification.id, notification);
          }
          scheduleUpdate('websocket', 'notification-updated', 'normal');
          break;
          
        case 'preferences_updated':
          scheduleUpdate('websocket', 'preferences-updated', 'low');
          break;
          
        case 'analytics_updated':
          scheduleUpdate('websocket', 'analytics-updated', 'low');
          break;
          
        case 'user_online':
          scheduleUpdate('websocket', 'user-online', 'low');
          break;
          
        case 'connection_established':
          updateSource('websocket', { 
            isActive: true,
            metadata: { message }
          }, true);
          break;
          
        case 'error':
          updateSource('websocket', { 
            isActive: false,
            metadata: { error: message }
          }, false, true);
          break;
      }
    } catch (error) {
      updateSource('websocket', { 
        metadata: { processingError: error.message }
      }, false, true);
      
      if (debugMode) {
        console.error('❌ Error processing WebSocket message:', error);
      }
    }
  }, [socketMessage, enableWebSocketUpdates, scheduleUpdate, addNotification, updateNotification, coordinateWithBackend, updateSource, debugMode]);

  /**
   * Enhanced app state change handling
   */
  useEffect(() => {
    if (!enableAppStateUpdates || !isAuthenticated) {
      updateSource('appstate', { isActive: false, type: 'appstate' });
      return;
    }

    updateSource('appstate', {
      type: 'appstate',
      isActive: true,
      priority: 'normal'
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!mountedRef.current) return;

      const previousState = appState.current;
      
      if (debugMode) {
        console.log(`📱 App state: ${previousState} -> ${nextAppState}`);
      }
      
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        const timeInBackground = Date.now() - backgroundTime.current;
        
        // Calculate priority based on background time and backend coordination
        let priority: 'low' | 'normal' | 'high' | 'critical' = 'normal';
        if (timeInBackground > 300000) priority = 'high'; // 5 minutes
        if (timeInBackground > 1800000) priority = 'critical'; // 30 minutes
        
        scheduleUpdate('appstate', 'app-foreground', priority, {
          timeInBackground,
          previousState,
          nextAppState
        });
        
        updateSource('appstate', { 
          isActive: true,
          metadata: { 
            timeInBackground,
            lastForeground: Date.now()
          }
        }, true);
        
      } else if (nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        updateSource('appstate', { 
          isActive: false,
          metadata: { 
            backgroundTime: backgroundTime.current
          }
        });
        
        scheduleUpdate('appstate', 'app-background', 'low');
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
      updateSource('appstate', { isActive: false });
    };
  }, [enableAppStateUpdates, isAuthenticated, scheduleUpdate, updateSource, debugMode]);

  /**
   * Enhanced periodic updates with intelligent fallback
   */
  useEffect(() => {
    if (!enablePeriodicUpdates || !isAuthenticated) {
      if (periodicUpdateRef.current) {
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
      updateSource('periodic', { isActive: false, type: 'periodic' });
      return;
    }

    // Use periodic updates as fallback when other sources are unreliable
    const shouldUsePeriodic = !socketConnected || socketError || 
      Object.values(sourcesRef.current).filter(s => s.isActive && s.type !== 'periodic').length === 0;
    
    if (shouldUsePeriodic) {
      updateSource('periodic', {
        type: 'periodic',
        isActive: true,
        priority: 'low',
        metadata: { 
          reason: !socketConnected ? 'websocket_disconnected' : 'fallback',
          interval: periodicInterval
        }
      });

      if (debugMode) {
        console.log(`⏰ Starting smart periodic updates (${periodicInterval}ms) - backend coordinated`);
      }
      
      periodicUpdateRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        
        // Check if other sources are providing updates
        const recentActivity = Object.values(sourcesRef.current).some(source => 
          source.isActive && 
          source.type !== 'periodic' && 
          (Date.now() - source.lastActivity) < 60000 // Active in last minute
        );
        
        if (!recentActivity) {
          scheduleUpdate('periodic', 'periodic-sync', 'low', {
            fallback: true,
            interval: periodicInterval
          });
        } else if (debugMode) {
          console.log('⏰ Skipping periodic update (other sources active)');
        }
      }, periodicInterval);
    } else {
      // Stop periodic updates if other sources are working
      if (periodicUpdateRef.current) {
        if (debugMode) console.log('⏰ Stopping periodic updates (other sources active)');
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
      updateSource('periodic', { isActive: false });
    }

    return () => {
      if (periodicUpdateRef.current) {
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
    };
  }, [
    enablePeriodicUpdates, 
    isAuthenticated, 
    socketConnected, 
    socketError, 
    periodicInterval, 
    scheduleUpdate, 
    updateSource, 
    debugMode
  ]);

  /**
   * Enhanced manual refresh with backend coordination
   */
  const manualRefresh = useCallback(() => {
    if (debugMode) console.log('🔄 Manual refresh triggered - backend coordinated');
    
    scheduleUpdate('manual', 'manual-refresh', 'critical', {
      manual: true,
      timestamp: Date.now(),
      user_initiated: true
    });
  }, [scheduleUpdate, debugMode]);

  /**
   * Enhanced emergency cache clear with backend sync
   */
  const emergencyClear = useCallback(() => {
    if (debugMode) console.log('🚨 Emergency cache clear - backend coordinated');
    
    // Clear pending updates
    cacheManager.clearPendingUpdates();
    
    // Force refresh all notification queries
    const notificationQueryKeys = [
      'notifications',
      'notification-count', 
      'notifications-unread',
      'notifications-summary',
      'notification-analytics'
    ];
    
    notificationQueryKeys.forEach(queryKey => {
      cacheManager.forceRefresh(queryKey, 'emergency');
    });
    
    // Reset metrics
    metricsRef.current = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      averageResponseTime: 0,
      activeSources: Object.values(sourcesRef.current).filter(s => s.isActive).length,
      lastUpdate: Date.now(),
      uptime: Date.now() - startTime.current,
    };
    
    if (enableAnalytics) {
      setMetrics({ ...metricsRef.current });
    }
  }, [debugMode, enableAnalytics]);

  /**
   * Enhanced performance stats with backend metrics
   */
  const getPerformanceStats = useCallback(() => {
    const cacheStats = cacheManager.getStats();
    const activeSourceCount = Object.values(sourcesRef.current).filter(s => s.isActive).length;
    
    return {
      // Real-time metrics
      metrics: metricsRef.current,
      
      // Source information
      activeSources: activeSourceCount,
      sources: sourcesRef.current,
      
      // Cache manager stats
      cacheManager: cacheStats,
      
      // Strategy effectiveness
      strategies: {
        pushNotifications: enablePushUpdates && sourcesRef.current.push?.isActive,
        webSocket: enableWebSocketUpdates && socketConnected,
        appStateUpdates: enableAppStateUpdates && sourcesRef.current.appstate?.isActive,
        periodicUpdates: enablePeriodicUpdates && sourcesRef.current.periodic?.isActive,
        backendCoordination: coordinateWithBackend,
      },
      
      // Health indicators
      health: {
        overallHealth: calculateOverallHealth(),
        lastSuccessfulUpdate: Math.max(...Object.values(sourcesRef.current).map(s => s.lastActivity), 0),
        errorRate: metricsRef.current.totalUpdates > 0 
          ? metricsRef.current.failedUpdates / metricsRef.current.totalUpdates 
          : 0,
        uptime: Date.now() - startTime.current,
      }
    };
  }, [enablePushUpdates, enableWebSocketUpdates, enableAppStateUpdates, enablePeriodicUpdates, socketConnected, coordinateWithBackend]);

  /**
   * Calculate overall system health
   */
  const calculateOverallHealth = useCallback(() => {
    const sources = Object.values(sourcesRef.current);
    const activeSources = sources.filter(s => s.isActive);
    const totalErrors = sources.reduce((sum, s) => sum + s.errorCount, 0);
    const totalSuccess = sources.reduce((sum, s) => sum + s.successCount, 0);
    
    if (activeSources.length === 0) return 'poor';
    if (activeSources.length >= 2 && totalErrors / (totalSuccess + totalErrors) < 0.1) return 'excellent';
    if (activeSources.length >= 1 && totalErrors / (totalSuccess + totalErrors) < 0.3) return 'good';
    return 'fair';
  }, []);

  /**
   * Get current active sources for UI
   */
  const isRealTimeActive = Object.values(sourcesRef.current).some(s => s.isActive);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (periodicUpdateRef.current) {
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
      cacheManager.clearPendingUpdates();
    };
  }, []);

  return {
    // Status information
    isRealTimeActive,
    socketConnected,
    socketError,
    sources: publicSources,
    metrics,
    
    // Registration status
    pushRegistered: sourcesRef.current.push?.isActive || false,
    
    // Manual controls
    manualRefresh,
    emergencyClear,
    
    // Performance monitoring
    getPerformanceStats,
    
    // Backend coordination
    backendCoordinated: coordinateWithBackend,
    
    // Strategy info
    strategies: {
      pushNotifications: enablePushUpdates && sourcesRef.current.push?.isActive,
      webSocket: enableWebSocketUpdates && socketConnected,
      appStateUpdates: enableAppStateUpdates && sourcesRef.current.appstate?.isActive,
      periodicUpdates: enablePeriodicUpdates && sourcesRef.current.periodic?.isActive,
      backendCoordination: coordinateWithBackend,
      analytics: enableAnalytics,
    },
    
    // Health status
    health: calculateOverallHealth(),
  };
};

/**
 * Enhanced simplified hook for components that just need manual refresh
 */
export const useNotificationRefresh = () => {
  const queryClient = useQueryClient();
  
  const refresh = useCallback(async () => {
    console.log('🔄 Manual notification refresh triggered - backend aligned');
    
    // Use query keys from backend alignment
    const queries = [
      notificationKeys.lists(),
      notificationKeys.count(),
      notificationKeys.unread(),
      notificationKeys.summary()
    ];
    
    await Promise.allSettled(
      queries.map(queryKey => queryClient.invalidateQueries({ queryKey }))
    );
  }, [queryClient]);
  
  return { refresh };
};

/**
 * Enhanced notification real-time subscription hook
 */
export const useNotificationRealTimeSubscription = () => {
  const { addNotification, updateNotification, removeNotification } = useNotificationSubscription();
  const { isConnected, lastMessage } = useNotificationSocket();
  
  // Process real-time updates
  useEffect(() => {
    if (!isConnected || !lastMessage) return;
    
    const { type, notification } = lastMessage;
    
    switch (type) {
      case 'notification_message':
        if (notification) {
          addNotification(notification);
        }
        break;
        
      case 'notification_read':
        if (notification?.id) {
          updateNotification(notification.id, { is_read: true, is_seen: true });
        }
        break;
        
      case 'notification_deleted':
        if (notification?.id) {
          removeNotification(notification.id);
        }
        break;
        
      case 'notification_updated':
        if (notification?.id) {
          updateNotification(notification.id, notification);
        }
        break;
    }
  }, [isConnected, lastMessage, addNotification, updateNotification, removeNotification]);
  
  return {
    isConnected,
    addNotification,
    updateNotification,
    removeNotification,
  };
};