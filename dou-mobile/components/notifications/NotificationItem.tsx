// components/notifications/NotificationItem.tsx
import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useUser } from '../../hooks/query/useUserQuery';
import { usePost } from '../../hooks/query/usePostQuery';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { getAvatarUrl } from '../../utils/imageUtils';
import { groupWorkoutService } from '../../api/services';
import userService from '../../api/services/userService';
import { 
  getPriorityColor,
  getNotificationNavigation,
  translateNotification,
  getNotificationIcon,
  getNotificationColor
} from '../../api/services/notificationService';

interface NotificationItemProps {
  notification: any;
  onMarkAsRead: (id: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: (id: number) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = React.memo(({ 
  notification, 
  onMarkAsRead,
  isExpanded,
  onToggleExpand 
}) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  // Enhanced data fetching
  const { data: userData } = useUser(notification.sender);
  const shouldFetchPost = notification.object_id && 
    ['like', 'comment', 'comment_reply', 'mention', 'post_reaction', 'comment_reaction', 'share'].includes(notification.notification_type);
  const { data: postData } = usePost(shouldFetchPost ? notification.object_id : null);
  
  // Use enhanced translation from backend
  const translatedContent = useMemo(() => {
    // Use the enhanced translation system from backend
    if (notification.translated_title && notification.translated_body) {
      return {
        title: notification.translated_title,
        body: notification.translated_body
      };
    }
    
    // Fallback to manual translation using the service
    if (notification.title_key && notification.body_key) {
      return translateNotification(
        notification.title_key,
        notification.body_key,
        notification.translation_params || {},
        t
      );
    }
    
    // Final fallback
    return {
      title: notification.content || t('notifications.new_notification'),
      body: notification.content || ''
    };
  }, [notification, t]);
  
  // Enhanced action detection
  const actionableTypes = ['friend_request', 'workout_invitation', 'workout_join_request'];
  const hasActions = actionableTypes.includes(notification.notification_type) && !notification.is_read;
  const availableActions = notification.available_actions || [];
  
  // Enhanced user info
  const userInfo = useMemo(() => 
    userData || null,
    [userData, notification.sender]
  );
  
  const username = useMemo(() => 
    userInfo?.display_name || 
    userInfo?.username || 
    notification.translation_params?.sender_display_name ||
    notification.translation_params?.sender_username || 
    t('notifications.anonymous_user'),
    [userInfo, notification.translation_params, t]
  );
  
  const avatarUrl = useMemo(() => 
    userInfo?.avatar ? getAvatarUrl(userInfo.avatar) : null,
    [userInfo?.avatar]
  );
  
  // Enhanced time formatting
  const timeInfo = useMemo(() => {
    const createdAt = new Date(notification.created_at);
    const timeAgo = notification.time_ago || formatDistanceToNow(createdAt, { addSuffix: false });
    const isRecent = notification.is_recent ?? (Date.now() - createdAt.getTime() < 3600000); // 1 hour
    
    return { timeAgo, isRecent, createdAt };
  }, [notification.created_at, notification.time_ago, notification.is_recent]);
  
  // Navigation handler with enhanced backend logic
  const handlePress = useCallback(() => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
    if (!hasActions) {
      setTimeout(() => {
        const navigationPath = getNotificationNavigation(notification);
        router.push(navigationPath);
      }, 100);
    }
  }, [notification, onMarkAsRead, hasActions]);
  
  // Enhanced action handlers with backend service integration
  const handleAction = useCallback(async (action: string) => {
    onMarkAsRead(notification.id);
    
    try {
      switch (action) {
        case 'accept':
          if (notification.notification_type === 'friend_request' && notification.sender?.id) {
            await userService.respondToFriendRequest(notification.sender.id, 'accept');
            router.push(`/user/${notification.sender.id}`);
          } else if (notification.notification_type === 'workout_invitation' && notification.object_id) {
            await groupWorkoutService.joinGroupWorkout(notification.object_id);
            router.push(`/group-workout/${notification.object_id}`);
          }
          break;
          
        case 'decline':
        case 'reject':
          if (notification.notification_type === 'friend_request' && notification.sender?.id) {
            await userService.respondToFriendRequest(notification.sender.id, 'reject');
          } else if (notification.notification_type === 'workout_invitation' && notification.object_id) {
            await groupWorkoutService.updateParticipantStatus(
              notification.object_id,
              notification.recipient,
              'declined'
            );
          }
          break;
          
        case 'approve':
          if (notification.notification_type === 'workout_join_request' && notification.object_id && notification.sender?.id) {
            await groupWorkoutService.approveGroupWorkoutRequest(notification.object_id, notification.sender.id);
            router.push(`/group-workout/${notification.object_id}`);
          }
          break;
          
        case 'reply':
          if (notification.notification_type === 'group_workout_message' && notification.object_id) {
            router.push(`/group-workout/${notification.object_id}/chat`);
          } else if (['comment', 'mention'].includes(notification.notification_type) && notification.object_id) {
            router.push(`/post/${notification.object_id}/comment`);
          }
          break;
          
        case 'view_post':
          if (notification.object_id) {
            router.push(`/post/${notification.object_id}`);
          }
          break;
          
        case 'mark_read':
          // Already handled above
          break;
      }
    } catch (error) {
      console.error(`${t('notifications.action_error')} ${action}:`, error);
      Alert.alert(t('common.error'), t('notifications.action_failed'));
    }
  }, [notification, onMarkAsRead, t]);
  
  // Get notification type configuration
  const notificationTypeConfig = useMemo(() => {
    const configs = {
      // Post interactions
      'like': { color: '#FF3B30', icon: 'heart' },
      'comment': { color: '#007AFF', icon: 'chatbubble' },
      'comment_reply': { color: '#5856D6', icon: 'return-up-forward' },
      'mention': { color: '#FF9500', icon: 'at' },
      'post_reaction': { color: '#FF3B30', icon: 'happy' },
      'comment_reaction': { color: '#007AFF', icon: 'thumbs-up' },
      'share': { color: '#AF52DE', icon: 'share-social' },
      
      // Social interactions  
      'friend_request': { color: '#34C759', icon: 'person-add' },
      'friend_accept': { color: '#34C759', icon: 'people' },
      
      // Program interactions
      'program_fork': { color: '#5856D6', icon: 'git-branch' },
      'program_shared': { color: '#007AFF', icon: 'share' },
      'program_liked': { color: '#FF3B30', icon: 'heart' },
      'program_used': { color: '#34C759', icon: 'play' },
      
      // Template interactions
      'template_used': { color: '#007AFF', icon: 'document' },
      'template_forked': { color: '#5856D6', icon: 'git-branch' },
      
      // Achievements
      'workout_milestone': { color: '#FFD700', icon: 'trophy' },
      'goal_achieved': { color: '#FFD700', icon: 'flag' },
      'streak_milestone': { color: '#FF6B35', icon: 'flame' },
      'personal_record': { color: '#32D74B', icon: 'medal' },
      
      // Group workouts
      'workout_invitation': { color: '#007AFF', icon: 'fitness' },
      'workout_join': { color: '#34C759', icon: 'log-in' },
      'workout_join_request': { color: '#FF9500', icon: 'enter' },
      'workout_request_approved': { color: '#34C759', icon: 'checkmark-circle' },
      'workout_request_rejected': { color: '#FF3B30', icon: 'close-circle' },
      'workout_cancelled': { color: '#FF3B30', icon: 'calendar-outline' },
      'workout_completed': { color: '#5AC8FA', icon: 'checkmark-done-circle' },
      'workout_reminder': { color: '#FF9500', icon: 'alarm' },
      
      // Messages and proposals
      'group_workout_message': { color: '#007AFF', icon: 'chatbubbles' },
      'workout_proposal_submitted': { color: '#5856D6', icon: 'bulb' },
      'workout_proposal_voted': { color: '#34C759', icon: 'thumbs-up' },
      'workout_proposal_selected': { color: '#FFD700', icon: 'checkmark-done' },
      
      // Partnerships
      'workout_partner_added': { color: '#34C759', icon: 'people' },
      'workout_partner_request': { color: '#007AFF', icon: 'person-add' },
      
      // System
      'gym_announcement': { color: '#FF9500', icon: 'megaphone' },
      'system_update': { color: '#5856D6', icon: 'settings' },
      'challenge_invitation': { color: '#FFD700', icon: 'trophy' },
      'challenge_completed': { color: '#32D74B', icon: 'ribbon' },
    };
    
    return configs[notification.notification_type] || { color: '#007AFF', icon: 'notifications' };
  }, [notification.notification_type]);
  
  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutRight.duration(200)}
    >
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          notification.is_read ? styles.readNotification : styles.unreadNotification,
          (notification.priority === 'high' || notification.priority === 'urgent') 
            ? styles.priorityNotification 
            : null,
          timeInfo.isRecent ? styles.recentNotification : null
        ]} 
        onPress={handlePress}
        disabled={hasActions && availableActions.length === 0}
        activeOpacity={0.7}
      >
        {/* Enhanced priority indicator */}
        {(notification.priority === 'high' || notification.priority === 'urgent') && (
          <View style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(notification.priority) }
          ]} />
        )}
        
        {/* Enhanced avatar with status indicators */}
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
            
            {/* Enhanced notification type icon */}
            <View 
              style={[
                styles.notificationTypeIcon, 
                { backgroundColor: notificationTypeConfig.color }
              ]}
            >
              <Ionicons 
                name={notificationTypeConfig.icon as any} 
                size={14} 
                color="white" 
              />
            </View>
            
            {/* Recent indicator */}
            {timeInfo.isRecent && (
              <View style={styles.recentIndicator}>
                <View style={[styles.recentDot, { backgroundColor: palette.accent }]} />
              </View>
            )}
          </View>
        </View>
        
        {/* Enhanced content - now taking full width */}
        <View style={styles.contentContainer}>
          {/* Main notification text with better formatting */}
          <View style={styles.textContainer}>
            <Text style={styles.notificationText} numberOfLines={isExpanded ? undefined : 3}>
              <Text style={styles.usernameText}>{username}</Text>
              <Text style={styles.actionText}> {translatedContent.body}</Text>
            </Text>
            
            {/* Enhanced metadata display */}
            {/* {notification.related_object_info && (
              <View style={styles.objectInfoContainer}>
                <Ionicons 
                  name="document-text" 
                  size={14} 
                  color={palette.textSecondary} 
                  style={styles.objectInfoIcon}
                />
                <Text style={styles.objectInfo} numberOfLines={1}>
                  {notification.related_object_info.title || notification.related_object_info.name}
                </Text>
              </View>
            )} */}
          </View>
          
          {/* Time and status row */}
          <View style={styles.metadataRow}>
            <View style={styles.timeContainer}>
              <Ionicons 
                name="time" 
                size={12} 
                color={palette.textSecondary} 
                style={styles.timeIcon}
              />
              <Text style={styles.timeAgo}>
                {timeInfo.timeAgo}
                {timeInfo.isRecent && (
                  <Text style={styles.recentText}> • {t('notifications.recent')}</Text>
                )}
              </Text>
            </View>
            
            {/* Unread indicator */}
            {!notification.is_read && (
              <View style={styles.unreadIndicator}>
                <View style={[styles.unreadDot, { backgroundColor: palette.primary }]} />
                <Text style={styles.unreadText}>{t('notifications.unread')}</Text>
              </View>
            )}
          </View>
          
          {/* Enhanced action buttons */}
          {hasActions && availableActions.length > 0 && (
            <View style={styles.actionButtons}>
              {availableActions.map((action) => (
                <TouchableOpacity 
                  key={action}
                  style={[
                    styles.actionButton,
                    action === 'accept' || action === 'approve' 
                      ? styles.primaryActionButton 
                      : styles.secondaryActionButton
                  ]} 
                  onPress={() => handleAction(action)}
                >
                  <Ionicons 
                    name={
                      action === 'accept' || action === 'approve' ? 'checkmark' :
                      action === 'decline' || action === 'reject' ? 'close' :
                      action === 'reply' ? 'chatbubble' : 'eye'
                    } 
                    size={14} 
                    color={
                      action === 'accept' || action === 'approve' 
                        ? 'white' 
                        : palette.text
                    }
                    style={styles.actionButtonIcon}
                  />
                  <Text style={[
                    styles.actionButtonText,
                    action === 'accept' || action === 'approve' 
                      ? styles.primaryActionButtonText 
                      : styles.secondaryActionButtonText
                  ]}>
                    {t(`notifications.actions.${action}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Expand/collapse for long content */}
          {translatedContent.body.length > 120 && (
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => onToggleExpand?.(notification.id)}
            >
              <Text style={styles.expandButtonText}>
                {isExpanded ? t('notifications.show_less') : t('notifications.show_more')}
              </Text>
              <Ionicons 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={12} 
                color={palette.primary}
                style={styles.expandIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

NotificationItem.displayName = 'NotificationItem';

const themedStyles = createThemedStyles((palette) => ({
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    backgroundColor: palette.layout,
    shadowColor: palette.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  readNotification: {
    opacity: 0.85,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: palette.layout,
    backgroundColor: palette.highlight,
  },
  priorityNotification: {
    borderWidth: 1,
    borderColor: palette.warning,
    shadowColor: palette.warning,
    shadowOpacity: 0.2,
  },
  recentNotification: {
    shadowColor: palette.layout,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatarContainer: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  placeholderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  notificationTypeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: palette.page_background,
  },
  recentIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
  },
  recentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  contentContainer: {
    flex: 1,
  },
  textContainer: {
    marginBottom: 8,
  },
  notificationText: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  usernameText: {
    fontWeight: '600',
    color: palette.text,
  },
  actionText: {
    fontWeight: '400',
    color: palette.text,
  },
  objectInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: palette.highlight,
    borderRadius: 8,
  },
  objectInfoIcon: {
    marginRight: 6,
  },
  objectInfo: {
    color: palette.text,
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
    color: palette.text,
  },
  timeAgo: {
    color: palette.text,
    fontSize: 13,
  },
  recentText: {
    color: palette.accent,
    fontWeight: '500',
  },
  unreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  unreadText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
  },
  primaryActionButton: {
    backgroundColor: palette.accent,
  },
  secondaryActionButton: {
    backgroundColor: palette.highlight,
    borderWidth: 1,
    borderColor: palette.border,
  },
  actionButtonIcon: {
    marginRight: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryActionButtonText: {
    color: 'white',
  },
  secondaryActionButtonText: {
    color: palette.text,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '500',
  },
  expandIcon: {
    marginLeft: 4,
  },
}));