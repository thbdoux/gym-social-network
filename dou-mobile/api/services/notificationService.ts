// api/services/notificationService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

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
}

interface NotificationCount {
  unread: number;
  unseen: number;
  total: number;
}

/**
 * Service for notification API operations
 */
const notificationService = {
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
  }
};

export default notificationService;