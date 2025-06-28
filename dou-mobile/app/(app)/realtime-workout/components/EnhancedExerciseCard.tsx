// components/EnhancedExerciseCard.tsx - Exercise card with equipment selection and superset support
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Pressable,
  ScrollView,
  Alert,
  Modal
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

interface EnhancedExerciseCardProps {
  exercise: any;
  exerciseIndex: number;
  onCompleteSet: (exerciseIndex: number, setIndex: number, setData: any) => Promise<void>;
  onUncompleteSet: (exerciseIndex: number, setIndex: number) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, setData: any) => void;
  onUpdateExercise: (exerciseIndex: number, exerciseData: any) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  themePalette: any;
  // Superset props
  supersetLabel?: string;
  isInSuperset?: boolean;
  onRemoveFromSuperset?: (exerciseIndex: number) => void;
  onAddToSuperset?: (exerciseIndex: number) => void;
  availableSupersets?: Array<{ id: string; label: string; exercises: any[] }>;
}

// Equipment Selector Modal
const EquipmentModal = ({ visible, onClose, currentEquipment, onSelect, theme }) => {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('select_equipment')}</Text>
          
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
                <Ionicons 
                  name={equipment.iconName} 
                  size={24} 
                  color={currentEquipment === equipment.id ? theme.accent : theme.text_secondary} 
                />
                <View style={styles.equipmentInfo}>
                  <Text style={[styles.equipmentName, { color: theme.text }]}>
                    {t(equipment.nameKey)}
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

