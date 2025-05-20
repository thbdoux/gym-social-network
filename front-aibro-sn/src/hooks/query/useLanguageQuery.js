// src/hooks/queries/useLanguageQuery.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../api/services';
import { userKeys } from './useUserQuery';

// Update language preference
export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (language) => userService.updateLanguagePreference(language),
    onSuccess: (data, language) => {
      // Update current user in cache with new language preference
      queryClient.setQueryData(userKeys.current(), (oldData) => {
        if (!oldData) return null;
        
        return {
          ...oldData,
          language_preference: language
        };
      });
    },
    onError: (error) => {
      console.error('Failed to update language preference:', error);
    }
  });
};