// hooks/useRealTimeNotifications.ts - React Native optimized version
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationKeys } from './query/useNotificationQuery';
import { useAuth } from './useAuth';
import { useNotificationSocket } from './useNotificationSocket';

interface RealTimeNotificationOptions {
  enablePushUpdates?: boolean;
  enableWebSocketUpdates?: boolean;
  enableAppStateUpdates?: boolean;
  enablePeriodicUpdates?: boolean;
  periodicInterval?: number; // in milliseconds
}

/**
 * React Native optimized real-time notification hook
 * Combines push notifications, WebSocket, app state changes, and periodic updates
 */
export const useRealTimeNotifications = (options: RealTimeNotificationOptions = {}) => {
  const {
    enablePushUpdates = true,
    enableWebSocketUpdates = true,
    enableAppStateUpdates = true,
    enablePeriodicUpdates = true,
    periodicInterval = 60000, // 1 minute
  } = options;

  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const appState = useRef(AppState.currentState);
  const periodicUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const updateCooldown = 3000; // 3 seconds cooldown between updates

  // WebSocket and push notification status
  const {
    isConnected: socketConnected,
    error: socketError,
  } = useNotificationSocket();

  /**
   * Central cache update function with cooldown
   */
  const updateNotificationCache = useCallback(async (source: string, force = false) => {
    const now = Date.now();
    
    // Apply cooldown unless forced
    if (!force && (now - lastUpdateTime.current) < updateCooldown) {
      console.log(`⏰ Skipping cache update from ${source} (cooldown active)`);
      return;
    }

    lastUpdateTime.current = now;
    console.log(`🔄 Updating notification cache from ${source}`);

    try {
      // Invalidate and refetch queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unread() }),
      ]);

      // Immediate refetch for instant UI updates (only for active queries)
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: notificationKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: notificationKeys.count(),
          type: 'active'
        }),
      ]);

      console.log(`✅ Notification cache updated from ${source}`);
    } catch (error) {
      console.error(`❌ Error updating cache from ${source}:`, error);
    }
  }, [queryClient]);

  /**
   * 1. Push notification updates
   */
  useEffect(() => {
    if (!enablePushUpdates || !isAuthenticated) return;

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      
      if (data?.notification_type) {
        console.log('📱 Push notification received, updating cache');
        updateNotificationCache('push-notification');
      }
    });

    return () => subscription.remove();
  }, [enablePushUpdates, isAuthenticated, updateNotificationCache]);

  /**
   * 2. App state change updates (React Native specific)
   */
  useEffect(() => {
    if (!enableAppStateUpdates || !isAuthenticated) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`📱 App state changed: ${appState.current} -> ${nextAppState}`);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App came to foreground, updating notifications');
        updateNotificationCache('app-foreground', true); // Force update on foreground
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, [enableAppStateUpdates, isAuthenticated, updateNotificationCache]);

  /**
   * 3. WebSocket connection monitoring
   */
  useEffect(() => {
    if (!enableWebSocketUpdates) return;

    if (socketConnected) {
      console.log('🔌 WebSocket connected for notifications');
      // WebSocket is handling real-time updates, reduce periodic updates
    } else if (socketError) {
      console.log('❌ WebSocket error, relying on other update strategies');
      // WebSocket failed, trigger an immediate update
      updateNotificationCache('websocket-error');
    }
  }, [socketConnected, socketError, enableWebSocketUpdates, updateNotificationCache]);

  /**
   * 4. Periodic updates (fallback when WebSocket is not available)
   */
  useEffect(() => {
    if (!enablePeriodicUpdates || !isAuthenticated) {
      if (periodicUpdateRef.current) {
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
      return;
    }

    // Only enable periodic updates if WebSocket is not connected
    if (!socketConnected) {
      console.log(`⏰ Starting periodic notification updates (${periodicInterval}ms)`);
      
      periodicUpdateRef.current = setInterval(() => {
        updateNotificationCache('periodic-fallback');
      }, periodicInterval);
    } else {
      // WebSocket is connected, disable periodic updates
      if (periodicUpdateRef.current) {
        console.log('⏰ Stopping periodic updates (WebSocket connected)');
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
    }

    return () => {
      if (periodicUpdateRef.current) {
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
    };
  }, [enablePeriodicUpdates, isAuthenticated, socketConnected, periodicInterval, updateNotificationCache]);

  /**
   * 5. Manual refresh function
   */
  const manualRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    updateNotificationCache('manual-refresh', true);
  }, [updateNotificationCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (periodicUpdateRef.current) {
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
    };
  }, []);

  return {
    // Status information
    isRealTimeActive: socketConnected || enablePushUpdates,
    socketConnected,
    socketError,
    
    // Manual control
    manualRefresh,
    
    // Configuration info
    strategies: {
      pushNotifications: enablePushUpdates,
      webSocket: enableWebSocketUpdates && socketConnected,
      appStateUpdates: enableAppStateUpdates,
      periodicUpdates: enablePeriodicUpdates && !socketConnected,
    },
  };
};

// Simplified helper hook for manual refreshes
export const useNotificationRefresh = () => {
  const queryClient = useQueryClient();
  
  const refresh = useCallback(async () => {
    console.log('🔄 Manual notification refresh triggered');
    
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unread() }),
      ]);
      
      // Immediate refetch for active queries
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: notificationKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: notificationKeys.count(),
          type: 'active'
        }),
      ]);
      
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Error during manual refresh:', error);
      throw error;
    }
  }, [queryClient]);
  
  return { refresh };
};