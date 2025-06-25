// app/_layout.tsx - Enhanced with image preloading
import { useEffect, useRef, useMemo, useState } from 'react';
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
import { imageManager } from '../utils/imageManager';
import CustomLoadingScreen from '../components/shared/CustomLoadingScreen';

// Keep the splash screen visible
SplashScreen.preventAutoHideAsync();

// Create QueryClient with optimized settings for mobile - MEMOIZED
// app/_layout.tsx - Improved QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 401 (handled by interceptor)
        if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
          return false;
        }
        return failureCount < 2; // Max 2 retries
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
      staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 5)
      gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 10)
      
      // ✅ Enable selective refetching
      refetchOnWindowFocus: true,   // Refetch when app comes to foreground
      refetchOnReconnect: true,     // Refetch when network reconnects
      refetchOnMount: 'always',     // Always refetch on mount for fresh data
      
      // Network and performance optimizations
      networkMode: 'online',
      structuralSharing: true,
      
      // Add refetch interval for critical data (optional)
      refetchInterval: false, // Disable by default, enable per query if needed
      
      // Reduce background refetch aggressiveness 
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// App initialization manager for images and critical resources
function AppInitializationManager({ children }: { children: React.ReactNode }) {
  const [initializationState, setInitializationState] = useState<{
    criticalImagesLoaded: boolean;
    appReady: boolean;
    error: string | null;
    progress: number;
  }>({
    criticalImagesLoaded: false,
    appReady: false,
    error: null,
    progress: 0,
  });

  const initializationStarted = useRef(false);

  useEffect(() => {
    if (initializationStarted.current) return;
    initializationStarted.current = true;

    const initialize = async () => {
      try {
        console.log('🚀 Starting app initialization...');

        // Step 1: Initialize cache manager
        cacheManager.setQueryClient(queryClient);
        setInitializationState(prev => ({ ...prev, progress: 20 }));

        // Step 2: Preload critical images (loading screens) first
        console.log('📸 Preloading critical images...');
        await imageManager.preloadCriticalImages();
        
        setInitializationState(prev => ({ 
          ...prev, 
          criticalImagesLoaded: true, 
          progress: 60 
        }));

        // Step 3: Preload essential image categories in background
        console.log('📦 Preloading essential image categories...');
        await Promise.all([
          imageManager.preloadLocalImagesByCategory('icons'),
          imageManager.preloadLocalImagesByCategory('personality').catch(err => {
            console.warn('Non-critical: Failed to preload personality images:', err);
          })
        ]);

        setInitializationState(prev => ({ ...prev, progress: 80 }));

        // Step 4: Small delay to ensure all providers are mounted
        await new Promise(resolve => setTimeout(resolve, 200));

        setInitializationState(prev => ({ ...prev, progress: 100 }));

        // Step 5: Mark app as ready
        console.log('✅ App initialization complete');
        setInitializationState(prev => ({ 
          ...prev, 
          appReady: true 
        }));

      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        setInitializationState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Initialization failed',
          appReady: true // Don't block the app
        }));
      }
    };

    initialize();
  }, []);

  // Show custom loading screen during initialization
  if (!initializationState.appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080f19' }}>
        <StatusBar style="light" />
        <CustomLoadingScreen
          text={
            initializationState.progress < 60 
              ? 'Initializing...' 
              : initializationState.progress < 80
              ? 'Loading images...'
              : 'Almost ready...'
          }
          animationType="pulse"
          size="large"
          preloadImages={initializationState.criticalImagesLoaded}
          style={{ backgroundColor: '#080f19' }}
        />
      </View>
    );
  }

  return <>{children}</>;
}

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

  // Hide splash screen after initialization
  useEffect(() => {
    const hideSplash = async () => {
      try {
        // Wait a bit longer to ensure critical images are loaded
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (!hideSplashComplete.current) {
          await SplashScreen.hideAsync();
          hideSplashComplete.current = true;
          console.log('✅ Splash screen hidden');
        }
      } catch (error) {
        console.warn('⚠️ Error hiding splash screen:', error);
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

    hideSplash();
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
      <AppInitializationManager>
        <AppLifecycleManager>
          <MemoizedProviders>
            {appContent}
          </MemoizedProviders>
        </AppLifecycleManager>
      </AppInitializationManager>
    </QueryClientProvider>
  );
}