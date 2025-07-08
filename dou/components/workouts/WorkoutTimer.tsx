// components/workouts/WorkoutTimer.tsx
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface WorkoutTimerProps {
  isActive: boolean;
  initialSeconds?: number;
  onUpdate?: (seconds: number) => void;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const WorkoutTimer = forwardRef<any, WorkoutTimerProps>(({ 
  isActive, 
  initialSeconds = 0,
  onUpdate 
}, ref) => {
  const { palette } = useTheme();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(!isActive);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    reset: () => {
      setSeconds(0);
      if (onUpdate) onUpdate(0);
    },
    pause: () => {
      setIsPaused(true);
    },
    resume: () => {
      setIsPaused(false);
    },
    getTime: () => seconds
  }));
  
  // Effect for timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev + 1;
          if (onUpdate) onUpdate(newValue);
          return newValue;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, onUpdate]);
  
  // Update isPaused when isActive changes
  useEffect(() => {
    setIsPaused(!isActive);
  }, [isActive]);
  
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.timerContainer,
          { backgroundColor: palette.card_background }
        ]}
        onPress={togglePause}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isPaused ? "play" : "pause"} 
          size={14} 
          color={palette.highlight} 
          style={styles.icon}
        />
        <Text style={[styles.timerText, { color: palette.text }]}>
          {formatTime(seconds)}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  icon: {
    marginRight: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default WorkoutTimer;