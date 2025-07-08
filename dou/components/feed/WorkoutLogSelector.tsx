// components/feed/WorkoutLogSelector.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList, 
  TextInput,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useUserLogs } from '../../hooks/query/useLogQuery';
import WorkoutLogCard from '../workouts/WorkoutLogCard';
import { useAuth } from '../../hooks/useAuth';

interface WorkoutLog {
  id: number;
  name: string;
  workout_name?: string;
  date: string;
  exercise_count?: number;
  exercises?: any[];
  duration?: number;
  location?: string;
  gym_name?: string;
  program_name?: string;
  completed: boolean;
}

interface WorkoutLogSelectorProps {
  onSelect: (workoutLog: WorkoutLog) => void;
  onCancel: () => void;
}

const WorkoutLogSelector: React.FC<WorkoutLogSelectorProps> = ({ 
  onSelect, 
  onCancel 
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  
  // Use React Query hook to fetch logs
  const { 
    data: logs = [], 
    isLoading: loading, 
    error 
  } = useUserLogs(user?.username);
  
  // Filter logs based on search query
  const filteredLogs = logs.filter(log =>
    (log.workout_name || log.name)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.gym_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleLogSelect = (log: WorkoutLog) => {
    setSelectedLogId(log.id);
  };
  
  const handleConfirm = () => {
    if (selectedLogId) {
      const selectedLog = logs.find(log => log.id === selectedLogId);
      if (selectedLog) {
        onSelect(selectedLog);
      }
    }
  };
  
  const renderWorkoutItem = ({ item }: { item: WorkoutLog }) => {
    const isSelected = selectedLogId === item.id;
    
    const toggleSelection = () => {
      if (isSelected) {
        // Deselect if already selected
        setSelectedLogId(null);
      } else {
        // Select this item
        handleLogSelect(item);
      }
    };
    
    return (
    <View style={[styles.cardWrapper, isSelected && styles.selectedCardWrapper]}>
      {/* Card component */}
      <WorkoutLogCard
        logId={item.id}
        log={item}
        user={user?.username}
        inFeedMode={true}
        onFork={undefined}
      />
      
      {/* Full-size clickable overlay - this is the key change */}
      <TouchableOpacity
        activeOpacity={0.2}
        onPress={toggleSelection}
        style={styles.fullSizeOverlay}
      >
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={40} color="#34D399" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};
  
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness-outline" size={48} color="#4B5563" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? t('no_matching_workouts') : t('no_workouts_logged')}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('select_workout_log')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#34D399" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_workouts')}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Workout List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loaderBackground}>
                <ActivityIndicator size="large" color="#34D399" />
              </View>
              <Text style={styles.loadingText}>{t('loading_workouts')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconBackground}>
                <Ionicons name="close" size={32} color="#EF4444" />
              </View>
              <Text style={styles.errorTitle}>{t('something_went_wrong')}</Text>
              <Text style={styles.errorMessage}>{error.message}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredLogs}
              renderItem={renderWorkoutItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={EmptyList}
            />
          )}
          
          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton,
                !selectedLogId && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!selectedLogId}
            >
              <Ionicons name="fitness" size={16} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>{t('share_workout')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 12,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  selectedCardWrapper: {
    borderWidth: 2,
    borderColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmark: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  selectIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#34D399',
    borderColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.5)',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  cancelButtonText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#34D399',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loaderBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderStyle: 'dashed',
  },
  errorIconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  fullSizeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10, // Higher than card content
    backgroundColor: 'transparent', // Transparent but captures touches
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(52, 211, 153, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WorkoutLogSelector;