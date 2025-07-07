import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '../../../context/WorkoutContext';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

interface WorkoutBannerProps {
  bottomOffset?: number; // Offset from bottom for tab bar
}

const WorkoutBanner: React.FC<WorkoutBannerProps> = ({ 
  bottomOffset = 80 
}) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { 
    activeWorkout, 
    hasActiveWorkout, 
    isOnWorkoutPage,
    navigateToWorkout,
    endWorkout
  } = useWorkout();
  
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(100))[0]; // Start hidden below

  // Update visibility based on workout state and current page
  useEffect(() => {
    const shouldShow = hasActiveWorkout && !isOnWorkoutPage;
    
    if (shouldShow && !isVisible) {
      setIsVisible(true);
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else if (!shouldShow && isVisible) {
      // Slide down animation
      Animated.spring(slideAnim, {
        toValue: 100,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [hasActiveWorkout, isOnWorkoutPage, isVisible]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinueWorkout = () => {
    console.log('Banner: Navigating to workout...');
    navigateToWorkout();
  };

  const handleEndWorkout = () => {
    console.log('Banner: Ending workout...');
    endWorkout();
  };

  // Don't render anything if conditions aren't met
  if (!hasActiveWorkout || !activeWorkout) {
    return null;
  }

  // Don't render if on workout page (safety check)
  if (isOnWorkoutPage) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: palette.accent,
          bottom: bottomOffset,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Main banner content */}
      <TouchableOpacity
        style={styles.bannerContent}
        onPress={handleContinueWorkout}
        activeOpacity={0.8}
      >
        <View style={styles.leftContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="fitness" size={20} color="#FFFFFF" />
          </View>
          
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName} numberOfLines={1}>
              {activeWorkout.name || t('active_workout')}
            </Text>
            <View style={styles.workoutStats}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.duration}>
                {formatDuration(activeWorkout.duration)}
              </Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.exerciseCount}>
                {activeWorkout.exercises?.length || 0} {t('exercises')}
              </Text>
              {activeWorkout.isTimerActive && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <View style={styles.activeIndicator}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.activeText}>{t('active')}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.rightContent}>
          <View style={styles.continueButton}>
            <Text style={styles.continueText}>{t('continue')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>

      {/* End workout button */}
      <TouchableOpacity
        style={styles.endButton}
        onPress={handleEndWorkout}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 72,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingRight: 50, // Space for end button
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
    fontWeight: '600',
  },
  separator: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 8,
  },
  exerciseCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  activeText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  rightContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  continueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  endButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WorkoutBanner;