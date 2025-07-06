// app/(app)/log/components/ExerciseCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRestTime } from '../../workout/formatters';

interface ExerciseCardProps {
  exercise: any;
  index: number;
  exercises: any[];
  colors: any;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCreateSuperset: () => void;
  onBreakSuperset: () => void;
  t: (key: string) => string;
}

// Helper functions for different effort types
const formatTime = (seconds: number): string => {
  if (seconds === 0) return '-';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
};

const formatWeightDisplay = (weight: number | null, unit: 'kg' | 'lbs' = 'kg'): string => {
  if (!weight || weight === 0) return '-';
  return `${weight}${unit}`;
};

const getEffortTypeDisplay = (effortType: string, t: any) => {
  switch (effortType) {
    case 'time':
      return t('time');
    case 'distance':
      return t('distance');
    case 'reps':
    default:
      return t('reps');
  }
};

const getEffortTypeIcon = (effortType: string) => {
  switch (effortType) {
    case 'time':
      return 'time-outline';
    case 'distance':
      return 'location-outline';
    case 'reps':
    default:
      return 'repeat-outline';
  }
};

const getEffortTypeColor = (effortType: string) => {
  switch (effortType) {
    case 'time':
      return '#10B981';
    case 'distance':
      return '#3B82F6';
    case 'reps':
    default:
      return '#F59E0B';
  }
};

// Component to render set data based on effort type
const SetDataDisplay = ({ set, effortType, t }: { set: any; effortType: string; t: any }) => {
  switch (effortType) {
    case 'time':
      return (
        <>
          <Text style={styles.setCell}>
            {set.duration ? formatTime(set.duration) : '-'}
          </Text>
          <Text style={styles.setCell}>
            {formatWeightDisplay(set.weight, set.weight_unit)}
          </Text>
          <Text style={styles.setCell}>{formatRestTime(set.rest_time)}</Text>
        </>
      );
    case 'distance':
      return (
        <>
          <Text style={styles.setCell}>
            {set.distance ? formatDistance(set.distance) : '-'}
          </Text>
          <Text style={styles.setCell}>
            {set.duration ? formatTime(set.duration) : '-'}
          </Text>
          <Text style={styles.setCell}>{formatRestTime(set.rest_time)}</Text>
        </>
      );
    case 'reps':
    default:
      return (
        <>
          <Text style={styles.setCell}>{set.reps || '-'}</Text>
          <Text style={styles.setCell}>
            {formatWeightDisplay(set.weight, set.weight_unit)}
          </Text>
          <Text style={styles.setCell}>{formatRestTime(set.rest_time)}</Text>
        </>
      );
  }
};

// Component to render table headers based on effort type
const TableHeaders = ({ effortType, t }: { effortType: string; t: any }) => {
  switch (effortType) {
    case 'time':
      return (
        <>
          <Text style={styles.setColumnHeader}>{t('set')}</Text>
          <Text style={styles.setColumnHeader}>{t('time')}</Text>
          <Text style={styles.setColumnHeader}>{t('weight')}</Text>
          <Text style={styles.setColumnHeader}>{t('rest')}</Text>
        </>
      );
    case 'distance':
      return (
        <>
          <Text style={styles.setColumnHeader}>{t('set')}</Text>
          <Text style={styles.setColumnHeader}>{t('distance')}</Text>
          <Text style={styles.setColumnHeader}>{t('time')}</Text>
          <Text style={styles.setColumnHeader}>{t('rest')}</Text>
        </>
      );
    case 'reps':
    default:
      return (
        <>
          <Text style={styles.setColumnHeader}>{t('set')}</Text>
          <Text style={styles.setColumnHeader}>{t('reps')}</Text>
          <Text style={styles.setColumnHeader}>{t('weight')}</Text>
          <Text style={styles.setColumnHeader}>{t('rest')}</Text>
        </>
      );
  }
};

