// components/feed/GroupWorkoutSelector.tsx
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
import { useGroupWorkouts } from '../../hooks/query/useGroupWorkoutQuery';
import GroupWorkoutCard from '../workouts/GroupWorkoutCard';
import { useAuth } from '../../hooks/useAuth';

interface GroupWorkout {
  id: number;
  title: string;
  description?: string;
  creator_details: {
    id: number;
    username: string;
    avatar?: string;
  };
  scheduled_time: string;
  privacy: 'public' | 'upon-request' | 'private';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants_count: number;
  max_participants: number;
  is_creator: boolean;
  current_user_status: string;
  is_full: boolean;
  is_active: boolean;
}

interface GroupWorkoutSelectorProps {
  onSelect: (groupWorkout: GroupWorkout) => void;
  onCancel: () => void;
}

const GroupWorkoutSelector: React.FC<GroupWorkoutSelectorProps> = ({ 
  onSelect, 
  onCancel 
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  
  // Use React Query hook to fetch group workouts
  // Filter to only get active, non-canceled workouts (scheduled or in_progress)
  const { 
    data: groupWorkouts = [], 
    isLoading: loading, 
    error 
  } = useGroupWorkouts();
  console.log(groupWorkouts);
  // Filter group workouts based on search query
  const filteredWorkouts = groupWorkouts.filter(workout =>
    workout.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.scheduled_time?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  
  const handleWorkoutSelect = (workout: GroupWorkout) => {
    setSelectedWorkoutId(workout.id);
  };
  
  const handleConfirm = () => {
    if (selectedWorkoutId) {
      const selectedWorkout = groupWorkouts.find(workout => workout.id === selectedWorkoutId);
      if (selectedWorkout) {
        onSelect(selectedWorkout);
      }
    }
  };
  
  const renderWorkoutItem = ({ item }: { item: GroupWorkout }) => {
    const isSelected = selectedWorkoutId === item.id;
    
    const toggleSelection = () => {
      if (isSelected) {
        // Deselect if already selected
        setSelectedWorkoutId(null);
      } else {
        // Select this item
        handleWorkoutSelect(item);
      }
    };
    
    return (
      <View style={[styles.cardWrapper, isSelected && styles.selectedCardWrapper]}>
        <GroupWorkoutCard
          groupWorkoutId={item.id}
          groupWorkout={item}
          selectionMode={false}
        />
        
        {/* Full-size clickable overlay */}
        <TouchableOpacity
          activeOpacity={0.2}
          onPress={toggleSelection}
          style={styles.fullSizeOverlay}
        >
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={40} color="#FB923C" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color="#4B5563" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? t('no_matching_group_workouts') : t('no_group_workouts')}
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
            <Text style={styles.headerTitle}>{t('select_group_workout')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#FB923C" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_group_workouts')}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Group Workout List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loaderBackground}>
                <ActivityIndicator size="large" color="#FB923C" />
              </View>
              <Text style={styles.loadingText}>{t('loading_group_workouts')}</Text>
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
              data={filteredWorkouts}
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
                !selectedWorkoutId && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!selectedWorkoutId}
            >
              <Ionicons name="people" size={16} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>{t('share_group_workout')}</Text>
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
    borderColor: '#FB923C',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fullSizeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(251, 146, 60, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(251, 146, 60, 0.2)',
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
    backgroundColor: '#FB923C',
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
});

export default GroupWorkoutSelector;