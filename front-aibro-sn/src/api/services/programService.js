import apiClient from '../index';
import { extractData } from '../utils/responseParser';

/**
 * Service for workout programs API operations
 */
const programService = {

  getPrograms: async () => {
    const response = await apiClient.get('/workouts/programs/');
    const allPrograms = extractData(response);
    
    // Filter programs that user owns, forked, or have been shared with them
    return allPrograms.filter(plan => (
      plan.is_owner || 
      (plan.program_shares && plan.program_shares.length > 0) || 
      (plan.forked_from !== null)
    ));
  },

  getProgramById: async (id) => {
    const response = await apiClient.get(`/workouts/programs/${id}/`);
    return response.data;
  },

  createProgram: async (programData) => {
    const response = await apiClient.post('/workouts/programs/', programData);
    return response.data;
  },

  updateProgram: async (id, updates) => {
    const response = await apiClient.patch(`/workouts/programs/${id}/`, updates);
    return response.data;
  },

   getCurrentUser: async () => {
    const response = await apiClient.get('/users/me/');
    return response.data;
  },

  deleteProgram: async (id) => {
    await apiClient.delete(`/workouts/programs/${id}/`);
  },

  toggleProgramActive: async (id) => {
    const response = await apiClient.post(`/workouts/programs/${id}/toggle_active/`);
    return response.data;
  },

  addWorkoutToProgram: async (programId, templateId, weekday) => {
    const response = await apiClient.post(`/workouts/programs/${programId}/add_workout/`, {
      template_id: templateId,
      preferred_weekday: weekday
    });
    return response.data;
  },

  updateProgramWorkout: async (programId, workoutId, updates) => {
    // Handle weekday-only updates
    if (Object.keys(updates).length === 1 && 'preferred_weekday' in updates) {
      // Get current workout data
      const currentWorkout = await programService.getProgramWorkout(programId, workoutId);
      
      // Create updated workout with just the weekday changed
      const updatedWorkout = {
        ...currentWorkout,
        preferred_weekday: updates.preferred_weekday
      };
      
      // Send the update
      const response = await apiClient.put(
        `/workouts/programs/${programId}/workouts/${workoutId}/`,
        updatedWorkout,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    }
    
    // Handle full updates
    const formattedUpdates = {
      name: updates.name,
      description: updates.description || '',
      split_method: updates.split_method,
      preferred_weekday: updates.preferred_weekday,
      difficulty_level: updates.difficulty_level,
      equipment_required: updates.equipment_required,
      estimated_duration: updates.estimated_duration,
      tags: updates.tags,
      order: updates.order,
      program: updates.program,
      exercises: updates.exercises?.map(exercise => ({
        name: exercise.name,
        equipment: exercise.equipment || '',
        notes: exercise.notes || '',
        order: exercise.order,
        sets: exercise.sets.map((set, idx) => ({
          reps: parseInt(set.reps),
          weight: parseFloat(set.weight),
          rest_time: parseInt(set.rest_time),
          order: idx
        }))
      })) || []
    };

    const response = await apiClient.put(
      `/workouts/programs/${programId}/workouts/${workoutId}/`,
      formattedUpdates,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data;
  },

  getProgramWorkout: async (programId, workoutId) => {
    const response = await apiClient.get(`/workouts/programs/${programId}/workouts/${workoutId}/`);
    return response.data;
  },

  removeWorkoutFromProgram: async (programId, workoutId) => {
    await apiClient.delete(`/workouts/programs/${programId}/workouts/${workoutId}/`);
  },

  shareProgram: async (programId, shareData) => {
    const postData = new FormData();
    postData.append('content', shareData.content);
    postData.append('post_type', 'program');
    postData.append('program_id', String(programId));
    
    if (shareData.programDetails) {
      postData.append('program_details', JSON.stringify(shareData.programDetails));
    }
    
    const response = await apiClient.post('/posts/', postData);
    return response.data;
  },

  forkProgram: async (programId) => {
    const response = await apiClient.post(`/workouts/programs/${programId}/fork/`);
    return response.data;
  },

  getNextWorkout: (program) => {
    if (!program?.workouts?.length) return null;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6 (Sunday-Saturday)

    // Find the next workout after today
    const nextWorkout = program.workouts
      .filter(w => w.preferred_weekday >= dayOfWeek)
      .sort((a, b) => a.preferred_weekday - b.preferred_weekday)[0];

    if (nextWorkout) {
      return {
        ...nextWorkout,
        workout_name: nextWorkout.name || 'Scheduled Workout',
        date: 'Next ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][nextWorkout.preferred_weekday],
        gym_name: 'Scheduled',
        duration: nextWorkout.estimated_duration || 60,
        exercise_count: nextWorkout.exercises?.length || 0
      };
    }

    // If we didn't find a workout later this week, return the first workout of next week
    if (program.workouts.length > 0) {
      const firstWorkoutNextWeek = [...program.workouts]
        .sort((a, b) => a.preferred_weekday - b.preferred_weekday)[0];
        
      return {
        ...firstWorkoutNextWeek,
        workout_name: firstWorkoutNextWeek.name || 'Scheduled Workout',
        date: 'Next ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][firstWorkoutNextWeek.preferred_weekday],
        gym_name: 'Scheduled',
        duration: firstWorkoutNextWeek.estimated_duration || 60,
        exercise_count: firstWorkoutNextWeek.exercises?.length || 0
      };
    }

    return null;
  }
};

export default programService;