import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
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

  // Enhanced logout function
  const performLogout = useCallback(async (reason = 'Manual logout') => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    
    console.log('🚪 AuthContext logout:', reason);
    
    try {
      // Clear tokens
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('refreshToken');
      
      // Update state immediately
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setIsInitialized(true);
      
      // Clear all cached data
      queryClient.clear();
      
      console.log('✅ AuthContext logout completed');
      
    } catch (error) {
      console.error('Error during AuthContext logout:', error);
    } finally {
      isLoggingOut.current = false;
    }
  }, [queryClient]);

  // Check auth status
  const checkAuthStatus = useCallback(async () => {
    if (initializationComplete.current) return;
    
    console.log('🔍 AuthContext checking auth status...');
    setIsLoading(true);
    setIsInitialized(false);
    
    try {
      const token = await SecureStore.getItemAsync('token');
      
      if (!token) {
        console.log('❌ No token found in AuthContext');
        setIsAuthenticated(false);
        setUser(null);
        setError(null);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      console.log('📱 Token found, verifying user...');
      const userData = await userService.getCurrentUser();
      
      // Check if the response is actually an error object
      if (userData && typeof userData === 'object' && 
          (userData.code === 'token_not_valid' || userData.detail || userData.error)) {
        console.log('🚨 Token verification returned error object:', userData);
        throw new Error(`Token validation failed: ${userData.detail || userData.error || 'Invalid token'}`);
      }
      
      // Validate that we have a proper user object
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
      
      // If token is invalid/expired, clear everything immediately
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
        // For other errors, set an error message
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

  // Handle token expired event from API interceptor
  const handleTokenExpired = useCallback(async () => {
    console.log('🚨 AuthContext received tokenExpired event');
    await performLogout('Token expired');
  }, [performLogout]);

  // Login function - wrapped in useCallback for optimization
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
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
      setError(error?.response?.data?.detail || 'Login failed');
      setIsInitialized(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  // Manual logout
  const logout = useCallback(async () => {
    await performLogout('Manual logout');
    router.replace('/(auth)/login');
  }, [performLogout]);

  // Register user - wrapped in useCallback for optimization
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

  // Exposed setUser function for external state updates
  const setUserCallback = useCallback((newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      setIsAuthenticated(true);
      queryClient.setQueryData(userKeys.current(), newUser);
    } else {
      setIsAuthenticated(false);
      queryClient.removeQueries({ queryKey: userKeys.current() });
    }
  }, [queryClient]);

  // Initialize auth on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Failsafe: if auth doesn't initialize within 10 seconds, force it
    const failsafeTimer = setTimeout(() => {
      if (!initializationComplete.current) {
        console.log('⚠️ Auth initialization taking too long, forcing completion');
        setIsLoading(false);
        setIsInitialized(true);
        setIsAuthenticated(false);
        setUser(null);
        initializationComplete.current = true;
      }
    }, 10000);
    
    return () => clearTimeout(failsafeTimer);
  }, [checkAuthStatus]);

  // Listen for auth events from API interceptor
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