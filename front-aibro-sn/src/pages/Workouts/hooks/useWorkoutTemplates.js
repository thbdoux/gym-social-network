// hooks/useWorkoutTemplates.js
import { useState, useEffect } from 'react';
import api from '../../../api';

export const useWorkoutTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/templates/');
      const fetchedTemplates = response.data?.results || [];
      setTemplates(fetchedTemplates);
      setError(null);
      return fetchedTemplates;
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load workout templates');
      setTemplates([]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData) => {
    try {
      const response = await api.post('/workouts/templates/', {
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
          await api.post(`/workouts/templates/${newTemplate.id}/add_exercise/`, {
            name: exercise.name,
            equipment: exercise.equipment,
            notes: exercise.notes,
            order: exercise.order,
            sets: exercise.sets.map((set, idx) => ({
              reps: parseInt(set.reps),
              weight: parseFloat(set.weight),
              rest_time: parseInt(set.rest_time),
              order: idx
            }))
          });
        }
      }

      await fetchTemplates();
      return newTemplate;
    } catch (err) {
      console.error('Failed to create template:', err);
      throw err;
    }
  };

  // hooks/useWorkoutTemplates.js
  const updateTemplate = async (templateId, updates) => {
    try {
      // First update the template basic info
      const templateResponse = await api.patch(`/workouts/templates/${templateId}/`, {
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
      const currentTemplate = await api.get(`/workouts/templates/${templateId}/`);
      const existingExercises = currentTemplate.data.exercises || [];
      
      // Handle exercises
      if (updates.exercises) {
        for (const exercise of updates.exercises) {
          if (!exercise.id) {
            // New exercise - add it
            
            await api.post(`/workouts/templates/${templateId}/exercises/new/`, {
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
            await api.put(`/workouts/templates/${templateId}/exercises/${exercise.id}/`, {
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
            await api.delete(`/workouts/templates/${templateId}/exercises/${existingExercise.id}/`);
          }
        }
      }

      // Fetch updated data
      const finalTemplate = await api.get(`/workouts/templates/${templateId}/`);

      // Refresh the templates list
      await fetchTemplates();

      return finalTemplate.data;
    } catch (err) {
      console.error('Failed to update template:', err);
      console.error('Error details:', err.response?.data || err.message);
      throw err;
    }
  };


  const deleteTemplate = async (templateId) => {
    try {
      await api.delete(`/workouts/templates/${templateId}/`);
      setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
    } catch (err) {
      console.error('Failed to delete template:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates: fetchTemplates
  };
};