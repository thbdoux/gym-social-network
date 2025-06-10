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
import { useTheme } from '../../context/ThemeContext';
import { 
  EXERCISE_CATEGORIES, 
  EQUIPMENT_TYPES,
  DIFFICULTY_LEVELS,
  toggleFavorite,
  FilterCriteria,
  getAllExercises,
  useExerciseHelpers,
} from './data/exerciseData';

type ExerciseSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: any) => void; // Updated to pass full exercise object
  recentExercises?: string[]; // Array of recently used exercise IDs
};

const ExerciseSelector = ({ 
  visible, 
  onClose, 
  onSelectExercise, 
  recentExercises = []
}: ExerciseSelectorProps) => {
  const { t, language } = useLanguage();
  const {
    filterExercises,
    getExerciseName,
    getEquipmentName,
    getTargetMuscleName,
    getSecondaryMuscleNames,
    searchExercises } = useExerciseHelpers();
  const { workoutPalette, palette } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Category selection
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<('beginner' | 'intermediate' | 'advanced')[]>([]);
  const [selectedEffortTypes, setSelectedEffortTypes] = useState<('reps' | 'time' | 'distance')[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Handle exercise selection - now passes full exercise object
  const handleSelectExercise = useCallback((exercise: any) => {
    // Create a complete exercise object with all necessary properties
    const completeExercise = {
      ...exercise, // Preserve all mapped properties
      effort_type: exercise.effort_type || 'reps',
      notes: exercise.notes || '',
      favorite: exercise.favorite || false
    };
    
    onSelectExercise(completeExercise);
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
    setSelectedEffortTypes([]);
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
    
    // Create a custom exercise object
    const customExercise = {
      id: `custom_${Date.now()}`,
      name: searchTerm.trim(),
      effort_type: 'reps', // Default to reps for custom exercises
      equipment: t('equipment_other') || 'Other',
      muscle_group: t('muscle_other') || 'Other',
      notes: '',
      secondary_muscles: [],
      difficulty: undefined,
      favorite: false
    };
    
    onSelectExercise(customExercise);
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

  // Toggle effort type selection
  const toggleEffortType = useCallback((effortType: 'reps' | 'time' | 'distance') => {
    setSelectedEffortTypes(prev => 
      prev.includes(effortType)
        ? prev.filter(t => t !== effortType)
        : [...prev, effortType]
    );
  }, []);
  
  // Filtered exercises based on all criteria
  const filteredExercises = useMemo(() => {
    let results = [];
    
    // If we're searching
    if (searchTerm.length > 0) {
      results = searchExercises(searchTerm, t);
    } 
    // If we have a selected category from the tabs
    else if (selectedCategory) {
      results = EXERCISE_CATEGORIES.find(cat => cat.id === selectedCategory)?.exercises || [];
    } 
    // Otherwise show all or filtered
    else {
      // Apply additional filters if they exist
      if (selectedCategories.length > 0 || selectedEquipment.length > 0 || 
          selectedDifficulty.length > 0 || selectedEffortTypes.length > 0 || showFavoritesOnly) {
            
        
        results = filterExercises(selectedCategories.length > 0 ? selectedCategories : undefined,
          selectedEquipment.length > 0 ? selectedEquipment : undefined,
          selectedDifficulty.length > 0 ? selectedDifficulty : undefined,
          showFavoritesOnly, t);
      } else {
        // If no filters, show all exercises
        results = getAllExercises();
      }
    }

    // Apply effort type filter
    if (selectedEffortTypes.length > 0) {
      results = results.filter(exercise => 
        exercise.effort_type ? selectedEffortTypes.includes(exercise.effort_type) : false
      );
    }
    
    // Map the results to include display names and additional info
    const mappedResults = results.map(exercise => {
      // Find the category for this exercise
      const category = EXERCISE_CATEGORIES.find(cat => 
        cat.exercises.some(ex => ex.id === exercise.id)
      );
      
      return {
        id: exercise.id,
        name: getExerciseName(exercise, t),
        nameKey: exercise.nameKey,
        equipment: getEquipmentName(exercise, t),
        equipmentKey: exercise.equipmentKey,
        muscle_group: getTargetMuscleName(exercise, t),
        targetMuscleKey: exercise.targetMuscleKey,
        secondary_muscles: getSecondaryMuscleNames(exercise, t),
        secondaryMuscleKeys: exercise.secondaryMuscleKeys,
        difficulty: exercise.difficulty,
        effort_type: exercise.effort_type || 'reps',
        favorite: exercise.favorite || false,
        category: category?.id || '',
        categoryName: category ? t(category.displayNameKey) : '',
        iconName: category?.iconName || 'fitness-outline',
        notes: exercise.notes || ''
      };
    });
    
    // Sort: favorites first, then recent, then alphabetical
    const sorted = mappedResults.sort((a, b) => {
      // Favorites first
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      
      // Recently used second
      const aIsRecent = recentExercises.includes(a.name);
      const bIsRecent = recentExercises.includes(b.name);
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;
      if (aIsRecent && bIsRecent) {
        // Sort by recency order
        return recentExercises.indexOf(a.name) - recentExercises.indexOf(b.name);
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
    selectedEffortTypes,
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
    selectedEffortTypes,
    showFavoritesOnly,
    language
  ]);

  // Get effort type display info
  const getEffortTypeInfo = (effortType: 'reps' | 'time' | 'distance') => {
    switch (effortType) {
      case 'time':
        return { icon: 'time-outline', color: '#10B981', label: t('time') };
      case 'distance':
        return { icon: 'location-outline', color: '#3B82F6', label: t('distance') };
      case 'reps':
      default:
        return { icon: 'repeat-outline', color: '#F59E0B', label: t('reps') };
    }
  };
  
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

  // Render effort type badge
  const renderEffortTypeBadge = (effortType: 'reps' | 'time' | 'distance') => {
    const effortInfo = getEffortTypeInfo(effortType);
    
    return (
      <View style={[
        styles.exerciseTag, 
        { backgroundColor: `${effortInfo.color}30` }
      ]}>
        <Ionicons name={effortInfo.icon as any} size={12} color={effortInfo.color} />
        <Text style={[styles.exerciseTagText, { color: effortInfo.color, marginLeft: 4 }]}>
          {effortInfo.label}
        </Text>
      </View>
    );
  };

  // Render secondary muscles tags
  const renderSecondaryMuscles = (secondaryMuscles: string[]) => {
    if (!secondaryMuscles || secondaryMuscles.length === 0) return null;
    
    return (
      <View style={styles.secondaryMusclesContainer}>
        <Text style={[styles.secondaryMusclesLabel, { color: palette.text_tertiary }]}>{t('secondary')}:</Text>
        <View style={styles.secondaryMusclesList}>
          {secondaryMuscles.slice(0, 3).map((muscle, index) => (
            <View key={index} style={styles.secondaryMuscleTag}>
              <Text style={styles.secondaryMuscleText}>{muscle}</Text>
            </View>
          ))}
          {secondaryMuscles.length > 3 && (
            <View style={styles.secondaryMuscleTag}>
              <Text style={styles.secondaryMuscleText}>+{secondaryMuscles.length - 3}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  // List empty component
  const renderEmptyList = () => (
    <View style={[styles.emptyState, { backgroundColor: palette.input_background }]}>
      <Ionicons name="barbell-outline" size={48} color={palette.text_tertiary} />
      <Text style={[styles.emptyStateText, { color: palette.text }]}>
        {searchTerm.length > 0 
          ? t('no_matching_exercises') 
          : t('no_exercises_in_category')}
      </Text>
      {searchTerm.length > 0 && (
        <TouchableOpacity
          style={[
            styles.customExerciseButton,
            { backgroundColor: `${workoutPalette.highlight}10` }
          ]}
          onPress={handleCreateCustomExercise}
        >
          <Ionicons name="add" size={16} color={workoutPalette.highlight} />
          <Text style={[styles.customExerciseText, { color: workoutPalette.highlight }]}>
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
                         selectedEffortTypes.length +
                         (showFavoritesOnly ? 1 : 0);
                         
    if (totalFilters === 0) return null;
    
    return (
      <View style={styles.activeFiltersContainer}>
        <Text style={[styles.activeFiltersText, { color: palette.text_tertiary }]}>
          {t('active_filters', { count: totalFilters })}
        </Text>
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={resetFilters}
        >
          <Text style={[styles.clearFiltersText, { color: workoutPalette.highlight }]}>{t('clear_all')}</Text>
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
      <View style={[styles.filterModalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.filterModalContent, { backgroundColor: palette.page_background }]}>
          <View style={[
            styles.modalHeader,
            { borderBottomColor: palette.border }
          ]}>
            <Text style={[styles.modalTitle, { color: workoutPalette.text }]}>{t('filters')}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Ionicons name="close" size={20} color={workoutPalette.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterScroll}>
            {/* Categories section */}
            <Text style={[
              styles.filterSectionTitle,
              { color: workoutPalette.text }
            ]}>
              {t('categories')}
            </Text>
            <View style={styles.filterChipContainer}>
              {EXERCISE_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={`filter-category-${category.id}`}
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: selectedCategories.includes(category.id)
                        ? workoutPalette.highlight
                        : palette.input_background,
                      borderColor: palette.border
                    }
                  ]}
                  onPress={() => toggleFilterCategory(category.id)}
                >
                  <Ionicons 
                    name={category.iconName || 'fitness-outline'} 
                    size={16} 
                    color={selectedCategories.includes(category.id) ? '#FFFFFF' : palette.text_tertiary} 
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { 
                        color: selectedCategories.includes(category.id) 
                          ? '#FFFFFF' 
                          : palette.text_tertiary 
                      }
                    ]}
                  >
                    {t(category.displayNameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Equipment section */}
            <Text style={[
              styles.filterSectionTitle,
              { color: workoutPalette.text }
            ]}>
              {t('equipment')}
            </Text>
            <View style={styles.filterChipContainer}>
              {EQUIPMENT_TYPES.map(equipment => (
                <TouchableOpacity
                  key={`filter-equipment-${equipment.id}`}
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: selectedEquipment.includes(equipment.id)
                        ? '#8B5CF6'
                        : palette.input_background,
                      borderColor: palette.border
                    }
                  ]}
                  onPress={() => toggleEquipment(equipment.id)}
                >
                  <Ionicons 
                    name={equipment.iconName || 'fitness-outline'} 
                    size={16} 
                    color={selectedEquipment.includes(equipment.id) ? '#FFFFFF' : palette.text_tertiary} 
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { 
                        color: selectedEquipment.includes(equipment.id) 
                          ? '#FFFFFF' 
                          : palette.text_tertiary 
                      }
                    ]}
                  >
                    {t(equipment.nameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Effort Types section */}
            <Text style={[
              styles.filterSectionTitle,
              { color: workoutPalette.text }
            ]}>
              {t('effort_types')}
            </Text>
            <View style={styles.filterChipContainer}>
              {[
                { id: 'reps', nameKey: 'effort_type_reps', icon: 'repeat-outline', color: '#F59E0B' },
                { id: 'time', nameKey: 'effort_type_time', icon: 'time-outline', color: '#10B981' },
                { id: 'distance', nameKey: 'effort_type_distance', icon: 'location-outline', color: '#3B82F6' }
              ].map(effortType => (
                <TouchableOpacity
                  key={`filter-effort-${effortType.id}`}
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: selectedEffortTypes.includes(effortType.id as any)
                        ? effortType.color
                        : palette.input_background,
                      borderColor: palette.border
                    }
                  ]}
                  onPress={() => toggleEffortType(effortType.id as any)}
                >
                  <Ionicons 
                    name={effortType.icon as any} 
                    size={16} 
                    color={selectedEffortTypes.includes(effortType.id as any) ? '#FFFFFF' : palette.text_tertiary} 
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { 
                        color: selectedEffortTypes.includes(effortType.id as any)
                          ? '#FFFFFF' 
                          : palette.text_tertiary 
                      }
                    ]}
                  >
                    {t(effortType.nameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Difficulty section */}
            <Text style={[
              styles.filterSectionTitle,
              { color: workoutPalette.text }
            ]}>
              {t('difficulty')}
            </Text>
            <View style={styles.filterChipContainer}>
              {DIFFICULTY_LEVELS.map(difficulty => (
                <TouchableOpacity
                  key={`filter-difficulty-${difficulty.id}`}
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: selectedDifficulty.includes(difficulty.id as any)
                        ? difficulty.color
                        : palette.input_background,
                      borderColor: palette.border
                    }
                  ]}
                  onPress={() => toggleDifficulty(difficulty.id as any)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { 
                        color: selectedDifficulty.includes(difficulty.id as any)
                          ? '#FFFFFF' 
                          : palette.text_tertiary 
                      }
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
                { 
                  backgroundColor: showFavoritesOnly
                    ? '#FFD700'
                    : palette.input_background,
                  borderColor: palette.border
                }
              ]}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Ionicons 
                name={showFavoritesOnly ? 'star' : 'star-outline'} 
                size={18} 
                color={showFavoritesOnly ? '#FFFFFF' : palette.text_tertiary} 
              />
              <Text
                style={[
                  styles.favoritesToggleText,
                  { 
                    color: showFavoritesOnly
                      ? '#FFFFFF' 
                      : palette.text_tertiary 
                  }
                ]}
              >
                {t('show_favorites_only')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          
          {/* Filter actions */}
          <View style={[
            styles.filterActions,
            { borderTopColor: palette.border }
          ]}>
            <TouchableOpacity
              style={[
                styles.resetFiltersButton,
                { backgroundColor: `${palette.error}15` }
              ]}
              onPress={resetFilters}
            >
              <Ionicons name="refresh" size={18} color={palette.error} />
              <Text style={[styles.resetFiltersText, { color: palette.error }]}>{t('reset_filters')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.applyFiltersButton, { backgroundColor: workoutPalette.highlight }]}
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
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: palette.page_background }]}>
          <View style={[
            styles.modalHeader,
            { borderBottomColor: palette.border }
          ]}>
            <Text style={[styles.modalTitle, { color: workoutPalette.text }]}>{t('select_exercise')}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons 
                  name="options-outline" 
                  size={20} 
                  color={workoutPalette.text} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={20} color={workoutPalette.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Search bar */}
          <View style={[
            styles.searchContainer,
            { backgroundColor: palette.input_background }
          ]}>
            <Ionicons name="search" size={16} color={palette.text_tertiary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: workoutPalette.text }]}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={t('search_exercises')}
              placeholderTextColor={palette.text_tertiary}
              selectionColor={workoutPalette.highlight}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchTerm('')}
              >
                <Ionicons name="close" size={14} color={palette.text_tertiary} />
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
                { backgroundColor: palette.input_background },
                selectedCategory === null && { backgroundColor: workoutPalette.highlight }
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.categoryTabText,
                { color: palette.text },
                selectedCategory === null && { color: '#FFFFFF' }
              ]}>
                {t('all')}
              </Text>
            </TouchableOpacity>
            
            {EXERCISE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  { backgroundColor: palette.input_background },
                  selectedCategory === category.id && { backgroundColor: workoutPalette.highlight }
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <Text style={[
                  styles.categoryTabText,
                  { color: palette.text },
                  selectedCategory === category.id && { color: '#FFFFFF' }
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
              <ActivityIndicator size="large" color={workoutPalette.highlight} />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.exerciseList}
              ListEmptyComponent={renderEmptyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.exerciseItemCard,
                    { backgroundColor: palette.card_background }
                  ]}
                  onPress={() => handleSelectExercise(item)}
                >
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseNameContainer}>
                      <Text style={[styles.exerciseName, { color: workoutPalette.text }]}>{item.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => handleToggleFavorite(item.id)}
                    >
                      <Ionicons 
                        name={item.favorite ? 'star' : 'star-outline'} 
                        size={20} 
                        color={item.favorite ? '#FFD700' : palette.text_tertiary} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.exerciseDetails}>
                    <View style={styles.exerciseTags}>
                      {item.muscle_group && (
                        <View style={styles.muscleGroupContainer}>
                          <Text style={[styles.muscleGroupLabel, { color: palette.text_tertiary }]}>{t('primary')}:</Text>
                          <Text style={styles.muscleGroupValue}>{item.muscle_group}</Text>
                        </View>
                      )}
                      
                      {/* Secondary muscles */}
                      {renderSecondaryMuscles(item.secondary_muscles)}
                      
                      {item.equipment && (
                        <View style={styles.equipmentContainer}>
                          <Text style={[styles.equipmentLabel, { color: palette.text_tertiary }]}>{t('equipment')}:</Text>
                          <Text style={[styles.equipmentValue, { color: palette.text }]}>{item.equipment}</Text>
                        </View>
                      )}
                      
                      <View style={styles.tagsRow}>
                        {renderEffortTypeBadge(item.effort_type)}
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
              style={[styles.addButton, { backgroundColor: workoutPalette.highlight }]}
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
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  },
  modalCloseButton: {
    padding: 4,
  },
  
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  },
  clearFiltersButton: {
    padding: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '500',
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
    marginRight: 4,
    fontWeight: '600',
  },
  muscleGroupValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981', // Green for primary muscle
  },
  // Secondary muscles styles
  secondaryMusclesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  secondaryMusclesLabel: {
    fontSize: 12,
    marginRight: 4,
    fontWeight: '600',
  },
  secondaryMusclesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  secondaryMuscleTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)', // Purple background for secondary
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
  },
  secondaryMuscleText: {
    fontSize: 11,
    color: '#A855F7', // Purple text for secondary muscles
    fontWeight: '500',
  },
  equipmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  equipmentLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  equipmentValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  exerciseTag: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  customExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  customExerciseText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // Add button
  addButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 16,
    right: 16,
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
    justifyContent: 'flex-end',
  },
  filterModalContent: {
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
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  resetFiltersButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  resetFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  applyFiltersButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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