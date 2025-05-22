import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export class WorkoutHandlers {
  private setWorkoutStarted: (started: boolean) => void;
  private setWorkoutTimerActive: (active: boolean) => void;
  private setWorkoutDuration: (duration: number) => void;
  private setSelectingExercise: (selecting: boolean) => void;
  private setExercises: (exercises: any) => void;
  private setCurrentExerciseIndex: (index: number) => void;
  private setRestTimerActive: (active: boolean) => void;
  private setRestTimeSeconds: (seconds: number) => void;
  private setCompleteModalVisible: (visible: boolean) => void;
  private workoutStarted: boolean;
  public workoutName: string; // Make this public so it can be updated
  private workoutDuration: number;
  private exercises: any[];
  private currentExerciseIndex: number;
  private workoutTimerActive: boolean;
  private exerciseFlatListRef: React.RefObject<any>;
  private t: (key: string, params?: any) => string;
  private storageKey: string;
  private timerStartKey: string;
  private timerTotalKey: string;
  private timerActiveKey: string;
  private timerPauseKey: string;
  private createLog: (data: any) => Promise<any>;
  private templateId: number | null;
  private programId: number | null;
  private workoutId: number | null;
  private sourceType: string;
  private saveWorkoutToStorage: () => Promise<void>;
  private clearWorkoutFromStorage: () => Promise<void>;
  private clearAllWorkoutStorage: () => Promise<void>;
  
  // Post creation function
  private createPost: (data: any) => Promise<any>;
  
  // Workout context methods
  private workoutContext: any;

  constructor({
    setWorkoutStarted,
    setWorkoutTimerActive,
    setWorkoutDuration,
    setSelectingExercise,
    setExercises,
    setCurrentExerciseIndex,
    setRestTimerActive,
    setRestTimeSeconds,
    setCompleteModalVisible,
    workoutStarted,
    workoutName,
    workoutDuration,
    exercises,
    currentExerciseIndex,
    workoutTimerActive,
    exerciseFlatListRef,
    t,
    storageKey,
    timerStartKey,
    timerTotalKey,
    timerActiveKey,
    timerPauseKey,
    createLog,
    createPost,
    templateId,
    programId,
    workoutId,
    sourceType,
    saveWorkoutToStorage,
    clearWorkoutFromStorage,
    clearAllWorkoutStorage,
    workoutContext,
  }: any) {
    this.setWorkoutStarted = setWorkoutStarted;
    this.setWorkoutTimerActive = setWorkoutTimerActive;
    this.setWorkoutDuration = setWorkoutDuration;
    this.setSelectingExercise = setSelectingExercise;
    this.setExercises = setExercises;
    this.setCurrentExerciseIndex = setCurrentExerciseIndex;
    this.setRestTimerActive = setRestTimerActive;
    this.setRestTimeSeconds = setRestTimeSeconds;
    this.setCompleteModalVisible = setCompleteModalVisible;
    this.workoutStarted = workoutStarted;
    this.workoutName = workoutName;
    this.workoutDuration = workoutDuration;
    this.exercises = exercises;
    this.currentExerciseIndex = currentExerciseIndex;
    this.workoutTimerActive = workoutTimerActive;
    this.exerciseFlatListRef = exerciseFlatListRef;
    this.t = t;
    this.storageKey = storageKey;
    this.timerStartKey = timerStartKey;
    this.timerTotalKey = timerTotalKey;
    this.timerActiveKey = timerActiveKey;
    this.timerPauseKey = timerPauseKey;
    this.createLog = createLog;
    this.createPost = createPost;
    this.templateId = templateId;
    this.programId = programId;
    this.workoutId = workoutId;
    this.sourceType = sourceType;
    this.saveWorkoutToStorage = saveWorkoutToStorage;
    this.clearWorkoutFromStorage = clearWorkoutFromStorage;
    this.clearAllWorkoutStorage = clearAllWorkoutStorage;
    this.workoutContext = workoutContext;
  }

  // Helper function to get mood options
  private getMoodOptions = () => [
    { value: 1, label: 'terrible', icon: 'sad-outline', color: '#ef4444' },
    { value: 2, label: 'bad', icon: 'thumbs-down-outline', color: '#f97316' },
    { value: 3, label: 'okay', icon: 'remove-outline', color: '#eab308' },
    { value: 4, label: 'good', icon: 'thumbs-up-outline', color: '#22c55e' },
    { value: 5, label: 'great', icon: 'happy-outline', color: '#10b981' }
  ];

  // Helper function to generate default post content
  private generateDefaultPostContent = () => {
    const duration = Math.floor(this.workoutDuration / 60);
    const completedSets = this.exercises.reduce((acc, ex) => 
      acc + ex.sets.filter((set: any) => set.completed).length, 0
    );
    
    const completionPercentage = this.calculateCompletionPercentage();
    
    return `Just finished "${this.workoutName}"! 💪\n\n` +
           `⏱️ ${duration} minutes\n` +
           `✅ ${completedSets} sets completed\n` +
           `🏋️ ${this.exercises.length} exercises\n` +
           `📊 ${completionPercentage}% complete\n\n` +
           `#fitness #workout #training`;
  };

  // Helper function to calculate completion percentage
  private calculateCompletionPercentage = () => {
    if (this.exercises.length === 0) return 0;
    
    const totalSets = this.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = this.exercises.reduce((acc, ex) => 
      acc + ex.sets.filter((set: any) => set.completed).length, 0
    );
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  // Function to create workout post
  private createWorkoutPost = async (workoutLogId: number, additionalData: any) => {
    try {
      if (!additionalData.will_share_to_social) {
        console.log('Not sharing to social media');
        return;
      }

      const formData = new FormData();
      
      // Create workout post content
      const workoutStats = {
        name: this.workoutName,
        duration: Math.floor(this.workoutDuration / 60),
        exercises_count: this.exercises.length,
        sets_completed: this.exercises.reduce((acc, ex) => 
          acc + ex.sets.filter((set: any) => set.completed).length, 0
        ),
        completion_percentage: this.calculateCompletionPercentage(),
        mood: this.getMoodOptions().find(m => m.value === additionalData.mood_rating)?.label || 'good',
        difficulty: additionalData.difficulty_level
      };

      // Use provided post content or generate default
      const postContent = additionalData.post_content || this.generateDefaultPostContent();

      // Add basic post data
      formData.append('content', postContent);
      formData.append('post_type', 'workout_log');
      
      // Add workout-specific data
      formData.append('workout_log_id', workoutLogId.toString());
      formData.append('workout_stats', JSON.stringify(workoutStats));
      
      // Add tags if any
      const allTags = [
        ...additionalData.tags || [],
        'fitness', 'workout'
      ];
      formData.append('tags', JSON.stringify(allTags));

      await this.createPost(formData);
      console.log('Workout post created successfully');
    } catch (error) {
      console.error('Error creating workout post:', error);
      // Don't throw here - we don't want to fail the entire workout save if post creation fails
      Alert.alert(
        this.t('warning'),
        this.t('workout_saved_but_post_failed') || 'Workout saved successfully, but failed to share to social media.',
        [{ text: this.t('ok') }]
      );
    }
  };

  // Sync local state with context
  private syncWithContext = async () => {
    if (!this.workoutContext) return;
    
    await this.workoutContext.updateWorkout({
      name: this.workoutName,
      exercises: this.exercises,
      duration: this.workoutDuration,
      currentExerciseIndex: this.currentExerciseIndex,
      isTimerActive: this.workoutTimerActive
    });
  };

  handleBackPress = () => {
    if (this.workoutStarted) {
      Alert.alert(
        this.t('exit_workout'),
        this.t('workout_will_continue_in_background'),
        [
          { text: this.t('cancel'), style: 'cancel' },
          { 
            text: this.t('continue_later'),
            onPress: async () => {
              await this.pauseWorkoutTimer();
              await this.syncWithContext();
              router.back();
            }
          },
          {
            text: this.t('end_workout'),
            style: 'destructive',
            onPress: async () => {
              await this.workoutContext?.endWorkout(true);
              this.clearAllWorkoutStorage();
              router.replace('/(app)/feed');
            }
          }
        ]
      );
      return true;
    }
    
    this.clearAllWorkoutStorage();
    router.back();
    return true;
  };

  handleStartWorkout = async () => {
    if (!this.workoutName.trim()) {
      Alert.alert(this.t('error'), this.t('please_enter_workout_name'));
      return;
    }
    
    this.setWorkoutStarted(true);
    await this.startWorkoutTimer();
    
    // Initialize workout in context
    if (this.workoutContext) {
      await this.workoutContext.startWorkout({
        name: this.workoutName,
        exercises: this.exercises,
        sourceType: this.sourceType,
        templateId: this.templateId,
        programId: this.programId,
        workoutId: this.workoutId,
        currentExerciseIndex: this.currentExerciseIndex
      });
    }
    
    if (this.exercises.length === 0) {
      this.setSelectingExercise(true);
    }
  };

  startWorkoutTimer = async () => {
    try {
      await AsyncStorage.setItem(this.timerActiveKey, 'true');
      
      const existingStartTime = await AsyncStorage.getItem(this.timerStartKey);
      if (!existingStartTime) {
        await AsyncStorage.setItem(this.timerStartKey, new Date().toISOString());
      }
      
      if (!(await AsyncStorage.getItem(this.timerTotalKey))) {
        await AsyncStorage.setItem(this.timerTotalKey, '0');
      }
      
      this.setWorkoutTimerActive(true);
      
      // Update context
      if (this.workoutContext) {
        await this.workoutContext.updateWorkout({ isTimerActive: true });
      }
    } catch (error) {
      console.error('Error starting workout timer:', error);
    }
  };

  pauseWorkoutTimer = async () => {
    try {
      if (!this.workoutTimerActive) return;
      
      const startTimeStr = await AsyncStorage.getItem(this.timerStartKey);
      const totalStr = await AsyncStorage.getItem(this.timerTotalKey) || '0';
      
      if (startTimeStr) {
        const startTime = new Date(startTimeStr).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const newTotal = parseInt(totalStr) + elapsedSeconds;
        
        await AsyncStorage.setItem(this.timerTotalKey, newTotal.toString());
        await AsyncStorage.removeItem(this.timerStartKey);
        await AsyncStorage.setItem(this.timerActiveKey, 'false');
        
        this.setWorkoutDuration(newTotal);
        this.setWorkoutTimerActive(false);
        
        // Update context
        if (this.workoutContext) {
          await this.workoutContext.updateWorkout({ 
            duration: newTotal,
            isTimerActive: false 
          });
        }
      }
    } catch (error) {
      console.error('Error pausing workout timer:', error);
    }
  };

  toggleWorkoutTimer = async () => {
    if (this.workoutTimerActive) {
      await this.pauseWorkoutTimer();
    } else {
      await this.startWorkoutTimer();
    }
  };

  startRestTimer = (seconds: number) => {
    this.setRestTimeSeconds(seconds);
    this.setRestTimerActive(true);
  };

  stopRestTimer = () => {
    this.setRestTimerActive(false);
  };

  handleCompleteExercise = () => {
    const currentExercise = this.exercises[this.currentExerciseIndex];
    const allSetsCompleted = currentExercise.sets.every((set: any) => set.completed);
    
    if (!allSetsCompleted) {
      Alert.alert(
        this.t('incomplete_sets'),
        this.t('not_all_sets_completed'),
        [
          { text: this.t('cancel'), style: 'cancel' },
          { 
            text: this.t('continue_anyway'),
            onPress: () => this.navigateToNextExercise()
          }
        ]
      );
      return;
    }
    
    this.navigateToNextExercise();
  };

  navigateToNextExercise = async () => {
    if (this.currentExerciseIndex < this.exercises.length - 1) {
      this.setCurrentExerciseIndex(this.currentExerciseIndex + 1);
      this.exerciseFlatListRef.current?.scrollToIndex({ 
        animated: true, 
        index: this.currentExerciseIndex + 1 
      });
    } else {
      this.setSelectingExercise(true);
    }
    
    await this.syncWithContext();
  };

  handleAddExercise = async (exercise: any) => {
    const newExercise = {
      ...exercise,
      id: exercise.id || `temp-${Date.now()}`,
      sets: exercise.sets || [
        {
          id: `set-${Date.now()}`,
          reps: 10,
          weight: 0,
          rest_time: 60,
          order: 0,
          completed: false,
          actual_reps: 10,
          actual_weight: 0,
          rest_time_completed: false
        }
      ]
    };
    
    this.setExercises((prev: any[]) => [...prev, newExercise]);
    this.setCurrentExerciseIndex(this.exercises.length);
    this.setSelectingExercise(false);
    
    await this.syncWithContext();
  };

  handleCompleteSet = async (exerciseIndex: number, setIndex: number, setData: any) => {
    this.setExercises((prev: any[]) => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      const sets = [...exercise.sets];
      sets[setIndex] = {
        ...sets[setIndex],
        ...setData,
        completed: true
      };
      exercise.sets = sets;
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
    
    await this.syncWithContext();
  };

  handleUncompleteSet = async (exerciseIndex: number, setIndex: number) => {
    this.setExercises((prev: any[]) => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      const sets = [...exercise.sets];
      
      sets[setIndex] = {
        ...sets[setIndex],
        completed: false
      };
      
      exercise.sets = sets;
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
    
    await this.syncWithContext();
  };

  handleUpdateSet = async (exerciseIndex: number, setIndex: number, setData: any) => {
    this.setExercises((prev: any[]) => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      const sets = [...exercise.sets];
      sets[setIndex] = {
        ...sets[setIndex],
        ...setData
      };
      exercise.sets = sets;
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
    
    await this.syncWithContext();
  };

  handleAddSet = async (exerciseIndex: number) => {
    this.setExercises((prev: any[]) => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      const lastSet = exercise.sets[exercise.sets.length - 1];
      
      const newSet = {
        id: `set-${Date.now()}`,
        reps: lastSet.actual_reps !== undefined ? lastSet.actual_reps : lastSet.reps,
        weight: lastSet.actual_weight !== undefined ? lastSet.actual_weight : lastSet.weight,
        rest_time: lastSet.rest_time,
        order: exercise.sets.length,
        completed: false,
        actual_reps: lastSet.actual_reps !== undefined ? lastSet.actual_reps : lastSet.reps,
        actual_weight: lastSet.actual_weight !== undefined ? lastSet.actual_weight : lastSet.weight,
        rest_time_completed: false
      };
      
      exercise.sets = [...exercise.sets, newSet];
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
    
    await this.syncWithContext();
  };

  handleRemoveSet = async (exerciseIndex: number, setIndex: number) => {
    this.setExercises((prev: any[]) => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      
      if (exercise.sets.length <= 1) {
        Alert.alert(this.t('error'), this.t('cannot_remove_only_set'));
        return prev;
      }
      
      const sets = [...exercise.sets];
      sets.splice(setIndex, 1);
      
      sets.forEach((set, idx) => {
        set.order = idx;
      });
      
      exercise.sets = sets;
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
    
    await this.syncWithContext();
  };

  handleDeleteExercise = (exerciseIndex: number) => {
    const exercise = this.exercises[exerciseIndex];
    const hasCompletedSets = exercise.sets.some((set: any) => set.completed);
    
    if (hasCompletedSets) {
      Alert.alert(
        this.t('cannot_delete_exercise'),
        this.t('exercise_has_completed_sets'),
        [{ text: this.t('ok'), style: 'default' }]
      );
      return;
    }
    
    Alert.alert(
      this.t('delete_exercise'),
      this.t('delete_exercise_confirmation', { name: exercise.name }),
      [
        { text: this.t('cancel'), style: 'cancel' },
        { 
          text: this.t('delete'),
          style: 'destructive',
          onPress: () => this.confirmDeleteExercise(exerciseIndex)
        }
      ]
    );
  };

  confirmDeleteExercise = async (exerciseIndex: number) => {
    this.setExercises((prev: any[]) => {
      const newExercises = [...prev];
      newExercises.splice(exerciseIndex, 1);
      
      if (this.currentExerciseIndex >= exerciseIndex && this.currentExerciseIndex > 0) {
        this.setCurrentExerciseIndex(this.currentExerciseIndex - 1);
      } else if (newExercises.length === 0) {
        this.setCurrentExerciseIndex(0);
      } else if (this.currentExerciseIndex >= newExercises.length) {
        this.setCurrentExerciseIndex(newExercises.length - 1);
      }
      
      return newExercises;
    });
    
    await this.syncWithContext();
  };

  handleNavigateToExercise = async (index: number) => {
    this.setCurrentExerciseIndex(index);
    await this.syncWithContext();
  };

  handleCompleteWorkout = async () => {
    await this.pauseWorkoutTimer();
    this.setCompleteModalVisible(true);
  };

  handleSubmitWorkout = async (additionalData: any = {}) => {
    try {
      const formattedExercises = this.exercises.map((exercise, index) => ({
        name: exercise.name,
        equipment: exercise.equipment || '',
        notes: exercise.notes || '',
        order: index,
        superset_with: exercise.superset_with || null,
        is_superset: !!exercise.is_superset,
        sets: exercise.sets.map((set: any, idx: number) => ({
          reps: set.actual_reps || set.reps,
          weight: set.actual_weight || set.weight,
          rest_time: set.rest_time,
          order: idx
        }))
      }));
      
      const workoutData = {
        date: new Date().toISOString().split('T')[0],
        name: this.workoutName,
        description: '',
        notes: additionalData.notes || '',
        duration_minutes: Math.round(this.workoutDuration / 60),
        mood_rating: additionalData.mood_rating || 3,
        difficulty_level: additionalData.difficulty_level || 'moderate',
        completed: true,
        exercises: formattedExercises,
        template_id: this.templateId,
        program_id: this.programId,
        program_workout_id: this.workoutId,
        tags: additionalData.tags || [],
        source_type: this.sourceType === 'custom' ? 'none' : this.sourceType
      };
      
      // First, create the workout log
      const result = await this.createLog(workoutData);
      console.log('Workout log created successfully:', result);
      
      // Then create the post if sharing is enabled
      await this.createWorkoutPost(result.id, additionalData);
      console.log('Creating workout post for workout log ID:', result.id);
      
      // Clear both local and global persistence after successful save
      await this.clearWorkoutFromStorage();
      if (this.workoutContext) {
        await this.workoutContext.endWorkout(true);
      }
      
      // Show success message and navigate
      Alert.alert(
        this.t('success'), 
        this.t('workout_logged_successfully'),
        [{ text: this.t('ok'), onPress: () => router.replace('/(app)/feed') }]
      );
      
      // Return result for modal handling
      return {
        success: true,
        workoutId: result?.id,
        workout: result
      };
    } catch (error) {
      console.error('Error saving workout log:', error);
      throw error;
    }
  };

  handleCancelCompleteWorkout = async () => {
    await this.startWorkoutTimer();
    this.setCompleteModalVisible(false);
  };
}