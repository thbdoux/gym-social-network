// hooks/usePushNotifications.ts (UPDATED to align with notifications page)
import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import { Platform, AppState } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './useAuth';
import { useLanguage } from '../context/LanguageContext';
import notificationService, { 
  translateNotification, 
  getNotificationNavigation,
  getNotificationIcon,
  getNotificationColor,
  type Notification
} from '../api/services/notificationService';
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
  notification_id?: number;
  notification_type: string;
  title_key?: string;
  body_key?: string;
  translation_params?: Record<string, any>;
  object_id?: string;
  sender_id?: string;
  metadata?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  // Fallback fields for backward compatibility
  title?: string;
  body?: string;
}

interface PushNotificationConfig {
  projectId: string;
  enableForegroundAlerts: boolean;
  enableBackgroundUpdates: boolean;
  navigationDelay: number;
  debugMode: boolean;
  coordinateWithWebSocket: boolean;
  showTranslatedContent: boolean; // NEW: Use translated content like notifications page
}

const DEFAULT_CONFIG: PushNotificationConfig = {
  projectId: "2297eb90-1775-4516-8c5c-3f6f0fe9b1d4",
  enableForegroundAlerts: true,
  enableBackgroundUpdates: true,
  navigationDelay: 1500,
  debugMode: __DEV__,
  coordinateWithWebSocket: true,
  showTranslatedContent: true, // NEW: Enable translated content by default
};

