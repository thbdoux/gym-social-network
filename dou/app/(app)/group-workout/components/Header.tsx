// app/(app)/group-workout/components/Header.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../../../../context/LanguageContext';
import GymSelectionModal from '../../../../components/workouts/GymSelectionModal';
// Import the new dateUtils
import {
  safeParseDate,
  toISOString,
  formatDateForDisplay,
  formatTimeForDisplay,
  formatDateTimeForDisplay,
  calculateCountdown,
  getMinimumDate,
  debugDateParsing
} from '../../../../utils/dateUtils';

interface HeaderProps {
  scrollY: Animated.Value;
  groupWorkout: any;
  colors: any;
  isCreator: boolean;
  selectedGym: any;
  participantsCount: number;
  maxParticipants: number;
  onBack: () => void;
  onDeleteWorkout: () => void;
  onSharePress: () => void;
  onEditPress: () => void;
  onInvitePress: () => void;
  onFieldUpdate: (field: string, value: any) => void;
  onHeaderHeightChange?: (height: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  scrollY,
  groupWorkout,
  colors,
  isCreator,
  selectedGym,
  participantsCount,
  maxParticipants,
  onBack,
  onDeleteWorkout,
  onSharePress,
  onEditPress,
  onInvitePress,
  onFieldUpdate,
  onHeaderHeightChange,
}) => {
  const { t, language } = useLanguage();
  const HEADER_HEIGHT = 255; // Fixed simple height
  
  // DateTimePicker modal states
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [tempDateTime, setTempDateTime] = useState(() => {
    // Safely parse the initial date
    const parsedDate = safeParseDate(groupWorkout.scheduled_time);
    return parsedDate || new Date();
  });
  
  // Animation values for modal
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  
  // Gym Selection Modal state
  const [showGymSelection, setShowGymSelection] = useState(false);
  
  const HEADER_MIN_HEIGHT = 100;
  const HEADER_SCROLL_DISTANCE = HEADER_HEIGHT - HEADER_MIN_HEIGHT;

  // Modal animation functions
  const showModal = () => {
    setShowDateTimeModal(true);
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDateTimeModal(false);
    });
  };

  // Animated values
  const animatedHeaderHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.8, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Get privacy badge color
  const getPrivacyColor = (privacy: string): { bg: string, text: string } => {
    switch (privacy) {
      case 'public':
        return { bg: 'green', text: 'white' };
      case 'upon-request':
        return { bg: 'rgba(59, 130, 246, 50)', text: 'white' };
      case 'private':
        return { bg: 'grey', text: 'white' };
      default:
        return { bg: 'black', text: 'white' };
    }
  };

  // Calculate countdown using dateUtils
  const getCountdown = (scheduledTime: string): string => {
    return calculateCountdown(scheduledTime, {
      workout_passed: t('workout_passed'),
      tomorrow: t('tomorrow'),
      days_left: (count: number) => t('days_left', { count }),
      hours_left: (count: number) => t('hours_left', { count }),
      minutes_left: (count: number) => t('minutes_left', { count }),
      starting_now: t('starting_now')
    });
  };

  // Edit handlers
  const handleNamePress = () => {
    if (!isCreator) return;
    Alert.prompt(
      t('edit_workout_name'),
      t('enter_new_workout_name'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (name) => {
            if (name && name.trim() !== '') {
              onFieldUpdate('title', name.trim());
            }
          }
        }
      ],
      'plain-text',
      groupWorkout.title
    );
  };

  const handleDateTimePress = () => {
    if (!isCreator) return;
    // Parse the current scheduled time safely
    const parsedDate = safeParseDate(groupWorkout.scheduled_time);
    setTempDateTime(parsedDate || new Date());
    showModal();
  };

  const handleDateTimeConfirm = () => {
    // Convert to ISO string for backend
    const isoString = toISOString(tempDateTime);
    if (isoString) {
      onFieldUpdate('scheduled_time', isoString);
    }
    hideModal();
  };

  const handleDateTimeCancel = () => {
    // Reset to original value
    const parsedDate = safeParseDate(groupWorkout.scheduled_time);
    setTempDateTime(parsedDate || new Date());
    hideModal();
  };

  const onDateTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDateTime(selectedDate);
    }
  };

  const handleGymPress = () => {
    setShowGymSelection(true);
  };

  const handleGymSelect = (gym: any) => {
    if (gym) {
      onFieldUpdate('gym', gym.id);
    } else {
      onFieldUpdate('gym', null);
    }
  };

  const handleDescriptionPress = () => {
    if (!isCreator) return;
    Alert.prompt(
      t('edit_description'),
      t('enter_workout_description'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (description) => {
            onFieldUpdate('description', description || '');
          }
        }
      ],
      'plain-text',
      groupWorkout.description || ''
    );
  };

  const handlePrivacyPress = () => {
    if (!isCreator) return;
    
    const privacyOptions = [
      {
        text: t('public'),
        onPress: () => onFieldUpdate('privacy', 'public')
      },
      {
        text: t('upon-request'),
        onPress: () => onFieldUpdate('privacy', 'upon-request')
      },
      {
        text: t('private'),
        onPress: () => onFieldUpdate('privacy', 'private')
      },
      {
        text: t('cancel'),
        style: 'cancel' as const
      }
    ];

    Alert.alert(
      t('change_privacy'),
      t('select_privacy_level'),
      privacyOptions
    );
  };

  // Handle options menu - only delete and cancel
  const handleOptionsMenu = () => {
    const options = [];
    
    if (isCreator) {
      options.push({
        text: t('delete_workout'),
        style: 'destructive' as const,
        onPress: onDeleteWorkout
      });
    }
    
    options.push({
      text: t('cancel'),
      style: 'cancel' as const
    });

    Alert.alert(
      t('workout_options'),
      t('select_an_option'),
      options
    );
  };

  const privacyColors = getPrivacyColor(groupWorkout.privacy);

  return (
    <>
      <Animated.View 
        style={[
          styles.header, 
          { 
            height: animatedHeaderHeight, 
            opacity: headerOpacity,
            backgroundColor: colors.primary
          }
        ]}
      >
        <View style={styles.headerContent}>
          {/* Top Row - Title and countdown */}
          <View style={styles.headerTopRow}>
            <Animated.View style={[styles.titleContainer, { transform: [{ scale: titleScale }] }]}>
              <TouchableOpacity onPress={handleNamePress} activeOpacity={isCreator ? 0.7 : 1}>
                <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
                  {groupWorkout.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleOptionsMenu}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Status and Privacy Row */}
          <View style={styles.badgesRow}>
            <TouchableOpacity 
              style={[styles.privacyBadge, { backgroundColor: privacyColors.bg }]}
              onPress={handlePrivacyPress}
              activeOpacity={isCreator ? 0.7 : 1}
            >
              <Text style={[styles.badgeText, { color: privacyColors.text }]}>
                {t(groupWorkout.privacy)}
              </Text>
            </TouchableOpacity>
            
            {/* Countdown */}
            {groupWorkout.status === 'scheduled' && (
              <View style={[styles.countdownContainer, { backgroundColor: colors.highlight }]}>
                <Text style={styles.countdownText}>
                  {getCountdown(groupWorkout.scheduled_time)}
                </Text>
              </View>
            )}
          </View>
      
          {/* Workout Info Container */}
          <View style={[styles.workoutInfoContainer, { backgroundColor: colors.card }]}>
            {/* Date Time Row */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
              <View style={styles.infoContent}>
                {isCreator ? (
                  <TouchableOpacity onPress={handleDateTimePress} activeOpacity={0.7}>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                      {formatDateTimeForDisplay(groupWorkout.scheduled_time, language)}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                    {formatDateTimeForDisplay(groupWorkout.scheduled_time, language)}
                  </Text>
                )}
              </View>
            </View>

            {/* Gym Location Row */}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.text.secondary} />
              <TouchableOpacity 
                style={styles.infoContent} 
                onPress={handleGymPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoValue, { color: colors.text.primary }]} numberOfLines={1}>
                  {selectedGym?.name || groupWorkout.gym_details?.name || t('not_specified')}
                  {(selectedGym?.location || groupWorkout.gym_details?.location) && (
                    <Text style={[styles.locationText, { color: colors.text.secondary }]}>
                      {' - '}{selectedGym?.location || groupWorkout.gym_details?.location}
                    </Text>
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description - only if available */}
          {groupWorkout.description && (
            <TouchableOpacity 
              style={[styles.descriptionContainer, { backgroundColor: colors.card }]}
              onPress={handleDescriptionPress}
              activeOpacity={isCreator ? 0.7 : 1}
            >
              <Text style={[styles.descriptionText, { color: colors.text.primary }]} numberOfLines={3}>
                {groupWorkout.description}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Gym Selection Modal */}
        <GymSelectionModal
          visible={showGymSelection}
          onClose={() => setShowGymSelection(false)}
          onSelectGym={handleGymSelect}
          selectedGym={selectedGym || groupWorkout.gym_details}
        />
      </Animated.View>

      {/* DateTimePicker Modal */}
      <Modal
        visible={showDateTimeModal}
        transparent={true}
        animationType="none"
        onRequestClose={handleDateTimeCancel}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleDateTimeCancel}
        >
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }]
              }
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                    {t('date_time')}
                  </Text>
                </View>
                
                <View style={styles.datePickerContainer}>
                  <DateTimePicker 
                    value={tempDateTime}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateTimeChange}
                    locale={language}
                    minimumDate={getMinimumDate()}
                    style={styles.datePicker}
                  />
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleDateTimeCancel}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.text.secondary }]}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                    onPress={handleDateTimeConfirm}
                  >
                    <Text style={[styles.modalButtonText, { color: 'white' }]}>
                      {t('confirm')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 38 : StatusBar.currentHeight || 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
    padding: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginBottom: 4,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  privacyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countdownContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workoutInfoContainer: {
    borderRadius: 12,
    paddingTop: 10,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  descriptionContainer: {
    borderRadius: 12,
    padding: 16,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  datePickerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  datePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 'auto',
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButton: {
    borderRadius: 16,
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
  confirmButton: {
    // No additional styles needed, backgroundColor applied inline
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});