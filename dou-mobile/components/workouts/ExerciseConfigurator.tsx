// components/workouts/ExerciseConfigurator.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

// Types
export type ExerciseSet = {
  reps?: number | null;
  weight?: number | null;
  weight_unit?: 'kg' | 'lbs';
  duration?: number | null; // For time-based exercises (in seconds)
  distance?: number | null; // For distance-based exercises (in meters)
  rest_time: number;
  order?: number;
};

export type Exercise = {
  id?: number;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  order?: number;
  equipment?: string;
  effort_type?: 'reps' | 'time' | 'distance';
  superset_with?: number | null;
  is_superset?: boolean;
  superset_rest_time?: number;
  superset_paired_exercise?: { name: string; id: number } | null;
};

type ExerciseConfiguratorProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  exerciseName?: string;
  initialEffortType?: 'reps' | 'time' | 'distance';
  initialSets?: ExerciseSet[];
  initialNotes?: string;
  isSuperset?: boolean;
  supersetWith?: number | null;
  supersetRestTime?: number;
  supersetPairedExerciseName?: string | null;
  isEdit?: boolean;
};

// Default set values based on effort type
const getDefaultSet = (effortType: 'reps' | 'time' | 'distance' = 'reps'): ExerciseSet => {
  switch (effortType) {
    case 'time':
      return {
        duration: 30, // 30 seconds
        weight: null,
        weight_unit: 'kg',
        rest_time: 60
      };
    case 'distance':
      return {
        distance: 100, // 100 meters
        duration: null, // Optional: time taken to complete distance
        rest_time: 120
      };
    case 'reps':
    default:
      return {
        reps: 10,
        weight: 20,
        weight_unit: 'kg',
        rest_time: 60
      };
  }
};

