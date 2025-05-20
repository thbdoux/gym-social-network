// app/(app)/group-workout/Header.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../../context/LanguageContext';

// Type definitions
interface HeaderProps {
  groupWorkout: any;
  colors: any;
  onBackPress: () => void;
  onSharePress: () => void;
  onParticipantsPress: () => void;
  onInvitePress: () => void;
  onJoinRequestsPress: () => void;
  onEditPress: () => void;
  isCreator: boolean;
  isParticipant: boolean;
  pendingRequestsCount: number;
}

const Header: React.FC<HeaderProps> = ({
  groupWorkout,
  colors,
  onBackPress,
  onSharePress,
  onParticipantsPress,
  onInvitePress,
  onJoinRequestsPress,
  onEditPress,
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
  
  // Calculate countdown
  const getCountdown = (scheduledTime: string): { days: number, hours: number, minutes: number, text: string } => {
    const now = new Date();
    const workoutDate = new Date(scheduledTime);
    const diffTime = workoutDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    let text = '';
    if (diffTime < 0) {
      // Past event
      text = t('workout_passed');
    } else if (diffDays > 0) {
      text = diffDays === 1 ? 
        t('tomorrow_at', { time: workoutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) :
        t('days_left', { count: diffDays });
    } else if (diffHours > 0) {
      text = t('hours_left', { count: diffHours });
    } else if (diffMinutes > 0) {
      text = t('minutes_left', { count: diffMinutes });
    } else {
      text = t('starting_now');
    }
    
    return { days: diffDays, hours: diffHours, minutes: diffMinutes, text };
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
  
  // Status colors
  const statusColors = getStatusColor(groupWorkout.status);
  const privacyColors = getPrivacyColor(groupWorkout.privacy);
  
  // Countdown data
  const countdown = getCountdown(groupWorkout.scheduled_time);
  
  return (
    <View style={[styles.header, { backgroundColor: colors.primary }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} 
            onPress={onBackPress}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {/* Only show join requests button for the creator */}
            {isCreator && pendingRequestsCount > 0 && (
              <TouchableOpacity 
                style={[styles.headerAction, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
                onPress={onJoinRequestsPress}
              >
                <View style={styles.badgeContainer}>
                  <Ionicons name="person-add-outline" size={22} color={colors.text.primary} />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{pendingRequestsCount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            
            {/* Invite Button - only for creator or participants */}
            {(isCreator || isParticipant) && (
              <TouchableOpacity 
                style={[styles.headerAction, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
                onPress={onInvitePress}
              >
                <Ionicons name="person-add" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            )}
            
            {/* Participants Button */}
            <TouchableOpacity 
              style={[styles.headerAction, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
              onPress={onParticipantsPress}
            >
              <Ionicons name="people" size={22} color={colors.text.primary} />
            </TouchableOpacity>
            
            {/* Three dots menu */}
            <TouchableOpacity 
              style={[styles.headerAction, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
              onPress={() => setShowOptionsMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Title and Status */}
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={2}>
            {groupWorkout.title}
          </Text>
          
          <View style={styles.headerBadges}>
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
        </View>
        
        {/* Countdown */}
        {groupWorkout.status === 'scheduled' && (
          <View style={styles.countdownContainer}>
            <Text style={[styles.countdownText, { color: colors.text.primary }]}>
              <Ionicons name="time-outline" size={16} /> {countdown.text}
            </Text>
          </View>
        )}
        
        {/* Integrated Info Section - Directly in the header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.infoScrollView}>
          <View style={styles.infoChip}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.primary} />
            <Text style={[styles.infoChipText, { color: colors.text.primary }]}>
              {formatDate(groupWorkout.scheduled_time)}
            </Text>
          </View>
          
          {groupWorkout.gym_details && (
            <View style={styles.infoChip}>
              <Ionicons name="location-outline" size={16} color={colors.text.primary} />
              <Text style={[styles.infoChipText, { color: colors.text.primary }]}>
                {groupWorkout.gym_details.name}
              </Text>
            </View>
          )}
          
          <View style={styles.infoChip}>
            <Ionicons name="people-outline" size={16} color={colors.text.primary} />
            <Text style={[styles.infoChipText, { color: colors.text.primary }]}>
              {t('participants')}: {groupWorkout.participants_count}
              {groupWorkout.max_participants > 0 ? '/' + groupWorkout.max_participants : ''}
            </Text>
          </View>
          
          <View style={styles.infoChip}>
            <Ionicons name="person-outline" size={16} color={colors.text.primary} />
            <Text style={[styles.infoChipText, { color: colors.text.primary }]}>
              {t('created_by')} {groupWorkout.creator_details.username}
            </Text>
          </View>
        </ScrollView>
        
        {/* Description - if available */}
        {groupWorkout.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionText, { color: colors.text.primary }]}>
              {groupWorkout.description}
            </Text>
          </View>
        )}
      </LinearGradient>
      
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
          <View style={[styles.optionsMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Edit Workout - only for creator */}
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
            
            {/* Share Workout */}
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
            
            {/* Additional options can be added here */}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  headerGradient: {
    padding: 16,
    paddingBottom: 16,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  headerBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
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
  countdownContainer: {
    marginBottom: 12,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Integrated Info Section
  infoScrollView: {
    marginBottom: 10,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  infoChipText: {
    fontSize: 13,
    marginLeft: 6,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Options Menu Styles
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
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
  }
});

export default Header;