import React, { createContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, useLogin as useLoginMutation } from '../hooks/query/useUserQuery';
import { userKeys } from '../hooks/query/useUserQuery';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();
  
  // Use the react-query hook for fetching the current user
  const { 
    data: user,
    isLoading,
    error,
    refetch
  } = useCurrentUser();

  // Login mutation from the query hook
  const loginMutation = useLoginMutation();

  // Update authentication state when user data changes
  useEffect(() => {
    if (user && !error) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user, error]);

  const login = async (username, password) => {
    try {
      await loginMutation.mutateAsync({ username, password });
      // After successful login, refetch the current user
      await refetch();
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    // Invalidate and reset relevant queries
    queryClient.removeQueries({ queryKey: userKeys.current() });
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};