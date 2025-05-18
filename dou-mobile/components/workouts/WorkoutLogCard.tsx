// components/workouts/WorkoutLogCard.tsx
import React, { useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useGym } from '../../hooks/query/useGymQuery';
import { useTheme } from '../../context/ThemeContext';

interface WorkoutLogCardProps {
  logId: number;
  log: {
    id: number;
    name: string;
    date: string;
    username?: string;
    program?: number;
    program_name?: string;
    gym?: number;
    gym_name?: string;
    completed: boolean;
    mood_rating?: number;
    perceived_difficulty?: number;
    exercises?: any[];
    duration?: number;
    notes?: string;
  };
  user: string;
  inFeedMode?: boolean;
  onFork?: (log: any) => Promise<void>;
  // Selection mode props
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onLongPress?: () => void;
  disableNavigation?: boolean;
  onWorkoutLogClick?: (logId: number) => void;
}

const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({
  logId,
  log,
  user,
  inFeedMode = false,
  onFork,
  // Selection mode props
  selectionMode = false,
  isSelected = false,
  onSelect,
  onLongPress,
  disableNavigation = false,
  onWorkoutLogClick,
}) => {
  const { t } = useLanguage();
  const { workoutLogPalette } = useTheme();
  const isOwner = user === log.username;
  // Animation for selection mode
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const { data: gym } = useGym(log.gym);

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

  // Format the date
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      // Check if date is in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      // Otherwise try standard parsing
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString; // If parsing fails, return the original string
    }
  };

  // Get mood emoji based on rating
  const getMoodEmoji = (rating?: number): string => {
    if (!rating) return '😐';
    if (rating >= 4.5) return '😀';
    if (rating >= 3.5) return '🙂';
    if (rating >= 2.5) return '😐';
    if (rating >= 1.5) return '😕';
    return '😞';
  };

  // Get difficulty indicator based on rating
  const getDifficultyIndicator = (rating?: number): string => {
    if (!rating) return '🔥';
    if (rating >= 8) return '🔥🔥🔥';
    if (rating >= 5) return '🔥🔥';
    return '🔥';
  };

  const handleCardPress = () => {
    if (selectionMode) {
      onSelect && onSelect();
    } else if (disableNavigation) {
      // If navigation is disabled, do nothing or trigger onSelect if provided
      onSelect && onSelect();
    } else if (onWorkoutLogClick) {
      // Use the external handler if provided
      onWorkoutLogClick(logId);
    } else {
      // Original navigation as fallback
      router.push(`/workout-log/${logId}`);
    }
  };

  const handleFork = (e: any) => {
    e.stopPropagation();
    if (onFork) {
      onFork(log);
    }
  };
  
  const handleLongPress = () => {
    onLongPress && onLongPress();
  };

  // Get Exercise count
  const exerciseCount = log.exercises?.length || 0;
  
  // First 3 exercise names for display
  const exerciseNames = log.exercises?.slice(0, 3).map(ex => ex.name || "Exercise") || [];
  
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
          { backgroundColor: workoutLogPalette.background },
          isSelected && [styles.selectedContainer, { borderColor: workoutLogPalette.text }]
        ]}
      >
        {/* Completed indicator strip */}
        {log.completed && <View style={[styles.completedStrip, { backgroundColor: workoutLogPalette.text }]} />}
        
        {/* Selection indicator */}
        {selectionMode && (
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.checkbox,
              isSelected && [styles.checkboxSelected, { backgroundColor: workoutLogPalette.background }]
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </View>
        )}
        
        {/* Delete button (X) that appears when in selection mode */}
        {selectionMode && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={onSelect}
          >
            <View style={styles.deleteCircle}>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
                
        {/* Main content */}
        <View style={styles.cardContent}>
          {/* Top row with workout log badge and fork button
          <View style={styles.badgeActionRow}>
            {!isOwner && !selectionMode && (
              <TouchableOpacity 
                style={[styles.forkButton, { backgroundColor: workoutLogPalette.action_bg }]}
                onPress={handleFork}
              >
                <Ionicons name="download-outline" size={14} color={workoutLogPalette.highlight} />
                <Text style={[styles.forkText, { color: workoutLogPalette.highlight }]}>
                  {t('fork')}
                </Text>
              </TouchableOpacity>
            )}
          </View> */}
          
          {/* Title and completed/pending status container */}
          <View style={styles.titleStatusContainer}>
            <Text style={[styles.title, { color: workoutLogPalette.text }]} numberOfLines={1}>
              {log.name}
            </Text>
          </View>
          
          {/* Date and location container */}
          <View style={styles.dateLocationRow}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={12} color={workoutLogPalette.text} />
              <Text style={[styles.dateText, { color: workoutLogPalette.text }]}>
                {formatDate(log.date)}
              </Text>
              <View style={[
                styles.statusDot,
                log.completed 
                  ? [styles.completedDot, { backgroundColor: workoutLogPalette.text }] 
                  : [styles.pendingDot, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }]
              ]} />
            </View>
            
            {gym ? (
              <View style={styles.gymContainer}>
                <Ionicons name="location" size={12} color={workoutLogPalette.text} />
                <Text style={[styles.gymText, { color: workoutLogPalette.text_secondary }]}>
                  {`${gym.name} - ${gym.location}`}
                </Text>
              </View>
            ) : log.gym_name ? (
              <View style={styles.gymContainer}>
                <Ionicons name="location" size={12} color={workoutLogPalette.text} />
                <Text style={[styles.gymText, { color: workoutLogPalette.text_secondary }]}>
                  {log.gym_name}
                </Text>
              </View>
            ) : null}
          </View>
          
          {/* Program name if available */}
          {log.program_name && (
            <View style={styles.programRow}>
              <Ionicons name="barbell-outline" size={12} color={workoutLogPalette.text_secondary} />
              <Text style={[styles.programText, { color: workoutLogPalette.text }]} numberOfLines={1}>
                {log.program_name}
              </Text>
            </View>
          )}
          
          {/* Stats row
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: workoutLogPalette.text_secondary }]}>
                {t('exercises')}
              </Text>
              <Text style={[styles.statValue, { color: workoutLogPalette.text }]}>
                {exerciseCount}
              </Text>
            </View>
            
            {log.duration && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: workoutLogPalette.text_secondary }]}>
                  {t('duration')}
                </Text>
                <Text style={[styles.statValue, { color: workoutLogPalette.text }]}>
                  {`${log.duration}m`}
                </Text>
              </View>
            )}
            
            {log.mood_rating && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: workoutLogPalette.text_secondary }]}>
                  {t('mood')}
                </Text>
                <Text style={styles.moodValue}>
                  {getMoodEmoji(log.mood_rating)}
                </Text>
              </View>
            )}
            
            {log.perceived_difficulty && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: workoutLogPalette.text_secondary }]}>
                  {t('difficulty')}
                </Text>
                <Text style={styles.difficultyValue}>
                  {getDifficultyIndicator(log.perceived_difficulty)}
                </Text>
              </View>
            )}
          </View> */}
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
    position: 'relative',
  },
  selectedContainer: {
    borderWidth: 2,
  },
  completedStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    padding: 16,
  },

  badgeActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },

  workoutLogBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  workoutLogBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  forkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  forkText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  titleStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  dateLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  gymContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gymText: {
    fontSize: 14,
    marginLeft: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  completedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 4,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dateLocationContainer: {
    flex: 1,
    marginRight: 8,
  },

  completedDot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  pendingDot: {
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
  },

  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  programText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moodValue: {
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  difficultyValue: {
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  exerciseRow: {
    flexDirection: 'row',
    padding: 0,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  exerciseBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    maxWidth: 120,
  },
  exerciseName: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  moreText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  spacer: {
    flex: 1,
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
    backgroundColor: '#16a34a',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  deleteCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#111827',
  }
});

export default WorkoutLogCard;