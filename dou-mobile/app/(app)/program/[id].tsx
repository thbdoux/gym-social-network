// app/(app)/program/[id].tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Modal,
  Animated,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
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

// Components
import { AnimatedHeader } from './components/AnimatedHeader';
import WorkoutCard from '../../../components/workouts/WorkoutCard';
import { LoadingState } from '../workout-log/components/LoadingState';
import { ErrorState } from '../workout-log/components/ErrorState';
import TemplateSelectionBottomSheet from '../../../components/workouts/TemplateSelectionBottomSheet';

export default function ProgramDetailScreen() {
  // Get program ID from route params
  const params = useLocalSearchParams();
  
  // Extract ID with fallbacks
  const rawId = params.id;
  
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
  
  // Get theme context
  const { programPalette, palette } = useTheme();
  
  // Animation setup with dynamic header height
  const scrollY = useRef(new Animated.Value(0)).current;
  const [dynamicHeaderHeight, setDynamicHeaderHeight] = useState(320);
  
  // Create dynamic theme colors
  const COLORS = {
    primary: programPalette.background,
    secondary: programPalette.highlight,
    tertiary: programPalette.border,
    background: palette.page_background,
    card: "#1F2937",
    text: {
      primary: programPalette.text,
      secondary: programPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.5)"
    },
    border: programPalette.border,
    success: "#22c55e",
    danger: "#EF4444",
    highlight: programPalette.highlight
  };
  
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedWorkouts, setSelectedWorkouts] = useState<number[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  
  // Hooks
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { data: program, isLoading, error, refetch } = useProgram(programId);
  const { data: templates = [], isLoading: templatesLoading } = useWorkoutTemplates();
  const { mutateAsync: updateProgramWorkout } = useUpdateProgramWorkout();
  const { mutateAsync: addWorkoutToProgram } = useAddWorkoutToProgram();
  const { mutateAsync: removeWorkoutFromProgram } = useRemoveWorkoutFromProgram();
  const { mutateAsync: toggleProgramActive } = useToggleProgramActive();
  const { mutateAsync: updateProgram } = useUpdateProgram();
  const { mutateAsync: deleteProgram } = useDeleteProgram();
  const { mutateAsync: forkProgram } = useForkProgram();
  
  // Check if current user is the program creator
  const isCreator = program?.creator_username === user?.username;
  const canEdit = isCreator;
  const canView = !!program;
  
  // Handle header height changes
  const handleHeaderHeightChange = useCallback((height: number) => {
    setDynamicHeaderHeight(height);
  }, []);
  
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
  
  // Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle saving individual program field
  const handleSaveProgramField = async (field: string, value: any) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      const updates = { [field]: value };
      
      await updateProgram({
        id: programId,
        updates: updates
      });
      await refetch();
    } catch (error) {
      console.error(`Failed to update program ${field}:`, error);
      Alert.alert(t('error'), t('failed_to_update_program'));
    }
  };

  // Handle deleting the program
  const handleDeleteProgram = () => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_delete'));
      return;
    }
    
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

  // Handle edit mode
  const handleEditMode = () => {
    setEditMode(true);
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
  const handleAddWorkout = async (template: any) => {
    if (selectedWeekday === null) {
      Alert.alert(t('error'), t('select_day_first'));
      return;
    }
    
    try {
      await addWorkoutToProgram({
        programId,
        templateId: template.id,
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
  
  // Get filtered workouts for selected day
  const getWorkoutsForDay = (day: number | null) => {
    if (!program || !program.workouts) return [];
    
    if (day === null) {
      return program.workouts;
    } else {
      return program.workouts.filter(workout => workout.preferred_weekday === day);
    }
  };
  
  const filteredWorkouts = getWorkoutsForDay(selectedWeekday);
  
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

  // Convert hex to RGB for rgba strings
  const hexToRgb = (hex) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  };
  
  // Render loading state
  if (isLoading) {
    return <LoadingState colors={COLORS} t={t} />;
  }
  
  // Render error state if there's an error or no access
  if (error || !program || !canView) {
    return (
      <ErrorState 
        colors={COLORS} 
        t={t} 
        onBack={() => router.back()} 
        error={error}
      />
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Safe Area with Header Colors */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.safeAreaGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        </SafeAreaView>
      </LinearGradient>
      
      {/* Animated Header */}
      <AnimatedHeader
        scrollY={scrollY}
        program={program}
        colors={COLORS}
        isCreator={isCreator}
        language={language}
        onDeleteProgram={handleDeleteProgram}
        onFieldUpdate={handleSaveProgramField}
        onToggleActive={handleToggleActive}
        onFork={handleFork}
        onEditMode={handleEditMode}
        editMode={editMode}
        onSaveProgram={handleSaveProgram}
        onCancelEdit={handleCancelEdit}
        programName={programName}
        setProgramName={setProgramName}
        programDescription={programDescription}
        setProgramDescription={setProgramDescription}
        programFocus={programFocus}
        setProgramFocus={setProgramFocus}
        programDifficulty={programDifficulty}
        setProgramDifficulty={setProgramDifficulty}
        programSessionsPerWeek={programSessionsPerWeek}
        setProgramSessionsPerWeek={setProgramSessionsPerWeek}
        programEstimatedWeeks={programEstimatedWeeks}
        setProgramEstimatedWeeks={setProgramEstimatedWeeks}
        onHeaderHeightChange={handleHeaderHeightChange}
        t={t}
      />
      
      {/* Main Content */}
      <Animated.ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={[
          styles.contentContainer, 
          { paddingTop: dynamicHeaderHeight + 16 }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Weekly Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>{t('weekly_schedule')}</Text>
          
          {/* Compact Schedule Preview */}
          <View style={[styles.compactSchedule, { 
            backgroundColor: 'rgba(31, 41, 55, 0.5)' 
          }]}>
            {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map((day, index) => {
              const hasWorkout = program.workouts?.some(w => w.preferred_weekday === index);
              const isSelected = selectedWeekday === index;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayColumn,
                    isSelected && {
                      backgroundColor: `rgba(${hexToRgb(COLORS.primary)}, 0.2)`
                    }
                  ]}
                  onPress={() => setSelectedWeekday(isSelected ? null : index)}
                >
                  <Text style={[
                    styles.dayText,
                    { color: COLORS.text.secondary },
                    isSelected && { color: COLORS.text.primary }
                  ]}>
                    {day}
                  </Text>
                  <View style={[
                    styles.dayIndicator,
                    hasWorkout ? 
                      { backgroundColor: COLORS.text.primary } : 
                      { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                  ]} />
                  
                  {hasWorkout && (
                    <Text style={[styles.workoutCount, { color: COLORS.text.primary }]}>
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
                  <Text style={[styles.cancelSelectionText, { color: COLORS.text.primary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                
                <Text style={[styles.selectionCount, { color: COLORS.text.primary }]}>
                  {selectedWorkouts.length} {t('selected')}
                </Text>
                
                <View style={styles.selectionActions}>
                  {selectedWorkouts.length > 0 && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={confirmDelete}
                    >
                      <Ionicons name="trash-outline" size={22} color={COLORS.text.primary} />
                    </TouchableOpacity>
                  )}
                  
                  {selectedWorkouts.length === 0 ? (
                    <TouchableOpacity 
                      style={styles.selectAllButton}
                      onPress={selectAllWorkouts}
                    >
                      <Text style={[styles.selectAllText, { color: COLORS.text.primary }]}>{t('select_all')}</Text>
                    </TouchableOpacity>
                  ) : selectedWorkouts.length < filteredWorkouts.length ? (
                    <TouchableOpacity 
                      style={styles.selectAllButton}
                      onPress={selectAllWorkouts}
                    >
                      <Text style={[styles.selectAllText, { color: COLORS.text.primary }]}>{t('select_all')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.selectAllButton}
                      onPress={deselectAllWorkouts}
                    >
                      <Text style={[styles.selectAllText, { color: COLORS.text.primary }]}>{t('deselect_all')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              // Normal header
              <>
                <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>
                  {selectedWeekday !== null 
                    ? `${
                        [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')][selectedWeekday]
                      }`
                    : t('all_workouts')}
                </Text>
                
                <View style={styles.workoutActions}>
                  {selectedWeekday !== null && (
                    <TouchableOpacity
                      style={[styles.clearFilterButton, { 
                        backgroundColor: `rgba(${hexToRgb(COLORS.primary)}, 0.15)`,
                        borderColor: `rgba(${hexToRgb(COLORS.primary)}, 0.3)`
                      }]}
                      onPress={() => setSelectedWeekday(null)}
                    >
                      <Text style={[styles.clearFilterText, { color: COLORS.text.secondary }]}>{t('show_all')}</Text>
                    </TouchableOpacity>
                  )}
                  
                  {isCreator && !editMode && (
                    <TouchableOpacity
                      style={[styles.addWorkoutButton, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}
                      onPress={handleAddWorkoutClick}
                    >
                      <Ionicons name="add" size={18} color={COLORS.primary} />
                      <Text style={[styles.addWorkoutText, { color: COLORS.primary }]}>{t('add_workout')}</Text>
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
            <View style={[styles.emptyState, { backgroundColor: 'rgba(31, 41, 55, 0.4)' }]}>
              <Text style={[styles.emptyStateText, { color: COLORS.text.secondary }]}>
                {selectedWeekday !== null
                  ? t('no_workouts_for_day')
                  : t('no_workouts_in_program')}
              </Text>
              
              {isCreator && !editMode && !selectionMode && (
                <TouchableOpacity
                  style={[styles.emptyStateButton, { 
                    backgroundColor: `rgba(${hexToRgb(COLORS.primary)}, 0.15)`,
                    borderColor: `rgba(${hexToRgb(COLORS.primary)}, 0.3)`
                  }]}
                  onPress={handleAddWorkoutClick}
                >
                  <Text style={[styles.emptyStateButtonText, { color: COLORS.text.secondary }]}>{t('add_first_workout')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
      
      {/* Day Selector Modal */}
      <Modal
        visible={showDaySelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDaySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            borderColor: 'rgba(75, 85, 99, 0.3)'
          }]}>
            <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
            
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <Text style={[styles.modalTitle, { color: COLORS.text.primary }]}>{t('select_day')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDaySelector(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </LinearGradient>
            
            <View style={[styles.daySelector, { backgroundColor: 'rgba(31, 41, 55, 0.8)' }]}>
              {[t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.daySelectorItem}
                  onPress={() => handleDaySelect(index)}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.dayGradient}
                  >
                    <Text style={[styles.daySelectText, { color: COLORS.text.primary }]}>{day}</Text>
                    
                    {program.workouts?.some(w => w.preferred_weekday === index) && (
                      <View style={[styles.hasWorkoutsIndicator, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                        <Text style={[styles.workoutCountText, { color: COLORS.text.primary }]}>
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
      
      {/* Template Selection Bottom Sheet */}
      <TemplateSelectionBottomSheet
        visible={showTemplateSelector}
        onClose={() => {
          setShowTemplateSelector(false);
        }}
        onTemplateSelected={handleAddWorkout}
        templates={templates}
        templatesLoading={templatesLoading}
        user={user}
        themePalette={{
          page_background: COLORS.background,
          border: COLORS.border,
          text: COLORS.text.primary,
          text_secondary: COLORS.text.secondary,
          highlight: COLORS.highlight
        }}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            borderColor: 'rgba(75, 85, 99, 0.3)'
          }]}>
            <BlurView intensity={40} tint="dark" style={styles.modalBlur} />
            
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>{t('confirm_delete')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={cancelDelete}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
            
            <View style={[styles.deleteConfirmContent, { backgroundColor: 'rgba(31, 41, 55, 0.8)' }]}>
              <Text style={[styles.deleteConfirmText, { color: COLORS.text.primary }]}>
                {t('delete_confirm_message', { 
                  count: selectedWorkouts.length,
                  type: selectedWorkouts.length === 1 ? t('workout') : t('workouts')
                })}
              </Text>
              
              <View style={styles.deleteButtons}>
                <TouchableOpacity 
                  style={[styles.cancelDeleteButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                  onPress={cancelDelete}
                >
                  <Text style={[styles.cancelDeleteText, { color: COLORS.text.primary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmDeleteButton, { backgroundColor: COLORS.danger }]}
                  onPress={handleDeleteSelectedWorkouts}
                >
                  <Text style={styles.confirmDeleteText}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    zIndex: 1001,
  },
  safeArea: {
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
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
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
  },
  dayColumn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  dayIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  workoutCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Workouts Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    borderWidth: 1,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  addWorkoutText: {
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
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 80,
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
  },
  modalCloseButton: {
    padding: 4,
  },
  
  // Day Selector Styles
  daySelector: {
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
  },
  hasWorkoutsIndicator: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  workoutCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Template Selector Styles - now handled by TemplateSelectionBottomSheet
  
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
    fontSize: 16,
  },
  selectionCount: {
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
    fontSize: 14,
  },
  
  // Delete confirmation styles
  deleteConfirmContent: {
    padding: 20,
  },
  deleteConfirmText: {
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
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelDeleteText: {
    fontWeight: 'bold',
  },
  confirmDeleteButton: {
    flex: 1,
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