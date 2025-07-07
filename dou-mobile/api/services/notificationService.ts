// api/services/notificationService.ts (UPDATED)
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

// Enhanced notification interface matching backend
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
  
  // Enhanced notification type support
  notification_type: 
    // Post interactions
    | 'like' | 'comment' | 'comment_reply' | 'mention' | 'post_reaction' | 'comment_reaction' | 'share'
    // Social interactions
    | 'friend_request' | 'friend_accept'
    // Program interactions
    | 'program_fork' | 'program_shared' | 'program_liked' | 'program_used'
    // Template interactions
    | 'template_used' | 'template_forked'
    // Workout milestones and achievements
    | 'workout_milestone' | 'goal_achieved' | 'streak_milestone' | 'personal_record'
    // Group workout interactions
    | 'workout_invitation' | 'workout_join' | 'workout_join_request' 
    | 'workout_request_approved' | 'workout_request_rejected' | 'workout_cancelled' 
    | 'workout_removed' | 'workout_completed' | 'workout_reminder'
    // Group workout messages and proposals
    | 'group_workout_message' | 'workout_proposal_submitted' | 'workout_proposal_voted' | 'workout_proposal_selected'
    // Workout partnerships
    | 'workout_partner_added' | 'workout_partner_request'
    // System notifications
    | 'gym_announcement' | 'system_update' | 'challenge_invitation' | 'challenge_completed'
    | 'test';
  
  // Translation support (enhanced)
  title_key: string;
  body_key: string;
  translation_params: Record<string, any>;
  
  // Client-side translated content (computed)
  translated_title?: string;
  translated_body?: string;
  
  // Fallback content for backwards compatibility
  content: string;
  
  // Generic relation fields
  content_type?: string;
  object_id?: number;
  related_object_info?: {
    type: string;
    id: number;
    title?: string;
    name?: string;
    preview?: string;
    url?: string;
  };
  
  // Additional metadata
  metadata: Record<string, any>;
  
  // Status fields
  is_read: boolean;
  is_seen: boolean;
  created_at: string;
  
  // Priority and timing
  priority: 'low' | 'normal' | 'high' | 'urgent';
  time_ago?: string;
  is_recent?: boolean;
  
  // Available actions
  available_actions?: string[];
}

// Enhanced notification preferences with new types
interface NotificationPreference {
  // Email notification preferences
  email_likes: boolean;
  email_comments: boolean;
  email_shares: boolean;
  email_mentions: boolean;
  email_post_reactions: boolean;
  email_comment_reactions: boolean;
  email_friend_requests: boolean;
  email_program_activities: boolean;
  email_workout_milestones: boolean;
  email_goal_achieved: boolean;
  email_group_workouts: boolean;
  email_workout_reminders: boolean;
  email_group_workout_messages: boolean;
  email_gym_announcements: boolean;
  
  // Push notification preferences
  push_likes: boolean;
  push_comments: boolean;
  push_shares: boolean;
  push_mentions: boolean;
  push_post_reactions: boolean;
  push_comment_reactions: boolean;
  push_friend_requests: boolean;
  push_program_activities: boolean;
  push_workout_milestones: boolean;
  push_goal_achieved: boolean;
  push_group_workouts: boolean;
  push_workout_reminders: boolean;
  push_group_workout_messages: boolean;
  push_gym_announcements: boolean;
  
  // Global settings
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  
  // Advanced settings
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  digest_frequency: 'never' | 'daily' | 'weekly';
  group_notifications: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  notification_language: 'en' | 'fr' | 'es' | 'de' | 'it';
  
  // Computed fields
  all_push_enabled?: boolean;
  all_email_enabled?: boolean;
  social_push_enabled?: boolean;
  social_email_enabled?: boolean;
  workout_push_enabled?: boolean;
  workout_email_enabled?: boolean;
}

// Enhanced notification count with detailed breakdown
interface NotificationCount {
  unread: number;
  unseen: number;
  total: number;
  recent_24h: number;
  by_type: Record<string, { total: number; unread: number }>;
  by_priority: Record<string, { total: number; unread: number }>;
}

