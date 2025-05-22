
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

interface SetData {
  id: string | number;
  reps: number;
  weight: number;
  rest_time: number;
  completed: boolean;
  actual_reps?: number;
  actual_weight?: number;
}

interface EditableFieldProps {
  value: string | number;
  onEdit: () => void;
  editable: boolean;
  completed: boolean;
  label?: string;
  suffix?: string;
  theme: any;
}

// Editable field component for better reusability
const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onEdit, 
  editable, 
  completed,
  label,
  suffix = '',
  theme
}) => {
  return (
    <Pressable
      style={[styles.editableField, { backgroundColor: editable ? `${theme.accent}10` : 'transparent' }]}
      onPress={() => editable && onEdit()}
    >
      {label && (
        <Text style={[styles.fieldLabel, { color: theme.text_tertiary }]}>{label}</Text>
      )}
      <Text style={[
        styles.fieldValue, 
        { 
          color: theme.text,
          textDecorationLine: editable ? 'underline' : 'none',
          textDecorationColor: theme.accent,
        }
      ]}>
        {value}{suffix}
      </Text>
    </Pressable>
  );
};

// Animated set row component with swipe actions
const SetRow = ({ 
  set, 
  index, 
  onComplete, 
  onEdit, 
  onUncomplete,
  onStartRest,
  onRemove,
  last,
  isCompleted,
  disabled,
  theme
}) => {
  // Animation values
  const rowScale = useRef(new Animated.Value(1)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;

  const handleComplete = () => {
    Animated.sequence([
      Animated.timing(rowScale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rowScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    onComplete();
  };
  
  const handleUncomplete = () => {
    Animated.sequence([
      Animated.timing(rowOpacity, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rowOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    onUncomplete();
  };
  
  const handleEditPress = (field) => {
    Animated.timing(rowOpacity, {
      toValue: 0.8,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(rowOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
      onEdit(field);
    });
  };

  return (
    <Animated.View 
      style={[
        styles.setRow,
        {
          borderBottomColor: theme.border,
          backgroundColor: isCompleted ? `${theme.success}15` : 'transparent',
          borderBottomWidth: last ? 0 : 1,
          transform: [{ scale: rowScale }],
          opacity: rowOpacity,
        }
      ]}
    >
      {/* Set number with indicator */}
      <View style={styles.setNumberContainer}>
        <View style={[
          styles.setNumberBadge, 
          { 
            backgroundColor: isCompleted ? theme.success : theme.accent,
            opacity: isCompleted ? 1 : 0.8
          }
        ]}>
          <Text style={[styles.setNumberText, { color: '#FFFFFF' }]}>{index + 1}</Text>
        </View>
      </View>
      
      <View style={styles.setDetails}>
        <View style={styles.setValues}>
          {/* Reps */}
          <EditableField
            value={set.actual_reps !== undefined ? set.actual_reps : set.reps}
            onEdit={() => handleEditPress('reps')}
            editable={true} // Always editable
            completed={isCompleted}
            label="REPS"
            theme={theme}
          />
          
          {/* Weight */}
          <EditableField
            value={set.actual_weight !== undefined ? set.actual_weight : set.weight}
            onEdit={() => handleEditPress('weight')}
            editable={true} // Always editable
            completed={isCompleted}
            label="WEIGHT"
            suffix={set.weight || set.actual_weight ? ' kg' : ''}
            theme={theme}
          />
          
          {/* Rest */}
          <EditableField
            value={set.rest_time}
            onEdit={() => handleEditPress('rest')}
            editable={true} // Always editable
            completed={isCompleted}
            label="REST"
            suffix={set.rest_time ? ' s' : ''}
            theme={theme}
          />
        </View>
      </View>
      
      {/* Action buttons */}
      <View style={styles.setActions}>
        {isCompleted ? (
          <View style={styles.completedActions}>
            {/* Uncomplete button */}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.warning }]}
              onPress={handleUncomplete}
            >
              <Ionicons name="arrow-undo" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Start rest timer */}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: `${theme.accent}90` }]}
              onPress={onStartRest}
            >
              <Ionicons name="timer-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Remove set */}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: `${theme.error}90` }]}
              onPress={onRemove}
            >
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.incompleteActions}>
            <TouchableOpacity
              style={[
                styles.completeSetButton, 
                { 
                  backgroundColor: theme.accent,
                }
              ]}
              onPress={handleComplete}
            >
              <Text style={[styles.completeSetText, { color: '#FFFFFF' }]}>Complete</Text>
            </TouchableOpacity>
            
            {/* Remove set */}
            <TouchableOpacity
              style={[styles.iconButton, { 
                backgroundColor: `${theme.error}90`
              }]}
              onPress={onRemove}
            >
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

interface RealtimeExerciseCardProps {
  exercise: any;
  exerciseIndex: number;
  onCompleteSet: (exerciseIndex: number, setIndex: number, setData: any) => void;
  onUncompleteSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, setData: any) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onStartRestTimer: (seconds: number) => void;
  editingPrevious?: boolean;
  themePalette: any;
}

const RealtimeExerciseCard: React.FC<RealtimeExerciseCardProps> = ({
  exercise,
  exerciseIndex,
  onCompleteSet,
  onUncompleteSet,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onStartRestTimer,
  editingPrevious = false,
  themePalette,
}) => {
  const { t } = useLanguage();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSet, setEditingSet] = useState<{index: number, field: string} | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  
  // Animation for edit modal
  const modalAnimation = useRef(new Animated.Value(0)).current;

  // Handle set completion
  const handleCompleteSet = (setIndex: number) => {
    const set = exercise.sets[setIndex];
    onCompleteSet(exerciseIndex, setIndex, {
      actual_reps: set.actual_reps !== undefined ? set.actual_reps : set.reps,
      actual_weight: set.actual_weight !== undefined ? set.actual_weight : set.weight,
    });
    
    // Always start rest timer when completing a set
    if (set.rest_time > 0) {
      onStartRestTimer(set.rest_time);
    }
  };

  // Handle set uncompletion (new function)
  const handleUncompleteSet = (setIndex: number) => {
    onUncompleteSet(exerciseIndex, setIndex);
  };

  // Show edit modal for a field
  const showEditModal = (setIndex: number, field: string) => {
    const set = exercise.sets[setIndex];
    let initialValue = '';
    
    switch (field) {
      case 'reps':
        initialValue = (set.actual_reps !== undefined ? set.actual_reps : set.reps).toString();
        break;
      case 'weight':
        initialValue = (set.actual_weight !== undefined ? set.actual_weight : set.weight).toString();
        break;
      case 'rest':
        initialValue = set.rest_time.toString();
        break;
    }
    
    setEditingSet({index: setIndex, field});
    setTempValue(initialValue);
    
    // Animate modal in
    setEditModalVisible(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };
  
  // Hide edit modal
  const hideEditModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start(() => {
      setEditModalVisible(false);
      setEditingSet(null);
    });
  };
  
  // Save edited value
  const saveEditedValue = () => {
    if (!editingSet) return;
    
    const { index, field } = editingSet;
    const numValue = parseFloat(tempValue);
    
    if (isNaN(numValue)) {
      // If invalid, just close modal
      hideEditModal();
      return;
    }
    
    // Update the set with new value
    const updatedSet = {...exercise.sets[index]};
    
    switch (field) {
      case 'reps':
        updatedSet.actual_reps = Math.round(numValue); // Round for reps
        break;
      case 'weight':
        updatedSet.actual_weight = numValue;
        break;
      case 'rest':
        updatedSet.rest_time = Math.round(numValue); // Round for rest time
        break;
    }
    
    onUpdateSet(exerciseIndex, index, updatedSet);
    hideEditModal();
  };
  
  // Start rest timer for a set
  const handleStartRest = (setIndex: number) => {
    const set = exercise.sets[setIndex];
    if (set.rest_time > 0) {
      onStartRestTimer(set.rest_time);
    }
  };

  // Handle removing a specific set
  const handleRemoveSet = (setIndex: number) => {
    // Confirm before removing
    Alert.alert(
      t('remove_set'),
      t('remove_set_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('remove'),
          style: 'destructive',
          onPress: () => onRemoveSet(exerciseIndex, setIndex)
        }
      ]
    );
  };
  
  // Calculate completed sets
  const completedSets = exercise.sets.filter(set => set.completed).length;
  const totalSets = exercise.sets.length;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: themePalette.card_background }]}>
      {/* Exercise Header */}
      <View style={[styles.header, { borderBottomColor: themePalette.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={[styles.exerciseName, { color: themePalette.text }]}>
              {exercise.name}
            </Text>
            
            {exercise.equipment && (
              <View style={styles.equipmentTag}>
                <Ionicons name="barbell-outline" size={12} color={themePalette.text_secondary} />
                <Text style={[styles.equipmentText, { color: themePalette.text_secondary }]}>
                  {exercise.equipment}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.progressSection}>
            <Text style={[styles.progressText, { color: themePalette.text_secondary }]}>
              {completedSets}/{totalSets} sets
            </Text>
            <View style={[styles.progressBar, { backgroundColor: `${themePalette.accent}30` }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress}%`, 
                    backgroundColor: progress === 100 ? themePalette.success : themePalette.accent 
                  }
                ]} 
              />
            </View>
          </View>
        </View>
        
        {exercise.notes && (
          <View style={[styles.notesContainer, { backgroundColor: `${themePalette.accent}10` }]}>
            <Ionicons name="information-circle-outline" size={16} color={themePalette.text_tertiary} />
            <Text style={[styles.notesText, { color: themePalette.text_tertiary }]}>
              {exercise.notes}
            </Text>
          </View>
        )}
      </View>
      
      {/* Sets Table */}
      <ScrollView style={styles.setsContainer}>
        {exercise.sets.map((set, index) => (
          <SetRow
            key={`set-${set.id || index}`}
            set={set}
            index={index}
            onComplete={() => handleCompleteSet(index)}
            onUncomplete={() => handleUncompleteSet(index)}
            onEdit={(field) => showEditModal(index, field)}
            onStartRest={() => handleStartRest(index)}
            onRemove={() => handleRemoveSet(index)}
            last={index === exercise.sets.length - 1}
            isCompleted={set.completed}
            disabled={editingPrevious}
            theme={themePalette}
          />
        ))}
      </ScrollView>
      
      {/* Bottom actions */}
      <View style={[styles.bottomActions, { borderTopColor: themePalette.border }]}>
        <TouchableOpacity
          style={[styles.addSetButton, { 
            backgroundColor: `${themePalette.success}15`,
            borderColor: `${themePalette.success}40`
          }]}
          onPress={() => onAddSet(exerciseIndex)}
        >
          <Ionicons name="add-circle-outline" size={18} color={themePalette.success} />
          <Text style={[styles.buttonText, { color: themePalette.success }]}>
            {t('add_set')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Edit Modal */}
      {editModalVisible && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={hideEditModal} />
          
          <Animated.View 
            style={[
              styles.modalContent,
              { 
                backgroundColor: themePalette.card_background,
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
            <Text style={[styles.modalTitle, { color: themePalette.text }]}>
              {editingSet?.field === 'reps' && t('edit_reps')}
              {editingSet?.field === 'weight' && t('edit_weight')}
              {editingSet?.field === 'rest' && t('edit_rest_time')}
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                color: themePalette.text,
                backgroundColor: themePalette.input_background,
                borderColor: themePalette.border
              }]}
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType="decimal-pad"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: themePalette.border }]}
                onPress={hideEditModal}
              >
                <Text style={[styles.modalButtonText, { color: themePalette.text }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { 
                  backgroundColor: themePalette.accent,
                  borderColor: themePalette.accent
                }]}
                onPress={saveEditedValue}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {t('save')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 2,
  },
  progressSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  equipmentText: {
    fontSize: 12,
    marginLeft: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    width: 60,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  notesText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  setsContainer: {
    maxHeight: 350,
  },
  
  setNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  completedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  incompleteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  completeSetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  buttonText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 280,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
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
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  setNumberContainer: {
    width: 28,
    alignItems: 'center',
  },
  setDetails: {
    flex: 0.55, // Reduced from 0.65 to make more room for actions
    marginLeft: 4,
  },
  setValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  setActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 0.45, // Increased from 0.35 to have more space
    marginLeft: 8, // Increased spacing
  },
  
  // Improve button and icon spacing
  completeSetButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    minWidth: 80, // Add minimum width to ensure consistent size
  },
  
  // Adjust the editable fields to ensure they're not too wide
  editableField: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 50, // Reduced from 60
    maxWidth: 60, // Add maximum width
    marginHorizontal: 2,
  }
});

export default RealtimeExerciseCard;