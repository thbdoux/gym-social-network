// components/workouts/WorkoutCard.tsx
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
import { useTheme } from '../../context/ThemeContext';

interface WorkoutCardProps {
  workoutId: number;
  workout: {
    id: number;
    name: string;
    description?: string;
    split_method?: string;
    difficulty_level?: string;
    estimated_duration?: number;
    equipment_required?: string[];
    tags?: string[];
    is_public?: boolean;
    exercises?: any[];
    // Instance specific
    preferred_weekday?: number;
    order?: number;
    program?: number;
    program_name?: string;
    // Additional props that might be added by services
    workout_name?: string;
    date?: string;
    gym_name?: string;
    exercise_count?: number;
  };
  isTemplate?: boolean;
  user: string;
  onFork?: (workout: any) => Promise<void>;
  onAddToProgram?: (workout: any) => void;
  // Selection mode props
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onLongPress?: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workoutId,
  workout,
  isTemplate = true,
  user,
  onFork,
  onAddToProgram,
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
  
  // Get workout display name
  const workoutName = workout.workout_name || workout.name;
  
  // Get exercise count
  const exerciseCount = workout.exercise_count || workout.exercises?.length || 0;
  
  // First 3 exercise names for display
  const exerciseNames = workout.exercises?.slice(0, 3).map(ex => ex.name || "Exercise") || [];
  
  // Get weekday name if instance
  const getWeekdayName = (day?: number): string => {
    if (day === undefined) return '';
    // Using hardcoded weekday names since these translations might not exist yet
    const weekdays = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'),t('sunday')];
    return weekdays[day];
  };
  
  // Get difficulty indicator based on level
  const getDifficultyIndicator = (level?: string): string => {
    if (!level) return '🔥';
    switch(level?.toLowerCase()) {
      case 'beginner': return '🔥';
      case 'intermediate': return '🔥🔥';
      case 'advanced': return '🔥🔥🔥';
      default: return '🔥';
    }
  };

  const handleCardPress = () => {
    if (selectionMode) {
      onSelect && onSelect();
    } else {
      if (isTemplate) {
        // Template path - go to workout template detail
        router.push(`/workout/${workoutId}`);
      } else {
        // Instance path - go to program workout detail
        // We need both the program ID and workout ID
        if (workout.program) {
          router.push(`/program-workout/${workout.program}/${workoutId}`);
        } else {
          // Fallback if program ID is missing
          console.warn("Program ID missing for workout instance", workoutId);
          router.push(`/workout/${workoutId}`);
        }
      }
    }
  };

  const handleFork = (e: any) => {
    e.stopPropagation();
    if (onFork) {
      onFork(workout);
    }
  };
  
  const handleAddToProgram = (e: any) => {
    e.stopPropagation();
    if (onAddToProgram) {
      onAddToProgram(workout);
    }
  };
  
  const handleLongPress = () => {
    onLongPress && onLongPress();
  };
  
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
          {/* Top row with type, difficulty and weekday if instance */}
          <View style={styles.topRow}>
            {!isTemplate && workout.preferred_weekday !== undefined && (
              <View style={styles.weekdayBadge}>
                <Text style={[styles.weekdayText, { color: workoutPalette.highlight }]}>
                  {getWeekdayName(workout.preferred_weekday)}
                </Text>
              </View>
            )}
          </View>
          
          {/* Workout title */}
          <Text style={[styles.title, { color: workoutPalette.text }]} numberOfLines={1}>
            {workoutName}
          </Text>
          
          {/* Program name if available and is instance */}
          {!isTemplate && workout.program_name && (
            <View style={styles.programRow}>
              <Ionicons name="calendar-outline" size={12} color={workoutPalette.text_secondary} />
              <Text style={[styles.programText, { color: workoutPalette.text }]} numberOfLines={1}>
                {workout.program_name}
              </Text>
            </View>
          )}
          
          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: workoutPalette.text_secondary }]}>
                {t('exercises')}
              </Text>
              <Text style={[styles.statValue, { color: workoutPalette.text }]}>
                {exerciseCount}
              </Text>
            </View>
            
            {workout.estimated_duration && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: workoutPalette.text_secondary }]}>
                  {t('duration')}
                </Text>
                <Text style={[styles.statValue, { color: workoutPalette.text }]}>
                  {workout.estimated_duration}m
                </Text>
              </View>
            )}
            
            {workout.equipment_required && workout.equipment_required.length > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: workoutPalette.text_secondary }]}>
                  {t('equipment')}
                </Text>
                <Text style={[styles.statValue, { color: workoutPalette.text }]}>
                  {workout.equipment_required.length}
                </Text>
              </View>
            )}
            
            {workout.tags && workout.tags.length > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: workoutPalette.text_secondary }]}>
                  Tags
                </Text>
                <Text style={[styles.statValue, { color: workoutPalette.text }]}>
                  {workout.tags.length}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Exercise bubbles */}
        {/* {exerciseCount > 0 && (
          <View style={styles.exerciseRow}>
            {exerciseNames.map((name, index) => (
              <View key={index} style={styles.exerciseBubble}>
                <Text style={[styles.exerciseName, { color: workoutPalette.highlight }]} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ))}
            {exerciseCount > 3 && (
              <View style={styles.moreBubble}>
                <Text style={[styles.moreText, { color: workoutPalette.highlight }]}>
                  +{exerciseCount - 3}
                </Text>
              </View>
            )}
          </View>
        )} */}
  
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
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyContainer: {
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekdayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  spacer: {
    flex: 1,
  },
  actionButton: {
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
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
    backgroundColor: '#0ea5e9',
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

export default WorkoutCard;