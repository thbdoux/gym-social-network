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
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { EQUIPMENT_TYPES } from './data/exerciseData';

// Types
export type ExerciseSet = {
  id?: number;
  reps?: number | null;
  weight?: number | null;
  weight_unit?: 'kg' | 'lbs';
  duration?: number | null;
  distance?: number | null;
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
  equipmentKey?: string;
  effort_type?: 'reps' | 'time' | 'distance';
  superset_with?: number | null;
  is_superset?: boolean;
  superset_rest_time?: number;
};

type ExerciseConfiguratorProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  exercise: Exercise;
  isEdit?: boolean;
};

type PickerModalState = {
  visible: boolean;
  type: 'reps' | 'weight' | 'duration' | 'distance' | 'rest_time' | null;
  setIndex: number;
  currentValue: number;
  title: string;
};

// Default set values based on effort type
const getDefaultSet = (effortType: 'reps' | 'time' | 'distance' = 'reps'): ExerciseSet => {
  switch (effortType) {
    case 'time':
      return {
        duration: 30,
        weight: null,
        weight_unit: 'kg',
        rest_time: 60
      };
    case 'distance':
      return {
        distance: 100,
        duration: null,
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

// Generate picker options for different values
const generatePickerOptions = (min: number, max: number, step: number = 1): number[] => {
  const options = [];
  for (let i = min; i <= max; i += step) {
    options.push(i);
  }
  return options;
};

// Pre-generated common options
const REPS_OPTIONS = generatePickerOptions(1, 50);
const WEIGHT_OPTIONS = [
  ...generatePickerOptions(0, 50, 0.5), // 0-50 with 0.5 steps
  ...generatePickerOptions(52.5, 100, 2.5), // 52.5-100 with 2.5 steps
  ...generatePickerOptions(105, 200, 5), // 105-200 with 5 steps
  ...generatePickerOptions(210, 500, 10) // 210-500 with 10 steps
];
const DURATION_OPTIONS = [
  ...generatePickerOptions(5, 60, 5), // 5-60 seconds with 5s steps
  ...generatePickerOptions(70, 300, 10), // 70-300 seconds with 10s steps
  ...generatePickerOptions(320, 3600, 20) // 320-3600 seconds with 20s steps
];
const DISTANCE_OPTIONS = [
  ...generatePickerOptions(10, 100, 10), // 10-100m with 10m steps
  ...generatePickerOptions(150, 1000, 50), // 150-1000m with 50m steps
  ...generatePickerOptions(1100, 5000, 100), // 1100-5000m with 100m steps
  ...generatePickerOptions(5500, 20000, 500) // 5500-20000m with 500m steps
];
const REST_TIME_OPTIONS = [
  0, // No rest
  ...generatePickerOptions(10, 60, 10), // 10-60 seconds with 10s steps
  ...generatePickerOptions(70, 180, 10), // 70-180 seconds with 10s steps
  ...generatePickerOptions(200, 600, 20) // 200-600 seconds with 20s steps
];

const ExerciseConfigurator = ({
  visible,
  onClose,
  onSave,
  exercise,
  isEdit = false
}: ExerciseConfiguratorProps) => {
  const { t } = useLanguage();
  const { workoutPalette, palette } = useTheme();
  // State
  const [currentExercise, setCurrentExercise] = useState<Exercise>(exercise);
  const [restTimeEnabled, setRestTimeEnabled] = useState(true);
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<'kg' | 'lbs'>('kg');
  
  // Equipment selection state
  const [selectedEquipmentNameKey, setSelectedEquipmentNameKey] = useState<string>('');
  const [equipmentDropdownVisible, setEquipmentDropdownVisible] = useState(false);
  
  // Picker modal state
  const [pickerModal, setPickerModal] = useState<PickerModalState>({
    visible: false,
    type: null,
    setIndex: -1,
    currentValue: 0,
    title: ''
  });
  
  // Keyboard handling
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Find equipment by name to get ID
  const findEquipmentByName = (equipmentName: string): string => {
    if (!equipmentName) return '';
    const equipment = EQUIPMENT_TYPES.find(eq => 
      eq.nameKey.toLowerCase() === equipmentName.toLowerCase()
    );
    return equipment?.nameKey || '';
  };

  // Initialize state when exercise prop changes
  useEffect(() => {
    setCurrentExercise(exercise);
    
    // Set equipment from either ID or name
    if (exercise.equipment) {
      setSelectedEquipmentNameKey(findEquipmentByName(exercise.equipment));
    } else {
      setSelectedEquipmentNameKey('');
    }
    
    // Check if rest time is enabled based on sets
    if (exercise.sets && exercise.sets.length > 0) {
      const hasRestTime = exercise.sets.some(set => set.rest_time > 0);
      setRestTimeEnabled(hasRestTime);
      
      // Set preferred weight unit from first set that has weight
      const setWithWeight = exercise.sets.find(set => set.weight_unit);
      if (setWithWeight?.weight_unit) {
        setPreferredWeightUnit(setWithWeight.weight_unit);
      }
    } else {
      setRestTimeEnabled(true);
    }
  }, [exercise, visible]);
  
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
  
  // Handle effort type change
  const handleEffortTypeChange = (newEffortType: 'reps' | 'time' | 'distance') => {
    setCurrentExercise(prev => ({
      ...prev,
      effort_type: newEffortType,
      sets: [getDefaultSet(newEffortType)]
    }));
  };
  
  // Handle equipment selection
  const handleEquipmentSelect = (equipmentNameKey: string) => {
    setSelectedEquipmentNameKey(equipmentNameKey);
    setEquipmentDropdownVisible(false);
    
    const selectedEquipment = EQUIPMENT_TYPES.find(eq => eq.nameKey === equipmentNameKey);
    setCurrentExercise(prev => ({
      ...prev,
      equipment: selectedEquipment ? selectedEquipment.nameKey : '',
      equipmentKey: equipmentNameKey
    }));
  };
  
  // Handle adding a set
  const handleAddSet = () => {
    const effortType = currentExercise.effort_type || 'reps';
    const lastSet = currentExercise.sets.length > 0 
      ? currentExercise.sets[currentExercise.sets.length - 1] 
      : getDefaultSet(effortType);
    
    const newSet = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ...getDefaultSet(effortType),
      ...(lastSet.reps !== undefined && { reps: lastSet.reps }),
      ...(lastSet.weight !== undefined && { weight: lastSet.weight }),
      ...(lastSet.weight_unit && { weight_unit: lastSet.weight_unit }),
      ...(lastSet.duration !== undefined && { duration: lastSet.duration }),
      ...(lastSet.distance !== undefined && { distance: lastSet.distance }),
      rest_time: lastSet.rest_time || 60,
    };
    
    setCurrentExercise(prev => ({
      ...prev,
      sets: [...prev.sets, newSet]
    }));
  };
  
  // Handle removing a set
  const handleRemoveSet = (index: number) => {
    if (currentExercise.sets.length <= 1) {
      return;
    }
    const updatedSets = [...currentExercise.sets];
    updatedSets.splice(index, 1);
    setCurrentExercise(prev => ({
      ...prev,
      sets: updatedSets
    }));
  };
  
  // Handle updating a set
  const handleUpdateSet = (index: number, field: keyof ExerciseSet, value: number | string | null) => {
    const updatedSets = [...currentExercise.sets];
    
    if (field === 'weight_unit') {
      updatedSets[index] = {
        ...updatedSets[index],
        [field]: value as 'kg' | 'lbs'
      };
    } else {
      let numericValue: number | null = null;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        numericValue = isNaN(parsed) ? null : parsed;
      } else if (typeof value === 'number') {
        numericValue = value;
      }
      
      updatedSets[index] = {
        ...updatedSets[index],
        [field]: numericValue
      };
    }
    
    if (field === 'weight_unit' && value) {
      setPreferredWeightUnit(value as 'kg' | 'lbs');
    }
    
    setCurrentExercise(prev => ({
      ...prev,
      sets: updatedSets
    }));
  };

  // Handle opening picker modal
  const openPickerModal = (
    type: 'reps' | 'weight' | 'duration' | 'distance' | 'rest_time',
    setIndex: number,
    currentValue: number,
    title: string
  ) => {
    setPickerModal({
      visible: true,
      type,
      setIndex,
      currentValue,
      title
    });
  };

  // Handle picker value change
  const handlePickerValueChange = (value: number) => {
    if (pickerModal.type && pickerModal.setIndex >= 0) {
      handleUpdateSet(pickerModal.setIndex, pickerModal.type, value);
    }
    setPickerModal(prev => ({ ...prev, currentValue: value }));
  };

  // Handle picker modal close
  const closePickerModal = () => {
    setPickerModal({
      visible: false,
      type: null,
      setIndex: -1,
      currentValue: 0,
      title: ''
    });
  };

  // Get picker options based on type
  const getPickerOptions = (type: string) => {
    switch (type) {
      case 'reps': return REPS_OPTIONS;
      case 'weight': return WEIGHT_OPTIONS;
      case 'duration': return DURATION_OPTIONS;
      case 'distance': return DISTANCE_OPTIONS;
      case 'rest_time': return REST_TIME_OPTIONS;
      default: return [];
    }
  };

  // Format display value
  const formatDisplayValue = (type: string, value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'reps':
        return value.toString();
      case 'weight':
        return `${value} ${preferredWeightUnit}`;
      case 'duration':
        return `${value}s`;
      case 'distance':
        return `${value}m`;
      case 'rest_time':
        return value === 0 ? t('no_rest') : `${value}s`;
      default:
        return value.toString();
    }
  };
  
  // Handle toggle for rest time
  const handleToggleRestTime = (value: boolean) => {
    setRestTimeEnabled(value);
    
    const updatedSets = currentExercise.sets.map(set => ({
      ...set,
      rest_time: value ? (set.rest_time > 0 ? set.rest_time : 60) : 0
    }));
    
    setCurrentExercise(prev => ({
      ...prev,
      sets: updatedSets
    }));
  };
  
  // Update all sets to use preferred weight unit
  const handleChangeWeightUnit = (newUnit: 'kg' | 'lbs') => {
    setPreferredWeightUnit(newUnit);
    
    const updatedSets = currentExercise.sets.map(set => ({
      ...set,
      weight_unit: newUnit
    }));
    
    setCurrentExercise(prev => ({
      ...prev,
      sets: updatedSets
    }));
  };
  
  // Handle saving the exercise
  const handleSaveExercise = () => {
    // Validation
    if (!currentExercise.name.trim()) {
      Alert.alert(t('error'), t('exercise_name_required'));
      return;
    }
    
    const effortType = currentExercise.effort_type || 'reps';
    const hasValidSets = currentExercise.sets.some(set => {
      switch (effortType) {
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
    
    const setsWithOrder = currentExercise.sets.map((set, index) => ({
      ...set,
      order: index,
      weight_unit: set.weight_unit || preferredWeightUnit
    }));
    
    const finalExercise: Exercise = {
      ...currentExercise,
      sets: setsWithOrder,
      notes: currentExercise.notes?.trim() || undefined,
    };
    
    onSave(finalExercise);
  };
  
  // Render equipment dropdown
  const renderEquipmentDropdown = () => {
    if (!equipmentDropdownVisible) return null;
    
    return (
      <Modal
        visible={equipmentDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEquipmentDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setEquipmentDropdownVisible(false)}
        >
          <View style={[styles.dropdownModal, { backgroundColor: palette.card_background }]}>
            <View style={[styles.dropdownHeader, { borderBottomColor: palette.border }]}>
              <Text style={[styles.dropdownTitle, { color: workoutPalette.text }]}>
                {t('select_equipment')}
              </Text>
              <TouchableOpacity
                style={styles.dropdownCloseButton}
                onPress={() => setEquipmentDropdownVisible(false)}
              >
                <Ionicons name="close" size={20} color={workoutPalette.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dropdownScroll}>
              <TouchableOpacity
                style={[
                  styles.equipmentOption,
                  { backgroundColor: palette.page_background },
                  selectedEquipmentNameKey === '' && { backgroundColor: `${workoutPalette.highlight}20` }
                ]}
                onPress={() => handleEquipmentSelect('')}
              >
                <View style={styles.equipmentOptionContent}>
                  <View style={[styles.equipmentIcon, { backgroundColor: palette.text_tertiary }]}>
                    <Ionicons name="ban-outline" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[
                    styles.equipmentOptionText, 
                    { color: palette.text },
                    selectedEquipmentNameKey === '' && { color: workoutPalette.highlight }
                  ]}>
                    {t('equipment_none')}
                  </Text>
                </View>
                {selectedEquipmentNameKey === '' && (
                  <Ionicons name="checkmark" size={20} color={workoutPalette.highlight} />
                )}
              </TouchableOpacity>
              
              {EQUIPMENT_TYPES.map((equipment) => (
                <TouchableOpacity
                  key={equipment.nameKey}
                  style={[
                    styles.equipmentOption,
                    { backgroundColor: palette.page_background },
                    selectedEquipmentNameKey === equipment.nameKey && { backgroundColor: `${workoutPalette.highlight}20` }
                  ]}
                  onPress={() => handleEquipmentSelect(equipment.nameKey)}
                >
                  <View style={styles.equipmentOptionContent}>
                    <View style={[styles.equipmentIcon, { backgroundColor: workoutPalette.highlight }]}>
                      <Ionicons 
                        name={equipment.iconName || 'fitness-outline'} 
                        size={20} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <Text style={[
                      styles.equipmentOptionText, 
                      { color: palette.text },
                      selectedEquipmentNameKey === equipment.nameKey && { color: workoutPalette.highlight }
                    ]}>
                      {t(equipment.nameKey)}
                    </Text>
                  </View>
                  {selectedEquipmentNameKey === equipment.nameKey && (
                    <Ionicons name="checkmark" size={20} color={workoutPalette.highlight} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Render picker modal
  const renderPickerModal = () => {
    if (!pickerModal.visible || !pickerModal.type) return null;
    
    const options = getPickerOptions(pickerModal.type);
    
    return (
      <Modal
        visible={pickerModal.visible}
        animationType="fade"
        transparent={true}
        onRequestClose={closePickerModal}
      >
        {/* Semi-transparent backdrop */}
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={closePickerModal}
          />
          
          {/* Centered modal content */}
          <View style={[styles.centeredModalContainer, { backgroundColor: palette.page_background }]}>
            {/* Optional title */}
            <Text style={[styles.centeredModalTitle, { color: workoutPalette.text }]}>
              {pickerModal.title}
            </Text>
            
            {/* Picker */}
            <View style={styles.centeredPickerContainer}>
              <Picker
                selectedValue={pickerModal.currentValue}
                onValueChange={handlePickerValueChange}
                style={[styles.centeredPicker, { backgroundColor: palette.page_background }]}
                itemStyle={[styles.centeredPickerItemStyle, { color: workoutPalette.text }]}
              >
                {options.map(value => (
                  <Picker.Item
                    key={value}
                    label={pickerModal.type === 'rest_time' && value === 0 ? t('no_rest') : value.toString()}
                    value={value}
                    color={workoutPalette.text}
                  />
                ))}
              </Picker>
            </View>
            
            {/* Action buttons */}
            <View style={styles.centeredModalButtons}>
              <TouchableOpacity onPress={closePickerModal} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, { color: workoutPalette.highlight }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closePickerModal} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, { color: workoutPalette.highlight }]}>
                  {t('done')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Render a single set row
  const renderSetRow = (set: ExerciseSet, index: number) => {
    const effortType = currentExercise.effort_type || 'reps';
    
    return (
      <View key={index} style={[styles.setRow, { backgroundColor: palette.input_background }]}>
        <View style={[
          styles.setNumberContainer,
          { backgroundColor: workoutPalette.highlight }
        ]}>
          <Text style={styles.setNumberText}>{index + 1}</Text>
        </View>
        
        <View style={styles.setInputsRow}>
          {effortType === 'reps' && (
            <>
              <View style={styles.valueContainer}>
                <Text style={[styles.valueLabel, { color: palette.text_tertiary }]}>{t('reps')}</Text>
                <TouchableOpacity
                  style={[styles.valueButton, { backgroundColor: palette.card_background }]}
                  onPress={() => openPickerModal('reps', index, set.reps || 10, t('reps'))}
                >
                  <Text style={[styles.valueText, { color: workoutPalette.text }]}>
                    {formatDisplayValue('reps', set.reps)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.valueContainer}>
                <Text style={[styles.valueLabel, { color: palette.text_tertiary }]}>{t('weight')} ({preferredWeightUnit})</Text>
                <TouchableOpacity
                  style={[styles.valueButton, { backgroundColor: palette.card_background }]}
                  onPress={() => openPickerModal('weight', index, set.weight || 0, `${t('weight')} (${preferredWeightUnit})`)}
                >
                  <Text style={[styles.valueText, { color: workoutPalette.text }]}>
                    {formatDisplayValue('weight', set.weight)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {effortType === 'time' && (
            <>
              <View style={styles.valueContainer}>
                <Text style={[styles.valueLabel, { color: palette.text_tertiary }]}>{t('duration')} (s)</Text>
                <TouchableOpacity
                  style={[styles.valueButton, { backgroundColor: palette.card_background }]}
                  onPress={() => openPickerModal('duration', index, set.duration || 30, `${t('duration')} (s)`)}
                >
                  <Text style={[styles.valueText, { color: workoutPalette.text }]}>
                    {formatDisplayValue('duration', set.duration)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.valueContainer}>
                <Text style={[styles.valueLabel, { color: palette.text_tertiary }]}>{t('weight')} ({preferredWeightUnit})</Text>
                <TouchableOpacity
                  style={[styles.valueButton, { backgroundColor: palette.card_background }]}
                  onPress={() => openPickerModal('weight', index, set.weight || 0, `${t('weight')} (${preferredWeightUnit})`)}
                >
                  <Text style={[styles.valueText, { color: workoutPalette.text }]}>
                    {formatDisplayValue('weight', set.weight)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {effortType === 'distance' && (
            <>
              <View style={styles.valueContainer}>
                <Text style={[styles.valueLabel, { color: palette.text_tertiary }]}>{t('distance')} (m)</Text>
                <TouchableOpacity
                  style={[styles.valueButton, { backgroundColor: palette.card_background }]}
                  onPress={() => openPickerModal('distance', index, set.distance || 100, `${t('distance')} (m)`)}
                >
                  <Text style={[styles.valueText, { color: workoutPalette.text }]}>
                    {formatDisplayValue('distance', set.distance)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.valueContainer}>
                <Text style={[styles.valueLabel, { color: palette.text_tertiary }]}>{t('time')} (s)</Text>
                <TouchableOpacity
                  style={[styles.valueButton, { backgroundColor: palette.card_background }]}
                  onPress={() => openPickerModal('duration', index, set.duration || 60, `${t('time')} (s)`)}
                >
                  <Text style={[styles.valueText, { color: workoutPalette.text }]}>
                    {formatDisplayValue('duration', set.duration)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {restTimeEnabled && (
            <View style={styles.valueContainer}>
              <Text style={[styles.valueLabel, { color: palette.text_tertiary }]}>{t('rest')} (s)</Text>
              <TouchableOpacity
                style={[styles.valueButton, { backgroundColor: palette.card_background }]}
                onPress={() => openPickerModal('rest_time', index, set.rest_time || 60, `${t('rest')} (s)`)}
              >
                <Text style={[styles.valueText, { color: workoutPalette.text }]}>
                  {formatDisplayValue('rest_time', set.rest_time)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.removeSetButton, 
            currentExercise.sets.length === 1 && styles.removeSetButtonDisabled
          ]}
          onPress={() => handleRemoveSet(index)}
          disabled={currentExercise.sets.length === 1}
        >
          <Ionicons 
            name="trash-outline" 
            size={16} 
            color={currentExercise.sets.length === 1 ? palette.text_tertiary : palette.error} 
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
                  value={currentExercise.name}
                  onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, name: text }))}
                  placeholder={t('enter_exercise_name')}
                  placeholderTextColor={palette.text_tertiary}
                  selectionColor={workoutPalette.highlight}
                />
              </View>
              
              {/* Equipment Selection */}
              <View style={styles.equipmentContainer}>
                <Text style={[styles.exerciseEditLabel, { color: workoutPalette.text }]}>{t('equipment')}</Text>
                <TouchableOpacity
                  style={[
                    styles.equipmentSelector,
                    { 
                      backgroundColor: palette.input_background,
                      borderColor: palette.border
                    }
                  ]}
                  onPress={() => setEquipmentDropdownVisible(true)}
                >
                  <View style={styles.equipmentSelectorContent}>
                    <View style={styles.equipmentSelectorLeft}>
                      {selectedEquipmentNameKey ? (
                        <>
                          <View style={[styles.equipmentSelectorIcon, { backgroundColor: workoutPalette.highlight }]}>
                            <Ionicons 
                              name={EQUIPMENT_TYPES.find(eq => eq.id === selectedEquipmentNameKey)?.iconName || 'fitness-outline'} 
                              size={16} 
                              color="#FFFFFF" 
                            />
                          </View>
                          <Text style={[styles.equipmentSelectorText, { color: workoutPalette.text }]}>
                            {t(selectedEquipmentNameKey)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <View style={[styles.equipmentSelectorIcon, { backgroundColor: palette.text_tertiary }]}>
                            <Ionicons name="ban-outline" size={16} color="#FFFFFF" />
                          </View>
                          <Text style={[styles.equipmentSelectorText, { color: palette.text_tertiary }]}>
                            {t('equipment_none')}
                          </Text>
                        </>
                      )}
                    </View>
                    <Ionicons name="chevron-down" size={16} color={palette.text_tertiary} />
                  </View>
                </TouchableOpacity>
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
                        currentExercise.effort_type === type && { backgroundColor: workoutPalette.highlight }
                      ]}
                      onPress={() => handleEffortTypeChange(type)}
                    >
                      <Ionicons 
                        name={icon as any} 
                        size={16} 
                        color={currentExercise.effort_type === type ? '#FFFFFF' : palette.text_tertiary} 
                      />
                      <Text style={[
                        styles.effortTypeButtonText,
                        { color: palette.text_tertiary },
                        currentExercise.effort_type === type && { color: '#FFFFFF' }
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Weight Unit Selection */}
              {(currentExercise.effort_type === 'reps' || currentExercise.effort_type === 'time') && (
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
              
              {/* Sets section */}
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
                
                {currentExercise.sets.map((set, index) => renderSetRow(set, index))}
              </View>
              
              {/* Rest time toggle */}
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
                  value={currentExercise.notes || ''}
                  onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, notes: text }))}
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
        
        {/* Equipment Dropdown Modal */}
        {renderEquipmentDropdown()}
        
        {/* Picker Modal */}
        {renderPickerModal()}
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
  equipmentContainer: {
    marginBottom: 20,
  },
  equipmentSelector: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  equipmentSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipmentSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  equipmentSelectorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  equipmentSelectorText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownCloseButton: {
    padding: 4,
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  equipmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  equipmentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  equipmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  equipmentOptionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
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
  setRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 16,
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  setInputsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  valueContainer: {
    marginRight: 6,
    marginBottom: 4,
    minWidth: 80,
  },
  valueLabel: {
    fontSize: 10,
    marginBottom: 2,
    fontWeight: '500',
  },
  valueButton: {
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  removeSetButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginTop: 16,
  },
  removeSetButtonDisabled: {
    opacity: 0.5,
  },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // Centered modal container
  centeredModalContainer: {
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    minWidth: 280,
    maxWidth: '90%',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  centeredModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  centeredPickerContainer: {
    height: 200,
    justifyContent: 'center',
  },
  
  centeredPicker: {
    height: 200,
  },
  
  centeredPickerItemStyle: {
    fontSize: 18,
  },
  
  centeredModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ExerciseConfigurator;