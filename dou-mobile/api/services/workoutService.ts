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

// Log interface for template creation
interface Log {
  id?: number;
  date: string;
  name: string;
  notes?: string;
  duration?: number; 
  perceived_difficulty?: number;  
  completed?: boolean;
  exercises: Exercise[];
  tags?: string[];
  [key: string]: any;
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

  // Enhanced createTemplate function in workoutService.ts

  createTemplate: async (templateData: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> => {
    try {
      // Log the data being sent for debugging
      console.log('Creating template with data:', {
        name: templateData.name,
        description: templateData.description,
        split_method: templateData.split_method,
        difficulty_level: templateData.difficulty_level,
        estimated_duration: templateData.estimated_duration,
        equipment_required: templateData.equipment_required,
        tags: templateData.tags,
        is_public: templateData.is_public,
        exerciseCount: templateData.exercises?.length || 0
      });

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
      console.log('Template created successfully:', newTemplate.id);

      // Add exercises if they exist
      if (templateData.exercises?.length) {
        console.log(`Adding ${templateData.exercises.length} exercises to template`);
        
        for (const [index, exercise] of templateData.exercises.entries()) {
          try {
            console.log(`Adding exercise ${index + 1}/${templateData.exercises.length}:`, {
              name: exercise.name,
              effort_type: exercise.effort_type,
              setCount: exercise.sets?.length || 0
            });

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
            
            console.log(`Exercise ${index + 1} added successfully`);
          } catch (exerciseError) {
            console.error(`Error adding exercise ${index + 1}:`, exerciseError);
            // Continue with other exercises even if one fails
          }
        }
      }

      console.log('Template creation completed successfully');
      return newTemplate;

    } catch (error) {
      console.error('Error in createTemplate:', error);
      
      // Enhanced error logging for debugging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request made but no response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      // Re-throw the error for the calling function to handle
      throw error;
    }
  },

  // Fixed createTemplateFromLog function in workoutService.ts

  /**
   * Create a workout template from a workout log
   */
  createTemplateFromLog: async (log: Log, templateName?: string, templateDescription?: string): Promise<WorkoutTemplate> => {
    // Extract unique equipment from exercises
    const equipmentSet = new Set<string>();
    log.exercises.forEach(exercise => {
      if (exercise.equipment && exercise.equipment.trim()) {
        equipmentSet.add(exercise.equipment.trim());
      }
    });

    // Determine difficulty level based on perceived difficulty or default to intermediate
    // Updated to match Django model choices: 'beginner', 'intermediate', 'advanced'
    const getDifficultyLevel = (perceivedDifficulty?: number) => {
      if (!perceivedDifficulty) return 'intermediate';
      if (perceivedDifficulty <= 3) return 'beginner';  // Changed from 'easy'
      if (perceivedDifficulty <= 7) return 'intermediate';  // Changed from 'medium'
      return 'advanced';  // Changed from 'hard'
    };

    const templateData: Partial<WorkoutTemplate> = {
      name: templateName || `${log.name}`,
      description: templateDescription || `Créé à partir de l'entraînement du ${log.date} : ${log.name}${log.notes ? ` - ${log.notes}` : ''}`,
      split_method: 'full_body',
      difficulty_level: getDifficultyLevel(log.perceived_difficulty),
      estimated_duration: log.duration || 60, // Default to 60 minutes if not specified
      equipment_required: Array.from(equipmentSet),
      tags: log.tags || [],
      is_public: false, // Default to private
      exercises: log.exercises.map((exercise, index) => ({
        name: exercise.name,
        equipment: exercise.equipment || '',
        notes: exercise.notes || '',
        order: index,
        effort_type: exercise.effort_type || 'reps',
        superset_with: exercise.superset_with || null,
        is_superset: exercise.is_superset || false,
        superset_rest_time: exercise.superset_rest_time,
        sets: exercise.sets.map((set, setIndex) => ({
          reps: set.reps,
          weight: set.weight,
          weight_unit: set.weight_unit || 'kg',
          duration: set.duration,
          distance: set.distance,
          rest_time: set.rest_time || 60,
          order: setIndex
        }))
      }))
    };

    try {
      return await workoutService.createTemplate(templateData);
    } catch (error) {
      // Enhanced error handling to provide more specific error information
      console.error('Error creating template from log:', error);
      
      // If it's a validation error from the backend, provide more details
      if (error.response?.status === 400) {
        const validationErrors = error.response.data;
        console.error('Validation errors:', validationErrors);
        
        // Create a more informative error message
        let errorMessage = 'Failed to create template due to validation errors:\n';
        if (typeof validationErrors === 'object') {
          Object.entries(validationErrors).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              errorMessage += `${field}: ${errors.join(', ')}\n`;
            } else {
              errorMessage += `${field}: ${errors}\n`;
            }
          });
        }
        
        const enhancedError = new Error(errorMessage);
        enhancedError.name = 'ValidationError';
        enhancedError.originalError = error;
        throw enhancedError;
      }
      
      // Re-throw other errors
      throw error;
    }
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