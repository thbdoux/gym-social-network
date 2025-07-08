// components/notifications/ContentPreview.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { getAvatarUrl } from '../../utils/imageUtils';
import { getNotificationIcon, getNotificationColor } from '../../api/services/notificationService';
import { NotificationTypeBadge } from './NotificationTypeBadge';

interface ContentPreviewProps {
  notification: any;
  postData?: any;
  userData?: any;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({ 
  notification, 
  postData, 
  userData 
}) => {
  const { palette, workoutPalette, programPalette, workoutLogPalette, groupWorkoutPalette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  
  // Get related object info from enhanced backend response
  const relatedObjectInfo = notification.related_object_info;
  
  const renderContentByType = () => {
    switch (notification.notification_type) {
      // Post interactions
      case 'like':
      case 'comment':
      case 'comment_reply':
      case 'mention':
      case 'post_reaction':
      case 'comment_reaction':
      case 'share':
        if (postData?.media && postData.media.length > 0) {
          return (
            <Image 
              source={{ uri: postData.media[0].url }} 
              style={styles.previewImage} 
              contentFit="cover"
            />
          );
        } else if (relatedObjectInfo?.preview) {
          return (
            <View style={styles.textPreview}>
              <Text style={styles.previewText} numberOfLines={2}>
                {relatedObjectInfo.preview}
              </Text>
            </View>
          );
        }
        return (
          <View style={styles.iconPreview}>
            <Ionicons name="document-text" size={24} color={palette.text} />
          </View>
        );

      // Social interactions
      case 'friend_request':
      case 'friend_accept':
        
        const avatarUrl = userData?.avatar ? getAvatarUrl(userData.avatar) : null;
        return avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.previewAvatar} />
        ) : (
          <View style={[styles.previewAvatar, { backgroundColor: palette.primary }]}>
            <Text style={styles.avatarInitial}>
              {(userData?.username || notification.translation_params?.sender_username || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        );

      // Program interactions
      case 'program_fork':
      case 'program_shared':
      case 'program_liked':
      case 'program_used':
        return (
          <View style={[styles.typePreview, { backgroundColor: programPalette.background }]}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={24} 
              color={programPalette.highlight} 
            />
          </View>
        );

      // Template interactions
      case 'template_used':
      case 'template_forked':
        return (
          <View style={[styles.typePreview, { backgroundColor: programPalette.background }]}>
            <Ionicons name="document" size={24} color={programPalette.highlight} />
          </View>
        );

      // Achievement notifications
      case 'workout_milestone':
      case 'goal_achieved':
      case 'streak_milestone':
      case 'personal_record':
        return (
          <View style={[styles.typePreview, { backgroundColor: workoutLogPalette.background }]}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={24} 
              color={workoutLogPalette.highlight} 
            />
            {notification.translation_params?.workout_count && (
              <Text style={[styles.countBadge, { color: workoutLogPalette.highlight }]}>
                {notification.translation_params.workout_count}
              </Text>
            )}
          </View>
        );

      // Group workout interactions
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
      case 'workout_partner_added':
      case 'workout_partner_request':
        return (
          <View style={[styles.typePreview, { backgroundColor: groupWorkoutPalette.background }]}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={24} 
              color={groupWorkoutPalette.highlight} 
            />
            {relatedObjectInfo?.title && (
              <Text style={[styles.workoutTitle, { color: groupWorkoutPalette.highlight }]} numberOfLines={1}>
                {relatedObjectInfo.title}
              </Text>
            )}
          </View>
        );

      // System notifications
      case 'gym_announcement':
      case 'system_update':
      case 'challenge_invitation':
      case 'challenge_completed':
        return (
          <View style={styles.iconPreview}>
            <Ionicons 
              name={getNotificationIcon(notification.notification_type)} 
              size={24} 
              color={getNotificationColor(notification.notification_type)} 
            />
          </View>
        );

      default:
        return (
          <View style={styles.iconPreview}>
            <Ionicons name="notifications" size={24} color={palette.text} />
          </View>
        );
    }
  };

  return (
    <View style={styles.contentPreview}>
      {renderContentByType()}
      <NotificationTypeBadge type={notification.notification_type} priority={notification.priority} />
    </View>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  contentPreview: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: palette.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: 60,
    height: 60,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textPreview: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    color: palette.text,
    fontSize: 10,
    textAlign: 'center',
  },
  typePreview: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  iconPreview: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  countBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  workoutTitle: {
    fontSize: 8,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
}));