// hooks/usePushNotifications.ts - Completely rewritten for performance
import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import { Platform, AppState } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './useAuth';
import { useLanguage } from '../context/LanguageContext';
import notificationService from '../api/services/notificationService';
import { cacheManager } from '../utils/cacheManager';

export interface PushNotificationState {
  expoPushToken?: string;
  error?: Error;
  notification?: Notifications.Notification;
  isRegistered: boolean;
  registrationStatus: 'idle' | 'registering' | 'registered' | 'failed';
  lastNotificationTime: number;
  notificationCount: number;
}

interface NotificationData {
  notification_type: string;
  object_id?: string;
  sender_id?: string;
  metadata?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notification_id?: number;
}

interface PushNotificationConfig {
  projectId: string;
  enableForegroundAlerts: boolean;
  enableBackgroundUpdates: boolean;
  navigationDelay: number;
  debugMode: boolean;
  coordinateWithWebSocket: boolean;
}

const DEFAULT_CONFIG: PushNotificationConfig = {
  projectId: "2297eb90-1775-4516-8c5c-3f6f0fe9b1d4",
  enableForegroundAlerts: true,
  enableBackgroundUpdates: true,
  navigationDelay: 1500,
  debugMode: __DEV__,
  coordinateWithWebSocket: true,
};

// Enhanced notification handling with priority-based behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as NotificationData;
    const priority = data?.priority || 'normal';
    
    // Different handling based on priority and app state
    const appState = AppState.currentState;
    const isAppActive = appState === 'active';
    
    const shouldShowAlert = !isAppActive || priority !== 'low';
    const shouldPlaySound = priority === 'high' || priority === 'urgent';
    const shouldSetBadge = true;
    
    if (__DEV__) {
      console.log('📱 Notification handler:', {
        title: notification.request.content.title,
        priority,
        appState,
        shouldShowAlert,
        shouldPlaySound,
      });
    }
    
    return {
      shouldShowAlert,
      shouldPlaySound,
      shouldSetBadge,
    };
  },
});