// Enhanced device token with additional info
interface DeviceToken {
  id?: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
  locale?: string;
  device_info?: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  token_preview?: string;
  days_since_registered?: number;
}

// Notification analytics interface
interface NotificationAnalytics {
  period_days: number;
  total_notifications: number;
  read_notifications: number;
  read_rate_percent: number;
  by_type: Array<{ notification_type: string; count: number }>;
  daily_activity: Array<{ date: string; count: number }>;
  avg_response_time_hours: number;
  most_active_day?: string;
}

/**
 * Enhanced notification service with comprehensive backend integration
 */
const notificationService = {
  // ============== CORE NOTIFICATION METHODS ==============
  
  /**
   * Get notifications with enhanced filtering
   */
  getNotifications: async (params?: {
    type?: string;
    is_read?: boolean;
    priority?: string;
    since?: string;
    limit?: number;
  }): Promise<Notification[]> => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.is_read !== undefined) queryParams.append('is_read', params.is_read.toString());
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.since) queryParams.append('since', params.since);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/notifications/notifications/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(url);
    return extractData(response);
  },

  /**
   * Get unread notifications
   */
  getUnreadNotifications: async (params?: { type?: string }): Promise<Notification[]> => {
    const queryParams = params?.type ? `?type=${params.type}` : '';
    const response = await apiClient.get(`/notifications/notifications/unread/${queryParams}`);
    return extractData(response);
  },

  /**
   * Get notifications grouped by type
   */
  getNotificationsByType: async (): Promise<Record<string, Notification[]>> => {
    const response = await apiClient.get('/notifications/notifications/by_type/');
    return response.data;
  },

  /**
   * Get enhanced notification count with breakdown
   */
  getNotificationCount: async (): Promise<NotificationCount> => {
    const response = await apiClient.get('/notifications/notifications/count/');
    return response.data;
  },

  /**
   * Get notification summary and analytics
   */
  getNotificationSummary: async (): Promise<any> => {
    const response = await apiClient.get('/notifications/notifications/summary/');
    return response.data;
  },

  /**
   * Mark specific notification as read
   */
  markAsRead: async (notificationId: number): Promise<any> => {
    const response = await apiClient.post(`/notifications/notifications/${notificationId}/mark_read/`);
    return response.data;
  },

  /**
   * Mark notifications as seen (batch)
   */
  markAsSeen: async (notificationIds?: number[]): Promise<any> => {
    const response = await apiClient.post('/notifications/notifications/mark_seen/', {
      notification_ids: notificationIds
    });
    return response.data;
  },

  /**
   * Mark all notifications as read with optional type filter
   */
  markAllAsRead: async (type?: string): Promise<any> => {
    const response = await apiClient.post('/notifications/notifications/mark_all_read/', {
      type
    });
    return response.data;
  },

  /**
   * Clear old read notifications
   */
  clearOldNotifications: async (olderThanDays: number = 30): Promise<any> => {
    const response = await apiClient.delete(`/notifications/notifications/clear_old/?older_than_days=${olderThanDays}`);
    return response.data;
  },

  // ============== PREFERENCES MANAGEMENT ==============
  
  /**
   * Get user notification preferences
   */
  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await apiClient.get('/notifications/preferences/');
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (preferences: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const response = await apiClient.patch('/notifications/preferences/', preferences);
    return response.data;
  },

  /**
   * Bulk update preference categories
   */
  bulkUpdatePreferences: async (categories: Record<string, boolean>): Promise<NotificationPreference> => {
    const response = await apiClient.post('/notifications/preferences/bulk_update/', {
      categories
    });
    return response.data;
  },

  /**
   * Get preference categories info
   */
  getPreferenceCategories: async (): Promise<any> => {
    const response = await apiClient.get('/notifications/preferences/categories/');
    return response.data;
  },

  // ============== DEVICE TOKEN MANAGEMENT ==============
  
  /**
   * Register device token with enhanced info
   */
  registerDeviceToken: async (
    token: string, 
    platform: 'ios' | 'android' | 'web',
    locale?: string,
    deviceInfo?: Record<string, any>
  ): Promise<any> => {
    try {
      if (!isValidExpoPushToken(token)) {
        throw new Error('Invalid Expo push token format');
      }

      const payload: any = {
        token,
        platform,
        locale: locale || 'en',
        device_info: deviceInfo || {}
      };

      const response = await apiClient.post('/notifications/device-tokens/register/', payload);
      console.log('✅ Device token registered successfully');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 400 && 
          error?.response?.data?.error?.includes('already exists')) {
        console.log('✅ Device token already registered (OK)');
        return { message: 'Token already registered' };
      }
      console.error('❌ Error registering device token:', error);
      throw error;
    }
  },

  /**
   * Unregister device token
   */
  unregisterDeviceToken: async (token: string): Promise<any> => {
    try {
      const response = await apiClient.post('/notifications/device-tokens/unregister/', { token });
      console.log('✅ Device token unregistered successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error unregistering device token:', error);
      throw error;
    }
  },

  /**
   * List user's device tokens
   */
  listDeviceTokens: async (): Promise<DeviceToken[]> => {
    try {
      const response = await apiClient.get('/notifications/device-tokens/list_devices/');
      return response.data.devices || [];
    } catch (error) {
      console.error('❌ Error listing device tokens:', error);
      throw error;
    }
  },

  /**
   * Update device token locale
   */
  updateDeviceLocale: async (token: string, locale: string): Promise<any> => {
    const response = await apiClient.post('/notifications/device-tokens/update_locale/', {
      token,
      locale
    });
    return response.data;
  },

  /**
   * Send test notification
   */
  sendTestNotification: async (deviceId?: number, message?: string): Promise<any> => {
    try {
      const payload: any = {};
      if (deviceId) payload.device_id = deviceId;
      if (message) payload.message = message;
      
      const response = await apiClient.post('/notifications/device-tokens/test_notification/', payload);
      console.log('🧪 Test notification sent successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  },

  // ============== ANALYTICS ==============
  
  /**
   * Get notification analytics
   */
  getAnalytics: async (days: number = 30): Promise<NotificationAnalytics> => {
    const response = await apiClient.get(`/notifications/analytics/?days=${days}`);
    return response.data;
  },

  // ============== LEGACY COMPATIBILITY ==============
  
  getNotificationPreferences: async (): Promise<NotificationPreference> => {
    return notificationService.getPreferences();
  },

  updateNotificationPreferences: async (preferences: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    return notificationService.updatePreferences(preferences);
  }
};

/**
 * Enhanced Expo push token validation
 */
const isValidExpoPushToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  return (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) && token.endsWith(']');
};

/**
 * Enhanced translation helper with fallback support
 */
export const translateNotification = (
  titleKey: string,
  bodyKey: string,
  params: Record<string, any>,
  t: (key: string, params?: Record<string, any>) => string
): { title: string; body: string } => {
  try {
    const title = t(titleKey, params);
    const body = t(bodyKey, params);
    
    // Check if translation actually worked (not returning the key)
    const titleTranslated = title !== titleKey ? title : generateFallbackTitle(titleKey, params, t);
    const bodyTranslated = body !== bodyKey ? body : generateFallbackBody(bodyKey, params, t);
    
    return {
      title: titleTranslated,
      body: bodyTranslated,
    };
  } catch (error) {
    console.warn('Translation failed:', error);
    return generateFallbackNotification(titleKey, params, t);
  }
};

/**
 * Generate fallback title when translation fails
 */
const generateFallbackTitle = (
  titleKey: string,
  params: Record<string, any>,
  t: (key: string, params?: Record<string, any>) => string
): string => {
  const notificationType = titleKey.split('.')[1] || 'notification';
  const username = params.sender_display_name || params.sender_username || t('anonymous');
  
  const fallbacks: Record<string, string> = {
    'like': `👍 ${username} liked your post`,
    'comment': `💬 ${username} commented`,
    'comment_reply': `↪️ ${username} replied`,
    'mention': `📣 ${username} mentioned you`,
    'friend_request': `👥 Friend request from ${username}`,
    'workout_milestone': `🏆 Milestone achieved!`,
    'group_workout_message': `💬 New message from ${username}`,
  };
  
  return fallbacks[notificationType] || `🔔 ${t('new_notification')}`;
};

/**
 * Generate fallback body when translation fails
 */
const generateFallbackBody = (
  bodyKey: string,
  params: Record<string, any>,
  t: (key: string, params?: Record<string, any>) => string
): string => {
  const notificationType = bodyKey.split('.')[1] || 'notification';
  const username = params.sender_display_name || params.sender_username || t('anonymous');
  
  switch (notificationType) {
    case 'like':
      return `${username} liked your post`;
    case 'comment':
      return `${username} commented on your post`;
    case 'comment_reply':
      return `${username} replied to your comment`;
    case 'mention':
      return `${username} mentioned you in a comment`;
    case 'friend_request':
      return `${username} sent you a friend request`;
    case 'workout_milestone':
      return `You've completed ${params.workout_count || 0} workouts!`;
    case 'group_workout_message':
      return `${username} sent a message in the workout chat`;
    default:
      return `${username} ${notificationType.replace(/_/g, ' ')}`;
  }
};

/**
 * Generate complete fallback notification
 */
const generateFallbackNotification = (
  titleKey: string,
  params: Record<string, any>,
  t: (key: string, params?: Record<string, any>) => string
): { title: string; body: string } => {
  const title = generateFallbackTitle(titleKey, params, t);
  const body = generateFallbackBody(titleKey.replace('title', 'body'), params, t);
  
  return { title, body };
};

/**
 * Get notification display text for specific field
 */
export const getNotificationText = (
  notificationType: string,
  field: 'title' | 'body' | 'push_title' | 'push_body' | 'email_subject' | 'email_body',
  params: Record<string, any>,
  t: (key: string, params?: Record<string, any>) => string
): string => {
  const key = `notifications.${notificationType}.${field}`;
  
  try {
    const result = t(key, params);
    
    // If translation didn't work (returned the key), generate fallback
    if (result === key) {
      if (field.includes('title') || field.includes('subject')) {
        return generateFallbackTitle(key, params, t);
      } else {
        return generateFallbackBody(key, params, t);
      }
    }
    
    return result;
  } catch (error) {
    console.warn(`Translation failed for ${key}:`, error);
    return field.includes('title') || field.includes('subject') 
      ? generateFallbackTitle(key, params, t)
      : generateFallbackBody(key, params, t);
  }
};

/**
 * Enhanced notification icon mapping with new types
 */
export const getNotificationIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    // Post interactions
    'like': 'heart',
    'comment': 'chatbubble',
    'comment_reply': 'return-up-forward',
    'mention': 'at',
    'post_reaction': 'happy',
    'comment_reaction': 'thumbs-up',
    'share': 'share-social',
    
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
    
    // Group workout messages and proposals
    'group_workout_message': 'chatbubbles',
    'workout_proposal_submitted': 'bulb',
    'workout_proposal_voted': 'thumbs-up',
    'workout_proposal_selected': 'checkmark-done',
    
    // Workout partnerships
    'workout_partner_added': 'people',
    'workout_partner_request': 'person-add',
    
    // System notifications
    'gym_announcement': 'megaphone',
    'system_update': 'settings',
    'challenge_invitation': 'trophy',
    'challenge_completed': 'ribbon',
    'test': 'flask',
  };
  
  return iconMap[type] || 'notifications';
};

