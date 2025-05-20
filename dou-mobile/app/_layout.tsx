// app/_layout.tsx
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
import { View } from 'react-native';

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

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after resources are loaded
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Handle any errors
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
              <HeaderAnimationProvider>
                <StatusBar style="light" />
                <View style={{ flex: 1, backgroundColor: '#080f19' }}>
                  <Slot />
                </View>
              </HeaderAnimationProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}