const ExerciseConfigurator = ({
  visible,
  onClose,
  onSave,
  exerciseName = '',
  initialEffortType = 'reps',
  initialSets,
  initialNotes = '',
  isSuperset = false,
  supersetWith = null,
  supersetRestTime = 90,
  supersetPairedExerciseName = null,
  isEdit = false
}: ExerciseConfiguratorProps) => {
  const { t } = useLanguage();
  const { workoutPalette, palette } = useTheme();
  
  // State
  const [currentExerciseName, setCurrentExerciseName] = useState(exerciseName);
  const [currentEffortType, setCurrentEffortType] = useState<'reps' | 'time' | 'distance'>(initialEffortType);
  const [currentExerciseSets, setCurrentExerciseSets] = useState<ExerciseSet[]>(
    initialSets && initialSets.length > 0 ? initialSets : [getDefaultSet(initialEffortType)]
  );
  const [currentExerciseNotes, setCurrentExerciseNotes] = useState(initialNotes);
  const [restTimeEnabled, setRestTimeEnabled] = useState(true);
  const [currentSupersetRestTime, setCurrentSupersetRestTime] = useState(supersetRestTime);
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<'kg' | 'lbs'>('kg');
  
  // Keyboard handling
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [editingValues, setEditingValues] = useState<{[key: string]: string}>({});
  
  // Reset states when props change
  useEffect(() => {
    setCurrentExerciseName(exerciseName);
    setCurrentEffortType(initialEffortType);
    
    if (initialSets && initialSets.length > 0) {
      setCurrentExerciseSets(initialSets);
      // Check if rest time is enabled based on initial sets
      const hasRestTime = initialSets.some(set => set.rest_time > 0);
      setRestTimeEnabled(hasRestTime);
      
      // Set preferred weight unit from first set that has weight
      const setWithWeight = initialSets.find(set => set.weight_unit);
      if (setWithWeight?.weight_unit) {
        setPreferredWeightUnit(setWithWeight.weight_unit);
      }
    } else {
      setCurrentExerciseSets([getDefaultSet(initialEffortType)]);
      setRestTimeEnabled(true);
    }
    
    setCurrentExerciseNotes(initialNotes);
    setCurrentSupersetRestTime(supersetRestTime);
  }, [exerciseName, initialEffortType, initialSets, initialNotes, supersetRestTime, visible]);
  
  // Add keyboard event listeners
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
  
  // Handle effort type change - SIMPLIFIED (no alert)
  const handleEffortTypeChange = (newEffortType: 'reps' | 'time' | 'distance') => {
    setCurrentEffortType(newEffortType);
    // Reset sets to default for new effort type
    setCurrentExerciseSets([getDefaultSet(newEffortType)]);
  };
  
  // Handle adding a set
  const handleAddSet = () => {
    if (currentExerciseSets.length > 0) {
      // Copy values from the last set
      const lastSet = currentExerciseSets[currentExerciseSets.length - 1];
      const newSet = { ...lastSet };
      setCurrentExerciseSets([...currentExerciseSets, newSet]);
    } else {
      setCurrentExerciseSets([...currentExerciseSets, getDefaultSet(currentEffortType)]);
    }
  };
  
  // Handle removing a set
  const handleRemoveSet = (index: number) => {
    if (currentExerciseSets.length <= 1) {
      return; // Don't remove the last set
    }
    const updatedSets = [...currentExerciseSets];
    updatedSets.splice(index, 1);
    setCurrentExerciseSets(updatedSets);
  };
  
  // Handle updating a set - IMPROVED decimal handling for French keyboards
  const handleUpdateSet = (index: number, field: keyof ExerciseSet, value: number | string | null) => {
    const updatedSets = [...currentExerciseSets];
    console.log(value);
    if (field === 'weight_unit') {
      updatedSets[index] = {
        ...updatedSets[index],
        [field]: value as 'kg' | 'lbs'
      };
    } else if (field === 'weight' || field === 'distance') {
      // IMPROVED: Handle decimal inputs properly with better comma/dot handling
      let numericValue: number | null = null;
      if (typeof value === 'string') {
        // Replace comma with dot for European decimal format and clean the string
        const cleanValue = value.replace(',', '.').replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleanValue);
        numericValue = isNaN(parsed) ? null : parsed;
      } else if (typeof value === 'number') {
        numericValue = value;
      }
      
      updatedSets[index] = {
        ...updatedSets[index],
        [field]: numericValue
      };
    } else if (field === 'duration') {
      // FIXED: Handle duration input more simply
      let numericValue: number | null = null;
      if (typeof value === 'string') {
        // Simple parsing: if it ends with 'm', treat as minutes, otherwise treat as seconds
        const cleanValue = value.trim();
        if (cleanValue.toLowerCase().endsWith('m')) {
          const minutes = parseFloat(cleanValue.replace(/[^\d.-]/g, ''));
          numericValue = isNaN(minutes) ? null : minutes * 60;
        } else {
          // Treat as seconds
          const seconds = parseFloat(cleanValue.replace(/[^\d.-]/g, ''));
          numericValue = isNaN(seconds) ? null : seconds;
        }
      } else if (typeof value === 'number') {
        numericValue = value;
      }
      
      updatedSets[index] = {
        ...updatedSets[index],
        [field]: numericValue
      };
    } else {
      // For other numeric fields (reps, rest_time)
      let numericValue: number | null = null;
      if (typeof value === 'string') {
        const parsed = parseInt(value);
        numericValue = isNaN(parsed) ? null : parsed;
      } else if (typeof value === 'number') {
        numericValue = value;
      }
      
      updatedSets[index] = {
        ...updatedSets[index],
        [field]: numericValue
      };
    }
    
    // Update preferred weight unit if it was changed
    if (field === 'weight_unit' && value) {
      setPreferredWeightUnit(value as 'kg' | 'lbs');
    }
    
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
  
  // Update all sets to use preferred weight unit
  const handleChangeWeightUnit = (newUnit: 'kg' | 'lbs') => {
    setPreferredWeightUnit(newUnit);
    
    const updatedSets = currentExerciseSets.map(set => ({
      ...set,
      weight_unit: newUnit
    }));
    
    setCurrentExerciseSets(updatedSets);
  };
  
  // Format time display for non-editing display only
  const formatTimeDisplay = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };
  
  // Handle saving the exercise
  const handleSaveExercise = () => {
    // Validation
    if (!currentExerciseName.trim()) {
      Alert.alert(t('error'), t('exercise_name_required'));
      return;
    }
    
    // Validate sets based on effort type
    const hasValidSets = currentExerciseSets.some(set => {
      switch (currentEffortType) {
        case 'time':
          return (set.duration && set.duration > 0);
        case 'distance':
          return (set.distance && set.distance > 0);
        case 'reps':
        default:
          return (set.reps && set.reps > 0);
      }
    });
    
    if (!hasValidSets) {
      Alert.alert(t('error'), t('at_least_one_valid_set_required'));
      return;
    }
    
    // Ensure each set has an order field based on its index
    const setsWithOrder = currentExerciseSets.map((set, index) => ({
      ...set,
      order: index,
      weight_unit: set.weight_unit || preferredWeightUnit
    }));
    
    const newExercise: Exercise = {
      name: currentExerciseName,
      effort_type: currentEffortType,
      sets: setsWithOrder,
      notes: currentExerciseNotes.trim() || undefined,
      is_superset: isSuperset,
      superset_with: supersetWith,
      superset_rest_time: isSuperset ? currentSupersetRestTime : undefined
    };
    
    onSave(newExercise);
  };
  
  // Render a single set row - UPDATED with better duration input handling
  const renderSetRow = (set: ExerciseSet, index: number) => {
    const getInputValue = (field: 'weight' | 'distance') => {
      const editKey = `${index}-${field}`;
      
      // If currently editing this field, return the editing value
      if (editingValues[editKey] !== undefined) {
        return editingValues[editKey];
      }
      
      // Otherwise, return the formatted stored value
      const storedValue = set[field];
      if (storedValue && storedValue > 0) {
        return storedValue.toString().replace('.', ',');
      }
      
      return '';
    };

    // FIXED: Get duration input value - simpler approach
    const getDurationInputValue = () => {
      const editKey = `${index}-duration`;
      
      // If currently editing this field, return the editing value
      if (editingValues[editKey] !== undefined) {
        return editingValues[editKey];
      }
      
      // Otherwise, return the raw seconds value for editing
      if (set.duration && set.duration > 0) {
        return set.duration.toString();
      }
      
      return '';
    };
  
    const handleInputChange = (field: 'weight' | 'distance', text: string) => {
      const editKey = `${index}-${field}`;
      
      // Store the display text locally
      setEditingValues(prev => ({
        ...prev,
        [editKey]: text
      }));
    };

    // FIXED: Handle duration input change
    const handleDurationInputChange = (text: string) => {
      const editKey = `${index}-duration`;
      
      // Store the display text locally
      setEditingValues(prev => ({
        ...prev,
        [editKey]: text
      }));
    };
  
    const handleInputBlur = (field: 'weight' | 'distance') => {
      const editKey = `${index}-${field}`;
      const currentText = editingValues[editKey];
      
      if (currentText !== undefined) {
        // Process the value and update the actual state
        handleUpdateSet(index, field, currentText);
        
        // Clear the editing state
        setEditingValues(prev => {
          const newState = { ...prev };
          delete newState[editKey];
          return newState;
        });
      }
    };

    // FIXED: Handle duration input blur
    const handleDurationInputBlur = () => {
      const editKey = `${index}-duration`;
      const currentText = editingValues[editKey];
      
      if (currentText !== undefined) {
        // Process the value and update the actual state
        handleUpdateSet(index, 'duration', currentText);
        
        // Clear the editing state
        setEditingValues(prev => {
          const newState = { ...prev };
          delete newState[editKey];
          return newState;
        });
      }
    };
  
    return (
      <View key={index} style={[styles.setRow, { backgroundColor: palette.input_background }]}>
        <View style={[
          styles.setNumberContainer,
          { backgroundColor: workoutPalette.highlight }
        ]}>
          <Text style={styles.setNumberText}>{index + 1}</Text>
        </View>
        
        <View style={styles.setInputsRow}>
          {currentEffortType === 'reps' && (
            <>
              <View style={styles.compactInputContainer}>
                <Text style={[styles.compactInputLabel, { color: palette.text_tertiary }]}>{t('reps')}</Text>
                <TextInput
                  style={[
                    styles.compactInput,
                    { 
                      backgroundColor: palette.card_background,
                      color: workoutPalette.text
                    }
                  ]}
                  value={set.reps?.toString() || ''}
                  onChangeText={(text) => handleUpdateSet(index, 'reps', text)}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor={palette.text_tertiary}
                />
              </View>
              
              <View style={styles.compactInputContainer}>
                <Text style={[styles.compactInputLabel, { color: palette.text_tertiary }]}>{t('weight')} ({preferredWeightUnit})</Text>
                <TextInput
                  style={[
                    styles.compactInput,
                    { 
                      backgroundColor: palette.card_background,
                      color: workoutPalette.text
                    }
                  ]}
                  value={getInputValue('weight')}
                  onChangeText={(text) => handleInputChange('weight', text)}
                  onBlur={() => handleInputBlur('weight')}
                  onSubmitEditing={() => handleInputBlur('weight')}
                  keyboardType="decimal-pad"
                  placeholder="20"
                  placeholderTextColor={palette.text_tertiary}
                />
              </View>
            </>
          )}
          
          {currentEffortType === 'time' && (
            <>
              <View style={styles.compactInputContainer}>
                <Text style={[styles.compactInputLabel, { color: palette.text_tertiary }]}>{t('duration')} (s)</Text>
                <TextInput
                  style={[
                    styles.compactInput,
                    { 
                      backgroundColor: palette.card_background,
                      color: workoutPalette.text
                    }
                  ]}
                  value={getDurationInputValue()}
                  onChangeText={handleDurationInputChange}
                  onBlur={handleDurationInputBlur}
                  onSubmitEditing={handleDurationInputBlur}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={palette.text_tertiary}
                />
              </View>
              
              <View style={styles.compactInputContainer}>
                <Text style={[styles.compactInputLabel, { color: palette.text_tertiary }]}>{t('weight')} ({preferredWeightUnit})</Text>
                <TextInput
                  style={[
                    styles.compactInput,
                    { 
                      backgroundColor: palette.card_background,
                      color: workoutPalette.text
                    }
                  ]}
                  value={getInputValue('weight')}
                  onChangeText={(text) => handleInputChange('weight', text)}
                  onBlur={() => handleInputBlur('weight')}
                  onSubmitEditing={() => handleInputBlur('weight')}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={palette.text_tertiary}
                />
              </View>
            </>
          )}
          
          {currentEffortType === 'distance' && (
            <>
              <View style={styles.compactInputContainer}>
                <Text style={[styles.compactInputLabel, { color: palette.text_tertiary }]}>{t('distance')} (m)</Text>
                <TextInput
                  style={[
                    styles.compactInput,
                    { 
                      backgroundColor: palette.card_background,
                      color: workoutPalette.text
                    }
                  ]}
                  value={getInputValue('distance')}
                  onChangeText={(text) => handleInputChange('distance', text)}
                  onBlur={() => handleInputBlur('distance')}
                  onSubmitEditing={() => handleInputBlur('distance')}
                  keyboardType="decimal-pad"
                  placeholder="100"
                  placeholderTextColor={palette.text_tertiary}
                />
              </View>
              
              <View style={styles.compactInputContainer}>
                <Text style={[styles.compactInputLabel, { color: palette.text_tertiary }]}>{t('time')} (s)</Text>
                <TextInput
                  style={[
                    styles.compactInput,
                    { 
                      backgroundColor: palette.card_background,
                      color: workoutPalette.text
                    }
                  ]}
                  value={getDurationInputValue()}
                  onChangeText={handleDurationInputChange}
                  onBlur={handleDurationInputBlur}
                  onSubmitEditing={handleDurationInputBlur}
                  keyboardType="number-pad"
                  placeholder="120"
                  placeholderTextColor={palette.text_tertiary}
                />
              </View>
            </>
          )}
          
          {restTimeEnabled && (
            <View style={styles.compactInputContainer}>
              <Text style={[styles.compactInputLabel, { color: palette.text_tertiary }]}>{t('rest')} (s)</Text>
              <TextInput
                style={[
                  styles.compactInput,
                  { 
                    backgroundColor: palette.card_background,
                    color: workoutPalette.text
                  }
                ]}
                value={set.rest_time.toString()}
                onChangeText={(text) => handleUpdateSet(index, 'rest_time', text)}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="60"
                placeholderTextColor={palette.text_tertiary}
              />
            </View>
          )}
        </View>
        
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
            color={currentExerciseSets.length === 1 ? palette.text_tertiary : palette.error} 
          />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: palette.page_background }]}>
            <View style={[
              styles.modalHeader,
              { borderBottomColor: palette.border }
            ]}>
              <Text style={[styles.modalTitle, { color: workoutPalette.text }]}>
                {isEdit ? t('edit_exercise') : t('configure_exercise')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={20} color={workoutPalette.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.editModalScroll}
              contentContainerStyle={[
                styles.editModalContent,
                { paddingBottom: keyboardVisible ? 100 : 100 }
              ]}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* Exercise name */}
              <View style={styles.exerciseNameContainer}>
                <Text style={[styles.exerciseEditLabel, { color: workoutPalette.text }]}>{t('exercise_name')}</Text>
                <TextInput
                  style={[
                    styles.exerciseNameInput,
                    { 
                      backgroundColor: palette.input_background,
                      color: workoutPalette.text
                    }
                  ]}
                  value={currentExerciseName}
                  onChangeText={setCurrentExerciseName}
                  placeholder={t('enter_exercise_name')}
                  placeholderTextColor={palette.text_tertiary}
                  selectionColor={workoutPalette.highlight}
                />
              </View>
              
              {/* Effort Type Selection */}
              <View style={styles.effortTypeContainer}>
                <Text style={[styles.exerciseEditLabel, { color: workoutPalette.text }]}>{t('effort_type')}</Text>
                <View style={styles.effortTypeButtons}>
                  {[
                    { type: 'reps' as const, icon: 'repeat-outline', label: t('reps') },
                    { type: 'time' as const, icon: 'time-outline', label: t('time') },
                    { type: 'distance' as const, icon: 'location-outline', label: t('distance') }
                  ].map(({ type, icon, label }) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.effortTypeButton,
                        { backgroundColor: palette.input_background },
                        currentEffortType === type && { backgroundColor: workoutPalette.highlight }
                      ]}
                      onPress={() => handleEffortTypeChange(type)}
                    >
                      <Ionicons 
                        name={icon as any} 
                        size={16} 
                        color={currentEffortType === type ? '#FFFFFF' : palette.text_tertiary} 
                      />
                      <Text style={[
                        styles.effortTypeButtonText,
                        { color: palette.text_tertiary },
                        currentEffortType === type && { color: '#FFFFFF' }
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Weight Unit Selection (only for reps and time exercises that can have weight) */}
              {(currentEffortType === 'reps' || currentEffortType === 'time') && (
                <View style={styles.weightUnitContainer}>
                  <Text style={[styles.exerciseEditLabel, { color: workoutPalette.text }]}>{t('weight_unit')}</Text>
                  <View style={styles.weightUnitButtons}>
                    {['kg', 'lbs'].map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.weightUnitButton,
                          { backgroundColor: palette.input_background },
                          preferredWeightUnit === unit && { backgroundColor: workoutPalette.highlight }
                        ]}
                        onPress={() => handleChangeWeightUnit(unit as 'kg' | 'lbs')}
                      >
                        <Text style={[
                          styles.weightUnitButtonText,
                          { color: palette.text_tertiary },
                          preferredWeightUnit === unit && { color: '#FFFFFF' }
                        ]}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              {/* Superset information if applicable */}
              {isSuperset && supersetWith !== null && supersetPairedExerciseName && (
                <View style={[
                  styles.supersetInfoSection,
                  { 
                    backgroundColor: `${workoutPalette.highlight}05`,
                    borderLeftColor: workoutPalette.highlight
                  }
                ]}>
                  <Text style={[styles.exerciseEditLabel, { color: workoutPalette.text }]}>{t('superset_info')}</Text>
                  <View style={styles.supersetInfoContent}>
                    <Ionicons name="link" size={16} color={workoutPalette.highlight} style={{ marginRight: 8 }} />
                    <Text style={[styles.supersetInfoText, { color: palette.text }]}>
                      {t('paired_with')}: {supersetPairedExerciseName}
                    </Text>
                  </View>
                  
                  <View style={styles.supersetRestTimeSection}>
                    <Text style={[styles.exerciseEditLabel, { color: workoutPalette.text }]}>{t('superset_rest_time')} (s)</Text>
                    <TextInput
                      style={[
                        styles.supersetRestTimeInput,
                        { 
                          backgroundColor: palette.input_background,
                          color: workoutPalette.text
                        }
                      ]}
                      value={currentSupersetRestTime.toString()}
                      onChangeText={(text) => setCurrentSupersetRestTime(parseInt(text) || 90)}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                </View>
              )}
              
              {/* Sets section with compact layout */}
              <View style={styles.setsSection}>
                <View style={styles.setsSectionHeader}>
                  <Text style={[styles.exerciseEditLabel, { color: workoutPalette.text }]}>{t('sets')}</Text>
                  <TouchableOpacity
                    style={[
                      styles.addSetButton,
                      { backgroundColor: `${workoutPalette.highlight}15` }
                    ]}
                    onPress={handleAddSet}
                  >
                    <Ionicons name="add" size={16} color={workoutPalette.highlight} />
                    <Text style={[styles.addSetText, { color: workoutPalette.highlight }]}>{t('add_set')}</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Set rows with compact layout */}
                {currentExerciseSets.map((set, index) => renderSetRow(set, index))}
              </View>
              
              {/* Rest time toggle - now smaller and less prominent */}
              <View style={[
                styles.restTimeToggleContainer,
                { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
              ]}>
                <View style={styles.toggleRow}>
                  <Text style={[styles.toggleLabel, { color: palette.text_tertiary }]}>{t('rest_time')}</Text>
                  <Switch
                    value={restTimeEnabled}
                    onValueChange={handleToggleRestTime}
                    trackColor={{ 
                      false: palette.card_background, 
                      true: `${workoutPalette.highlight}40` 
                    }}
                    thumbColor={restTimeEnabled ? workoutPalette.highlight : palette.text_tertiary}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>
              </View>
              
              {/* Notes section */}
              <View style={styles.notesSection}>
                <Text style={[styles.exerciseEditLabel, { color: workoutPalette.text }]}>{t('notes')} ({t('optional')})</Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    { 
                      backgroundColor: palette.input_background,
                      color: workoutPalette.text
                    }
                  ]}
                  value={currentExerciseNotes}
                  onChangeText={setCurrentExerciseNotes}
                  placeholder={t('exercise_notes_placeholder')}
                  placeholderTextColor={palette.text_tertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            
            {/* Save button - fixed positioning */}
            <View style={[
              styles.saveButtonContainer,
              { 
                backgroundColor: palette.page_background,
                borderTopColor: palette.border
              },
              keyboardVisible && Platform.OS === 'ios' && { 
                paddingBottom: Math.max(20, keyboardHeight - 300) 
              }
            ]}>
              <TouchableOpacity
                style={[styles.saveExerciseButton, { backgroundColor: workoutPalette.highlight }]}
                onPress={handleSaveExercise}
              >
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveExerciseText}>{t('save_exercise')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '90%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  editModalScroll: {
    flex: 1,
  },
  editModalContent: {
    padding: 16,
  },
  exerciseNameContainer: {
    marginBottom: 20,
  },
  exerciseEditLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseNameInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  effortTypeContainer: {
    marginBottom: 20,
  },
  effortTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  effortTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  effortTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  weightUnitContainer: {
    marginBottom: 20,
  },
  weightUnitButtons: {
    flexDirection: 'row',
  },
  weightUnitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
  },
  weightUnitButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  supersetInfoSection: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  supersetInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supersetInfoText: {
    fontSize: 14,
    flex: 1,
  },
  supersetRestTimeSection: {
    marginTop: 4,
  },
  supersetRestTimeInput: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  setsSection: {
    marginBottom: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // NEW COMPACT SET ROW STYLES
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 8,
    padding: 8,
  },
  setNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  setInputsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  compactInputContainer: {
    marginRight: 6,
    marginBottom: 4,
    minWidth: 70,
  },
  compactInputLabel: {
    fontSize: 10,
    marginBottom: 2,
    fontWeight: '500',
  },
  compactInput: {
    borderRadius: 4,
    height: 32,
    paddingHorizontal: 6,
    textAlign: 'center',
    fontSize: 13,
  },
  removeSetButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  removeSetButtonDisabled: {
    opacity: 0.5,
  },
  
  // SMALLER REST TIME TOGGLE
  restTimeToggleContainer: {
    marginBottom: 16,
    borderRadius: 6,
    padding: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
  },
  
  // FIXED SAVE BUTTON CONTAINER
  saveButtonContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  saveExerciseButton: {
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

export default ExerciseConfigurator;