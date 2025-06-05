// api/services/workoutService.ts
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

interface WorkoutTemplate {
  id: number;
  name: string;
  description: string;
  split_method: string;
  difficulty_level: string;
  estimated_duration: number;
  equipment_required: string[];
  tags: string[];
  is_public: boolean;
  exercises: Exercise[];
  [key: string]: any;
}

interface Exercise {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order: number;
  effort_type?: 'reps' | 'time' | 'distance';
  effort_type_display?: string;
  superset_with?: number | null;
  is_superset?: boolean;
  superset_rest_time?: number;
  sets: Set[];
}

interface Set {
  id?: number;
  reps?: number | null;
  weight?: number | null;
  weight_unit?: 'kg' | 'lbs';
  weight_unit_display?: string;
  weight_display?: string;
  duration?: number | null;
  distance?: number | null;
  rest_time: number;
  order: number;
}

/**
 * Service for workout templates API operations
 */
const workoutService = {

  getTemplates: async (): Promise<WorkoutTemplate[]> => {
    const response = await apiClient.get('/workouts/templates/');
    return extractData(response);
  },

  getTemplateById: async (id: number): Promise<WorkoutTemplate> => {
    const response = await apiClient.get(`/workouts/templates/${id}/`);
    return response.data;
  },

  createTemplate: async (templateData: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> => {
    const response = await apiClient.post('/workouts/templates/', {
      name: templateData.name,
      description: templateData.description,
      split_method: templateData.split_method,
      difficulty_level: templateData.difficulty_level,
      estimated_duration: templateData.estimated_duration,
      equipment_required: templateData.equipment_required,
      tags: templateData.tags,
      is_public: templateData.is_public
    });

    const newTemplate = response.data;

    // Add exercises if they exist
    if (templateData.exercises?.length) {
      for (const exercise of templateData.exercises) {
        await workoutService.addExerciseToTemplate(newTemplate.id, {
          name: exercise.name,
          equipment: exercise.equipment || '',
          notes: exercise.notes || '',
          order: exercise.order,
          effort_type: exercise.effort_type || 'reps',
          superset_with: exercise.superset_with || null,
          is_superset: exercise.is_superset || false,
          sets: exercise.sets.map((set, idx) => ({
            reps: set.reps ? parseInt(String(set.reps)) : null,
            weight: set.weight ? parseFloat(String(set.weight)) : null,
            weight_unit: set.weight_unit || 'kg',
            duration: set.duration ? parseInt(String(set.duration)) : null,
            distance: set.distance ? parseFloat(String(set.distance)) : null,
            rest_time: parseInt(String(set.rest_time)) || 60,
            order: idx
          }))
        });
      }
    }

    return newTemplate;
  },

  updateTemplate: async (id: number, updates: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> => {
    // Update template basic info
    await apiClient.patch(`/workouts/templates/${id}/`, {
      name: updates.name,
      description: updates.description,
      split_method: updates.split_method,
      difficulty_level: updates.difficulty_level,
      estimated_duration: updates.estimated_duration,
      equipment_required: updates.equipment_required || [],
      tags: updates.tags || [],
      is_public: updates.is_public ?? false,
    });

    // Get existing template data to compare exercises
    const currentTemplate = await workoutService.getTemplateById(id);
    const existingExercises = currentTemplate.exercises || [];
    
    // Handle exercises
    if (updates.exercises) {
      for (const exercise of updates.exercises) {
        if (!exercise.id) {
          // New exercise - add it
          await workoutService.addExerciseToTemplate(id, {
            name: exercise.name,
            equipment: exercise.equipment || '',
            notes: exercise.notes || '',
            order: exercise.order,
            effort_type: exercise.effort_type || 'reps',
            superset_with: exercise.superset_with || null,
            is_superset: exercise.is_superset || false,
            sets: exercise.sets.map((set, setIndex) => ({
              reps: set.reps ? parseInt(String(set.reps)) : null,
              weight: set.weight ? parseFloat(String(set.weight)) : null,
              weight_unit: set.weight_unit || 'kg',
              duration: set.duration ? parseInt(String(set.duration)) : null,
              distance: set.distance ? parseFloat(String(set.distance)) : null,
              rest_time: parseInt(String(set.rest_time)) || 60,
              order: setIndex
            }))
          });
        } else {
          // Update existing exercise
          await workoutService.updateTemplateExercise(id, exercise.id, {
            name: exercise.name,
            equipment: exercise.equipment || '',
            notes: exercise.notes || '',
            order: exercise.order,
            effort_type: exercise.effort_type || 'reps',
            superset_with: exercise.superset_with || null,
            is_superset: exercise.is_superset || false,
            sets: exercise.sets.map((set, setIndex) => ({
              reps: set.reps ? parseInt(String(set.reps)) : null,
              weight: set.weight ? parseFloat(String(set.weight)) : null,
              weight_unit: set.weight_unit || 'kg',
              duration: set.duration ? parseInt(String(set.duration)) : null,
              distance: set.distance ? parseFloat(String(set.distance)) : null,
              rest_time: parseInt(String(set.rest_time)) || 60,
              order: setIndex
            }))
          });
        }
      }

      // Delete exercises that are no longer present
      const updatedExerciseIds = updates.exercises
        .map(e => e.id)
        .filter(id => id !== undefined) as number[];
        
      for (const existingExercise of existingExercises) {
        if (existingExercise.id && !updatedExerciseIds.includes(existingExercise.id)) {
          await workoutService.deleteTemplateExercise(id, existingExercise.id);
        }
      }
    }

    // Return updated template
    return await workoutService.getTemplateById(id);
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await apiClient.delete(`/workouts/templates/${id}/`);
  },

  addExerciseToTemplate: async (templateId: number, exercise: Exercise): Promise<Exercise> => {
    const response = await apiClient.post(`/workouts/templates/${templateId}/add_exercise/`, {
      name: exercise.name,
      equipment: exercise.equipment || '',
      notes: exercise.notes || '',
      order: exercise.order,
      effort_type: exercise.effort_type || 'reps',
      superset_with: exercise.superset_with || null,
      is_superset: !!exercise.is_superset,
      sets: exercise.sets.map((set, idx) => ({
        reps: set.reps ? parseInt(String(set.reps)) : null,
        weight: set.weight ? parseFloat(String(set.weight)) : null,
        weight_unit: set.weight_unit || 'kg',
        duration: set.duration ? parseInt(String(set.duration)) : null,
        distance: set.distance ? parseFloat(String(set.distance)) : null,
        rest_time: parseInt(String(set.rest_time)) || 60,
        order: idx
      }))
    });
    return response.data;
  },

  updateTemplateExercise: async (templateId: number, exerciseId: number, exercise: Exercise): Promise<Exercise> => {
    const response = await apiClient.put(`/workouts/templates/${templateId}/exercises/${exerciseId}/`, {
      name: exercise.name,
      equipment: exercise.equipment || '',
      notes: exercise.notes || '',
      order: exercise.order,
      effort_type: exercise.effort_type || 'reps',
      superset_with: exercise.superset_with || null,
      is_superset: !!exercise.is_superset,
      sets: exercise.sets.map((set, idx) => ({
        reps: set.reps ? parseInt(String(set.reps)) : null,
        weight: set.weight ? parseFloat(String(set.weight)) : null,
        weight_unit: set.weight_unit || 'kg',
        duration: set.duration ? parseInt(String(set.duration)) : null,
        distance: set.distance ? parseFloat(String(set.distance)) : null,
        rest_time: parseInt(String(set.rest_time)) || 60,
        order: idx
      }))
    });
    return response.data;
  },

  deleteTemplateExercise: async (templateId: number, exerciseId: number): Promise<void> => {
    await apiClient.delete(`/workouts/templates/${templateId}/exercises/${exerciseId}/`);
  },

  getTemplateExercises: async (templateId: number): Promise<Exercise[]> => {
    const response = await apiClient.get(`/workouts/templates/${templateId}/exercises/`);
    return response.data;
  }
};

export default workoutService;