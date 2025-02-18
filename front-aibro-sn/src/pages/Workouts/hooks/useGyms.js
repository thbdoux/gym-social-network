// hooks/useGyms.js
import { useState, useEffect } from 'react';
import api from '../../../api';

export const useGyms = () => {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGyms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gyms/');
      console.log('Fetched gyms:', response.data);
      setGyms(response.data?.results || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching gyms:', err);
      setError('Failed to load gyms');
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

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