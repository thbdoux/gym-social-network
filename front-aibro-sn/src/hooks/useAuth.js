// src/hooks/useAuth.js
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, useLogin, userKeys } from './query/useUserQuery';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Use the React Query hooks
  const { 
    data: user,
    isLoading,
    isSuccess,
    isError, 
    error
  } = useCurrentUser();

  const loginMutation = useLogin();

  // Determine authentication status
  const isAuthenticated = isSuccess && !!user;

  // Login function - now just a wrapper around the mutation
  const login = async (username, password) => {
    try {
      await loginMutation.mutateAsync({ username, password });
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  // Logout function that clears token and invalidates queries
  const logout = () => {
    localStorage.removeItem('token');
    queryClient.clear(); // Clear all queries from cache
    navigate('/login');
  };

  // Check if user is the owner of a resource
  const isOwner = (resourceUserId) => {
    return user?.id === resourceUserId;
  };

  // Require authentication or redirect
  const requireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
      return false;
    }
    return true;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isOwner,
    requireAuth,
    error
  };
};

export default useAuth;