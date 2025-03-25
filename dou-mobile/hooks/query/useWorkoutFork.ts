// hooks/useWorkoutFork.ts
import { useState } from 'react';
import { useCreateWorkoutTemplate } from './useWorkoutQuery';

interface Exercise {
  name: string;
  equipment?: string;
  notes?: string;
  sets: Array<{
    reps: number;
    weight: number;
    rest_time: number;
  }>;
  [key: string]: any;
}

interface WorkoutLog {
  name: string;
  notes?: string;
  exercises: Exercise[];
  duration?: number;
  [key: string]: any;
}

interface WorkoutTemplate {
  id?: number;
  name: string;
  description: string;
  split_method: string;
  difficulty_level: string;
  estimated_duration: number;
  equipment_required: string[];
  tags: string[];
  is_public: boolean;
  exercises?: Exercise[];
  [key: string]: any;
}

export const useWorkoutFork = () => {
  const [isForking, setIsForking] = useState(false);
  const [forkSuccess, setForkSuccess] = useState(false);
  const [hasForked, setHasForked] = useState(false);
  const [showForkWarning, setShowForkWarning] = useState(false);

  const { mutateAsync: createTemplate } = useCreateWorkoutTemplate();

  // Convert a workout log to template format
  const convertLogToTemplate = (log: WorkoutLog): WorkoutTemplate => {
    // Create the template object
    const templateData: WorkoutTemplate = {
      name: `Fork of ${log.name}`,
      description: log.notes || '',
      split_method: 'custom', // Default split method
      is_public: false,
      difficulty_level: 'intermediate', // Default difficulty
      estimated_duration: log.duration || 60,
      equipment_required: [],
      tags: []
    };

    // Convert exercises
    if (log.exercises && log.exercises.length > 0) {
      // Extract equipment required from exercises
      const equipmentSet = new Set<string>();
      
      // Process exercises
      templateData.exercises = log.exercises.map((exercise, index) => {
        if (exercise.equipment) {
          equipmentSet.add(exercise.equipment);
        }

        // Convert exercise sets
        const sets = exercise.sets?.map((set, setIndex) => ({
          reps: set.reps,
          weight: set.weight || 0,
          rest_time: set.rest_time || 60,
          order: setIndex
        })) || [];

        return {
          name: exercise.name,
          equipment: exercise.equipment || '',
          notes: exercise.notes || '',
          order: index,
          sets
        };
      });

      // Add collected equipment to template
      templateData.equipment_required = Array.from(equipmentSet);
    }

    return templateData;
  };

  const forkWorkout = async (log: WorkoutLog, existingTemplates: WorkoutTemplate[] = []) => {
    if (isForking) return;

    // Check if already forked
    const templateName = `Fork of ${log.name}`;
    const alreadyForked = existingTemplates.some(template => 
      template.name === templateName
    );

    // If already forked, show warning first
    if (alreadyForked && !showForkWarning) {
      setShowForkWarning(true);
      setHasForked(true);
      return;
    }
    
    try {
      setIsForking(true);
      
      // Convert log to template format
      const templateData = convertLogToTemplate(log);
      
      // Create new template
      await createTemplate(templateData);
      
      setForkSuccess(true);
      setShowForkWarning(false);
      setHasForked(true);
      
      setTimeout(() => setForkSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to fork workout:', err);
    } finally {
      setIsForking(false);
    }
  };

  const cancelFork = () => {
    setShowForkWarning(false);
  };

  return {
    isForking,
    forkSuccess,
    hasForked,
    showForkWarning,
    forkWorkout,
    cancelFork
  };
};