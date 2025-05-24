// context/AuthContext.tsx - Version ultra-conservative pour iOS
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

  // CRITICAL: Prevent all simultaneous operations and API loops
  const operationLock = useRef(false);
  const mountedRef = useRef(true);
  const hasCheckedInitialAuth = useRef(false);

  console.log('🔄 AuthProvider render - Auth:', isAuthenticated, 'Loading:', isLoading, 'User:', !!user);

  // Safe state setter
  const safeSetState = useCallback((setter: Function, value: any) => {
    if (mountedRef.current && !operationLock.current) {
      setter(value);
    }
  }, []);

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

  // Logout function - immediate and clean
  const handleLogout = useCallback(async () => {
    if (operationLock.current) {
      console.log('🔒 Operation locked, skipping logout');
      return;
    }

    operationLock.current = true;
    console.log('🚪 Starting immediate logout...');

    try {
      // STEP 1: Clear token immediately - no await delays
      SecureStore.deleteItemAsync('token').catch(() => {}); // Fire and forget
      
      // STEP 2: Update state immediately
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      // STEP 3: Clear cache in background - no await
      setTimeout(() => {
        queryClient.clear();
      }, 0);
      
      console.log('✅ Logout completed immediately');
      
    } catch (error) {
      console.error('🚨 Logout error:', error);
    } finally {
      operationLock.current = false;
    }
  }, [queryClient]);

  // ULTRA CONSERVATIVE: Only check auth ONCE on mount, no retries, no loops
  const checkInitialAuth = useCallback(async () => {
    if (hasCheckedInitialAuth.current || operationLock.current) {
      console.log('🔒 Auth already checked or operation locked');
      return;
    }

    hasCheckedInitialAuth.current = true;
    operationLock.current = true;
    console.log('🔍 Checking initial auth (ONE TIME ONLY)...');

    try {
      const token = await SecureStore.getItemAsync('token');
      
      if (!token) {
        console.log('❌ No token found - setting unauthenticated');
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
        return;
      }

      console.log('📱 Token found, attempting ONE API call...');
      
      // ONE SINGLE API CALL with short timeout - no retries
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ API timeout - aborting');
        controller.abort();
      }, 5000); // Short 5 second timeout

      try {
        const userData = await userService.getCurrentUser();
        clearTimeout(timeoutId);
        
        console.log('✅ User data received successfully');
        setUser(userData);
        setIsAuthenticated(true);
        setError(null);
        
        // Cache in background
        setTimeout(() => {
          queryClient.setQueryData(userKeys.current(), userData);
        }, 0);
        
      } catch (apiError: any) {
        clearTimeout(timeoutId);
        console.log('🚨 API call failed:', apiError?.response?.status || apiError.message);
        
        // CRITICAL: Clear token and never retry
        SecureStore.deleteItemAsync('token').catch(() => {});
        setUser(null);
        setIsAuthenticated(false);
        
        // Set error but don't retry
        if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
          setError('Session expired');
        } else {
          setError('Unable to verify session');
        }
      }
      
    } catch (error) {
      console.error('🚨 Critical auth error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
      operationLock.current = false;
      console.log('✅ Initial auth check completed - NEVER RUNS AGAIN');
    }
  }, [queryClient]);

  // Login function - clean and simple
  const login = async (username: string, password: string): Promise<boolean> => {
    if (operationLock.current) {
      console.log('🔒 Login operation locked');
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

  // Auth events listener - but no automatic actions
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((eventType) => {
      if (eventType === 'tokenExpired') {
        console.log('🔔 Token expired event - logging out');
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
        logout: handleLogout,
        setUser,
        registerUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};