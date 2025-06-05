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
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

interface SetData {
  id: string | number;
  reps?: number | null;
  weight?: number | null;
  weight_unit?: 'kg' | 'lbs';
  duration?: number | null;
  distance?: number | null;
  rest_time: number;
  completed: boolean;
  actual_reps?: number | null;
  actual_weight?: number | null;
  actual_duration?: number | null;
  actual_distance?: number | null;
}

interface EditableFieldProps {
  value: string | number;
  onEdit: () => void;
  editable: boolean;
  completed: boolean;
  label?: string;
  suffix?: string;
  theme: any;
  flex?: number;
}

// Editable field component for better reusability
const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onEdit, 
  editable, 
  completed,
  label,
  suffix = '',
  theme,
  flex = 1
}) => {
  return (
    <Pressable
      style={[styles.editableField, { 
        backgroundColor: editable ? `${theme.accent}10` : 'transparent',
        flex 
      }]}
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

// Effort Type Selector Modal
const EffortTypeModal = ({ visible, onClose, currentType, onSelect, theme }) => {
  const { t } = useLanguage();
  
  const effortTypes = [
    { id: 'reps', name: t('reps'), icon: 'repeat-outline', description: t('reps_description') },
    { id: 'time', name: t('time'), icon: 'timer-outline', description: t('time_description') },
    { id: 'distance', name: t('distance'), icon: 'speedometer-outline', description: t('distance_description') }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('select_effort_type')}</Text>
          
          {effortTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.effortTypeOption,
                { 
                  backgroundColor: currentType === type.id ? `${theme.accent}20` : 'transparent',
                  borderColor: currentType === type.id ? theme.accent : theme.border
                }
              ]}
              onPress={() => {
                onSelect(type.id);
                onClose();
              }}
            >
              <Ionicons name={type.icon} size={24} color={currentType === type.id ? theme.accent : theme.text_secondary} />
              <View style={styles.effortTypeInfo}>
                <Text style={[styles.effortTypeName, { color: theme.text }]}>{type.name}</Text>
                <Text style={[styles.effortTypeDescription, { color: theme.text_secondary }]}>{type.description}</Text>
              </View>
              {currentType === type.id && (
                <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.border }]} onPress={onClose}>
            <Text style={[styles.modalButtonText, { color: theme.text }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Weight Unit Selector Modal
const WeightUnitModal = ({ visible, onClose, currentUnit, onSelect, theme }) => {
  const { t } = useLanguage();
  
  const units = [
    { id: 'kg', name: t('kilograms'), abbr: 'kg' },
    { id: 'lbs', name: t('pounds'), abbr: 'lbs' }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('select_weight_unit')}</Text>
          
          {units.map(unit => (
            <TouchableOpacity
              key={unit.id}
              style={[
                styles.unitOption,
                { 
                  backgroundColor: currentUnit === unit.id ? `${theme.accent}20` : 'transparent',
                  borderColor: currentUnit === unit.id ? theme.accent : theme.border
                }
              ]}
              onPress={() => {
                onSelect(unit.id);
                onClose();
              }}
            >
              <Text style={[styles.unitName, { color: theme.text }]}>{unit.name}</Text>
              <Text style={[styles.unitAbbr, { color: theme.text_secondary }]}>({unit.abbr})</Text>
              {currentUnit === unit.id && (
                <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.border }]} onPress={onClose}>
            <Text style={[styles.modalButtonText, { color: theme.text }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Animated set row component with swipe actions
const SetRow = ({ 
  set, 
  index, 
  onComplete, 
  onEdit, 
  onUncomplete,
  onRemove,
  last,
  isCompleted,
  disabled,
  effortType,
  weightUnit,
  theme
}) => {
  const { t } = useLanguage();
  
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

  const renderFields = () => {
    switch (effortType) {
      case 'time':
        const duration = set.actual_duration !== undefined ? set.actual_duration : set.duration;
        const weight = set.actual_weight !== undefined ? set.actual_weight : set.weight;
        
        return (
          <>
            <EditableField
              value={duration || 0}
              onEdit={() => handleEditPress('duration')}
              editable={true}
              completed={isCompleted}
              label={t('time').toUpperCase()}
              suffix="s"
              theme={theme}
              flex={1.2}
            />
            
            {(weight !== null && weight !== undefined) && (
              <EditableField
                value={weight || 0}
                onEdit={() => handleEditPress('weight')}
                editable={true}
                completed={isCompleted}
                label={t('weight').toUpperCase()}
                suffix={` ${weightUnit}`}
                theme={theme}
                flex={1}
              />
            )}
            
            <EditableField
              value={set.rest_time}
              onEdit={() => handleEditPress('rest')}
              editable={true}
              completed={isCompleted}
              label={t('rest').toUpperCase()}
              suffix="s"
              theme={theme}
              flex={0.8}
            />
          </>
        );
        
      case 'distance':
        const distance = set.actual_distance !== undefined ? set.actual_distance : set.distance;
        const time = set.actual_duration !== undefined ? set.actual_duration : set.duration;
        
        return (
          <>
            <EditableField
              value={distance || 0}
              onEdit={() => handleEditPress('distance')}
              editable={true}
              completed={isCompleted}
              label={t('distance').toUpperCase()}
              suffix="m"
              theme={theme}
              flex={1.2}
            />
            
            {(time !== null && time !== undefined) && (
              <EditableField
                value={time || 0}
                onEdit={() => handleEditPress('duration')}
                editable={true}
                completed={isCompleted}
                label={t('time').toUpperCase()}
                suffix="s"
                theme={theme}
                flex={1}
              />
            )}
            
            <EditableField
              value={set.rest_time}
              onEdit={() => handleEditPress('rest')}
              editable={true}
              completed={isCompleted}
              label={t('rest').toUpperCase()}
              suffix="s"
              theme={theme}
              flex={0.8}
            />
          </>
        );
        
      case 'reps':
      default:
        const reps = set.actual_reps !== undefined ? set.actual_reps : set.reps;
        const setWeight = set.actual_weight !== undefined ? set.actual_weight : set.weight;
        
        return (
          <>
            <EditableField
              value={reps || 0}
              onEdit={() => handleEditPress('reps')}
              editable={true}
              completed={isCompleted}
              label={t('reps').toUpperCase()}
              theme={theme}
              flex={0.8}
            />
            
            <EditableField
              value={setWeight || 0}
              onEdit={() => handleEditPress('weight')}
              editable={true}
              completed={isCompleted}
              label={t('weight').toUpperCase()}
              suffix={` ${weightUnit}`}
              theme={theme}
              flex={1.2}
            />
            
            <EditableField
              value={set.rest_time}
              onEdit={() => handleEditPress('rest')}
              editable={true}
              completed={isCompleted}
              label={t('rest').toUpperCase()}
              suffix="s"
              theme={theme}
              flex={0.8}
            />
          </>
        );
    }
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
          {renderFields()}
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
              <Text style={[styles.completeSetText, { color: '#FFFFFF' }]}>{t('complete')}</Text>
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
  onUpdateExercise: (exerciseIndex: number, exerciseData: any) => void;
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
  onUpdateExercise,
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
  const [effortTypeModalVisible, setEffortTypeModalVisible] = useState(false);
  const [weightUnitModalVisible, setWeightUnitModalVisible] = useState(false);
  const [nameEditModalVisible, setNameEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState(exercise.name || '');
  
  // Animation for edit modal
  const modalAnimation = useRef(new Animated.Value(0)).current;

  const effortType = exercise.effort_type || 'reps';
  const weightUnit = exercise.weight_unit || 'kg';

  // Handle set completion
  const handleCompleteSet = (setIndex: number) => {
    const set = exercise.sets[setIndex];
    
    let completionData = {};
    switch (effortType) {
      case 'time':
        completionData = {
          actual_duration: set.actual_duration !== undefined ? set.actual_duration : set.duration,
          actual_weight: set.actual_weight !== undefined ? set.actual_weight : set.weight,
        };
        break;
      case 'distance':
        completionData = {
          actual_distance: set.actual_distance !== undefined ? set.actual_distance : set.distance,
          actual_duration: set.actual_duration !== undefined ? set.actual_duration : set.duration,
        };
        break;
      case 'reps':
      default:
        completionData = {
          actual_reps: set.actual_reps !== undefined ? set.actual_reps : set.reps,
          actual_weight: set.actual_weight !== undefined ? set.actual_weight : set.weight,
        };
        break;
    }
    
    onCompleteSet(exerciseIndex, setIndex, completionData);
    
    // Always start rest timer when completing a set
    if (set.rest_time > 0) {
      onStartRestTimer(set.rest_time);
    }
  };

  // Handle set uncompletion
  const handleUncompleteSet = (setIndex: number) => {
    onUncompleteSet(exerciseIndex, setIndex);
  };

  // Show edit modal for a field
  const showEditModal = (setIndex: number, field: string) => {
    const set = exercise.sets[setIndex];
    let initialValue = '';
    
    switch (field) {
      case 'reps':
        initialValue = (set.actual_reps !== undefined ? set.actual_reps : set.reps)?.toString() || '0';
        break;
      case 'weight':
        initialValue = (set.actual_weight !== undefined ? set.actual_weight : set.weight)?.toString() || '0';
        break;
      case 'duration':
        initialValue = (set.actual_duration !== undefined ? set.actual_duration : set.duration)?.toString() || '0';
        break;
      case 'distance':
        initialValue = (set.actual_distance !== undefined ? set.actual_distance : set.distance)?.toString() || '0';
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
      hideEditModal();
      return;
    }
    
    // Update the set with new value
    const updatedSet = {...exercise.sets[index]};
    
    switch (field) {
      case 'reps':
        updatedSet.actual_reps = Math.round(numValue);
        break;
      case 'weight':
        updatedSet.actual_weight = numValue; // Allow decimals
        break;
      case 'duration':
        updatedSet.actual_duration = Math.round(numValue);
        break;
      case 'distance':
        updatedSet.actual_distance = numValue; // Allow decimals
        break;
      case 'rest':
        updatedSet.rest_time = Math.round(numValue);
        break;
    }
    
    onUpdateSet(exerciseIndex, index, updatedSet);
    hideEditModal();
  };

  // Handle removing a specific set
  const handleRemoveSet = (setIndex: number) => {
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

  // Handle effort type change
  const handleEffortTypeChange = (newType: string) => {
    onUpdateExercise(exerciseIndex, { ...exercise, effort_type: newType });
  };

  // Handle weight unit change
  const handleWeightUnitChange = (newUnit: string) => {
    // YOU THOUGH weight_unit was a field of exercise, but it is a field of set !!!
    // use onUpdateSet to update weight_unit in the targeted set
  };

  // Handle name change
  const handleNameChange = () => {
    if (tempName.trim()) {
      onUpdateExercise(exerciseIndex, { ...exercise, name: tempName.trim() });
    }
    setNameEditModalVisible(false);
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
            <TouchableOpacity 
              style={styles.exerciseNameContainer}
              onPress={() => {
                setTempName(exercise.name || '');
                setNameEditModalVisible(true);
              }}
            >
              <Text style={[styles.exerciseName, { color: themePalette.text }]}>
                {exercise.name}
              </Text>
              <Ionicons name="create-outline" size={16} color={themePalette.text_secondary} />
            </TouchableOpacity>
            
            {exercise.equipment && (
              <View style={styles.equipmentTag}>
                <Ionicons name="barbell-outline" size={12} color={themePalette.text_secondary} />
                <Text style={[styles.equipmentText, { color: themePalette.text_secondary }]}>
                  {exercise.equipment}
                </Text>
              </View>
            )}

            {/* Effort Type and Weight Unit Controls */}
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: `${themePalette.accent}20` }]}
                onPress={() => setEffortTypeModalVisible(true)}
              >
                <Text style={[styles.controlButtonText, { color: themePalette.accent }]}>
                  {t(effortType)}
                </Text>
                <Ionicons name="chevron-down" size={12} color={themePalette.accent} />
              </TouchableOpacity>

              {(effortType === 'reps' || effortType === 'time') && (
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: `${themePalette.info}20` }]}
                  onPress={() => setWeightUnitModalVisible(true)}
                >
                  <Text style={[styles.controlButtonText, { color: themePalette.info }]}>
                    {weightUnit}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={themePalette.info} />
                </TouchableOpacity>
              )}
            </View>
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
            onRemove={() => handleRemoveSet(index)}
            last={index === exercise.sets.length - 1}
            isCompleted={set.completed}
            disabled={editingPrevious}
            effortType={effortType}
            weightUnit={weightUnit}
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
              {editingSet?.field === 'duration' && t('edit_duration')}
              {editingSet?.field === 'distance' && t('edit_distance')}
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

      {/* Name Edit Modal */}
      {nameEditModalVisible && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setNameEditModalVisible(false)} />
          
          <View style={[styles.modalContent, { backgroundColor: themePalette.card_background }]}>
            <Text style={[styles.modalTitle, { color: themePalette.text }]}>
              {t('edit_exercise_name')}
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                color: themePalette.text,
                backgroundColor: themePalette.input_background,
                borderColor: themePalette.border
              }]}
              value={tempName}
              onChangeText={setTempName}
              autoFocus
              placeholder={t('exercise_name')}
              placeholderTextColor={themePalette.text_tertiary}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: themePalette.border }]}
                onPress={() => setNameEditModalVisible(false)}
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
                onPress={handleNameChange}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {t('save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Effort Type Modal */}
      <EffortTypeModal
        visible={effortTypeModalVisible}
        onClose={() => setEffortTypeModalVisible(false)}
        currentType={effortType}
        onSelect={handleEffortTypeChange}
        theme={themePalette}
      />

      {/* Weight Unit Modal */}
      <WeightUnitModal
        visible={weightUnitModalVisible}
        onClose={() => setWeightUnitModalVisible(false)}
        currentUnit={weightUnit}
        onSelect={handleWeightUnitChange}
        theme={themePalette}
      />
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
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  equipmentText: {
    fontSize: 12,
    marginLeft: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  completeSetText: {
    fontSize: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  setNumberContainer: {
    width: 24,
    alignItems: 'center',
  },
  setDetails: {
    flex: 0.6,
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
    flex: 0.4,
    marginLeft: 8,
  },
  
  completeSetButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    minWidth: 70,
  },
  
  editableField: {
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: 45,
    maxWidth: 55,
    marginHorizontal: 1,
  },

  // Effort type modal styles
  effortTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    width: '100%',
  },
  effortTypeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  effortTypeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  effortTypeDescription: {
    fontSize: 12,
    marginTop: 2,
  },

  // Weight unit modal styles
  unitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    width: '100%',
  },
  unitName: {
    fontSize: 16,
    fontWeight: '600',
  },
  unitAbbr: {
    fontSize: 14,
  },
});

export default RealtimeExerciseCard;