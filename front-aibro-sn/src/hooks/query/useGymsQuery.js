import { useQuery } from '@tanstack/react-query';
import { gymService } from '../../api/services';
import { gymKeys } from './useGymQuery';

/**
 * Compatibility wrapper for the old useGyms hook pattern
 * @returns {Object} Legacy API for gyms management
 */
export const useGymsLegacy = () => {
  const { 
    data: gyms = [], 
    isLoading: loading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: gymKeys.lists(),
    queryFn: gymService.getGyms
  });
  
  return {
    gyms,
    loading,
    error: error?.message || null,
    refreshGyms: refetch
  };
};