// components/workouts/ExerciseSelector.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { EXERCISE_CATEGORIES, getAllExercises, searchExercises } from './data/exerciseData';

type ExerciseSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseName: string) => void;
};

const ExerciseSelector = ({ visible, onClose, onSelectExercise }: ExerciseSelectorProps) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter exercises based on search term
  const filteredExercises = searchTerm.length > 0
    ? searchExercises(searchTerm)
    : selectedCategory 
      ? EXERCISE_CATEGORIES.find(cat => cat.id === selectedCategory)?.exercises || []
      : getAllExercises();
      
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('select_exercise')}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={t('search_exercises')}
              placeholderTextColor="#9CA3AF"
              selectionColor="#0ea5e9"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchTerm('')}
              >
                <Ionicons name="close" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            contentContainerStyle={styles.categoryTabsContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryTab,
                selectedCategory === null && styles.categoryTabSelected
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === null && styles.categoryTabTextSelected
              ]}>
                {t('all')}
              </Text>
            </TouchableOpacity>
            
            {EXERCISE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === category.id && styles.categoryTabSelected
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === category.id && styles.categoryTabTextSelected
                ]}>
                  {t(category.displayName.toLowerCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Exercises list */}
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.exerciseListModal}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseItemModal}
                onPress={() => onSelectExercise(item.name)}
              >
                <Text style={styles.exerciseItemText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>
                  {searchTerm.length > 0 
                    ? t('no_matching_exercises') 
                    : t('no_exercises_in_category')}
                </Text>
                
                {/* Custom exercise button */}
                <TouchableOpacity
                  style={styles.customExerciseButton}
                  onPress={() => {
                    if (searchTerm.length > 0) {
                      onSelectExercise(searchTerm);
                    } else {
                      Alert.alert(t('enter_exercise_name'), t('enter_custom_exercise_name'));
                    }
                  }}
                >
                  <Ionicons name="add" size={16} color="#0ea5e9" />
                  <Text style={styles.customExerciseText}>
                    {searchTerm.length > 0 
                      ? t('add_custom_exercise_with_name', { name: searchTerm }) 
                      : t('add_custom_exercise')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearSearchButton: {
    padding: 4,
  },
  categoryTabs: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    marginRight: 8,
  },
  categoryTabSelected: {
    backgroundColor: '#0ea5e9',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  categoryTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  exerciseListModal: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  exerciseItemModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptySearch: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  customExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  customExerciseText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 8,
  },
});

export default ExerciseSelector;