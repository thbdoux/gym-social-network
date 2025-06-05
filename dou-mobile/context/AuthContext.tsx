// context/AuthContext.tsx - Fixed version to prevent infinite loops
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  registerUser: (userData: any) => Promise<{ success: boolean; message: string }>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Enhanced guards to prevent infinite loops
  const operationLock = useRef(false);
  const mountedRef = useRef(true);
  const hasCheckedInitialAuth = useRef(false);
  const isLoggingOut = useRef(false);
  const lastAuthCheck = useRef(0);

  console.log('🔄 AuthProvider render - Auth:', isAuthenticated, 'Loading:', isLoading, 'User:', !!user);

  // Safe state setter with additional guards
  const safeSetState = useCallback((setter: Function, value: any) => {
    if (mountedRef.current && !operationLock.current) {
      setter(value);
    }
  }, []);

  // Enhanced logout function - called by auth events
  const handleLogout = useCallback(async () => {
    if (isLoggingOut.current || operationLock.current) {
      console.log('🔒 Logout already in progress or operation locked');
      return;
    }

    isLoggingOut.current = true;
    operationLock.current = true;
    console.log('🚪 AuthContext: Starting logout process...');

    try {
      // Clear all auth state immediately
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setIsLoading(false);
      
      // Clear cache in background
      setTimeout(() => {
        queryClient.clear();
      }, 0);
      
      console.log('✅ AuthContext: Logout completed');
      
    } catch (error) {
      console.error('🚨 AuthContext logout error:', error);
    } finally {
      // Reset flags after delay
      setTimeout(() => {
        isLoggingOut.current = false;
        operationLock.current = false;
      }, 500);
    }
  }, [queryClient]);

  // Register new user
  const registerUser = async (userData: any): Promise<{ success: boolean; message: string }> => {
    if (operationLock.current) {
      console.log('🔒 Operation locked, skipping register');
      return { success: false, message: 'Operation in progress' };
    }

    operationLock.current = true;
    
    try {
      safeSetState(setIsLoading, true);
      safeSetState(setError, null);
      
      await userService.register(userData);
      console.log('✅ Registration successful');
      
      return {
        success: true,
        message: "Registration successful! You can now log in."
      };
    } catch (error: any) {
      console.error('🚨 Registration error:', error);
      const errorMessage = error.response?.data?.detail || "Registration failed. Please try again.";
      safeSetState(setError, errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      safeSetState(setIsLoading, false);
      operationLock.current = false;
    }
  };

  // Enhanced initial auth check with better guards
  const checkInitialAuth = useCallback(async () => {
    const now = Date.now();
    
    // Multiple protection layers against infinite loops
    if (
      hasCheckedInitialAuth.current || 
      operationLock.current || 
      isLoggingOut.current ||
      (now - lastAuthCheck.current < 5000) // Minimum 5 seconds between checks
    ) {
      console.log('🔒 Auth check blocked - already checked or operation in progress');
      return;
    }

    hasCheckedInitialAuth.current = true;
    lastAuthCheck.current = now;
    operationLock.current = true;
    console.log('🔍 Checking initial auth (ONE TIME ONLY)...');

    try {
      const token = await SecureStore.getItemAsync('token');
      
      if (!token) {
        console.log('❌ No token found - setting unauthenticated');
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
        setIsLoading(false);
        return;
      }

      console.log('📱 Token found, attempting user verification...');
      
      // Single API call with timeout - no retries
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ API timeout - aborting auth check');
        controller.abort();
      }, 8000); // 8 second timeout

      try {
        const userData = await userService.getCurrentUser();
        clearTimeout(timeoutId);
        
        if (mountedRef.current) {
          console.log('✅ User verified successfully');
          setUser(userData);
          setIsAuthenticated(true);
          setError(null);
          
          // Cache in background
          setTimeout(() => {
            queryClient.setQueryData(userKeys.current(), userData);
          }, 0);
        }
        
      } catch (apiError: any) {
        clearTimeout(timeoutId);
        console.log('🚨 User verification failed:', apiError?.response?.status || apiError.message);
        
        // Don't handle 401/403 here - let the API interceptor handle it
        // Just clear local state
        if (mountedRef.current) {
          setUser(null);
          setIsAuthenticated(false);
          
          // Only set error if it's not a 401/403 (those are handled by interceptor)
          if (apiError?.response?.status !== 401 && apiError?.response?.status !== 403) {
            setError('Unable to verify session');
          }
        }
      }
      
    } catch (error) {
      console.error('🚨 Critical auth error:', error);
      if (mountedRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        setError('Authentication failed');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      operationLock.current = false;
      console.log('✅ Initial auth check completed');
    }
  }, [queryClient]);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    if (operationLock.current || isLoggingOut.current) {
      console.log('🔒 Login operation blocked');
      return false;
    }

    operationLock.current = true;
    setIsLoading(true);
    setError(null);
    console.log('🔐 Starting login...');

    try {
      // Clear any existing cache
      queryClient.clear();
      
      // Login API call
      const tokenData = await userService.login(username, password);
      await SecureStore.setItemAsync('token', tokenData.access);
      console.log('🔑 Token stored');

      // Get user data
      const userData = await userService.getCurrentUser();
      console.log('👤 User data received');
      
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
      
      // Cache in background
      setTimeout(() => {
        queryClient.setQueryData(userKeys.current(), userData);
      }, 0);
      
      console.log('✅ Login successful');
      return true;
      
    } catch (error: any) {
      console.error('🚨 Login failed:', error);
      
      const errorMessage = error?.response?.data?.detail || 'Login failed';
      setError(errorMessage);
      setUser(null);
      setIsAuthenticated(false);
      
      return false;
    } finally {
      setIsLoading(false);
      operationLock.current = false;
    }
  };

  // Manual logout function (for user-initiated logout)
  const manualLogout = useCallback(async () => {
    if (isLoggingOut.current || operationLock.current) {
      console.log('🔒 Manual logout blocked - operation in progress');
      return;
    }

    console.log('🚪 Manual logout initiated');
    
    // Clear token first
    try {
      await SecureStore.deleteItemAsync('token');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
    
    // Call the internal logout handler
    await handleLogout();
    
    // Navigate to login
    router.replace('/(auth)/login');
  }, [handleLogout]);

  // Auth events listener - only for automatic logout (401/403)
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((eventType) => {
      if (eventType === 'tokenExpired') {
        console.log('🔔 Token expired event received - processing logout');
        handleLogout();
      }
    });
    
    return () => unsubscribe();
  }, [handleLogout]);

  // CRITICAL: Only run auth check ONCE on mount
  useEffect(() => {
    console.log('🚀 AuthProvider mounted - running ONE-TIME auth check');
    checkInitialAuth();

    return () => {
      console.log('🔚 AuthProvider unmounting');
      mountedRef.current = false;
    };
  }, []); // Empty array - runs ONLY once!

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout: manualLogout, // Use manual logout for user-initiated actions
        setUser,
        registerUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};