// Exercise Menu Component
const ExerciseMenu = ({ 
  visible, 
  onClose, 
  onEdit, 
  onDelete, 
  onMoveUp,
  onMoveDown,
  onCreateSuperset, 
  onBreakSuperset,
  exercise, 
  colors,
  t 
}: {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCreateSuperset: () => void;
  onBreakSuperset: () => void;
  exercise: any;
  exercises: Exercise[];
  exerciseIndex: number;
  colors: any;
  t: any;
}) => {
  const handleEdit = () => {
    onClose();
    onEdit();
  };

  const handleDelete = () => {
    onClose();
    Alert.alert(
      t('delete_exercise'),
      t('delete_exercise_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: onDelete }
      ]
    );
  };

  const handleCreateSuperset = () => {
    onClose();
    onCreateSuperset();
  };

  const handleBreakSuperset = () => {
    onClose();
    Alert.alert(
      t('break_superset'),
      t('break_superset_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('break_superset'), style: 'destructive', onPress: onBreakSuperset }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.menuTitle, { color: colors.text.primary }]}>{t(exercise.name)}</Text>
          </View>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color="#3B82F6" />
            <Text style={[styles.menuItemText, { color: '#3B82F6' }]}>{t('edit_exercise')}</Text>
          </TouchableOpacity>
          
          {exercise.is_superset ? (
            <TouchableOpacity style={styles.menuItem} onPress={handleBreakSuperset}>
              <Ionicons name="unlink-outline" size={20} color="#F59E0B" />
              <Text style={[styles.menuItemText, { color: '#F59E0B' }]}>{t('break_superset')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.menuItem} onPress={handleCreateSuperset}>
              <Ionicons name="link-outline" size={20} color="#10B981" />
              <Text style={[styles.menuItemText, { color: '#10B981' }]}>{t('create_superset')}</Text>
            </TouchableOpacity>
          )}
          
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>{t('delete_exercise')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  exercises,
  colors,
  canEdit,
  onEdit,
  onDelete,
  onCreateSuperset,
  onBreakSuperset,
  t,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  
  const pairedExerciseName = exercise.is_superset && exercise.superset_with !== null
    ? exercises.find((ex: any) => ex.order === exercise.superset_with)?.name
    : null;
  
  const effortType = exercise.effort_type || 'reps';
  const effortTypeColor = getEffortTypeColor(effortType);

  return (
    <View 
      style={[
        styles.exerciseCard, 
        exercise.is_superset && styles.supersetCard,
        { backgroundColor: colors.card }
      ]}
    >
      {/* Exercise Header */}
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseHeaderLeft}>
          {/* Exercise index badge */}
          <View style={styles.exerciseIndexBadge}>
            <Text style={styles.exerciseIndexText}>{index + 1}</Text>
          </View>
          
          <View style={styles.exerciseTitleContainer}>
            <View style={styles.exerciseNameRow}>
              <Text style={styles.exerciseTitle}>{t(exercise.name)}</Text>
              
              {/* Effort type indicator */}
              <View style={[styles.effortTypeBadge, { backgroundColor: `${effortTypeColor}30` }]}>
                <Ionicons 
                  name={getEffortTypeIcon(effortType)} 
                  size={12} 
                  color={effortTypeColor} 
                />
                <Text style={[styles.effortTypeText, { color: effortTypeColor }]}>
                  {getEffortTypeDisplay(effortType, t)}
                </Text>
              </View>
            </View>
          
            {/* Equipment info */}
            {exercise.equipment && (
              <View style={styles.equipmentInfo}>
                <Ionicons name="barbell-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.equipmentText}>{t(exercise.equipment)}</Text>
              </View>
            )}
            
            {/* Superset info */}
            {exercise.is_superset && pairedExerciseName && (
              <View style={styles.supersetInfo}>
                <Ionicons name="git-branch-outline" size={14} color="#0ea5e9" />
                <Text style={styles.supersetInfoText}>
                  {t('paired_with')}: {pairedExerciseName}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Three-dot menu button (only show if can edit) */}
        {canEdit && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Exercise Sets Table */}
      <View style={styles.setsTable}>
        {/* Table Header - Dynamic based on effort type */}
        <View style={styles.setsTableHeader}>
          <TableHeaders effortType={effortType} t={t} />
        </View>
        
        {/* Table Rows */}
        {exercise.sets.map((set: any, setIndex: number) => (
          <View 
            key={`set-${setIndex}`}
            style={[
              styles.setRow,
              setIndex % 2 === 1 && { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
            ]}
          >
            <Text style={styles.setCell}>{setIndex + 1}</Text>
            <SetDataDisplay set={set} effortType={effortType} t={t} />
          </View>
        ))}
      </View>
      
      {/* Exercise Notes */}
      {exercise.notes && (
        <View style={styles.exerciseNotesContainer}>
          <Text style={styles.exerciseNotesLabel}>{t('notes')}:</Text>
          <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
        </View>
      )}
      
      {/* Superset Rest Time */}
      {exercise.is_superset && exercise.superset_rest_time && (
        <View style={styles.supersetRestContainer}>
          <Text style={styles.supersetRestLabel}>{t('superset_rest')}:</Text>
          <Text style={styles.supersetRestValue}>
            {formatRestTime(exercise.superset_rest_time)}
          </Text>
        </View>
      )}

      {/* Exercise Menu Modal */}
      <ExerciseMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateSuperset={onCreateSuperset}
        onBreakSuperset={onBreakSuperset}
        exercise={exercise}
        colors={colors}
        t={t}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  exerciseCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  supersetCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  exerciseIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  exerciseTitleContainer: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  effortTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  effortTypeText: {
    fontSize: 10,
    marginLeft: 3,
    fontWeight: '600',
  },
  equipmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  equipmentText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  supersetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  supersetInfoText: {
    fontSize: 12,
    color: '#0ea5e9',
    marginLeft: 4,
  },
  menuButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  setsTable: {
    padding: 12,
  },
  setsTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  setColumnHeader: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderRadius: 4,
  },
  setCell: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  exerciseNotesContainer: {
    margin: 12,
    marginTop: 4,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  exerciseNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  exerciseNotesText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  supersetRestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    padding: 8,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
  },
  supersetRestLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  supersetRestValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    borderRadius: 12,
    minWidth: 250,
    maxWidth: 300,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
});