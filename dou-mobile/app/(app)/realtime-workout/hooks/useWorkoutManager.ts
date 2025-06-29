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

interface PendingSuperset {
  groupId: string;
  exerciseIndex: number;
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
  
  // Superset state
  const [pendingSuperset, setPendingSuperset] = useState<PendingSuperset | null>(null);

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
    
    // Check if we're adding an exercise to a pending superset
    if (pendingSuperset) {
      return addExerciseToSuperset(exercise, pendingSuperset);
    }
    
    const effortType = exercise.effort_type || 'reps';
    const weightUnit = exercise.weight_unit || 'kg';
    
    const newExercise = {
      ...exercise,
      id: exercise.id || generateUniqueId(),
      effort_type: effortType,
      weight_unit: weightUnit,
      equipment: exercise.equipment || '',
      sets: exercise.sets || [createDefaultSet(effortType, 0, null, weightUnit)]
    };
    
    const updatedExercises = [...activeWorkout.exercises, newExercise];
    await updateWorkout({ 
      exercises: updatedExercises,
      currentExerciseIndex: activeWorkout.exercises.length
    });
    setSelectingExercise(false);
  };

  const addExerciseToSuperset = async (exercise: any, supersetInfo: PendingSuperset) => {
    if (!activeWorkout) return;
    
    const effortType = exercise.effort_type || 'reps';
    const weightUnit = exercise.weight_unit || 'kg';
    
    const newExercise = {
      ...exercise,
      id: exercise.id || generateUniqueId(),
      effort_type: effortType,
      weight_unit: weightUnit,
      equipment: exercise.equipment || '',
      superset_group: supersetInfo.groupId,
      is_superset: true,
      superset_rest_time: 90,
      sets: exercise.sets || [createDefaultSet(effortType, 0, null, weightUnit)]
    };
    
    // Insert the new exercise right after the superset partner
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises.splice(supersetInfo.exerciseIndex + 1, 0, newExercise);
    
    // Update the original exercise's superset_with field
    updatedExercises[supersetInfo.exerciseIndex] = {
      ...updatedExercises[supersetInfo.exerciseIndex],
      superset_with: newExercise.id
    };
    
    await updateWorkout({ exercises: updatedExercises });
    setSelectingExercise(false);
    setPendingSuperset(null);
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
    
    // If this exercise is part of a superset, handle superset cleanup
    if (exerciseToDelete.superset_group) {
      await handleSupersetDeletion(exerciseToDelete.superset_group, exerciseIndex);
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

  const handleSupersetDeletion = async (supersetGroupId: string, exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const supersetExercises = activeWorkout.exercises.filter((ex: any) => 
      ex.superset_group === supersetGroupId
    );
    
    if (supersetExercises.length === 2) {
      // If only 2 exercises in superset, remove superset properties from the remaining one
      const updatedExercises = activeWorkout.exercises.map((ex: any, index: number) => {
        if (index === exerciseIndex) {
          // This is the exercise being deleted, so skip it
          return null;
        } else if (ex.superset_group === supersetGroupId) {
          // Remove superset properties from the remaining exercise
          const { superset_group, is_superset, superset_rest_time, superset_with, ...exerciseWithoutSuperset } = ex;
          return exerciseWithoutSuperset;
        }
        return ex;
      }).filter(Boolean); // Remove null entries
      
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
    } else {
      // More than 2 exercises in superset, just remove this one
      const updatedExercises = [...activeWorkout.exercises];
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
    }
  };

  const removeExerciseFromSuperset = async (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const exercise = activeWorkout.exercises[exerciseIndex];
    if (!exercise.superset_group) return;
    
    const supersetGroupId = exercise.superset_group;
    const supersetExercises = activeWorkout.exercises.filter((ex: any) => 
      ex.superset_group === supersetGroupId
    );
    
    if (supersetExercises.length === 2) {
      // If only 2 exercises, remove superset from both
      const updatedExercises = activeWorkout.exercises.map((ex: any) => {
        if (ex.superset_group === supersetGroupId) {
          const { superset_group, is_superset, superset_rest_time, superset_with, ...exerciseWithoutSuperset } = ex;
          return exerciseWithoutSuperset;
        }
        return ex;
      });
      
      await updateWorkout({ exercises: updatedExercises });
    } else {
      // More than 2 exercises, just remove this one from superset
      const updatedExercises = [...activeWorkout.exercises];
      const { superset_group, is_superset, superset_rest_time, superset_with, ...exerciseWithoutSuperset } = exercise;
      updatedExercises[exerciseIndex] = exerciseWithoutSuperset;
      
      await updateWorkout({ exercises: updatedExercises });
    }
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

  // Superset utility functions
  const getExerciseSuperset = (exerciseIndex: number) => {
    if (!activeWorkout || !activeWorkout.exercises[exerciseIndex]) return null;
    
    const exercise = activeWorkout.exercises[exerciseIndex];
    if (!exercise.superset_group) return null;
    
    const supersetExercises = activeWorkout.exercises
      .map((ex, index) => ({ exercise: ex, index }))
      .filter(({ exercise: ex }) => ex.superset_group === exercise.superset_group);
    
    return {
      groupId: exercise.superset_group,
      exercises: supersetExercises,
      currentIndex: supersetExercises.findIndex(({ index }) => index === exerciseIndex)
    };
  };

  const getNextExerciseInSuperset = (exerciseIndex: number): number | null => {
    const superset = getExerciseSuperset(exerciseIndex);
    if (!superset) return null;
    
    const nextIndex = (superset.currentIndex + 1) % superset.exercises.length;
    return superset.exercises[nextIndex].index;
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
    
    // Superset state
    pendingSuperset,
    setPendingSuperset,
    
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
    addExerciseToSuperset,
    updateExercise,
    deleteExercise,
    removeExerciseFromSuperset,
    
    // Superset utilities
    getExerciseSuperset,
    getNextExerciseInSuperset,
    
    // Config
    config
  };
};