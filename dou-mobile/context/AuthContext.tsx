// context/AuthContext.tsx - Fixed version to prevent infinite loops
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import userService from '../api/services/userService';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '../hooks/query/useUserQuery';
import { authEvents } from '../api/utils/authEvents';
import { Platform } from 'react-native';

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

  // Refs to prevent infinite loops and multiple simultaneous operations
  const authCheckInProgress = useRef(false);
  const loginInProgress = useRef(false);
  const logoutInProgress = useRef(false);
  const mountedRef = useRef(true);
  const initialLoadComplete = useRef(false);

  // Safe state setter that checks if component is still mounted
  const safeSetState = useCallback((setter: Function, value: any) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  // Social login handler - commented out for now but keeping structure
  const handleSocialLogin = async (provider: string, token: string) => {
    try {
      console.log(`🔐 Sending ${provider} token to backend...`);
      const response = await userService.socialLogin(provider, token);
      
      if (response?.access) {
        await SecureStore.setItemAsync('token', response.access);
        safeSetState(setUser, response.user);
        safeSetState(setIsAuthenticated, true);
        safeSetState(setError, null);
        queryClient.setQueryData(userKeys.current(), response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`🚨 ${provider} login error:`, error);
      return false;
    }
  };

  // Register new user
  const registerUser = async (userData: any): Promise<{ success: boolean; message: string }> => {
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
    }
  };

  // Define a reusable logout function
  const handleLogout = useCallback(async () => {
    // Prevent multiple simultaneous logout attempts
    if (logoutInProgress.current) {
      console.log('🔒 Logout already in progress, skipping...');
      return;
    }

    logoutInProgress.current = true;
    console.log('🚪 Starting logout process...');

    try {
      // STEP 1: Clear token first
      await SecureStore.deleteItemAsync('token');
      console.log('🗑️ Token cleared from secure store');
      
      // STEP 2: Update authentication state immediately
      safeSetState(setUser, null);
      safeSetState(setIsAuthenticated, false);
      safeSetState(setError, null);
      
      // STEP 3: Clear cache (but don't await to prevent delays)
      setTimeout(() => {
        queryClient.clear();
        console.log('🗑️ Query cache cleared');
      }, 0);
      
      console.log('✅ Logout completed successfully');
      
      // STEP 4: Navigate after a small delay to ensure state is updated
      setTimeout(() => {
        if (mountedRef.current) {
          router.replace('/(auth)/login');
          console.log('📍 Redirected to login');
        }
      }, 100);
      
    } catch (error) {
      console.error('🚨 Logout error:', error);
      // Still try to navigate to login in case of error
      if (mountedRef.current) {
        router.replace('/(auth)/login');
      }
    } finally {
      logoutInProgress.current = false;
    }
  }, [queryClient, safeSetState]);

  // Load user data on mount - with better error handling
  const loadUser = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) {
      console.log('🔒 Auth check already in progress, skipping...');
      return;
    }

    authCheckInProgress.current = true;
    console.log('🔍 Starting auth check...');

    try {
      const token = await SecureStore.getItemAsync('token');
      
      if (!token) {
        console.log('❌ No token found');
        safeSetState(setUser, null);
        safeSetState(setIsAuthenticated, false);
        safeSetState(setError, null);
        return;
      }

      console.log('📱 Token found, fetching user data...');
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout, aborting...');
        controller.abort();
      }, 10000);

      try {
        // Clear any stale user data from cache before fetching
        queryClient.removeQueries({ queryKey: userKeys.current() });
        
        const userData = await userService.getCurrentUser();
        clearTimeout(timeoutId);
        
        console.log('✅ User data fetched successfully:', userData?.id);
        safeSetState(setUser, userData);
        safeSetState(setIsAuthenticated, true);
        safeSetState(setError, null);
        
        // Cache the user data
        queryClient.setQueryData(userKeys.current(), userData);
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        console.log('🚨 Error fetching user data:', fetchError?.response?.status || fetchError.message);
        
        // Only clear auth state for actual auth errors (401, 403)
        if (fetchError?.response?.status === 401 || fetchError?.response?.status === 403) {
          console.log('🔑 Token expired/invalid, clearing auth state...');
          await SecureStore.deleteItemAsync('token');
          safeSetState(setUser, null);
          safeSetState(setIsAuthenticated, false);
          safeSetState(setError, 'Session expired');
          
          // Clear cache
          queryClient.clear();
          
          // Only redirect if this is not the initial load
          if (initialLoadComplete.current && mountedRef.current) {
            setTimeout(() => {
              router.replace('/(auth)/login');
            }, 100);
          }
        } else {
          // For network errors, keep current state but set error
          console.log('🌐 Network error, maintaining current state');
          safeSetState(setError, 'Network error');
        }
      }
      
    } catch (error) {
      console.error('🚨 Unexpected error in loadUser:', error);
      safeSetState(setError, 'Authentication error');
    } finally {
      authCheckInProgress.current = false;
      safeSetState(setIsLoading, false);
      initialLoadComplete.current = true;
      console.log('✅ Auth check completed');
    }
  }, [queryClient, safeSetState]);

  // Listen for auth events
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((eventType) => {
      if (eventType === 'tokenExpired') {
        console.log('🔔 Token expired event received');
        handleLogout();
      }
    });
    
    return () => unsubscribe();
  }, [handleLogout]);

  // Initial load effect - only run once
  useEffect(() => {
    console.log('🚀 AuthProvider mounted, checking initial auth status...');
    loadUser();

    // Cleanup on unmount
    return () => {
      console.log('🔚 AuthProvider unmounting...');
      mountedRef.current = false;
    };
  }, []); // Empty dependency array - only run once!

  // Regular username/password login
  const login = async (username: string, password: string): Promise<boolean> => {
    // Prevent multiple simultaneous login attempts
    if (loginInProgress.current) {
      console.log('🔒 Login already in progress, skipping...');
      return false;
    }

    loginInProgress.current = true;
    safeSetState(setIsLoading, true);
    safeSetState(setError, null);
    console.log('🔐 Starting login process...');

    try {
      // Clear any existing cache first
      queryClient.clear();
      
      const tokenData = await userService.login(username, password);
      await SecureStore.setItemAsync('token', tokenData.access);
      console.log('🔑 Token stored successfully');

      const userData = await userService.getCurrentUser();
      console.log('👤 User data fetched after login:', userData?.id);
      
      safeSetState(setUser, userData);
      safeSetState(setIsAuthenticated, true);
      safeSetState(setError, null);
      
      queryClient.setQueryData(userKeys.current(), userData);
      console.log('✅ Login successful');
      
      return true;
    } catch (error: any) {
      console.error('🚨 Login error:', error);
      
      const errorMessage = error?.response?.data?.detail || 'Login failed';
      safeSetState(setError, errorMessage);
      safeSetState(setUser, null);
      safeSetState(setIsAuthenticated, false);
      
      return false;
    } finally {
      loginInProgress.current = false;
      safeSetState(setIsLoading, false);
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
        setUser: (user) => safeSetState(setUser, user),
        registerUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};