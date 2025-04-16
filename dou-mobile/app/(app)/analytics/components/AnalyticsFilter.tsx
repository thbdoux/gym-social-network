// components/AnalyticsFilter.tsx
import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';

// Compact filter component with horizontal layout
export const AnalyticsFilter = memo(() => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const [showExercisesModal, setShowExercisesModal] = useState(false);
  
  const {
    muscleGroups,
    exercises,
    selectedMuscleGroup,
    selectedExercise,
    setSelectedMuscleGroup,
    setSelectedExercise,
    resetFilters
  } = useAnalytics();
  
  // Get the name of selected exercise for display
  const selectedExerciseName = exercises.find(ex => ex.value === selectedExercise)?.label || selectedExercise;
  
  return (
    <View style={[styles.container, { backgroundColor: palette.page_background }]}>
      <View style={styles.filtersRow}>
        {/* Muscle Group Dropdown */}
        <View style={styles.filterColumn}>
          <TouchableOpacity 
            style={[styles.dropdown, { borderColor: palette.border }]}
            onPress={() => setShowExercisesModal(true)}
          >
            <Text style={[styles.dropdownLabel, { color: palette.text + '80' }]} numberOfLines={1}>
              {selectedMuscleGroup || t('all_muscles')}
            </Text>
            <Feather name="chevron-down" size={16} color={palette.text + '80'} />
          </TouchableOpacity>
        </View>
        
        {/* Exercise Dropdown */}
        <View style={styles.filterColumn}>
          <TouchableOpacity 
            style={[styles.dropdown, { borderColor: palette.border }]}
            onPress={() => setShowExercisesModal(true)}
          >
            <Text style={[styles.dropdownLabel, { color: palette.text + '80' }]} numberOfLines={1}>
              {selectedExercise ? selectedExerciseName : t('all_exercises')}
            </Text>
            <Feather name="chevron-down" size={16} color={palette.text + '80'} />
          </TouchableOpacity>
        </View>
        
        {/* Reset Button */}
        <TouchableOpacity 
          style={[styles.resetButton, { borderColor: palette.highlight + '40' }]} 
          onPress={resetFilters}
        >
          <Feather name="refresh-cw" size={16} color={palette.highlight} />
        </TouchableOpacity>
      </View>
      
      {/* Exercises Modal */}
      <Modal
        visible={showExercisesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExercisesModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: palette.page_background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                {t('select_filters')}
              </Text>
              <TouchableOpacity onPress={() => setShowExercisesModal(false)}>
                <Feather name="x" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>
            
            {/* Muscle Group Selection */}
            <Text style={[styles.sectionTitle, { color: palette.text + '80' }]}>
              {t('muscle_group')}
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  { borderColor: palette.border },
                  selectedMuscleGroup === undefined && { backgroundColor: palette.highlight, borderColor: palette.highlight }
                ]}
                onPress={() => {
                  setSelectedMuscleGroup(undefined);
                  setSelectedExercise(undefined);
                }}
              >
                <Text style={[
                  styles.chipText, 
                  { color: palette.text },
                  selectedMuscleGroup === undefined && { color: '#FFFFFF' }
                ]}>
                  {t('all')}
                </Text>
              </TouchableOpacity>
              
              {muscleGroups.map((group) => (
                <TouchableOpacity
                  key={group.value}
                  style={[
                    styles.chip,
                    { borderColor: palette.border },
                    selectedMuscleGroup === group.value && { backgroundColor: palette.highlight, borderColor: palette.highlight }
                  ]}
                  onPress={() => {
                    setSelectedMuscleGroup(group.value);
                    setSelectedExercise(undefined);
                  }}
                >
                  <Text style={[
                    styles.chipText, 
                    { color: palette.text },
                    selectedMuscleGroup === group.value && { color: '#FFFFFF' }
                  ]}>
                    {group.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Exercise Selection */}
            <Text style={[styles.sectionTitle, { color: palette.text + '80', marginTop: 16 }]}>
              {t('exercise')}
            </Text>
            
            <ScrollView style={styles.exerciseList}>
              <TouchableOpacity
                style={[
                  styles.exerciseItem, 
                  selectedExercise === undefined && { backgroundColor: palette.highlight + '15' }
                ]}
                onPress={() => {
                  setSelectedExercise(undefined);
                }}
              >
                <Text style={[styles.exerciseItemText, { color: palette.text }]}>
                  {t('all_exercises')}
                </Text>
                {selectedExercise === undefined && (
                  <Feather name="check" size={18} color={palette.highlight} />
                )}
              </TouchableOpacity>
              
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.value}
                  style={[
                    styles.exerciseItem, 
                    selectedExercise === exercise.value && { backgroundColor: palette.highlight + '15' }
                  ]}
                  onPress={() => {
                    setSelectedExercise(exercise.value);
                  }}
                >
                  <View style={styles.exerciseItemContent}>
                    <Text style={[styles.exerciseItemText, { color: palette.text }]}>
                      {exercise.label}
                    </Text>
                    {exercise.muscleGroup && (
                      <Text style={[styles.exerciseItemSubText, { color: palette.text + '60' }]}>
                        {exercise.muscleGroup}
                      </Text>
                    )}
                  </View>
                  {selectedExercise === exercise.value && (
                    <Feather name="check" size={18} color={palette.highlight} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.applyButton, { backgroundColor: palette.highlight }]}
                onPress={() => setShowExercisesModal(false)}
              >
                <Text style={styles.applyButtonText}>{t('apply_filters')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterColumn: {
    flex: 1,
    marginRight: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownLabel: {
    fontSize: 13,
    flex: 1,
  },
  resetButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  chipContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
  },
  exerciseList: {
    paddingHorizontal: 16,
    maxHeight: 300,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  exerciseItemContent: {
    flex: 1,
  },
  exerciseItemText: {
    fontSize: 14,
  },
  exerciseItemSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  applyButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});