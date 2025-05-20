// api/services/programService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

interface Exercise {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order: number;
  sets: Array<{
    id?: number;
    reps: number;
    weight: number;
    rest_time: number;
    order: number;
  }>;
}

interface Workout {
  id?: number;
  name: string;
  description?: string;
  split_method?: string;
  preferred_weekday: number;
  difficulty_level?: string;
  equipment_required?: string[];
  estimated_duration?: number;
  tags?: string[];
  order?: number;
  program?: number;
  exercises?: Exercise[];
}

interface Program {
  id: number;
  name: string;
  description: string;
  creator_id: number;
  creator_username: string;
  is_public: boolean;
  is_active: boolean;
  is_owner: boolean;
  is_shared_with_me: boolean;
  forked_from: number | null;
  workouts: Workout[];
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface Share {
  id?: number;
  username: string;
  shared_with_id?: number;
  shared_with_username?: string;
}

interface ShareData {
  content: string;
  programDetails?: any;
}

/**
 * Service for workout programs API operations
 */
const programService = {
  searchUsers: async (query: string): Promise<any[]> => {
    const response = await apiClient.get(`/users/search/?q=${query}`);
    return extractData(response);
  },
  getUserPrograms: async (userId?: number): Promise<Program[]> => {
    // Get programs created by a specific user (or current user if no userId)
    const url = userId 
      ? `/workouts/programs/?filter=created&user_id=${userId}`
      : '/workouts/programs/?filter=created';
    const response = await apiClient.get(url);
    return extractData(response);
  },
  getSharedPrograms: async (): Promise<Program[]> => {
    // Get programs shared with current user
    const response = await apiClient.get('/workouts/programs/?filter=shared');
    return extractData(response);
  },
  getPublicPrograms: async (): Promise<Program[]> => {
    // Get public programs
    const response = await apiClient.get('/workouts/programs/?filter=public');
    return extractData(response);
  },
  getAllPrograms: async (): Promise<Program[]> => {
    // Get all programs relevant to the user (created, shared, public)
    const response = await apiClient.get('/workouts/programs/?filter=all');
    return extractData(response);
  },

  // You can update or keep your existing getPrograms method
  getPrograms: async (): Promise<Program[]> => {
    // This now directly calls the new getUserPrograms method
    return programService.getUserPrograms();
  },

  getProgramById: async (id: number): Promise<Program> => {
    const response = await apiClient.get(`/workouts/programs/${id}/`);
    return response.data;
  },

  createProgram: async (programData: Partial<Program>): Promise<Program> => {
    // Create the program first
    const response = await apiClient.post('/workouts/programs/', programData);
    const createdProgram = response.data;
    
    // Process shares if any
    if ('shares' in programData && programData.shares && programData.shares.length > 0) {
      const sharePromises = programData.shares.map((share: Share) => 
        apiClient.post(`/workouts/programs/${createdProgram.id}/share/`, {
          username: share.username
        })
      );
      
      await Promise.all(sharePromises);
    }
    
    return createdProgram;
  },

  updateProgram: async (id: number, updates: Partial<Program>): Promise<Program> => {
    // Update the program basic info
    const response = await apiClient.patch(`/workouts/programs/${id}/`, updates);
    const updatedProgram = response.data;
    
    // Handle shares if they were included in the update
    if ('shares' in updates && updates.shares) {
      // Get existing shares first
      const existingSharesResponse = await apiClient.get(`/workouts/programs/${id}/shares/`);
      const existingShares = extractData(existingSharesResponse);
      
      // Add new shares
      const existingUsernames = existingShares.map((share: Share) => share.shared_with_username);
      const sharesToAdd = updates.shares.filter((share: Share) => 
        !existingUsernames.includes(share.username)
      );
      
      for (const share of sharesToAdd) {
        await apiClient.post(`/workouts/programs/${id}/share/`, {
          username: share.username
        });
      }
      
      // Remove shares no longer in the list
      const updatedUsernames = updates.shares.map((share: Share) => share.username);
      const sharesToRemove = existingShares.filter((share: Share) =>
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

  getProgramShares: async (programId: number): Promise<Share[]> => {
    const response = await apiClient.get(`/workouts/programs/${programId}/shares/`);
    return extractData(response);
  },

  getCurrentUser: async (): Promise<any> => {
    const response = await apiClient.get('/users/me/');
    return response.data;
  },

  deleteProgram: async (id: number): Promise<void> => {
    await apiClient.delete(`/workouts/programs/${id}/`);
  },

  toggleProgramActive: async (id: number): Promise<Program> => {
    const response = await apiClient.post(`/workouts/programs/${id}/toggle_active/`);
    return response.data;
  },

  addWorkoutToProgram: async (programId: number, templateId: number, weekday: number): Promise<Workout> => {
    const response = await apiClient.post(`/workouts/programs/${programId}/add_workout/`, {
      template_id: templateId,
      preferred_weekday: weekday
    });
    return response.data;
  },

  updateProgramWorkout: async (programId: number, workoutId: number, updates: Partial<Workout>): Promise<Workout> => {
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
    const formattedUpdates: any = {
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
          reps: parseInt(String(set.reps)),
          weight: parseFloat(String(set.weight)),
          rest_time: parseInt(String(set.rest_time)),
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

  getProgramWorkout: async (programId: number, workoutId: number): Promise<Workout> => {
    const response = await apiClient.get(`/workouts/programs/${programId}/workouts/${workoutId}/`);
    return response.data;
  },

  removeWorkoutFromProgram: async (programId: number, workoutId: number): Promise<void> => {
    await apiClient.delete(`/workouts/programs/${programId}/workouts/${workoutId}/`);
  },

  shareProgram: async (programId: number, shareData: ShareData): Promise<any> => {
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

  forkProgram: async (programId: number): Promise<Program> => {
    const response = await apiClient.post(`/workouts/programs/${programId}/fork/`);
    return response.data;
  },

  getNextWorkout: (program: Program): Workout | null => {
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