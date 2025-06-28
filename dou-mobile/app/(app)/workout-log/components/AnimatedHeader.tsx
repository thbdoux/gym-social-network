// app/(app)/workout-log/components/AnimatedHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import OverlappedAvatars from '../../../../components/shared/OverlappedAvatars';
import { getDifficultyIndicator } from '../../workout/formatters';
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

interface AnimatedHeaderProps {
  scrollY: Animated.Value;
  log: any;
  colors: any;
  isCreator: boolean;
  selectedGym: any;
  workoutPartners: number[];
  logDuration: number;
  logMoodRating: number;
  language : string;
  onDeleteLog: () => void;
  onPartnersPress: () => void;
  onFieldUpdate: (field: string, value: any) => void;
  setLogName: (name: string) => void;
  setLogNotes: (notes: string) => void;
  setLogDuration: (duration: number) => void;
  setLogDifficulty: (difficulty: number) => void;
  setLogMoodRating: (rating: number) => void;
  setIsGymSelectionVisible: (visible: boolean) => void;
  t: (key: string) => string;
  onHeaderHeightChange?: (height: number) => void;
}

const formatDateForAPI = (date: Date): string => {
  // Get the date components in LOCAL timezone (not UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Return ISO format date string WITHOUT timezone conversion
  return `${year}-${month}-${day}`;
};

