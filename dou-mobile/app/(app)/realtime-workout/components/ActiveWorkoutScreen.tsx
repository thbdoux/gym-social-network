// components/ActiveWorkoutScreen.tsx - Main active workout interface
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  SafeAreaView,
  Alert,
  TextInput,
  Pressable,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useRecentExerciseNames } from '../../../../hooks/query/useLogQuery';
import { createThemedStyles } from '../../../../utils/createThemedStyles';
import { 
  formatTime, 
  calculateWorkoutStats, 
} from '../utils/workoutUtils';

// Components
import RealtimeExerciseCard from './RealtimeExerciseCard';
import RealtimeExerciseSelector from '../RealtimeExerciseSelector';
import RestTimer from '../RestTimer';
import WorkoutCompleteModal from '../WorkoutCompleteModal';

// Separate component for exercise preview card to properly use hooks
const ExercisePreviewCard = ({ 
  item, 
  index, 
  currentExerciseIndex, 
  exercises, 
  palette, 
  styles, 
  onCardPress, 
  onLongPress, 
  onSupersetLinkClick,
  t
}) => {
  // Animation value for each card
  const cardAnimation = useRef(new Animated.Value(1)).current;

  const status = { 
    completed: item.sets.filter(set => set.completed).length,
    total: item.sets.length,
    percentage: item.sets.length > 0 ? Math.round((item.sets.filter(set => set.completed).length / item.sets.length) * 100) : 0
  };
  const isActive = index === currentExerciseIndex;
  
  // Check if this exercise is part of a superset
  const isSuperset = item.superset_group;
  const isLastInSuperset = isSuperset && (
    index === exercises.length - 1 || 
    exercises[index + 1]?.superset_group !== item.superset_group
  );

  const handleCardPress = () => {
    // Fancy animation on press
    Animated.sequence([
      Animated.timing(cardAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onCardPress(index, isActive);
  };
  
  return (
    <View style={styles.exerciseCardWrapper}>
      <Animated.View style={{ transform: [{ scale: cardAnimation }] }}>
        <Pressable
          style={[
            styles.exerciseCard,
            isActive && styles.activeExerciseCard,
            isSuperset && { borderLeftWidth: 3, borderLeftColor: palette.accent }
          ]}
          onPress={handleCardPress}
          onLongPress={() => onLongPress(index)}
          delayLongPress={300}
        >
          
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
            {t(item.name)}
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
        </Pressable>
      </Animated.View>
      
      {/* Superset chain link - clickable to break superset */}
      {isSuperset && !isLastInSuperset && (
        <TouchableOpacity 
          style={styles.supersetLink}
          onPress={() => onSupersetLinkClick(index)}
        >
          <Ionicons name="link" size={12} color={palette.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
};

interface ActiveWorkoutScreenProps {
  handlers: any;
  workoutManager: any;
}

interface EditModalState {
  visible: boolean;
  exerciseIndex: number;
  setIndex: number;
  field: string;
  value: string;
  title: string;
}

// Exercise Preview Options Modal
const ExercisePreviewOptionsModal = ({ visible, onClose, onDelete, onSuperset, onBreakSuperset, isSuperset, onRename, theme }) => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.optionsModalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('exercise_options')}</Text>
          
          {isSuperset ? (
            <TouchableOpacity
              style={[styles.optionButton, { borderBottomColor: theme.border }]}
              onPress={() => {
                onBreakSuperset();
                onClose();
              }}
            >
              <Ionicons name="unlink-outline" size={20} color={theme.warning} />
              <Text style={[styles.optionButtonText, { color: theme.warning }]}>
                {t('break_superset')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.optionButton, { borderBottomColor: theme.border }]}
              onPress={() => {
                onSuperset();
                onClose();
              }}
            >
              <Ionicons name="link-outline" size={20} color={theme.accent} />
              <Text style={[styles.optionButtonText, { color: theme.accent }]}>
                {t('create_superset')}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.optionButton, { borderBottomColor: theme.border }]}
            onPress={() => {
              onRename();
              onClose();
            }}
          >
            <Ionicons name="create-outline" size={20} color={theme.success} />
            <Text style={[styles.optionButtonText, { color: theme.success }]}>
              {t('rename_exercise')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionButton, { borderBottomColor: theme.border }]}
            onPress={() => {
              onDelete();
              onClose();
            }}
          >
            <Ionicons name="trash-outline" size={20} color={theme.error} />
            <Text style={[styles.optionButtonText, { color: theme.error }]}>
              {t('delete_exercise')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.optionButton}
            onPress={onClose}
          >
            <Ionicons name="close-outline" size={20} color={theme.text_secondary} />
            <Text style={[styles.optionButtonText, { color: theme.text_secondary }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Rename Exercise Modal for exercise previews
const RenameExerciseModal = ({ visible, onClose, currentName, onSave, theme }) => {
  const { t } = useLanguage();
  const [tempName, setTempName] = useState(currentName || '');
  const { palette } = useTheme();
  const styles = themedStyles(palette);

  React.useEffect(() => {
    if (visible) {
      setTempName(currentName || '');
    }
  }, [visible, currentName]);

  const handleSave = () => {
    if (tempName.trim()) {
      onSave(tempName.trim());
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        
        <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {t('rename_exercise')}
          </Text>
          
          <TextInput
            style={[styles.nameInput, { 
              color: theme.text,
              backgroundColor: theme.input_background,
              borderColor: theme.border
            }]}
            value={tempName}
            onChangeText={setTempName}
            autoFocus
            placeholder={t('exercise_name')}
            placeholderTextColor={theme.text_tertiary}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { borderColor: theme.border }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: theme.text }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, { 
                backgroundColor: theme.accent,
                borderColor: theme.accent
              }]}
              onPress={handleSave}
            >
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                {t('save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
    endWorkout,
    handleCreateSuperset,
    handleRemoveFromSuperset,
    handleUpdateExercise
  } = handlers;

  // Edit modal state
  const [editModal, setEditModal] = useState<EditModalState>({
    visible: false,
    exerciseIndex: -1,
    setIndex: -1,
    field: '',
    value: '',
    title: ''
  });
  const [useNumberPicker, setUseNumberPicker] = useState(false);
  const modalAnimation = useRef(new Animated.Value(0)).current;

  // Exercise preview options state
  const [previewOptionsVisible, setPreviewOptionsVisible] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(-1);
  const [supersetLinkModalVisible, setSupersetLinkModalVisible] = useState(false);
  const [supersetData, setSupersetData] = useState<{ availableExercises: any[], exerciseIndex: number } | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);

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
    // Clear rest timer from workout state
    workoutManager.updateWorkout({ 
      restTimer: { 
        isActive: false, 
        totalSeconds: 0, 
        startTime: null, 
        remainingSeconds: 0 
      } 
    });
  };

  // Handle create superset from preview or main card
  const handleCreateSupersetWithOptions = async (exerciseIndex: number) => {
    const result = await handleCreateSuperset(exerciseIndex);
    
    if (result && result.availableExercises) {
      // Show superset link modal with available exercises
      setSupersetData(result);
      setSupersetLinkModalVisible(true);
    }
    // If no result, it means the handler already took care of everything (e.g., opened exercise selector)
  };

  // Handle link with existing exercise from superset modal
  const handleLinkWithExistingFromModal = (targetExercise: any, targetIndex: number) => {
    if (supersetData) {
      handlers.handleLinkWithExisting(supersetData.exerciseIndex, targetExercise, targetIndex);
      setSupersetLinkModalVisible(false);
      setSupersetData(null);
    }
  };

  // Handle link with new exercise from superset modal
  const handleLinkWithNewFromModal = () => {
    if (supersetData) {
      handlers.handleLinkWithNew(supersetData.exerciseIndex);
      setSupersetLinkModalVisible(false);
      setSupersetData(null);
    }
  };

  // Handle break superset from exercise preview
  const handleBreakSupersetFromPreview = (exerciseIndex: number) => {
    handleRemoveFromSuperset(exerciseIndex);
  };

  // Handle press on exercise preview (changed from long press)
  const handleExercisePreviewPress = (exerciseIndex: number) => {
    setSelectedExerciseIndex(exerciseIndex);
    setPreviewOptionsVisible(true);
  };

  // Handle rename from exercise preview
  const handleRenameFromPreview = (exerciseIndex: number) => {
    setSelectedExerciseIndex(exerciseIndex);
    setRenameModalVisible(true);
  };

  // Handle save rename from exercise preview
  const handleSaveRenameFromPreview = (newName: string) => {
    if (selectedExerciseIndex >= 0 && selectedExerciseIndex < exercises.length) {
      const exercise = exercises[selectedExerciseIndex];
      handleUpdateExercise(selectedExerciseIndex, { ...exercise, name: newName });
    }
  };

  // Handle superset link click in exercise preview
  const handleSupersetLinkClick = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    if (exercise.superset_group) {
      // Show option to break superset
      Alert.alert(
        t('break_superset'),
        t('break_superset_confirmation'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('break'),
            style: 'destructive',
            onPress: () => handleBreakSupersetFromPreview(exerciseIndex)
          }
        ]
      );
    }
  };

  // Edit modal functions
  const showEditModal = (exerciseIndex: number, setIndex: number, field: string) => {
    const exercise = exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    let initialValue = '';
    let modalTitle = '';
    
    switch (field) {
      case 'reps':
        initialValue = (set.actual_reps !== undefined ? set.actual_reps : set.reps)?.toString() || '0';
        modalTitle = t('edit_reps');
        break;
      case 'weight':
        initialValue = (set.actual_weight !== undefined ? set.actual_weight : set.weight)?.toString() || '0';
        modalTitle = t('edit_weight');
        break;
      case 'duration':
        initialValue = (set.actual_duration !== undefined ? set.actual_duration : set.duration)?.toString() || '0';
        modalTitle = t('edit_duration');
        break;
      case 'distance':
        initialValue = (set.actual_distance !== undefined ? set.actual_distance : set.distance)?.toString() || '0';
        modalTitle = t('edit_distance');
        break;
      case 'rest':
        initialValue = set.rest_time.toString();
        modalTitle = t('edit_rest_time');
        break;
    }
    
    setEditModal({
      visible: true,
      exerciseIndex,
      setIndex,
      field,
      value: initialValue,
      title: modalTitle
    });
    
    // Animate modal in
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };
  
  const hideEditModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setEditModal(prev => ({ ...prev, visible: false }));
    });
  };
  
  const saveEditedValue = () => {
    if (editModal.exerciseIndex === -1 || editModal.setIndex === -1) return;
    
    const normalizedValue = editModal.value.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    
    if (isNaN(numValue)) {
      hideEditModal();
      return;
    }
    
    // Update the set with new value
    const exercise = exercises[editModal.exerciseIndex];
    const updatedSet = {...exercise.sets[editModal.setIndex]};
    
    switch (editModal.field) {
      case 'reps':
        updatedSet.actual_reps = Math.round(numValue);
        break;
      case 'weight':
        updatedSet.actual_weight = numValue;
        break;
      case 'duration':
        updatedSet.actual_duration = Math.round(numValue);
        break;
      case 'distance':
        updatedSet.actual_distance = numValue;
        break;
      case 'rest':
        updatedSet.rest_time = Math.round(numValue);
        break;
    }
    
    handlers.handleUpdateSet(editModal.exerciseIndex, editModal.setIndex, updatedSet);
    hideEditModal();
  };

  // Generate picker values based on field type
  const getPickerValues = () => {
    switch (editModal.field) {
      case 'reps':
        return Array.from({ length: 100 }, (_, i) => i + 1);
      case 'weight':
        return Array.from({ length: 1000 }, (_, i) => (i + 1) * 0.5); // 0.5 to 500 in 0.5 increments
      case 'duration':
        return Array.from({ length: 600 }, (_, i) => i + 1); // 1 to 600 seconds
      case 'distance':
        return Array.from({ length: 10000 }, (_, i) => (i + 1) * 10); // 10 to 100000 meters in 10m increments
      case 'rest':
        return Array.from({ length: 600 }, (_, i) => i + 5); // 5 to 600 seconds in 5s increments
      default:
        return [1, 2, 3, 4, 5];
    }
  };

  const renderExercisePreviewCard = ({ item, index }) => {
    const handleCardPress = (cardIndex, isActive) => {
      // Navigate to exercise or show options based on context
      if (isActive) {
        // If it's the current exercise, show options
        handleExercisePreviewPress(cardIndex);
      } else {
        // If it's not current exercise, navigate to it
        handleNavigateToExercise(cardIndex);
      }
    };

    return (
      <ExercisePreviewCard
        item={item}
        index={index}
        currentExerciseIndex={currentExerciseIndex}
        exercises={exercises}
        palette={palette}
        styles={styles}
        onCardPress={handleCardPress}
        onLongPress={handleExercisePreviewPress}
        onSupersetLinkClick={handleSupersetLinkClick}
        t={t}
      />
    );
  };

  // Get available exercises for superset linking (exclude current and already in superset)
  const getAvailableExercisesForSuperset = () => {
    return exercises
      .map((exercise, index) => ({ ...exercise, originalIndex: index }))
      .filter((exercise, index) => 
        index !== currentExerciseIndex && !exercise.superset_group
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
                onShowEditModal={showEditModal}
                onCreateSuperset={handleCreateSupersetWithOptions}
                onRemoveFromSuperset={handleRemoveFromSuperset}
                themePalette={palette}
                availableExercises={getAvailableExercisesForSuperset()}
                onLinkWithExisting={(targetExercise, targetIndex) => 
                  handlers.handleLinkWithExisting(currentExerciseIndex, targetExercise, targetIndex)
                }
                onLinkWithNew={() => handlers.handleLinkWithNew(currentExerciseIndex)}
              />
              
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
      
      {/* Edit Value Modal */}
      {editModal.visible && (
        <Modal
          visible={editModal.visible}
          animationType="none"
          transparent={true}
          onRequestClose={hideEditModal}
        >
          <View style={styles.editModalOverlay}>
            <Pressable style={styles.editModalBackdrop} onPress={hideEditModal} />
            
            <Animated.View 
              style={[
                styles.editModalContent,
                { 
                  backgroundColor: palette.card_background,
                  transform: [
                    { scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1]
                    })},
                  ],
                  opacity: modalAnimation
                }
              ]}
            >
              <Text style={[styles.editModalTitle, { color: palette.text }]}>
                {editModal.title}
              </Text>
              
             
                <View style={[styles.pickerContainer, { borderColor: palette.border }]}>
                  <Picker
                    selectedValue={parseFloat(editModal.value) || 0}
                    onValueChange={(value) => setEditModal(prev => ({ ...prev, value: value.toString() }))}
                    style={[styles.picker, { color: palette.text }]}
                    itemStyle={{ color: palette.text }}
                  >
                    {getPickerValues().map((value) => (
                      <Picker.Item 
                        key={value} 
                        label={value.toString()} 
                        value={value}
                        color={palette.text}
                      />
                    ))}
                  </Picker>
                </View>
              
              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.editModalButton, { borderColor: palette.border }]}
                  onPress={hideEditModal}
                >
                  <Text style={[styles.editModalButtonText, { color: palette.text }]}>
                    {t('cancel')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.editModalButton, { 
                    backgroundColor: palette.accent,
                    borderColor: palette.accent
                  }]}
                  onPress={saveEditedValue}
                >
                  <Text style={[styles.editModalButtonText, { color: '#FFFFFF' }]}>
                    {t('save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Exercise Preview Options Modal */}
      <ExercisePreviewOptionsModal
        visible={previewOptionsVisible}
        onClose={() => setPreviewOptionsVisible(false)}
        onDelete={() => {
          setPreviewOptionsVisible(false);
          handleDeleteExercise(selectedExerciseIndex);
        }}
        onSuperset={() => {
          setPreviewOptionsVisible(false);
          handleCreateSupersetWithOptions(selectedExerciseIndex);
        }}
        onBreakSuperset={() => {
          setPreviewOptionsVisible(false);
          handleBreakSupersetFromPreview(selectedExerciseIndex);
        }}
        onRename={() => {
          setPreviewOptionsVisible(false);
          handleRenameFromPreview(selectedExerciseIndex);
        }}
        isSuperset={selectedExerciseIndex >= 0 && exercises[selectedExerciseIndex]?.superset_group}
        theme={palette}
      />

      {/* Rename Exercise Modal for exercise previews */}
      <RenameExerciseModal
        visible={renameModalVisible}
        onClose={() => setRenameModalVisible(false)}
        currentName={selectedExerciseIndex >= 0 ? exercises[selectedExerciseIndex]?.name : ''}
        onSave={handleSaveRenameFromPreview}
        theme={palette}
      />

      {/* Superset Link Modal for exercise previews */}
      {supersetData && (
        <Modal visible={supersetLinkModalVisible} animationType="fade" transparent onRequestClose={() => setSupersetLinkModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSupersetLinkModalVisible(false)} />
            <View style={[styles.optionsModalContent, { backgroundColor: palette.card_background }]}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>{t('create_superset')}</Text>
              
              <TouchableOpacity
                style={[styles.optionButton, { borderBottomColor: palette.border }]}
                onPress={handleLinkWithNewFromModal}
              >
                <Ionicons name="add-circle-outline" size={20} color={palette.accent} />
                <Text style={[styles.optionButtonText, { color: palette.accent }]}>
                  {t('new_exercise')}
                </Text>
              </TouchableOpacity>
              
              {supersetData.availableExercises.length > 0 && (
                <View>
                  <Text style={[styles.subSectionTitle, { color: palette.text_secondary }]}>
                    {t('existing_exercise')}:
                  </Text>
                  {supersetData.availableExercises.map((exercise, index) => (
                    <TouchableOpacity
                      key={exercise.id || index}
                      style={[styles.optionButton, { borderBottomColor: palette.border }]}
                      onPress={() => handleLinkWithExistingFromModal(exercise, exercise.originalIndex)}
                    >
                      <Ionicons name="link-outline" size={20} color={palette.success} />
                      <Text style={[styles.optionButtonText, { color: palette.text }]}>
                        {t(exercise.name)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => setSupersetLinkModalVisible(false)}
              >
                <Ionicons name="close-outline" size={20} color={palette.text_secondary} />
                <Text style={[styles.optionButtonText, { color: palette.text_secondary }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
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
  exerciseCardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
  supersetLink: {
    marginLeft: -5,
    marginRight: 5,
    padding: 4,
    backgroundColor: `${palette.accent}20`,
    borderRadius: 8,
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
  },

  // Edit Modal Styles
  editModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  editModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  editModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputTypeToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  editModalInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    height: 250,
    justifyContent: 'center',
  },
  picker: {
    height: 200,
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  editModalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  editModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal styles for options
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionsModalContent: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
  },
}));

export default ActiveWorkoutScreen;