// hooks/useWorkoutTemplates.js (Refactored)
import { useState, useEffect } from 'react';
import { workoutService } from '../../../api/services';

/**
 * Hook for managing workout templates
 * 
 * @returns {Object} Workout templates state and operations
 */
export const useWorkoutTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches workout templates from the API
   * 
   * @returns {Promise<Array>} Fetched templates
   */
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const fetchedTemplates = await workoutService.getTemplates();
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

  /**
   * Creates a new workout template
   * 
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  const createTemplate = async (templateData) => {
    try {
      const newTemplate = await workoutService.createTemplate(templateData);
      await fetchTemplates();
      return newTemplate;
    } catch (err) {
      console.error('Failed to create template:', err);
      throw err;
    }
  };

  /**
   * Updates an existing workout template
   * 
   * @param {number|string} templateId - Template ID
   * @param {Object} updates - Template updates
   * @returns {Promise<Object>} Updated template
   */
  const updateTemplate = async (templateId, updates) => {
    try {
      const updatedTemplate = await workoutService.updateTemplate(templateId, updates);
      await fetchTemplates();
      return updatedTemplate;
    } catch (err) {
      console.error('Failed to update template:', err);
      console.error('Error details:', err.response?.data || err.message);
      throw err;
    }
  };

  /**
   * Deletes a workout template
   * 
   * @param {number|string} templateId - Template ID
   * @returns {Promise<void>}
   */
  const deleteTemplate = async (templateId) => {
    try {
      await workoutService.deleteTemplate(templateId);
      setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
    } catch (err) {
      console.error('Failed to delete template:', err);
      throw err;
    }
  };

  // Fetch templates on mount
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