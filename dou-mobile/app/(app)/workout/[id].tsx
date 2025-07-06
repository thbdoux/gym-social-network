// app/(app)/workout/[id].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Keyboard,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  useWorkoutTemplate,
  useUpdateWorkoutTemplate,
  useDeleteWorkoutTemplate,
} from '../../../hooks/query/useWorkoutQuery';

// Components
import ExerciseConfigurator from '../../../components/workouts/ExerciseConfigurator';
import ExerciseSelector from '../../../components/workouts/ExerciseSelector';
import { AnimatedHeader } from './components/AnimatedHeader';
import { ExercisesList } from '../workout-log/components/ExercisesList';
import { LoadingState } from '../workout-log/components/LoadingState';
import { ErrorState } from '../workout-log/components/ErrorState';

interface WorkoutTemplateDetailScreenProps {
  overrideUserId?: number;
  overrideTemplateId?: number;
}

// Default set templates for different effort types
const getDefaultSetForEffortType = (effortType: 'reps' | 'time' | 'distance') => {
  switch (effortType) {
    case 'time':
      return {
        duration: 30,
        weight: 0,
        weight_unit: 'kg',
        rest_time: 60
      };
    case 'distance':
      return {
        distance: 1000,
        duration: 300,
        rest_time: 60
      };
    case 'reps':
    default:
      return {
        reps: 10,
        weight: 0,
        weight_unit: 'kg',
        rest_time: 60
      };
  }
};

