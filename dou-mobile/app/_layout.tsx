// app/_layout.tsx - Optimized version
import { useEffect, useRef } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { HeaderAnimationProvider } from '../context/HeaderAnimationContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import { WorkoutProvider } from '../context/WorkoutContext';
import { View } from 'react-native';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../hooks/useAuth';

// Keep the splash screen visible
SplashScreen.preventAutoHideAsync();

// Create QueryClient with optimized settings for mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce server calls
      gcTime: 10 * 60 * 1000, // 10 minutes cache time
      refetchOnWindowFocus: false, // Disable auto-refetch on focus
      refetchOnReconnect: 'always', // Only refetch on network reconnect
    },
    mutations: {
      retry: 1,
    },
  },
});

// Optimized notification wrapper that doesn't reinitialize on every render
function OptimizedPushNotificationWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { expoPushToken, error } = usePushNotifications();
  const lastAuthState = useRef(isAuthenticated);
  
  // Only log when auth state actually changes
  useEffect(() => {
    if (lastAuthState.current !== isAuthenticated) {
      lastAuthState.current = isAuthenticated;
      if (__DEV__) {
        console.log('🔐 Auth state changed:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
      }
    }
  }, [isAuthenticated]);

  // Only log errors once
  useEffect(() => {
    if (error && __DEV__) {
      console.error('📱 Push notification error:', error.message);
    }
  }, [error]);

  return <>{children}</>;
}

// App state manager to handle background/foreground transitions
function AppStateManager({ children }: { children: React.ReactNode }) {
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number>(0);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appState.current;
      
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        const timeInBackground = Date.now() - backgroundTime.current;
        console.log(`📱 App resumed after ${Math.round(timeInBackground / 1000)}s in background`);
        
        // Only invalidate queries if app was in background for more than 5 minutes
        if (timeInBackground > 5 * 60 * 1000) {
          console.log('🔄 Long background time detected, refreshing critical data');
          queryClient.invalidateQueries({ 
            queryKey: ['notifications', 'count'],
            exact: false 
          });
        }
      } else if (nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        console.log('📱 App moved to background');
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  const hideSplashComplete = useRef(false);

  useEffect(() => {
    const hideSplash = async () => {
      if (hideSplashComplete.current) return;
      
      try {
        // Add a small delay to ensure providers are ready
        await new Promise(resolve => setTimeout(resolve, 100));
        await SplashScreen.hideAsync();
        hideSplashComplete.current = true;
        console.log('✅ Splash screen hidden');
      } catch (e) {
        console.warn("Error hiding splash screen:", e);
      }
    };
    
    hideSplash();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppStateManager>
              <NotificationProvider>
                <WorkoutProvider>
                  <HeaderAnimationProvider>
                    <OptimizedPushNotificationWrapper>
                      <StatusBar style="light" />
                      <View style={{ flex: 1, backgroundColor: '#080f19' }}>
                        <Slot />
                      </View>
                    </OptimizedPushNotificationWrapper>
                  </HeaderAnimationProvider>
                </WorkoutProvider>
              </NotificationProvider>
            </AppStateManager>
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}