// components/ActiveWorkoutScreen.tsx - Main active workout interface with superset support
import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useRecentExerciseNames } from '../../../../hooks/query/useLogQuery';
import { createThemedStyles } from '../../../../utils/createThemedStyles';
import { 
  formatTime, 
  calculateWorkoutStats, 
  groupExercisesBySuperset, 
  getSupersetLabel 
} from '../utils/workoutUtils';

// Components
import RealtimeExerciseCard from './RealtimeExerciseCard';
import RealtimeExerciseSelector from '../RealtimeExerciseSelector';
import RestTimer from '../RestTimer';
import WorkoutCompleteModal from '../WorkoutCompleteModal';
import SupersetWorkoutView from './SupersetWorkoutView';

interface ActiveWorkoutScreenProps {
  handlers: any;
  workoutManager: any;
}

const ActiveWorkoutScreen: React.FC<ActiveWorkoutScreenProps> = ({
  handlers,
  workoutManager
}) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const styles = themedStyles(palette);
  
  const {
    activeWorkout,
    selectingExercise,
    setSelectingExercise,
    completeModalVisible,
    getAllSupersets
  } = workoutManager;

  const {
    handleNavigateToExercise,
    handleDeleteExercise,
    handleAddExercise,
    handleCompleteWorkout,
    handleSubmitWorkout,
    handleCancelCompleteWorkout,
    toggleTimer,
    setSelectingExercise: setSelectingExerciseHandler,
    handleCreateSuperset,
    handleRemoveFromSuperset,
    handleAddToSuperset,
    endWorkout
  } = handlers;

  // Refs
  const exerciseFlatListRef = useRef<FlatList>(null);
  const exerciseScrollViewRef = useRef<ScrollView>(null);

  // Data
  const { data: recentExerciseNames = [] } = useRecentExerciseNames(30, 15);

  if (!activeWorkout) return null;

  const exercises = activeWorkout.exercises || [];
  const currentExerciseIndex = activeWorkout.currentExerciseIndex || 0;
  const workoutDuration = activeWorkout.duration || 0;
  const workoutTimerActive = activeWorkout.isTimerActive || false;

  // Rest timer state from context
  const restTimerState = activeWorkout.restTimer;
  const restTimerActive = restTimerState?.isActive || false;
  const restTimeSeconds = restTimerState?.remainingSeconds || 0;

  // Calculate stats
  const stats = calculateWorkoutStats(exercises);
  const { totalSets, completedSets, completionPercentage, hasIncompleteExercises } = stats;

  // Get superset data
  const allSupersets = getAllSupersets();
  const { supersets, standalone } = groupExercisesBySuperset(exercises);
  const supersetGroups = Object.keys(supersets);

  // Get available supersets for adding exercises
  const availableSupersets = allSupersets.map((superset, index) => ({
    id: superset.id,
    label: getSupersetLabel(allSupersets.map(s => s.id), superset.id),
    exercises: superset.exercises
  }));

  const handleBackPress = () => {
    Alert.alert(
      t('exit_workout'),
      t('workout_will_continue_in_background'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('continue_later'),
          onPress: () => {/* navigate back */}
        },
        {
          text: t('end_workout'),
          style: 'destructive',
          onPress: () => endWorkout()
        }
      ]
    );
  };

  const stopRestTimer = () => {
    // This should be handled by the workout context
    // For now, we'll call the handler that should exist
  };

  const renderExercisePreviewCard = ({ item, index }) => {
    const status = { 
      completed: item.sets.filter(set => set.completed).length,
      total: item.sets.length,
      percentage: item.sets.length > 0 ? Math.round((item.sets.filter(set => set.completed).length / item.sets.length) * 100) : 0
    };
    const isActive = index === currentExerciseIndex;
    const hasCompletedSets = item.sets.some((set: any) => set.completed);
    
    return (
      <TouchableOpacity
        style={[
          styles.exerciseCard,
          isActive && styles.activeExerciseCard,
          item.superset_group && { borderLeftWidth: 3, borderLeftColor: palette.accent }
        ]}
        onPress={() => handleNavigateToExercise(index)}
      >
        {/* Superset badge */}
        {item.superset_group && (
          <View style={[styles.supersetBadge, { backgroundColor: palette.accent }]}>
            <Text style={styles.supersetBadgeText}>
              {getSupersetLabel(supersetGroups, item.superset_group)}
            </Text>
          </View>
        )}

        {/* Delete button - only show if exercise has no completed sets */}
        {!hasCompletedSets && (
          <TouchableOpacity
            style={[styles.deleteExerciseButton, { backgroundColor: palette.error }]}
            onPress={() => handleDeleteExercise(index)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        <View style={styles.exerciseCardHeader}>
          <View style={[
            styles.exerciseNumberBadge,
            isActive ? styles.activeExerciseNumberBadge : null
          ]}>
            <Text style={[
              styles.exerciseNumberText,
              isActive ? styles.activeExerciseNumberText : null
            ]}>
              {index + 1}
            </Text>
          </View>
          
          {status.completed === status.total && status.total > 0 ? (
            <Ionicons name="checkmark-circle" size={16} color={palette.success} />
          ) : status.completed > 0 ? (
            <Text style={[styles.partialCompleteText, { color: palette.warning }]}>
              {status.completed}/{status.total}
            </Text>
          ) : null}
        </View>
        
        <Text 
          style={[
            styles.exerciseCardName,
            isActive && styles.activeExerciseCardName
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        
        {/* Progress indicator */}
        <View style={styles.exerciseProgressContainer}>
          <View 
            style={[
              styles.exerciseProgress, 
              { 
                width: `${status.percentage}%`,
                backgroundColor: status.percentage === 100 
                  ? palette.success
                  : palette.warning
              }
            ]} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Workout Header */}
      <LinearGradient
        colors={[palette.accent, palette.highlight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.workoutHeader}
      >
        <View style={styles.headerLeftSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.workoutTitle} numberOfLines={1}>
            {activeWorkout.name}
          </Text>
        </View>
        
        <View style={styles.headerRightSection}>
          {/* Timer */}
          <TouchableOpacity 
            style={styles.timerContainer}
            onPress={toggleTimer}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={workoutTimerActive ? "pause-circle" : "play-circle"} 
              size={24} 
              color="#FFFFFF" 
              style={styles.timerIcon}
            />
            <Text style={styles.timerText}>
              {formatTime(workoutDuration)}
            </Text>
          </TouchableOpacity>
          
          {/* Complete Workout Button */}
          <TouchableOpacity
            style={[
              styles.completeWorkoutButton,
              { backgroundColor: hasIncompleteExercises ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.9)' }
            ]}
            onPress={handleCompleteWorkout}
          >
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
            <Text style={styles.completeWorkoutText}>{t('complete')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${completionPercentage}%`,
              backgroundColor: completionPercentage === 100 
                ? palette.success
                : palette.highlight
            }
          ]} 
        />
        <Text style={styles.progressText}>
          {completedSets} / {totalSets} {t('sets')} ({completionPercentage}%)
        </Text>
      </View>
      
      {/* Exercise List (Horizontal Cards) */}
      <View style={styles.exerciseListContainer}>
        <FlatList
          ref={exerciseFlatListRef}
          data={exercises}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => `exercise-preview-${index}`}
          contentContainerStyle={styles.exerciseListContent}
          renderItem={renderExercisePreviewCard}
          ListFooterComponent={
            <TouchableOpacity
              style={[styles.addExerciseCard, { borderColor: `${palette.accent}30` }]}
              onPress={() => setSelectingExercise(true)}
            >
              <View style={[styles.addExerciseIcon, { backgroundColor: `${palette.accent}20` }]}>
                <Ionicons name="add" size={24} color={palette.accent} />
              </View>
              <Text style={[styles.addExerciseText, { color: palette.accent }]}>
                {t('add')}
              </Text>
            </TouchableOpacity>
          }
        />
      </View>
      
      {/* Main Workout Content */}
      <View style={styles.workoutContent}>
        <ScrollView 
          ref={exerciseScrollViewRef}
          style={styles.exerciseArea}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length > 0 && currentExerciseIndex < exercises.length ? (
            <>
              {/* Current Exercise Card */}
              <RealtimeExerciseCard
                exercise={exercises[currentExerciseIndex]}
                exerciseIndex={currentExerciseIndex}
                onCompleteSet={handlers.handleCompleteSet}
                onUncompleteSet={handlers.handleUncompleteSet}
                onUpdateSet={handlers.handleUpdateSet}
                onUpdateExercise={handlers.handleUpdateExercise}
                onAddSet={handlers.handleAddSet}
                onRemoveSet={handlers.handleRemoveSet}
                themePalette={palette}
              />
              
              {/* Superset View */}
              {exercises[currentExerciseIndex].superset_group && (
                <SupersetWorkoutView
                  supersetGroup={exercises[currentExerciseIndex].superset_group}
                  exercises={exercises}
                  currentExerciseIndex={currentExerciseIndex}
                  onNavigateToExercise={handleNavigateToExercise}
                  onCreateSuperset={handleCreateSuperset}
                  themePalette={palette}
                />
              )}
              
              {/* Rest Timer */}
              {restTimerActive && (
                <RestTimer
                  initialSeconds={restTimeSeconds}
                  onComplete={stopRestTimer}
                  onCancel={stopRestTimer}
                  themePalette={palette}
                />
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={48} color={palette.text_secondary} />
              <Text style={[styles.emptyStateText, { color: palette.text_secondary }]}>
                {t('no_exercises_added')}
              </Text>
              <TouchableOpacity
                style={[styles.addExerciseButton, { backgroundColor: palette.highlight }]}
                onPress={() => setSelectingExercise(true)}
              >
                <Text style={styles.addExerciseButtonText}>
                  {t('add_exercise')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {/* Exercise Selector Modal */}
      <Modal
        visible={selectingExercise}
        animationType="slide"
        onRequestClose={() => setSelectingExercise(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalContainer}>
          <RealtimeExerciseSelector
            onSelectExercise={handleAddExercise}
            onCancel={() => setSelectingExercise(false)}
            themePalette={palette}
            recentExercises={recentExerciseNames}
          />
        </SafeAreaView>
      </Modal>
      
      {/* Complete Workout Modal */}
      <WorkoutCompleteModal
        visible={completeModalVisible}
        onSubmit={handleSubmitWorkout}
        onCancel={handleCancelCompleteWorkout}
        completionPercentage={completionPercentage}
        hasIncompleteExercises={hasIncompleteExercises}
        themePalette={palette}
        workoutName={activeWorkout.name}
        workoutDuration={workoutDuration}
        exercises={exercises}
      />
    </View>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 3,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  timerIcon: {
    marginRight: 6,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completeWorkoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 28,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.card_background,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    opacity: 0.7,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    zIndex: 1,
  },
  exerciseListContainer: {
    backgroundColor: palette.card_background,
    paddingVertical: 14,
  },
  exerciseListContent: {
    paddingHorizontal: 12,
  },
  exerciseCard: {
    width: 110,
    height: 90,
    marginRight: 10,
    padding: 10,
    backgroundColor: palette.input_background,
    borderRadius: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  activeExerciseCard: {
    backgroundColor: palette.accent,
    borderWidth: 2,
    borderColor: palette.highlight,
  },
  supersetBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  supersetBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteExerciseButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseNumberBadge: {
    width: 16,
    height: 16,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeExerciseNumberBadge: {
    backgroundColor: '#FFFFFF',
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeExerciseNumberText: {
    color: palette.accent,
  },
  partialCompleteText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  exerciseCardName: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.text_secondary,
    flex: 1,
  },
  activeExerciseCardName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  exerciseProgressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 6,
  },
  exerciseProgress: {
    height: '100%',
    borderRadius: 2,
  },
  addExerciseCard: {
    width: 80,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addExerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addExerciseText: {
    fontSize: 12,
    fontWeight: '500',
  },
  workoutContent: {
    flex: 1,
  },
  exerciseArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    backgroundColor: palette.card_background,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addExerciseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  bottomPadding: {
    height: 80,
  }
}));

export default ActiveWorkoutScreen;