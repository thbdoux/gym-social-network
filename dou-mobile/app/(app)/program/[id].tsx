// app/(app)/program/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  TextInput,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  useProgram, 
  useUpdateProgramWorkout,
  useAddWorkoutToProgram,
  useRemoveWorkoutFromProgram,
  useToggleProgramActive,
  useUpdateProgram,
  useDeleteProgram,
  useForkProgram
} from '../../../hooks/query/useProgramQuery';
import { useWorkoutTemplates } from '../../../hooks/query/useWorkoutQuery';

// Custom components
import WorkoutCard from '../../../components/workouts/WorkoutCard';

export default function ProgramDetailScreen() {
  // Get program ID from route params
  const params = useLocalSearchParams();
  console.log("All route params:", params);
  
  // Extract ID with fallbacks
  const rawId = params.id;
  console.log("Raw ID from params:", rawId);
  
  let programId: number;
  
  // Handle different types of ID that might come through
  if (typeof rawId === 'string') {
    programId = parseInt(rawId, 10) || 0;
  } else if (typeof rawId === 'number') {
    programId = rawId;
  } else if (Array.isArray(rawId) && rawId.length > 0) {
    // Sometimes params come as arrays
    const firstId = rawId[0];
    programId = typeof firstId === 'string' ? parseInt(firstId, 10) || 0 : 
                typeof firstId === 'number' ? firstId : 0;
  } else {
    programId = 0;
  }
  
  console.log("Final programId after parsing:", programId);
  
  // State
  const [editMode, setEditMode] = useState(false);
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programFocus, setProgramFocus] = useState('');
  const [programDifficulty, setProgramDifficulty] = useState('');
  const [programSessionsPerWeek, setProgramSessionsPerWeek] = useState(0);
  const [programEstimatedWeeks, setProgramEstimatedWeeks] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedWorkouts, setSelectedWorkouts] = useState<number[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Get screen dimensions
  const screenWidth = Dimensions.get('window').width;
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: program, isLoading, refetch } = useProgram(programId);
  const { data: templates = [] } = useWorkoutTemplates();
  const { mutateAsync: updateProgramWorkout } = useUpdateProgramWorkout();
  const { mutateAsync: addWorkoutToProgram } = useAddWorkoutToProgram();
  const { mutateAsync: removeWorkoutFromProgram } = useRemoveWorkoutFromProgram();
  const { mutateAsync: toggleProgramActive } = useToggleProgramActive();
  const { mutateAsync: updateProgram } = useUpdateProgram();
  const { mutateAsync: deleteProgram } = useDeleteProgram();
  const { mutateAsync: forkProgram } = useForkProgram();
  
  // Initialize form state when program data is loaded
  useEffect(() => {
    if (program) {
      setProgramName(program.name);
      setProgramDescription(program.description || '');
      setProgramFocus(program.focus);
      setProgramDifficulty(program.difficulty_level);
      setProgramSessionsPerWeek(program.sessions_per_week);
      setProgramEstimatedWeeks(program.estimated_completion_weeks);
    }
  }, [program]);
  
  // Header animations based on scroll position
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [360, 0],
    extrapolate: 'clamp'
  });
  
  // Check if current user is the program creator
  const isCreator = program?.creator_username === user?.username;
  
  // Format focus text (convert snake_case to Title Case)
  const formatFocus = (focus: string) => {
    return focus
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Handle workout drag between days
  const handleWorkoutMove = async (workoutId: number, fromDay: number, toDay: number) => {
    try {
      await updateProgramWorkout({
        programId,
        workoutId,
        updates: { preferred_weekday: toDay }
      });
      await refetch();
    } catch (error) {
      console.error('Failed to move workout:', error);
      Alert.alert(t('error'), t('failed_to_move_workout'));
    }
  };
  
  // Open day selector before adding a workout
  const handleAddWorkoutClick = () => {
    setShowDaySelector(true);
  };
  
  // Handle day selection and proceed to template selection
  const handleDaySelect = (day: number) => {
    setSelectedWeekday(day);
    setShowDaySelector(false);
    setShowTemplateSelector(true);
  };
  
  // Handle adding a workout template to the program
  const handleAddWorkout = async (templateId: number) => {
    if (selectedWeekday === null) {
      Alert.alert(t('error'), t('select_day_first'));
      return;
    }
    
    try {
      await addWorkoutToProgram({
        programId,
        templateId,
        weekday: selectedWeekday
      });
      setShowTemplateSelector(false);
      await refetch();
    } catch (error) {
      console.error('Failed to add workout:', error);
      Alert.alert(t('error'), t('failed_to_add_workout'));
    }
  };
  
  // Handle removing a workout from the program
  const handleRemoveWorkout = async (workoutId: number) => {
    Alert.alert(
      t('remove_workout'),
      t('confirm_remove_workout'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('remove'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWorkoutFromProgram({
                programId,
                workoutId
              });
              await refetch();
            } catch (error) {
              console.error('Failed to remove workout:', error);
              Alert.alert(t('error'), t('failed_to_remove_workout'));
            }
          }
        }
      ]
    );
  };
  
  // Handle toggling program active state
  const handleToggleActive = async () => {
    try {
      await toggleProgramActive(programId);
      await refetch();
    } catch (error) {
      console.error('Failed to toggle active state:', error);
      Alert.alert(t('error'), t('failed_to_toggle_active'));
    }
  };
  
  // Handle saving program edits
  const handleSaveProgram = async () => {
    try {
      await updateProgram({
        id: programId,
        updates: {
          name: programName,
          description: programDescription,
          focus: programFocus,
          difficulty_level: programDifficulty,
          sessions_per_week: parseInt(programSessionsPerWeek.toString()),
          estimated_completion_weeks: parseInt(programEstimatedWeeks.toString())
        }
      });
      setEditMode(false);
      await refetch();
    } catch (error) {
      console.error('Failed to update program:', error);
      Alert.alert(t('error'), t('failed_to_update_program'));
    }
  };
  
  // Handle canceling edit mode
  const handleCancelEdit = () => {
    // Reset form to original values
    if (program) {
      setProgramName(program.name);
      setProgramDescription(program.description || '');
      setProgramFocus(program.focus);
      setProgramDifficulty(program.difficulty_level);
      setProgramSessionsPerWeek(program.sessions_per_week);
      setProgramEstimatedWeeks(program.estimated_completion_weeks);
    }
    setEditMode(false);
  };
  
  // Handle deleting the program
  const handleDeleteProgram = () => {
    Alert.alert(
      t('delete_program'),
      t('confirm_delete_program'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProgram(programId);
              router.back();
            } catch (error) {
              console.error('Failed to delete program:', error);
              Alert.alert(t('error'), t('failed_to_delete_program'));
            }
          }
        }
      ]
    );
  };
  
  // Handle forking the program
  const handleFork = async () => {
    try {
      const forkedProgram = await forkProgram(programId);
      router.replace(`/program/${forkedProgram.id}`);
    } catch (error) {
      console.error('Failed to fork program:', error);
      Alert.alert(t('error'), t('failed_to_fork_program'));
    }
  };
  
  // Get filtered workouts for selected day
  const getWorkoutsForDay = (day: number | null) => {
    if (!program || !program.workouts) return [];
    
    if (day === null) {
      return program.workouts;
    } else {
      return program.workouts.filter(workout => workout.preferred_weekday === day);
    }
  };
  
  // Filter templates by search query
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredWorkouts = getWorkoutsForDay(selectedWeekday);
  
  // Handle scroll events manually
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
  };
  
  // Selection mode handlers
  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Exit selection mode
      setSelectionMode(false);
      setSelectedWorkouts([]);
    } else {
      // Enter selection mode
      setSelectionMode(true);
    }
  };
  
  // Handle long press on workout card
  const handleWorkoutLongPress = (workoutId: number) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedWorkouts([workoutId]);
    }
  };
  
  // Toggle workout selection
  const toggleWorkoutSelection = (workoutId: number) => {
    if (selectedWorkouts.includes(workoutId)) {
      // Deselect workout
      setSelectedWorkouts(selectedWorkouts.filter(id => id !== workoutId));
    } else {
      // Select workout
      setSelectedWorkouts([...selectedWorkouts, workoutId]);
    }
  };
  
  // Select all workouts
  const selectAllWorkouts = () => {
    const allIds = filteredWorkouts.map(workout => workout.id);
    setSelectedWorkouts(allIds);
  };
  
  // Deselect all workouts
  const deselectAllWorkouts = () => {
    setSelectedWorkouts([]);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    setDeleteConfirmVisible(true);
  };
  
  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
  };
  
  // Handle delete selected workouts
  const handleDeleteSelectedWorkouts = async () => {
    try {
      // Delete selected workouts
      for (const workoutId of selectedWorkouts) {
        await removeWorkoutFromProgram({
          programId,
          workoutId
        });
      }
      await refetch();
      
      // Exit selection mode and close confirmation
      setDeleteConfirmVisible(false);
      setSelectionMode(false);
      setSelectedWorkouts([]);
    } catch (error) {
      console.error('Failed to delete workouts:', error);
      Alert.alert(t('error'), t('failed_to_remove_workouts'));
      setDeleteConfirmVisible(false);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state if program not found
  if (!program) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>{t('program_not_found')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('back_to_workouts')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {/* Fixed Header */}
      <View style={styles.fixedHeaderContainer}>
        <LinearGradient
          colors={['#7e22ce', '#9333ea']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fixedHeader}
        >
          <View style={styles.headerControls}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              {isCreator && !editMode && !selectionMode && (
                <>
                  <TouchableOpacity 
                    style={styles.headerAction}
                    onPress={() => setEditMode(true)}
                  >
                    <Ionicons name="create-outline" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.headerAction}
                    onPress={handleToggleActive}
                  >
                    <Ionicons 
                      name={program.is_active ? "checkmark-circle" : "ellipse-outline"} 
                      size={22} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.headerAction}
                    onPress={handleDeleteProgram}
                  >
                    <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}
              
              {!isCreator && !selectionMode && (
                <TouchableOpacity 
                  style={styles.forkButton}
                  onPress={handleFork}
                >
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.forkText}>{t('fork')}</Text>
                </TouchableOpacity>
              )}
              
              {editMode && (
                <>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveProgram}
                  >
                    <Text style={styles.saveButtonText}>{t('save')}</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {selectionMode && (
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={toggleSelectionMode}
                >
                  <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Program Title and Status */}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {program.name}
            </Text>
            
            {program.is_active && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{t('active')}</Text>
              </View>
            )}
          </View>
          
          {/* Program Meta Info (small text under title) */}
          <View style={styles.programMetaInfo}>
            <Text style={styles.programMetaText}>
              <Ionicons name="person" size={10} color="rgba(255, 255, 255, 0.8)" /> {program.creator_username} • 
              {formatFocus(program.focus)} • 
              {program.difficulty_level}
            </Text>
          </View>
        </LinearGradient>
      </View>
      
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingTop: 20 }}
      >
        {/* Program Description (if exists) */}
        {(editMode || program.description) && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>{t('description')}</Text>
            {editMode ? (
              <TextInput
                style={styles.descriptionInput}
                value={programDescription}
                onChangeText={setProgramDescription}
                placeholder={t('program_description')}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.descriptionText}>{program.description}</Text>
            )}
          </View>
        )}
        
        {/* Weekly Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>{t('weekly_schedule')}</Text>
          
          {/* Compact Schedule Preview */}
          <View style={styles.compactSchedule}>
            {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'),t('sun')].map((day, index) => {
              const hasWorkout = program.workouts?.some(w => w.preferred_weekday === index);
              const isSelected = selectedWeekday === index;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayColumn,
                    isSelected && styles.selectedDayColumn
                  ]}
                  onPress={() => setSelectedWeekday(isSelected ? null : index)}
                >
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText
                  ]}>
                    {day}
                  </Text>
                  <View style={[
                    styles.dayIndicator,
                    hasWorkout ? styles.activeDayIndicator : styles.inactiveDayIndicator
                  ]} />
                  
                  {hasWorkout && (
                    <Text style={styles.workoutCount}>
                      {program.workouts.filter(w => w.preferred_weekday === index).length}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Workouts Section */}
        <View style={styles.workoutsSection}>
          <View style={styles.sectionHeader}>
            {selectionMode ? (
              // Selection mode header
              <View style={styles.selectionHeader}>
                <TouchableOpacity 
                  style={styles.cancelSelectionButton}
                  onPress={toggleSelectionMode}
                >
                  <Text style={styles.cancelSelectionText}>{t('cancel')}</Text>
                </TouchableOpacity>
                
                <Text style={styles.selectionCount}>
                  {selectedWorkouts.length} {t('selected')}
                </Text>
                
                <View style={styles.selectionActions}>
                  {selectedWorkouts.length > 0 && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={confirmDelete}
                    >
                      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  
                  {selectedWorkouts.length === 0 ? (
                    <TouchableOpacity 
                      style={styles.selectAllButton}
                      onPress={selectAllWorkouts}
                    >
                      <Text style={styles.selectAllText}>{t('select_all')}</Text>
                    </TouchableOpacity>
                  ) : selectedWorkouts.length < filteredWorkouts.length ? (
                    <TouchableOpacity 
                      style={styles.selectAllButton}
                      onPress={selectAllWorkouts}
                    >
                      <Text style={styles.selectAllText}>{t('select_all')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.selectAllButton}
                      onPress={deselectAllWorkouts}
                    >
                      <Text style={styles.selectAllText}>{t('deselect_all')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              // Normal header
              <>
                <Text style={styles.sectionTitle}>
                  {selectedWeekday !== null 
                    ? `${
                        [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'),t('sunday')][selectedWeekday]
                      }`
                    : t('all_workouts')}
                </Text>
                
                <View style={styles.workoutActions}>
                  {selectedWeekday !== null && (
                    <TouchableOpacity
                      style={styles.clearFilterButton}
                      onPress={() => setSelectedWeekday(null)}
                    >
                      <Text style={styles.clearFilterText}>{t('show_all')}</Text>
                    </TouchableOpacity>
                  )}
                  
                  {isCreator && !editMode && (
                    <TouchableOpacity
                      style={styles.addWorkoutButton}
                      onPress={handleAddWorkoutClick}
                    >
                      <Ionicons name="add" size={18} color="#7e22ce" />
                      <Text style={styles.addWorkoutText}>{t('add_workout')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
          
          {/* Workouts List */}
          {filteredWorkouts.length > 0 ? (
            <View style={styles.workoutsList}>
              {filteredWorkouts.map((workout) => (
                <View key={workout.id} style={styles.workoutCardContainer}>
                  <WorkoutCard
                    workoutId={workout.id}
                    workout={workout}
                    isTemplate={false}
                    user={user?.username}
                    // Selection mode props
                    selectionMode={selectionMode}
                    isSelected={selectedWorkouts.includes(workout.id)}
                    onSelect={() => toggleWorkoutSelection(workout.id)}
                    onLongPress={() => handleWorkoutLongPress(workout.id)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {selectedWeekday !== null
                  ? t('no_workouts_for_day')
                  : t('no_workouts_in_program')}
              </Text>
              
              {isCreator && !editMode && !selectionMode && (
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={handleAddWorkoutClick}
                >
                  <Text style={styles.emptyStateButtonText}>{t('add_first_workout')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Day Selector Modal */}
      <Modal
        visible={showDaySelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDaySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
            
            <LinearGradient
              colors={['#7e22ce', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>{t('select_day')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDaySelector(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
            
            <View style={styles.daySelector}>
              {[t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'),t('sunday')].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.daySelectorItem}
                  onPress={() => handleDaySelect(index)}
                >
                  <LinearGradient
                    colors={['#7e22ce', '#9333ea']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.dayGradient}
                  >
                    <Text style={styles.daySelectText}>{day}</Text>
                    
                    {program.workouts?.some(w => w.preferred_weekday === index) && (
                      <View style={styles.hasWorkoutsIndicator}>
                        <Text style={styles.workoutCountText}>
                          {program.workouts.filter(w => w.preferred_weekday === index).length}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Template Selector Modal */}
      <Modal
        visible={showTemplateSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTemplateSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
            
            <LinearGradient
              colors={['#7e22ce', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>
                {selectedWeekday !== null
                  ? `${t('select_template')} - ${
                    [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'),t('sunday')][selectedWeekday]
                    }`
                  : t('select_template')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowTemplateSelector(false);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
            
            {/* Search bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search_workouts')}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView style={styles.templatesList}>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <View key={template.id}>
                    {/* Use selection mode to override default navigation */}
                    <WorkoutCard
                      workoutId={template.id}
                      workout={template}
                      isTemplate={true}
                      user={user?.username}
                      selectionMode={true}
                      onSelect={() => handleAddWorkout(template.id)}
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyTemplates}>
                  <Text style={styles.emptyTemplatesText}>
                    {searchQuery.length > 0 
                      ? t('no_search_results')
                      : t('no_templates')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
            
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>{t('confirm_delete')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={cancelDelete}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
            
            <View style={styles.deleteConfirmContent}>
              <Text style={styles.deleteConfirmText}>
                {t('delete_confirm_message', { 
                  count: selectedWorkouts.length,
                  type: selectedWorkouts.length === 1 ? t('workout') : t('workouts')
                })}
              </Text>
              
              <View style={styles.deleteButtons}>
                <TouchableOpacity 
                  style={styles.cancelDeleteButton}
                  onPress={cancelDelete}
                >
                  <Text style={styles.cancelDeleteText}>{t('cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmDeleteButton}
                  onPress={handleDeleteSelectedWorkouts}
                >
                  <Text style={styles.confirmDeleteText}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 24,
  },
  
  // Fixed Header
  fixedHeaderContainer: {
    backgroundColor: '#111827',
    zIndex: 100,
  },
  fixedHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginLeft: 8,
  },
  forkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  forkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  saveButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Header Title Container (new style for inline title and active status)
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  headerTitleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  activeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  
  // Program Meta Info (new style for small text under title)
  programMetaInfo: {
    marginBottom: 4,
  },
  programMetaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Content Styles
  contentContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  
  // Description Container (moved from program details card)
  descriptionContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  descriptionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  descriptionInput: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 8,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  
  // Compact Schedule
  scheduleSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  compactSchedule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
  },
  dayColumn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  selectedDayColumn: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  dayIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  activeDayIndicator: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  inactiveDayIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  workoutCount: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // Workouts Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  workoutsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a78bfa',
  },
  addWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  addWorkoutText: {
    color: '#7e22ce',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  workoutsList: {
    marginTop: 8,
  },
  workoutCardContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  emptyState: {
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a78bfa',
  },
  bottomPadding: {
    height: 40,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  modalBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  
  // Day Selector Styles
  daySelector: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    padding: 16,
  },
  daySelectorItem: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayGradient: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daySelectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hasWorkoutsIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  workoutCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Template Selector Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.3)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    height: 40,
  },
  clearSearchButton: {
    padding: 4,
  },
  templatesList: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    padding: 16,
    maxHeight: 400,
  },
  emptyTemplates: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTemplatesText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Selection mode styles
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cancelSelectionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelSelectionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  selectionCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectAllText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  
  // Delete confirmation styles
  deleteConfirmContent: {
    padding: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelDeleteButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelDeleteText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});