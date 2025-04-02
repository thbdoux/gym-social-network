import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Switch,
  Animated,
  PanResponder,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { WorkoutTemplateFormData, Exercise, ExerciseSet } from '../WorkoutTemplateWizard';
import { Ionicons } from '@expo/vector-icons';
import { EXERCISE_CATEGORIES, getAllExercises, searchExercises } from '../data/exerciseData';

type Step2ExercisesProps = {
  formData: WorkoutTemplateFormData;
  updateFormData: (data: Partial<WorkoutTemplateFormData>) => void;
  errors: Record<string, string>;
};

// Default set template
const DEFAULT_SET: ExerciseSet = {
  reps: 10,
  weight: 0,
  rest_time: 60 // 60 seconds
};

const Step2Exercises = ({ formData, updateFormData, errors }: Step2ExercisesProps) => {
  const { t } = useLanguage();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [editExerciseIndex, setEditExerciseIndex] = useState<number | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentExerciseName, setCurrentExerciseName] = useState('');
  const [currentExerciseSets, setCurrentExerciseSets] = useState<ExerciseSet[]>([{...DEFAULT_SET}]);
  const [currentExerciseNotes, setCurrentExerciseNotes] = useState('');
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null);
  const [restTimeEnabled, setRestTimeEnabled] = useState(true);
  
  // Pan responder for drag and drop functionality
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: 0,
          y: (pan as any)._value.y
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        // Reset position after dropping
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false
        }).start();
        
        // Logic to reorder based on drop position would go here
        if (draggedExerciseIndex !== null && gesture.dy !== 0) {
          const direction = gesture.dy > 0 ? 'down' : 'up';
          handleMoveExercise(draggedExerciseIndex, direction);
        }
        
        setDraggedExerciseIndex(null);
      }
    })
  ).current;
  
  // Filter exercises based on search term
  const filteredExercises = searchTerm.length > 0
    ? searchExercises(searchTerm)
    : selectedCategory 
      ? EXERCISE_CATEGORIES.find(cat => cat.id === selectedCategory)?.exercises || []
      : getAllExercises();
  
  // Reset edit state when modal is opened for new exercise
  useEffect(() => {
    if (editExerciseIndex === null && exerciseModalVisible) {
      setCurrentExerciseName('');
      setCurrentExerciseSets([{...DEFAULT_SET}]);
      setCurrentExerciseNotes('');
      setRestTimeEnabled(true);
    }
  }, [exerciseModalVisible, editExerciseIndex]);
  
  // Update current exercise info when editing
  useEffect(() => {
    if (editExerciseIndex !== null && formData.exercises[editExerciseIndex]) {
      const exercise = formData.exercises[editExerciseIndex];
      setCurrentExerciseName(exercise.name);
      setCurrentExerciseSets([...exercise.sets]);
      setCurrentExerciseNotes(exercise.notes || '');
      
      // Check if rest time is enabled for this exercise
      const hasRestTime = exercise.sets.some(set => set.rest_time > 0);
      setRestTimeEnabled(hasRestTime);
    }
  }, [editExerciseIndex, formData.exercises]);
  
  // Add this useEffect after your other useEffect hooks
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  // Handle adding a new exercise
  const handleAddExercise = () => {
    setEditExerciseIndex(null);
    setExerciseModalVisible(true);
  };
  
  // Handle selecting an exercise from the list
  const handleSelectExercise = (exerciseName: string) => {
    setCurrentExerciseName(exerciseName);
    setExerciseModalVisible(false);
    setEditModalVisible(true);
  };
  
  // Handle adding a set - copies values from previous set
  const handleAddSet = () => {
    if (currentExerciseSets.length > 0) {
      // Copy values from the last set
      const lastSet = currentExerciseSets[currentExerciseSets.length - 1];
      setCurrentExerciseSets([...currentExerciseSets, {...lastSet}]);
    } else {
      setCurrentExerciseSets([...currentExerciseSets, {...DEFAULT_SET}]);
    }
  };
  
  // Handle removing a set
  const handleRemoveSet = (index: number) => {
    const updatedSets = [...currentExerciseSets];
    updatedSets.splice(index, 1);
    setCurrentExerciseSets(updatedSets);
  };
  
  // Handle updating a set
  const handleUpdateSet = (index: number, field: keyof ExerciseSet, value: number) => {
    const updatedSets = [...currentExerciseSets];
    updatedSets[index] = {
      ...updatedSets[index],
      [field]: value
    };
    setCurrentExerciseSets(updatedSets);
  };
  
  // Handle toggle for rest time
  const handleToggleRestTime = (value: boolean) => {
    setRestTimeEnabled(value);
    
    // Update all sets to have either default rest time or zero
    const updatedSets = currentExerciseSets.map(set => ({
      ...set,
      rest_time: value ? (set.rest_time > 0 ? set.rest_time : 60) : 0
    }));
    
    setCurrentExerciseSets(updatedSets);
  };
  
  // Handle saving the current exercise
  const handleSaveExercise = () => {
    if (!currentExerciseName.trim()) {
      Alert.alert(t('error'), t('exercise_name_required'));
      return;
    }
    
    if (currentExerciseSets.length === 0) {
      Alert.alert(t('error'), t('at_least_one_set_required'));
      return;
    }
    
    // Ensure each set has an order field based on its index
    const setsWithOrder = currentExerciseSets.map((set, index) => ({
      ...set,
      order: index
    }));
    
    const newExercise: Exercise = {
      name: currentExerciseName,
      sets: setsWithOrder,
      notes: currentExerciseNotes.trim() || undefined,
      equipment: '' // Default empty equipment if needed
      // order will be assigned based on index when updating the exercises array
    };
    
    const updatedExercises = [...formData.exercises];
    
    if (editExerciseIndex !== null) {
      // Update existing exercise
      updatedExercises[editExerciseIndex] = {
        ...newExercise,
        order: updatedExercises[editExerciseIndex]?.order ?? editExerciseIndex
      };
    } else {
      // Add new exercise
      updatedExercises.push({
        ...newExercise,
        order: updatedExercises.length // Use the new index as the order
      });
    }
    
    updateFormData({ exercises: updatedExercises });
    setEditModalVisible(false);
    setSearchTerm('');
  };
  
  // Handle editing an exercise
  const handleEditExercise = (index: number) => {
    setEditExerciseIndex(index);
    setEditModalVisible(true);
  };
  
  // Handle removing an exercise
  const handleRemoveExercise = (index: number) => {
    Alert.alert(
      t('remove_exercise'),
      t('remove_exercise_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('remove'), 
          style: 'destructive',
          onPress: () => {
            const updatedExercises = [...formData.exercises];
            updatedExercises.splice(index, 1);
            updateFormData({ exercises: updatedExercises });
          }
        }
      ]
    );
  };
  
  // Updated handleMoveExercise function to update order when reordering
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.exercises.length - 1)
    ) {
      return;
    }
    
    const updatedExercises = [...formData.exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    [updatedExercises[index], updatedExercises[targetIndex]] = 
    [updatedExercises[targetIndex], updatedExercises[index]];
    
    // Update order values to match new positions
    updatedExercises.forEach((exercise, idx) => {
      exercise.order = idx;
    });
    
    updateFormData({ exercises: updatedExercises });
  };
  
  // Start dragging an exercise
  const handleStartDrag = (index: number) => {
    setDraggedExerciseIndex(index);
  };
  
  // Format rest time for display
  const formatRestTime = (seconds: number): string => {
    if (seconds === 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <View style={styles.container}>
      {/* Header with exercise count */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('add_exercises')}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {formData.exercises.length} {formData.exercises.length === 1 ? t('exercise') : t('exercises')}
          </Text>
        </View>
      </View>
      
      {/* Error message if any */}
      {errors.exercises && (
        <Text style={styles.errorText}>{errors.exercises}</Text>
      )}
      
      {/* Exercise list */}
      <ScrollView 
        style={styles.exercisesList}
        contentContainerStyle={styles.exercisesListContent}
        showsVerticalScrollIndicator={false}
      >
        {formData.exercises.length > 0 ? (
          formData.exercises.map((exercise, index) => (
            <Animated.View 
              key={index} 
              style={[
                styles.exerciseCard,
                draggedExerciseIndex === index && {
                  transform: [{ translateY: pan.y }],
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                }
              ]}
              {...(draggedExerciseIndex === index ? panResponder.panHandlers : {})}
            >
              <TouchableOpacity
                style={styles.exerciseHeader}
                onPress={() => handleEditExercise(index)}
                onLongPress={() => handleStartDrag(index)}
                delayLongPress={200}
              >
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.setCount}>
                  {exercise.sets.length} {exercise.sets.length === 1 ? t('set') : t('sets')}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.exerciseDetails}>
                {/* First set info as summary */}
                <View style={styles.setInfo}>
                  <View style={styles.setInfoItem}>
                    <Text style={styles.setInfoLabel}>{t('reps')}:</Text>
                    <Text style={styles.setInfoValue}>{exercise.sets[0].reps}</Text>
                  </View>
                  <View style={styles.setInfoItem}>
                    <Text style={styles.setInfoLabel}>{t('weight')}:</Text>
                    <Text style={styles.setInfoValue}>
                      {exercise.sets[0].weight > 0 ? `${exercise.sets[0].weight}kg` : '-'}
                    </Text>
                  </View>
                  <View style={styles.setInfoItem}>
                    <Text style={styles.setInfoLabel}>{t('rest')}:</Text>
                    <Text style={styles.setInfoValue}>
                      {formatRestTime(exercise.sets[0].rest_time)}
                    </Text>
                  </View>
                </View>
                
                {/* Exercise notes preview if they exist */}
                {exercise.notes && (
                  <Text style={styles.exerciseNotes} numberOfLines={1}>
                    {exercise.notes}
                  </Text>
                )}
              </View>
              
              {/* Controls */}
              <View style={styles.exerciseControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleEditExercise(index)}
                >
                  <Ionicons name="create-outline" size={16} color="#0ea5e9" />
                  <Text style={styles.controlText}>{t('edit')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleRemoveExercise(index)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={[styles.controlText, styles.removeText]}>{t('remove')}</Text>
                </TouchableOpacity>
                
                <View style={styles.orderControls}>
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      index === 0 && styles.orderButtonDisabled
                    ]}
                    onPress={() => handleMoveExercise(index, 'up')}
                    disabled={index === 0}
                  >
                    <Ionicons name="chevron-up" size={16} color={index === 0 ? "#6B7280" : "#0ea5e9"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      index === formData.exercises.length - 1 && styles.orderButtonDisabled
                    ]}
                    onPress={() => handleMoveExercise(index, 'down')}
                    disabled={index === formData.exercises.length - 1}
                  >
                    <Ionicons name="chevron-down" size={16} color={index === formData.exercises.length - 1 ? "#6B7280" : "#0ea5e9"} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyStateText}>{t('no_exercises_yet')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('tap_to_add_exercises')}</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Add exercise button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddExercise}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>{t('add_exercise')}</Text>
      </TouchableOpacity>
      
      {/* Exercise selection modal */}
      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('select_exercise')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setExerciseModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Search bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder={t('search_exercises')}
                placeholderTextColor="#9CA3AF"
                selectionColor="#0ea5e9"
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchTerm('')}
                >
                  <Ionicons name="close" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Category tabs - Fixed height and proper spacing */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryTabs}
              contentContainerStyle={styles.categoryTabsContent}
            >
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  selectedCategory === null && styles.categoryTabSelected
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === null && styles.categoryTabTextSelected
                ]}>
                  {t('all')}
                </Text>
              </TouchableOpacity>
              
              {EXERCISE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category.id && styles.categoryTabSelected
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={[
                    styles.categoryTabText,
                    selectedCategory === category.id && styles.categoryTabTextSelected
                  ]}>
                    {t(category.displayName.toLowerCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Exercises list */}
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.exerciseListModal}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseItemModal}
                  onPress={() => handleSelectExercise(item.name)}
                >
                  <Text style={styles.exerciseItemText}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>
                    {searchTerm.length > 0 
                      ? t('no_matching_exercises') 
                      : t('no_exercises_in_category')}
                  </Text>
                  
                  {/* Custom exercise button */}
                  <TouchableOpacity
                    style={styles.customExerciseButton}
                    onPress={() => {
                      if (searchTerm.length > 0) {
                        handleSelectExercise(searchTerm);
                      } else {
                        Alert.alert(t('enter_exercise_name'), t('enter_custom_exercise_name'));
                      }
                    }}
                  >
                    <Ionicons name="add" size={16} color="#0ea5e9" />
                    <Text style={styles.customExerciseText}>
                      {searchTerm.length > 0 
                        ? t('add_custom_exercise_with_name', { name: searchTerm }) 
                        : t('add_custom_exercise')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {/* Exercise edit modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[
            styles.modalContent,
            keyboardVisible && { height: Platform.OS === 'ios' ? '90%' : '95%' }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editExerciseIndex !== null ? t('edit_exercise') : t('configure_exercise')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.editModalScroll}
              contentContainerStyle={[
                styles.editModalContent,
                { paddingBottom: keyboardVisible ? keyboardHeight + 100 : 100 }
              ]}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* Exercise name */}
              <View style={styles.exerciseNameContainer}>
                <Text style={styles.exerciseEditLabel}>{t('exercise_name')}</Text>
                <TextInput
                  style={styles.exerciseNameInput}
                  value={currentExerciseName}
                  onChangeText={setCurrentExerciseName}
                  placeholder={t('enter_exercise_name')}
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#0ea5e9"
                />
              </View>
              
              {/* Rest time toggle */}
              <View style={styles.restTimeToggleContainer}>
                <Text style={styles.exerciseEditLabel}>{t('rest_time')}</Text>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{restTimeEnabled ? t('enabled') : t('disabled')}</Text>
                  <Switch
                    value={restTimeEnabled}
                    onValueChange={handleToggleRestTime}
                    trackColor={{ false: '#374151', true: 'rgba(14, 165, 233, 0.4)' }}
                    thumbColor={restTimeEnabled ? '#0ea5e9' : '#6B7280'}
                  />
                </View>
              </View>
              
              {/* Sets section */}
              <View style={styles.setsSection}>
                <View style={styles.setsSectionHeader}>
                  <Text style={styles.exerciseEditLabel}>{t('sets')}</Text>
                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={handleAddSet}
                  >
                    <Ionicons name="add" size={16} color="#0ea5e9" />
                    <Text style={styles.addSetText}>{t('add_set')}</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Sets header */}
                <View style={styles.setsHeader}>
                  <Text style={[styles.setHeaderText, { flex: 0.5 }]}>{t('set')}</Text>
                  <Text style={styles.setHeaderText}>{t('reps')}</Text>
                  <Text style={styles.setHeaderText}>{t('weight')} (kg)</Text>
                  {restTimeEnabled && (
                    <Text style={styles.setHeaderText}>{t('rest')} (s)</Text>
                  )}
                  <View style={{ width: 40 }} />
                </View>
                
                {/* Set rows */}
                {currentExerciseSets.map((set, index) => (
                  <View key={index} style={styles.setRow}>
                    <Text style={[styles.setNumberText, { flex: 0.5 }]}>{index + 1}</Text>
                    
                    <View style={styles.setInputContainer}>
                      <TextInput
                        style={styles.setInput}
                        value={set.reps.toString()}
                        onChangeText={(text) => handleUpdateSet(index, 'reps', parseInt(text) || 0)}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                    </View>
                    
                    <View style={styles.setInputContainer}>
                      <TextInput
                        style={styles.setInput}
                        value={set.weight > 0 ? set.weight.toString() : ''}
                        onChangeText={(text) => handleUpdateSet(index, 'weight', parseFloat(text) || 0)}
                        keyboardType="decimal-pad"
                        maxLength={5}
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                      />
                    </View>
                    
                    {restTimeEnabled && (
                      <View style={styles.setInputContainer}>
                        <TextInput
                          style={styles.setInput}
                          value={set.rest_time.toString()}
                          onChangeText={(text) => handleUpdateSet(index, 'rest_time', parseInt(text) || 0)}
                          keyboardType="number-pad"
                          maxLength={3}
                        />
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={[
                        styles.removeSetButton, 
                        currentExerciseSets.length === 1 && styles.removeSetButtonDisabled
                      ]}
                      onPress={() => handleRemoveSet(index)}
                      disabled={currentExerciseSets.length === 1}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={16} 
                        color={currentExerciseSets.length === 1 ? "#6B7280" : "#EF4444"} 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              
              {/* Notes section */}
              <View style={styles.notesSection}>
                <Text style={styles.exerciseEditLabel}>{t('notes')} ({t('optional')})</Text>
                <TextInput
                  style={styles.notesInput}
                  value={currentExerciseNotes}
                  onChangeText={setCurrentExerciseNotes}
                  placeholder={t('exercise_notes_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            
            {/* Save button */}
            <TouchableOpacity
              style={[
                styles.saveExerciseButton,
                keyboardVisible && { bottom: Platform.OS === 'ios' ? keyboardHeight : 0 }
              ]}
              onPress={handleSaveExercise}
            >
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveExerciseText}>{t('save_exercise')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  exercisesList: {
    flex: 1,
  },
  exercisesListContent: {
    paddingBottom: 80, // Add padding for button
  },
  exerciseCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  setCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  exerciseDetails: {
    marginBottom: 8,
  },
  setInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  setInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setInfoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 4,
  },
  setInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  exerciseNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
  },
  exerciseControls: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
    marginTop: 4,
    justifyContent: 'space-between',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  controlText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 4,
  },
  removeText: {
    color: '#EF4444',
  },
  orderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  orderButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearSearchButton: {
    padding: 4,
  },
  
  // Category tabs - fixed size to avoid sizing issues
  categoryTabs: {
    height: 50, // Fixed height to avoid layout jumps
    marginBottom: 10,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    alignItems: 'center', // Ensure proper alignment
  },
  categoryTab: {
    paddingHorizontal: 16, // More padding horizontal for text
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    marginRight: 8,
    height: 36, // Fixed height
    justifyContent: 'center', // Center text
  },
  categoryTabSelected: {
    backgroundColor: '#0284c7',
    height: 36, // Keep same height when selected
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    textAlign: 'center', // Center text
  },
  categoryTabTextSelected: {
    color: '#FFFFFF',
  },
  
  // Exercise list in modal
  exerciseListModal: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  exerciseItemModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptySearch: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  customExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  customExerciseText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 8,
  },
  
  // Edit exercise modal
  editModalScroll: {
    flex: 1,
  },
  editModalContent: {
    padding: 16,
    paddingBottom: 100, // Space for save button
  },
  exerciseNameContainer: {
    marginBottom: 20,
  },
  exerciseEditLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  exerciseNameInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Rest time toggle
  restTimeToggleContainer: {
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Sets section
  setsSection: {
    marginBottom: 20,
  },
  setsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 4,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  setHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumberText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
    textAlign: 'center',
  },
  setInputContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  setInput: {
    backgroundColor: '#1F2937',
    borderRadius: 6,
    height: 38,
    paddingHorizontal: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 14,
  },
  removeSetButton: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSetButtonDisabled: {
    opacity: 0.5,
  },
  
  // Notes section
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 80,
  },
  
  // Save button
  saveExerciseButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  saveExerciseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default Step2Exercises;