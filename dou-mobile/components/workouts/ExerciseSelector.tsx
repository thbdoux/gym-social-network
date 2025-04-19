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
  ActivityIndicator
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
  FilterCriteria 
} from './data/exerciseData';

type ExerciseSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseName: string) => void;
  theme?: 'light' | 'dark';
  recentExercises?: string[]; // Array of recently used exercise IDs
};

const ExerciseSelector = ({ 
  visible, 
  onClose, 
  onSelectExercise, 
  theme = 'dark',
  recentExercises = []
}: ExerciseSelectorProps) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<('beginner' | 'intermediate' | 'advanced')[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // UI Animation state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [modalVisible, setModalVisible] = useState(visible);
  const filterPanelHeight = useState(new Animated.Value(0))[0];
  const modalOpacity = useState(new Animated.Value(0))[0];
  const modalTranslate = useState(new Animated.Value(100))[0];
  
  // Theme colors
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#111827' : '#FFFFFF',
    card: theme === 'dark' ? '#1F2937' : '#F3F4F6',
    text: theme === 'dark' ? '#FFFFFF' : '#1F2937',
    textSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textTertiary: theme === 'dark' ? '#4B5563' : '#9CA3AF',
    border: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    highlight: '#0ea5e9',
    accent: theme === 'dark' ? '#8B5CF6' : '#6D28D9',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B'
  }), [theme]);
  
  // Handle visibility changes from props
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslate, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, modalOpacity, modalTranslate]);
  
  // Toggle filter panel
  const toggleFilterPanel = useCallback(() => {
    const toValue = showFilterPanel ? 0 : 250; // Adjust height as needed
    
    Animated.timing(filterPanelHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setShowFilterPanel(!showFilterPanel);
  }, [showFilterPanel, filterPanelHeight]);
  
  // Handle modal close
  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslate, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      setModalVisible(false);
    });
  }, [modalOpacity, modalTranslate, onClose]);
  
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
    setSearchTerm('');
  }, []);
  
  // Toggle favorite status
  const handleToggleFavorite = useCallback((exerciseId: string) => {
    toggleFavorite(exerciseId);
    // Force re-render by updating a filter
    setSelectedCategories([...selectedCategories]);
  }, [selectedCategories]);
  
  // Handle exercise selection
  const handleSelectExercise = useCallback((exercise: any) => {
    onSelectExercise(exercise.name);
    handleClose();
  }, [onSelectExercise, handleClose]);
  
  // Handle custom exercise creation
  const handleCreateCustomExercise = useCallback(() => {
    if (!searchTerm.trim()) {
      Alert.alert(t('enter_exercise_name'), t('enter_custom_exercise_name'));
      return;
    }
    
    onSelectExercise(searchTerm.trim());
    handleClose();
  }, [searchTerm, t, onSelectExercise, handleClose]);
  
  // Filtered exercises based on all criteria
  const filteredExercises = useMemo(() => {
    // DON'T call setIsLoading here!
    
    const criteria: FilterCriteria = {
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      equipmentIds: selectedEquipment.length > 0 ? selectedEquipment : undefined,
      difficultyLevels: selectedDifficulty.length > 0 ? selectedDifficulty : undefined,
      searchQuery: searchTerm,
      favorites: showFavoritesOnly,
      language
    };
    
    const filtered = filterExercises(criteria).map(exercise => {
      // Find the category for this exercise
      const category = EXERCISE_CATEGORIES.find(cat => 
        cat.exercises.some(ex => ex.id === exercise.id)
      );
      
      // Format for component use
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
    
    // Sort by favorites first, then by recent usage, then alphabetically
    const result = filtered.sort((a, b) => {
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
    
    return result;
  }, [
    selectedCategories, 
    selectedEquipment, 
    selectedDifficulty, 
    searchTerm, 
    showFavoritesOnly,
    language,
    t,
    recentExercises
  ]);
  
  // Move loading state to useEffect
  useEffect(() => {
    setIsLoading(true);
    // This is needed to allow the component to finish rendering
    // before updating the loading state again
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [
    selectedCategories, 
    selectedEquipment, 
    selectedDifficulty, 
    searchTerm, 
    showFavoritesOnly,
    language,
    recentExercises
  ]);
  
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
  
  // Render filter panel
  const renderFilterPanel = () => (
    <Animated.View 
      style={[
        styles.filterPanel, 
        { 
          height: filterPanelHeight,
          backgroundColor: themeColors.card,
          borderColor: themeColors.border
        }
      ]}
    >
      <ScrollView style={styles.filterScroll}>
        {/* Categories section */}
        <Text style={[styles.filterSectionTitle, { color: themeColors.text }]}>
          {t('categories')}
        </Text>
        <View style={styles.filterChipContainer}>
          {EXERCISE_CATEGORIES.map(category => (
            <TouchableOpacity
              key={`filter-category-${category.id}`}
              style={[
                styles.filterChip,
                selectedCategories.includes(category.id)
                  ? { backgroundColor: themeColors.highlight }
                  : { backgroundColor: `${themeColors.card}80`, borderColor: themeColors.border }
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <Ionicons 
                name={category.iconName || 'fitness-outline'} 
                size={16} 
                color={selectedCategories.includes(category.id) ? '#FFFFFF' : themeColors.textSecondary} 
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategories.includes(category.id)
                    ? { color: '#FFFFFF' }
                    : { color: themeColors.textSecondary }
                ]}
              >
                {t(category.displayNameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Equipment section */}
        <Text style={[styles.filterSectionTitle, { color: themeColors.text }]}>
          {t('equipment')}
        </Text>
        <View style={styles.filterChipContainer}>
          {EQUIPMENT_TYPES.map(equipment => (
            <TouchableOpacity
              key={`filter-equipment-${equipment.id}`}
              style={[
                styles.filterChip,
                selectedEquipment.includes(equipment.id)
                  ? { backgroundColor: themeColors.accent }
                  : { backgroundColor: `${themeColors.card}80`, borderColor: themeColors.border }
              ]}
              onPress={() => toggleEquipment(equipment.id)}
            >
              <Ionicons 
                name={equipment.iconName || 'fitness-outline'} 
                size={16} 
                color={selectedEquipment.includes(equipment.id) ? '#FFFFFF' : themeColors.textSecondary} 
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedEquipment.includes(equipment.id)
                    ? { color: '#FFFFFF' }
                    : { color: themeColors.textSecondary }
                ]}
              >
                {t(equipment.nameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Difficulty section */}
        <Text style={[styles.filterSectionTitle, { color: themeColors.text }]}>
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
                  : { backgroundColor: `${themeColors.card}80`, borderColor: themeColors.border }
              ]}
              onPress={() => toggleDifficulty(difficulty.id as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedDifficulty.includes(difficulty.id as any)
                    ? { color: '#FFFFFF' }
                    : { color: themeColors.textSecondary }
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
              : { backgroundColor: `${themeColors.card}80`, borderColor: themeColors.border }
          ]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons 
            name={showFavoritesOnly ? 'star' : 'star-outline'} 
            size={18} 
            color={showFavoritesOnly ? '#FFFFFF' : themeColors.textSecondary} 
          />
          <Text
            style={[
              styles.favoritesToggleText,
              showFavoritesOnly
                ? { color: '#FFFFFF' }
                : { color: themeColors.textSecondary }
            ]}
          >
            {t('show_favorites_only')}
          </Text>
        </TouchableOpacity>
        
        {/* Reset filters button */}
        <TouchableOpacity
          style={[styles.resetFiltersButton, { backgroundColor: `${themeColors.danger}20` }]}
          onPress={resetFilters}
        >
          <Ionicons name="refresh" size={18} color={themeColors.danger} />
          <Text style={[styles.resetFiltersText, { color: themeColors.danger }]}>
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
        <Text style={[styles.resultsCount, { color: themeColors.textSecondary }]}>
          {filteredExercises.length === 1 
            ? t('single_exercise_found') 
            : t('multiple_exercises_found', { count: filteredExercises.length })}
        </Text>
        {totalFilters > 0 && (
          <View style={styles.activeFiltersContainer}>
            <Text style={[styles.activeFiltersText, { color: themeColors.textSecondary }]}>
              {t('active_filters', { count: totalFilters })}
            </Text>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={resetFilters}
            >
              <Text style={[styles.clearFiltersText, { color: themeColors.highlight }]}>
                {t('clear_all')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  if (!modalVisible) return null;
  
  return (
    <Modal
      visible={true}
      transparent={true}
      onRequestClose={handleClose}
      animationType="none"
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: modalOpacity }
        ]}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              backgroundColor: themeColors.background,
              transform: [{ translateY: modalTranslate }]
            }
          ]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {t('select_exercise')}
            </Text>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerActionButton, { backgroundColor: showFilterPanel ? `${themeColors.highlight}30` : 'transparent' }]}
                onPress={toggleFilterPanel}
              >
                <Ionicons 
                  name="options-outline" 
                  size={20} 
                  color={showFilterPanel ? themeColors.highlight : themeColors.text} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Search bar */}
          <View style={[styles.searchContainer, { backgroundColor: themeColors.card }]}>
            <Ionicons name="search" size={16} color={themeColors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={t('search_exercises')}
              placeholderTextColor={themeColors.textTertiary}
              selectionColor={themeColors.highlight}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchTerm('')}
              >
                <Ionicons name="close" size={14} color={themeColors.textSecondary} />
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
                selectedCategories.length === 0 && styles.categoryTabSelected,
                { borderColor: themeColors.border }
              ]}
              onPress={() => setSelectedCategories([])}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategories.length === 0 && styles.categoryTabTextSelected,
                { color: selectedCategories.length === 0 ? themeColors.highlight : themeColors.textSecondary }
              ]}>
                {t('all')}
              </Text>
            </TouchableOpacity>
            
            {EXERCISE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  selectedCategories.includes(category.id) && styles.categoryTabSelected,
                  { borderColor: themeColors.border }
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
                <Ionicons 
                  name={category.iconName || 'fitness-outline'} 
                  size={16}
                  color={selectedCategories.includes(category.id) ? themeColors.highlight : themeColors.textSecondary}
                  style={styles.categoryTabIcon}
                />
                <Text style={[
                  styles.categoryTabText,
                  selectedCategories.includes(category.id) && styles.categoryTabTextSelected,
                  { color: selectedCategories.includes(category.id) ? themeColors.highlight : themeColors.textSecondary }
                ]}>
                  {t(category.displayNameKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Filter panel */}
          {renderFilterPanel()}
          
          {/* Exercises list */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.highlight} />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.exerciseListModal}
              ListHeaderComponent={renderListHeader}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.exerciseItemModal, { borderBottomColor: themeColors.border }]}
                  onPress={() => handleSelectExercise(item)}
                >
                  <View style={styles.exerciseItemContent}>
                    <View style={styles.exerciseIconContainer}>
                      <Ionicons 
                        name={item.iconName || 'fitness-outline'} 
                        size={24} 
                        color={themeColors.highlight} 
                      />
                    </View>
                    
                    <View style={styles.exerciseDetails}>
                      <View style={styles.exerciseNameRow}>
                        <Text style={[styles.exerciseItemText, { color: themeColors.text }]}>
                          {item.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.favoriteButton}
                          onPress={() => handleToggleFavorite(item.id)}
                        >
                          <Ionicons 
                            name={item.favorite ? 'star' : 'star-outline'} 
                            size={20} 
                            color={item.favorite ? '#FFD700' : themeColors.textSecondary} 
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.exerciseTags}>
                        {item.equipment && (
                          <View style={[
                            styles.exerciseTag, 
                            { backgroundColor: `${themeColors.accent}30` }
                          ]}>
                            <Text style={[styles.exerciseTagText, { color: themeColors.accent }]}>
                              {item.equipment}
                            </Text>
                          </View>
                        )}
                        {item.muscle_group && (
                          <View style={[
                            styles.exerciseTag, 
                            { backgroundColor: `${themeColors.highlight}30` }
                          ]}>
                            <Text style={[styles.exerciseTagText, { color: themeColors.highlight }]}>
                              {item.muscle_group}
                            </Text>
                          </View>
                        )}
                        {renderDifficultyBadge(item.difficulty)}
                        {recentExercises.includes(item.id) && (
                          <View style={[
                            styles.exerciseTag, 
                            { backgroundColor: `${themeColors.success}30` }
                          ]}>
                            <Text style={[styles.exerciseTagText, { color: themeColors.success }]}>
                              {t('recent')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <Ionicons name="chevron-forward" size={16} color={themeColors.textSecondary} />
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptySearch}>
                  <Ionicons 
                    name="fitness-outline" 
                    size={48} 
                    color={themeColors.textSecondary} 
                    style={styles.emptyIcon}
                  />
                  <Text style={[styles.emptySearchText, { color: themeColors.textSecondary }]}>
                    {searchTerm.length > 0 
                      ? t('no_matching_exercises') 
                      : selectedCategories.length > 0 || selectedEquipment.length > 0 || selectedDifficulty.length > 0
                        ? t('try_different_filters')
                        : t('no_exercises_in_category')}
                  </Text>
                  
                  {/* Custom exercise button */}
                  {searchTerm.length > 0 && (
                    <TouchableOpacity
                      style={[styles.customExerciseButton, { backgroundColor: `${themeColors.highlight}20` }]}
                      onPress={handleCreateCustomExercise}
                    >
                      <Ionicons name="add" size={16} color={themeColors.highlight} />
                      <Text style={[styles.customExerciseText, { color: themeColors.highlight }]}>
                        {t('add_custom_exercise_with_name', { name: searchTerm })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '90%',
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
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginLeft: 8,
  },
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
  categoryTabs: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryTabIcon: {
    marginRight: 4,
  },
  categoryTabSelected: {
    borderColor: 'transparent',
  },
  categoryTabText: {
    fontSize: 14,
  },
  categoryTabTextSelected: {
    fontWeight: '600',
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
  exerciseListModal: {
    paddingBottom: 20,
  },
  exerciseItemModal: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  exerciseItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIconContainer: {
    marginRight: 12,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseItemText: {
    fontSize: 16,
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  exerciseTags: {
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
    paddingVertical: 20,
  },
  emptySearch: {
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptySearchText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  customExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  customExerciseText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ExerciseSelector;