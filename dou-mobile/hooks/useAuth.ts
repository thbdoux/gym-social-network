// hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { router } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  if (!context) {
    throw new Error(t('auth_provider_error'));
  }

  const isOwner = (resourceUserId: number | undefined): boolean => {
    return context.user?.id === resourceUserId;
  };

  const requireAuth = (): boolean => {
    if (!context.isAuthenticated && !context.isLoading) {
      // Clear any stale data before redirecting
      queryClient.clear();
      router.replace('/login');
      return false;
    }
    return true;
  };

  return {
    ...context,
    isOwner,
    requireAuth,
  };
};