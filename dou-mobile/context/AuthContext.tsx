// context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import userService from '../api/services/userService';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '../hooks/query/useUserQuery';
import { authEvents } from '../api/utils/authEvents';
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Initialize GoogleSignin with the correct client IDs
// You'll need to replace these with your actual client IDs from Google Cloud Console
// GoogleSignin.configure({
//   // The web client ID is required for all platforms
//   webClientId: '38465928219-lnt8gkdkhn1id2vh93a54j41h8516op9.apps.googleusercontent.com',
  
//   // Only include iOS client ID when running on iOS
//   ...(Platform.OS === 'ios' && {
//     iosClientId: '38465928219-ouf41lc4o75ruaspr62s7o0bqr99fi22.apps.googleusercontent.com',
//   }),
  
//   // Only include Android client ID when running on Android
//   ...(Platform.OS === 'android' && {
//     androidClientId: '123456789012-androidabcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
//   }),
  
//   offlineAccess: true,
//   forceCodeForRefreshToken: true,
// });

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
  // googleLogin: () => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
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

  // Social login handler - commented out for now
  const handleSocialLogin = async (provider: string, token: string) => {
    try {
      console.log(`Sending ${provider} token to backend...`);
      const response = await userService.socialLogin(provider, token);
      
      if (response?.access) {
        // Store the JWT token
        await SecureStore.setItemAsync('token', response.access);
        
        // Update user state
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Cache the user data
        queryClient.setQueryData(userKeys.current(), response.user);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error(`${provider} login error:`, error);
      return false;
    }
  };

  // Google login implementation
  // const googleLogin = async (): Promise<boolean> => {
  //   try {
  //     setIsLoading(true);
      
  //     // Make sure Google Play Services are available (Android only)
  //     if (Platform.OS === 'android') {
  //       await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  //     }
      
  //     // Check if user is already signed in
  //     const isSignedIn = await GoogleSignin.isSignedIn();
  //     if (isSignedIn) {
  //       await GoogleSignin.signOut();
  //     }
      
  //     console.log('Starting Google Sign-In...');
      
  //     // Perform Google Sign-In
  //     const userInfo = await GoogleSignin.signIn();
  //     console.log('Google Sign-In successful, getting token...');
      
  //     // Get the ID token to send to our backend
  //     const { idToken } = await GoogleSignin.getTokens();
      
  //     if (idToken) {
  //       console.log('Got Google ID token, authenticating with backend...');
  //       // Send the ID token to your backend for verification
  //       return await handleSocialLogin('google', idToken);
  //     } else {
  //       console.error('No ID token received from Google');
  //       return false;
  //     }
  //   } catch (error: any) {
  //     // Handle specific Google Sign-In errors
  //     if (error.code === statusCodes.SIGN_IN_CANCELLED) {
  //       console.log('User cancelled the login flow');
  //     } else if (error.code === statusCodes.IN_PROGRESS) {
  //       console.log('Sign in is in progress already');
  //     } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
  //       console.log('Play services not available or outdated');
  //     } else {
  //       console.error('Google sign in error:', error);
  //     }
  //     return false;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Register new user
  const registerUser = async (userData: any): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      await userService.register(userData);
      return {
        success: true,
        message: "Registration successful! You can now log in."
        // Changed from: "Registration successful! Please check your email to verify your account."
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || "Registration failed. Please try again."
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await userService.resendVerification(email);
      return true;
    } catch (error) {
      console.error('Resend verification error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Define a reusable logout function
  const handleLogout = useCallback(async () => {
    try {
      console.log('AuthContext: Logging out user', user?.id);
      
      // Sign out from Google if signed in - commented out for now
      // const isSignedIn = await GoogleSignin.isSignedIn();
      // if (isSignedIn) {
      //   await GoogleSignin.signOut();
      //   console.log('Signed out from Google');
      // }
      
      // STEP 1: Clear token
      await SecureStore.deleteItemAsync('token');
      
      // STEP 2: Update authentication state
      setUser(null);
      setIsAuthenticated(false);
      
      // STEP 3: Clear all cached queries
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
      
      // Invalidate each query key
      allQueryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key, exact: key === userKeys.current() });
        queryClient.removeQueries({ queryKey: key, exact: key === userKeys.current() });
      });
      
      // STEP 4: Complete cache purge
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
            
            // Cache the user data
            queryClient.setQueryData(userKeys.current(), userData);
            
            // Comment out email verification check for development
            // if (userData && !userData.email_verified) {
            //   router.push('/verify-email-reminder');
            // }
          } catch (error) {
            // If token is invalid or expired, clear it and reset auth state
            console.error('Error fetching user:', error);
            await SecureStore.deleteItemAsync('token');
            setUser(null);
            setIsAuthenticated(false);
            
            // Clear any cached data
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

  // Regular username/password login
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Logging in user', username);
      
      // STEP 1: Clear any existing cache data
      queryClient.clear();
      
      // STEP 2: Login and get token
      const tokenData = await userService.login(username, password);
      await SecureStore.setItemAsync('token', tokenData.access);
      
      // STEP 3: Clear any potentially cached queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
      
      // STEP 4: Force a fresh fetch of user data
      const userData = await userService.getCurrentUser();
      console.log('AuthContext: Fetched fresh user data', userData?.id);
      
      // STEP 5: Set user and authentication state
      setUser(userData);
      setIsAuthenticated(true);
      
      // STEP 6: Cache the user data
      queryClient.setQueryData(userKeys.current(), userData);
      
      // STEP 7: Comment out email verification check for development
      // if (userData && !userData.email_verified) {
      //   router.push('/verify-email-reminder');
      //   return true;
      // }
      
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
        setUser,
        registerUser,
        // googleLogin,
        resendVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};