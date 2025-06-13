// hooks/usePushNotifications.ts
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './useAuth';
import notificationService from '../api/services/notificationService';

export interface PushNotificationState {
  expoPushToken?: string;
  error?: Error;
  notification?: Notifications.Notification;
}

// Configure notification handling behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  
  const { isAuthenticated, user } = useAuth();
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Register for push notifications
  const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    try {
      // Check if running on a physical device
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        setError(new Error('Push notifications only work on physical devices'));
        return undefined;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError(new Error('Permission to receive push notifications was denied'));
        return undefined;
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "2297eb90-1775-4516-8c5c-3f6f0fe9b1d4", // Your EAS project ID
      });

      console.log('Expo push token:', tokenData.data);
      return tokenData.data;

    } catch (error) {
      console.error('Error getting push token:', error);
      setError(error as Error);
      return undefined;
    }
  };

  // Register device token with backend
  const registerDeviceToken = async (token: string) => {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      
      await notificationService.registerDeviceToken(token, platform);
      console.log('Expo push token registered successfully with backend');
    } catch (error: any) {
      // Handle duplicate token error gracefully
      if (error?.response?.data?.token?.[0]?.includes('already exists')) {
        console.log('Expo push token already registered (this is OK)');
        return; // Don't set error for duplicate tokens
      }
      console.error('Failed to register Expo push token with backend:', error);
      setError(error as Error);
    }
  };

  // Unregister device token
  const unregisterDeviceToken = async (token: string) => {
    try {
      await notificationService.unregisterDeviceToken(token);
      console.log('Expo push token unregistered successfully');
    } catch (error) {
      console.error('Error unregistering Expo push token:', error);
    }
  };

  // Handle notification tap/response
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    console.log('Notification tapped:', data);
    
    if (data?.notification_type) {
      handleNotificationNavigation(data);
    }
  };

  // Handle notification received in foreground
  const handleForegroundNotification = (notification: Notifications.Notification) => {
    console.log('Notification received in foreground:', notification);
    setNotification(notification);
    
    // You can show an in-app notification here if needed
    // The notification will automatically appear in the system notification panel
  };

  // Navigation logic based on notification type
  const handleNotificationNavigation = (data: any) => {
    const { notification_type, object_id, sender_id } = data;
    
    try {
      switch (notification_type) {
        case 'like':
        case 'comment':
        case 'share':
        case 'mention':
          if (object_id) {
            router.push(`/post/${object_id}`);
          }
          break;
        
        case 'friend_request':
        case 'friend_accept':
          router.push('/friends');
          break;
        
        case 'program_fork':
          if (object_id) {
            router.push(`/program/${object_id}`);
          }
          break;
        
        case 'workout_milestone':
        case 'goal_achieved':
        case 'workout_completed':
          router.push('/workouts');
          break;
        
        case 'workout_invitation':
        case 'workout_join':
        case 'workout_join_request':
        case 'workout_request_approved':
        case 'workout_request_rejected':
        case 'workout_cancelled':
        case 'workout_removed':
          if (object_id) {
            router.push(`/group-workout/${object_id}`);
          }
          break;
        
        case 'gym_announcement':
          router.push('/gyms');
          break;
        
        default:
          // Default to notifications screen
          router.push('/notifications');
          break;
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
      // Fallback to notifications screen
      router.push('/notifications');
    }
  };

  // Set notification categories for iOS (optional)
  const setNotificationCategories = async () => {
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('workout', [
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
    }
  };

  // Initialize Expo notifications
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const initializeNotifications = async () => {
      try {
        // Set notification categories
        await setNotificationCategories();

        // Register for push notifications
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

        // Handle notification that opened the app (cold start)
        try {
          const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
          if (lastNotificationResponse) {
            console.log('App opened from notification (cold start):', lastNotificationResponse);
            if (lastNotificationResponse.notification.request.content.data?.notification_type) {
              // Add small delay to ensure navigation is ready
              setTimeout(() => {
                handleNotificationNavigation(lastNotificationResponse.notification.request.content.data);
              }, 1000);
            }
          }
        } catch (error) {
          // getLastNotificationResponse might not be available in Expo Go
          console.log('getLastNotificationResponse not available (this is normal in Expo Go)');
        }

      } catch (error) {
        console.error('Error initializing Expo notifications:', error);
        setError(error as Error);
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
  }, [isAuthenticated, user]);

  // Handle logout - unregister token
  useEffect(() => {
    if (!isAuthenticated && expoPushToken) {
      unregisterDeviceToken(expoPushToken);
      setExpoPushToken(undefined);
    }
  }, [isAuthenticated, expoPushToken]);

  // Set badge count to 0 when app becomes active (optional)
  useEffect(() => {
    const setBadgeCount = async () => {
      if (isAuthenticated) {
        await Notifications.setBadgeCountAsync(0);
      }
    };
    setBadgeCount();
  }, [isAuthenticated]);

  return {
    expoPushToken,
    error,
    notification,
  };
};