export default function WorkoutTemplateDetailScreen({ 
  overrideUserId, 
  overrideTemplateId 
}: WorkoutTemplateDetailScreenProps = {}) {
  
  // Get theme context
  const { workoutPalette, palette } = useTheme();
  
  // Animation setup with dynamic header height
  const scrollY = useRef(new Animated.Value(0)).current;
  const [dynamicHeaderHeight, setDynamicHeaderHeight] = useState(300);
  
  // Create dynamic theme colors
  const COLORS = {
    primary: workoutPalette.background,
    secondary: workoutPalette.highlight,
    tertiary: workoutPalette.border,
    background: palette.page_background,
    card: "#1F2937",
    text: {
      primary: workoutPalette.text,
      secondary: workoutPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.5)"
    },
    border: workoutPalette.border,
    success: "#10b981",
    danger: "#ef4444"
  };
  
  const { t, language } = useLanguage();
  const { id } = useLocalSearchParams();
  const templateId = typeof id === 'string' ? parseInt(id, 10) : 0;
  
  const { user } = useAuth();

  // State for template details
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [splitMethod, setSplitMethod] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [equipmentRequired, setEquipmentRequired] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // UI state for new exercise editing
  const [exerciseConfiguratorVisible, setExerciseConfiguratorVisible] = useState(false);
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [currentEditingExercise, setCurrentEditingExercise] = useState(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(-1);
  
  // Hooks
  const { data: template, isLoading, error, refetch } = useWorkoutTemplate(templateId);
  const { mutateAsync: updateTemplate, isPending: isUpdating } = useUpdateWorkoutTemplate();
  const { mutateAsync: deleteTemplate } = useDeleteWorkoutTemplate();

  console.log(template)

  // Permission logic - only creator can edit templates
  const canEdit = template && user && (template.creator_username === user.username);
  const canView = !!template;
  const isCreator = canEdit;
  
  // Handle header height changes
  const handleHeaderHeightChange = useCallback((height: number) => {
    setDynamicHeaderHeight(height);
  }, []);
  
  // Initialize form state when template data is loaded
  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      setSplitMethod(template.split_method || '');
      setDifficultyLevel(template.difficulty_level || '');
      setEstimatedDuration(template.estimated_duration || 0);
      setEquipmentRequired(template.equipment_required || []);
      setTags(template.tags || []);
      setIsPublic(template.is_public || false);
    }
  }, [template]);
  
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

  // Handle saving individual template field
  const handleSaveTemplateField = async (field: string, value: any) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      const updates = { 
        [field]: value,
        exercises: template?.exercises || []
      };
      
      await updateTemplate({
        id: templateId,
        updates: updates
      });
      await refetch();
    } catch (error) {
      console.error(`Failed to update template ${field}:`, error);
      Alert.alert(t('error'), t('failed_to_update_template'));
    }
  };

  // Handle deleting the template
  const handleDeleteTemplate = () => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_delete'));
      return;
    }
    
    Alert.alert(
      t('delete_template'),
      t('confirm_delete_template'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTemplate(templateId);
              router.back();
            } catch (error) {
              console.error('Failed to delete template:', error);
              Alert.alert(t('error'), t('failed_to_delete_template'));
            }
          }
        }
      ]
    );
  };

  // New exercise management functions
  const handleAddNewExercise = () => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    setExerciseSelectorVisible(true);
  };

  const handleSelectExercise = (selectedExercise) => {
    const effortType = selectedExercise.effort_type || 'reps';
    const defaultSet = getDefaultSetForEffortType(effortType);
    
    const newExercise = {
      id: Date.now(),
      name: selectedExercise.name,
      equipment: selectedExercise.equipment || '',
      effort_type: effortType,
      sets: [{ 
        ...defaultSet,
        id: Date.now() + Math.floor(Math.random() * 1000)
      }],
      order: (template?.exercises?.length || 0),
      notes: selectedExercise.notes || ''
    };
    
    setCurrentEditingExercise(newExercise);
    setEditingExerciseIndex(-1); // -1 indicates new exercise
    setExerciseSelectorVisible(false);
    setExerciseConfiguratorVisible(true);
  };

  const handleEditExercise = (exercise, index) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    setCurrentEditingExercise({ ...exercise });
    setEditingExerciseIndex(index);
    setExerciseConfiguratorVisible(true);
  };

  const handleDeleteExercise = (exerciseIndex) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }

    Alert.alert(
      t('delete_exercise'),
      t('delete_exercise_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedExercises = [...(template?.exercises || [])];
              updatedExercises.splice(exerciseIndex, 1);
              
              // Update order for remaining exercises
              updatedExercises.forEach((exercise, index) => {
                exercise.order = index;
              });

              await updateTemplate({
                id: templateId,
                updates: { exercises: updatedExercises }
              });
              await refetch();
            } catch (error) {
              console.error('Failed to delete exercise:', error);
              Alert.alert(t('error'), t('failed_to_delete_exercise'));
            }
          }
        }
      ]
    );
  };

  const handleCreateSuperset = (sourceIndex) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    const exercises = template?.exercises || [];
    if (exercises.length < 2) {
      Alert.alert(t('error'), t('need_two_exercises_for_superset'));
      return;
    }

    // Show selection modal for pairing
    const availableExercises = exercises
      .map((ex, idx) => ({ ...ex, originalIndex: idx }))
      .filter((_, idx) => idx !== sourceIndex && !_.is_superset);

    Alert.alert(
      t('create_superset'),
      t('select_exercise_to_pair'),
      [
        { text: t('cancel'), style: 'cancel' },
        ...availableExercises.map((ex, idx) => ({
          text: ex.name,
          onPress: () => createSupersetPair(sourceIndex, ex.originalIndex)
        }))
      ]
    );
  };

  const createSupersetPair = async (sourceIndex, targetIndex) => {
    try {
      const updatedExercises = [...(template?.exercises || [])];
      
      // Create superset relationship
      updatedExercises[sourceIndex] = {
        ...updatedExercises[sourceIndex],
        is_superset: true,
        superset_with: updatedExercises[targetIndex].order,
        superset_rest_time: 90
      };
      
      updatedExercises[targetIndex] = {
        ...updatedExercises[targetIndex],
        is_superset: true,
        superset_with: updatedExercises[sourceIndex].order,
        superset_rest_time: 90
      };

      await updateTemplate({
        id: templateId,
        updates: { exercises: updatedExercises }
      });
      await refetch();
    } catch (error) {
      console.error('Failed to create superset:', error);
      Alert.alert(t('error'), t('failed_to_create_superset'));
    }
  };

  // Handle breaking superset
  const handleBreakSuperset = async (exerciseIndex) => {
    if (!canEdit) {
      Alert.alert(t('error'), t('no_permission_to_edit'));
      return;
    }
    
    try {
      const updatedExercises = [...(template?.exercises || [])];
      const currentExercise = updatedExercises[exerciseIndex];
      
      if (currentExercise.is_superset && currentExercise.superset_with !== null) {
        // Find the paired exercise
        const pairedExerciseIndex = updatedExercises.findIndex(
          ex => ex.order === currentExercise.superset_with
        );
        
        // Remove superset relationship from current exercise
        updatedExercises[exerciseIndex] = {
          ...currentExercise,
          is_superset: false,
          superset_with: null,
          superset_rest_time: undefined
        };
        
        // Remove superset relationship from paired exercise if found
        if (pairedExerciseIndex !== -1) {
          updatedExercises[pairedExerciseIndex] = {
            ...updatedExercises[pairedExerciseIndex],
            is_superset: false,
            superset_with: null,
            superset_rest_time: undefined
          };
        }
        
        await updateTemplate({
          id: templateId,
          updates: { exercises: updatedExercises }
        });
        await refetch();
      }
    } catch (error) {
      console.error('Failed to break superset:', error);
      Alert.alert(t('error'), t('failed_to_break_superset'));
    }
  };

  const handleSaveExercise = async (exercise) => {
    try {
      console.log('handleSaveExercise called with:', exercise);
      console.log('currentEditingExercise:', currentEditingExercise);
      console.log('editingExerciseIndex:', editingExerciseIndex);
      
      if (!exercise) {
        console.error('Exercise is undefined');
        Alert.alert(t('error'), 'Exercise data is missing');
        return;
      }
      
      const updatedExercises = [...(template?.exercises || [])];
      
      if (editingExerciseIndex === -1) {
        // Adding new exercise
        const newExercise = {
          ...exercise,
          id: exercise.id || Date.now(),
          order: updatedExercises.length
        };
        console.log('Adding new exercise:', newExercise);
        updatedExercises.push(newExercise);
      } else {
        // Updating existing exercise
        const updatedExercise = {
          ...exercise,
          id: currentEditingExercise?.id,
          order: currentEditingExercise?.order
        };
        console.log('Updating exercise at index', editingExerciseIndex, ':', updatedExercise);
        updatedExercises[editingExerciseIndex] = updatedExercise;
      }

      console.log('Final updated exercises:', updatedExercises);

      await updateTemplate({
        id: templateId,
        updates: { exercises: updatedExercises }
      });
      
      setExerciseConfiguratorVisible(false);
      setCurrentEditingExercise(null);
      setEditingExerciseIndex(-1);
      await refetch();
    } catch (error) {
      console.error('Failed to save exercise:', error);
      Alert.alert(t('error'), t('failed_to_save_exercise'));
    }
  };

  // Render loading state
  if (isLoading) {
    return <LoadingState colors={COLORS} t={t} />;
  }
  
  // Render error state if there's an error or no access
  if (error || !template || !canView) {
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
        template={template}
        colors={COLORS}
        isCreator={isCreator}
        estimatedDuration={estimatedDuration}
        onDeleteTemplate={handleDeleteTemplate}
        onFieldUpdate={handleSaveTemplateField}
        setTemplateName={setTemplateName}
        setTemplateDescription={setTemplateDescription}
        setSplitMethod={setSplitMethod}
        setDifficultyLevel={setDifficultyLevel}
        setEstimatedDuration={setEstimatedDuration}
        setEquipmentRequired={setEquipmentRequired}
        setTags={setTags}
        setIsPublic={setIsPublic}
        onHeaderHeightChange={handleHeaderHeightChange}
        t={t}
        language={language}
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
        <ExercisesList
          log={template}
          colors={COLORS}
          isCreator={isCreator}
          canEdit={canEdit}
          permissionLevel={isCreator ? 'creator' : 'viewer'}
          onAddExercise={handleAddNewExercise}
          onEditExercise={handleEditExercise}
          onDeleteExercise={handleDeleteExercise}
          onCreateSuperset={handleCreateSuperset}
          onBreakSuperset={handleBreakSuperset}
          t={t}
        />
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
      
      {/* Modals */}
      {canEdit && (
        <>
          <ExerciseSelector
            visible={exerciseSelectorVisible}
            onClose={() => setExerciseSelectorVisible(false)}
            onSelectExercise={handleSelectExercise}
          />

          {currentEditingExercise && (
            <ExerciseConfigurator
              visible={exerciseConfiguratorVisible}
              onClose={() => {
                setExerciseConfiguratorVisible(false);
                setCurrentEditingExercise(null);
                setEditingExerciseIndex(-1);
              }}
              onSave={handleSaveExercise}
              exercise={currentEditingExercise}
              isEdit={editingExerciseIndex !== -1}
            />
          )}
        </>
      )}
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
  bottomPadding: {
    height: 80,
  },
});