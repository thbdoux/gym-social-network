// context/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from './LanguageContext';
import { useNotificationCount } from '../hooks/query/useNotificationQuery';
import notificationService, { 
  type Notification, 
  type NotificationPreference,
  translateNotification 
} from '../api/services/notificationService';

interface NotificationContextType {
  // Socket connection status
  isSocketConnected: boolean;
  socketError: string | null;
  
  // Push notification status
  isPushEnabled: boolean;
  pushToken?: string;
  pushError?: Error;
  
  // Notification counts
  unreadCount: number;
  unseenCount: number;
  totalCount: number;
  
  // Actions
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  testPushNotification: () => Promise<void>;
  reconnectSocket: () => void;
  
  // Preferences
  preferences?: NotificationPreference;
  updatePreferences: (prefs: Partial<NotificationPreference>) => Promise<void>;
  
  // Latest notification
  latestNotification?: Notification;
  
  // Utility functions
  translateNotificationContent: (notification: Notification) => { title: string; body: string };
  getNotificationDisplayText: (notification: Notification) => string;
}

const NotificationContext = createContext<NotificationContextType>({
  isSocketConnected: false,
  socketError: null,
  isPushEnabled: false,
  unreadCount: 0,
  unseenCount: 0,
  totalCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  testPushNotification: async () => {},
  reconnectSocket: () => {},
  updatePreferences: async () => {},
  translateNotificationContent: () => ({ title: '', body: '' }),
  getNotificationDisplayText: () => '',
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  // Socket connection
  const { 
    isConnected: isSocketConnected, 
    error: socketError,
    markAsRead: socketMarkAsRead, 
    markAllAsRead: socketMarkAllAsRead,
    reconnect: reconnectSocket,
    lastMessage
  } = useNotificationSocket();
  
  // Push notifications
  const { 
    expoPushToken: pushToken, 
    error: pushError, 
    isRegistered: isPushEnabled,
    notification: latestPushNotification
  } = usePushNotifications();
  
  // Notification counts
  const { data: countData } = useNotificationCount();
  
  // Local state
  const [preferences, setPreferences] = useState<NotificationPreference>();
  const [latestNotification, setLatestNotification] = useState<Notification>();

  // Load user preferences
  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    }
  }, [isAuthenticated]);

  // Handle latest WebSocket message
  useEffect(() => {
    if (lastMessage?.type === 'notification_message' && lastMessage.notification) {
      setLatestNotification(lastMessage.notification);
    }
  }, [lastMessage]);

  // Handle latest push notification
  useEffect(() => {
    if (latestPushNotification) {
      // Extract notification data from push notification
      const data = latestPushNotification.request.content.data;
      if (data && data.notification_id) {
        // This could trigger a refresh of the notification list
        console.log('📱 Push notification received:', data);
      }
    }
  }, [latestPushNotification]);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreference>) => {
    try {
      const updatedPrefs = await notificationService.updatePreferences(newPrefs);
      setPreferences(updatedPrefs);
      console.log('✅ Notification preferences updated');
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      throw error;
    }
  }, []);

  const testPushNotification = useCallback(async () => {
    try {
      await notificationService.sendTestNotification();
      console.log('🧪 Test notification sent');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }, []);

  // Enhanced translation function
  const translateNotificationContent = useCallback((notification: Notification) => {
    // Use translation keys if available
    if (notification.title_key && notification.body_key) {
      return translateNotification(
        notification.title_key,
        notification.body_key,
        notification.translation_params || {},
        t
      );
    }
    
    // Fallback to content or generate from type
    const fallbackTitle = t(`notification.${notification.notification_type}.title`, 
      notification.translation_params || {});
    const fallbackBody = notification.content || 
      t(`notification.${notification.notification_type}.body`, 
        notification.translation_params || {});
    
    return {
      title: fallbackTitle,
      body: fallbackBody,
    };
  }, [t]);

  // Get display text for a notification
  const getNotificationDisplayText = useCallback((notification: Notification) => {
    const { body } = translateNotificationContent(notification);
    
    // If we have translation params, try to interpolate
    if (notification.translation_params) {
      const params = notification.translation_params;
      const username = params.sender_display_name || 
                      params.sender_username || 
                      notification.sender?.username || 
                      t('anonymous');
      
      // Generate contextual content based on notification type
      switch (notification.notification_type) {
        case 'like':
          return t('notification.like.text', { username });
        case 'comment':
          return t('notification.comment.text', { 
            username, 
            content: params.comment_content || ''
          });
        case 'share':
          return t('notification.share.text', { username });
        case 'friend_request':
          return t('notification.friend_request.text', { username });
        case 'friend_accept':
          return t('notification.friend_accept.text', { username });
        case 'program_fork':
          return t('notification.program_fork.text', { 
            username, 
            program_name: params.forked_program_name || params.program_name || ''
          });
        case 'workout_milestone':
          return t('notification.workout_milestone.text', { 
            workout_count: params.workout_count || params.milestone || ''
          });
        case 'goal_achieved':
          return t('notification.goal_achieved.text', {
            goal_name: params.goal_name || ''
          });
        case 'streak_milestone':
          return t('notification.streak_milestone.text', {
            streak_days: params.streak_days || ''
          });
        case 'personal_record':
          return t('notification.personal_record.text', {
            exercise_name: params.exercise_name || '',
            new_weight: params.new_weight || '',
            weight_unit: params.weight_unit || 'lbs'
          });
        case 'workout_invitation':
          return t('notification.workout_invitation.text', {
            username,
            workout_title: params.workout_title || ''
          });
        case 'workout_join':
          return t('notification.workout_join.text', {
            username,
            workout_title: params.workout_title || ''
          });
        case 'workout_cancelled':
          return t('notification.workout_cancelled.text', {
            username,
            workout_title: params.workout_title || ''
          });
        case 'workout_completed':
          return t('notification.workout_completed.text', {
            username,
            workout_title: params.workout_title || ''
          });
        default:
          return body;
      }
    }
    
    return body;
  }, [translateNotificationContent, t]);

  // Enhanced mark as read with optimistic updates
  const markAsRead = useCallback((notificationId: number) => {
    socketMarkAsRead(notificationId);
  }, [socketMarkAsRead]);

  // Enhanced mark all as read
  const markAllAsRead = useCallback(() => {
    socketMarkAllAsRead();
  }, [socketMarkAllAsRead]);

  const contextValue: NotificationContextType = {
    // Connection status
    isSocketConnected,
    socketError,
    
    // Push notifications
    isPushEnabled,
    pushToken,
    pushError,
    
    // Counts
    unreadCount: countData?.unread || 0,
    unseenCount: countData?.unseen || 0,
    totalCount: countData?.total || 0,
    
    // Actions
    markAsRead,
    markAllAsRead,
    testPushNotification,
    reconnectSocket,
    
    // Preferences
    preferences,
    updatePreferences,
    
    // Latest notification
    latestNotification,
    
    // Utility functions
    translateNotificationContent,
    getNotificationDisplayText,
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};