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
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

// Types
export type ExerciseSet = {
  reps: number;
  weight: number;
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
  superset_with?: number | null;
  is_superset?: boolean;
  superset_rest_time?: number;
  superset_paired_exercise?: { name: string; id: number } | null;
};

type ExerciseConfiguratorProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  exerciseName: string;
  initialSets?: ExerciseSet[];
  initialNotes?: string;
  isSuperset?: boolean;
  supersetWith?: number | null;
  supersetRestTime?: number;
  supersetPairedExerciseName?: string | null;
  isEdit?: boolean;
};

// Default set values
const DEFAULT_SET: ExerciseSet = {
  reps: 10,
  weight: 0,
  rest_time: 60 // 60 seconds
};

const ExerciseConfigurator = ({
  visible,
  onClose,
  onSave,
  exerciseName,
  initialSets = [{ ...DEFAULT_SET }],
  initialNotes = '',
  isSuperset = false,
  supersetWith = null,
  supersetRestTime = 90,
  supersetPairedExerciseName = null,
  isEdit = false
}: ExerciseConfiguratorProps) => {
  const { t } = useLanguage();
  
  // State
  const [currentExerciseName, setCurrentExerciseName] = useState(exerciseName);
  const [currentExerciseSets, setCurrentExerciseSets] = useState<ExerciseSet[]>(initialSets);
  const [currentExerciseNotes, setCurrentExerciseNotes] = useState(initialNotes);
  const [restTimeEnabled, setRestTimeEnabled] = useState(true);
  const [currentSupersetRestTime, setCurrentSupersetRestTime] = useState(supersetRestTime);
  
  // Keyboard handling
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Reset states when props change
  useEffect(() => {
    setCurrentExerciseName(exerciseName);
    setCurrentExerciseSets(initialSets);
    setCurrentExerciseNotes(initialNotes);
    
    // Check if rest time is enabled based on initial sets
    const hasRestTime = initialSets.some(set => set.rest_time > 0);
    setRestTimeEnabled(hasRestTime);
    
    setCurrentSupersetRestTime(supersetRestTime);
  }, [exerciseName, initialSets, initialNotes, supersetRestTime, visible]);
  
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
  
  // Handle adding a set
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
    if (currentExerciseSets.length <= 1) {
      return; // Don't remove the last set
    }
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
  
  // Handle saving the exercise
  const handleSaveExercise = () => {
    // Ensure each set has an order field based on its index
    const setsWithOrder = currentExerciseSets.map((set, index) => ({
      ...set,
      order: index
    }));
    
    const newExercise: Exercise = {
      name: currentExerciseName,
      sets: setsWithOrder,
      notes: currentExerciseNotes.trim() || undefined,
      is_superset: isSuperset,
      superset_with: supersetWith,
      superset_rest_time: isSuperset ? currentSupersetRestTime : undefined
    };
    
    onSave(newExercise);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
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
              {isEdit ? t('edit_exercise') : t('configure_exercise')}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
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
            
            {/* Superset information if applicable */}
            {isSuperset && supersetWith !== null && supersetPairedExerciseName && (
              <View style={styles.supersetInfoSection}>
                <Text style={styles.exerciseEditLabel}>{t('superset_info')}</Text>
                <View style={styles.supersetInfoContent}>
                  <Ionicons name="link" size={16} color="#0ea5e9" style={{ marginRight: 8 }} />
                  <Text style={styles.supersetInfoText}>
                    {t('paired_with')}: {supersetPairedExerciseName}
                  </Text>
                </View>
                
                <View style={styles.supersetRestTimeSection}>
                  <Text style={styles.exerciseEditLabel}>{t('superset_rest_time')} (s)</Text>
                  <TextInput
                    style={styles.supersetRestTimeInput}
                    value={currentSupersetRestTime.toString()}
                    onChangeText={(text) => setCurrentSupersetRestTime(parseInt(text) || 90)}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
              </View>
            )}
            
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
  );
};

const styles = StyleSheet.create({
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
  supersetInfoSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  supersetInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supersetInfoText: {
    fontSize: 14,
    color: '#E5E7EB',
    flex: 1,
  },
  supersetRestTimeSection: {
    marginTop: 4,
  },
  supersetRestTimeInput: {
    backgroundColor: '#1F2937',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
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

export default ExerciseConfigurator;