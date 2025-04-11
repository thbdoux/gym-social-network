// context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import userService from '../api/services/userService';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '../hooks/query/useUserQuery';
import { authEvents } from '../api/utils/authEvents';

interface User {
  id: number;
  username: string;
  email: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Define a reusable logout function
  const handleLogout = useCallback(async () => {
    try {
      // STEP 1: Clear token
      await SecureStore.deleteItemAsync('token');
      
      // STEP 2: Clear all cached queries
      // First remove specific query categories
      const allQueryKeys = [
        userKeys.all,
        ['posts'], 
        ['programs'],
        ['workouts'],
        ['logs'],
        ['gyms'],
        ['profilePreviews']
      ];
      
      // Remove each query key specifically
      allQueryKeys.forEach(key => {
        queryClient.removeQueries({ queryKey: key, exact: false });
      });
      
      // STEP 3: Perform complete cache purge
      queryClient.clear();
      
      // STEP 4: Reset query cache
      queryClient.resetQueries();
      
      // STEP 5: Update authentication state
      setUser(null);
      setIsAuthenticated(false);
      
      // STEP 6: Add a small delay to ensure cache operations complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // STEP 7: Navigate to login
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to navigate to login in case of error
      router.replace('/login');
    }
  }, [queryClient]);

  // Load user data on mount or token change
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          try {
            const userData = await userService.getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            // If token is invalid or expired, clear it and reset auth state
            await SecureStore.deleteItemAsync('token');
            setUser(null);
            setIsAuthenticated(false);
            
            // Also clear any cached data
            queryClient.clear();
            
            // Redirect to login screen
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [queryClient]);

  // Listen for auth events
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((eventType) => {
      if (eventType === 'tokenExpired') {
        console.log('Token expired event received, logging out...');
        handleLogout();
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [handleLogout]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // STEP 1: Clear any existing cache data
      queryClient.clear();
      
      // STEP 2: Login and get token
      const tokenData = await userService.login(username, password);
      await SecureStore.setItemAsync('token', tokenData.access);
      
      // STEP 3: Clear any potentially cached queries again
      const allQueryKeys = [
        userKeys.all,
        ['posts'], 
        ['programs'],
        ['workouts'],
        ['logs'],
        ['gyms'],
        ['profilePreviews']
      ];
      
      // Remove each query key specifically
      allQueryKeys.forEach(key => {
        queryClient.removeQueries({ queryKey: key, exact: false });
      });
      
      // STEP 4: Force a fresh fetch of user data
      const userData = await userService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      
      // STEP 5: Ensure current user query is properly set in cache
      queryClient.setQueryData(userKeys.current(), userData);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = handleLogout;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout,
        setUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};