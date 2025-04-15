// app/_layout.tsx
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { HeaderAnimationProvider } from '../context/HeaderAnimationContext';
import { ThemeProvider } from '../context/ThemeContext'; // Import the new ThemeProvider
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
          <ThemeProvider> {/* Add the ThemeProvider */}
            <HeaderAnimationProvider>
              <StatusBar style="light" />
              <View style={{ flex: 1, backgroundColor: '#080f19' }}>
                {/* Using Slot to allow for complete layout control within the groups */}
                <Slot />
              </View>
            </HeaderAnimationProvider>
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}