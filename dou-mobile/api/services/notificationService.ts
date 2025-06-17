// api/services/notificationService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

// Updated interface to match backend model
interface Notification {
  id: number;
  recipient: number;
  sender?: {
    id: number;
    username: string;
    avatar?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
  };
  notification_type: string;
  
  // Translation support (new)
  title_key: string;
  body_key: string;
  translation_params: Record<string, any>;
  
  // Fallback content for backwards compatibility
  content: string;
  
  // Generic relation fields
  content_type?: string;
  object_id?: number;
  
  // Additional metadata
  metadata: Record<string, any>;
  
  // Status fields
  is_read: boolean;
  is_seen: boolean;
  created_at: string;
  
  // Priority for notification ordering
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Legacy fields for compatibility
  post_id?: number;
  content_preview?: any;
  post_type?: string;
}

// Enhanced notification preferences
interface NotificationPreference {
  // Email notification preferences
  email_likes: boolean;
  email_comments: boolean;
  email_shares: boolean;
  email_friend_requests: boolean;
  email_program_activities: boolean;
  email_workout_milestones: boolean;
  email_goal_achieved: boolean;
  email_mentions: boolean;
  email_gym_announcements: boolean;
  email_group_workouts: boolean;
  email_workout_reminders: boolean;
  
  // Push notification preferences
  push_likes: boolean;
  push_comments: boolean;
  push_shares: boolean;
  push_friend_requests: boolean;
  push_program_activities: boolean;
  push_workout_milestones: boolean;
  push_goal_achieved: boolean;
  push_mentions: boolean;
  push_gym_announcements: boolean;
  push_group_workouts: boolean;
  push_workout_reminders: boolean;
  
  // Global push notification toggle
  push_notifications_enabled: boolean;
  
  // Quiet hours for notifications
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  
  // Frequency settings
  digest_frequency: 'never' | 'daily' | 'weekly';
}

interface NotificationCount {
  unread: number;
  unseen: number;
  total: number;
}

// Enhanced device token interface
interface DeviceToken {
  token: string; // Expo push token format: ExponentPushToken[xxx] or ExpoPushToken[xxx]
  platform: 'ios' | 'android' | 'web';
  locale?: string; // Device locale for targeted notifications
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

/**
 * Enhanced notification service with translation key support
 */
const notificationService = {
  // Core notification methods
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

  // Enhanced preferences management
  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await apiClient.get('/notifications/preferences/');
    return response.data;
  },

  updatePreferences: async (preferences: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const response = await apiClient.patch('/notifications/preferences/', preferences);
    return response.data;
  },