const parseUserDate = (input: string): Date | null => {
  if (!input?.trim()) return null;
  
  const trimmed = input.trim();
  
  // Try ISO format first (YYYY-MM-DD) - this is what the backend sends
  const isoDate = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date;
  }
  
  // Try DD/MM/YYYY format (legacy user input)
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    // Validate the date is reasonable
    if (date.getFullYear() === parseInt(year) && 
        date.getMonth() === parseInt(month) - 1 && 
        date.getDate() === parseInt(day)) {
      return date;
    }
  }
  
  // Try parsing as-is (handles ISO format and other standard formats)
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
};

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  scrollY,
  log,
  colors,
  isCreator,
  selectedGym,
  workoutPartners,
  logDuration,
  logMoodRating,
  language,
  onDeleteLog,
  onPartnersPress,
  onFieldUpdate,
  setLogName,
  setLogNotes,
  setLogDuration,
  setLogDifficulty,
  setLogMoodRating,
  setIsGymSelectionVisible,
  t,
  onHeaderHeightChange,
}) => {
  const [headerHeight, setHeaderHeight] = useState(230); // Default height
  const headerRef = useRef<View>(null);
  
  // DateTimePicker modal state
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [tempDateTime, setTempDateTime] = useState(() => {
    // Safely parse the initial date
    const parsedDate = safeParseDate(log.date);
    return parsedDate || new Date();
  });
  
  // Animation values for modal
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  
  const HEADER_MIN_HEIGHT = 0;
  const HEADER_SCROLL_DISTANCE = headerHeight - HEADER_MIN_HEIGHT;

  // Calculate dynamic header height based on content
  const calculateHeaderHeight = () => {
    let height = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0; // Status bar
    height += 12; // Top padding
    height += 48; // Header top row
    height += 8; // Margin after title
    height += 78; // Workout stats container (2 rows)
    height += 12; // Margin after stats
    
    // Add height for workout partners section if present
    if (workoutPartners.length > 0 || isCreator) {
      height += 48; // Partners section
      height += 8; // Margin after partners
    }
    
    // Add height for notes if present
    if (log.notes) {
      const notesLines = Math.ceil((log.notes.length || 0) / 50); // Rough estimation
      const notesHeight = Math.max(40, Math.min(80, 20 + (notesLines * 18))); // Min 40, max 80
      height += notesHeight;
      height += 8; // Margin after notes
    }
    
    height += 100; // Bottom padding
    
    return height;
  };

  // Update header height when content changes
  useEffect(() => {
    const newHeight = calculateHeaderHeight();
    setHeaderHeight(newHeight);
    onHeaderHeightChange?.(newHeight);
  }, [log.notes, workoutPartners.length, isCreator]);

  // Update tempDateTime when log.date changes
  useEffect(() => {
    if (log.date) {
      const parsedDate = parseUserDate(log.date);
      if (parsedDate) {
        // Only update if the parsed date is significantly different from current tempDateTime
        // This prevents the useEffect from overriding user selections
        const timeDiff = Math.abs(parsedDate.getTime() - tempDateTime.getTime());
        if (timeDiff > 1000) { // More than 1 second difference
          setTempDateTime(parsedDate);
        }
      }
    }
  }, [log.date]);
  
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
    outputRange: [headerHeight, HEADER_MIN_HEIGHT],
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

  // Format date for display
  const formatDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return '';
    
    try {
      let date: Date;
      if (typeof dateInput === 'string') {
        const parsedDate = parseUserDate(dateInput);
        if (!parsedDate) return '';
        date = parsedDate;
      } else {
        date = dateInput;
      }
      
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Format time for display
  const formatTime = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return '';
    
    try {
      let date: Date;
      if (typeof dateInput === 'string') {
        const parsedDate = parseUserDate(dateInput);
        if (!parsedDate) return '';
        date = parsedDate;
      } else {
        date = dateInput;
      }
      
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Get mood emoji
  const getMoodEmoji = (rating?: number): string => {
    if (!rating) return '😐';
    if (rating <= 2) return '😞';
    if (rating <= 4) return '😐';
    if (rating <= 6) return '🙂';
    if (rating <= 8) return '😊';
    return '😄';
  };

  const handleDateTimePress = () => {
    if (!isCreator) return;
    // Parse the current scheduled time safely
    const parsedDate = safeParseDate(log.date);
    setTempDateTime(parsedDate || new Date());
    showModal();
  };

  const handleDateTimeConfirm = () => {
    // Convert to ISO string for backend
    const isoString = toISOString(tempDateTime);
    if (isoString) {
      onFieldUpdate('date', isoString);
    }
    hideModal();
  };

  const handleDateTimeCancel = () => {
    // Reset to original value
    const parsedDate = safeParseDate(log.date);
    setTempDateTime(parsedDate || new Date());
    hideModal();
  };

  const onDateTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDateTime(selectedDate);
    }
  };

  // Get minimum date (current date/time)
  const getMinimumDate = () => {
    // Allow past dates for workout logs, but set a reasonable limit
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 1); // Allow up to 1 year ago
    return minDate;
  };

  const handleDurationPress = () => {
    if (!isCreator) return;
    
    console.log('Duration press - current value:', logDuration);
    
    Alert.prompt(
      t('edit_duration'),
      t('enter_duration_in_minutes') + '\n(0 for no duration)',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (durationText) => {
            console.log('Duration input received:', durationText);
            
            if (!durationText) {
              console.log('No duration text provided');
              return;
            }
            
            const duration = parseInt(durationText.trim(), 10);
            console.log('Parsed duration:', duration);
            
            if (!isNaN(duration) && duration >= 0) {
              setLogDuration(duration);
              onFieldUpdate('duration', duration);
              console.log('Duration updated to:', duration);
            } else {
              Alert.alert(t('error'), 'Please enter a valid number (0 or greater)');
            }
          }
        }
      ],
      'plain-text',
      logDuration.toString()
    );
  };

  const handleGymPress = () => {
    if (!isCreator) return;
    setIsGymSelectionVisible(true);
  };

  const handleMoodPress = () => {
    if (!isCreator) return;
    Alert.alert(
      t('mood_rating'),
      t('how_did_you_feel_during_workout'),
      [
        {
          text: '😞 1-2',
          onPress: () => {
            setLogMoodRating(2);
            onFieldUpdate('mood_rating', 2);
          }
        },
        {
          text: '😐 3-4',
          onPress: () => {
            setLogMoodRating(4);
            onFieldUpdate('mood_rating', 4);
          }
        },
        {
          text: '🙂 5-6',
          onPress: () => {
            setLogMoodRating(6);
            onFieldUpdate('mood_rating', 6);
          }
        },
        {
          text: '😊 7-8',
          onPress: () => {
            setLogMoodRating(8);
            onFieldUpdate('mood_rating', 8);
          }
        },
        {
          text: '😄 9-10',
          onPress: () => {
            setLogMoodRating(10);
            onFieldUpdate('mood_rating', 10);
          }
        },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  };

  const handleDifficultyPress = () => {
    if (!isCreator) return;
    Alert.alert(
      t('edit_difficulty'),
      t('select_difficulty_level'),
      [
        {
          text: t('beginner'),
          onPress: () => {
            setLogDifficulty(0);
            onFieldUpdate('perceived_difficulty', 0);
          }
        },
        {
          text: t('intermediate'),
          onPress: () => {
            setLogDifficulty(1);
            onFieldUpdate('perceived_difficulty', 1);
          }
        },
        {
          text: t('advanced'),
          onPress: () => {
            setLogDifficulty(2);
            onFieldUpdate('perceived_difficulty', 2);
          }
        },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  };

  const handleNamePress = () => {
    if (!isCreator) return;
    Alert.prompt(
      t('edit_name'),
      t('enter_new_log_name'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (name) => {
            if (name && name.trim() !== '') {
              setLogName(name);
              onFieldUpdate('name', name);
            }
          }
        }
      ],
      'plain-text',
      log.name
    );
  };

  const handleNotesPress = () => {
    if (!isCreator) return;
    Alert.prompt(
      t('edit_notes'),
      t('enter_workout_notes'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (notes) => {
            setLogNotes(notes || '');
            onFieldUpdate('notes', notes || '');
          }
        }
      ],
      'plain-text',
      log.notes || ''
    );
  };

  // Handle options menu (simplified to just delete)
  const handleOptionsMenu = () => {
    Alert.alert(
      t('workout_options'),
      t('select_an_option'),
      [
        {
          text: t('delete'),
          style: 'destructive',
          onPress: onDeleteLog
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <>
      <Animated.View 
        ref={headerRef}
        style={[
          styles.header, 
          { 
            height: animatedHeaderHeight, 
            opacity: headerOpacity 
          }
        ]}
      >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            {/* Top Row - Title on left, options on right */}
            <View style={styles.headerTopRow}>
              <Animated.View style={[styles.titleContainer, { transform: [{ scale: titleScale }] }]}>
                <TouchableOpacity onPress={handleNamePress} activeOpacity={isCreator ? 0.7 : 1}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {log.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              
              {isCreator && (
                <TouchableOpacity 
                  style={styles.optionsButton}
                  onPress={handleOptionsMenu}
                >
                  <Ionicons name="ellipsis-vertical" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Workout Info Container - Date & Gym in cleaner layout */}
            <View style={styles.workoutInfoContainer}>
              {/* Date Row with DateTimePicker */}
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                <View style={styles.infoContent}>
                  {isCreator ? (
                    <TouchableOpacity onPress={handleDateTimePress} activeOpacity={0.7}>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                      {formatDateForDisplay(log.date, language)}
                    </Text>
                  </TouchableOpacity>
                  ) : (
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                      {formatDate(log.date)}
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
                  activeOpacity={isCreator ? 0.7 : 1}
                >
                  <Text style={[styles.infoValue, { color: colors.text.primary }]} numberOfLines={1}>
                    {selectedGym?.name || log.gym_name || 'Home'}
                    {(selectedGym?.location || log.location) && (
                      <Text style={[styles.locationText, { color: colors.text.secondary }]}>
                        {' - '}{selectedGym?.location || log.location}
                      </Text>
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Workout Stats - Duration, Mood, Difficulty */}
            <View style={styles.workoutStatsContainer}>
              <View style={styles.workoutStatsRow}>
                <TouchableOpacity 
                  style={styles.statItem} 
                  onPress={handleDurationPress}
                  activeOpacity={isCreator ? 0.7 : 1}
                >
                  <Text style={styles.statLabel}>{t('duration')}</Text>
                  <Text style={styles.statValue}>
                    {logDuration > 0 ? `${logDuration}m` : (isCreator ? t('tap_to_set') : '-')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.statItem} 
                  onPress={handleMoodPress}
                  activeOpacity={isCreator ? 0.7 : 1}
                >
                  <Text style={styles.statLabel}>{t('mood')}</Text>
                  <Text style={styles.statValue}>
                    {getMoodEmoji(logMoodRating)}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.statItem} 
                  onPress={handleDifficultyPress}
                  activeOpacity={isCreator ? 0.7 : 1}
                >
                  <Text style={styles.statLabel}>{t('difficulty')}</Text>
                  <Text style={styles.statValue}>
                    {getDifficultyIndicator(log.perceived_difficulty)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Workout Partners Section */}
            {(workoutPartners.length > 0 || isCreator) && (
              <View style={styles.partnersSection}>
                <TouchableOpacity
                  style={styles.partnersContainer}
                  onPress={onPartnersPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.partnersInfo}>
                    <Ionicons name="people-outline" size={16} color={colors.text.secondary} />
                    <Text style={styles.partnersLabel}>
                      {workoutPartners.length > 0 
                        ? `${t('workout_partners')}`
                        : t('add_workout_partners')
                      }
                    </Text>
                  </View>
                  
                  <View style={styles.partnersRight}>
                    {workoutPartners.length > 0 ? (
                      <>
                        <OverlappedAvatars
                          userIds={workoutPartners}
                          size="small"
                          maxVisible={4}
                          style={styles.partnersAvatars}
                        />
                        <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
                      </>
                    ) : isCreator ? (
                      <Ionicons name="add-circle" size={20} color={colors.success} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Notes - only if available */}
            {log.notes && (
              <TouchableOpacity 
                style={styles.notesContainer}
                onPress={handleNotesPress}
                activeOpacity={isCreator ? 0.7 : 1}
              >
                <Text style={styles.notesLabel}>{t('notes')}:</Text>
                <Text style={styles.notesText} numberOfLines={3}>
                  {log.notes}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
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
                      {t('date')}
                    </Text>
                  </View>
                  
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker 
                      value={tempDateTime}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      locale={language}
                      onChange={onDateTimeChange}
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
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerGradient: {
    flex: 1,
    padding: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editHint: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  workoutInfoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 12,
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
  workoutStatsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  workoutStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  partnersSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  partnersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partnersLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  partnersRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnersAvatars: {
    marginRight: 8,
  },
  notesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    padding: 10,
    position: 'relative',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontStyle: 'italic',
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