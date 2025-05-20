// components/workouts/SwipeIndicator.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VIEW_ORDER } from './ViewSelector';

interface SwipeIndicatorProps {
  currentView: string;
}

const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({ currentView }) => {
  return (
    <View style={styles.swipeIndicatorContainer}>
      {VIEW_ORDER.map((viewType) => (
        <View 
          key={viewType} 
          style={[
            styles.swipeIndicator, 
            currentView === viewType && styles.activeSwipeIndicator,
            { backgroundColor: currentView === viewType ? 
              (viewType === 'programs' ? '#7e22ce' : 
              viewType === 'workout_history' ? '#16a34a' : '#2563eb')
              : '#4B5563' 
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  swipeIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  swipeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  activeSwipeIndicator: {
    width: 16,
    opacity: 1,
  },
});

export default SwipeIndicator;