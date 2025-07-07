// components/notifications/NotificationTypeBadge.tsx
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { getPriorityColor } from '../../api/services/notificationService';

interface NotificationTypeBadgeProps {
  type: string;
  priority: string;
}

export const NotificationTypeBadge: React.FC<NotificationTypeBadgeProps> = ({ type, priority }) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { t } = useLanguage();
  
  const typeConfig = useMemo(() => {
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
    
    return configs[type] || { color: '#007AFF', icon: 'notifications' };
  }, [type]);
  
  const priorityColor = getPriorityColor(priority);
  const shouldShowPriority = priority === 'high' || priority === 'urgent';
  
  return (
    <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
      <Ionicons name={typeConfig.icon as any} size={12} color="white" />
      {shouldShowPriority && (
        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
      )}
    </View>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  typeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}));