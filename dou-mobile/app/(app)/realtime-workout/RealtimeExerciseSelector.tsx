import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  EXERCISE_CATEGORIES, 
  EQUIPMENT_TYPES,
  DIFFICULTY_LEVELS,
  toggleFavorite, 
  ExerciseItem,
  FilterCriteria, 
  useExerciseHelpers
} from '../../../components/workouts/data/exerciseData';

interface RealtimeExerciseSelectorProps {
  onSelectExercise: (exercise: any) => void;
  onCancel: () => void;
  themePalette: any;
  recentExercises?: string[]; // Array of recently used exercise IDs
}

const RealtimeExerciseSelector: React.FC<RealtimeExerciseSelectorProps> = ({
  onSelectExercise,
  onCancel,
  themePalette,
  recentExercises = [],
}) => {
  const { t, language } = useLanguage();
  const { width: screenWidth } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseList, setExerciseList] = useState<any[]>([]);
  
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<('beginner' | 'intermediate' | 'advanced')[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // UI state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelHeight = useState(new Animated.Value(0))[0];

  const { filterExercises, 
    getExerciseName,
    getEquipmentName,
    getTargetMuscleName,
    getSecondaryMuscleNames } = useExerciseHelpers();
  
  // Load exercises
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setIsLoading(true);
        // Short delay to simulate loading
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Map exercise data to the format needed by the component
        const allExercises = EXERCISE_CATEGORIES.flatMap(category => 
          category.exercises.map(exercise => ({
            id: exercise.id,
            nameKey: exercise.nameKey,
            equipmentKey: exercise.equipmentKey,
            targetMuscleKey: exercise.targetMuscleKey,
            secondaryMuscleKeys: exercise.secondaryMuscleKeys || [],
            difficulty: exercise.difficulty,
            favorite: exercise.favorite || false,
            category: category.id,
            sets: [
              { reps: 10, weight: 0, rest_time: 60 }
            ]
          }))
        );
        
        setExerciseList(allExercises);
      } catch (error) {
        console.error('Error loading exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExercises();
  }, []);
  
  // Toggle filter panel
  const toggleFilterPanel = useCallback(() => {
    const toValue = showFilterPanel ? 0 : 300; // Adjust height as needed
    
    Animated.timing(filterPanelHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setShowFilterPanel(!showFilterPanel);
  }, [showFilterPanel, filterPanelHeight]);
  
  // Toggle category selection
  const toggleCategory = useCallback((categoryId: string) => {
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
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedEquipment([]);
    setSelectedDifficulty([]);
    setShowFavoritesOnly(false);
    setSearchQuery('');
  }, []);
  
  // Toggle favorite status
  const handleToggleFavorite = useCallback((exerciseId: string) => {
    toggleFavorite(exerciseId);
    
    // Update the local exercise list to reflect the change
    setExerciseList(prev => 
      prev.map(exercise => 
        exercise.id === exerciseId
          ? { ...exercise, favorite: !exercise.favorite }
          : exercise
      )
    );
  }, []);
  
  // Filtered exercises based on all criteria
  const filteredExercises = useMemo(() => {
    const criteria: FilterCriteria = {
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      equipmentIds: selectedEquipment.length > 0 ? selectedEquipment : undefined,
      difficultyLevels: selectedDifficulty.length > 0 ? selectedDifficulty : undefined,
      searchQuery: searchQuery,
      favorites: showFavoritesOnly,
      language
    };
    
    const filtered = filterExercises(criteria, t).map(exercise => {
      // Find the category for this exercise
      const category = EXERCISE_CATEGORIES.find(cat => 
        cat.exercises.some(ex => ex.id === exercise.id)
      );
      
      // Format for component use
      return {
        id: exercise.id,
        name: getExerciseName(exercise, t),
        nameKey: exercise.nameKey,
        equipment: exercise.equipmentKey,
        muscle_group: getTargetMuscleName(exercise, t),
        targetMuscleKey: exercise.targetMuscleKey,
        secondary_muscles: getSecondaryMuscleNames(exercise, t),
        secondaryMuscleKeys: exercise.secondaryMuscleKeys || [],
        difficulty: exercise.difficulty,
        favorite: exercise.favorite || false,
        category: category?.id || '',
        categoryName: category ? t(category.displayNameKey) : '',
        iconName: category?.iconName || 'fitness-outline',
        sets: [
          { reps: 10, weight: 0, rest_time: 60 }
        ]
      };
    });
    
    // Sort by favorites first, then by recent usage, then alphabetically
    return filtered.sort((a, b) => {
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
  }, [
    selectedCategories, 
    selectedEquipment, 
    selectedDifficulty, 
    searchQuery, 
    showFavoritesOnly, 
    exerciseList,
    language,
    t,
    recentExercises
  ]);
  
  // Create custom exercise from search term
  const handleCreateCustomExercise = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    const customExercise = {
      id: `custom-${Date.now()}`,
      name: searchQuery.trim(),
      equipment: t('equipment_other'),
      muscle_group: t('muscle_other'),
      secondary_muscles: [],
      notes: '',
      sets: [
        { reps: 10, weight: 0, rest_time: 60 }
      ]
    };
    
    onSelectExercise(customExercise);
  }, [searchQuery, t, onSelectExercise]);
  
  // Display the difficulty badge with appropriate color
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

  // Render secondary muscles tags
  const renderSecondaryMuscles = (secondaryMuscles: string[]) => {
    if (!secondaryMuscles || secondaryMuscles.length === 0) return null;
    
    return secondaryMuscles.slice(0, 2).map((muscle, index) => (
      <View 
        key={index} 
        style={[
          styles.exerciseTag, 
          { backgroundColor: `${themePalette.warning}30` }
        ]}
      >
        <Text style={[styles.exerciseTagText, { color: themePalette.warning }]}>
          {muscle}
        </Text>
      </View>
    ));
  };
  
  // Render each exercise item
  const renderExerciseItem = useCallback(({ item }) => (

    <TouchableOpacity
      style={[styles.exerciseItem, { backgroundColor: themePalette.card_background }]}
      onPress={() => onSelectExercise(item)}
    >
      <View style={styles.exerciseIconContainer}>
        {/* <Ionicons 
          name={item.iconName || 'fitness-outline'} 
          size={24} 
          color={themePalette.highlight} 
        /> */}
      </View>
      <View style={styles.exerciseInfo}>
        <View style={styles.exerciseNameRow}>
          <Text style={[styles.exerciseName, { color: themePalette.text }]}>
            {item.name}
          </Text>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(item.id)}
          >
            <Ionicons 
              name={item.favorite ? 'star' : 'star-outline'} 
              size={20} 
              color={item.favorite ? '#FFD700' : themePalette.text_secondary} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Primary muscle group */}
        {item.muscle_group && (
          <View style={styles.primaryMuscleContainer}>
            <Text style={[styles.primaryMuscleLabel, { color: themePalette.text_secondary }]}>
              {t('primary')}:
            </Text>
            <Text style={[styles.primaryMuscleText, { color: themePalette.success }]}>
              {item.muscle_group}
            </Text>
          </View>
        )}
        
        {/* Secondary muscles */}
        {item.secondary_muscles && item.secondary_muscles.length > 0 && (
          <View style={styles.secondaryMusclesContainer}>
            <Text style={[styles.secondaryMusclesLabel, { color: themePalette.text_secondary }]}>
              {t('secondary')}:
            </Text>
            <View style={styles.secondaryMusclesList}>
              {item.secondary_muscles.slice(0, 3).map((muscle: string, index: number) => (
                <Text 
                  key={index} 
                  style={[styles.secondaryMuscleText, { color: themePalette.warning }]}
                >
                  {muscle}{index < Math.min(2, item.secondary_muscles.length - 1) ? ', ' : ''}
                </Text>
              ))}
              {item.secondary_muscles.length > 3 && (
                <Text style={[styles.secondaryMuscleText, { color: themePalette.warning }]}>
                  , +{item.secondary_muscles.length - 3}
                </Text>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.exerciseMeta}>
          {item.equipment && (
            <View style={[
              styles.exerciseTag, 
              { backgroundColor: `${themePalette.accent}30` }
            ]}>
              <Text style={[styles.exerciseTagText, { color: themePalette.accent }]}>
                {t(item.equipment)}
              </Text>
            </View>
          )}
          {renderDifficultyBadge(item.difficulty)}
          {recentExercises.includes(item.name) && (
            <View style={[
              styles.exerciseTag, 
              { backgroundColor: `${themePalette.info}30` }
            ]}>
              <Text style={[styles.exerciseTagText, { color: themePalette.info }]}>
                {t('recent')}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={themePalette.text_secondary} />
    </TouchableOpacity>
  ), [t, themePalette, onSelectExercise, handleToggleFavorite, recentExercises]);
  
  // Render filter panel
  const renderFilterPanel = () => (
    <Animated.View 
      style={[
        styles.filterPanel, 
        { 
          height: filterPanelHeight,
          backgroundColor: themePalette.card_background,
          borderColor: themePalette.border
        }
      ]}
    >
      <ScrollView style={styles.filterScroll}>
        {/* Categories section */}
        <Text style={[styles.filterSectionTitle, { color: themePalette.text }]}>
          {t('categories')}
        </Text>
        <View style={styles.filterChipContainer}>
          {EXERCISE_CATEGORIES.map(category => (
            <TouchableOpacity
              key={`filter-category-${category.id}`}
              style={[
                styles.filterChip,
                selectedCategories.includes(category.id)
                  ? { backgroundColor: themePalette.highlight }
                  : { backgroundColor: `${themePalette.card_background}80`, borderColor: themePalette.border }
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              {/* <Ionicons 
                name={category.iconName || 'fitness-outline'} 
                size={16} 
                color={selectedCategories.includes(category.id) ? '#FFFFFF' : themePalette.text_secondary} 
              /> */}
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategories.includes(category.id)
                    ? { color: '#FFFFFF' }
                    : { color: themePalette.text_secondary }
                ]}
              >
                {t(category.displayNameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Equipment section */}
        <Text style={[styles.filterSectionTitle, { color: themePalette.text }]}>
          {t('equipment')}
        </Text>
        <View style={styles.filterChipContainer}>
          {EQUIPMENT_TYPES.map(equipment => (
            <TouchableOpacity
              key={`filter-equipment-${equipment.id}`}
              style={[
                styles.filterChip,
                selectedEquipment.includes(equipment.id)
                  ? { backgroundColor: themePalette.accent }
                  : { backgroundColor: `${themePalette.card_background}80`, borderColor: themePalette.border }
              ]}
              onPress={() => toggleEquipment(equipment.id)}
            >
              {/* <Ionicons 
                name={equipment.iconName || 'fitness-outline'} 
                size={16} 
                color={selectedEquipment.includes(equipment.id) ? '#FFFFFF' : themePalette.text_secondary} 
              /> */}
              <Text
                style={[
                  styles.filterChipText,
                  selectedEquipment.includes(equipment.id)
                    ? { color: '#FFFFFF' }
                    : { color: themePalette.text_secondary }
                ]}
              >
                {t(equipment.nameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Difficulty section */}
        <Text style={[styles.filterSectionTitle, { color: themePalette.text }]}>
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
                  : { backgroundColor: `${themePalette.card_background}80`, borderColor: themePalette.border }
              ]}
              onPress={() => toggleDifficulty(difficulty.id as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedDifficulty.includes(difficulty.id as any)
                    ? { color: '#FFFFFF' }
                    : { color: themePalette.text_secondary }
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
              : { backgroundColor: `${themePalette.card_background}80`, borderColor: themePalette.border }
          ]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons 
            name={showFavoritesOnly ? 'star' : 'star-outline'} 
            size={18} 
            color={showFavoritesOnly ? '#FFFFFF' : themePalette.text_secondary} 
          />
          <Text
            style={[
              styles.favoritesToggleText,
              showFavoritesOnly
                ? { color: '#FFFFFF' }
                : { color: themePalette.text_secondary }
            ]}
          >
            {t('show_favorites_only')}
          </Text>
        </TouchableOpacity>
        
        {/* Reset filters button */}
        <TouchableOpacity
          style={[styles.resetFiltersButton, { backgroundColor: themePalette.danger_light }]}
          onPress={resetFilters}
        >
          <Ionicons name="refresh" size={18} color={themePalette.danger} />
          <Text style={[styles.resetFiltersText, { color: themePalette.danger }]}>
            {t('reset_filters')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
  
  // List header showing filters and results count
  const renderListHeader = () => {
    const totalFilters = selectedCategories.length + 
                         selectedEquipment.length + 
                         selectedDifficulty.length + 
                         (showFavoritesOnly ? 1 : 0);
                         
    return (
      <View style={styles.listHeader}>
        <Text style={[styles.resultsCount, { color: themePalette.text_secondary }]}>
          {filteredExercises.length === 1 
            ? t('single_exercise_found') 
            : t('multiple_exercises_found', { count: filteredExercises.length })}
        </Text>
        {totalFilters > 0 && (
          <View style={styles.activeFiltersContainer}>
            <Text style={[styles.activeFiltersText, { color: themePalette.text_secondary }]}>
              {t('active_filters', { count: totalFilters })}
            </Text>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={resetFilters}
            >
              <Text style={[styles.clearFiltersText, { color: themePalette.highlight }]}>
                {t('clear_all')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themePalette.page_background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themePalette.card_background }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Ionicons name="arrow-back" size={24} color={themePalette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themePalette.text }]}>
          {t('select_exercise')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={toggleFilterPanel}
          >
            <Ionicons 
              name="options-outline" 
              size={24} 
              color={showFilterPanel ? themePalette.highlight : themePalette.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateCustomExercise}
            disabled={!searchQuery.trim()}
          >
            <Ionicons 
              name="add" 
              size={24} 
              color={searchQuery.trim() ? themePalette.highlight : themePalette.text_tertiary} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: themePalette.card_background }]}>
        <Ionicons name="search" size={20} color={themePalette.text_secondary} />
        <TextInput
          style={[styles.searchInput, { color: themePalette.text }]}
          placeholder={t('search_exercises')}
          placeholderTextColor={themePalette.text_tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            style={styles.clearSearch}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={18} color={themePalette.text_secondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Category quick filter tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategories.length === 0
              ? { backgroundColor: themePalette.highlight }
              : { backgroundColor: `${themePalette.card_background}80`, borderColor: themePalette.border }
          ]}
          onPress={() => setSelectedCategories([])}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategories.length === 0
                ? { color: '#FFFFFF' }
                : { color: themePalette.text_secondary }
            ]}
          >
            {t('all')}
          </Text>
        </TouchableOpacity>

        {EXERCISE_CATEGORIES.map(category => (
          <TouchableOpacity
            key={`quick-category-${category.id}`}
            style={[
              styles.categoryChip,
              selectedCategories.includes(category.id)
                ? { backgroundColor: themePalette.highlight }
                : { backgroundColor: `${themePalette.card_background}80`, borderColor: themePalette.border }
            ]}
            onPress={() => {
              // If this is the only selected category, clear it
              if (selectedCategories.length === 1 && selectedCategories[0] === category.id) {
                setSelectedCategories([]);
              }
              // If this category is already selected, remove it
              else if (selectedCategories.includes(category.id)) {
                setSelectedCategories(prev => prev.filter(id => id !== category.id));
              }
              // Otherwise, select only this category
              else {
                setSelectedCategories([category.id]);
              }
            }}
          >
            {/* <Ionicons 
              name={category.iconName || 'fitness-outline'} 
              size={16}
              color={selectedCategories.includes(category.id) ? '#FFFFFF' : themePalette.text_secondary}
              style={styles.categoryChipIcon}
            /> */}
            <Text
              style={[
                styles.categoryChipText,
                selectedCategories.includes(category.id)
                  ? { color: '#FFFFFF' }
                  : { color: themePalette.text_secondary }
              ]}
            >
              {t(category.displayNameKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Filter panel */}
      {renderFilterPanel()}
      
      {/* Exercise list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themePalette.highlight} />
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          renderItem={renderExerciseItem}
          keyExtractor={item => `exercise-${item.id}`}
          style={styles.exerciseList}
          contentContainerStyle={styles.exerciseListContent}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            <View style={[styles.emptyState, { backgroundColor: themePalette.card_background }]}>
              <Ionicons name="fitness-outline" size={40} color={themePalette.text_secondary} />
              <Text style={[styles.emptyStateTitle, { color: themePalette.text }]}>
                {searchQuery ? t('no_matching_exercises') : t('no_exercises_found')}
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: themePalette.text_secondary }]}>
                {searchQuery 
                  ? t('try_different_search') 
                  : selectedCategories.length > 0 || selectedEquipment.length > 0 || selectedDifficulty.length > 0
                    ? t('try_different_filters')
                    : t('create_custom_exercise')}
              </Text>
              {searchQuery.trim() && (
                <TouchableOpacity
                  style={[styles.createExerciseButton, { backgroundColor: themePalette.highlight }]}
                  onPress={handleCreateCustomExercise}
                >
                  <Text style={styles.createExerciseButtonText}>
                    {t('create_exercise')}: "{searchQuery}"
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
  },
  createButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  clearSearch: {
    padding: 4,
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipIcon: {
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterPanel: {
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  filterScroll: {
    padding: 16,
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
  resetFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  resetFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    marginBottom: 4,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    paddingBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  exerciseIconContainer: {
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  // Primary muscle styles
  primaryMuscleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  primaryMuscleLabel: {
    fontSize: 12,
    marginRight: 4,
    fontWeight: '600',
  },
  primaryMuscleText: {
    fontSize: 13,
    fontWeight: '600',
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
  secondaryMuscleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseMeta: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 30,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  createExerciseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createExerciseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default RealtimeExerciseSelector;