export const usePushNotifications = (config: Partial<PushNotificationConfig> = {}): PushNotificationState => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  
  // State management
  const [state, setState] = useState<PushNotificationState>({
    isRegistered: false,
    registrationStatus: 'idle',
    lastNotificationTime: 0,
    notificationCount: 0,
  });
  
  // Refs for cleanup and navigation control
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const mountedRef = useRef(true);
  const navigationInProgress = useRef(false);
  const lastCacheUpdateTime = useRef(0);
  const duplicateNotificationCache = useRef(new Set<string>());

  /**
   * Safe state update helper
   */
  const updateState = useCallback((updates: Partial<PushNotificationState>) => {
    if (!mountedRef.current) return;
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Enhanced device token registration with retry logic
   */
  const registerForPushNotificationsAsync = useCallback(async (): Promise<string | undefined> => {
    try {
      if (!Device.isDevice) {
        const error = new Error('Push notifications only work on physical devices');
        updateState({ error, registrationStatus: 'failed' });
        return undefined;
      }

      updateState({ registrationStatus: 'registering' });

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if needed
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        const error = new Error('Push notification permissions denied');
        updateState({ error, registrationStatus: 'failed' });
        return undefined;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: finalConfig.projectId,
      });

      if (finalConfig.debugMode) {
        console.log('✅ Expo push token obtained');
      }

      updateState({ 
        expoPushToken: tokenData.data,
        error: undefined,
        registrationStatus: 'registered'
      });

      return tokenData.data;

    } catch (error: any) {
      console.error('❌ Error getting push token:', error);
      updateState({ 
        error: error as Error,
        registrationStatus: 'failed'
      });
      return undefined;
    }
  }, [finalConfig.projectId, finalConfig.debugMode, updateState]);

  /**
   * Register device token with backend with retry logic
   */
  const registerDeviceToken = useCallback(async (token: string, retryCount = 0): Promise<boolean> => {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      const locale = Localization.locale || language || 'en';
      
      await notificationService.registerDeviceToken(token, platform, locale);
      
      console.log('✅ Push token registered with backend');
      updateState({ isRegistered: true });
      return true;
      
    } catch (error: any) {
      // Handle duplicate registration gracefully
      if (error?.response?.status === 400 && 
          error?.response?.data?.error?.includes('already exists')) {
        console.log('✅ Push token already registered (OK)');
        updateState({ isRegistered: true });
        return true;
      }
      
      // Retry logic for network errors
      if (retryCount < 3 && (error?.code === 'NETWORK_ERROR' || error?.response?.status >= 500)) {
        console.log(`🔄 Retrying token registration (${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return registerDeviceToken(token, retryCount + 1);
      }
      
      console.error('❌ Failed to register push token:', error);
      updateState({ 
        error: error as Error,
        isRegistered: false 
      });
      return false;
    }
  }, [language, updateState]);

  /**
   * Unregister device token
   */
  const unregisterDeviceToken = useCallback(async (token: string): Promise<void> => {
    try {
      await notificationService.unregisterDeviceToken(token);
      console.log('✅ Push token unregistered');
      updateState({ isRegistered: false });
    } catch (error) {
      console.error('❌ Error unregistering push token:', error);
    }
  }, [updateState]);

  /**
   * Smart cache update that coordinates with WebSocket
   */
  const scheduleSmartCacheUpdate = useCallback((
    source: string,
    data: NotificationData,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ) => {
    const now = Date.now();
    
    // Prevent duplicate updates within 2 seconds
    if (now - lastCacheUpdateTime.current < 2000) {
      if (finalConfig.debugMode) {
        console.log('⏰ Skipping duplicate cache update');
      }
      return;
    }
    
    lastCacheUpdateTime.current = now;
    
    // Create unique key for deduplication
    const updateKey = `${data.notification_type}-${data.object_id || 'none'}-${data.notification_id || 'none'}`;
    
    if (duplicateNotificationCache.current.has(updateKey)) {
      if (finalConfig.debugMode) {
        console.log('🔄 Skipping duplicate notification:', updateKey);
      }
      return;
    }
    
    duplicateNotificationCache.current.add(updateKey);
    
    // Clean up old entries after 30 seconds
    setTimeout(() => {
      duplicateNotificationCache.current.delete(updateKey);
    }, 30000);
    
    // Schedule coordinated cache updates
    cacheManager.scheduleUpdate({
      queryKey: 'notifications',
      source: `push-${source}`,
      priority,
      data: {
        notification: data,
        timestamp: now,
        source: 'push'
      }
    });
    
    // Update count for new notifications
    if (source === 'new-notification') {
      cacheManager.scheduleUpdate({
        queryKey: 'notification-count',
        source: `push-${source}`,
        priority
      });
    }
    
    if (finalConfig.debugMode) {
      console.log(`📡 Scheduled ${priority} cache update from push-${source}`);
    }
  }, [finalConfig.debugMode]);

  /**
   * Enhanced foreground notification handling
   */
  const handleForegroundNotification = useCallback(async (notification: Notifications.Notification) => {
    const data = notification.request.content.data as NotificationData;
    const now = Date.now();
    
    if (finalConfig.debugMode) {
      console.log('📱 Foreground notification:', {
        title: notification.request.content.title,
        type: data?.notification_type,
        priority: data?.priority,
      });
    }
    
    updateState({
      notification,
      lastNotificationTime: now,
      notificationCount: state.notificationCount + 1,
    });
    
    // Smart cache update for new notifications
    if (data?.notification_type) {
      const priority = data.priority === 'urgent' ? 'critical' : 'high';
      scheduleSmartCacheUpdate('new-notification', data, priority);
    }
    
    // Handle high-priority notifications with enhanced UX
    if (data?.priority === 'urgent') {
      console.log('🚨 Urgent notification received');
      // Could trigger additional UI feedback here
    }
  }, [finalConfig.debugMode, updateState, scheduleSmartCacheUpdate, state.notificationCount]);

  /**
   * Enhanced notification response handling with smart navigation
   */
  const handleNotificationResponse = useCallback(async (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;
    
    if (finalConfig.debugMode) {
      console.log('📱 Notification tapped:', data?.notification_type);
    }
    
    // Update cache when user interacts with notification
    if (data?.notification_type) {
      scheduleSmartCacheUpdate('interaction', data, 'normal');
    }
    
    // Smart navigation with collision detection
    if (data?.notification_type && !navigationInProgress.current) {
      navigationInProgress.current = true;
      
      // Delay navigation to ensure app is ready
      setTimeout(() => {
        try {
          handleNotificationNavigation(data);
        } catch (error) {
          console.error('❌ Navigation error:', error);
          // Fallback to notifications page
          router.push('/notifications');
        } finally {
          navigationInProgress.current = false;
        }
      }, finalConfig.navigationDelay);
    }
  }, [finalConfig.debugMode, finalConfig.navigationDelay, scheduleSmartCacheUpdate]);

  /**
   * Enhanced navigation logic with error handling
   */
  const handleNotificationNavigation = useCallback((data: NotificationData) => {
    const { notification_type, object_id, sender_id } = data;
    
    try {
      switch (notification_type) {
        case 'like':
        case 'comment':
        case 'share':
        case 'mention':
          if (object_id) {
            router.push(`/post/${object_id}`);
          } else {
            router.push('/notifications');
          }
          break;
        
        case 'friend_request':
        case 'friend_accept':
          if (sender_id) {
            router.push(`/user/${sender_id}`);
          } else {
            router.push('/friends');
          }
          break;
        
        case 'program_fork':
        case 'program_shared':
        case 'program_liked':
        case 'program_used':
          if (object_id) {
            router.push(`/program/${object_id}`);
          } else {
            router.push('/programs');
          }
          break;
        
        case 'workout_milestone':
        case 'goal_achieved':
        case 'streak_milestone':
        case 'personal_record':
          if (object_id) {
            router.push(`/workout-log/${object_id}`);
          } else {
            router.push('/workouts');
          }
          break;
        
        case 'workout_invitation':
        case 'workout_join':
        case 'workout_join_request':
        case 'workout_request_approved':
        case 'workout_request_rejected':
        case 'workout_cancelled':
        case 'workout_removed':
        case 'workout_completed':
        case 'workout_reminder':
          if (object_id) {
            router.push(`/group-workout/${object_id}`);
          } else {
            router.push('/group-workouts');
          }
          break;
        
        default:
          router.push('/notifications');
          break;
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
      router.push('/notifications');
    }
  }, []);

  /**
   * Set up notification categories for iOS
   */
  const setupNotificationCategories = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    
    try {
      await Promise.all([
        Notifications.setNotificationCategoryAsync('workout_invitation', [
          {
            identifier: 'join',
            buttonTitle: 'Join',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'decline',
            buttonTitle: 'Decline',
            options: { opensAppToForeground: false },
          },
        ]),
        
        Notifications.setNotificationCategoryAsync('friend_request', [
          {
            identifier: 'accept',
            buttonTitle: 'Accept',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'decline',
            buttonTitle: 'Decline',
            options: { opensAppToForeground: false },
          },
        ]),
        
        Notifications.setNotificationCategoryAsync('workout_join_request', [
          {
            identifier: 'approve',
            buttonTitle: 'Approve',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'reject',
            buttonTitle: 'Reject',
            options: { opensAppToForeground: false },
          },
        ]),
      ]);
      
      console.log('✅ Notification categories configured');
    } catch (error) {
      console.error('❌ Error setting up notification categories:', error);
    }
  }, []);

  /**
   * Handle cold start notifications
   */
  const handleColdStartNotification = useCallback(async () => {
    try {
      const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
      
      if (lastNotificationResponse?.notification.request.content.data) {
        const data = lastNotificationResponse.notification.request.content.data as NotificationData;
        
        if (finalConfig.debugMode) {
          console.log('🔄 Cold start notification:', data.notification_type);
        }
        
        // Update cache for cold start
        if (data.notification_type) {
          scheduleSmartCacheUpdate('cold-start', data, 'normal');
          
          // Navigate after app is ready
          setTimeout(() => {
            handleNotificationNavigation(data);
          }, finalConfig.navigationDelay);
        }
      }
    } catch (error) {
      if (finalConfig.debugMode) {
        console.log('ℹ️ getLastNotificationResponse not available (normal in Expo Go)');
      }
    }
  }, [finalConfig.debugMode, finalConfig.navigationDelay, scheduleSmartCacheUpdate, handleNotificationNavigation]);

  /**
   * Main initialization effect
   */
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('👤 Not authenticated, skipping push notification setup');
      updateState({ 
        registrationStatus: 'idle',
        isRegistered: false 
      });
      return;
    }

    const initializeNotifications = async () => {
      try {
        if (finalConfig.debugMode) {
          console.log('🚀 Initializing push notifications...');
        }

        // Setup notification categories
        await setupNotificationCategories();
        
        // Register for push notifications
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await registerDeviceToken(token);
        }

        // Set up listeners
        notificationListener.current = Notifications.addNotificationReceivedListener(
          handleForegroundNotification
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          handleNotificationResponse
        );

        // Handle cold start
        await handleColdStartNotification();

        if (finalConfig.debugMode) {
          console.log('✅ Push notifications initialized');
        }

      } catch (error) {
        console.error('❌ Error initializing push notifications:', error);
        updateState({ 
          error: error as Error,
          registrationStatus: 'failed'
        });
      }
    };

    initializeNotifications();

    // Cleanup function
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [
    isAuthenticated, 
    user?.id, 
    finalConfig.debugMode,
    setupNotificationCategories,
    registerForPushNotificationsAsync,
    registerDeviceToken,
    handleForegroundNotification,
    handleNotificationResponse,
    handleColdStartNotification,
    updateState
  ]);

  /**
   * Handle logout cleanup
   */
  useEffect(() => {
    if (!isAuthenticated && state.expoPushToken && state.isRegistered) {
      console.log('🚪 User logged out, unregistering push token');
      unregisterDeviceToken(state.expoPushToken);
      updateState({ 
        expoPushToken: undefined,
        isRegistered: false,
        registrationStatus: 'idle'
      });
    }
  }, [isAuthenticated, state.expoPushToken, state.isRegistered, unregisterDeviceToken, updateState]);

  /**
   * Update device token when language changes
   */
  useEffect(() => {
    if (state.expoPushToken && isAuthenticated && state.isRegistered) {
      const updateTokenLocale = async () => {
        try {
          const platform = Platform.OS as 'ios' | 'android';
          const locale = Localization.locale || language || 'en';
          await notificationService.registerDeviceToken(state.expoPushToken!, platform, locale);
          
          if (finalConfig.debugMode) {
            console.log('🌐 Updated device token locale:', locale);
          }
        } catch (error) {
          console.error('❌ Error updating token locale:', error);
        }
      };
      
      updateTokenLocale();
    }
  }, [language, state.expoPushToken, isAuthenticated, state.isRegistered, finalConfig.debugMode]);

  /**
   * Badge count management
   */
  useEffect(() => {
    const setBadgeCount = async () => {
      if (isAuthenticated) {
        await Notifications.setBadgeCountAsync(0);
      }
    };
    
    setBadgeCount();
  }, [isAuthenticated]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      duplicateNotificationCache.current.clear();
    };
  }, []);

  return state;
};