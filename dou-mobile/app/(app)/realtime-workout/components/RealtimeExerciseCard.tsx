import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../context/LanguageContext';
import { EQUIPMENT_OPTIONS } from '../utils/workoutUtils';

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
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return val % 1 === 0 ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
    }
    return val.toString();
  };
  
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
        {formatValue(value)}{suffix}
      </Text>
    </Pressable>
  );
};

// Equipment Selector Modal
const EquipmentModal = ({ visible, onClose, currentEquipment, onSelect, theme }) => {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('equipment')}</Text>
          
          <ScrollView style={styles.equipmentList}>
            {EQUIPMENT_OPTIONS.map(equipment => (
              <TouchableOpacity
                key={equipment.id}
                style={[
                  styles.equipmentOption,
                  { 
                    backgroundColor: currentEquipment === equipment.id ? `${theme.accent}20` : 'transparent',
                    borderColor: currentEquipment === equipment.id ? theme.accent : theme.border
                  }
                ]}
                onPress={() => {
                  onSelect(equipment.id);
                  onClose();
                }}
              >
                <View style={styles.equipmentInfo}>
                  <Text style={[styles.equipmentName, { color: theme.text }]}>
                    {t(equipment.id)}
                  </Text>
                </View>
                {currentEquipment === equipment.id && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={[styles.modalButton, { backgroundColor: theme.border }]} 
            onPress={onClose}
          >
            <Text style={[styles.modalButtonText, { color: theme.text }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Effort Type Selector Modal
const EffortTypeModal = ({ visible, onClose, currentEffortType, onSelect, theme }) => {
  const { t } = useLanguage();
  const effortTypes = [
    { id: 'reps', label: t('reps'), icon: 'repeat-outline' },
    { id: 'time', label: t('time'), icon: 'time-outline' },
    { id: 'distance', label: t('distance'), icon: 'footsteps-outline' }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('effort_type')}</Text>
          
          <View style={styles.equipmentList}>
            {effortTypes.map(effortType => (
              <TouchableOpacity
                key={effortType.id}
                style={[
                  styles.equipmentOption,
                  { 
                    backgroundColor: currentEffortType === effortType.id ? `${theme.accent}20` : 'transparent',
                    borderColor: currentEffortType === effortType.id ? theme.accent : theme.border
                  }
                ]}
                onPress={() => {
                  onSelect(effortType.id);
                  onClose();
                }}
              >
                <Ionicons name={effortType.icon} size={20} color={theme.text_secondary} />
                <View style={styles.equipmentInfo}>
                  <Text style={[styles.equipmentName, { color: theme.text }]}>
                    {effortType.label}
                  </Text>
                </View>
                {currentEffortType === effortType.id && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            style={[styles.modalButton, { backgroundColor: theme.border }]} 
            onPress={onClose}
          >
            <Text style={[styles.modalButtonText, { color: theme.text }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Weight Unit Selector Modal
const WeightUnitModal = ({ visible, onClose, currentWeightUnit, onSelect, theme }) => {
  const { t } = useLanguage();
  const weightUnits = [
    { id: 'kg', label: 'Kilograms (kg)', icon: 'barbell-outline' },
    { id: 'lbs', label: 'Pounds (lbs)', icon: 'barbell-outline' }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('weight_unit')}</Text>
          
          <View style={styles.equipmentList}>
            {weightUnits.map(unit => (
              <TouchableOpacity
                key={unit.id}
                style={[
                  styles.equipmentOption,
                  { 
                    backgroundColor: currentWeightUnit === unit.id ? `${theme.accent}20` : 'transparent',
                    borderColor: currentWeightUnit === unit.id ? theme.accent : theme.border
                  }
                ]}
                onPress={() => {
                  onSelect(unit.id);
                  onClose();
                }}
              >
                <Ionicons name={unit.icon} size={20} color={theme.text_secondary} />
                <View style={styles.equipmentInfo}>
                  <Text style={[styles.equipmentName, { color: theme.text }]}>
                    {unit.label}
                  </Text>
                </View>
                {currentWeightUnit === unit.id && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            style={[styles.modalButton, { backgroundColor: theme.border }]} 
            onPress={onClose}
          >
            <Text style={[styles.modalButtonText, { color: theme.text }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Superset Link Modal (replaces three dots menu)
const SupersetLinkModal = ({ visible, onClose, onLinkWithExisting, onLinkWithNew, availableExercises, theme }) => {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.optionsModalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('create_superset')}</Text>
          
          <TouchableOpacity
            style={[styles.optionButton, { borderBottomColor: theme.border }]}
            onPress={() => {
              onLinkWithNew();
              onClose();
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
            <Text style={[styles.optionButtonText, { color: theme.accent }]}>
              {t('new_exercise')}
            </Text>
          </TouchableOpacity>
          
          {availableExercises.length > 0 && (
            <View>
              <Text style={[styles.subSectionTitle, { color: theme.text_secondary }]}>
                {t('existing_exercise')}:
              </Text>
              {availableExercises.map((exercise, index) => (
                <TouchableOpacity
                  key={exercise.id || index}
                  style={[styles.optionButton, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    onLinkWithExisting(exercise, index);
                    onClose();
                  }}
                >
                  <Ionicons name="link-outline" size={20} color={theme.success} />
                  <Text style={[styles.optionButtonText, { color: theme.text }]}>
                    {exercise.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
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

// Rename Exercise Modal
const RenameExerciseModal = ({ visible, onClose, currentName, onSave, theme }) => {
  const { t } = useLanguage();
  const [tempName, setTempName] = useState(currentName || '');

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

// Exercise Options Modal (replaces Long Press Options Modal)
const ExerciseOptionsModal = ({ visible, onClose, onDelete, onSuperset, isSuperset, onBreakSuperset, onRename, theme }) => {
  const { t } = useLanguage();

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
              label={t('time_s').toUpperCase()}
              theme={theme}
              flex={1.2}
            />
            
            <EditableField
              value={weight || 0}
              onEdit={() => handleEditPress('weight')}
              editable={true}
              completed={isCompleted}
              label={t(`weight_${set.weight_unit || 'kg'}`).toUpperCase()}
              theme={theme}
              flex={1}
            />
            
            <EditableField
              value={set.rest_time}
              onEdit={() => handleEditPress('rest')}
              editable={true}
              completed={isCompleted}
              label={t('rest_s').toUpperCase()}
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
            
            
            <EditableField
              value={time || 0}
              onEdit={() => handleEditPress('duration')}
              editable={true}
              completed={isCompleted}
              label={t(`time_s`).toUpperCase()}
              theme={theme}
              flex={1}
            />
            
            
            <EditableField
              value={set.rest_time}
              onEdit={() => handleEditPress('rest')}
              editable={true}
              completed={isCompleted}
              label={t('rest_s').toUpperCase()}
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
              label={('reps').toUpperCase()}
              theme={theme}
              flex={0.8}
            />
            
            <EditableField
              value={setWeight || 0}
              onEdit={() => handleEditPress('weight')}
              editable={true}
              completed={isCompleted}
              label={t(`weight_${set.weight_unit || 'kg'}`).toUpperCase()}
              theme={theme}
              flex={1.2}
            />
            
            <EditableField
              value={set.rest_time}
              onEdit={() => handleEditPress('rest')}
              editable={true}
              completed={isCompleted}
              label={t('rest_s').toUpperCase()}
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
  onCompleteSet: (exerciseIndex: number, setIndex: number, setData: any) => Promise<void>;
  onUncompleteSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, setData: any) => void;
  onUpdateExercise: (exerciseIndex: number, exerciseData: any) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onShowEditModal: (exerciseIndex: number, setIndex: number, field: string) => void;
  onCreateSuperset: (exerciseIndex: number) => void;
  onRemoveFromSuperset: (exerciseIndex: number) => void;
  editingPrevious?: boolean;
  themePalette: any;
  availableExercises?: any[];
  onLinkWithExisting?: (targetExercise: any, targetIndex: number) => void;
  onLinkWithNew?: () => void;
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
  onShowEditModal,
  onCreateSuperset,
  onRemoveFromSuperset,
  editingPrevious = false,
  themePalette,
  availableExercises = [],
  onLinkWithExisting,
  onLinkWithNew
}) => {
  const { t } = useLanguage();
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [effortTypeModalVisible, setEffortTypeModalVisible] = useState(false);
  const [weightUnitModalVisible, setWeightUnitModalVisible] = useState(false);
  const [supersetLinkModalVisible, setSupersetLinkModalVisible] = useState(false);
  const [exerciseOptionsVisible, setExerciseOptionsVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  
  const effortType = exercise.effort_type || 'reps';
  const weightUnit = exercise.sets.length > 0 ? (exercise.sets[0].weight_unit || 'kg') : 'kg';
  const currentEquipment = exercise.equipment || 'barbell';
  const isSuperset = !!exercise.superset_group;

  // Handle equipment change
  const handleEquipmentChange = (equipmentId: string) => {
    onUpdateExercise(exerciseIndex, { ...exercise, equipment: equipmentId });
  };

  // Handle effort type change
  const handleEffortTypeChange = (newEffortType: string) => {
    onUpdateExercise(exerciseIndex, { ...exercise, effort_type: newEffortType });
  };

  // Handle weight unit change
  const handleWeightUnitChange = (newWeightUnit: string) => {
    const updatedSets = exercise.sets.map(set => ({
      ...set,
      weight_unit: newWeightUnit
    }));
    onUpdateExercise(exerciseIndex, { 
      ...exercise, 
      weight_unit: newWeightUnit,
      sets: updatedSets
    });
  };

  // Get equipment display name
  const getEquipmentDisplayName = (equipmentId: string) => {
    const equipment = EQUIPMENT_OPTIONS.find(eq => eq.id === equipmentId);
    return equipment ? t(equipment.id) : t('equipment_other');
  };

  // Get effort type display name
  const getEffortTypeDisplayName = (effortTypeId: string) => {
    switch (effortTypeId) {
      case 'time': return t('time');
      case 'distance': return t('distance');
      case 'reps':
      default: return t('reps');
    }
  };

  // Handle set completion
  const handleCompleteSet = async (setIndex: number) => {
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
    await onCompleteSet(exerciseIndex, setIndex, completionData);
  };

  // Handle set uncompletion
  const handleUncompleteSet = (setIndex: number) => {
    onUncompleteSet(exerciseIndex, setIndex);
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

  // Handle name change
  const handleNameChange = (newName: string) => {
    onUpdateExercise(exerciseIndex, { ...exercise, name: newName });
  };

  // Handle delete from exercise options
  const handleDelete = () => {
    Alert.alert(
      t('delete_exercise'),
      t('delete_exercise_confirmation', { name: exercise.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            // This will be handled by the parent component
            console.log('Delete exercise', exerciseIndex);
          }
        }
      ]
    );
  };

  // Handle link with existing exercise
  const handleLinkWithExisting = (targetExercise: any, targetIndex: number) => {
    if (onLinkWithExisting) {
      onLinkWithExisting(targetExercise, targetIndex);
    }
  };

  // Handle link with new exercise
  const handleLinkWithNew = () => {
    if (onLinkWithNew) {
      onLinkWithNew();
    } else {
      onCreateSuperset(exerciseIndex);
    }
  };
  
  // Calculate completed sets
  const completedSets = exercise.sets.filter(set => set.completed).length;
  const totalSets = exercise.sets.length;

  return (
    <Pressable 
      style={[styles.container, { backgroundColor: themePalette.card_background }]}
      onLongPress={() => setExerciseOptionsVisible(true)}
      delayLongPress={500}
    >
      {/* Exercise Header */}
      <View style={[styles.header, { borderBottomColor: themePalette.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            {/* Exercise name - no longer touchable */}
            <View style={styles.exerciseNameContainer}>
              <Text style={[styles.exerciseName, { color: themePalette.text }]}>
                {exercise.name}
              </Text>
            </View>
            
            {/* Superset indicator */}
            {isSuperset && (
              <View style={[styles.supersetBadge, { backgroundColor: `${themePalette.accent}20` }]}>
                <Ionicons name="link" size={12} color={themePalette.accent} />
                <Text style={[styles.supersetText, { color: themePalette.accent }]}>
                  {t('superset')}
                </Text>
              </View>
            )}

            {/* Controls Row - Added effort type and weight unit badges */}
            <View style={styles.controlsRow}>
              {/* Equipment Control */}
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: `${themePalette.success}20` }]}
                onPress={() => setEquipmentModalVisible(true)}
              >
                <Text style={[styles.controlButtonText, { color: themePalette.success }]}>
                  {getEquipmentDisplayName(currentEquipment)}
                </Text>
                <Ionicons name="chevron-down" size={12} color={themePalette.success} />
              </TouchableOpacity>

              {/* Effort Type Control */}
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: `${themePalette.accent}20` }]}
                onPress={() => setEffortTypeModalVisible(true)}
              >
                <Text style={[styles.controlButtonText, { color: themePalette.accent }]}>
                  {getEffortTypeDisplayName(effortType)}
                </Text>
                <Ionicons name="chevron-down" size={12} color={themePalette.accent} />
              </TouchableOpacity>

              {/* Weight Unit Control */}
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: `${themePalette.warning}20` }]}
                onPress={() => setWeightUnitModalVisible(true)}
              >
                <Text style={[styles.controlButtonText, { color: themePalette.warning }]}>
                  {weightUnit.toUpperCase()}
                </Text>
                <Ionicons name="chevron-down" size={12} color={themePalette.warning} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Replace chain link button with three dots button */}
          <View style={styles.optionsSection}>
            <TouchableOpacity
              style={[styles.optionsButton, { 
                backgroundColor: `${themePalette.text_secondary}15`
              }]}
              onPress={() => setExerciseOptionsVisible(true)}
            >
              <Ionicons 
                name="ellipsis-horizontal" 
                size={18} 
                color={themePalette.text_secondary} 
              />
            </TouchableOpacity>
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
            onEdit={(field) => onShowEditModal(exerciseIndex, index, field)}
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

      {/* Equipment Modal */}
      <EquipmentModal
        visible={equipmentModalVisible}
        onClose={() => setEquipmentModalVisible(false)}
        currentEquipment={currentEquipment}
        onSelect={handleEquipmentChange}
        theme={themePalette}
      />

      {/* Effort Type Modal */}
      <EffortTypeModal
        visible={effortTypeModalVisible}
        onClose={() => setEffortTypeModalVisible(false)}
        currentEffortType={effortType}
        onSelect={handleEffortTypeChange}
        theme={themePalette}
      />

      {/* Weight Unit Modal */}
      <WeightUnitModal
        visible={weightUnitModalVisible}
        onClose={() => setWeightUnitModalVisible(false)}
        currentWeightUnit={weightUnit}
        onSelect={handleWeightUnitChange}
        theme={themePalette}
      />

      {/* Superset Link Modal */}
      <SupersetLinkModal
        visible={supersetLinkModalVisible}
        onClose={() => setSupersetLinkModalVisible(false)}
        onLinkWithExisting={handleLinkWithExisting}
        onLinkWithNew={handleLinkWithNew}
        availableExercises={availableExercises.filter((ex, idx) => idx !== exerciseIndex && !ex.superset_group)}
        theme={themePalette}
      />

      {/* Exercise Options Modal (replaces Long Press Options Modal) */}
      <ExerciseOptionsModal
        visible={exerciseOptionsVisible}
        onClose={() => setExerciseOptionsVisible(false)}
        onDelete={handleDelete}
        onSuperset={() => setSupersetLinkModalVisible(true)}
        isSuperset={isSuperset}
        onBreakSuperset={() => onRemoveFromSuperset(exerciseIndex)}
        onRename={() => setRenameModalVisible(true)}
        theme={themePalette}
      />

      {/* Rename Exercise Modal */}
      <RenameExerciseModal
        visible={renameModalVisible}
        onClose={() => setRenameModalVisible(false)}
        currentName={exercise.name}
        onSave={handleNameChange}
        theme={themePalette}
      />
    </Pressable>
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
    flex: 1,
  },
  optionsSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  supersetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  supersetText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
    width: 15,
    height: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 10,
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
    padding: 6,
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
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
  },
  setNumberContainer: {
    width: 12,
    alignItems: 'center',
  },
  setDetails: {
    flex: 0.8,
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
  },
  editableField: {
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: 55,
    maxWidth: 75,
    marginHorizontal: 1,
  },
  equipmentList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  equipmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  equipmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Options modal styles
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
});

export default RealtimeExerciseCard;