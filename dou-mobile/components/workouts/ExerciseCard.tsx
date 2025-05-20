// components/workouts/ExerciseCard.tsx - Modified component
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
import { Exercise, ExerciseSet } from './ExerciseConfigurator';

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
  onUpdateSet?: (setIndex: number, field: keyof ExerciseSet, value: number) => void;
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
  const [expanded, setExpanded] = useState(showAllSets);
  
  // Format rest time for display
  const formatRestTime = (seconds: number): string => {
    if (seconds === 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };
  
  return (
    <View style={[
      styles.container,
      exercise.is_superset && styles.supersetContainer
    ]}>
      {/* Superset indicator with label */}
      {exercise.is_superset && (
        <>
          <View style={styles.supersetLabelContainer}>
            <Text style={styles.supersetLabel}>{t('superset')}</Text>
          </View>
        </>
      )}
      
      {/* Exercise Header with new layout */}
      <TouchableOpacity 
        style={styles.header}
        onPress={() => !showAllSets && setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {/* Exercise number/index if provided */}
          {exerciseIndex !== undefined && (
            <View style={styles.exerciseNumber}>
              <Text style={styles.exerciseNumberText}>{exerciseIndex + 1}</Text>
            </View>
          )}
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{exercise.name}</Text>
            
            {/* Paired exercise info */}
            {exercise.is_superset && pairedExerciseName && (
              <View style={styles.pairedInfo}>
                <Ionicons name="git-branch-outline" size={14} color="#0ea5e9" />
                <Text style={styles.pairedText}>
                  <Text style={styles.pairedWithText}>{t('paired_with')}: </Text>
                  {pairedExerciseName}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {/* Superset badge moved here */}
          {exercise.is_superset && (
            <View style={styles.supersetBadge}>
              <Ionicons name="git-branch-outline" size={14} color="#FFFFFF" />
            </View>
          )}
          
          {!showAllSets && (
            <View style={styles.setCountBadge}>
              <Text style={styles.setCountText}>
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
        <View style={styles.setSummary}>
          <View style={styles.setSummaryItem}>
            <Text style={styles.setSummaryLabel}>{t('reps')}:</Text>
            <Text style={styles.setSummaryValue}>{exercise.sets[0].reps}</Text>
          </View>
          <View style={styles.setSummaryItem}>
            <Text style={styles.setSummaryLabel}>{t('weight')}:</Text>
            <Text style={styles.setSummaryValue}>
              {exercise.sets[0].weight > 0 ? `${exercise.sets[0].weight}kg` : '-'}
            </Text>
          </View>
          <View style={styles.setSummaryItem}>
            <Text style={styles.setSummaryLabel}>{t('rest')}:</Text>
            <Text style={styles.setSummaryValue}>
              {formatRestTime(exercise.sets[0].rest_time)}
            </Text>
          </View>
        </View>
      )}
      
      {/* Exercise details - shown when showAllSets is true or expanded is true */}
      {(showAllSets || expanded) && (
        <View style={styles.details}>
          {/* Superset rest time */}
          {exercise.is_superset && exercise.superset_rest_time && exercise.superset_rest_time > 0 && (
            <View style={styles.supersetRestTimeInfo}>
              <Text style={styles.supersetRestTimeLabel}>
                {t('superset_rest')}:
              </Text>
              {editMode && onUpdateSupersetRestTime ? (
                <TextInput
                  style={styles.supersetRestTimeInput}
                  value={exercise.superset_rest_time.toString()}
                  onChangeText={(text) => onUpdateSupersetRestTime(parseInt(text) || 0)}
                  keyboardType="number-pad"
                />
              ) : (
                <Text style={styles.supersetRestTimeValue}>
                  {formatRestTime(exercise.superset_rest_time)}
                </Text>
              )}
            </View>
          )}
          
          {/* Sets header */}
          <View style={styles.setsHeader}>
            <Text style={styles.setsHeaderText}>{t('set')}</Text>
            <Text style={styles.setsHeaderText}>{t('reps')}</Text>
            <Text style={styles.setsHeaderText}>{t('weight')} (kg)</Text>
            <Text style={styles.setsHeaderText}>{t('rest')} (s)</Text>
            {editMode && <Text style={[styles.setsHeaderText, { flex: 0.5 }]}></Text>}
          </View>
          
          {/* Sets */}
          {exercise.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <Text style={styles.setNumber}>{setIndex + 1}</Text>
              
              {editMode && onUpdateSet ? (
                <>
                  <TextInput
                    style={styles.setInputValue}
                    value={set.reps?.toString() || ''}
                    onChangeText={(text) => onUpdateSet(setIndex, 'reps', parseInt(text) || 0)}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={styles.setInputValue}
                    value={set.weight?.toString() || ''}
                    onChangeText={(text) => onUpdateSet(setIndex, 'weight', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={styles.setInputValue}
                    value={set.rest_time?.toString() || ''}
                    onChangeText={(text) => onUpdateSet(setIndex, 'rest_time', parseInt(text) || 0)}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity 
                    style={[styles.removeSetButton, { flex: 0.5 }]} 
                    onPress={() => onRemoveSet && onRemoveSet(setIndex)}
                  >
                    <Ionicons name="remove-circle-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.setValue}>{set.reps || '-'}</Text>
                  <Text style={styles.setValue}>{set.weight || '-'}</Text>
                  <Text style={styles.setValue}>{set.rest_time || '-'}</Text>
                </>
              )}
            </View>
          ))}
          
          {/* Add set button (only in edit mode) */}
          {editMode && onAddSet && (
            <TouchableOpacity 
              style={styles.addSetButton}
              onPress={onAddSet}
            >
              <Ionicons name="add-circle-outline" size={18} color="#10b981" />
              <Text style={styles.addSetButtonText}>{t('add_set')}</Text>
            </TouchableOpacity>
          )}
          
          {/* Exercise notes if present */}
          {(exercise.notes || editMode) && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>{t('notes')}:</Text>
              {editMode && onUpdateNotes ? (
                <TextInput
                  style={styles.notesInput}
                  value={exercise.notes || ''}
                  onChangeText={onUpdateNotes}
                  multiline
                  numberOfLines={2}
                  placeholder={t('add_notes_here')}
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                />
              ) : (
                exercise.notes && <Text style={styles.notesText}>{exercise.notes}</Text>
              )}
            </View>
          )}
        </View>
      )}
      
      {/* Action buttons */}
      {editMode && !pairingMode && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={16} color="#0ea5e9" />
            <Text style={styles.actionButtonText}>{t('edit')}</Text>
          </TouchableOpacity>
          
          {exercise.is_superset ? (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onRemoveSuperset}
            >
              <Ionicons name="link-off" size={16} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.removeText]}>{t('remove_superset')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onMakeSuperset}
            >
              <Ionicons name="link" size={16} color="#0ea5e9" />
              <Text style={styles.actionButtonText}>{t('make_superset')}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.removeText]}>{t('remove')}</Text>
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
                color={isFirst ? "#6B7280" : "#0ea5e9"} 
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
                color={isLast ? "#6B7280" : "#0ea5e9"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Pairing mode specific controls */}
      {pairingMode && onSelect && (
        <TouchableOpacity 
          style={styles.pairButton}
          onPress={onSelect}
        >
          <Ionicons name="link" size={16} color="#0ea5e9" />
          <Text style={styles.pairButtonText}>{t('pair_as_superset')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  supersetContainer: {
    backgroundColor: '#1F2937', // Lighter background for supersets
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  // New superset indicator with visible bracket
  supersetIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: 20,
    zIndex: 1,
  },
  supersetLabelContainer: {
    position: 'absolute',
    left: 4, 
    top: 0,
    backgroundColor: '#0ea5e9',
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
  supersetLine: {
    width: 4,
    backgroundColor: '#0ea5e9',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  // Modified badge to be smaller and just show the icon
  supersetBadge: {
    backgroundColor: '#0ea5e9',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pairedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pairedText: {
    fontSize: 12,
    color: '#0ea5e9',
    marginLeft: 4,
  },
  pairedWithText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setCountBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  setCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  expandIcon: {
    padding: 4, // Make the tap target larger
  },
  setSummary: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  setSummaryItem: {
    flexDirection: 'row',
    marginRight: 12,
    alignItems: 'center',
  },
  setSummaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 4,
  },
  setSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  // Keep all other styles the same
  details: {
    padding: 12,
  },
  supersetRestTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    padding: 8,
    marginBottom: 12,
    borderRadius: 8,
  },
  supersetRestTimeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  supersetRestTimeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  supersetRestTimeInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 4,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  setsHeaderText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  setNumber: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  setValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#FFFFFF',
  },
  setInputValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
  },
  addSetButtonText: {
    fontSize: 14,
    color: '#10b981',
    marginLeft: 6,
  },
  notesContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  notesInput: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 6,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
    paddingHorizontal: 10,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 4,
  },
  removeText: {
    color: '#ef4444',
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
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingVertical: 10,
    margin: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  pairButtonIconContainer: {
    position: 'relative',
    marginRight: 8,
  },
  pairButtonLine: {
    position: 'absolute',
    left: 8,
    top: -15,
    width: 2,
    height: 15,
    backgroundColor: '#0ea5e9',
  },
  pairButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
  },
});

export default ExerciseCard;