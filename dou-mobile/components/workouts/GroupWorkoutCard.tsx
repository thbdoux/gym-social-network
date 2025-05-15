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
      status?: 'declined' | 'joined' | 'pending' | 'invited';
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
  const { t, language } = useLanguage();
  const { groupWorkoutPalette } = useTheme();
  
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
  
  // Calculate detailed countdown with language-aware text
  const getDetailedCountdown = (scheduledTime: string): { 
    days: number, 
    hours: number, 
    minutes: number, 
    isPast: boolean,
    formattedTime: string,
    text: string 
  } => {
    const now = new Date();
    const workoutDate = new Date(scheduledTime);
    const diffTime = workoutDate.getTime() - now.getTime();
    const isPast = diffTime < 0;
    
    // Use absolute diff time for past events
    const absDiffTime = Math.abs(diffTime);
    
    const diffDays = Math.floor(absDiffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((absDiffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((absDiffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format as dd:hh:mm
    const formattedTime = `${diffDays.toString().padStart(2, '0')}:${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}`;
    
    // Text representation with language support
    let text = '';
    if (isPast) {
      text = t('workout_passed');
    } else if (diffDays > 0) {
      text = t('in_days', { count: diffDays });
    } else if (diffHours > 0) {
      text = t('in_hours', { count: diffHours });
    } else {
      text = t('starting_soon');
    }
    
    return { 
      days: diffDays, 
      hours: diffHours, 
      minutes: diffMinutes, 
      isPast, 
      formattedTime,
      text 
    };
  };
  
  // Format date with language context support
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      
      // Create a date object
      const date = new Date(dateString);
      
      // Use the current language for formatting
      const locale = language === 'fr' ? 'fr-FR' : 'en-US';
      
      // Format date part
      const datePart = date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Format time part
      const timePart = date.toLocaleTimeString(locale, {
        hour: '2-digit', 
        minute: '2-digit',
        hour12: language !== 'fr' // Use 24-hour format for French
      });
      
      // Combine date and time with appropriate connector based on language
      const connector = language === 'fr' ? 'à' : 'at';
      return `${datePart} ${connector} ${timePart}`;
    } catch (e) {
      return dateString; // If parsing fails, return the original string
    }
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
        return { bg: 'rgba(107, 114, 124, 0.2)', text: '#6B7280' }; // Default gray
    }
  };
  
  // Get participation action text based on user status and workout settings
  const getParticipationActionText = (): string => {
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
    // Return false if user is creator
    if (groupWorkout.is_creator) return false;
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
  
  // Separate participants by status
  const categorizeParticipants = () => {
    const confirmedParticipants: typeof groupWorkout.participants = [];
    const pendingParticipants: typeof groupWorkout.participants = [];
    
    // If participants is undefined, return empty arrays
    if (!groupWorkout.participants) {
      return { confirmedParticipants, pendingParticipants };
    }
    
    // Filter participants based on status
    groupWorkout.participants.forEach(participant => {
      // Assuming 'confirmed' is the status for confirmed participants
      // and 'pending' or 'invited' are for pending participants
      if (participant.status === 'joined' || participant.status === undefined) {
        confirmedParticipants.push(participant);
      } else if (participant.status === 'invited') {
        pendingParticipants.push(participant);
      }
    });
    
    return { confirmedParticipants, pendingParticipants };
  };
  
  // Detailed countdown data
  const countdownDetails = getDetailedCountdown(groupWorkout.scheduled_time);
  
  // Status colors
  const statusColors = getStatusColor(groupWorkout.status);
  const privacyColors = getPrivacyColor(groupWorkout.privacy);
  
  // Separate participants
  const { confirmedParticipants, pendingParticipants } = categorizeParticipants();
  
  // Limit number of avatars for display
  const maxDisplayAvatars = 3; // For each category
  const displayConfirmedParticipants = confirmedParticipants.slice(0, maxDisplayAvatars);
  const displayPendingParticipants = pendingParticipants.slice(0, maxDisplayAvatars);
  
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
          { backgroundColor: groupWorkoutPalette.background },
          isSelected && [styles.selectedContainer, { borderColor: groupWorkoutPalette.text }]
        ]}
      >
        {/* Selection indicator */}
        {selectionMode && (
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.checkbox,
              isSelected && [styles.checkboxSelected, { backgroundColor: groupWorkoutPalette.background }]
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </View>
        )}
        
        {/* Main content */}
        <View style={styles.cardContent}>
          {/* Second row with title and privacy badge */}
          <View style={styles.titleRow}>
            {/* Workout title */}
            <Text style={[styles.title, { color: groupWorkoutPalette.text }]} numberOfLines={1}>
              {groupWorkout.title}
            </Text>
          
            <View style={[
                styles.countdownContainer, 
                { backgroundColor: countdownDetails.isPast ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }
              ]}>
                <Text style={[
                  styles.countdownText, 
                  { color: countdownDetails.isPast ? '#EF4444' : '#10B981' }
                ]}>
                  {countdownDetails.text}
                </Text>
            </View>
          </View>
          
          {/* Date */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={groupWorkoutPalette.text_secondary} />
            <Text style={[styles.dateText, { color: groupWorkoutPalette.text }]}>
              {formatDate(groupWorkout.scheduled_time)}
            </Text>
          </View>
          
          {/* Gym location */}
          {groupWorkout.gym_details && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={groupWorkoutPalette.text_secondary} />
              <Text style={[styles.locationText, { color: groupWorkoutPalette.text_secondary }]} numberOfLines={1}>
                {groupWorkout.gym_details.name} - {groupWorkout.gym_details.location}
              </Text>
            </View>
          )}
        </View>
        
        {/* Participants */}
        <View style={styles.participantsContainer}>
          {/* Participants container - dual sided layout */}
          <View style={styles.avatarsContainer}>
            {/* Confirmed participants - left side with green overlay */}
            <View style={styles.confirmedAvatarsRow}>
              {displayConfirmedParticipants.length > 0 ? (
                <>
                  {displayConfirmedParticipants.map((participant, index) => (
                    <View key={`confirmed-${index}`} style={[
                      styles.avatarContainer,
                      { left: index * 25 } // Position from left
                    ]}>
                      <Image
                        source={{ uri: getAvatarUrl(participant.user_details.avatar) }}
                        style={styles.avatar}
                      />
                      <View style={[styles.avatarOverlay, styles.confirmedOverlay]} />
                    </View>
                  ))}
                  
                  {/* More indicator for confirmed */}
                  {(confirmedParticipants.length > maxDisplayAvatars) && (
                    <View style={[
                      styles.moreAvatarsContainer,
                      styles.confirmedMoreContainer,
                      { left: (maxDisplayAvatars - 1) * 25 + 15 }
                    ]}>
                      <Text style={styles.moreAvatarsText}>+{confirmedParticipants.length - maxDisplayAvatars}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noAvatarsPlaceholder} />
              )}
            </View>
            
            {/* Divider */}
            <View style={styles.participantsDivider} />
            
            {/* Pending participants - right side with orange overlay */}
            <View style={styles.pendingAvatarsRow}>
              {displayPendingParticipants.length > 0 ? (
                <>
                  {displayPendingParticipants.map((participant, index) => (
                    <View key={`pending-${index}`} style={[
                      styles.avatarContainer,
                      { right: index * 25 } // Position from right
                    ]}>
                      <Image
                        source={{ uri: getAvatarUrl(participant.user_details.avatar) }}
                        style={styles.avatar}
                      />
                      <View style={[styles.avatarOverlay, styles.pendingOverlay]} />
                    </View>
                  ))}
                  
                  {/* More indicator for pending */}
                  {(pendingParticipants.length > maxDisplayAvatars) && (
                    <View style={[
                      styles.moreAvatarsContainer,
                      styles.pendingMoreContainer,
                      { right: (maxDisplayAvatars - 1) * 25 + 15 }
                    ]}>
                      <Text style={styles.moreAvatarsText}>+{pendingParticipants.length - maxDisplayAvatars}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noAvatarsPlaceholder} />
              )}
            </View>
          </View>
        </View>
        
        {/* Actions row */}
        <View style={styles.actionsRow}>
          {/* Spacer */}
          <View style={styles.spacer} />
          
          {/* Participate button - only for non-creators */}
          {!selectionMode && !groupWorkout.is_creator && (
            <TouchableOpacity 
              style={[
                styles.participateButton, 
                { backgroundColor: canParticipate() ? groupWorkoutPalette.action_bg : 'rgba(107, 114, 128, 0.2)' },
              ]}
              onPress={handleParticipatePress}
              disabled={!canParticipate()}
            >
              <Text style={[
                styles.participateText, 
                { color: canParticipate() ? groupWorkoutPalette.highlight : '#6B7280' }
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
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  privacyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  privacyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countdownContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countdownIcon: {
    marginBottom: 2,
  },
  countdownTime: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  countdownText: {
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
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
    marginBottom: 0,
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
  avatarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmedAvatarsRow: {
    flex: 1,
    height: 40,
    position: 'relative',
  },
  pendingAvatarsRow: {
    flex: 1,
    height: 40,
    position: 'relative',
  },
  participantsDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    marginHorizontal: 10,
  },
  avatarContainer: {
    position: 'absolute',
    borderRadius: 25,
    borderWidth: 0,
    borderColor: 'white',
    height: 50,
    width: 50,
    overflow: 'hidden',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 20,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
  },
  confirmedOverlay: {
    // backgroundColor: 'rgba(16, 185, 129, 0.3)', // Green overlay for confirmed
    borderWidth: 4,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  pendingOverlay: {
    // backgroundColor: 'rgba(245, 158, 11, 0.3)', // Orange overlay for pending
    borderWidth: 4,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  moreAvatarsContainer: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  confirmedMoreContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.7)', // Green for confirmed
  },
  pendingMoreContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.7)', // Orange for pending
  },
  moreAvatarsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noAvatarsPlaceholder: {
    height: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
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