// app/_layout.tsx - Updated with Expo Push Notifications
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Expo push notification wrapper
function PushNotificationWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { expoPushToken, error, notification } = usePushNotifications();

  // Handle push notification errors
  useEffect(() => {
    if (error) {
      console.error('Expo push notification error:', error);
      if (__DEV__) {
        console.warn(`Push notification setup failed: ${error.message}`);
      }
    }
  }, [error]);

  // Log Expo push token for testing (development only)
  useEffect(() => {
    if (expoPushToken && __DEV__ && isAuthenticated) {
      console.log('🚀 Expo push token registered:', expoPushToken);
      console.log('🧪 Test notifications via Django admin or API');
      console.log('📱 You can test with Expo push tool: https://expo.dev/notifications');
    }
  }, [expoPushToken, isAuthenticated]);

  // Log received notifications in development
  useEffect(() => {
    if (notification && __DEV__) {
      console.log('📬 Notification received:', notification);
    }
  }, [notification]);

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
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
            <NotificationProvider>
              <WorkoutProvider>
                <HeaderAnimationProvider>
                  <PushNotificationWrapper>
                    <StatusBar style="light" />
                    <View style={{ flex: 1, backgroundColor: '#080f19' }}>
                      <Slot />
                    </View>
                  </PushNotificationWrapper>
                </HeaderAnimationProvider>
              </WorkoutProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}