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
      console.log('AuthContext: Logging out user', user?.id);
      
      // STEP 1: Clear token
      await SecureStore.deleteItemAsync('token');
      
      // STEP 2: Update authentication state FIRST (this will trigger theme reset)
      setUser(null);
      setIsAuthenticated(false);
      
      // STEP 3: Clear all cached queries
      // First invalidate specific queries
      const allQueryKeys = [
        userKeys.all,
        userKeys.current(),
        ['posts'], 
        ['programs'],
        ['workouts'],
        ['logs'],
        ['gyms'],
        ['profilePreviews']
      ];
      
      // Invalidate each query key specifically
      allQueryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key, exact: key === userKeys.current() });
        queryClient.removeQueries({ queryKey: key, exact: key === userKeys.current() });
      });
      
      // STEP 4: Perform complete cache purge
      queryClient.clear();
      
      // STEP 5: Reset query cache
      queryClient.resetQueries();
      
      // STEP 6: Add a small delay to ensure cache operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // STEP 7: Navigate to login
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to navigate to login in case of error
      router.replace('/login');
    }
  }, [queryClient, user?.id]);

  // Load user data on mount or token change
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          try {
            // Clear cache before fetching fresh user data
            queryClient.invalidateQueries({ queryKey: userKeys.current() });
            
            const userData = await userService.getCurrentUser();
            console.log('AuthContext: Loaded user data', userData?.id);
            setUser(userData);
            setIsAuthenticated(true);
            
            // Make sure the current user query is properly set in cache
            queryClient.setQueryData(userKeys.current(), userData);
          } catch (error) {
            // If token is invalid or expired, clear it and reset auth state
            console.error('Error fetching user:', error);
            await SecureStore.deleteItemAsync('token');
            setUser(null);
            setIsAuthenticated(false);
            
            // Also clear any cached data
            queryClient.clear();
            
            // Redirect to login screen
            router.replace('/login');
          }
        } else {
          console.log('AuthContext: No token found');
          setUser(null);
          setIsAuthenticated(false);
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
      console.log('AuthContext: Logging in user', username);
      
      // STEP 1: Clear any existing cache data
      queryClient.clear();
      
      // STEP 2: Login and get token
      const tokenData = await userService.login(username, password);
      await SecureStore.setItemAsync('token', tokenData.access);
      
      // STEP 3: Clear any potentially cached queries specifically
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
      
      // Remove each specific query
      const allQueryKeys = [
        userKeys.all,
        userKeys.current(),
        ['posts'], 
        ['programs'],
        ['workouts'],
        ['logs'],
        ['gyms'],
        ['profilePreviews']
      ];
      
      allQueryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      // STEP 4: Force a fresh fetch of user data
      const userData = await userService.getCurrentUser();
      console.log('AuthContext: Fetched fresh user data', userData?.id);
      
      // STEP 5: Set user and authentication state
      setUser(userData);
      setIsAuthenticated(true);
      
      // STEP 6: Ensure current user query is properly set in cache with proper settings
      queryClient.setQueryData(userKeys.current(), userData);
      
      // STEP 7: Mark all user queries as stale to trigger refetches
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      
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