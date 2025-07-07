// utils/authUtils.ts
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { resetLogoutFlag } from '../api/index';

/**
 * Utility functions for handling authentication edge cases
 */

// Clean up any stale auth state on app startup
export const cleanupAuthState = async () => {
  try {
    console.log('🧹 Cleaning up auth state...');
    
    // Reset any API client flags
    resetLogoutFlag();
    
    console.log('✅ Auth state cleanup completed');
  } catch (error) {
    console.error('🚨 Error during auth cleanup:', error);
  }
};

// Force logout and redirect (for emergency cases)
export const forceLogout = async (reason?: string) => {
  try {
    console.log('🚨 Force logout initiated:', reason || 'Unknown reason');
    
    // Clear token
    await SecureStore.deleteItemAsync('token');
    
    // Reset API client state
    resetLogoutFlag();
    
    // Navigate to login
    router.replace('/(auth)/login');
    
    console.log('✅ Force logout completed');
  } catch (error) {
    console.error('🚨 Error during force logout:', error);
  }
};

// Check if user should be on auth screen
export const shouldBeOnAuthScreen = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync('token');
    return !token;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return true; // Default to requiring auth
  }
};

// Safe navigation helper that respects auth state
export const safeNavigate = async (path: string, requireAuth: boolean = true) => {
  try {
    if (requireAuth) {
      const needsAuth = await shouldBeOnAuthScreen();
      if (needsAuth) {
        console.log('🔐 Navigation blocked - user needs authentication');
        router.replace('/(auth)/login');
        return false;
      }
    }
    
    router.push(path);
    return true;
  } catch (error) {
    console.error('Navigation error:', error);
    return false;
  }
};