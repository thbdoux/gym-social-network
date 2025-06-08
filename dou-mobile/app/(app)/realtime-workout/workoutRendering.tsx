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
  // Enhanced Start Screen with improved design and no auto-keyboard
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
        {/* Header Section */}
        <View style={styles.headerSection}>
  
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {t('new_workout')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: palette.text_secondary }]}>
            {t('configure_your_session')}
          </Text>
        </View>

        {/* Template Selection Card */}
        <View style={[styles.card, { backgroundColor: palette.page_background }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>
              {t('template')}
            </Text>
            <View style={[styles.optionalBadge, { backgroundColor: palette.accent_light }]}>
              <Text style={[styles.optionalText, { color: palette.accent }]}>
                {t('optional')}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.templateSelector, { 
              backgroundColor: selectedTemplate ? palette.success_light : palette.input_background,
              borderColor: selectedTemplate ? palette.success : palette.border,
              shadowColor: selectedTemplate ? palette.success : 'transparent'
            }]}
            onPress={handlers.handleOpenTemplateModal}
            activeOpacity={0.7}
          >
            <View style={styles.templateSelectorLeft}>
              <View style={[styles.iconContainer, { 
                backgroundColor: selectedTemplate ? palette.success : palette.background_secondary 
              }]}>
                <Ionicons 
                  name={selectedTemplate ? "document-text" : "document-text-outline"} 
                  size={20} 
                  color={selectedTemplate ? "#FFFFFF" : palette.text_secondary}
                />
              </View>
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
            
            <View style={styles.templateSelectorRight}>
              {selectedTemplate && (
                <TouchableOpacity
                  style={[styles.templateClearButton, { backgroundColor: palette.background_secondary }]}
                  onPress={handlers.handleClearTemplate}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={16} color={palette.text_secondary} />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-forward" size={18} color={palette.text_secondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Workout Name Card */}
        <View style={[styles.card, { backgroundColor: palette.page_background }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>
              {t('workout_name')}
            </Text>
            <View style={[styles.inputContainer, { 
              borderColor: workoutName.trim() ? palette.border : palette.border,
              backgroundColor: palette.input_background,
            }]}>
              <Ionicons 
                name="create-outline" 
                size={20} 
                color={workoutName.trim() ? palette.primary : palette.text_secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { 
                  color: palette.text,
                  borderWidth: 0,
                }]}
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder={selectedTemplate ? selectedTemplate.name : t('enter_workout_name')}
                placeholderTextColor={palette.text_tertiary}
                returnKeyType="done"
                blurOnSubmit={true}
                autoFocus={false} // Removed automatic keyboard opening
              />
              {workoutName.trim() && (
                <TouchableOpacity
                  style={styles.clearInputButton}
                  onPress={() => setWorkoutName('')}
                  hitSlop={{ top: 0, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color={palette.text_secondary} />
                </TouchableOpacity>
              )}
          </View>
        </View>

        {/* Gym Selection Card */}
        <View style={[styles.card, { backgroundColor: palette.page_background }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>
              {t('gym_location')}
            </Text>
            <View style={[styles.optionalBadge, { backgroundColor: palette.accent_light }]}>
              <Text style={[styles.optionalText, { color: palette.accent }]}>
                {t('optional')}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.gymSelector, { 
              backgroundColor: selectedGym ? palette.accent_light : palette.input_background,
              borderColor: selectedGym ? palette.accent : palette.border,
              shadowColor: selectedGym ? palette.accent : 'transparent'
            }]}
            onPress={handlers.handleOpenGymModal}
            activeOpacity={0.7}
          >
            <View style={styles.gymSelectorLeft}>
              <View style={[styles.iconContainer, { 
                backgroundColor: selectedGym ? palette.accent : palette.background_secondary 
              }]}>
                <Ionicons 
                  name={selectedGym ? "fitness" : "home-outline"} 
                  size={20} 
                  color={selectedGym ? "#FFFFFF" : palette.text_secondary}
                />
              </View>
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
            <Ionicons name="chevron-forward" size={18} color={palette.text_secondary} />
          </TouchableOpacity>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { 
              borderColor: palette.border,
              backgroundColor: palette.background_secondary
            }]}
            onPress={handlers.handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={palette.text} style={styles.buttonIcon} />
            <Text style={[styles.cancelButtonText, { color: palette.text }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.startButton, { 
              backgroundColor: workoutName.trim() ? palette.success : palette.text_tertiary,
              opacity: workoutName.trim() ? 1 : 0.6,
              shadowColor: workoutName.trim() ? palette.success : 'transparent'
            }]}
            onPress={handlers.handleStartWorkout}
            disabled={!workoutName.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={18} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.startButtonText}>{t('start_workout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
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
            <>
              <RealtimeExerciseCard
                exercise={exercises[currentExerciseIndex]}
                exerciseIndex={currentExerciseIndex}
                onCompleteSet={handlers.handleCompleteSet}
                onUncompleteSet={handlers.handleUncompleteSet}
                onUpdateSet={handlers.handleUpdateSet}
                onUpdateExercise={handlers.handleUpdateExercise}
                onAddSet={handlers.handleAddSet}
                onRemoveSet={handlers.handleRemoveSet}
                onStartRestTimer={handlers.startRestTimer}
                editingPrevious={false}
                themePalette={palette}
              />
              
              {/* Rest timer - moved below the exercise card */}
              {restTimerActive && (
                <RestTimer
                  initialSeconds={restTimeSeconds}
                  onComplete={handlers.stopRestTimer}
                  onCancel={handlers.stopRestTimer}
                  themePalette={palette}
                />
              )}
            </>
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