/**
 * Enhanced notification color mapping with new types
 */
export const getNotificationColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    // Post interactions
    'like': '#FF3B30',
    'comment': '#007AFF',
    'comment_reply': '#5856D6',
    'mention': '#FF9500',
    'post_reaction': '#FF3B30',
    'comment_reaction': '#007AFF',
    'share': '#AF52DE',
    
    // Social interactions
    'friend_request': '#34C759',
    'friend_accept': '#34C759',
    
    // Program interactions
    'program_fork': '#5856D6',
    'program_shared': '#007AFF',
    'program_liked': '#FF3B30',
    'program_used': '#34C759',
    
    // Template interactions
    'template_used': '#007AFF',
    'template_forked': '#5856D6',
    
    // Achievements
    'workout_milestone': '#FFD700',
    'goal_achieved': '#FFD700',
    'streak_milestone': '#FF6B35',
    'personal_record': '#32D74B',
    
    // Group workouts
    'workout_invitation': '#007AFF',
    'workout_join': '#34C759',
    'workout_join_request': '#FF9500',
    'workout_request_approved': '#34C759',
    'workout_request_rejected': '#FF3B30',
    'workout_cancelled': '#FF3B30',
    'workout_removed': '#FF3B30',
    'workout_completed': '#5AC8FA',
    'workout_reminder': '#FF9500',
    
    // Messages and proposals
    'group_workout_message': '#007AFF',
    'workout_proposal_submitted': '#5856D6',
    'workout_proposal_voted': '#34C759',
    'workout_proposal_selected': '#FFD700',
    
    // Partnerships
    'workout_partner_added': '#34C759',
    'workout_partner_request': '#007AFF',
    
    // System
    'gym_announcement': '#FF9500',
    'system_update': '#5856D6',
    'challenge_invitation': '#FFD700',
    'challenge_completed': '#32D74B',
    'test': '#8E8E93',
  };
  
  return colorMap[type] || '#007AFF';
};

