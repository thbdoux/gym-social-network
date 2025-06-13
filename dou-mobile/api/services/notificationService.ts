// api/services/notificationService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

// Existing interfaces (preserved)
interface Notification {
  id: number;
  notification_type: string;
  content: string;
  sender?: {
    id: number;
    username: string;
    avatar?: string;
  };
  is_read: boolean;
  is_seen: boolean;
  created_at: string;
  content_type?: string;
  object_id?: number;
  post_id?: number;               // New field
  content_preview?: any;          // New field for structured content
  post_type?: string;             // New field
}

interface NotificationPreference {
  email_likes: boolean;
  email_comments: boolean;
  email_shares: boolean;
  email_friend_requests: boolean;
  email_program_forks: boolean;
  email_workout_milestones: boolean;
  email_goal_achieved: boolean;
  email_mentions: boolean;
  email_gym_announcements: boolean;
  push_likes: boolean;
  push_comments: boolean;
  push_shares: boolean;
  push_friend_requests: boolean;
  push_program_forks: boolean;
  push_workout_milestones: boolean;
  push_goal_achieved: boolean;
  push_mentions: boolean;
  push_gym_announcements: boolean;
  // Global push toggle
  push_notifications_enabled?: boolean;
}

interface NotificationCount {
  unread: number;
  unseen: number;
  total: number;
}

// Updated interface for Expo push tokens
interface DeviceToken {
  token: string; // Expo push token format: ExponentPushToken[xxx] or ExpoPushToken[xxx]
  platform: 'ios' | 'android' | 'web';
}

/**
 * Service for notification API operations using Expo Push Notifications
 */
const notificationService = {
  // Existing methods (preserved)
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications/notifications/');
    return extractData(response);
  },

  getUnreadNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications/notifications/unread/');
    return extractData(response);
  },

  getNotificationCount: async (): Promise<NotificationCount> => {
    const response = await apiClient.get('/notifications/notifications/count/');
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<any> => {
    const response = await apiClient.post(`/notifications/notifications/${notificationId}/mark_read/`);
    return response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await apiClient.post('/notifications/notifications/mark_all_read/');
    return response.data;
  },

  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await apiClient.get('/notifications/preferences/');
    return response.data;
  },

  updatePreferences: async (preferences: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const response = await apiClient.patch('/notifications/preferences/', preferences);
    return response.data;
  },

  // UPDATED: Expo Push Token Management Methods
  registerDeviceToken: async (token: string, platform: 'ios' | 'android' | 'web'): Promise<any> => {
    try {
      // Validate Expo push token format
      if (!isValidExpoPushToken(token)) {
        throw new Error('Invalid Expo push token format');
      }

      const response = await apiClient.post('/notifications/device-tokens/register/', {
        token,
        platform,
      });
      console.log('✅ Expo push token registered successfully');
      return response.data;
    } catch (error: any) {
      // Handle duplicate token error gracefully
      if (error?.response?.status === 400 && 
          error?.response?.data?.token?.[0]?.includes('already exists')) {
        console.log('✅ Expo push token already registered (this is OK)');
        return { message: 'Token already registered' };
      }
      console.error('❌ Error registering Expo push token:', error);
      throw error;
    }
  },

  unregisterDeviceToken: async (token: string): Promise<any> => {
    try {
      const response = await apiClient.post('/notifications/device-tokens/unregister/', {
        token,
      });
      console.log('✅ Expo push token unregistered successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error unregistering Expo push token:', error);
      throw error;
    }
  },

  listDeviceTokens: async (): Promise<DeviceToken[]> => {
    try {
      const response = await apiClient.get('/notifications/device-tokens/list_tokens/');
      return response.data;
    } catch (error) {
      console.error('❌ Error listing Expo push tokens:', error);
      throw error;
    }
  },

  sendTestNotification: async (): Promise<any> => {
    try {
      const response = await apiClient.post('/notifications/device-tokens/test_notification/');
      console.log('🧪 Test Expo notification sent successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error sending test Expo notification:', error);
      throw error;
    }
  },

  // Enhanced notification preferences (includes push settings)
  getNotificationPreferences: async (): Promise<NotificationPreference> => {
    try {
      const response = await apiClient.get('/notifications/preferences/');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting notification preferences:', error);
      throw error;
    }
  },

  updateNotificationPreferences: async (preferences: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    try {
      const response = await apiClient.patch('/notifications/preferences/', preferences);
      console.log('✅ Notification preferences updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      throw error;
    }
  }
};

/**
 * Validates Expo push token format
 * @param token - The token to validate
 * @returns boolean indicating if token is valid
 */
const isValidExpoPushToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Expo push tokens should start with ExponentPushToken[ or ExpoPushToken[ and end with ]
  return (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) && token.endsWith(']');
};

/**
 * Utility function to test if current environment supports push notifications
 * @returns boolean
 */
export const canUsePushNotifications = (): boolean => {
  // Expo push notifications work on physical devices and in Expo Go
  return true; // Expo handles device checking internally
};

/**
 * Helper function to get notification settings URL for the device
 * Used to direct users to enable notifications in device settings
 */
export const getNotificationSettingsInfo = () => {
  return {
    message: "To receive push notifications, please enable them in your device settings.",
    ios: "Go to Settings > Notifications > Dou and enable notifications",
    android: "Go to Settings > Apps > Dou > Notifications and enable notifications"
  };
};

// Export types for use in other files
export type { Notification, NotificationPreference, NotificationCount, DeviceToken };

export default notificationService;