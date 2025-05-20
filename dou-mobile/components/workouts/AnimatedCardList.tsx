// components/workouts/AnimatedCardList.tsx
import React, { useRef } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Animated, 
  PanResponder, 
  RefreshControl, 
  Dimensions 
} from 'react-native';
import EmptyStateView from './EmptyStateView';
import ProgramCard from './ProgramCard';
import WorkoutLogCard from './WorkoutLogCard';
import WorkoutCard from './WorkoutCard';
import GroupWorkoutCard from './GroupWorkoutCard';

const { width } = Dimensions.get('window');

interface AnimatedCardListProps {
  currentView: string;
  data: any[];
  refreshing: boolean;
  onRefresh: () => void;
  user: any;
  onNavigateToNextView: () => void;
  onNavigateToPreviousView: () => void;
  selectionMode: boolean;
  selectedItems: number[];
  onItemSelect: (id: number) => void;
  onItemLongPress: (id: number) => void;
  onForkProgram?: (id: number) => void;
  onToggleActiveProgram?: (id: number) => void;
  onForkWorkoutLog?: (log: any) => void;
  onForkTemplate?: (template: any) => void;
  onAddTemplateToProgram?: (template: any) => void;
  onJoinGroupWorkout?: (groupWorkoutId: number) => void;
  onLeaveGroupWorkout?: (groupWorkoutId: number) => void;
  swipeAnim: Animated.Value;
  contentOpacity: Animated.Value;
  themePalette?: any;
}

const AnimatedCardList: React.FC<AnimatedCardListProps> = ({
  currentView,
  data,
  refreshing,
  onRefresh,
  user,
  onNavigateToNextView,
  onNavigateToPreviousView,
  selectionMode,
  selectedItems,
  onItemSelect,
  onItemLongPress,
  onForkProgram,
  onToggleActiveProgram,
  onForkWorkoutLog,
  onForkTemplate,
  onAddTemplateToProgram,
  onJoinGroupWorkout,
  onLeaveGroupWorkout,
  swipeAnim,
  contentOpacity,
  themePalette
}) => {
  // Create PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !refreshing && !selectionMode,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only handle horizontal movements greater than 10px
        return !refreshing && !selectionMode && Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        // When gesture starts
        swipeAnim.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update animation value as user swipes
        swipeAnim.setValue(gestureState.dx);
        
        // Adjust opacity based on swipe distance
        const opacityValue = 1 - Math.min(Math.abs(gestureState.dx) / (width * 0.5), 0.5);
        contentOpacity.setValue(opacityValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Determine if swipe was significant enough to change view
        const swipeThreshold = width * 0.25; // 25% of screen width
        
        if (gestureState.dx > swipeThreshold) {
          // Swipe right - go to previous view
          onNavigateToPreviousView();
        } else if (gestureState.dx < -swipeThreshold) {
          // Swipe left - go to next view
          onNavigateToNextView();
        } else {
          // Not enough to trigger a view change, return to center
          Animated.parallel([
            Animated.spring(swipeAnim, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
              tension: 40
            }),
            Animated.timing(contentOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true
            })
          ]).start();
        }
      }
    })
  ).current;

  // Enhanced function to handle participation actions for group workouts
  const handleParticipatePress = (groupWorkoutId: number) => {
    const groupWorkout = data.find(item => item.id === groupWorkoutId);
    
    if (!groupWorkout) return;
    
    // If user is the creator, no participation actions needed
    if (groupWorkout.is_creator) {
      return;
    }
    
    // Handle based on current user status
    switch (groupWorkout.current_user_status) {
      case 'joined':
        // User is already joined - leave the workout
        onLeaveGroupWorkout && onLeaveGroupWorkout(groupWorkoutId);
        break;
      case 'invited':
        // User is invited - accept the invitation (join)
        onJoinGroupWorkout && onJoinGroupWorkout(groupWorkoutId);
        break;
      case 'request_pending':
        // Request is pending - do nothing (already requested)
        break;
      case 'declined':
      case 'removed':
      case 'request_rejected':
        // These states might need special handling - for now, try to join again
        onJoinGroupWorkout && onJoinGroupWorkout(groupWorkoutId);
        break;
      default:
        // Not participating yet - join or request to join
        onJoinGroupWorkout && onJoinGroupWorkout(groupWorkoutId);
        break;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.cardStack,
        {
          transform: [{ translateX: swipeAnim }],
          opacity: contentOpacity
        }
      ]}
      {...panResponder.panHandlers}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.cardStackContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
        // Disable horizontal scrolling since we're using PanResponder
        horizontal={false}
        showsHorizontalScrollIndicator={false}
      >
        {data.length === 0 ? (
          <EmptyStateView currentView={currentView} />
        ) : (
          <View style={styles.cardsContainer}>
            {currentView === 'programs' && 
              data.map((program) => (
                <View key={`program-${program.id}`} style={styles.cardContainer}>
                  <ProgramCard
                    programId={program.id}
                    program={program}
                    currentUser={user?.username}
                    onFork={onForkProgram}
                    onToggleActive={onToggleActiveProgram}
                    selectionMode={selectionMode}
                    isSelected={selectedItems.includes(program.id)}
                    onSelect={() => onItemSelect(program.id)}
                    onLongPress={() => onItemLongPress(program.id)}
                  />
                </View>
              ))
            }
            
            {currentView === 'workout_history' && 
              data.map((log) => (
                <View key={`log-${log.id}`} style={styles.cardContainer}>
                  <WorkoutLogCard
                    logId={log.id}
                    log={log}
                    user={user?.username}
                    onFork={onForkWorkoutLog}
                    selectionMode={selectionMode}
                    isSelected={selectedItems.includes(log.id)}
                    onSelect={() => onItemSelect(log.id)}
                    onLongPress={() => onItemLongPress(log.id)}
                  />
                </View>
              ))
            }
            
            {currentView === 'templates' && 
              data.map((template) => (
                <View key={`template-${template.id}`} style={styles.cardContainer}>
                  <WorkoutCard
                    workoutId={template.id}
                    workout={template}
                    isTemplate={true}
                    user={user?.username}
                    onFork={onForkTemplate}
                    onAddToProgram={onAddTemplateToProgram}
                    selectionMode={selectionMode}
                    isSelected={selectedItems.includes(template.id)}
                    onSelect={() => onItemSelect(template.id)}
                    onLongPress={() => onItemLongPress(template.id)}
                  />
                </View>
              ))
            }
            
            {currentView === 'group_workouts' && 
              data.map((groupWorkout, index) => (
                <View key={`group-workout-${groupWorkout.id}-${index}`} style={styles.cardContainer}>
                  <GroupWorkoutCard
                    groupWorkoutId={groupWorkout.id}
                    groupWorkout={groupWorkout}
                    onParticipatePress={handleParticipatePress}
                    selectionMode={selectionMode}
                    isSelected={selectedItems.includes(groupWorkout.id)}
                    onSelect={() => onItemSelect(groupWorkout.id)}
                    onLongPress={() => onItemLongPress(groupWorkout.id)}
                  />
                </View>
              ))
            }
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardStack: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  cardStackContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  cardsContainer: {
    marginTop: 12,
  },
  cardContainer: {
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default AnimatedCardList;