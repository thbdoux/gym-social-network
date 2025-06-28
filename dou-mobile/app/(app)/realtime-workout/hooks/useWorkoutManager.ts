// hooks/useWorkoutManager.ts - Centralized workout state management
import { useState, useEffect } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useCurrentUser } from '../../../../hooks/query/useUserQuery';
import { useGyms } from '../../../../hooks/query/useGymQuery';
import { useWorkoutTemplate, useWorkoutTemplates } from '../../../../hooks/query/useWorkoutQuery';
import { useProgram } from '../../../../hooks/query/useProgramQuery';
import { createDefaultSet, generateUniqueId } from '../utils/workoutUtils';

interface WorkoutManagerConfig {
  sourceType: string;
  templateId?: number | null;
  programId?: number | null;
  workoutId?: number | null;
  isResuming?: boolean;
}

interface Gym {
  id: number;
  name: string;
  location: string;
  description?: string;
  is_default?: boolean;
}

export const useWorkoutManager = (config: WorkoutManagerConfig) => {
  const { 
    activeWorkout, 
    hasActiveWorkout, 
    startWorkout, 
    updateWorkout, 
    endWorkout,
    toggleTimer
  } = useWorkout();

  // Data fetching
  const { data: currentUser } = useCurrentUser();
  const { data: gyms = [] } = useGyms();
  const { data: templates = [], isLoading: templatesLoading } = useWorkoutTemplates();
  const { data: template } = useWorkoutTemplate(config.templateId);
  const { data: program } = useProgram(config.programId);
  
  // Local state
  const [workoutName, setWorkoutName] = useState('');
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  
  // UI state
  const [selectingExercise, setSelectingExercise] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);

  // Get program workout if needed
  const programWorkout = program?.workouts?.find(w => w.id === config.workoutId);

  // Initialize workout name and gym
  useEffect(() => {
    if (config.isResuming && activeWorkout) {
      setWorkoutName(activeWorkout.name);
      if (activeWorkout.gym_id && gyms.length > 0) {
        const gym = gyms.find(g => g.id === activeWorkout.gym_id);
        if (gym) setSelectedGym(gym);
      }
    } else if (!hasActiveWorkout) {
      let initialName = '';
      if (config.sourceType === 'template' && template) {
        initialName = template.name;
      } else if (config.sourceType === 'program' && programWorkout) {
        initialName = programWorkout.name;
      }
      setWorkoutName(initialName);
    }
  }, [config.isResuming, activeWorkout, template, programWorkout, gyms]);

  // Initialize preferred gym
  useEffect(() => {
    if (currentUser?.preferred_gym_id && gyms.length > 0 && !selectedGym && !config.isResuming) {
      const preferredGym = gyms.find(gym => gym.id === currentUser.preferred_gym_id);
      if (preferredGym) {
        setSelectedGym(preferredGym);
      }
    }
  }, [currentUser, gyms, selectedGym, config.isResuming]);

  // Exercise management functions
  const addExercise = async (exercise: any) => {
    if (!activeWorkout) return;
    
    const effortType = exercise.effort_type || 'reps';
    const weightUnit = exercise.weight_unit || 'kg';
    
    const newExercise = {
      ...exercise,
      id: exercise.id || generateUniqueId(),
      effort_type: effortType,
      weight_unit: weightUnit,
      equipment: exercise.equipment || '',
      superset_group: null, // Initialize superset group as null
      sets: exercise.sets || [createDefaultSet(effortType, 0, null, weightUnit)]
    };
    
    const updatedExercises = [...activeWorkout.exercises, newExercise];
    await updateWorkout({ 
      exercises: updatedExercises,
      currentExerciseIndex: activeWorkout.exercises.length
    });
    setSelectingExercise(false);
  };

  const updateExercise = async (exerciseIndex: number, exerciseData: any) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const currentExercise = updatedExercises[exerciseIndex];
    
    // Handle effort type changes
    if (exerciseData.effort_type && exerciseData.effort_type !== currentExercise.effort_type) {
      const convertedSets = currentExercise.sets.map((set: any) => 
        convertSetToEffortType(set, exerciseData.effort_type, exerciseData.weight_unit || currentExercise.weight_unit)
      );
      
      updatedExercises[exerciseIndex] = {
        ...currentExercise,
        ...exerciseData,
        sets: convertedSets
      };
    } else {
      updatedExercises[exerciseIndex] = {
        ...currentExercise,
        ...exerciseData
      };
    }
    
    await updateWorkout({ exercises: updatedExercises });
  };

  const deleteExercise = async (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const exerciseToDelete = updatedExercises[exerciseIndex];
    
    // If exercise is part of a superset, handle superset cleanup
    if (exerciseToDelete.superset_group) {
      await cleanupSuperset(exerciseToDelete.superset_group, exerciseIndex);
      return;
    }
    
    updatedExercises.splice(exerciseIndex, 1);
    
    let newCurrentIndex = activeWorkout.currentExerciseIndex;
    if (newCurrentIndex >= exerciseIndex && newCurrentIndex > 0) {
      newCurrentIndex = newCurrentIndex - 1;
    } else if (updatedExercises.length === 0) {
      newCurrentIndex = 0;
    } else if (newCurrentIndex >= updatedExercises.length) {
      newCurrentIndex = updatedExercises.length - 1;
    }
    
    await updateWorkout({ 
      exercises: updatedExercises,
      currentExerciseIndex: newCurrentIndex
    });
  };

  // Superset management
  const createSuperset = async (exerciseIndices: number[]) => {
    if (!activeWorkout || exerciseIndices.length < 2) return;
    
    const supersetId = generateUniqueId();
    const updatedExercises = [...activeWorkout.exercises];
    
    exerciseIndices.forEach(index => {
      if (updatedExercises[index]) {
        updatedExercises[index] = {
          ...updatedExercises[index],
          superset_group: supersetId
        };
      }
    });
    
    await updateWorkout({ exercises: updatedExercises });
  };

  const removeFromSuperset = async (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const exercise = updatedExercises[exerciseIndex];
    
    if (!exercise.superset_group) return;
    
    const supersetGroup = exercise.superset_group;
    updatedExercises[exerciseIndex] = {
      ...exercise,
      superset_group: null
    };
    
    // Check if superset still has enough exercises
    const remainingInSuperset = updatedExercises.filter(ex => 
      ex.superset_group === supersetGroup
    );
    
    if (remainingInSuperset.length < 2) {
      // Break up the superset
      updatedExercises.forEach((ex, idx) => {
        if (ex.superset_group === supersetGroup) {
          updatedExercises[idx] = { ...ex, superset_group: null };
        }
      });
    }
    
    await updateWorkout({ exercises: updatedExercises });
  };

  const addExerciseToSuperset = async (exerciseIndex: number, targetSupersetGroup: string) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      superset_group: targetSupersetGroup
    };
    
    await updateWorkout({ exercises: updatedExercises });
  };

  // Helper functions
  const convertSetToEffortType = (set: any, newEffortType: string, weightUnit: string) => {
    const baseSet = {
      ...set,
      weight_unit: weightUnit
    };

    switch (newEffortType) {
      case 'time':
        return {
          ...baseSet,
          duration: set.duration || 30,
          actual_duration: set.actual_duration || set.duration || 30,
          weight: set.weight || null,
          actual_weight: set.actual_weight || set.weight || null,
          reps: null,
          actual_reps: null,
          distance: null,
          actual_distance: null
        };
      case 'distance':
        return {
          ...baseSet,
          distance: set.distance || 100,
          actual_distance: set.actual_distance || set.distance || 100,
          duration: set.duration || null,
          actual_duration: set.actual_duration || set.duration || null,
          weight: null,
          actual_weight: null,
          reps: null,
          actual_reps: null
        };
      case 'reps':
      default:
        return {
          ...baseSet,
          reps: set.reps || 10,
          actual_reps: set.actual_reps || set.reps || 10,
          weight: set.weight || 0,
          actual_weight: set.actual_weight || set.weight || 0,
          duration: null,
          actual_duration: null,
          distance: null,
          actual_distance: null
        };
    }
  };

  const cleanupSuperset = async (supersetGroup: string, excludeIndex: number) => {
    if (!activeWorkout) return;
    
    let updatedExercises = [...activeWorkout.exercises];
    
    // Remove the exercise
    updatedExercises.splice(excludeIndex, 1);
    
    // Check remaining exercises in superset
    const remainingInSuperset = updatedExercises.filter(ex => 
      ex.superset_group === supersetGroup
    );
    
    if (remainingInSuperset.length < 2) {
      // Break up the superset
      updatedExercises = updatedExercises.map(ex => 
        ex.superset_group === supersetGroup 
          ? { ...ex, superset_group: null }
          : ex
      );
    }
    
    // Update current exercise index
    let newCurrentIndex = activeWorkout.currentExerciseIndex;
    if (newCurrentIndex >= excludeIndex && newCurrentIndex > 0) {
      newCurrentIndex = newCurrentIndex - 1;
    } else if (updatedExercises.length === 0) {
      newCurrentIndex = 0;
    } else if (newCurrentIndex >= updatedExercises.length) {
      newCurrentIndex = updatedExercises.length - 1;
    }
    
    await updateWorkout({ 
      exercises: updatedExercises,
      currentExerciseIndex: newCurrentIndex
    });
  };

  // Get superset groups
  const getSuperset = (supersetGroup: string) => {
    if (!activeWorkout) return [];
    return activeWorkout.exercises.filter(ex => ex.superset_group === supersetGroup);
  };

  const getAllSupersets = () => {
    if (!activeWorkout) return [];
    
    const supersetGroups = new Set(
      activeWorkout.exercises
        .filter(ex => ex.superset_group)
        .map(ex => ex.superset_group)
    );
    
    return Array.from(supersetGroups).map(group => ({
      id: group,
      exercises: getSuperset(group!)
    }));
  };

  return {
    // State
    workoutName,
    setWorkoutName,
    selectedGym,
    setSelectedGym,
    selectedTemplate,
    setSelectedTemplate,
    selectingExercise,
    setSelectingExercise,
    completeModalVisible,
    setCompleteModalVisible,
    gymModalVisible,
    setGymModalVisible,
    templateModalVisible,
    setTemplateModalVisible,
    
    // Data
    currentUser,
    gyms,
    templates,
    templatesLoading,
    template,
    program,
    programWorkout,
    
    // Workout context
    activeWorkout,
    hasActiveWorkout,
    startWorkout,
    updateWorkout,
    endWorkout,
    toggleTimer,
    
    // Exercise management
    addExercise,
    updateExercise,
    deleteExercise,
    
    // Superset management
    createSuperset,
    removeFromSuperset,
    addExerciseToSuperset,
    getSuperset,
    getAllSupersets,
    
    // Config
    config
  };
};