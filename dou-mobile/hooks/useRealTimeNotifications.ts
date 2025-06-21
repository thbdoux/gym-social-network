// hooks/useRealTimeNotifications.ts - Fixed infinite loop issues
import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from './useAuth';
import { useNotificationSocket } from './useNotificationSocket';
import { cacheManager } from '../utils/cacheManager';

interface RealTimeNotificationOptions {
  enablePushUpdates?: boolean;
  enableWebSocketUpdates?: boolean;
  enableAppStateUpdates?: boolean;
  enablePeriodicUpdates?: boolean;
  periodicInterval?: number;
  debugMode?: boolean;
}

interface NotificationSource {
  id: string;
  type: 'push' | 'websocket' | 'appstate' | 'periodic' | 'manual';
  isActive: boolean;
  lastActivity: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

/**
 * Optimized real-time notification hook that coordinates multiple update sources
 * and prevents performance issues through intelligent caching strategies
 */
export const useRealTimeNotifications = (options: RealTimeNotificationOptions = {}) => {
  const {
    enablePushUpdates = true,
    enableWebSocketUpdates = true,
    enableAppStateUpdates = true,
    enablePeriodicUpdates = true,
    periodicInterval = 60000, // 1 minute
    debugMode = __DEV__,
  } = options;

  const { isAuthenticated } = useAuth();
  const appState = useRef(AppState.currentState);
  const periodicUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTime = useRef<number>(0);
  const mountedRef = useRef(true);

  // Use refs instead of state to avoid infinite loops for internal tracking
  const sourcesRef = useRef<Record<string, NotificationSource>>({});
  
  // Separate state for UI updates (only when actually needed)
  const [publicSources, setPublicSources] = useState<Record<string, NotificationSource>>({});
  
  // WebSocket status
  const {
    isConnected: socketConnected,
    error: socketError,
    lastMessage: socketMessage,
  } = useNotificationSocket();

  /**
   * Update source internally without triggering re-renders
   */
  const updateSourceRef = useCallback((sourceId: string, updates: Partial<NotificationSource>) => {
    if (!mountedRef.current) return;
    
    sourcesRef.current = {
      ...sourcesRef.current,
      [sourceId]: {
        ...sourcesRef.current[sourceId],
        id: sourceId,
        lastActivity: Date.now(),
        ...updates,
      }
    };
    
    // Only update public state when needed for UI
    if (debugMode) {
      setPublicSources({ ...sourcesRef.current });
    }
  }, [debugMode]);

  /**
   * Smart cache update that considers source coordination and app state
   */
  const scheduleSmartUpdate = useCallback((
    source: string, 
    trigger: string,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal',
    data?: any
  ) => {
    if (!isAuthenticated || !mountedRef.current) return;

    // Determine which queries need updating based on trigger
    const queryKeys = getQueryKeysForTrigger(trigger);
    
    queryKeys.forEach(queryKey => {
      cacheManager.scheduleUpdate({
        queryKey,
        source: `${source}:${trigger}`,
        priority,
        data
      });
    });

    // Update source activity (internal only)
    updateSourceRef(source, { isActive: true, lastActivity: Date.now() });

    if (debugMode) {
      console.log(`📡 Scheduled ${priority} update from ${source}:${trigger}`, queryKeys);
    }
  }, [isAuthenticated, updateSourceRef, debugMode]);

  /**
   * Map triggers to affected query keys
   */
  const getQueryKeysForTrigger = (trigger: string): string[] => {
    const queryMap: Record<string, string[]> = {
      'new-notification': ['notifications*', 'notification-count'],
      'notification-read': ['notifications*', 'notification-count'],
      'notification-deleted': ['notifications*', 'notification-count'],
      'user-online': ['notifications*'], // Lower priority
      'app-foreground': ['notifications*', 'notification-count'],
      'periodic-sync': ['notifications*'],
      'manual-refresh': ['notifications*', 'notification-count'],
      'websocket-reconnect': ['notifications*', 'notification-count'],
    };

    return queryMap[trigger] || ['notifications*'];
  };

  /**
   * 1. PUSH NOTIFICATION HANDLING
   */
  useEffect(() => {
    if (!enablePushUpdates || !isAuthenticated) {
      updateSourceRef('push', { isActive: false });
      return;
    }

    updateSourceRef('push', { 
      type: 'push', 
      isActive: true, 
      priority: 'high' 
    });

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      
      if (data?.notification_type) {
        // High priority for direct notifications
        scheduleSmartUpdate('push', 'new-notification', 'high', {
          notification: data,
          timestamp: Date.now()
        });
      }
    });

    return () => {
      subscription.remove();
      updateSourceRef('push', { isActive: false });
    };
  }, [enablePushUpdates, isAuthenticated, scheduleSmartUpdate, updateSourceRef]);

  /**
   * 2. WEBSOCKET HANDLING - Fixed dependencies
   */
  useEffect(() => {
    if (!enableWebSocketUpdates) {
      updateSourceRef('websocket', { isActive: false });
      return;
    }

    updateSourceRef('websocket', {
      type: 'websocket',
      isActive: socketConnected,
      priority: 'high'
    });

    // Handle connection state changes
    if (socketConnected) {
      if (debugMode) console.log('🔌 WebSocket connected for notifications');
      
      // If we just reconnected after being disconnected, sync
      const lastActivity = sourcesRef.current.websocket?.lastActivity || 0;
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (timeSinceLastActivity > 30000) { // 30 seconds
        scheduleSmartUpdate('websocket', 'websocket-reconnect', 'high');
      }
    } else if (socketError) {
      if (debugMode) console.log('❌ WebSocket error, scheduling update');
      scheduleSmartUpdate('websocket', 'websocket-reconnect', 'normal');
    }

  }, [socketConnected, socketError, enableWebSocketUpdates, scheduleSmartUpdate, updateSourceRef, debugMode]);
  // Removed sources dependency to prevent infinite loop

  /**
   * 3. WEBSOCKET MESSAGE HANDLING
   */
  useEffect(() => {
    if (!socketMessage || !enableWebSocketUpdates) return;

    const { type, notification } = socketMessage;
    
    switch (type) {
      case 'notification_message':
        if (notification) {
          scheduleSmartUpdate('websocket', 'new-notification', 'critical', {
            notification,
            realtime: true
          });
        }
        break;
      
      case 'notification_read':
        scheduleSmartUpdate('websocket', 'notification-read', 'normal');
        break;
        
      case 'notification_deleted':
        scheduleSmartUpdate('websocket', 'notification-deleted', 'normal');
        break;
        
      case 'user_online':
        scheduleSmartUpdate('websocket', 'user-online', 'low');
        break;
    }
  }, [socketMessage, enableWebSocketUpdates, scheduleSmartUpdate]);

  /**
   * 4. APP STATE CHANGE HANDLING
   */
  useEffect(() => {
    if (!enableAppStateUpdates || !isAuthenticated) {
      updateSourceRef('appstate', { isActive: false });
      return;
    }

    updateSourceRef('appstate', {
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
        
        if (debugMode) {
          console.log(`📱 App resumed after ${Math.round(timeInBackground / 1000)}s`);
        }
        
        // Prioritize updates based on background time
        const priority = timeInBackground > 300000 ? 'high' : 'normal'; // 5 minutes
        scheduleSmartUpdate('appstate', 'app-foreground', priority);
        
      } else if (nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        updateSourceRef('appstate', { isActive: false });
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
      updateSourceRef('appstate', { isActive: false });
    };
  }, [enableAppStateUpdates, isAuthenticated, scheduleSmartUpdate, updateSourceRef, debugMode]);

  /**
   * 5. PERIODIC UPDATES (Smart Fallback) - Fixed logic
   */
  useEffect(() => {
    if (!enablePeriodicUpdates || !isAuthenticated) {
      if (periodicUpdateRef.current) {
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
      updateSourceRef('periodic', { isActive: false });
      return;
    }

    // Only enable periodic updates if WebSocket is unreliable
    const shouldUsePeriodic = !socketConnected || socketError;
    
    if (shouldUsePeriodic) {
      updateSourceRef('periodic', {
        type: 'periodic',
        isActive: true,
        priority: 'low'
      });

      if (debugMode) {
        console.log(`⏰ Starting smart periodic updates (${periodicInterval}ms)`);
      }
      
      periodicUpdateRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        
        // Check if other sources are active using ref (no state dependency)
        const hasActiveSources = Object.values(sourcesRef.current).some(source => 
          source.isActive && source.type !== 'periodic' && 
          (Date.now() - source.lastActivity) < 60000 // Active in last minute
        );
        
        if (!hasActiveSources) {
          scheduleSmartUpdate('periodic', 'periodic-sync', 'low');
        } else if (debugMode) {
          console.log('⏰ Skipping periodic update (other sources active)');
        }
      }, periodicInterval);
    } else {
      // Stop periodic updates if WebSocket is working
      if (periodicUpdateRef.current) {
        if (debugMode) console.log('⏰ Stopping periodic updates (WebSocket active)');
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
      updateSourceRef('periodic', { isActive: false });
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
    scheduleSmartUpdate, 
    updateSourceRef, 
    debugMode
    // Removed sources dependency to prevent infinite loop
  ]);

  /**
   * Manual refresh function
   */
  const manualRefresh = useCallback(() => {
    if (debugMode) console.log('🔄 Manual refresh triggered');
    scheduleSmartUpdate('manual', 'manual-refresh', 'critical');
  }, [scheduleSmartUpdate, debugMode]);

  /**
   * Emergency cache clear
   */
  const emergencyClear = useCallback(() => {
    if (debugMode) console.log('🚨 Emergency cache clear');
    cacheManager.clearPendingUpdates();
    cacheManager.forceRefresh('notifications*', 'emergency');
  }, [debugMode]);

  /**
   * Get performance stats
   */
  const getPerformanceStats = useCallback(() => {
    const cacheStats = cacheManager.getStats();
    const activeSourceCount = Object.values(sourcesRef.current).filter(s => s.isActive).length;
    
    return {
      activeSources: activeSourceCount,
      sources: sourcesRef.current, // Use ref instead of state
      cacheManager: cacheStats,
      strategies: {
        pushNotifications: enablePushUpdates && sourcesRef.current.push?.isActive,
        webSocket: enableWebSocketUpdates && socketConnected,
        appStateUpdates: enableAppStateUpdates && sourcesRef.current.appstate?.isActive,
        periodicUpdates: enablePeriodicUpdates && sourcesRef.current.periodic?.isActive,
      }
    };
  }, [enablePushUpdates, enableWebSocketUpdates, enableAppStateUpdates, enablePeriodicUpdates, socketConnected]);

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
    sources: publicSources, // Only for debug/UI
    
    // Registration status
    pushRegistered: sourcesRef.current.push?.isActive || false,
    
    // Manual controls
    manualRefresh,
    emergencyClear,
    
    // Performance monitoring
    getPerformanceStats,
    
    // Strategy info
    strategies: {
      pushNotifications: enablePushUpdates && sourcesRef.current.push?.isActive,
      webSocket: enableWebSocketUpdates && socketConnected,
      appStateUpdates: enableAppStateUpdates && sourcesRef.current.appstate?.isActive,
      periodicUpdates: enablePeriodicUpdates && sourcesRef.current.periodic?.isActive,
    },
  };
};

/**
 * Simplified hook for components that just need manual refresh
 */
export const useNotificationRefresh = () => {
  const refresh = useCallback(async () => {
    console.log('🔄 Manual notification refresh triggered');
    await cacheManager.forceRefresh('notifications*', 'manual-refresh');
    await cacheManager.forceRefresh('notification-count', 'manual-refresh');
  }, []);
  
  return { refresh };
};