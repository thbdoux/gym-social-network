// components/workouts/ProgramCalendar.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

interface Workout {
  id: number;
  name: string;
  preferred_weekday: number;
  focus?: string;
  exercises?: any[];
}

interface ProgramCalendarProps {
  workouts: Workout[];
  onDaySelect?: (day: number | null) => void;
  selectedDay: number | null;
  onWorkoutMove?: (workoutId: number, fromDay: number, toDay: number) => Promise<void>;
  readOnly?: boolean;
}

const ProgramCalendar: React.FC<ProgramCalendarProps> = ({
  workouts,
  onDaySelect,
  selectedDay,
  onWorkoutMove,
  readOnly = false
}) => {
  const { t } = useLanguage();
  const [draggingWorkout, setDraggingWorkout] = useState<null | {
    id: number;
    day: number;
  }>(null);
  const [dropTargetDay, setDropTargetDay] = useState<number | null>(null);
  
  const pan = useRef(new Animated.ValueXY()).current;
  const screenWidth = Dimensions.get('window').width;
  const dayWidth = (screenWidth - 32 - 16) / 7; // 7 days per week, 16px padding on each side, 16px for scrollbar
  
  // Create pan responder for drag-and-drop
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !readOnly,
      onMoveShouldSetPanResponder: () => !readOnly,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ 
          x: gestureState.dx, 
          y: Math.min(Math.max(gestureState.dy, -20), 20) // Limit vertical movement
        });
        
        // Calculate which day we're over
        if (draggingWorkout) {
          const totalDx = pan.x._value;
          const dayOffset = Math.round(totalDx / dayWidth);
          const targetDay = Math.min(Math.max(draggingWorkout.day + dayOffset, 0), 6);
          
          if (targetDay !== dropTargetDay) {
            setDropTargetDay(targetDay);
          }
        }
      },
      onPanResponderRelease: async () => {
        if (draggingWorkout && dropTargetDay !== null && dropTargetDay !== draggingWorkout.day) {
          // Execute the move
          if (onWorkoutMove) {
            await onWorkoutMove(draggingWorkout.id, draggingWorkout.day, dropTargetDay);
          }
        }
        
        // Reset state
        setDraggingWorkout(null);
        setDropTargetDay(null);
        pan.setValue({ x: 0, y: 0 });
        pan.flattenOffset();
      }
    })
  ).current;
  
  // Weekday names
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Group workouts by day
  const workoutsByDay = weekdays.map((_, dayIndex) => {
    return workouts.filter(workout => workout.preferred_weekday === dayIndex);
  });
  
  // Get color for workout card based on focus
  const getWorkoutColor = (focus?: string) => {
    switch(focus) {
      case 'strength': return '#7e22ce'; // Purple
      case 'hypertrophy': return '#4f46e5'; // Indigo
      case 'cardio': return '#ef4444'; // Red
      case 'endurance': return '#3b82f6'; // Blue
      case 'weight_loss': return '#10b981'; // Green
      case 'strength_hypertrophy': return '#8b5cf6'; // Violet
      default: return '#6b7280'; // Gray
    }
  };
  
  // Handle long press to start drag
  const handleWorkoutLongPress = (workout: Workout) => {
    if (readOnly) return;
    
    setDraggingWorkout({
      id: workout.id,
      day: workout.preferred_weekday
    });
  };
  
  return (
    <View style={styles.container}>
      {/* Day Headers */}
      <View style={styles.weekdaysRow}>
        {weekdays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayHeader,
              selectedDay === index && styles.selectedDayHeader,
              dropTargetDay === index && styles.dropTargetDay
            ]}
            onPress={() => onDaySelect && onDaySelect(selectedDay === index ? null : index)}
          >
            <Text style={[
              styles.dayText,
              selectedDay === index && styles.selectedDayText
            ]}>
              {day}
            </Text>
            
            {workoutsByDay[index].length > 0 && (
              <View style={[
                styles.dayIndicator,
                { backgroundColor: getWorkoutColor(workoutsByDay[index][0].focus) }
              ]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Day Columns with Workouts */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.daysContainer}>
          {weekdays.map((_, dayIndex) => (
            <View 
              key={dayIndex} 
              style={[
                styles.dayColumn,
                selectedDay === dayIndex && styles.selectedDayColumn,
                dropTargetDay === dayIndex && styles.dropTargetColumn
              ]}
            >
              {workoutsByDay[dayIndex].map((workout) => (
                <Animated.View
                  key={workout.id}
                  style={[
                    styles.workoutCard,
                    { backgroundColor: getWorkoutColor(workout.focus) },
                    draggingWorkout?.id === workout.id && {
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: 1.05 }
                      ],
                      zIndex: 1000,
                      elevation: 8,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                    }
                  ]}
                  {...(draggingWorkout?.id === workout.id ? panResponder.panHandlers : {})}
                >
                  <TouchableOpacity
                    style={styles.workoutCardContent}
                    onLongPress={() => handleWorkoutLongPress(workout)}
                    delayLongPress={200}
                  >
                    <Text style={styles.workoutName} numberOfLines={1}>
                      {workout.name}
                    </Text>
                    
                    {workout.exercises && (
                      <Text style={styles.exerciseCount}>
                        {workout.exercises.length} {t('exercises')}
                      </Text>
                    )}
                    
                    {!readOnly && (
                      <View style={styles.dragHandle}>
                        <Ionicons name="menu" size={14} color="rgba(255, 255, 255, 0.7)" />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
              
              {/* Empty state for day */}
              {workoutsByDay[dayIndex].length === 0 && (
                <View style={styles.emptyDay}>
                  <Text style={styles.emptyDayText}>
                    {t('no_workouts')}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Drag Instructions */}
      {!readOnly && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            <Ionicons name="information-circle-outline" size={14} color="rgba(255, 255, 255, 0.6)" /> {t('long_press_to_drag')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  weekdaysRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    paddingVertical: 12,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedDayHeader: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  dropTargetDay: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  dayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 150,
  },
  dayColumn: {
    width: 120,
    marginHorizontal: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  selectedDayColumn: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  dropTargetColumn: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderStyle: 'dashed',
  },
  workoutCard: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  workoutCardContent: {
    padding: 12,
    minHeight: 60,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dragHandle: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
  },
  emptyDay: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  emptyDayText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  instructionsContainer: {
    padding: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
  },
  instructionsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default ProgramCalendar;