// context/AuthContext.tsx - Simplified version
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import userService from '../api/services/userService';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '../hooks/query/useUserQuery';
import { authEvents } from '../api/utils/authEvents';
import { AppState } from 'react-native';

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
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Simple flags to prevent multiple operations
  const initializationComplete = useRef(false);
  const isLoggingOut = useRef(false);

  // Check auth status only once on mount
  const checkAuthStatus = useCallback(async () => {
    if (initializationComplete.current) return;
    
    console.log('🔍 Checking auth status...');
    
    try {
      const token = await SecureStore.getItemAsync('token');
      
      if (!token) {
        console.log('❌ No token found');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        initializationComplete.current = true;
        return;
      }

      console.log('📱 Token found, verifying...');
      const userData = await userService.getCurrentUser();
      
      console.log('✅ User verified');
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
      
      // Cache user data
      queryClient.setQueryData(userKeys.current(), userData);
      
    } catch (error: any) {
      console.log('🚨 Auth verification failed:', error?.response?.status);
      
      // Don't clear token here - let the API interceptor handle it with refresh
      if (error?.response?.status !== 401) {
        setError('Authentication verification failed');
      }
      
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      initializationComplete.current = true;
    }
  }, [queryClient]);

  // Handle logout from auth events (token refresh failure)
  const handleTokenExpired = useCallback(async () => {
    if (isLoggingOut.current) return;
    
    isLoggingOut.current = true;
    console.log('🚪 Token expired, logging out...');
    
    try {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      // Clear cache
      queryClient.clear();
      
    } catch (error) {
      console.error('Error during token expiry logout:', error);
    } finally {
      isLoggingOut.current = false;
    }
  }, [queryClient]);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenData = await userService.login(username, password);
      await SecureStore.setItemAsync('token', tokenData.access);
      
      // Store refresh token if available
      if (tokenData.refresh) {
        await SecureStore.setItemAsync('refreshToken', tokenData.refresh);
      }

      const userData = await userService.getCurrentUser();
      
      setUser(userData);
      setIsAuthenticated(true);
      queryClient.setQueryData(userKeys.current(), userData);
      
      return true;
      
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error?.response?.data?.detail || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Manual logout
  const logout = useCallback(async () => {
    if (isLoggingOut.current) return;
    
    isLoggingOut.current = true;
    
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('refreshToken');
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      queryClient.clear();
      router.replace('/(auth)/login');
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      isLoggingOut.current = false;
    }
  }, [queryClient]);

  // Register user
  const registerUser = async (userData: any): Promise<{ success: boolean; message: string }> => {
    try {
      await userService.register(userData);
      return { success: true, message: "Registration successful" };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.detail || "Registration failed" 
      };
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Listen for auth events
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((eventType) => {
      if (eventType === 'tokenExpired') {
        handleTokenExpired();
      }
    });
    
    return unsubscribe;
  }, [handleTokenExpired]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      // When app comes to foreground, check if user is still valid
      // but don't force re-authentication unless absolutely necessary
      if (nextAppState === 'active' && isAuthenticated && !isLoading) {
        console.log('📱 App resumed, user still authenticated');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, isLoading]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout,
        setUser,
        registerUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};