// Superset Actions Modal
const SupersetModal = ({ visible, onClose, onRemoveFromSuperset, onAddToSuperset, availableSupersets, theme }) => {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('superset_actions')}</Text>
          
          {onRemoveFromSuperset && (
            <TouchableOpacity
              style={[styles.supersetAction, { borderColor: theme.border }]}
              onPress={() => {
                onRemoveFromSuperset();
                onClose();
              }}
            >
              <Ionicons name="remove-circle-outline" size={24} color={theme.error} />
              <Text style={[styles.supersetActionText, { color: theme.error }]}>
                {t('remove_from_superset')}
              </Text>
            </TouchableOpacity>
          )}
          
          {availableSupersets && availableSupersets.length > 0 && (
            <>
              <Text style={[styles.supersetSectionTitle, { color: theme.text }]}>
                {t('add_to_existing_superset')}
              </Text>
              {availableSupersets.map(superset => (
                <TouchableOpacity
                  key={superset.id}
                  style={[styles.supersetAction, { borderColor: theme.border }]}
                  onPress={() => {
                    onAddToSuperset?.(superset.id);
                    onClose();
                  }}
                >
                  <View style={[styles.supersetBadge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.supersetBadgeText}>{superset.label}</Text>
                  </View>
                  <View style={styles.supersetInfo}>
                    <Text style={[styles.supersetActionText, { color: theme.text }]}>
                      {t('superset')} {superset.label}
                    </Text>
                    <Text style={[styles.supersetExercises, { color: theme.text_secondary }]}>
                      {superset.exercises.map(ex => ex.name).join(', ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
          
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

// Main component
const EnhancedExerciseCard: React.FC<EnhancedExerciseCardProps> = ({
  exercise,
  exerciseIndex,
  onCompleteSet,
  onUncompleteSet,
  onUpdateSet,
  onUpdateExercise,
  onAddSet,
  onRemoveSet,
  themePalette,
  supersetLabel,
  isInSuperset = false,
  onRemoveFromSuperset,
  onAddToSuperset,
  availableSupersets = []
}) => {
  const { t } = useLanguage();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSet, setEditingSet] = useState<{index: number, field: string} | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [supersetModalVisible, setSupersetModalVisible] = useState(false);
  const [nameEditModalVisible, setNameEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState(exercise.name || '');
  
  const modalAnimation = useRef(new Animated.Value(0)).current;

  const effortType = exercise.effort_type || 'reps';
  const weightUnit = exercise.sets.length > 0 ? (exercise.sets[0].weight_unit || 'kg') : 'kg';
  const currentEquipment = exercise.equipment || 'other';

  // Handle equipment change
  const handleEquipmentChange = (equipmentId: string) => {
    onUpdateExercise(exerciseIndex, { ...exercise, equipment: equipmentId });
  };

  // Get equipment display name
  const getEquipmentDisplayName = (equipmentId: string) => {
    const equipment = EQUIPMENT_OPTIONS.find(eq => eq.id === equipmentId);
    return equipment ? t(equipment.nameKey) : t('equipment_other');
  };

  // Calculate completed sets
  const completedSets = exercise.sets.filter(set => set.completed).length;
  const totalSets = exercise.sets.length;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: themePalette.card_background,
        borderLeftWidth: isInSuperset ? 4 : 0,
        borderLeftColor: isInSuperset ? themePalette.accent : 'transparent'
      }
    ]}>
      {/* Superset Header */}
      {isInSuperset && supersetLabel && (
        <View style={[styles.supersetHeader, { backgroundColor: `${themePalette.accent}15` }]}>
          <View style={styles.supersetInfo}>
            <View style={[styles.supersetBadge, { backgroundColor: themePalette.accent }]}>
              <Text style={styles.supersetBadgeText}>{supersetLabel}</Text>
            </View>
            <Text style={[styles.supersetText, { color: themePalette.accent }]}>
              {t('superset')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.supersetButton}
            onPress={() => setSupersetModalVisible(true)}
          >
            <Ionicons name="options-outline" size={16} color={themePalette.accent} />
          </TouchableOpacity>
        </View>
      )}

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
            
            {/* Enhanced Controls Row */}
            <View style={styles.controlsRow}>
              {/* Effort Type Control */}
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: `${themePalette.accent}20` }]}
                onPress={() => {/* effort type modal */}}
              >
                <Text style={[styles.controlButtonText, { color: themePalette.accent }]}>
                  {t(effortType)}
                </Text>
                <Ionicons name="chevron-down" size={12} color={themePalette.accent} />
              </TouchableOpacity>

              {/* Weight Unit Control */}
              {(effortType === 'reps' || effortType === 'time') && (
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: `${themePalette.info}20` }]}
                  onPress={() => {/* weight unit modal */}}
                >
                  <Text style={[styles.controlButtonText, { color: themePalette.info }]}>
                    {weightUnit}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={themePalette.info} />
                </TouchableOpacity>
              )}

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

              {/* Superset Control */}
              {!isInSuperset && (
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: `${themePalette.warning}20` }]}
                  onPress={() => setSupersetModalVisible(true)}
                >
                  <Ionicons name="link-outline" size={12} color={themePalette.warning} />
                  <Text style={[styles.controlButtonText, { color: themePalette.warning }]}>
                    {t('superset')}
                  </Text>
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
      
      {/* Sets Table - keeping existing implementation */}
      <ScrollView style={styles.setsContainer}>
        {exercise.sets.map((set, index) => (
          <View key={`set-${set.id || index}`} style={styles.setRow}>
            {/* Set implementation from original component */}
          </View>
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

      {/* Superset Modal */}
      <SupersetModal
        visible={supersetModalVisible}
        onClose={() => setSupersetModalVisible(false)}
        onRemoveFromSuperset={isInSuperset ? () => onRemoveFromSuperset?.(exerciseIndex) : undefined}
        onAddToSuperset={!isInSuperset ? (supersetId) => onAddToSuperset?.(exerciseIndex) : undefined}
        availableSupersets={!isInSuperset ? availableSupersets : []}
        theme={themePalette}
      />

      {/* Other existing modals... */}
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
  supersetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  supersetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supersetBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  supersetBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  supersetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  supersetButton: {
    padding: 4,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  controlButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 2,
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
  setRow: {
    // Existing set row styles
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
  supersetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  supersetActionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  supersetSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  supersetExercises: {
    fontSize: 12,
    marginTop: 2,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedExerciseCard;