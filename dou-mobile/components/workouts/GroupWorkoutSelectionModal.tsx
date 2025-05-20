// components/workouts/GroupWorkoutSelectionModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { BlurView } from 'expo-blur';

interface GroupWorkoutSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupWorkoutSelected: (groupWorkout: any) => void;
  groupWorkouts: any[];
  groupWorkoutsLoading: boolean;
  user: any;
  themePalette: any;
}

const GroupWorkoutSelectionModal: React.FC<GroupWorkoutSelectionModalProps> = ({
  visible,
  onClose,
  onGroupWorkoutSelected,
  groupWorkouts,
  groupWorkoutsLoading,
  user,
  themePalette
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter group workouts based on search query
  const filteredWorkouts = groupWorkouts.filter(workout => {
    const title = workout.title?.toLowerCase() || '';
    const description = workout.description?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return title.includes(query) || description.includes(query);
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render a group workout item
  const renderWorkoutItem = ({ item }) => {
    // For empty state or when there are no results
    if (item.empty) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: themePalette.text_secondary }]}>
            {item.message}
          </Text>
        </View>
      );
    }
    
    // For actual group workout
    return (
      <TouchableOpacity 
        style={[styles.workoutItem, { backgroundColor: themePalette.card_background }]}
        onPress={() => onGroupWorkoutSelected(item)}
      >
        <View style={styles.workoutInfo}>
          <Text style={[styles.workoutTitle, { color: themePalette.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View style={styles.workoutDetailsRow}>
            <Ionicons name="calendar-outline" size={14} color={themePalette.text_secondary} />
            <Text style={[styles.workoutDetailText, { color: themePalette.text_secondary }]}>
              {formatDate(item.scheduled_time)}
            </Text>
          </View>
          
          <View style={styles.workoutDetailsRow}>
            <Ionicons name="people-outline" size={14} color={themePalette.text_secondary} />
            <Text style={[styles.workoutDetailText, { color: themePalette.text_secondary }]}>
              {item.participants_count}/{item.max_participants > 0 ? item.max_participants : '∞'} {t('participants')}
            </Text>
          </View>
          
          {item.gym_details && (
            <View style={styles.workoutDetailsRow}>
              <Ionicons name="location-outline" size={14} color={themePalette.text_secondary} />
              <Text style={[styles.workoutDetailText, { color: themePalette.text_secondary }]} numberOfLines={1}>
                {item.gym_details.name}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status).bg }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(item.status).text }
            ]}>
              {t(item.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981' }; // Green
      case 'in_progress':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6' }; // Blue
      case 'completed':
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6B7280' }; // Gray
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444' }; // Red
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6B7280' }; // Default gray
    }
  };
  
  // Data for the list
  const getListData = () => {
    if (groupWorkoutsLoading) {
      return [{ id: 'loading', empty: true, message: t('loading_group_workouts') }];
    }
    
    if (filteredWorkouts.length === 0) {
      if (searchQuery) {
        return [{ id: 'no-results', empty: true, message: t('no_group_workouts_found') }];
      } else {
        return [{ id: 'empty', empty: true, message: t('no_group_workouts_yet') }];
      }
    }
    
    return filteredWorkouts;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView style={styles.blurView} intensity={30} tint="dark" />
        
        <View style={[styles.modalContainer, { backgroundColor: themePalette.page_background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: themePalette.border }]}>
            <Text style={[styles.modalTitle, { color: themePalette.text }]}>
              {t('select_group_workout')}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={themePalette.text} />
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: themePalette.card_background }]}>
            <Ionicons name="search" size={20} color={themePalette.text_secondary} />
            <TextInput
              style={[styles.searchInput, { color: themePalette.text }]}
              placeholder={t('search_group_workouts')}
              placeholderTextColor={themePalette.text_secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={themePalette.text_secondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Group Workouts List */}
          {groupWorkoutsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={[styles.loadingText, { color: themePalette.text_secondary }]}>
                {t('loading_group_workouts')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={getListData()}
              renderItem={renderWorkoutItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: themePalette.text_secondary }]}>
                    {searchQuery 
                      ? t('no_group_workouts_found') 
                      : t('no_group_workouts_yet')}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  workoutItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  workoutDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutDetailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  statusContainer: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default GroupWorkoutSelectionModal;