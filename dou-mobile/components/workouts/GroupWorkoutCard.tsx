// components/workouts/GroupWorkoutCard.tsx
import React, { useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Easing,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/imageUtils';

interface GroupWorkoutCardProps {
  groupWorkoutId: number;
  groupWorkout: {
    id: number;
    title: string;
    description?: string;
    creator_details: {
      id: number;
      username: string;
      avatar?: string;
    };
    gym_details?: {
      id: number;
      name: string;
      location: string;
    };
    scheduled_time: string;
    privacy: 'public' | 'upon-request' | 'private';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    participants?: Array<{
      user_details: {
        id: number;
        username: string;
        avatar?: string;
      };
    }>;
    participants_count: number;
    max_participants: number;
    is_creator: boolean;
    current_user_status: string;
    is_full: boolean;
    is_active: boolean;
  };
  onParticipatePress?: (groupWorkoutId: number) => void;
  // Selection mode props
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onLongPress?: () => void;
}

const GroupWorkoutCard: React.FC<GroupWorkoutCardProps> = ({
  groupWorkoutId,
  groupWorkout,
  onParticipatePress,
  // Selection mode props
  selectionMode = false,
  isSelected = false,
  onSelect,
  onLongPress
}) => {
  const { t } = useLanguage();
  const { workoutPalette } = useTheme();
  
  // Animation for selection mode
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Start wiggle animation when entering selection mode
  useEffect(() => {
    if (selectionMode) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(wiggleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.linear
          }),
          Animated.timing(wiggleAnim, {
            toValue: -1,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.linear
          }),
          Animated.timing(wiggleAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.linear
          })
        ])
      ).start();
      
      // Also add a small "pop" scale animation when first entering selection mode
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Stop animation when exiting selection mode
      wiggleAnim.stopAnimation();
      wiggleAnim.setValue(0);
    }
  }, [selectionMode, wiggleAnim, scaleAnim]);
  
  // Animation for selection/deselection
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: isSelected ? 0.95 : 0.98,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  }, [isSelected, scaleAnim]);
  
  // Calculate countdown
  const getCountdown = (scheduledTime: string): { days: number, hours: number, text: string } => {
    const now = new Date();
    const workoutDate = new Date(scheduledTime);
    const diffTime = workoutDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let text = '';
    if (diffTime < 0) {
      // Past event
      text = t('workout_passed');
    } else if (diffDays > 0) {
      text = t('days_left', { count: diffDays });
    } else if (diffHours > 0) {
      text = t('hours_left', { count: diffHours });
    } else {
      text = t('starting_soon');
    }
    
    return { days: diffDays, hours: diffHours, text };
  };
  
  // Format date
  const formatDate = (date: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  // Get status badge color
  const getStatusColor = (status: string): { bg: string, text: string } => {
    switch (status) {
      case 'scheduled':
        return { bg: '#10B981', text: '#FFFFFF' }; // Green
      case 'in_progress':
        return { bg: '#3B82F6', text: '#FFFFFF' }; // Blue
      case 'completed':
        return { bg: '#6B7280', text: '#FFFFFF' }; // Gray
      case 'cancelled':
        return { bg: '#EF4444', text: '#FFFFFF' }; // Red
      default:
        return { bg: '#6B7280', text: '#FFFFFF' }; // Default gray
    }
  };
  
  // Get privacy badge color
  const getPrivacyColor = (privacy: string): { bg: string, text: string } => {
    switch (privacy) {
      case 'public':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981' }; // Green
      case 'upon-request':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6' }; // Blue
      case 'private':
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6B7280' }; // Gray
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6B7280' }; // Default gray
    }
  };
  
  // Get participation action text based on user status and workout settings
  const getParticipationActionText = (): string => {
    if (groupWorkout.is_creator) {
      return t('manage');
    }
    
    switch (groupWorkout.current_user_status) {
      case 'joined':
        return t('joined');
      case 'invited':
        return t('accept_invite');
      case 'declined':
        return t('declined');
      case 'removed':
        return t('removed');
      case 'request_pending':
        return t('requested');
      case 'request_rejected':
        return t('request_rejected');
      default:
        if (groupWorkout.is_full) {
          return t('full');
        }
        
        switch (groupWorkout.privacy) {
          case 'public':
            return t('join');
          case 'upon-request':
            return t('request_join');
          case 'private':
            return t('private');
          default:
            return t('join');
        }
    }
  };
  
  // Check if user can participate
  const canParticipate = (): boolean => {
    if (groupWorkout.is_creator) return true;
    if (!groupWorkout.is_active) return false;
    if (groupWorkout.is_full && groupWorkout.current_user_status !== 'joined' && groupWorkout.current_user_status !== 'invited') return false;
    
    switch (groupWorkout.current_user_status) {
      case 'joined':
      case 'invited':
      case 'request_pending':
        return true;
      case 'declined':
      case 'removed':
      case 'request_rejected':
        return false;
      default:
        return groupWorkout.privacy !== 'private';
    }
  };
  
  // Handle card press
  const handleCardPress = () => {
    if (selectionMode) {
      onSelect && onSelect();
    } else {
      router.push(`/group-workout/${groupWorkoutId}`);
    }
  };
  
  // Handle participate button press
  const handleParticipatePress = (e: any) => {
    e.stopPropagation();
    if (onParticipatePress) {
      onParticipatePress(groupWorkoutId);
    } else {
      router.push(`/group-workout/${groupWorkoutId}`);
    }
  };
  
  const handleLongPress = () => {
    onLongPress && onLongPress();
  };
  
  // Countdown data
  const countdown = getCountdown(groupWorkout.scheduled_time);
  
  // Status colors
  const statusColors = getStatusColor(groupWorkout.status);
  const privacyColors = getPrivacyColor(groupWorkout.privacy);
  
  // Participant avatars - limit to max 5 for display
  const displayParticipants = groupWorkout.participants?.slice(0, 5) || [];
  
  // Combine animations for wiggle effect
  const animatedStyle = {
    transform: [
      { rotate: wiggleAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-1deg', '1deg']
        })
      },
      { scale: scaleAnim }
    ]
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleCardPress}
        onLongPress={handleLongPress}
        delayLongPress={200}
        style={[
          styles.container,
          { backgroundColor: workoutPalette.background },
          isSelected && [styles.selectedContainer, { borderColor: workoutPalette.text }]
        ]}
      >
        {/* Selection indicator */}
        {selectionMode && (
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.checkbox,
              isSelected && [styles.checkboxSelected, { backgroundColor: workoutPalette.background }]
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </View>
        )}
        
        {/* Main content */}
        <View style={styles.cardContent}>
          {/* Top row with badges */}
          <View style={styles.topRow}>
            <View style={styles.badgesContainer}>
              {/* Event Badge */}
              <View style={[styles.eventBadge, { backgroundColor: workoutPalette.badge_bg }]}>
                <Text style={[styles.eventBadgeText, { color: workoutPalette.text }]}>
                  {t('group_workout')}
                </Text>
              </View>
              
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                  {t(groupWorkout.status)}
                </Text>
              </View>
              
              {/* Privacy Badge */}
              <View style={[styles.privacyBadge, { backgroundColor: privacyColors.bg }]}>
                <Text style={[styles.privacyBadgeText, { color: privacyColors.text }]}>
                  {t(groupWorkout.privacy)}
                </Text>
              </View>
            </View>
            
            {/* Countdown Badge */}
            {groupWorkout.status === 'scheduled' && (
              <View style={[styles.countdownBadge, { 
                backgroundColor: countdown.days > 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)' 
              }]}>
                <Text style={[styles.countdownText, { 
                  color: countdown.days > 0 ? '#3B82F6' : '#EF4444'
                }]}>
                  {countdown.text}
                </Text>
              </View>
            )}
          </View>
          
          {/* Workout title */}
          <Text style={[styles.title, { color: workoutPalette.text }]} numberOfLines={1}>
            {groupWorkout.title}
          </Text>
          
          {/* Date */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={workoutPalette.text_secondary} />
            <Text style={[styles.dateText, { color: workoutPalette.text }]}>
              {formatDate(groupWorkout.scheduled_time)}
            </Text>
          </View>
          
          {/* Gym location */}
          {groupWorkout.gym_details && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={workoutPalette.text_secondary} />
              <Text style={[styles.locationText, { color: workoutPalette.text_secondary }]} numberOfLines={1}>
                {groupWorkout.gym_details.name} - {groupWorkout.gym_details.location}
              </Text>
            </View>
          )}
          
          {/* Creator info */}
          <View style={styles.creatorRow}>
            <Ionicons name="person-outline" size={14} color={workoutPalette.text_secondary} />
            <Text style={[styles.creatorText, { color: workoutPalette.text_secondary }]}>
              {t('created_by')} {groupWorkout.creator_details.username}
            </Text>
          </View>
        </View>
        
        {/* Participants */}
        <View style={styles.participantsContainer}>
          <View style={styles.participantsHeader}>
            <Text style={[styles.participantsTitle, { color: workoutPalette.text_secondary }]}>
              {t('participants')} ({groupWorkout.participants_count}/{groupWorkout.max_participants > 0 ? groupWorkout.max_participants : '∞'})
            </Text>
          </View>
          
          <View style={styles.avatarsRow}>
            {displayParticipants.length > 0 ? (
              <>
                {displayParticipants.map((participant, index) => (
                  <View key={index} style={[
                    styles.avatarContainer,
                    { right: index * 15 } // Overlap avatars
                  ]}>
                    <Image
                      source={{ uri: getAvatarUrl(participant.user_details.avatar) }}
                      style={styles.avatar}
                    />
                  </View>
                ))}
                
                {/* More indicator if there are additional participants */}
                {(groupWorkout.participants_count > 5) && (
                  <View style={[
                    styles.moreAvatarsContainer,
                    { right: 4 * 15 }
                  ]}>
                    <Text style={styles.moreAvatarsText}>+{groupWorkout.participants_count - 5}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={[styles.noParticipantsText, { color: workoutPalette.text_secondary }]}>
                {t('no_participants_yet')}
              </Text>
            )}
          </View>
        </View>
        
        {/* Actions row */}
        <View style={styles.actionsRow}>
          {/* Spacer */}
          <View style={styles.spacer} />
          
          {/* Participate button */}
          {!selectionMode && (
            <TouchableOpacity 
              style={[
                styles.participateButton, 
                { backgroundColor: canParticipate() ? workoutPalette.action_bg : 'rgba(107, 114, 128, 0.2)' },
              ]}
              onPress={handleParticipatePress}
              disabled={!canParticipate()}
            >
              <Text style={[
                styles.participateText, 
                { color: canParticipate() ? workoutPalette.highlight : '#6B7280' }
              ]}>
                {getParticipationActionText()}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  selectedContainer: {
    borderWidth: 2,
  },
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  eventBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  privacyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  privacyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 6,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 14,
    marginLeft: 6,
  },
  participantsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  participantsHeader: {
    marginBottom: 8,
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatarsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 36,
    position: 'relative',
  },
  avatarContainer: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'white',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  moreAvatarsContainer: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(107, 114, 128, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  moreAvatarsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noParticipantsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  spacer: {
    flex: 1,
  },
  participateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  participateText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Selection mode styles
  selectionIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#10B981',
  },
});

export default GroupWorkoutCard;