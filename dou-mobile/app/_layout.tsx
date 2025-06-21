// app/_layout.tsx - Cleaned and optimized version
import { useEffect, useRef, useMemo } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import { WorkoutProvider } from '../context/WorkoutContext';
import { cacheManager } from '../utils/cacheManager';

// Keep the splash screen visible
SplashScreen.preventAutoHideAsync();

// Create QueryClient with optimized settings for mobile - MEMOIZED
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // CRITICAL: Stop auto-refetch
      refetchOnMount: false, // CRITICAL: Stop auto-refetch
      networkMode: 'online',
      // Add deduplication to prevent duplicate requests
      structuralSharing: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Combined app state and background manager - SIMPLIFIED
function AppLifecycleManager({ children }: { children: React.ReactNode }) {
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number>(0);
  const backgroundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appState.current;
      
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        const timeInBackground = Date.now() - backgroundTime.current;
        const backgroundSeconds = Math.round(timeInBackground / 1000);
        
        if (__DEV__) {
          console.log(`📱 App resumed after ${backgroundSeconds}s in background`);
        }
        
        // Clear any pending background timeout
        if (backgroundTimeoutRef.current) {
          clearTimeout(backgroundTimeoutRef.current);
          backgroundTimeoutRef.current = null;
        }
        
        // Use cacheManager instead of direct queryClient calls
        if (timeInBackground > 5 * 60 * 1000) { // 5 minutes
          console.log('🔄 Long background time, triggering cache refresh');
          
          // Use cacheManager for coordinated updates
          cacheManager.scheduleUpdate({
            queryKey: 'notifications',
            source: 'app-resume-long',
            priority: 'normal'
          });
          
          cacheManager.scheduleUpdate({
            queryKey: 'notification-count',
            source: 'app-resume-long',
            priority: 'normal'
          });
        } else if (timeInBackground > 60 * 1000) { // 1 minute
          // Light refresh for shorter background times
          cacheManager.scheduleUpdate({
            queryKey: 'notification-count',
            source: 'app-resume-short',
            priority: 'low'
          });
        }
        
      } else if (nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        
        if (__DEV__) {
          console.log('📱 App moved to background');
        }
        
        // Schedule cache cleanup after extended background time
        backgroundTimeoutRef.current = setTimeout(() => {
          console.log('🧹 App in background for 10+ minutes, clearing cache');
          // Clear non-essential cache after 10 minutes in background
          cacheManager.clearPendingUpdates();
        }, 10 * 60 * 1000);
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      if (backgroundTimeoutRef.current) {
        clearTimeout(backgroundTimeoutRef.current);
      }
    };
  }, []);

  return <>{children}</>;
}

// Memoized provider wrapper to prevent unnecessary re-renders
const MemoizedProviders = ({ children }: { children: React.ReactNode }) => {
  // Memoize the provider tree to prevent re-renders
  const providerTree = useMemo(() => (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <WorkoutProvider>
              {children}
            </WorkoutProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  ), [children]);

  return providerTree;
};

export default function RootLayout() {
  const hideSplashComplete = useRef(false);
  const initializationComplete = useRef(false);

  // Single initialization effect
  useEffect(() => {
    if (initializationComplete.current) return;
    
    const initialize = async () => {
      try {
        // Initialize cache manager first
        cacheManager.setQueryClient(queryClient);
        console.log('📋 Cache manager initialized');
        
        // Small delay to ensure all providers are mounted
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Hide splash screen
        if (!hideSplashComplete.current) {
          await SplashScreen.hideAsync();
          hideSplashComplete.current = true;
          console.log('✅ Splash screen hidden');
        }
        
        initializationComplete.current = true;
        console.log('🚀 App initialization complete');
        
      } catch (error) {
        console.warn('⚠️ Error during app initialization:', error);
        
        // Fallback splash screen hiding
        if (!hideSplashComplete.current) {
          try {
            await SplashScreen.hideAsync();
            hideSplashComplete.current = true;
          } catch (e) {
            console.error('❌ Failed to hide splash screen:', e);
          }
        }
      }
    };
    
    initialize();
  }, []);

  // Memoize the main app structure
  const appContent = useMemo(() => (
    <View style={{ flex: 1, backgroundColor: '#080f19' }}>
      <StatusBar style="light" />
      <Slot />
    </View>
  ), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppLifecycleManager>
        <MemoizedProviders>
          {appContent}
        </MemoizedProviders>
      </AppLifecycleManager>
    </QueryClientProvider>
  );
}