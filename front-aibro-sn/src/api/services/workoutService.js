// src/api/services/workoutService.js
import apiClient from '../index';
import { extractData } from '../utils/responseParser';

/**
 * Service for workout templates API operations
 */
const workoutService = {

  getTemplates: async () => {
    const response = await apiClient.get('/workouts/templates/');
    return extractData(response);
  },

  getTemplateById: async (id) => {
    const response = await apiClient.get(`/workouts/templates/${id}/`);
    return response.data;
  },

  createTemplate: async (templateData) => {
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
    if (templateData.exercises?.length > 0) {
      for (const exercise of templateData.exercises) {
        await workoutService.addExerciseToTemplate(newTemplate.id, {
          name: exercise.name,
          equipment: exercise.equipment || '',
          notes: exercise.notes || '',
          order: exercise.order,
          sets: exercise.sets.map((set, idx) => ({
            reps: parseInt(set.reps) || 0,
            weight: parseFloat(set.weight) || 0,
            rest_time: parseInt(set.rest_time) || 60,
            order: idx
          }))
        });
      }
    }

    return newTemplate;
  },

  updateTemplate: async (id, updates) => {
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
            sets: exercise.sets.map((set, setIndex) => ({
              reps: parseInt(set.reps) || 0,
              weight: parseFloat(set.weight) || 0,
              rest_time: parseInt(set.rest_time) || 60,
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
            sets: exercise.sets.map((set, setIndex) => ({
              reps: parseInt(set.reps) || 0,
              weight: parseFloat(set.weight) || 0,
              rest_time: parseInt(set.rest_time) || 60,
              order: setIndex
            }))
          });
        }
      }

      // Delete exercises that are no longer present
      const updatedExerciseIds = updates.exercises.map(e => e.id).filter(Boolean);
      for (const existingExercise of existingExercises) {
        if (!updatedExerciseIds.includes(existingExercise.id)) {
          await workoutService.deleteTemplateExercise(id, existingExercise.id);
        }
      }
    }

    // Return updated template
    return await workoutService.getTemplateById(id);
  },

  deleteTemplate: async (id) => {
    await apiClient.delete(`/workouts/templates/${id}/`);
  },

  addExerciseToTemplate: async (templateId, exercise) => {
    const response = await apiClient.post(`/workouts/templates/${templateId}/add_exercise/`, {
      name: exercise.name,
      equipment: exercise.equipment || '',
      notes: exercise.notes || '',
      order: exercise.order,
      sets: exercise.sets.map((set, idx) => ({
        reps: parseInt(set.reps) || 0,
        weight: parseFloat(set.weight) || 0,
        rest_time: parseInt(set.rest_time) || 60,
        order: idx
      }))
    });
    return response.data;
  },

  updateTemplateExercise: async (templateId, exerciseId, exercise) => {
    const response = await apiClient.put(`/workouts/templates/${templateId}/exercises/${exerciseId}/`, {
      name: exercise.name,
      equipment: exercise.equipment || '',
      notes: exercise.notes || '',
      order: exercise.order,
      sets: exercise.sets.map((set, idx) => ({
        reps: parseInt(set.reps) || 0,
        weight: parseFloat(set.weight) || 0,
        rest_time: parseInt(set.rest_time) || 60,
        order: idx
      }))
    });
    return response.data;
  },

  deleteTemplateExercise: async (templateId, exerciseId) => {
    await apiClient.delete(`/workouts/templates/${templateId}/exercises/${exerciseId}/`);
  },

  getTemplateExercises: async (templateId) => {
    const response = await apiClient.get(`/workouts/templates/${templateId}/exercises/`);
    return response.data;
  }
};

export default workoutService;