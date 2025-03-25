// components/feed/WorkoutLogSelector.tsx
import React, { useState, useEffect } from 'react';
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

// This would normally be fetched from API
const mockWorkoutLogs = [
  {
    id: 1,
    workout_name: 'Upper Body Workout',
    date: '2025-03-20',
    exercise_count: 6,
    duration: 45,
    location: 'Home Gym',
    gym_name: 'Home Gym',
    program_name: 'Summer Strength'
  },
  {
    id: 2,
    workout_name: 'Leg Day',
    date: '2025-03-18',
    exercise_count: 5,
    duration: 60,
    location: 'Fitness Club',
    gym_name: 'Fitness Club'
  },
  {
    id: 3,
    workout_name: 'Full Body Workout',
    date: '2025-03-15',
    exercise_count: 8,
    duration: 75,
    location: 'City Gym',
    gym_name: 'City Gym',
    program_name: 'Full Body Program'
  }
];

interface WorkoutLogSelectorProps {
  onSelect: (workoutLog: any) => void;
  onCancel: () => void;
}

const WorkoutLogSelector: React.FC<WorkoutLogSelectorProps> = ({ 
  onSelect, 
  onCancel 
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Simulate API fetch
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        setLogs(mockWorkoutLogs);
        setLoading(false);
      }, 1000);
    };
    
    fetchLogs();
  }, []);
  
  // Filter logs based on search query
  const filteredLogs = logs.filter(log =>
    log.workout_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleLogSelect = (log: any) => {
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
  
  const renderWorkoutItem = ({ item }: { item: any }) => {
    const isSelected = selectedLogId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.workoutItem,
          isSelected && styles.workoutItemSelected
        ]}
        onPress={() => handleLogSelect(item)}
      >
        <View style={styles.workoutHeader}>
          <View style={[styles.workoutIcon, isSelected && styles.workoutIconSelected]}>
            <Ionicons 
              name="fitness" 
              size={16} 
              color={isSelected ? "#FFFFFF" : "#34D399"} 
            />
          </View>
          
          <View style={styles.workoutTitleContainer}>
            <Text style={styles.workoutTitle} numberOfLines={1}>
              {item.workout_name}
            </Text>
            
            {item.program_name && (
              <View style={styles.programBadge}>
                <Text style={styles.programText}>
                  {item.program_name}
                </Text>
              </View>
            )}
          </View>
          
          {isSelected && (
            <View style={styles.selectedCheckmark}>
              <Ionicons name="checkmark-circle" size={20} color="#34D399" />
            </View>
          )}
        </View>
        
        <View style={styles.workoutDetails}>
          <View style={styles.workoutDetail}>
            <Ionicons name="calendar-outline" size={14} color="#34D399" />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          
          <View style={styles.workoutDetail}>
            <Ionicons name="time-outline" size={14} color="#34D399" />
            <Text style={styles.detailText}>{item.duration} {t('mins')}</Text>
          </View>
          
          <View style={styles.workoutDetail}>
            <Ionicons name="location-outline" size={14} color="#34D399" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        </View>
        
        <View style={styles.workoutStats}>
          <View style={styles.workoutStat}>
            <Text style={styles.statLabel}>{t('exercises')}</Text>
            <Text style={styles.statValue}>{item.exercise_count}</Text>
          </View>
          
          <View style={styles.workoutStat}>
            <Text style={styles.statLabel}>{t('duration')}</Text>
            <Text style={styles.statValue}>{item.duration} {t('mins')}</Text>
          </View>
          
          <View style={styles.workoutStat}>
            <Text style={styles.statLabel}>{t('location')}</Text>
            <Text style={styles.statValue} numberOfLines={1}>{item.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness-outline" size={48} color="#4B5563" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? t('no_matching_workouts') : t('no_workouts_logged')}
      </Text>
      <Text style={styles.emptyMessage}>
        {searchQuery ? t('adjust_workout_search') : t('workouts_will_appear')}
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
              <ActivityIndicator size="large" color="#34D399" />
              <Text style={styles.loadingText}>{t('loading_workouts')}</Text>
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
  workoutItem: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  workoutItemSelected: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutIconSelected: {
    backgroundColor: '#34D399',
  },
  workoutTitleContainer: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  programBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  programText: {
    fontSize: 10,
    color: '#A78BFA',
  },
  selectedCheckmark: {
    marginLeft: 12,
  },
  workoutDetails: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  workoutStats: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  workoutStat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
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
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
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
});

export default WorkoutLogSelector;