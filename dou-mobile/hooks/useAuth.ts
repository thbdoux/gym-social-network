// hooks/useAuth.ts - Fixed version to prevent infinite loops
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { router } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { t } = useLanguage();

  if (!context) {
    throw new Error(t('auth_provider_error') || 'useAuth must be used within an AuthProvider');
  }

  const isOwner = (resourceUserId: number | undefined): boolean => {
    return context.user?.id === resourceUserId;
  };

  // Simplified requireAuth that doesn't cause loops
  const requireAuth = (): boolean => {
    if (!context.isAuthenticated && !context.isLoading) {
      console.log('🚫 Authentication required, user not authenticated');
      // Don't clear cache here - it can cause loops
      // Don't redirect here - let the component handle it
      return false;
    }
    return true;
  };

  // Helper function to check if user has specific permissions
  const hasPermission = (permission: string): boolean => {
    // Add your permission logic here if needed
    return context.isAuthenticated;
  };

  // Helper function to get user role
  const getUserRole = (): string | null => {
    return context.user?.role || null;
  };

  // Helper function to check if user is verified
  const isEmailVerified = (): boolean => {
    return context.user?.email_verified || false;
  };

  return {
    // Core auth state
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,
    
    // Auth actions
    login: context.login,
    logout: context.logout,
    setUser: context.setUser,
    registerUser: context.registerUser,
    
    // Helper functions
    isOwner,
    requireAuth,
    hasPermission,
    getUserRole,
    isEmailVerified,
  };
};