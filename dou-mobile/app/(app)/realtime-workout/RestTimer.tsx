
import React, { useState, useEffect } from 'react';
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
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onCancel: () => void;
  themePalette: any;
}

const RestTimer: React.FC<RestTimerProps> = ({
  seconds,
  onComplete,
  onCancel,
  themePalette,
}) => {
  const { t } = useLanguage();
  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  const [timerActive, setTimerActive] = useState(true);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const progressAnim = React.useRef(new Animated.Value(1)).current;
  
  // Start animations when component mounts
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: seconds * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, []);
  
  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive) {
      interval = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval as NodeJS.Timeout);
            // Vibrate when timer ends
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              Vibration.vibrate(500);
            }
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);
  
  // Handle complete animation and callback
  const handleComplete = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };
  
  // Handle cancel animation and callback
  const handleCancel = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCancel();
    });
  };
  
  // Toggle timer pause/resume
  const toggleTimer = () => {
    setTimerActive(prev => !prev);
  };
  
  // Calculate progress color based on remaining time
  const getProgressColor = () => {
    const percentage = remainingSeconds / seconds;
    if (percentage > 0.6) return themePalette.success;
    if (percentage > 0.3) return themePalette.warning;
    return themePalette.error;
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <BlurView intensity={80} tint="dark" style={styles.blurView} />
      
      <View style={styles.timerContent}>
        {/* Top text */}
        <Text style={[styles.restText, { color: themePalette.text }]}>
          {t('rest_timer')}
        </Text>
        
        {/* Timer circle */}
        <View style={styles.timerCircleContainer}>
          <Animated.View
            style={[
              styles.progressCircle,
              {
                backgroundColor: getProgressColor(),
                opacity: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                transform: [
                  {
                    scale: progressAnim,
                  },
                ],
              },
            ]}
          />
          
          <View style={styles.timerInnerCircle}>
            <Text style={[styles.timerValue, { color: themePalette.text }]}>
              {remainingSeconds}
            </Text>
            <Text style={[styles.timerUnit, { color: themePalette.text_secondary }]}>
              {t('seconds')}
            </Text>
          </View>
        </View>
        
        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: themePalette.border }]}
            onPress={handleCancel}
          >
            <Ionicons name="close" size={20} color={themePalette.text} />
            <Text style={[styles.buttonText, { color: themePalette.text }]}>
              {t('skip')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              timerActive ? styles.pauseButton : styles.resumeButton,
              {
                backgroundColor: timerActive
                  ? `${themePalette.warning}40`
                  : `${themePalette.success}40`,
                borderColor: timerActive
                  ? themePalette.warning
                  : themePalette.success,
              },
            ]}
            onPress={toggleTimer}
          >
            <Ionicons
              name={timerActive ? 'pause' : 'play'}
              size={20}
              color={timerActive ? themePalette.warning : themePalette.success}
            />
            <Text
              style={[
                styles.buttonText,
                {
                  color: timerActive
                    ? themePalette.warning
                    : themePalette.success,
                },
              ]}
            >
              {timerActive ? t('pause') : t('resume')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  timerContent: {
    width: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  restText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timerCircleContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  progressCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  timerInnerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  timerUnit: {
    fontSize: 14,
    marginTop: -4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    width: '48%',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  pauseButton: {},
  resumeButton: {},
  buttonText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RestTimer;