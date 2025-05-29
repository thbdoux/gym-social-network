import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Modal,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RealtimeExerciseCard from './RealtimeExerciseCard';
import RealtimeExerciseSelector from './RealtimeExerciseSelector';
import RestTimer from './RestTimer';
import WorkoutCompleteModal from './WorkoutCompleteModal';

export const createWorkoutRendering = ({
  styles,
  palette,
  t,
  workoutName,
  setWorkoutName,
  workoutStarted,
  workoutDuration,
  exercises,
  currentExerciseIndex,
  selectingExercise,
  setSelectingExercise,
  restTimerActive,
  restTimeSeconds,
  completeModalVisible,
  exerciseFlatListRef,
  exerciseScrollViewRef,
  handlers,
  formatTime,
  getExerciseCompletionStatus,
  completionPercentage,
  completedSets,
  totalSets,
  hasIncompleteExercises,
  // Gym selection props
  selectedGym,
  gymModalVisible,
  // Template selection props
  selectedTemplate,
  templateModalVisible,
  templates,
  templatesLoading
}: any) => {

  // Updated Start Screen with template selection
  const renderStartScreen = () => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.startScreenContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.startScreenContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Template Selection */}
          <View style={styles.templateSection}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>
              {t('template')} ({t('optional')})
            </Text>
            <TouchableOpacity
              style={[styles.templateSelector, { 
                backgroundColor: palette.input_background,
                borderColor: selectedTemplate ? palette.success : palette.border
              }]}
              onPress={handlers.handleOpenTemplateModal}
            >
              <View style={styles.templateSelectorLeft}>
                <Ionicons 
                  name={selectedTemplate ? "document-text" : "document-text-outline"} 
                  size={24} 
                  color={selectedTemplate ? palette.success : palette.text_secondary}
                  style={styles.templateIcon}
                />
                <View style={styles.templateSelectorText}>
                  {selectedTemplate ? (
                    <>
                      <Text style={[styles.templateName, { color: palette.text }]}>
                        {selectedTemplate.name}
                      </Text>
                      <Text style={[styles.templateInfo, { color: palette.text_secondary }]}>
                        {selectedTemplate.exercises?.length || 0} {t('exercises')}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.placeholderText, { color: palette.text_tertiary }]}>
                      {t('select_template_optional')}
                    </Text>
                  )}
                </View>
              </View>
              
              {selectedTemplate && (
                <TouchableOpacity
                  style={styles.templateClearButton}
                  onPress={handlers.handleClearTemplate}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color={palette.text_secondary} />
                </TouchableOpacity>
              )}
              
              <Ionicons name="chevron-forward" size={20} color={palette.text_secondary} />
            </TouchableOpacity>
          </View>

          {/* Workout Name Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>
              {t('workout_name')}
            </Text>
            <TextInput
              style={[styles.textInput, { 
                color: palette.text,
                backgroundColor: palette.input_background,
                borderColor: palette.border
              }]}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder={selectedTemplate ? selectedTemplate.name : t('enter_workout_name')}
              placeholderTextColor={palette.text_tertiary}
              returnKeyType="done"
              blurOnSubmit={true}
              autoFocus={!selectedTemplate} // Only auto-focus if no template is selected
            />
          </View>

          {/* Gym Selection */}
          <View style={styles.gymSection}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>
              {t('gym_location')} ({t('optional')})
            </Text>
            <TouchableOpacity
              style={[styles.gymSelector, { 
                backgroundColor: palette.input_background,
                borderColor: palette.border
              }]}
              onPress={handlers.handleOpenGymModal}
            >
              <View style={styles.gymSelectorLeft}>
                <Ionicons 
                  name={selectedGym ? "fitness" : "home-outline"} 
                  size={24} 
                  color={selectedGym ? palette.accent : palette.text_secondary}
                  style={styles.gymIcon}
                />
                <View style={styles.gymSelectorText}>
                  {selectedGym ? (
                    <>
                      <Text style={[styles.gymName, { color: palette.text }]}>
                        {selectedGym.name}
                      </Text>
                      <Text style={[styles.gymLocation, { color: palette.text_secondary }]}>
                        {selectedGym.location}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.placeholderText, { color: palette.text_tertiary }]}>
                      {t('select_gym_or_home')}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.text_secondary} />
            </TouchableOpacity>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: palette.border }]}
              onPress={handlers.handleBackPress}
            >
              <Text style={[styles.cancelButtonText, { color: palette.text }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.startButton, { 
                backgroundColor: workoutName.trim() ? palette.success : palette.text_tertiary,
                opacity: workoutName.trim() ? 1 : 0.6
              }]}
              onPress={handlers.handleStartWorkout}
              disabled={!workoutName.trim()}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" style={styles.startButtonIcon} />
              <Text style={styles.startButtonText}>{t('start_workout')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );

  const renderWorkoutScreen = () => (
    <>
      {/* Workout header with timer and complete button */}
      <LinearGradient
        colors={[palette.accent, palette.highlight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.workoutHeader}
      >
        <View style={styles.headerLeftSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handlers.handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.workoutTitle} numberOfLines={1}>
            {workoutName}
          </Text>
        </View>
        
        <View style={styles.headerRightSection}>
          {/* Timer */}
          <TouchableOpacity 
            style={styles.timerContainer}
            onPress={handlers.toggleWorkoutTimer}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={handlers.workoutTimerActive ? "pause-circle" : "play-circle"} 
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
            onPress={handlers.handleCompleteWorkout}
          >
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
            <Text style={styles.completeWorkoutText}>{t('complete')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Rest timer - inline component instead of modal */}
      {restTimerActive && (
        <RestTimer
          seconds={restTimeSeconds}
          onComplete={handlers.stopRestTimer}
          onCancel={handlers.stopRestTimer}
          themePalette={palette}
        />
      )}
      
      {/* Progress bar */}
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
          renderItem={({ item, index }) => {
            const status = getExerciseCompletionStatus(item);
            const isActive = index === currentExerciseIndex;
            const hasCompletedSets = item.sets.some((set: any) => set.completed);
            
            return (
              <TouchableOpacity
                style={[
                  styles.exerciseCard,
                  isActive && styles.activeExerciseCard
                ]}
                onPress={() => handlers.handleNavigateToExercise(index)}
              >
                {/* Delete button - only show if exercise has no completed sets */}
                {!hasCompletedSets && (
                  <TouchableOpacity
                    style={[styles.deleteExerciseButton, { backgroundColor: palette.error }]}
                    onPress={() => handlers.handleDeleteExercise(index)}
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
          }}
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
      
      {/* Main workout view */}
      <View style={styles.workoutContent}>
        <ScrollView 
          ref={exerciseScrollViewRef}
          style={styles.exerciseArea}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length > 0 && currentExerciseIndex < exercises.length ? (
            <RealtimeExerciseCard
              exercise={exercises[currentExerciseIndex]}
              exerciseIndex={currentExerciseIndex}
              onCompleteSet={handlers.handleCompleteSet}
              onUncompleteSet={handlers.handleUncompleteSet}
              onUpdateSet={handlers.handleUpdateSet}
              onAddSet={handlers.handleAddSet}
              onRemoveSet={handlers.handleRemoveSet}
              onStartRestTimer={handlers.startRestTimer}
              editingPrevious={false}
              themePalette={palette}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: palette.text_secondary }]}>
                {selectedTemplate 
                  ? t('template_exercises_will_appear_here')
                  : t('no_exercises_added')
                }
              </Text>
              <TouchableOpacity
                style={[styles.addExerciseButton, { backgroundColor: palette.highlight }]}
                onPress={() => setSelectingExercise(true)}
              >
                <Text style={styles.addExerciseButtonText}>
                  {selectedTemplate ? t('start_first_exercise') : t('add_exercise')}
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
            onSelectExercise={handlers.handleAddExercise}
            onCancel={() => setSelectingExercise(false)}
            themePalette={palette}
          />
        </SafeAreaView>
      </Modal>
      
      {/* Complete Workout Modal */}
      <WorkoutCompleteModal
        visible={completeModalVisible}
        onSubmit={handlers.handleSubmitWorkout}
        onCancel={handlers.handleCancelCompleteWorkout}
        completionPercentage={completionPercentage}
        hasIncompleteExercises={hasIncompleteExercises}
        themePalette={palette}
        workoutName={workoutName}
        workoutDuration={workoutDuration}
        exercises={exercises}
      />
    </>
  );

  return {
    renderStartScreen,
    renderWorkoutScreen
  };
};