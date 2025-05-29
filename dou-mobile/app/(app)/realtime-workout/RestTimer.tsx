import React, { useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onCancel: () => void;
  onPause?: () => void;
  onResume?: () => void;
  themePalette: any;
}

const RestTimer: React.FC<RestTimerProps> = ({
  seconds,
  onComplete,
  onCancel,
  onPause,
  onResume,
  themePalette,
}) => {
  const { t } = useLanguage();
  const [timerActive, setTimerActive] = useState(true);
  
  // Use the passed seconds directly instead of managing countdown
  const remainingSeconds = seconds;
  const totalSeconds = useRef(seconds).current;
  
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const progressAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  // Start animations when component mounts
  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    // Progress animation - use remaining vs total
    const progressValue = remainingSeconds / totalSeconds;
    progressAnim.setValue(progressValue);

    // Pulse animation for active state
    const createPulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (timerActive && remainingSeconds > 0) {
          createPulse();
        }
      });
    };
    
    if (timerActive) {
      createPulse();
    }
  }, [timerActive, remainingSeconds]);
  
  // Handle completion when seconds reach 0
  useEffect(() => {
    if (remainingSeconds <= 0) {
      // Vibrate when timer ends
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate(500);
      }
      handleComplete();
    }
  }, [remainingSeconds]);
  
  // Handle complete animation and callback
  const handleComplete = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };
  
  // Handle cancel animation and callback
  const handleCancel = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onCancel();
    });
  };
  
  // Toggle timer pause/resume
  const toggleTimer = () => {
    const newState = !timerActive;
    setTimerActive(newState);
    
    if (newState && onResume) {
      onResume();
    } else if (!newState && onPause) {
      onPause();
    }
  };
  
  // Calculate progress color based on remaining time
  const getProgressColor = () => {
    const percentage = remainingSeconds / totalSeconds;
    if (percentage > 0.6) return themePalette.success;
    if (percentage > 0.3) return themePalette.warning;
    return themePalette.error;
  };

  // Format time display
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSecs.toString().padStart(2, '0')}`;
    }
    return secs.toString();
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getProgressColor(),
          transform: [
            { translateY: slideAnim },
            { scale: pulseAnim }
          ],
        },
      ]}
    >
      {/* Progress bar background */}
      <Animated.View
        style={[
          styles.progressBackground,
          {
            width: `${Math.max(0, (remainingSeconds / totalSeconds) * 100)}%`,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          },
        ]}
      />
      
      <View style={styles.timerContent}>
        {/* Left side - Timer display */}
        <View style={styles.leftContent}>
          <View style={styles.timerDisplay}>
            <Ionicons name="timer-outline" size={20} color="#FFFFFF" />
            <Text style={styles.restLabel}>{t('rest')}</Text>
            <Text style={styles.timerValue}>
              {formatTime(remainingSeconds)}
            </Text>
          </View>
        </View>
        
        {/* Right side - Action buttons */}
        <View style={styles.rightContent}>
          <TouchableOpacity
            style={[styles.actionButton, styles.pauseButton]}
            onPress={toggleTimer}
          >
            <Ionicons
              name={timerActive ? 'pause' : 'play'}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={handleCancel}
          >
            <Ionicons name="play-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Timer completion indicator */}
      {remainingSeconds <= 5 && remainingSeconds > 0 && (
        <View style={styles.urgentIndicator}>
          <Text style={styles.urgentText}>
            {remainingSeconds}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 60,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 12,
  },
  timerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  leftContent: {
    flex: 1,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 12,
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 40,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  urgentIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 3,
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RestTimer;