// hooks/useGyms.js (Refactored)
import { useState, useEffect } from 'react';
import { gymService } from '../../../api/services';

/**
 * Hook for managing gyms
 * 
 * @returns {Object} Gyms state and operations
 */
export const useGyms = () => {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches gyms from the API
   * 
   * @returns {Promise<void>}
   */
  const fetchGyms = async () => {
    try {
      setLoading(true);
      const fetchedGyms = await gymService.getGyms();
      setGyms(fetchedGyms);
      setError(null);
    } catch (err) {
      console.error('Error fetching gyms:', err);
      setError('Failed to load gyms');
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch gyms on mount
  useEffect(() => {
    fetchGyms();
  }, []);

  return {
    gyms,
    loading,
    error,
    refreshGyms: fetchGyms
  };
};