  // Enhanced Expo Push Token Management
  registerDeviceToken: async (
    token: string, 
    platform: 'ios' | 'android' | 'web',
    locale?: string
  ): Promise<any> => {
    try {
      // Validate Expo push token format
      if (!isValidExpoPushToken(token)) {
        throw new Error('Invalid Expo push token format');
      }

      const payload: any = {
        token,
        platform,
      };

      // Add locale if provided
      if (locale) {
        payload.locale = locale;
      }

      const response = await apiClient.post('/notifications/device-tokens/register/', payload);
      console.log('✅ Expo push token registered successfully');
      return response.data;
    } catch (error: any) {
      // Handle duplicate token error gracefully
      if (error?.response?.status === 400 && 
          error?.response?.data?.error?.includes('already exists')) {
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

  // Alias methods for backwards compatibility
  getNotificationPreferences: async (): Promise<NotificationPreference> => {
    return notificationService.getPreferences();
  },

  updateNotificationPreferences: async (preferences: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    return notificationService.updatePreferences(preferences);
  }
};

/**
 * Enhanced Expo push token validation
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
 * Translation helper function for notification content (updated for flattened structure)
 * @param titleKey - Translation key for title (e.g., "notifications.like.title")
 * @param bodyKey - Translation key for body (e.g., "notifications.like.body")
 * @param params - Translation parameters
 * @param t - Translation function
 * @returns Translated notification content
 */
 export const translateNotification = (
  titleKey: string,
  bodyKey: string,
  params: Record<string, any>,
  t: (key: string, params?: Record<string, any>) => string
) => {
  return {
    title: t(titleKey, params),
    body: t(bodyKey, params),
  };
};

// Alternative simplified version if you're using the flattened structure consistently:
export const getNotificationText = (
  notificationType: string,
  field: 'title' | 'body' | 'push_title' | 'push_body' | 'email_subject' | 'email_body',
  params: Record<string, any>,
  t: (key: string, params?: Record<string, any>) => string
) => {
  const key = `notifications.${notificationType}.${field}`;
  return t(key, params);
};

/**
 * Get notification icon based on type
 * @param type - Notification type
 * @returns Icon name for the notification type
 */
export const getNotificationIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    // Post interactions
    'like': 'heart',
    'comment': 'chatbubble',
    'share': 'share-social',
    'mention': 'at',
    
    // Social interactions
    'friend_request': 'person-add',
    'friend_accept': 'people',
    
    // Program interactions
    'program_fork': 'git-branch',
    'program_shared': 'share',
    'program_liked': 'heart',
    'program_used': 'play',
    
    // Template interactions
    'template_used': 'document',
    'template_forked': 'git-branch',
    
    // Workout milestones and achievements
    'workout_milestone': 'trophy',
    'goal_achieved': 'flag',
    'streak_milestone': 'flame',
    'personal_record': 'medal',
    
    // Group workout interactions
    'workout_invitation': 'fitness',
    'workout_join': 'log-in',
    'workout_join_request': 'enter',
    'workout_request_approved': 'checkmark-circle',
    'workout_request_rejected': 'close-circle',
    'workout_cancelled': 'calendar-outline',
    'workout_removed': 'exit',
    'workout_completed': 'checkmark-done-circle',
    'workout_reminder': 'alarm',
    
    // Group workout proposals and voting
    'workout_proposal_submitted': 'bulb',
    'workout_proposal_voted': 'thumbs-up',
    'workout_proposal_selected': 'checkmark-done',
    
    // Workout partnerships
    'workout_partner_added': 'people',
    'workout_partner_request': 'person-add',
    
    // Gym and system notifications
    'gym_announcement': 'megaphone',
    'system_update': 'settings',
    'challenge_invitation': 'trophy',
    'challenge_completed': 'ribbon',
  };
  
  return iconMap[type] || 'notifications';
};

/**
 * Get notification color based on type
 * @param type - Notification type
 * @returns Color for the notification type
 */
export const getNotificationColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'like': '#FF3B30',
    'comment': '#007AFF',
    'share': '#AF52DE',
    'mention': '#FF9500',
    'friend_request': '#34C759',
    'friend_accept': '#34C759',
    'program_fork': '#5856D6',
    'workout_milestone': '#FFD700',
    'goal_achieved': '#FFD700',
    'streak_milestone': '#FF6B35',
    'personal_record': '#32D74B',
    'workout_request_approved': '#34C759',
    'workout_request_rejected': '#FF3B30',
    'workout_cancelled': '#FF3B30',
    'workout_completed': '#5AC8FA',
  };
  
  return colorMap[type] || '#007AFF';
};

/**
 * Get notification priority color
 * @param priority - Notification priority
 * @returns Color for the priority level
 */
export const getPriorityColor = (priority: string): string => {
  const priorityColorMap: Record<string, string> = {
    'low': '#8E8E93',
    'normal': '#007AFF',
    'high': '#FF9500',
    'urgent': '#FF3B30',
  };
  
  return priorityColorMap[priority] || '#007AFF';
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
export type { 
  Notification, 
  NotificationPreference, 
  NotificationCount, 
  DeviceToken 
};

export default notificationService;