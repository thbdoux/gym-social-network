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
  ActivityIndicator,
  Platform,
  SafeAreaView
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
  onSelectExercise: (exercise: any) => void;
  recentExercises?: string[];
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
    searchExercises 
  } = useExerciseHelpers();
  const { workoutPalette, palette } = useTheme();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Category selection
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter states
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<('beginner' | 'intermediate' | 'advanced')[]>([]);
  const [selectedEffortTypes, setSelectedEffortTypes] = useState<('reps' | 'time' | 'distance')[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Animation for filter panel
  const filterPanelHeight = useState(new Animated.Value(0))[0];
  
  // Toggle filter panel
  const toggleFilterPanel = useCallback(() => {
    const toValue = showFilterPanel ? 0 : 280;
    
    Animated.timing(filterPanelHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setShowFilterPanel(!showFilterPanel);
  }, [showFilterPanel, filterPanelHeight]);
  
  // Handle exercise selection
  const handleSelectExercise = useCallback((exercise: any) => {
    const completeExercise = {
      ...exercise,
      effort_type: exercise.effort_type || 'reps',
      notes: exercise.notes || '',
      favorite: exercise.favorite || false,
      equipment: exercise.equipmentKey || exercise.equipment // Ensure equipmentKey is available
    };
    
    onSelectExercise(completeExercise);
    onClose();
  }, [onSelectExercise, onClose]);
  
  // Toggle favorites
  const handleToggleFavorite = useCallback((exerciseId: string) => {
    toggleFavorite(exerciseId);
    setSelectedCategories([...selectedCategories]); // Force re-render
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
  
  // Handle creating custom exercise
  const handleCreateCustomExercise = useCallback(() => {
    if (!searchTerm.trim()) {
      Alert.alert(t('error'), t('exercise_name_required'));
      return;
    }
    
    const customExercise = {
      id: `custom_${Date.now()}`,
      name: searchTerm.trim(),
      effort_type: 'reps',
      equipment: 'equipment_other',
      equipmentKey: 'equipment_other',
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
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
      setSelectedCategories([]);
    } else {
      setSelectedCategory(categoryId);
      setSelectedCategories([categoryId]);
    }
  }, [selectedCategory]);

  // Toggle filter category
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
  
  // Filtered exercises
  const filteredExercises = useMemo(() => {
    let results = [];
    
    if (searchTerm.length > 0) {
      results = searchExercises(searchTerm, t);
    } else if (selectedCategory) {
      results = EXERCISE_CATEGORIES.find(cat => cat.id === selectedCategory)?.exercises || [];
    } else {
      if (selectedCategories.length > 0 || selectedEquipment.length > 0 || 
          selectedDifficulty.length > 0 || selectedEffortTypes.length > 0 || showFavoritesOnly) {
        results = filterExercises(
          selectedCategories.length > 0 ? selectedCategories : undefined,
          selectedEquipment.length > 0 ? selectedEquipment : undefined,
          selectedDifficulty.length > 0 ? selectedDifficulty : undefined,
          showFavoritesOnly, 
          t
        );
      } else {
        results = getAllExercises();
      }
    }

    // Apply effort type filter
    if (selectedEffortTypes.length > 0) {
      results = results.filter(exercise => 
        exercise.effort_type ? selectedEffortTypes.includes(exercise.effort_type) : false
      );
    }
    
    // Map results
    const mappedResults = results.map(exercise => {
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
    
    // Sort by favorites, recent, then alphabetical
    return mappedResults.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      
      const aIsRecent = recentExercises.includes(a.name);
      const bIsRecent = recentExercises.includes(b.name);
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;
      if (aIsRecent && bIsRecent) {
        return recentExercises.indexOf(a.name) - recentExercises.indexOf(b.name);
      }
      
      return a.name.localeCompare(b.name);
    });
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
  
  // Update loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 100);
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

  // Get effort type info
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
  
  // Render difficulty badge
  const renderDifficultyBadge = (difficulty?: 'beginner' | 'intermediate' | 'advanced') => {
    if (!difficulty) return null;
    
    const difficultyInfo = DIFFICULTY_LEVELS.find(d => d.id === difficulty);
    if (!difficultyInfo) return null;
    
    return (
      <View style={[styles.exerciseTag, { backgroundColor: `${difficultyInfo.color}30` }]}>
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
      <View style={[styles.exerciseTag, { backgroundColor: `${effortInfo.color}30` }]}>
        <Ionicons name={effortInfo.icon as any} size={12} color={effortInfo.color} />
        <Text style={[styles.exerciseTagText, { color: effortInfo.color, marginLeft: 4 }]}>
          {effortInfo.label}
        </Text>
      </View>
    );
  };

  // Render secondary muscles
  const renderSecondaryMuscles = (secondaryMuscles: string[]) => {
    if (!secondaryMuscles || secondaryMuscles.length === 0) return null;
    
    return (
      <View style={styles.secondaryMusclesContainer}>
        <Text style={[styles.secondaryMusclesLabel, { color: palette.text_tertiary }]}>
          {t('secondary')}:
        </Text>
        <View style={styles.secondaryMusclesList}>
          {secondaryMuscles.slice(0, 3).map((muscle, index) => (
            <Text 
              key={index} 
              style={[styles.secondaryMuscleText, { color: '#A855F7' }]}
            >
              {muscle}{index < Math.min(2, secondaryMuscles.length - 1) ? ', ' : ''}
            </Text>
          ))}
          {secondaryMuscles.length > 3 && (
            <Text style={[styles.secondaryMuscleText, { color: '#A855F7' }]}>
              , +{secondaryMuscles.length - 3}
            </Text>
          )}
        </View>
      </View>
    );
  };
  
  // Render exercise item
  const renderExerciseItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[styles.exerciseItem, { backgroundColor: palette.card_background }]}
      onPress={() => handleSelectExercise(item)}
    >
      <View style={styles.exerciseInfo}>
        <View style={styles.exerciseNameRow}>
          <Text style={[styles.exerciseName, { color: workoutPalette.text }]}>{item.name}</Text>
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
        
        {/* Primary muscle group */}
        {item.muscle_group && (
          <View style={styles.primaryMuscleContainer}>
            <Text style={[styles.primaryMuscleLabel, { color: palette.text_tertiary }]}>
              {t('primary')}:
            </Text>
            <Text style={[styles.primaryMuscleText, { color: '#10B981' }]}>
              {item.muscle_group}
            </Text>
          </View>
        )}
        
        {/* Secondary muscles */}
        {renderSecondaryMuscles(item.secondary_muscles)}
        
        {/* Equipment */}
        {item.equipment && (
          <View style={styles.equipmentContainer}>
            <Text style={[styles.equipmentLabel, { color: palette.text_tertiary }]}>
              {t('equipment')}:
            </Text>
            <Text style={[styles.equipmentValue, { color: palette.text }]}>
              {item.equipment}
            </Text>
          </View>
        )}
        
        {/* Tags */}
        <View style={styles.tagsRow}>
          {renderEffortTypeBadge(item.effort_type)}
          {renderDifficultyBadge(item.difficulty)}
          
          {recentExercises.includes(item.name) && (
            <View style={[styles.exerciseTag, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Text style={[styles.exerciseTagText, { color: '#10B981' }]}>{t('recent')}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={palette.text_tertiary} />
    </TouchableOpacity>
  ), [workoutPalette.text, palette, t, handleSelectExercise, handleToggleFavorite, recentExercises]);
  
  // Render empty state
  const renderEmptyList = () => (
    <View style={[styles.emptyState, { backgroundColor: palette.card_background }]}>
      <Ionicons name="barbell-outline" size={48} color={palette.text_tertiary} />
      <Text style={[styles.emptyStateText, { color: palette.text }]}>
        {searchTerm.length > 0 
          ? t('no_matching_exercises') 
          : t('no_exercises_in_category')}
      </Text>
      {searchTerm.length > 0 && (
        <TouchableOpacity
          style={[styles.customExerciseButton, { backgroundColor: `${workoutPalette.highlight}10` }]}
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
  
  // Render active filters
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
        <TouchableOpacity style={styles.clearFiltersButton} onPress={resetFilters}>
          <Text style={[styles.clearFiltersText, { color: workoutPalette.highlight }]}>
            {t('clear_all')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render filter panel
  const renderFilterPanel = () => (
    <Animated.View 
      style={[
        styles.filterPanel, 
        { 
          height: filterPanelHeight,
          backgroundColor: palette.card_background,
          borderColor: palette.border
        }
      ]}
    >
      <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <Text style={[styles.filterSectionTitle, { color: workoutPalette.text }]}>
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
              <Text style={[
                styles.filterChipText,
                { 
                  color: selectedCategories.includes(category.id) 
                    ? '#FFFFFF' 
                    : palette.text_tertiary 
                }
              ]}>
                {t(category.displayNameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Equipment */}
        <Text style={[styles.filterSectionTitle, { color: workoutPalette.text }]}>
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
              <Text style={[
                styles.filterChipText,
                { 
                  color: selectedEquipment.includes(equipment.id) 
                    ? '#FFFFFF' 
                    : palette.text_tertiary 
                }
              ]}>
                {t(equipment.nameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Effort Types */}
        <Text style={[styles.filterSectionTitle, { color: workoutPalette.text }]}>
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
              <Text style={[
                styles.filterChipText,
                { 
                  color: selectedEffortTypes.includes(effortType.id as any)
                    ? '#FFFFFF' 
                    : palette.text_tertiary 
                }
              ]}>
                {t(effortType.nameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Difficulty */}
        <Text style={[styles.filterSectionTitle, { color: workoutPalette.text }]}>
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
              <Text style={[
                styles.filterChipText,
                { 
                  color: selectedDifficulty.includes(difficulty.id as any)
                    ? '#FFFFFF' 
                    : palette.text_tertiary 
                }
              ]}>
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
          <Text style={[
            styles.favoritesToggleText,
            { 
              color: showFavoritesOnly
                ? '#FFFFFF' 
                : palette.text_tertiary 
            }
          ]}>
            {t('show_favorites_only')}
          </Text>
        </TouchableOpacity>
        
        {/* Reset button */}
        <TouchableOpacity
          style={[styles.resetFiltersButton, { backgroundColor: `${palette.error}15` }]}
          onPress={resetFilters}
        >
          <Ionicons name="refresh" size={18} color={palette.error} />
          <Text style={[styles.resetFiltersText, { color: palette.error }]}>
            {t('reset_filters')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: palette.page_background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: palette.card_background, borderBottomColor: palette.border }]}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={workoutPalette.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: workoutPalette.text }]}>
              {t('select_exercise')}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.filterButton} onPress={toggleFilterPanel}>
                <Ionicons 
                  name="options-outline" 
                  size={24} 
                  color={showFilterPanel ? workoutPalette.highlight : workoutPalette.text} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateCustomExercise}
                disabled={!searchTerm.trim()}
              >
                <Ionicons 
                  name="add" 
                  size={24} 
                  color={searchTerm.trim() ? workoutPalette.highlight : palette.text_tertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Search bar */}
          <View style={[styles.searchContainer, { backgroundColor: palette.input_background }]}>
            <Ionicons name="search" size={20} color={palette.text_tertiary} />
            <TextInput
              style={[styles.searchInput, { color: workoutPalette.text }]}
              placeholder={t('search_exercises')}
              placeholderTextColor={palette.text_tertiary}
              value={searchTerm}
              onChangeText={setSearchTerm}
              selectionColor={workoutPalette.highlight}
            />
            {searchTerm ? (
              <TouchableOpacity style={styles.clearSearch} onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={18} color={palette.text_tertiary} />
              </TouchableOpacity>
            ) : null}
          </View>
          
          {/* Category tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === null
                  ? { backgroundColor: workoutPalette.highlight }
                  : { backgroundColor: palette.input_background, borderColor: palette.border }
              ]}
              onPress={() => {
                setSelectedCategory(null);
                setSelectedCategories([]);
              }}
            >
              <Text style={[
                styles.categoryChipText,
                { color: selectedCategory === null ? '#FFFFFF' : palette.text_tertiary }
              ]}>
                {t('all')}
              </Text>
            </TouchableOpacity>

            {EXERCISE_CATEGORIES.map(category => (
              <TouchableOpacity
                key={`quick-category-${category.id}`}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id
                    ? { backgroundColor: workoutPalette.highlight }
                    : { backgroundColor: palette.input_background, borderColor: palette.border }
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <Ionicons 
                  name={category.iconName || 'fitness-outline'} 
                  size={16}
                  color={selectedCategory === category.id ? '#FFFFFF' : palette.text_tertiary}
                  style={styles.categoryChipIcon}
                />
                <Text style={[
                  styles.categoryChipText,
                  { color: selectedCategory === category.id ? '#FFFFFF' : palette.text_tertiary }
                ]}>
                  {t(category.displayNameKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Filter panel */}
          {renderFilterPanel()}
          
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
              renderItem={renderExerciseItem}
              keyExtractor={item => `exercise-${item.id}`}
              style={styles.exerciseList}
              contentContainerStyle={styles.exerciseListContent}
              ListEmptyComponent={renderEmptyList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '95%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
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
    fontWeight: '600',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
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
});

export default ExerciseSelector;