/**
 * Get notification priority color
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
 * Navigation helper for notifications
 */
export const getNotificationNavigation = (notification: Notification): string => {
  const { notification_type, object_id, metadata } = notification;
  const senderId = notification.sender?.id;
  
  switch (notification_type) {
    case 'like':
    case 'comment':
    case 'comment_reply':
    case 'share':
    case 'mention':
    case 'post_reaction':
    case 'comment_reaction':
      return object_id ? `/post/${object_id}` : '/notifications';
    
    case 'friend_request':
    case 'friend_accept':
      return senderId ? `/user/${senderId}` : '/friends';
    
    case 'program_fork':
    case 'program_shared':
    case 'program_liked':
    case 'program_used':
      return object_id ? `/program/${object_id}` : '/programs';
    
    case 'template_used':
    case 'template_forked':
      return object_id ? `/template/${object_id}` : '/templates';
    
    case 'workout_milestone':
    case 'goal_achieved':
    case 'streak_milestone':
    case 'personal_record':
      return object_id ? `/workout-log/${object_id}` : '/workouts';
    
    case 'workout_invitation':
    case 'workout_join':
    case 'workout_join_request':
    case 'workout_request_approved':
    case 'workout_request_rejected':
    case 'workout_cancelled':
    case 'workout_removed':
    case 'workout_completed':
    case 'workout_reminder':
    case 'group_workout_message':
    case 'workout_proposal_submitted':
    case 'workout_proposal_voted':
    case 'workout_proposal_selected':
      return object_id ? `/group-workout/${object_id}` : '/group-workouts';
    
    case 'workout_partner_added':
    case 'workout_partner_request':
      return object_id ? `/workout-log/${object_id}` : '/workouts';
    
    case 'gym_announcement':
      return metadata?.gym_id ? `/gym/${metadata.gym_id}` : '/gyms';
    
    case 'system_update':
      return '/settings';
    
    case 'challenge_invitation':
    case 'challenge_completed':
      return object_id ? `/challenge/${object_id}` : '/challenges';
    
    default:
      return '/notifications';
  }
};

/**
 * Check if notification has actionable buttons
 */
export const hasNotificationActions = (notification: Notification): boolean => {
  return notification.available_actions && notification.available_actions.length > 0 ||
    (notification.notification_type === 'friend_request' || 
     notification.notification_type === 'workout_invitation' ||
     notification.notification_type === 'workout_join_request') && 
    !notification.is_read;
};

/**
 * Utility function to test if current environment supports push notifications
 */
export const canUsePushNotifications = (): boolean => {
  return true; // Expo handles device checking internally
};

/**
 * Helper function to get notification settings URL for the device
 */
export const getNotificationSettingsInfo = () => {
  return {
    message: "To receive push notifications, please enable them in your device settings.",
    ios: "Go to Settings > Notifications > Your App and enable notifications",
    android: "Go to Settings > Apps > Your App > Notifications and enable notifications"
  };
};

// Export types for use in other files
export type { 
  Notification, 
  NotificationPreference, 
  NotificationCount, 
  DeviceToken,
  NotificationAnalytics
};

export default notificationService;