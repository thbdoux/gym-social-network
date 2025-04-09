// components/workouts/utils/SupersetManager.ts
import { Exercise } from '../ExerciseConfigurator';

export class SupersetManager {
  /**
   * Create a superset between two exercises
   * @param exercises The current list of exercises
   * @param sourceIndex Index of the first exercise
   * @param targetIndex Index of the second exercise
   * @param restTime Rest time between supersets in seconds (default: 90)
   * @returns Updated list of exercises with the superset relationship
   */
  static createSuperset(
    exercises: Exercise[],
    sourceIndex: number,
    targetIndex: number,
    restTime: number = 90
  ): Exercise[] {
    if (sourceIndex === targetIndex || 
        sourceIndex < 0 || sourceIndex >= exercises.length ||
        targetIndex < 0 || targetIndex >= exercises.length) {
      return exercises; // Invalid indices
    }
    
    const updatedExercises = [...exercises];
    const sourceExercise = { ...updatedExercises[sourceIndex] };
    const targetExercise = { ...updatedExercises[targetIndex] };
    
    // Set up superset relationship
    sourceExercise.is_superset = true;
    sourceExercise.superset_with = targetExercise.order;
    sourceExercise.superset_rest_time = restTime;
    
    targetExercise.is_superset = true;
    targetExercise.superset_with = sourceExercise.order;
    targetExercise.superset_rest_time = restTime;
    
    updatedExercises[sourceIndex] = sourceExercise;
    updatedExercises[targetIndex] = targetExercise;
    
    return updatedExercises;
  }
  
  /**
   * Remove a superset relationship
   * @param exercises The current list of exercises
   * @param exerciseIndex Index of the exercise to remove from superset
   * @returns Updated list of exercises with the superset relationship removed
   */
  static removeSuperset(exercises: Exercise[], exerciseIndex: number): Exercise[] {
    if (exerciseIndex < 0 || exerciseIndex >= exercises.length) {
      return exercises; // Invalid index
    }
    
    const updatedExercises = [...exercises];
    const exercise = updatedExercises[exerciseIndex];
    
    if (!exercise.is_superset || exercise.superset_with === null || exercise.superset_with === undefined) {
      return exercises; // Not in a superset
    }
    
    // Find the paired exercise
    const pairedIndex = updatedExercises.findIndex(
      ex => ex.order === exercise.superset_with
    );
    
    // Update the paired exercise if found
    if (pairedIndex !== -1) {
      updatedExercises[pairedIndex] = {
        ...updatedExercises[pairedIndex],
        is_superset: false,
        superset_with: null,
        superset_rest_time: undefined
      };
    }
    
    // Update this exercise
    updatedExercises[exerciseIndex] = {
      ...exercise,
      is_superset: false,
      superset_with: null,
      superset_rest_time: undefined
    };
    
    return updatedExercises;
  }
  
  /**
   * Update the rest time for a superset
   * @param exercises The current list of exercises
   * @param exerciseIndex Index of an exercise in the superset
   * @param restTime New rest time value in seconds
   * @returns Updated list of exercises with the new rest time
   */
  static updateSupersetRestTime(
    exercises: Exercise[],
    exerciseIndex: number,
    restTime: number
  ): Exercise[] {
    if (exerciseIndex < 0 || exerciseIndex >= exercises.length) {
      return exercises; // Invalid index
    }
    
    const updatedExercises = [...exercises];
    const exercise = updatedExercises[exerciseIndex];
    
    if (!exercise.is_superset || exercise.superset_with === null || exercise.superset_with === undefined) {
      return exercises; // Not in a superset
    }
    
    // Update this exercise
    updatedExercises[exerciseIndex] = {
      ...exercise,
      superset_rest_time: restTime
    };
    
    // Find and update the paired exercise
    const pairedIndex = updatedExercises.findIndex(
      ex => ex.order === exercise.superset_with
    );
    
    if (pairedIndex !== -1) {
      updatedExercises[pairedIndex] = {
        ...updatedExercises[pairedIndex],
        superset_rest_time: restTime
      };
    }
    
    return updatedExercises;
  }
  
  /**
   * Get the paired exercise for an exercise in a superset
   * @param exercises The list of exercises
   * @param exerciseIndex Index of the exercise to find its pair
   * @returns The paired exercise or null if not found
   */
  static getPairedExercise(exercises: Exercise[], exerciseIndex: number): Exercise | null {
    if (exerciseIndex < 0 || exerciseIndex >= exercises.length) {
      return null; // Invalid index
    }
    
    const exercise = exercises[exerciseIndex];
    
    if (!exercise.is_superset || exercise.superset_with === null || exercise.superset_with === undefined) {
      return null; // Not in a superset
    }
    
    // Find the paired exercise
    return exercises.find(ex => ex.order === exercise.superset_with) || null;
  }
  
  /**
   * Check if an exercise is part of a superset
   * @param exercise The exercise to check
   * @returns True if the exercise is part of a superset
   */
  static isPartOfSuperset(exercise: Exercise): boolean {
    return !!exercise.is_superset && exercise.superset_with !== null && exercise.superset_with !== undefined;
  }
  
  /**
   * Reorder exercises while maintaining superset relationships
   * @param exercises The current list of exercises
   * @param fromIndex Source index to move from
   * @param toIndex Target index to move to
   * @returns Updated list of exercises with updated order values
   */
  static reorderExercises(exercises: Exercise[], fromIndex: number, toIndex: number): Exercise[] {
    if (fromIndex === toIndex || 
        fromIndex < 0 || fromIndex >= exercises.length ||
        toIndex < 0 || toIndex >= exercises.length) {
      return exercises; // Invalid indices
    }
    
    const updatedExercises = [...exercises];
    
    // Store the original exercise and its order
    const exerciseToMove = { ...updatedExercises[fromIndex] };
    const originalOrder = exerciseToMove.order;
    
    // Move the exercise
    updatedExercises.splice(fromIndex, 1);
    updatedExercises.splice(toIndex, 0, exerciseToMove);
    
    // Update order values for all exercises
    updatedExercises.forEach((exercise, index) => {
      exercise.order = index;
    });
    
    // Fix superset relationships
    updatedExercises.forEach(exercise => {
      if (exercise.superset_with !== null && exercise.superset_with !== undefined) {
        if (exercise.superset_with === originalOrder) {
          // This exercise was paired with the moved exercise
          // Update to new order
          exercise.superset_with = updatedExercises.findIndex(ex => 
            ex === exerciseToMove
          );
        } else if (exercise.superset_with > originalOrder && toIndex > fromIndex) {
          // Shift relationships down for exercises that moved up
          exercise.superset_with--;
        } else if (exercise.superset_with < originalOrder && toIndex < fromIndex) {
          // Shift relationships up for exercises that moved down
          exercise.superset_with++;
        }
      }
    });
    
    return updatedExercises;
  }
}