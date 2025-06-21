// app/(app)/notifications.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { runOnJS } from 'react-native-reanimated';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  SafeAreaView,
  SectionList
} from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming, interpolate } from 'react-native-reanimated';
import { 
  useNotifications, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead,
  useNotificationCount,
  useRefreshNotifications
} from '../../hooks/query/useNotificationQuery';
import { useRealTimeNotifications, useNotificationRefresh } from '../../hooks/useRealTimeNotifications'; // NEW: Import real-time hooks
import { useUser } from '../../hooks/query/useUserQuery';
import { usePost } from '../../hooks/query/usePostQuery';
import { groupWorkoutService } from '../../api/services';
import { useGroupWorkoutJoinRequests } from '../../hooks/query/useGroupWorkoutQuery';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { router, useNavigation } from 'expo-router';
import { formatDistanceToNow, isToday, isYesterday, differenceInDays } from 'date-fns';
import { Image } from 'expo-image';
import { useLanguage } from '../../context/LanguageContext';
import { getAvatarUrl } from '../../utils/imageUtils';
import userService from '../../api/services/userService';
import { 
  getNotificationIcon, 
  getNotificationColor, 
  getPriorityColor,
  translateNotification,
  type Notification 
} from '../../api/services/notificationService';

// Enhanced content preview component with better type handling
const ContentPreview = ({ notification, postData }) => {
  const { palette, workoutPalette, programPalette, workoutLogPalette, programWorkoutPalette, groupWorkoutPalette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  // Get appropriate palette based on notification type or post type
  const getContentPalette = (type) => {
    switch (type) {
      case 'workout':
      case 'workout_invitation':
      case 'workout_reminder':
        return workoutPalette;
      case 'program':
      case 'program_fork':
      case 'program_shared':
      case 'program_liked':
      case 'program_used':
        return programPalette;
      case 'workout_log':
      case 'workout_milestone':
      case 'personal_record':
      case 'streak_milestone':
        return workoutLogPalette;
      case 'program_workout':
        return programWorkoutPalette;
      case 'group_workout':
      case 'workout_join':
      case 'workout_join_request':
      case 'workout_request_approved':
      case 'workout_request_rejected':
        return groupWorkoutPalette;
      default:
        return null;
    }
  };
  
  // Enhanced icon mapping
  const getContentIcon = (type) => {
    const iconMap = {
      'workout': 'barbell',
      'program': 'calendar',
      'workout_log': 'clipboard',
      'program_workout': 'fitness',
      'group_workout': 'people',
      'workout_invitation': 'fitness',
      'workout_join': 'log-in',
      'workout_join_request': 'enter',
      'workout_request_approved': 'checkmark-circle',
      'workout_request_rejected': 'close-circle',
      'workout_cancelled': 'calendar-outline',
      'workout_completed': 'checkmark-done-circle',
      'workout_milestone': 'trophy',
      'goal_achieved': 'flag',
      'streak_milestone': 'flame',
      'personal_record': 'medal',
      'friend_request': 'person-add',
      'friend_accept': 'people',
      'program_fork': 'git-branch',
      'template_used': 'document',
      'gym_announcement': 'business',
      'system_update': 'settings',
      'challenge_invitation': 'trophy',
      'challenge_completed': 'ribbon',
    };
    
    return iconMap[type] || 'document-text';
  };
  
  // Handle different notification types with enhanced preview logic
  switch (notification.notification_type) {
    case 'like':
    case 'comment':
    case 'share':
    case 'mention':
      // Post preview with media support
      if (postData?.media && postData.media.length > 0) {
        return (
          <View style={styles.contentPreview}>
            <Image 
              source={{ uri: postData.media[0].url }} 
              style={styles.previewImage} 
            />
          </View>
        );
      } else if (notification.metadata?.post_preview?.image) {
        return (
          <View style={styles.contentPreview}>
            <Image 
              source={{ uri: notification.metadata.post_preview.image }} 
              style={styles.previewImage} 
            />
          </View>
        );
      } else if (postData?.post_type || notification.metadata?.post_type) {
        const contentType = postData?.post_type || notification.metadata?.post_type;
        const contentPalette = getContentPalette(contentType);
        
        if (contentPalette) {
          return (
            <View style={[
              styles.contentPreview,
              { backgroundColor: contentPalette.background }
            ]}>
              <View style={styles.typeIconContainer}>
                <Ionicons 
                  name={getContentIcon(contentType)} 
                  size={22} 
                  color={contentPalette.highlight} 
                />
              </View>
            </View>
          );
        }
      }
      
      // Default text post preview
      return (
        <View style={styles.contentPreview}>
          <View style={styles.postIconContainer}>
            <Ionicons name="document-text" size={20} color={palette.text} />
          </View>
        </View>
      );

    case 'friend_request':
    case 'friend_accept':
      return (
        <View style={styles.contentPreview}>
          <View style={styles.profileIconContainer}>
            <Ionicons name="person" size={20} color={getNotificationColor(notification.notification_type)} />
          </View>
        </View>
      );

    // Program-related notifications
    case 'program_fork':
    case 'program_shared':
    case 'program_liked':
    case 'program_used':
      return (
        <View style={[
          styles.contentPreview,
          { backgroundColor: programPalette.background }
        ]}>
          <View style={styles.programIconContainer}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={20} 
              color={programPalette.highlight} 
            />
          </View>
        </View>
      );

    // Template-related notifications
    case 'template_used':
    case 'template_forked':
      return (
        <View style={[
          styles.contentPreview,
          { backgroundColor: programPalette.background }
        ]}>
          <View style={styles.programIconContainer}>
            <Ionicons name="document" size={20} color={programPalette.highlight} />
          </View>
        </View>
      );

    // Achievement notifications
    case 'workout_milestone':
    case 'goal_achieved':
    case 'streak_milestone':
    case 'personal_record':
      return (
        <View style={[
          styles.contentPreview,
          { backgroundColor: workoutLogPalette.background }
        ]}>
          <View style={styles.achievementIconContainer}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={20} 
              color={workoutLogPalette.highlight} 
            />
          </View>
        </View>
      );

    // Group workout notifications
    case 'workout_invitation':
    case 'workout_join':
    case 'workout_join_request':
    case 'workout_request_approved':
    case 'workout_request_rejected':
    case 'workout_cancelled':
    case 'workout_removed':
    case 'workout_completed':
    case 'workout_reminder':
    case 'workout_proposal_submitted':
    case 'workout_proposal_voted':
    case 'workout_proposal_selected':
      const workoutPaletteToUse = notification.notification_type.includes('proposal') 
        ? workoutPalette 
        : groupWorkoutPalette;
      
      return (
        <View style={[
          styles.contentPreview,
          { backgroundColor: workoutPaletteToUse.background }
        ]}>
          <View style={styles.typeIconContainer}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={22} 
              color={workoutPaletteToUse.highlight} 
            />
          </View>
        </View>
      );

    // Workout partnership notifications
    case 'workout_partner_added':
    case 'workout_partner_request':
      return (
        <View style={[
          styles.contentPreview,
          { backgroundColor: groupWorkoutPalette.background }
        ]}>
          <View style={styles.typeIconContainer}>
            <Ionicons name="people" size={22} color={groupWorkoutPalette.highlight} />
          </View>
        </View>
      );

    // System notifications
    case 'gym_announcement':
    case 'system_update':
      return (
        <View style={styles.contentPreview}>
          <View style={styles.gymIconContainer}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={20} 
              color={getNotificationColor(notification.notification_type)} 
            />
          </View>
        </View>
      );

    // Challenge notifications
    case 'challenge_invitation':
    case 'challenge_completed':
      return (
        <View style={[
          styles.contentPreview,
          { backgroundColor: workoutLogPalette.background }
        ]}>
          <View style={styles.achievementIconContainer}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={20} 
              color={workoutLogPalette.highlight} 
            />
          </View>
        </View>
      );
    
    default:
      return null;
  }
};

// Fixed NotificationItem component with memoization to prevent infinite loops

// Enhanced notification item with translation key support - FIXED VERSION
const NotificationItem = React.memo(({ notification, onMarkAsRead }: { notification: Notification, onMarkAsRead: (id: number) => void }) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  // Fetch additional data with stable keys
  const { data: userData } = useUser(notification.sender?.id);
  const shouldFetchPost = notification.object_id && 
    ['like', 'comment', 'share', 'mention'].includes(notification.notification_type);
  const { data: postData } = usePost(shouldFetchPost ? notification.object_id : null);
  
  // Check if notification has actions
  const hasActions = useMemo(() => 
    (notification.notification_type === 'friend_request' || 
     notification.notification_type === 'workout_invitation' ||
     notification.notification_type === 'workout_join_request') && 
    !notification.is_read,
    [notification.notification_type, notification.is_read]
  );
  
  // Memoize the notification content to prevent infinite re-renders
  const notificationContent = useMemo(() => {
    // Use translation keys if available
    if (notification.title_key && notification.body_key) {
      const translated = translateNotification(
        notification.title_key,
        notification.body_key,
        notification.translation_params || {},
        t
      );
      return translated.body; // Use body for the main text
    }
    
    // Fallback to content
    if (notification.content) {
      return notification.content;
    }
    
    // Generate content from translation params using flattened structure
    const params = notification.translation_params || {};
    const username = params.sender_display_name || params.sender_username || notification?.sender_username || t('anonymous');
    
    // Use flattened translation key structure
    try {
      const translationKey = `notifications.${notification.notification_type}.body`;
      const translatedText = t(translationKey, {
        username,
        sender_display_name: username, // Ensure this param is always available
        ...params
      });
      
      // With flattened structure, t() should return a string directly
      if (typeof translatedText === 'string') {
        return translatedText;
      }
      
      // Fallback if translation key doesn't exist
      return `${username} ${notification.notification_type.replace(/_/g, ' ')}`;
    } catch (error) {
      // Fallback to a simple message if translation fails
      console.warn('Translation failed for notification:', notification.notification_type, error);
      return `${username} ${notification.notification_type.replace(/_/g, ' ')}`;
    }
  }, [notification.title_key, notification.body_key, notification.translation_params, notification.content, notification.notification_type, notification.sender_username, t]);

  // Handle navigation logic - memoized to prevent recreating on each render
  const handlePress = useCallback(() => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
      setTimeout(() => {
        navigateToContent();
      }, 100);
    } else {
      navigateToContent();
    }
  }, [notification.is_read, notification.id, onMarkAsRead]);
  
  const navigateToContent = useCallback(() => {
    if (hasActions) return; // Don't navigate if there are actions to handle
    
    // Enhanced navigation logic
    const { notification_type, object_id, metadata } = notification;
    const senderId = notification.sender?.id;
    
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
          if (senderId) {
            router.push(`/user/${senderId}`);
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
        
        case 'template_used':
        case 'template_forked':
          if (object_id) router.push(`/template/${object_id}`);
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
        case 'workout_proposal_submitted':
        case 'workout_proposal_voted':
        case 'workout_proposal_selected':
          if (object_id) router.push(`/group-workout/${object_id}`);
          break;
        
        case 'workout_partner_added':
        case 'workout_partner_request':
          if (object_id) router.push(`/workout-log/${object_id}`);
          break;
        
        case 'gym_announcement':
          if (metadata?.gym_id) {
            router.push(`/gym/${metadata.gym_id}`);
          } else {
            router.push('/gyms');
          }
          break;
        
        case 'system_update':
          router.push('/settings');
          break;
        
        case 'challenge_invitation':
        case 'challenge_completed':
          if (object_id) {
            router.push(`/challenge/${object_id}`);
          } else {
            router.push('/challenges');
          }
          break;
        
        default:
          router.push('/notifications');
          break;
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
      router.push('/notifications');
    }
  }, [hasActions, notification]);
  
  // Enhanced action handlers - memoized
  const handleAccept = useCallback(async () => {
    onMarkAsRead(notification.id);
    
    const { notification_type, object_id } = notification;
    const senderId = notification.sender?.id;
    
    try {
      switch (notification_type) {
        case 'friend_request':
          if (senderId) {
            await userService.respondToFriendRequest(senderId, 'accept');
            setTimeout(() => router.push(`/user/${senderId}`), 300);
          }
          break;
        
        case 'workout_invitation':
          if (object_id) {
            await groupWorkoutService.joinGroupWorkout(object_id);
            setTimeout(() => router.push(`/group-workout/${object_id}`), 300);
          }
          break;
        
        case 'workout_join_request':
          if (object_id && senderId) {
            await groupWorkoutService.approveGroupWorkoutRequest(object_id, senderId);
            setTimeout(() => router.push(`/group-workout/${object_id}`), 300);
          }
          break;
      }
    } catch (error) {
      console.error('Error accepting notification action:', error);
    }
  }, [notification, onMarkAsRead]);
  
  const handleDecline = useCallback(async () => {
    onMarkAsRead(notification.id);
    
    const { notification_type, object_id } = notification;
    const senderId = notification.sender?.id;
    
    try {
      switch (notification_type) {
        case 'friend_request':
          if (senderId) {
            await userService.respondToFriendRequest(senderId, 'reject');
          }
          break;
        
        case 'workout_invitation':
          if (object_id) {
            await groupWorkoutService.updateParticipantStatus(
              object_id,
              notification.recipient,
              'declined'
            );
          }
          break;
        
        case 'workout_join_request':
          if (object_id && senderId) {
            await groupWorkoutService.rejectGroupWorkoutRequest(object_id, senderId);
          }
          break;
      }
    } catch (error) {
      console.error('Error declining notification action:', error);
    }
  }, [notification, onMarkAsRead]);
  
  // Get user information - memoized
  const userInfo = useMemo(() => 
    userData || notification.sender,
    [userData, notification.sender]
  );
  
  const username = useMemo(() => 
    userInfo?.username || notification.translation_params?.sender_username || t('anonymous'),
    [userInfo?.username, notification.translation_params?.sender_username, t]
  );
  
  const avatarUrl = useMemo(() => 
    userInfo?.avatar ? getAvatarUrl(userInfo.avatar) : null,
    [userInfo?.avatar]
  );
  
  // Format timestamp - memoized
  const timeAgo = useMemo(() => 
    formatDistanceToNow(new Date(notification.created_at), { addSuffix: false }),
    [notification.created_at]
  );
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        notification.is_read ? styles.readNotification : styles.unreadNotification,
        notification.priority === 'high' || notification.priority === 'urgent' 
          ? styles.priorityNotification 
          : null
      ]} 
      onPress={handlePress}
      disabled={hasActions}
    >
      {/* Priority indicator */}
      {(notification.priority === 'high' || notification.priority === 'urgent') && (
        <View style={[
          styles.priorityIndicator,
          { backgroundColor: getPriorityColor(notification.priority) }
        ]} />
      )}
      
      {/* Avatar with notification type icon */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.placeholderAvatar, { backgroundColor: palette.primary }]}>
              <Text style={styles.avatarInitial}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View 
            style={[
              styles.notificationTypeIcon, 
              { backgroundColor: getNotificationColor(notification.notification_type) }
            ]}
          >
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={10} 
              color="white" 
            />
          </View>
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.notificationText}>
          {notificationContent}
        </Text>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
        
        {/* Action buttons */}
        {hasActions && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.acceptButton} 
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>{t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.declineButton} 
              onPress={handleDecline}
            >
              <Text style={styles.declineButtonText}>{t('decline')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Content Preview */}
      <ContentPreview 
        notification={notification}
        postData={postData}
      />
    </TouchableOpacity>
  );
});

