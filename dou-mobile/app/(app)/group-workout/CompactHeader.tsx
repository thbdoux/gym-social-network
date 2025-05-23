// app/(app)/group-workout/CompactHeader.tsx - Event Planning Style Header without Participants
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../../context/LanguageContext';

interface CompactHeaderProps {
  groupWorkout: any;
  colors: any;
  onBackPress: () => void;
  onSharePress: () => void;
  onJoinRequestsPress: () => void;
  onEditPress: () => void;
  onInvitePress: () => void;
  isCreator: boolean;
  isParticipant: boolean;
  pendingRequestsCount: number;
}

const CompactHeader: React.FC<CompactHeaderProps> = ({
  groupWorkout,
  colors,
  onBackPress,
  onSharePress,
  onJoinRequestsPress,
  onEditPress,
  onInvitePress,
  isCreator,
  isParticipant,
  pendingRequestsCount
}) => {
  const { t } = useLanguage();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // Get status badge color
  const getStatusColor = (status: string): { bg: string, text: string } => {
    switch (status) {
      case 'scheduled':
        return { bg: colors.success, text: '#FFFFFF' };
      case 'in_progress':
        return { bg: '#3b82f6', text: '#FFFFFF' };
      case 'completed':
        return { bg: '#6b7280', text: '#FFFFFF' };
      case 'cancelled':
        return { bg: colors.danger, text: '#FFFFFF' };
      default:
        return { bg: '#6b7280', text: '#FFFFFF' };
    }
  };
  
  // Get privacy badge color
  const getPrivacyColor = (privacy: string): { bg: string, text: string } => {
    switch (privacy) {
      case 'public':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: colors.success };
      case 'upon-request':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' };
      case 'private':
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' };
    }
  };
  
  // Calculate countdown
  const getCountdown = (scheduledTime: string): string => {
    const now = new Date();
    const workoutDate = new Date(scheduledTime);
    const diffTime = workoutDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffTime < 0) {
      return t('workout_passed');
    } else if (diffDays > 0) {
      return diffDays === 1 ? 
        t('tomorrow_at', { time: workoutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) :
        t('days_left', { count: diffDays });
    } else if (diffHours > 0) {
      return t('hours_left', { count: diffHours });
    } else if (diffMinutes > 0) {
      return t('minutes_left', { count: diffMinutes });
    } else {
      return t('starting_now');
    }
  };
  
  // Format date for display
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
  
  const statusColors = getStatusColor(groupWorkout.status);
  const privacyColors = getPrivacyColor(groupWorkout.privacy);
  const countdown = getCountdown(groupWorkout.scheduled_time);
  
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerContainer}
    >
      {/* Top Row: Back Button, Title, Action Buttons */}
      <View style={styles.topRow}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
            {groupWorkout.title}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.badgeText, { color: statusColors.text }]}>
                {t(groupWorkout.status)}
              </Text>
            </View>
            <View style={[styles.privacyBadge, { backgroundColor: privacyColors.bg }]}>
              <Text style={[styles.badgeText, { color: privacyColors.text }]}>
                {t(groupWorkout.privacy)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {/* Invite Friends Button */}
          {(isCreator || isParticipant) && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onInvitePress}
            >
              <Ionicons name="people-outline" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          
          {/* Join Requests Button */}
          {isCreator && pendingRequestsCount > 0 && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onJoinRequestsPress}
            >
              <View style={styles.badgeContainer}>
                <Ionicons name="person-add-outline" size={20} color={colors.text.primary} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{pendingRequestsCount}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Options Menu */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowOptionsMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Event Details Row */}
      <View style={styles.eventDetailsRow}>
        <View style={styles.dateTimeContainer}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={[styles.dateTimeText, { color: colors.text.secondary }]}>
            {formatDate(groupWorkout.scheduled_time)}
          </Text>
        </View>
        
        {groupWorkout.gym_details && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Text style={[styles.locationText, { color: colors.text.secondary }]} numberOfLines={1}>
              {groupWorkout.gym_details.name}
            </Text>
          </View>
        )}
        
        {/* Countdown for scheduled workouts */}
        {groupWorkout.status === 'scheduled' && (
          <View style={styles.countdownContainer}>
            <Ionicons name="time-outline" size={16} color={colors.highlight} />
            <Text style={[styles.countdownText, { color: colors.highlight }]}>
              {countdown}
            </Text>
          </View>
        )}
      </View>
      
      {/* Description if available */}
      {groupWorkout.description && (
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionText, { color: colors.text.secondary }]}>
            {groupWorkout.description}
          </Text>
        </View>
      )}
      
      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={[styles.optionsMenu, { backgroundColor: colors.card }]}>
            {isCreator && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onEditPress();
                }}
              >
                <Ionicons name="create-outline" size={20} color={colors.text.primary} />
                <Text style={[styles.optionText, { color: colors.text.primary }]}>
                  {t('edit_workout')}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                onSharePress();
              }}
            >
              <Ionicons name="share-social-outline" size={20} color={colors.text.primary} />
              <Text style={[styles.optionText, { color: colors.text.primary }]}>
                {t('share_workout')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  privacyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  optionsMenu: {
    marginTop: 70,
    marginRight: 20,
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  }
});

export default CompactHeader;