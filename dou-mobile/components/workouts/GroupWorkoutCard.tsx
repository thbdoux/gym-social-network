// components/workouts/GroupWorkoutCard.tsx
import React, { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Easing,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/imageUtils';
import { useGroupWorkoutParticipants } from '../../hooks/query/useGroupWorkoutQuery';

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
  
  // Fetch participants if they're not included in the groupWorkout data
  const { data: fetchedParticipants, isLoading: isLoadingParticipants } = useGroupWorkoutParticipants(
    groupWorkoutId
  );
  
  // Get participants data from either prop or fetched data
  const participants = groupWorkout.participants || fetchedParticipants || [];
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
        return false; // Already joined, don't show participate buttons
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
  
  // Get all participants and their statuses for display
  const getAllParticipants = () => {
    if (!participants || participants.length === 0) {
      return [];
    }
    
    // Sort participants to display joined first, then invited
    return [...participants].sort((a, b) => {
      if (a.status === 'joined' && b.status !== 'joined') return -1;
      if (a.status !== 'joined' && b.status === 'joined') return 1;
      if (a.status === 'invited' && b.status !== 'invited') return -1;
      if (a.status !== 'invited' && b.status === 'invited') return 1;
      return 0;
    });
  };
  
  // Get overlay color based on participant status
  const getParticipantOverlayColor = (status?: string) => {
    switch (status) {
      case 'joined':
        return styles.confirmedOverlay;
      case 'invited':
        return styles.pendingOverlay;
      case 'pending':
        return styles.pendingOverlay;
      default:
        return styles.confirmedOverlay; // Default to confirmed
    }
  };
  
  // Detailed countdown data
  const countdownDetails = getDetailedCountdown(groupWorkout.scheduled_time);
  
  // Status colors
  const statusColors = getStatusColor(groupWorkout.status);
  const privacyColors = getPrivacyColor(groupWorkout.privacy);
  
  // Get all participants for the combined display
  const allParticipants = getAllParticipants();
  // Limit number of avatars for display
  const maxDisplayAvatars = 5;
  const displayParticipants = allParticipants.slice(0, maxDisplayAvatars);
  
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
          {/* Title row with countdown badge */}
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
          
          {/* Date and Location Row */}
          <View style={styles.infoRow}>
            {/* Date on the left */}
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color={groupWorkoutPalette.text_secondary} />
              <Text 
                style={[styles.dateText, { color: groupWorkoutPalette.text }]} 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatDate(groupWorkout.scheduled_time)}
              </Text>
            </View>
            
            {/* Location on the right */}
            {groupWorkout.gym_details && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color={groupWorkoutPalette.text_secondary} />
                <Text 
                  style={[styles.locationText, { color: groupWorkoutPalette.text_secondary }]} 
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {`${groupWorkout.gym_details.name} - ${groupWorkout.gym_details.location}`}
                </Text>
              </View>
            )}
          </View>
          
          {/* Action Buttons and Participants Row */}
          <View style={styles.actionAndParticipantsRow}>
            {/* Action buttons or status badge on the left */}
            <View style={styles.actionButtons}>
              {!selectionMode && !groupWorkout.is_creator && canParticipate() ? (
                <>
                  <TouchableOpacity 
                    style={[styles.iconButton, { backgroundColor: '#10B981' }]}
                    onPress={handleParticipatePress}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.iconButton, { backgroundColor: '#EF4444', marginLeft: 8 }]}
                    onPress={handleParticipatePress}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: groupWorkout.is_creator ? 
                      'rgba(147, 51, 234, 0.2)' : // Purple for creator
                      groupWorkout.current_user_status === 'joined' ? 
                        'rgba(16, 185, 129, 0.2)' : // Green for joined
                        'rgba(107, 114, 128, 0.2)' // Gray for others
                  }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { 
                      color: groupWorkout.is_creator ? 
                        '#9333EA' : // Purple for creator
                        groupWorkout.current_user_status === 'joined' ? 
                          '#10B981' : // Green for joined
                          '#6B7280' // Gray for others
                    }
                  ]}>
                    {groupWorkout.is_creator ? 
                      t('creator') : 
                      groupWorkout.current_user_status === 'joined' ? 
                        t('accepted') : 
                        groupWorkout.current_user_status === 'declined' ? 
                          t('declined') :
                          groupWorkout.current_user_status === 'invited' ?
                            t('invited') :
                            t('not_joined')}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Participants on the right */}
            <View style={styles.participantsDisplay}>
              {isLoadingParticipants ? (
                <ActivityIndicator size="small" color={groupWorkoutPalette.text_secondary} />
              ) : displayParticipants.length > 0 ? (
                <>
                  {displayParticipants.map((participant, index) => (
                    <View key={`participant-${index}`} style={[
                      styles.avatarContainer,
                      { right: index * 20 } // Overlapping from right to left
                    ]}>
                      <Image
                        source={{ uri: getAvatarUrl(participant.user_details.avatar) }}
                        style={styles.avatar}
                      />
                      <View style={[
                        styles.avatarOverlay, 
                        getParticipantOverlayColor(participant.status)
                      ]} />
                    </View>
                  ))}
                  
                  {/* More indicator if needed */}
                  {(allParticipants.length > maxDisplayAvatars) && (
                    <View style={[
                      styles.moreAvatarsContainer,
                      { right: (maxDisplayAvatars - 1) * 20 + 10 }
                    ]}>
                      <Text style={styles.moreAvatarsText}>+{allParticipants.length - maxDisplayAvatars}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={[styles.noParticipantsText, { color: groupWorkoutPalette.text_secondary }]}>
                  {t('no_participants')}
                </Text>
              )}
            </View>
          </View>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countdownContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
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
  // New combined date and location row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationText: {
    fontSize: 14,
    marginLeft: 6,
  },
  // New action and participants row
  actionAndParticipantsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  participantsDisplay: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: 34,
    position: 'relative',
    flex: 1,
  },
  avatarContainer: {
    position: 'absolute',
    borderRadius: 17,
    borderWidth: 0,
    borderColor: 'white',
    height: 34,
    width: 34,
    overflow: 'hidden',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 17,
  },
  confirmedOverlay: {
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.7)', // Green for confirmed
  },
  pendingOverlay: {
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.7)', // Orange for pending
  },
  moreAvatarsContainer: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.7)', // Gray background
    borderWidth: 2,
    borderColor: 'white',
  },
  moreAvatarsText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  noParticipantsText: {
    fontSize: 12,
    fontStyle: 'italic',
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