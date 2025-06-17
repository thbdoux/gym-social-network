// hooks/usePushNotifications.ts
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useLanguage } from '../context/LanguageContext';
import notificationService from '../api/services/notificationService';
import { notificationKeys } from './query/useNotificationQuery';

export interface PushNotificationState {
  expoPushToken?: string;
  error?: Error;
  notification?: Notifications.Notification;
  isRegistered: boolean;
}

// Enhanced notification handling behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('📱 Notification received:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data
    });
    
    const priority = notification.request.content.data?.priority || 'normal';
    const shouldShowAlert = priority !== 'low';
    const shouldPlaySound = priority !== 'low';
    
    return {
      shouldShowAlert,
      shouldPlaySound,
      shouldSetBadge: true,
    };
  },
});

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const [isRegistered, setIsRegistered] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Register for push notifications
  const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        setError(new Error('Push notifications only work on physical devices'));
        return undefined;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError(new Error('Permission to receive push notifications was denied'));
        return undefined;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "2297eb90-1775-4516-8c5c-3f6f0fe9b1d4",
      });

      console.log('✅ Expo push token obtained:', tokenData.data);
      return tokenData.data;

    } catch (error) {
      console.error('❌ Error getting push token:', error);
      setError(error as Error);
      return undefined;
    }
  };

  // Register device token with backend
  const registerDeviceToken = async (token: string) => {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      const locale = Localization.locale || language || 'en';
      
      await notificationService.registerDeviceToken(token, platform, locale);
      console.log('✅ Expo push token registered successfully with backend');
      setIsRegistered(true);
    } catch (error: any) {
      if (error?.response?.status === 400 && 
          error?.response?.data?.error?.includes('already exists')) {
        console.log('✅ Expo push token already registered (this is OK)');
        setIsRegistered(true);
        return;
      }
      console.error('❌ Failed to register Expo push token with backend:', error);
      setError(error as Error);
      setIsRegistered(false);
    }
  };

  // Unregister device token
  const unregisterDeviceToken = async (token: string) => {
    try {
      await notificationService.unregisterDeviceToken(token);
      console.log('✅ Expo push token unregistered successfully');
      setIsRegistered(false);
    } catch (error) {
      console.error('❌ Error unregistering Expo push token:', error);
    }
  };

  // **NEW: Update cache when notifications are received**
  const updateNotificationCache = async (notificationData: any) => {
    console.log('🔄 Updating notification cache from push notification');
    
    try {
      // Invalidate queries to trigger fresh data fetch
      await queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      await queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
      
      // Optionally refetch immediately for instant updates
      await queryClient.refetchQueries({ queryKey: notificationKeys.lists() });
      await queryClient.refetchQueries({ queryKey: notificationKeys.count() });
      
      console.log('✅ Notification cache updated successfully');
    } catch (error) {
      console.error('❌ Error updating notification cache:', error);
    }
  };

  // Enhanced foreground notification handling with cache updates
  const handleForegroundNotification = async (notification: Notifications.Notification) => {
    const data = notification.request.content.data;
    console.log('📱 Notification received in foreground:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data
    });
    
    setNotification(notification);
    
    // **NEW: Update cache when notification is received**
    if (data?.notification_type) {
      await updateNotificationCache(data);
    }
    
    // Handle high-priority notifications
    if (data?.priority === 'high' || data?.priority === 'urgent') {
      console.log('⚠️ High priority notification received');
    }
  };

  // Enhanced notification response handling
  const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    console.log('📱 Notification tapped:', data);
    
    // **NEW: Update cache when notification is interacted with**
    if (data?.notification_type) {
      await updateNotificationCache(data);
    }
    
    // Handle navigation
    if (data?.notification_type) {
      handleNotificationNavigation(data);
    }
  };

  // Navigation logic (existing code...)
  const handleNotificationNavigation = (data: any) => {
    const { notification_type, object_id, sender_id, metadata } = data;
    
    try {
      switch (notification_type) {
        case 'like':
        case 'comment':
        case 'share':
        case 'mention':
          if (object_id) router.push(`/post/${object_id}`);
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
          if (object_id) router.push(`/program/${object_id}`);
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
          if (object_id) router.push(`/group-workout/${object_id}`);
          break;
        
        default:
          router.push('/notifications');
          break;
      }
    } catch (error) {
      console.error('❌ Error navigating from notification:', error);
      router.push('/notifications');
    }
  };

  // Set notification categories for iOS
  const setNotificationCategories = async () => {
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('workout_invitation', [
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
      ]);

      await Notifications.setNotificationCategoryAsync('friend_request', [
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
      ]);

      await Notifications.setNotificationCategoryAsync('workout_join_request', [
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
      ]);
    }
  };

  // Initialization
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('👤 Not authenticated, skipping push notification setup');
      return;
    }

    const initializeNotifications = async () => {
      try {
        console.log('🚀 Initializing push notifications...');

        await setNotificationCategories();
        
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          await registerDeviceToken(token);
        }

        // Set up notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener(
          handleForegroundNotification
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          handleNotificationResponse
        );

        // Handle cold start notifications
        try {
          const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
          if (lastNotificationResponse) {
            console.log('🔄 App opened from notification (cold start):', lastNotificationResponse);
            if (lastNotificationResponse.notification.request.content.data?.notification_type) {
              setTimeout(async () => {
                await updateNotificationCache(lastNotificationResponse.notification.request.content.data);
                handleNotificationNavigation(lastNotificationResponse.notification.request.content.data);
              }, 1500);
            }
          }
        } catch (error) {
          console.log('ℹ️ getLastNotificationResponse not available (normal in Expo Go)');
        }

      } catch (error) {
        console.error('❌ Error initializing push notifications:', error);
        setError(error as Error);
      }
    };

    initializeNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated, user?.id, queryClient]);

  // Handle logout
  useEffect(() => {
    if (!isAuthenticated && expoPushToken && isRegistered) {
      console.log('🚪 User logged out, unregistering push token');
      unregisterDeviceToken(expoPushToken);
      setExpoPushToken(undefined);
      setIsRegistered(false);
    }
  }, [isAuthenticated, expoPushToken, isRegistered]);

  // Reset badge count when app becomes active
  useEffect(() => {
    const setBadgeCount = async () => {
      if (isAuthenticated) {
        await Notifications.setBadgeCountAsync(0);
      }
    };
    setBadgeCount();
  }, [isAuthenticated]);

  // Update device token when language changes
  useEffect(() => {
    if (expoPushToken && isAuthenticated && isRegistered) {
      const updateTokenLocale = async () => {
        try {
          const platform = Platform.OS as 'ios' | 'android';
          const locale = Localization.locale || language || 'en';
          await notificationService.registerDeviceToken(expoPushToken, platform, locale);
          console.log('🌐 Updated device token locale:', locale);
        } catch (error) {
          console.error('❌ Error updating token locale:', error);
        }
      };
      
      updateTokenLocale();
    }
  }, [language, expoPushToken, isAuthenticated, isRegistered]);

  return {
    expoPushToken,
    error,
    notification,
    isRegistered,
  };
};