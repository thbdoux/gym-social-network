import apiClient from '../index';
import { extractData } from '../utils/responseParser';

/**
 * Service for workout programs API operations
 */
const programService = {

  searchUsers: async (query) => {
    const response = await apiClient.get(`/users/search/?q=${query}`);
    return extractData(response);
  },

  // In programService.js
  getPrograms: async () => {
    const response = await apiClient.get('/workouts/programs/');
    const allPrograms = extractData(response);
    
    // Get current user info to verify ownership
    const currentUserResponse = await apiClient.get('/users/me/');
    const currentUser = currentUserResponse.data;
    
    return allPrograms
      .map(program => {
        // Ensure only the owner sees their programs as active
        if (program.is_active && program.creator_username !== currentUser.username) {
          return { ...program, is_active: false };
        }
        return program;
      })
      .filter(plan => (
        plan.is_owner || 
        plan.is_public ||
        plan.is_shared_with_me || 
        (plan.forked_from !== null)
      ));
  },

  getProgramById: async (id) => {
    const response = await apiClient.get(`/workouts/programs/${id}/`);
    return response.data;
  },

  createProgram: async (programData) => {
    // Create the program first
    const response = await apiClient.post('/workouts/programs/', programData);
    const createdProgram = response.data;
    
    // Process shares if any
    if (programData.shares && programData.shares.length > 0) {
      const sharePromises = programData.shares.map(share => 
        apiClient.post(`/workouts/programs/${createdProgram.id}/share/`, {
          username: share.username
        })
      );
      
      await Promise.all(sharePromises);
    }
    
    return createdProgram;
  },

  updateProgram: async (id, updates) => {
    // Update the program basic info
    const response = await apiClient.patch(`/workouts/programs/${id}/`, updates);
    const updatedProgram = response.data;
    
    // Handle shares if they were included in the update
    if (updates.shares) {
      // Get existing shares first
      const existingSharesResponse = await apiClient.get(`/workouts/programs/${id}/shares/`);
      const existingShares = extractData(existingSharesResponse);
      
      // Add new shares
      const existingUsernames = existingShares.map(share => share.shared_with_username);
      const sharesToAdd = updates.shares.filter(share => 
        !existingUsernames.includes(share.username)
      );
      
      for (const share of sharesToAdd) {
        await apiClient.post(`/workouts/programs/${id}/share/`, {
          username: share.username
        });
      }
      
      // Remove shares no longer in the list
      const updatedUsernames = updates.shares.map(share => share.username);
      const sharesToRemove = existingShares.filter(share =>
        !updatedUsernames.includes(share.shared_with_username)
      );
      
      for (const share of sharesToRemove) {
        await apiClient.delete(`/workouts/programs/${id}/share/`, {
          data: { username: share.shared_with_username }
        });
      }
    }
    
    return updatedProgram;
  },

  getProgramShares: async (programId) => {
    const response = await apiClient.get(`/workouts/programs/${programId}/shares/`);
    return extractData(response);
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

  // shareProgram: async (programId, shareData) => {
  //   const postData = new FormData();
  //   postData.append('content', shareData.content);
  //   postData.append('post_type', 'program');
  //   postData.append('program_id', String(programId));
    
  //   if (shareData.programDetails) {
  //     postData.append('program_details', JSON.stringify(shareData.programDetails));
  //   }
    
  //   const response = await apiClient.post('/posts/', postData);
  //   return response.data;
  // },
  shareProgram: async (programId, shareData) => {
    // Create the FormData for the post
    const postData = new FormData();
    postData.append('content', shareData.content);
    postData.append('post_type', 'program');
    postData.append('program_id', String(programId));
    
    if (shareData.programDetails) {
      postData.append('program_details', JSON.stringify(shareData.programDetails));
    }
    
    // Create the post - the backend will handle making the program public
    const response = await apiClient.post('/posts/', postData);
    
    // After sharing, fetch the latest program data to ensure we have updated public status
    await programService.getProgramById(programId);
    
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