// Enhanced notification handler with translation support
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
      console.log('📱 Enhanced notification handler:', {
        title: notification.request.content.title,
        type: data?.notification_type,
        priority,
        appState,
        shouldShowAlert,
        shouldPlaySound,
        hasTranslationKeys: !!(data?.title_key && data?.body_key),
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
  const { language, t } = useLanguage(); // Get translation function
  
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
   * Register device token with backend with enhanced device info
   */
  const registerDeviceToken = useCallback(async (token: string, retryCount = 0): Promise<boolean> => {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      const locale = Localization.locale || language || 'en';
      
      // Enhanced device info
      const deviceInfo = {
        app_version: '1.0.0', // You can get this from your app config
        os_version: Platform.Version,
        device_name: Device.deviceName,
        device_model: Device.modelName,
        locale: locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen_dimensions: {
          // You can get this from Dimensions if needed
        }
      };
      
      await notificationService.registerDeviceToken(token, platform, locale, deviceInfo);
      
      console.log('✅ Enhanced push token registered with backend');
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
   * NEW: Get translated notification content (same as notifications page)
   */
  const getTranslatedNotificationContent = useCallback((data: NotificationData): { title: string; body: string } => {
    // If we have translation keys, use them (same logic as notifications page)
    if (data.title_key && data.body_key && data.translation_params) {
      return translateNotification(
        data.title_key,
        data.body_key,
        data.translation_params,
        t
      );
    }
    
    // Fallback to provided title/body
    if (data.title && data.body) {
      return {
        title: data.title,
        body: data.body
      };
    }
    
    // Generate fallback based on notification type (same logic as notifications page)
    const username = data.translation_params?.sender_display_name || 
                    data.translation_params?.sender_username || 
                    t('anonymous');
    
    const typeBasedContent = generateFallbackContent(data.notification_type, username, data.translation_params || {}, t);
    
    return typeBasedContent;
  }, [t]);

  /**
   * Enhanced foreground notification handling with translation support
   */
  const handleForegroundNotification = useCallback(async (notification: Notifications.Notification) => {
    const data = notification.request.content.data as NotificationData;
    const now = Date.now();
    
    // Get translated content if enabled (align with notifications page)
    let displayContent = {
      title: notification.request.content.title || '',
      body: notification.request.content.body || ''
    };
    
    if (finalConfig.showTranslatedContent && data.notification_type) {
      try {
        displayContent = getTranslatedNotificationContent(data);
      } catch (error) {
        console.warn('Failed to get translated content, using original:', error);
      }
    }
    
    if (finalConfig.debugMode) {
      console.log('📱 Enhanced foreground notification:', {
        originalTitle: notification.request.content.title,
        translatedTitle: displayContent.title,
        type: data?.notification_type,
        priority: data?.priority,
        hasTranslationKeys: !!(data?.title_key && data?.body_key),
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
    
    // Show enhanced foreground notification with translated content
    if (finalConfig.showTranslatedContent && displayContent.title !== notification.request.content.title) {
      // You could show a custom in-app notification here with the translated content
      if (finalConfig.debugMode) {
        console.log('📱 Would show translated notification:', displayContent);
      }
    }
    
    // Handle high-priority notifications with enhanced UX
    if (data?.priority === 'urgent') {
      console.log('🚨 Urgent notification received');
      // Could trigger additional UI feedback here
    }
  }, [finalConfig.debugMode, finalConfig.showTranslatedContent, updateState, scheduleSmartCacheUpdate, state.notificationCount, getTranslatedNotificationContent]);

  /**
   * Enhanced notification response handling with unified navigation
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
    
    // Use the same navigation logic as the notifications page
    if (data?.notification_type && !navigationInProgress.current) {
      navigationInProgress.current = true;
      
      // Delay navigation to ensure app is ready
      setTimeout(() => {
        try {
          // Create a mock notification object for navigation
          const mockNotification: Notification = {
            id: parseInt(data.notification_id || '0'),
            recipient: parseInt(data.sender_id || '0'),
            notification_type: data.notification_type as any,
            title_key: data.title_key || '',
            body_key: data.body_key || '',
            translation_params: data.translation_params || {},
            content: '',
            metadata: data.metadata || {},
            is_read: false,
            is_seen: false,
            created_at: new Date().toISOString(),
            priority: data.priority || 'normal',
            object_id: data.object_id ? parseInt(data.object_id) : undefined,
            sender: data.sender_id ? { id: parseInt(data.sender_id), username: '', display_name: '' } : undefined,
          };
          
          // Use the same navigation function as notifications page
          const navigationPath = getNotificationNavigation(mockNotification);
          router.push(navigationPath);
          
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
   * Set up enhanced notification categories for iOS with translated actions
   */
  const setupNotificationCategories = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    
    try {
      await Promise.all([
        Notifications.setNotificationCategoryAsync('workout_invitation', [
          {
            identifier: 'join',
            buttonTitle: t('join') || 'Join',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'decline',
            buttonTitle: t('decline') || 'Decline',
            options: { opensAppToForeground: false },
          },
        ]),
        
        Notifications.setNotificationCategoryAsync('friend_request', [
          {
            identifier: 'accept',
            buttonTitle: t('accept') || 'Accept',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'decline',
            buttonTitle: t('decline') || 'Decline',
            options: { opensAppToForeground: false },
          },
        ]),
        
        Notifications.setNotificationCategoryAsync('workout_join_request', [
          {
            identifier: 'approve',
            buttonTitle: t('approve') || 'Approve',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'reject',
            buttonTitle: t('reject') || 'Reject',
            options: { opensAppToForeground: false },
          },
        ]),
        
        // NEW: Group workout message category
        Notifications.setNotificationCategoryAsync('group_workout_message', [
          {
            identifier: 'reply',
            buttonTitle: t('reply') || 'Reply',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'view',
            buttonTitle: t('view') || 'View',
            options: { opensAppToForeground: true },
          },
        ]),
      ]);
      
      console.log('✅ Enhanced notification categories configured');
    } catch (error) {
      console.error('❌ Error setting up notification categories:', error);
    }
  }, [t]);

  /**
   * Handle cold start notifications with enhanced navigation
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
          
          // Use unified navigation after app is ready
          setTimeout(() => {
            const mockNotification: Notification = {
              id: parseInt(data.notification_id || '0'),
              recipient: 0,
              notification_type: data.notification_type as any,
              title_key: data.title_key || '',
              body_key: data.body_key || '',
              translation_params: data.translation_params || {},
              content: '',
              metadata: data.metadata || {},
              is_read: false,
              is_seen: false,
              created_at: new Date().toISOString(),
              priority: data.priority || 'normal',
              object_id: data.object_id ? parseInt(data.object_id) : undefined,
              sender: data.sender_id ? { id: parseInt(data.sender_id), username: '', display_name: '' } : undefined,
            };
            
            const navigationPath = getNotificationNavigation(mockNotification);
            router.push(navigationPath);
          }, finalConfig.navigationDelay);
        }
      }
    } catch (error) {
      if (finalConfig.debugMode) {
        console.log('ℹ️ getLastNotificationResponse not available (normal in Expo Go)');
      }
    }
  }, [finalConfig.debugMode, finalConfig.navigationDelay, scheduleSmartCacheUpdate]);

  // Rest of the initialization and cleanup logic remains the same...
  // [Previous useEffect hooks for initialization, language updates, etc.]

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
          console.log('🚀 Initializing enhanced push notifications...');
        }

        // Setup enhanced notification categories
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
          console.log('✅ Enhanced push notifications initialized');
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
   * Update device token when language changes
   */
  useEffect(() => {
    if (state.expoPushToken && isAuthenticated && state.isRegistered) {
      const updateTokenLocale = async () => {
        try {
          await notificationService.updateDeviceLocale(state.expoPushToken!, language);
          
          if (finalConfig.debugMode) {
            console.log('🌐 Updated device token locale:', language);
          }
        } catch (error) {
          console.error('❌ Error updating token locale:', error);
        }
      };
      
      updateTokenLocale();
    }
  }, [language, state.expoPushToken, isAuthenticated, state.isRegistered, finalConfig.debugMode]);

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

/**
 * Generate fallback content when translation fails (same logic as notifications page)
 */
const generateFallbackContent = (
  notificationType: string,
  username: string,
  params: Record<string, any>,
  t: (key: string, params?: Record<string, any>) => string
): { title: string; body: string } => {
  
  const titleFallbacks: Record<string, string> = {
    'like': `👍 ${username} liked your post`,
    'comment': `💬 ${username} commented`,
    'comment_reply': `↪️ ${username} replied`,
    'mention': `📣 ${username} mentioned you`,
    'post_reaction': `😍 ${username} reacted`,
    'comment_reaction': `😊 ${username} reacted`,
    'share': `🔄 ${username} shared your post`,
    'friend_request': `👥 Friend request`,
    'friend_accept': `🎉 Friend request accepted!`,
    'program_fork': `🍴 Program forked`,
    'program_used': `🏋️ Program used`,
    'workout_milestone': `🏆 Milestone achieved!`,
    'group_workout_message': `💬 New message`,
    'workout_invitation': `🏋️‍♀️ Workout invitation`,
    'workout_join': `🎉 Someone joined`,
    'streak_milestone': `🔥 Streak milestone!`,
    'personal_record': `💪 New personal record!`,
  };
  
  const bodyFallbacks: Record<string, string> = {
    'like': `${username} liked your post`,
    'comment': `${username} commented on your post`,
    'comment_reply': `${username} replied to your comment`,
    'mention': `${username} mentioned you in a comment`,
    'post_reaction': `${username} reacted to your post`,
    'comment_reaction': `${username} reacted to your comment`,
    'share': `${username} shared your post`,
    'friend_request': `${username} sent you a friend request`,
    'friend_accept': `${username} accepted your friend request`,
    'program_fork': `${username} forked your program`,
    'program_used': `${username} used your program`,
    'workout_milestone': `You've completed ${params.workout_count || 0} workouts!`,
    'group_workout_message': `${username} sent a message in the workout chat`,
    'workout_invitation': `${username} invited you to a workout`,
    'workout_join': `${username} joined your workout`,
    'streak_milestone': `You've maintained a ${params.streak_days || 0}-day streak!`,
    'personal_record': `New PR in ${params.exercise_name || 'exercise'}!`,
  };
  
  return {
    title: titleFallbacks[notificationType] || `🔔 ${t('new_notification')}`,
    body: bodyFallbacks[notificationType] || `${username} ${notificationType.replace(/_/g, ' ')}`
  };
};