// context/AuthContext.tsx - Final fix with complete request blocking

import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import userService from '../api/services/userService';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '../hooks/query/useUserQuery';
import { authEvents } from '../api/utils/authEvents';
import { resetApiClient, setUserLoggedOut, setUserLoggedIn } from '../api/index'; // Import new functions

interface User {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  registerUser: (userData: any) => Promise<{ success: boolean; message: string }>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const initializationComplete = useRef(false);
  const isLoggingOut = useRef(false);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔄 AuthContext state:', { 
      isAuthenticated, 
      isLoading, 
      isInitialized, 
      hasUser: !!user,
      error: !!error 
    });
  }, [isAuthenticated, isLoading, isInitialized, user, error]);

  // ENHANCED logout function with complete request blocking
  const performLogout = useCallback(async (reason = 'Manual logout') => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    
    console.log('🚪 AuthContext logout:', reason);
    
    try {
      // STEP 1: IMMEDIATELY block all API requests
      console.log('🚫 Blocking all API requests...');
      setUserLoggedOut();
      
      // STEP 2: Update auth state immediately
      console.log('🔒 Updating auth state...');
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setIsLoading(true);
      
      // STEP 3: Cancel ALL ongoing queries and mutations
      console.log('🛑 Cancelling all queries and mutations...');
      await queryClient.cancelQueries();
      // await queryClient.cancelMutations();
      
      // STEP 4: Clear tokens
      console.log('🗑️ Clearing secure tokens...');
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('refreshToken');
      
      // STEP 5: Wait for any remaining requests to fail/complete
      console.log('⏳ Waiting for request cleanup...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // STEP 6: Clear all query cache
      console.log('🧹 Clearing query cache...');
      queryClient.clear();
      queryClient.removeQueries();
      
      // STEP 7: Reset query client completely
      await queryClient.resetQueries();
      
      // STEP 8: Reset API client state
      console.log('🔄 Resetting API client...');
      resetApiClient();
      
      // STEP 9: Final state update
      console.log('✅ Finalizing logout state...');
      setIsInitialized(true);
      setIsLoading(false);
      
      // STEP 10: Extra cleanup delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ AuthContext logout completed successfully');
      
    } catch (error) {
      console.error('❌ Error during AuthContext logout:', error);
      
      // Emergency cleanup
      setUserLoggedOut();
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setIsInitialized(true);
      setIsLoading(false);
      
      try {
        await queryClient.cancelQueries();
        queryClient.clear();
        resetApiClient();
      } catch (cleanupError) {
        console.error('❌ Emergency cleanup error:', cleanupError);
      }
    } finally {
      isLoggingOut.current = false;
    }
  }, [queryClient]);

  // Enhanced login function
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mark user as logged in to allow API requests
      setUserLoggedIn();
      
      const tokenData = await userService.login(username, password);
      await SecureStore.setItemAsync('token', tokenData.access);
      
      if (tokenData.refresh) {
        await SecureStore.setItemAsync('refreshToken', tokenData.refresh);
      }

      const userData = await userService.getCurrentUser();
      
      setUser(userData);
      setIsAuthenticated(true);
      setIsInitialized(true);
      setError(null);
      queryClient.setQueryData(userKeys.current(), userData);
      
      return true;
      
    } catch (error: any) {
      console.error('Login failed:', error);
      setUserLoggedOut(); // Block requests on login failure
      setError(error?.response?.data?.detail || 'Login failed');
      setIsInitialized(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  // Enhanced manual logout with proper timing
  const logout = useCallback(async () => {
    console.log('🚪 Manual logout initiated');
    
    try {
      // Perform logout and wait for complete cleanup
      await performLogout('Manual logout');
      
      // Extra delay to ensure all cleanup is absolutely complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate after everything is cleaned up
      console.log('🚀 Navigating to login after complete cleanup...');
      router.replace('/(auth)/login');
      
    } catch (error) {
      console.error('❌ Manual logout error:', error);
      // Force navigation with longer delay
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1000);
    }
  }, [performLogout]);

  // Check auth status with login state management
  const checkAuthStatus = useCallback(async () => {
    if (initializationComplete.current) return;
    
    console.log('🔍 AuthContext checking auth status...');
    setIsLoading(true);
    setIsInitialized(false);
    
    try {
      const token = await SecureStore.getItemAsync('token');
      
      if (!token) {
        console.log('❌ No token found in AuthContext');
        setUserLoggedOut(); // Block requests if no token
        setIsAuthenticated(false);
        setUser(null);
        setError(null);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      console.log('📱 Token found, verifying user...');
      setUserLoggedIn(); // Allow requests for verification
      
      const userData = await userService.getCurrentUser();
      
      if (userData && typeof userData === 'object' && 
          (userData.code === 'token_not_valid' || userData.detail || userData.error)) {
        console.log('🚨 Token verification returned error object:', userData);
        throw new Error(`Token validation failed: ${userData.detail || userData.error || 'Invalid token'}`);
      }
      
      if (!userData || !userData.id || !userData.username) {
        console.log('🚨 Invalid user data structure:', userData);
        throw new Error('Invalid user data received');
      }
      
      console.log('✅ User verified in AuthContext:', userData);
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
      queryClient.setQueryData(userKeys.current(), userData);
      
    } catch (error: any) {
      console.log('🚨 Auth verification failed in AuthContext:', error?.response?.status, error?.response?.data);
      
      setUserLoggedOut(); // Block requests on auth failure
      
      if (error?.response?.status === 401 || error?.response?.data?.code === 'token_not_valid') {
        console.log('🧹 Token invalid - clearing auth state immediately');
        
        try {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('refreshToken');
        } catch (clearError) {
          console.error('Error clearing tokens:', clearError);
        }
        
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
        queryClient.clear();
      } else {
        setError('Authentication verification failed');
        setUser(null);
        setIsAuthenticated(false);
      }
      
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      initializationComplete.current = true;
    }
  }, [queryClient]);

  // Register user function
  const registerUser = useCallback(async (userData: any): Promise<{ success: boolean; message: string }> => {
    try {
      await userService.register(userData);
      return { success: true, message: "Registration successful" };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.detail || "Registration failed" 
      };
    }
  }, []);

  // Handle token expired event
  const handleTokenExpired = useCallback(async () => {
    console.log('🚨 AuthContext received tokenExpired event');
    await performLogout('Token expired');
  }, [performLogout]);

  // Exposed setUser function
  const setUserCallback = useCallback((newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      setIsAuthenticated(true);
      setUserLoggedIn();
      queryClient.setQueryData(userKeys.current(), newUser);
    } else {
      setIsAuthenticated(false);
      setUserLoggedOut();
      queryClient.removeQueries({ queryKey: userKeys.current() });
    }
  }, [queryClient]);

  // Initialize auth on mount
  useEffect(() => {
    checkAuthStatus();
    
    const failsafeTimer = setTimeout(() => {
      if (!initializationComplete.current) {
        console.log('⚠️ Auth initialization timeout, forcing completion');
        setIsLoading(false);
        setIsInitialized(true);
        setIsAuthenticated(false);
        setUser(null);
        setUserLoggedOut();
        initializationComplete.current = true;
      }
    }, 10000);
    
    return () => clearTimeout(failsafeTimer);
  }, [checkAuthStatus]);

  // Listen for auth events
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((eventType) => {
      if (eventType === 'tokenExpired') {
        console.log('🚨 AuthContext received tokenExpired event from API interceptor');
        handleTokenExpired();
      }
    });
    
    return unsubscribe;
  }, [handleTokenExpired]);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    logout,
    setUser: setUserCallback,
    registerUser,
    error,
  }), [user, isAuthenticated, isLoading, isInitialized, error, login, logout, setUserCallback, registerUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};