// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const navigate = useNavigate();

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const isOwner = (resourceUserId) => {
    return context.user?.id === resourceUserId;
  };

  const requireAuth = () => {
    if (!context.isAuthenticated && !context.isLoading) {
      navigate('/login');
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