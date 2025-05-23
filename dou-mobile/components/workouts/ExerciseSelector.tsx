// components/workouts/ExerciseSelector.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Alert,
  Animated,
  Pressable,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { 
  EXERCISE_CATEGORIES, 
  EQUIPMENT_TYPES,
  DIFFICULTY_LEVELS,
  filterExercises,
  getExerciseName,
  getEquipmentName,
  getTargetMuscleName,
  toggleFavorite,
  FilterCriteria,
  getAllExercises,
  searchExercises
} from './data/exerciseData';

type ExerciseSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseName: string) => void;
  recentExercises?: string[]; // Array of recently used exercise IDs
};

const ExerciseSelector = ({ 
  visible, 
  onClose, 
  onSelectExercise, 
  recentExercises = []
}: ExerciseSelectorProps) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Category selection
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<('beginner' | 'intermediate' | 'advanced')[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Handle exercise selection
  const handleSelectExercise = useCallback((exercise: any) => {
    onSelectExercise(exercise.name || exercise);
    onClose();
  }, [onSelectExercise, onClose]);
  
  // Toggle favorites
  const handleToggleFavorite = useCallback((exerciseId: string) => {
    toggleFavorite(exerciseId);
    // Force re-render
    setSelectedCategories([...selectedCategories]);
  }, [selectedCategories]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedEquipment([]);
    setSelectedDifficulty([]);
    setShowFavoritesOnly(false);
    setSearchTerm('');
    setSelectedCategory(null);
  }, []);
  
  // Handle adding a custom exercise
  const handleCreateCustomExercise = useCallback(() => {
    if (!searchTerm.trim()) {
      Alert.alert(t('error'), t('exercise_name_required'));
      return;
    }
    
    onSelectExercise(searchTerm.trim());
    onClose();
  }, [searchTerm, t, onSelectExercise, onClose]);
  
  // Toggle category selection
  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
    
    // Also update the filter categories
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    } else {
      // If we're clicking on a new category from the tabs, replace the selection
      // instead of adding to it
      setSelectedCategories([categoryId]);
    }
  }, [selectedCategories]);

  // Toggle category in the filter modal
  const toggleFilterCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);
  
  // Toggle equipment selection
  const toggleEquipment = useCallback((equipmentId: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  }, []);
  
  // Toggle difficulty selection
  const toggleDifficulty = useCallback((difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    setSelectedDifficulty(prev => 
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  }, []);
  
  // Filtered exercises based on all criteria
  const filteredExercises = useMemo(() => {
    let results = [];
    
    // If we're searching
    if (searchTerm.length > 0) {
      results = searchExercises(searchTerm, language);
    } 
    // If we have a selected category from the tabs
    else if (selectedCategory) {
      results = EXERCISE_CATEGORIES.find(cat => cat.id === selectedCategory)?.exercises || [];
    } 
    // Otherwise show all or filtered
    else {
      // Apply additional filters if they exist
      if (selectedCategories.length > 0 || selectedEquipment.length > 0 || 
          selectedDifficulty.length > 0 || showFavoritesOnly) {
            
        const criteria: FilterCriteria = {
          categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
          equipmentIds: selectedEquipment.length > 0 ? selectedEquipment : undefined,
          difficultyLevels: selectedDifficulty.length > 0 ? selectedDifficulty : undefined,
          favorites: showFavoritesOnly,
          language
        };
        
        results = filterExercises(criteria);
      } else {
        // If no filters, show all exercises
        results = getAllExercises();
      }
    }
    
    // Map the results to include display names and additional info
    const mappedResults = results.map(exercise => {
      // Find the category for this exercise
      const category = EXERCISE_CATEGORIES.find(cat => 
        cat.exercises.some(ex => ex.id === exercise.id)
      );
      
      return {
        id: exercise.id,
        name: getExerciseName(exercise, language),
        nameKey: exercise.nameKey,
        equipment: getEquipmentName(exercise, language),
        equipmentKey: exercise.equipmentKey,
        muscle_group: getTargetMuscleName(exercise, language),
        targetMuscleKey: exercise.targetMuscleKey,
        difficulty: exercise.difficulty,
        favorite: exercise.favorite || false,
        category: category?.id || '',
        categoryName: category ? t(category.displayNameKey) : '',
        iconName: category?.iconName || 'fitness-outline',
      };
    });
    
    // Sort: favorites first, then recent, then alphabetical
    const sorted = mappedResults.sort((a, b) => {
      // Favorites first
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      
      // Recently used second
      const aIsRecent = recentExercises.includes(a.id);
      const bIsRecent = recentExercises.includes(b.id);
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;
      if (aIsRecent && bIsRecent) {
        // Sort by recency order
        return recentExercises.indexOf(a.id) - recentExercises.indexOf(b.id);
      }
      
      // Alphabetically by name
      return a.name.localeCompare(b.name);
    });
    
    return sorted;
  }, [
    searchTerm, 
    selectedCategory,
    selectedCategories, 
    selectedEquipment, 
    selectedDifficulty, 
    showFavoritesOnly,
    language,
    t,
    recentExercises
  ]);
  
  // Update loading state when filters change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [
    searchTerm, 
    selectedCategory,
    selectedCategories, 
    selectedEquipment, 
    selectedDifficulty, 
    showFavoritesOnly,
    language
  ]);
  
  // Display difficulty badge with color
  const renderDifficultyBadge = (difficulty?: 'beginner' | 'intermediate' | 'advanced') => {
    if (!difficulty) return null;
    
    const difficultyInfo = DIFFICULTY_LEVELS.find(d => d.id === difficulty);
    if (!difficultyInfo) return null;
    
    return (
      <View style={[
        styles.exerciseTag, 
        { backgroundColor: `${difficultyInfo.color}30` }
      ]}>
        <Text style={[styles.exerciseTagText, { color: difficultyInfo.color }]}>
          {t(difficultyInfo.nameKey)}
        </Text>
      </View>
    );
  };
  
  // List empty component
  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <Ionicons name="barbell-outline" size={48} color="#6B7280" />
      <Text style={styles.emptyStateText}>
        {searchTerm.length > 0 
          ? t('no_matching_exercises') 
          : t('no_exercises_in_category')}
      </Text>
      {searchTerm.length > 0 && (
        <TouchableOpacity
          style={styles.customExerciseButton}
          onPress={handleCreateCustomExercise}
        >
          <Ionicons name="add" size={16} color="#0ea5e9" />
          <Text style={styles.customExerciseText}>
            {t('add_custom_exercise_with_name', { name: searchTerm })}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Render active filters badges
  const renderActiveFilters = () => {
    const totalFilters = selectedCategories.length + 
                         selectedEquipment.length + 
                         selectedDifficulty.length + 
                         (showFavoritesOnly ? 1 : 0);
                         
    if (totalFilters === 0) return null;
    
    return (
      <View style={styles.activeFiltersContainer}>
        <Text style={styles.activeFiltersText}>
          {t('active_filters', { count: totalFilters })}
        </Text>
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={resetFilters}
        >
          <Text style={styles.clearFiltersText}>{t('clear_all')}</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Filter modal component
  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.filterModalContainer}>
        <View style={styles.filterModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('filters')}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterScroll}>
            {/* Categories section */}
            <Text style={styles.filterSectionTitle}>
              {t('categories')}
            </Text>
            <View style={styles.filterChipContainer}>
              {EXERCISE_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={`filter-category-${category.id}`}
                  style={[
                    styles.filterChip,
                    selectedCategories.includes(category.id)
                      ? { backgroundColor: '#0ea5e9' }
                      : { backgroundColor: '#1F2937', borderColor: 'rgba(255, 255, 255, 0.1)' }
                  ]}
                  onPress={() => toggleFilterCategory(category.id)}
                >
                  <Ionicons 
                    name={category.iconName || 'fitness-outline'} 
                    size={16} 
                    color={selectedCategories.includes(category.id) ? '#FFFFFF' : '#9CA3AF'} 
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategories.includes(category.id)
                        ? { color: '#FFFFFF' }
                        : { color: '#9CA3AF' }
                    ]}
                  >
                    {t(category.displayNameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Equipment section */}
            <Text style={styles.filterSectionTitle}>
              {t('equipment')}
            </Text>
            <View style={styles.filterChipContainer}>
              {EQUIPMENT_TYPES.map(equipment => (
                <TouchableOpacity
                  key={`filter-equipment-${equipment.id}`}
                  style={[
                    styles.filterChip,
                    selectedEquipment.includes(equipment.id)
                      ? { backgroundColor: '#8B5CF6' }
                      : { backgroundColor: '#1F2937', borderColor: 'rgba(255, 255, 255, 0.1)' }
                  ]}
                  onPress={() => toggleEquipment(equipment.id)}
                >
                  <Ionicons 
                    name={equipment.iconName || 'fitness-outline'} 
                    size={16} 
                    color={selectedEquipment.includes(equipment.id) ? '#FFFFFF' : '#9CA3AF'} 
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedEquipment.includes(equipment.id)
                        ? { color: '#FFFFFF' }
                        : { color: '#9CA3AF' }
                    ]}
                  >
                    {t(equipment.nameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Difficulty section */}
            <Text style={styles.filterSectionTitle}>
              {t('difficulty')}
            </Text>
            <View style={styles.filterChipContainer}>
              {DIFFICULTY_LEVELS.map(difficulty => (
                <TouchableOpacity
                  key={`filter-difficulty-${difficulty.id}`}
                  style={[
                    styles.filterChip,
                    selectedDifficulty.includes(difficulty.id as any)
                      ? { backgroundColor: difficulty.color }
                      : { backgroundColor: '#1F2937', borderColor: 'rgba(255, 255, 255, 0.1)' }
                  ]}
                  onPress={() => toggleDifficulty(difficulty.id as any)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedDifficulty.includes(difficulty.id as any)
                        ? { color: '#FFFFFF' }
                        : { color: '#9CA3AF' }
                    ]}
                  >
                    {t(difficulty.nameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Favorites toggle */}
            <TouchableOpacity
              style={[
                styles.favoritesToggle,
                showFavoritesOnly
                  ? { backgroundColor: '#FFD700' }
                  : { backgroundColor: '#1F2937', borderColor: 'rgba(255, 255, 255, 0.1)' }
              ]}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Ionicons 
                name={showFavoritesOnly ? 'star' : 'star-outline'} 
                size={18} 
                color={showFavoritesOnly ? '#FFFFFF' : '#9CA3AF'} 
              />
              <Text
                style={[
                  styles.favoritesToggleText,
                  showFavoritesOnly
                    ? { color: '#FFFFFF' }
                    : { color: '#9CA3AF' }
                ]}
              >
                {t('show_favorites_only')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          
          {/* Filter actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.resetFiltersButton}
              onPress={resetFilters}
            >
              <Ionicons name="refresh" size={18} color="#EF4444" />
              <Text style={styles.resetFiltersText}>{t('reset_filters')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.applyFiltersText}>{t('apply_filters')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
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
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons 
                  name="options-outline" 
                  size={20} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
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
                onPress={() => toggleCategory(category.id)}
              >
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === category.id && styles.categoryTabTextSelected
                ]}>
                  {t(category.displayNameKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Active filters */}
          {renderActiveFilters()}
          
          {/* Exercise list */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.exerciseList}
              ListEmptyComponent={renderEmptyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseItemCard}
                  onPress={() => handleSelectExercise(item)}
                >
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseNameContainer}>
                      <Text style={styles.exerciseName}>{item.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => handleToggleFavorite(item.id)}
                    >
                      <Ionicons 
                        name={item.favorite ? 'star' : 'star-outline'} 
                        size={20} 
                        color={item.favorite ? '#FFD700' : '#9CA3AF'} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.exerciseDetails}>
                    <View style={styles.exerciseTags}>
                      {item.muscle_group && (
                        <View style={styles.muscleGroupContainer}>
                          <Text style={styles.muscleGroupLabel}>{t('target')}:</Text>
                          <Text style={styles.muscleGroupValue}>{item.muscle_group}</Text>
                        </View>
                      )}
                      
                      {item.equipment && (
                        <View style={styles.equipmentContainer}>
                          <Text style={styles.equipmentLabel}>{t('equipment')}:</Text>
                          <Text style={styles.equipmentValue}>{item.equipment}</Text>
                        </View>
                      )}
                      
                      <View style={styles.tagsRow}>
                        {renderDifficultyBadge(item.difficulty)}
                        
                        {recentExercises.includes(item.id) && (
                          <View style={styles.recentTag}>
                            <Text style={styles.recentTagText}>{t('recent')}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
          
          {/* Custom exercise button */}
          {searchTerm.length > 0 && filteredExercises.length === 0 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCreateCustomExercise}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>
                {t('add_custom_exercise')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {renderFilterModal()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '90%',
    position: 'relative',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  
  // Search styles
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
  
  // Category tabs
  categoryTabs: {
    height: 50,
    marginBottom: 10,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  categoryTabSelected: {
    backgroundColor: '#0284c7',
    height: 36,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    textAlign: 'center',
  },
  categoryTabTextSelected: {
    color: '#FFFFFF',
  },
  
  // Active filters
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  clearFiltersButton: {
    padding: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0ea5e9',
  },
  
  // Exercise list
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  exerciseItemCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNameContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  favoriteButton: {
    padding: 4,
  },
  exerciseDetails: {
    marginBottom: 4,
  },
  exerciseTags: {
    width: '100%',
  },
  muscleGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  muscleGroupLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 4,
  },
  muscleGroupValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  equipmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  equipmentLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 4,
  },
  equipmentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  exerciseTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 4,
  },
  exerciseTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recentTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 4,
  },
  recentTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  
  // Empty state
  emptyState: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginTop: 12,
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
  
  // Add button
  addButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  
  // Filter modal
  filterModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  filterScroll: {
    padding: 16,
    maxHeight: 600,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
  },
  filterChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  favoritesToggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  filterActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  resetFiltersButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  resetFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 8,
  },
  applyFiltersButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default ExerciseSelector;