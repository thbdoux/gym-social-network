// components/workouts/ProgramSelectionModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import WorkoutCard from './WorkoutCard';

interface ProgramSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutSelected: (workout: any) => void;
  activeProgram: any;
  programsLoading: boolean;
  user: any;
}

const ProgramSelectionModal: React.FC<ProgramSelectionModalProps> = ({
  visible,
  onClose,
  onWorkoutSelected,
  activeProgram,
  programsLoading,
  user
}) => {
  const { t } = useLanguage();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, styles.selectionModalContainer]}>
          <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
          
          <LinearGradient
            colors={['#16a34a', '#22c55e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeaderGradient}
          >
            <Text style={styles.modalTitle}>{t('select_program_workout')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={styles.selectionModalContent}>
            {programsLoading ? (
              <ActivityIndicator size="large" color="#16a34a" />
            ) : activeProgram?.workouts?.length ? (
              <FlatList
                data={activeProgram.workouts}
                keyExtractor={(item) => `program-workout-${item.id}`}
                renderItem={({ item }) => (
                  <View style={styles.selectionItem}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.selectionCardWrapper}
                      onPress={() => onWorkoutSelected(item)}
                    >
                      <View style={styles.selectionOverlay}>
                        <Text style={styles.selectionText}>{t('select')}</Text>
                      </View>
                      <WorkoutCard
                        workoutId={item.id}
                        workout={{
                          ...item,
                          program: activeProgram.id,
                          program_name: activeProgram.name
                        }}
                        isTemplate={false}
                        user={user?.username}
                        selectionMode={false}
                        pointerEvents="none"
                      />
                    </TouchableOpacity>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.selectionList}
              />
            ) : (
              <View style={styles.emptySelectionState}>
                <Ionicons name="barbell-outline" size={40} color="#4B5563" />
                <Text style={styles.emptyStateTitle}>
                  {t('no_program_workouts')}
                </Text>
                <Text style={styles.emptyStateText}>
                  {t('add_workouts_to_program')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  selectionModalContainer: {
    maxHeight: '80%',
  },
  modalBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  selectionModalContent: {
    padding: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    maxHeight: '100%',
  },
  selectionList: {
    paddingBottom: 16,
  },
  selectionItem: {
    marginBottom: 12,
  },
  selectionCardWrapper: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptySelectionState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ProgramSelectionModal;