// Add display name for debugging
NotificationItem.displayName = 'NotificationItem';

// Section header component
const SectionHeader = ({ title }) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{t(title)}</Text>
    </View>
  );
};

// Key optimizations for NotificationsScreen to prevent infinite loops

export default function NotificationsScreen() {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const navigation = useNavigation();
  const { t } = useLanguage();

  // FIXED: Stable configuration for real-time hook
  const realTimeConfig = useMemo(() => ({
    enablePushUpdates: true,
    enableWebSocketUpdates: true,
    enableAppStateUpdates: true,
    enablePeriodicUpdates: true,
    periodicInterval: 60000, // 1 minute fallback
  }), []); // Empty dependency array - config should be stable

  const {
    isRealTimeActive,
    socketConnected,
    pushRegistered,
    socketError,
    manualRefresh: realtimeManualRefresh
  } = useRealTimeNotifications(realTimeConfig); // Use stable config

  // **FIXED: Manual refresh capabilities with stable reference**
  const { refresh: manualRefresh } = useNotificationRefresh();
  
  // Hooks with stable options
  const notificationQueryOptions = useMemo(() => ({}), []);
  const countQueryOptions = useMemo(() => ({}), []);
  
  const { data: notifications, isLoading, refetch, isFetching } = useNotifications(notificationQueryOptions);
  const { data: countData, refetch: refetchCount } = useNotificationCount(countQueryOptions);
  const markAsRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();
  const { 
    isConnected: socketStatus, 
    markAsRead: socketMarkAsRead, 
    markAllAsRead: socketMarkAllAsRead 
  } = useNotificationSocket();
  
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Animation - stable reference
  const menuAnimation = useSharedValue(0);
  
  // FIXED: Memoized handlers to prevent recreation on every render
  const toggleMenu = useCallback(() => {
    if (menuVisible) {
      menuAnimation.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setMenuVisible)(false);
      });
    } else {
      setMenuVisible(true);
      menuAnimation.value = withTiming(1, { duration: 200 });
    }
  }, [menuVisible, menuAnimation]);
  
  const menuAnimatedStyle = useAnimatedStyle(() => {
    const opacity = menuAnimation.value;
    const translateY = interpolate(menuAnimation.value, [0, 1], [-20, 0]);
    
    return {
      opacity,
      transform: [{ translateY }]
    };
  });
  
  // FIXED: Stable refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Try multiple refresh strategies
      await Promise.all([
        refetch(), // React Query refetch
        refetchCount(), // Count refetch
        manualRefresh(), // Manual cache refresh
        realtimeManualRefresh(), // Real-time manual refresh
      ]);
    } catch (error) {
      console.error('❌ Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchCount, manualRefresh, realtimeManualRefresh]);
  
  // FIXED: Stable mark as read handler
  const handleMarkAsRead = useCallback((id: number) => {
    markAsRead.mutate(id);
    if (socketConnected) {
      socketMarkAsRead(id);
    }
  }, [markAsRead, socketConnected, socketMarkAsRead]);
  
  // FIXED: Stable mark all as read handler
  const handleMarkAllAsRead = useCallback(() => {
    markAllRead.mutate();
    if (socketConnected) {
      socketMarkAllAsRead();
    }
    setMenuVisible(false);
  }, [markAllRead, socketConnected, socketMarkAllAsRead]);

  // FIXED: Memoized connection status to prevent recalculation
  const connectionStatus = useMemo(() => {
    if (socketConnected && pushRegistered) {
      return { status: 'excellent', text: t('notifications.status.excellent'), color: palette.accent };
    } else if (socketConnected || pushRegistered) {
      return { status: 'good', text: t('notifications.status.good'), color: '#FFA500' };
    } else if (isRealTimeActive) {
      return { status: 'limited', text: t('notifications.status.limited'), color: '#FF6B35' };
    } else {
      return { status: 'offline', text: t('notifications.status.offline'), color: '#FF3B30' };
    }
  }, [socketConnected, pushRegistered, isRealTimeActive, t, palette.accent]);
  
  // FIXED: Memoized sections to prevent expensive recalculation
  const sections = useMemo(() => {
    if (!notifications || notifications.length === 0) {
      return [];
    }
    
    const sortedNotifications = [...notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const sections = [];
    const today = new Date();
    
    // Today
    const todayNotifications = sortedNotifications.filter(
      notification => isToday(new Date(notification.created_at))
    );
    if (todayNotifications.length > 0) {
      sections.push({
        title: 'notification.section.today',
        data: todayNotifications,
      });
    }
    
    // Yesterday
    const yesterdayNotifications = sortedNotifications.filter(
      notification => isYesterday(new Date(notification.created_at))
    );
    if (yesterdayNotifications.length > 0) {
      sections.push({
        title: 'notification.section.yesterday',
        data: yesterdayNotifications,
      });
    }
    
    // This week
    const thisWeekNotifications = sortedNotifications.filter(notification => {
      const date = new Date(notification.created_at);
      const days = differenceInDays(today, date);
      return !isToday(date) && !isYesterday(date) && days <= 7;
    });
    if (thisWeekNotifications.length > 0) {
      sections.push({
        title: 'notification.section.this_week',
        data: thisWeekNotifications,
      });
    }
    
    // Earlier
    const olderNotifications = sortedNotifications.filter(notification => {
      const date = new Date(notification.created_at);
      return differenceInDays(today, date) > 7;
    });
    if (olderNotifications.length > 0) {
      sections.push({
        title: 'notification.section.earlier',
        data: olderNotifications,
      });
    }
    
    return sections;
  }, [notifications]);

  // FIXED: Memoized render functions
  const renderItem = useCallback(({ item }) => (
    <NotificationItem 
      notification={item} 
      onMarkAsRead={handleMarkAsRead} 
    />
  ), [handleMarkAsRead]);

  const renderSectionHeader = useCallback(({ section: { title } }) => (
    <SectionHeader title={title} />
  ), []);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Rest of the component remains the same...
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.layout }]}>
      <StatusBar barStyle="light-content" backgroundColor={palette.accent} />
      <View style={[styles.container, { backgroundColor: palette.page_background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t('notifications')}</Text>
            {countData?.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{countData.unread}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Dropdown Menu */}
        {menuVisible && (
          <Animated.View style={[styles.dropdownMenu, menuAnimatedStyle]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleMarkAllAsRead}>
              <Ionicons name="checkmark-done" size={18} color={palette.text} />
              <Text style={styles.menuItemText}>{t('mark_all_as_read')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={onRefresh}>
              <Ionicons name="refresh" size={18} color={palette.text} />
              <Text style={styles.menuItemText}>{t('refresh_notifications')}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Content */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : notifications?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color={palette.text} />
            <Text style={styles.emptyText}>{t('no_notifications_yet')}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>{t('check_for_notifications')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[palette.primary]}
                tintColor={palette.primary}
              />
            }
            stickySectionHeadersEnabled={true}
            removeClippedSubviews={true} // Performance optimization
            maxToRenderPerBatch={10} // Performance optimization
            windowSize={10} // Performance optimization
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: palette.layout,
  },
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: palette.layout,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: palette.page_background,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuItemText: {
    marginLeft: 8,
    color: palette.text,
    fontSize: 14,
  },
  // connectionStatus: {
  //   backgroundColor: palette.highlight,
  //   padding: 8,
  //   alignItems: 'center',
  // },
  // connectionText: {
  //   color: palette.text,
  //   fontSize: 14,
  // },
  listContent: {
    paddingHorizontal: 0,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    position: 'relative',
  },
  readNotification: {
    backgroundColor: 'transparent',
  },
  unreadNotification: {
    backgroundColor: palette.highlight,
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
  },
  priorityNotification: {
    borderWidth: 2,
    borderColor: palette.warning,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationTypeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.page_background,
  },
  contentContainer: {
    flex: 1,
    marginRight: 10,
  },
  notificationText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeAgo: {
    color: palette.text,
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: palette.accent,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 13,
  },
  declineButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  declineButtonText: {
    color: palette.text,
    fontWeight: '500',
    fontSize: 13,
  },
  contentPreview: {
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: 50,
    height: 50,
  },
  postIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  profileIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  programIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  achievementIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  gymIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  typeIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    padding: 4,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: palette.layout,
    marginVertical: 4,
    borderRadius: 8,
  },
  sectionHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: palette.text,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  connectionStatus: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  connectionStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  retryButton: {
    marginLeft: 8,
    padding: 4,
  },
  refreshButton: {
    marginTop: 16,
    backgroundColor: palette.layout,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '500',
  },
}));