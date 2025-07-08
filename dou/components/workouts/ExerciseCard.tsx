// components/workouts/ExerciseCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

// Updated types to match the new format
export type ExerciseSet = {
  id?: number;
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

type ExerciseCardProps = {
  exercise: Exercise;
  pairedExerciseName?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onMakeSuperset?: () => void;
  onRemoveSuperset?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAddSet?: () => void;
  onRemoveSet?: (setIndex: number) => void;
  onUpdateSet?: (setIndex: number, field: keyof ExerciseSet, value: number | string | null) => void;
  onUpdateNotes?: (notes: string) => void;
  onUpdateSupersetRestTime?: (time: number) => void;
  showAllSets?: boolean; // Full detailed view
  editMode?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  pairingMode?: boolean;
  onSelect?: () => void; // For pairing mode
  exerciseIndex?: number; // For displaying in pairing mode
};

const ExerciseCard = ({ 
  exercise, 
  pairedExerciseName,
  onEdit, 
  onDelete, 
  onMakeSuperset, 
  onRemoveSuperset,
  onMoveUp,
  onMoveDown,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onUpdateNotes,
  onUpdateSupersetRestTime,
  showAllSets = false,
  editMode = false,
  isFirst = false,
  isLast = false,
  pairingMode = false,
  onSelect,
  exerciseIndex
}: ExerciseCardProps) => {
  const { t } = useLanguage();
  const { workoutPalette, palette } = useTheme();
  const [expanded, setExpanded] = useState(showAllSets);
  const [editingValues, setEditingValues] = useState<{[key: string]: string}>({});
  
  // Format time display for display only
  const formatTimeDisplay = (seconds: number): string => {
    if (seconds === 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // Format distance display
  const formatDistanceDisplay = (meters: number): string => {
    if (meters === 0) return '-';
    if (meters >= 1000) {
      const km = meters / 1000;
      return `${km}km`;
    }
    return `${meters}m`;
  };

  // Format weight display
  const formatWeightDisplay = (weight: number, unit: 'kg' | 'lbs' = 'kg'): string => {
    if (weight === 0) return '-';
    return `${weight}${unit}`;
  };

  // Get effort type information
  const getEffortTypeInfo = (effortType: 'reps' | 'time' | 'distance' = 'reps') => {
    switch (effortType) {
      case 'time':
        return { icon: 'time-outline', color: '#10B981', label: t('time') };
      case 'distance':
        return { icon: 'location-outline', color: '#3B82F6', label: t('distance') };
      case 'reps':
      default:
        return { icon: 'repeat-outline', color: '#F59E0B', label: t('reps') };
    }
  };

  // Format rest time for display
  const formatRestTime = (seconds: number): string => {
    return formatTimeDisplay(seconds);
  };

  // Get set summary based on effort type
  const getSetSummary = (set: ExerciseSet) => {
    const effortType = exercise.effort_type || 'reps';
    
    switch (effortType) {
      case 'time':
        const duration = set.duration ? formatTimeDisplay(set.duration) : '-';
        const weight = set.weight && set.weight > 0 ? formatWeightDisplay(set.weight, set.weight_unit) : null;
        return weight ? `${duration} @ ${weight}` : duration;
        
      case 'distance':
        const distance = set.distance ? formatDistanceDisplay(set.distance) : '-';
        const time = set.duration ? formatTimeDisplay(set.duration) : null;
        return time ? `${distance} in ${time}` : distance;
        
      case 'reps':
      default:
        const reps = set.reps || '-';
        const setWeight = set.weight && set.weight > 0 ? formatWeightDisplay(set.weight, set.weight_unit) : null;
        return setWeight ? `${reps} × ${setWeight}` : `${reps} reps`;
    }
  };
  const getInputValue = (setIndex: number, field: 'weight' | 'distance', currentValue: number | null) => {
    const editKey = `${setIndex}-${field}`;
    
    // If currently editing this field, return the editing value
    if (editingValues[editKey] !== undefined) {
      return editingValues[editKey];
    }
    
    // Otherwise, return the formatted stored value
    if (currentValue && currentValue > 0) {
      return currentValue.toString().replace('.', ',');
    }
    
    return '';
  };

  // FIXED: Get duration input value for editing
  const getDurationInputValue = (setIndex: number, currentValue: number | null) => {
    const editKey = `${setIndex}-duration`;
    
    // If currently editing this field, return the editing value
    if (editingValues[editKey] !== undefined) {
      return editingValues[editKey];
    }
    
    // Otherwise, return the raw seconds value for editing
    if (currentValue && currentValue > 0) {
      return currentValue.toString();
    }
    
    return '';
  };
  
  const handleInputChange = (setIndex: number, field: 'weight' | 'distance', text: string) => {
    const editKey = `${setIndex}-${field}`;
    
    // Store the display text locally
    setEditingValues(prev => ({
      ...prev,
      [editKey]: text
    }));
  };

  // FIXED: Handle duration input change
  const handleDurationInputChange = (setIndex: number, text: string) => {
    const editKey = `${setIndex}-duration`;
    
    // Store the display text locally
    setEditingValues(prev => ({
      ...prev,
      [editKey]: text
    }));
  };
  
  const handleInputBlur = (setIndex: number, field: 'weight' | 'distance') => {
    const editKey = `${setIndex}-${field}`;
    const currentText = editingValues[editKey];
    
    if (currentText !== undefined && onUpdateSet) {
      // Process the value and update the actual state
      let numericValue: number | null = null;
      if (currentText.trim()) {
        // Replace comma with dot for parsing
        const cleanValue = currentText.replace(',', '.').replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleanValue);
        numericValue = isNaN(parsed) ? null : parsed;
      }
      
      onUpdateSet(setIndex, field, numericValue);
      
      // Clear the editing state
      setEditingValues(prev => {
        const newState = { ...prev };
        delete newState[editKey];
        return newState;
      });
    }
  };

  // FIXED: Handle duration input blur with simple seconds parsing
  const handleDurationInputBlur = (setIndex: number) => {
    const editKey = `${setIndex}-duration`;
    const currentText = editingValues[editKey];
    
    if (currentText !== undefined && onUpdateSet) {
      // Simple parsing: treat input as seconds, optionally support 'm' for minutes
      let numericValue: number | null = null;
      if (currentText.trim()) {
        const cleanValue = currentText.trim();
        if (cleanValue.toLowerCase().endsWith('m')) {
          const minutes = parseFloat(cleanValue.replace(/[^\d.-]/g, ''));
          numericValue = isNaN(minutes) ? null : minutes * 60;
        } else {
          // Treat as seconds
          const seconds = parseFloat(cleanValue.replace(/[^\d.-]/g, ''));
          numericValue = isNaN(seconds) ? null : seconds;
        }
      }
      
      onUpdateSet(setIndex, 'duration', numericValue);
      
      // Clear the editing state
      setEditingValues(prev => {
        const newState = { ...prev };
        delete newState[editKey];
        return newState;
      });
    }
  };

  // Render set input fields based on effort type in edit mode
  const renderSetInputs = (set: ExerciseSet, setIndex: number) => {
    const effortType = exercise.effort_type || 'reps';
  
    switch (effortType) {
      case 'time':
        return (
          <>
            <TextInput
              style={[
                styles.setInputValue,
                { 
                  backgroundColor: `${palette.input_background}80`,
                  color: workoutPalette.text
                }
              ]}
              value={getDurationInputValue(setIndex, set.duration)}
              onChangeText={(text) => handleDurationInputChange(setIndex, text)}
              onBlur={() => handleDurationInputBlur(setIndex)}
              onSubmitEditing={() => handleDurationInputBlur(setIndex)}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={palette.text_tertiary}
            />
            <TextInput
              style={[
                styles.setInputValue,
                { 
                  backgroundColor: `${palette.input_background}80`,
                  color: workoutPalette.text
                }
              ]}
              value={getInputValue(setIndex, 'weight', set.weight)}
              onChangeText={(text) => handleInputChange(setIndex, 'weight', text)}
              onBlur={() => handleInputBlur(setIndex, 'weight')}
              onSubmitEditing={() => handleInputBlur(setIndex, 'weight')}
              keyboardType="decimal-pad"
              placeholder={`0${set.weight_unit || 'kg'}`}
              placeholderTextColor={palette.text_tertiary}
            />
          </>
        );
        
      case 'distance':
        return (
          <>
            <TextInput
              style={[
                styles.setInputValue,
                { 
                  backgroundColor: `${palette.input_background}80`,
                  color: workoutPalette.text
                }
              ]}
              value={getInputValue(setIndex, 'distance', set.distance)}
              onChangeText={(text) => handleInputChange(setIndex, 'distance', text)}
              onBlur={() => handleInputBlur(setIndex, 'distance')}
              onSubmitEditing={() => handleInputBlur(setIndex, 'distance')}
              keyboardType="decimal-pad"
              placeholder="100"
              placeholderTextColor={palette.text_tertiary}
            />
            <TextInput
              style={[
                styles.setInputValue,
                { 
                  backgroundColor: `${palette.input_background}80`,
                  color: workoutPalette.text
                }
              ]}
              value={getDurationInputValue(setIndex, set.duration)}
              onChangeText={(text) => handleDurationInputChange(setIndex, text)}
              onBlur={() => handleDurationInputBlur(setIndex)}
              onSubmitEditing={() => handleDurationInputBlur(setIndex)}
              keyboardType="number-pad"
              placeholder="120"
              placeholderTextColor={palette.text_tertiary}
            />
          </>
        );
        
      case 'reps':
      default:
        return (
          <>
            <TextInput
              style={[
                styles.setInputValue,
                { 
                  backgroundColor: `${palette.input_background}80`,
                  color: workoutPalette.text
                }
              ]}
              value={set.reps?.toString() || ''}
              onChangeText={(text) => onUpdateSet && onUpdateSet(setIndex, 'reps', parseInt(text) || null)}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={palette.text_tertiary}
            />
            <TextInput
              style={[
                styles.setInputValue,
                { 
                  backgroundColor: `${palette.input_background}80`,
                  color: workoutPalette.text
                }
              ]}
              value={getInputValue(setIndex, 'weight', set.weight)}
              onChangeText={(text) => handleInputChange(setIndex, 'weight', text)}
              onBlur={() => handleInputBlur(setIndex, 'weight')}
              onSubmitEditing={() => handleInputBlur(setIndex, 'weight')}
              keyboardType="decimal-pad"
              placeholder={`0${set.weight_unit || 'kg'}`}
              placeholderTextColor={palette.text_tertiary}
            />
          </>
        );
    }
  };

  // Render set values in display mode
  const renderSetValues = (set: ExerciseSet) => {
    const effortType = exercise.effort_type || 'reps';

    switch (effortType) {
      case 'time':
        return (
          <>
            <Text style={[styles.setValue, { color: workoutPalette.text }]}>
              {set.duration ? formatTimeDisplay(set.duration) : '-'}
            </Text>
            <Text style={[styles.setValue, { color: workoutPalette.text }]}>
              {set.weight && set.weight > 0 ? formatWeightDisplay(set.weight, set.weight_unit) : '-'}
            </Text>
          </>
        );
        
      case 'distance':
        return (
          <>
            <Text style={[styles.setValue, { color: workoutPalette.text }]}>
              {set.distance ? formatDistanceDisplay(set.distance) : '-'}
            </Text>
            <Text style={[styles.setValue, { color: workoutPalette.text }]}>
              {set.duration ? formatTimeDisplay(set.duration) : '-'}
            </Text>
          </>
        );
        
      case 'reps':
      default:
        return (
          <>
            <Text style={[styles.setValue, { color: workoutPalette.text }]}>{set.reps || '-'}</Text>
            <Text style={[styles.setValue, { color: workoutPalette.text }]}>
              {set.weight && set.weight > 0 ? formatWeightDisplay(set.weight, set.weight_unit) : '-'}
            </Text>
          </>
        );
    }
  };

  // Get headers for sets table based on effort type
  const getSetsHeaders = () => {
    const effortType = exercise.effort_type || 'reps';
    const restHeader = <Text key="rest" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('rest')} (s)</Text>;
    const actionHeader = editMode ? <Text key="action" style={[styles.setsHeaderText, { flex: 0.5, color: palette.text_tertiary }]}></Text> : null;

    switch (effortType) {
      case 'time':
        return [
          <Text key="set" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('set')}</Text>,
          <Text key="duration" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('duration')} (s)</Text>,
          <Text key="weight" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('weight')}</Text>,
          restHeader,
          actionHeader
        ].filter(Boolean);
        
      case 'distance':
        return [
          <Text key="set" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('set')}</Text>,
          <Text key="distance" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('distance')}</Text>,
          <Text key="time" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('time')} (s)</Text>,
          restHeader,
          actionHeader
        ].filter(Boolean);
        
      case 'reps':
      default:
        return [
          <Text key="set" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('set')}</Text>,
          <Text key="reps" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('reps')}</Text>,
          <Text key="weight" style={[styles.setsHeaderText, { color: palette.text_tertiary }]}>{t('weight')}</Text>,
          restHeader,
          actionHeader
        ].filter(Boolean);
    }
  };

  // Render effort type badge
  const renderEffortTypeBadge = () => {
    const effortType = exercise.effort_type || 'reps';
    const effortInfo = getEffortTypeInfo(effortType);
    
    return (
      <View style={[styles.effortTypeBadge, { backgroundColor: `${effortInfo.color}30` }]}>
        <Ionicons name={effortInfo.icon as any} size={12} color={effortInfo.color} />
        <Text style={[styles.effortTypeBadgeText, { color: effortInfo.color }]}>
          {effortInfo.label}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: palette.card_background },
      exercise.is_superset && { borderLeftColor: workoutPalette.highlight }
    ]}>
      {/* Superset indicator with label */}
      {exercise.is_superset && (
        <>
          <View style={[
            styles.supersetLabelContainer,
            { backgroundColor: workoutPalette.highlight }
          ]}>
            <Text style={styles.supersetLabel}>{t('superset')}</Text>
          </View>
        </>
      )}
      
      {/* Exercise Header with new layout */}
      <TouchableOpacity 
        style={[
          styles.header,
          { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }
        ]}
        onPress={() => !showAllSets && setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {/* Exercise number/index if provided */}
          {exerciseIndex !== undefined && (
            <View style={[
              styles.exerciseNumber,
              { backgroundColor: `${workoutPalette.highlight}20` }
            ]}>
              <Text style={[styles.exerciseNumberText, { color: workoutPalette.highlight }]}>{exerciseIndex + 1}</Text>
            </View>
          )}
          
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: workoutPalette.text }]}>{exercise.name}</Text>
            
            {/* Paired exercise info */}
            {exercise.is_superset && pairedExerciseName && (
              <View style={styles.pairedInfo}>
                <Ionicons name="link" size={14} color={workoutPalette.highlight} />
                <Text style={[styles.pairedText, { color: workoutPalette.highlight }]}>
                  <Text style={[styles.pairedWithText, { color: palette.text_tertiary }]}>{t('paired_with')}: </Text>
                  {pairedExerciseName}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {/* Effort type badge */}
          {renderEffortTypeBadge()}
          
          {/* Superset badge */}
          {exercise.is_superset && (
            <View style={[styles.supersetBadge, { backgroundColor: workoutPalette.highlight }]}>
              <Ionicons name="link" size={14} color="#FFFFFF" />
            </View>
          )}
          
          {!showAllSets && (
            <View style={[
              styles.setCountBadge,
              { backgroundColor: `${workoutPalette.highlight}20` }
            ]}>
              <Text style={[
                styles.setCountText,
                { color: 'rgba(255, 255, 255, 0.7)' }
              ]}>
                {exercise.sets.length} {exercise.sets.length === 1 ? t('set') : t('sets')}
              </Text>
            </View>
          )}
          
          {/* Chevron for expansion/collapse */}
          {!showAllSets && !pairingMode && (
            <Ionicons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="rgba(255, 255, 255, 0.7)" 
              style={styles.expandIcon}
            />
          )}
        </View>
      </TouchableOpacity>
      
      {/* Summary of first set - only shown in compact mode when not expanded */}
      {!showAllSets && !expanded && exercise.sets.length > 0 && (
        <View style={[
          styles.setSummary,
          { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }
        ]}>
          <Text style={[styles.setSummaryValue, { color: palette.text }]}>
            {getSetSummary(exercise.sets[0])}
          </Text>
          {exercise.sets[0].rest_time > 0 && (
            <View style={styles.setSummaryItem}>
              <Text style={[styles.setSummaryLabel, { color: palette.text_tertiary }]}>{t('rest')}:</Text>
              <Text style={[styles.setSummaryValue, { color: palette.text }]}>
                {formatRestTime(exercise.sets[0].rest_time)}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Exercise details - shown when showAllSets is true or expanded is true */}
      {(showAllSets || expanded) && (
        <View style={styles.details}>
          {/* Superset rest time */}
          {exercise.is_superset && exercise.superset_rest_time && exercise.superset_rest_time > 0 && (
            <View style={[
              styles.supersetRestTimeInfo,
              { backgroundColor: `${workoutPalette.highlight}10` }
            ]}>
              <Text style={[
                styles.supersetRestTimeLabel,
                { color: 'rgba(255, 255, 255, 0.7)' }
              ]}>
                {t('superset_rest')}:
              </Text>
              {editMode && onUpdateSupersetRestTime ? (
                <TextInput
                  style={[
                    styles.supersetRestTimeInput,
                    { 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: workoutPalette.text
                    }
                  ]}
                  value={exercise.superset_rest_time.toString()}
                  onChangeText={(text) => onUpdateSupersetRestTime(parseInt(text) || 0)}
                  keyboardType="number-pad"
                />
              ) : (
                <Text style={[
                  styles.supersetRestTimeValue,
                  { color: workoutPalette.highlight }
                ]}>
                  {formatRestTime(exercise.superset_rest_time)}
                </Text>
              )}
            </View>
          )}
          
          {/* Sets header */}
          <View style={[
            styles.setsHeader,
            { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }
          ]}>
            {getSetsHeaders().map((header, index) => (
              <React.Fragment key={index}>{header}</React.Fragment>
            ))}
          </View>
          
          {/* Sets */}
          {exercise.sets.map((set, setIndex) => (
            <View key={setIndex} style={[
              styles.setRow,
              { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }
            ]}>
              <Text style={[styles.setNumber, { color: workoutPalette.highlight }]}>{setIndex + 1}</Text>
              
              {editMode && onUpdateSet ? (
                <>
                  {renderSetInputs(set, setIndex)}
                  <TextInput
                    style={[
                      styles.setInputValue,
                      { 
                        backgroundColor: `${palette.input_background}80`,
                        color: workoutPalette.text
                      }
                    ]}
                    value={set.rest_time?.toString() || ''}
                    onChangeText={(text) => onUpdateSet(setIndex, 'rest_time', parseInt(text) || 0)}
                    keyboardType="number-pad"
                    placeholder="60"
                    placeholderTextColor={palette.text_tertiary}
                  />
                  <TouchableOpacity 
                    style={[styles.removeSetButton, { flex: 0.5 }]} 
                    onPress={() => onRemoveSet && onRemoveSet(setIndex)}
                  >
                    <Ionicons name="remove-circle-outline" size={18} color={palette.error} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {renderSetValues(set)}
                  <Text style={[styles.setValue, { color: workoutPalette.text }]}>{set.rest_time || '-'}</Text>
                </>
              )}
            </View>
          ))}
          
          {/* Add set button (only in edit mode) */}
          {editMode && onAddSet && (
            <TouchableOpacity 
              style={[
                styles.addSetButton,
                { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
              ]}
              onPress={onAddSet}
            >
              <Ionicons name="add-circle-outline" size={18} color="#10b981" />
              <Text style={[styles.addSetButtonText, { color: '#10b981' }]}>{t('add_set')}</Text>
            </TouchableOpacity>
          )}
          
          {/* Exercise notes if present */}
          {(exercise.notes || editMode) && (
            <View style={[
              styles.notesContainer,
              { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
            ]}>
              <Text style={[
                styles.notesLabel,
                { color: 'rgba(255, 255, 255, 0.7)' }
              ]}>{t('notes')}:</Text>
              {editMode && onUpdateNotes ? (
                <TextInput
                  style={[
                    styles.notesInput,
                    { 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: workoutPalette.text
                    }
                  ]}
                  value={exercise.notes || ''}
                  onChangeText={onUpdateNotes}
                  multiline
                  numberOfLines={2}
                  placeholder={t('add_notes_here')}
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                />
              ) : (
                exercise.notes && <Text style={[
                  styles.notesText,
                  { color: 'rgba(255, 255, 255, 0.7)' }
                ]}>{exercise.notes}</Text>
              )}
            </View>
          )}
        </View>
      )}
      
      {/* Action buttons */}
      {editMode && !pairingMode && (
        <View style={[
          styles.actionButtons,
          { borderTopColor: 'rgba(255, 255, 255, 0.1)' }
        ]}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={16} color={workoutPalette.highlight} />
            <Text style={[styles.actionButtonText, { color: workoutPalette.highlight }]}>{t('edit')}</Text>
          </TouchableOpacity>
          
          {exercise.is_superset ? (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onRemoveSuperset}
            >
              <Ionicons name="close-circle" size={16} color={palette.error} />
              <Text style={[styles.actionButtonText, styles.removeText, { color: palette.error }]}>{t('superset')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onMakeSuperset}
            >
              <Ionicons name="link" size={16} color={workoutPalette.highlight} />
              <Text style={[styles.actionButtonText, { color: workoutPalette.highlight }]}>{t('superset')}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={16} color={palette.error} />
            <Text style={[styles.actionButtonText, styles.removeText, { color: palette.error }]}>{t('remove')}</Text>
          </TouchableOpacity>
          
          <View style={styles.reorderButtons}>
            <TouchableOpacity
              style={[styles.reorderButton, isFirst && styles.disabledButton]}
              onPress={onMoveUp}
              disabled={isFirst}
            >
              <Ionicons 
                name="chevron-up" 
                size={16} 
                color={isFirst ? palette.text_tertiary : workoutPalette.highlight} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderButton, isLast && styles.disabledButton]}
              onPress={onMoveDown}
              disabled={isLast}
            >
              <Ionicons 
                name="chevron-down" 
                size={16} 
                color={isLast ? palette.text_tertiary : workoutPalette.highlight} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Pairing mode specific controls */}
      {pairingMode && onSelect && (
        <TouchableOpacity 
          style={[
            styles.pairButton,
            { 
              backgroundColor: `${workoutPalette.highlight}10`,
              borderLeftColor: workoutPalette.highlight
            }
          ]}
          onPress={onSelect}
        >
          <Ionicons name="link" size={16} color={workoutPalette.highlight} />
          <Text style={[styles.pairButtonText, { color: workoutPalette.highlight }]}>{t('pair_as_superset')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  supersetLabelContainer: {
    position: 'absolute',
    left: 4, 
    top: 0,
    borderBottomRightRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    zIndex: 2,
  },
  supersetLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  supersetBadge: {
    padding: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  pairedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pairedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  pairedWithText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effortTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  effortTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  setCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  setCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandIcon: {
    padding: 2,
  },
  setSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  setSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setSummaryLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  setSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    padding: 12,
  },
  supersetRestTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 12,
    borderRadius: 8,
  },
  supersetRestTimeLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  supersetRestTimeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  supersetRestTimeInput: {
    flex: 1,
    borderRadius: 4,
    padding: 4,
    fontSize: 14,
    textAlign: 'center',
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  setsHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  setNumber: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  setValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  setInputValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 2,
  },
  removeSetButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addSetButtonText: {
    fontSize: 14,
    marginLeft: 6,
  },
  notesContainer: {
    marginTop: 12,
    borderRadius: 8,
    padding: 10,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  notesInput: {
    fontSize: 14,
    borderRadius: 4,
    padding: 6,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  removeText: {
    // color is set via theme
  },
  reorderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    margin: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  pairButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ExerciseCard;