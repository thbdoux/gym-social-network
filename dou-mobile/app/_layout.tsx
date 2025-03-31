// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ModalProvider } from '../context/ModalContext';
import { HeaderAnimationProvider } from '../context/HeaderAnimationContext';
import BottomTabBar from '../components/navigation/BottomTabBar';
import { View } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after resources are loaded
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ModalProvider>
            <HeaderAnimationProvider>
              <StatusBar style="light" />
              <View style={{ flex: 1, backgroundColor: '#111827' }}>
                <Stack
                  screenOptions={({ route }) => {
                    // Base screen options for all routes
                    const baseOptions = {
                      headerShown: false, // Hide header by default for all screens
                      contentStyle: {
                        backgroundColor: '#111827',
                      },
                      // Add some animation to screen transitions
                      animation: 'slide_from_right',
                      animationDuration: 200,
                    };
                    
                    // Check if this is the feed route
                    const isFeedRoute = route.name === '(app)/feed' || route.name === 'feed';
                    
                    // If it's not the feed route, just return the base options
                    if (!isFeedRoute) {
                      return baseOptions;
                    }
                    
                    // If it is the feed route, we don't need to modify any options
                    // The feed page will handle its own header rendering
                    return baseOptions;
                  }}
                />
                <BottomTabBar />
              </View>
            </HeaderAnimationProvider>
          </ModalProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}