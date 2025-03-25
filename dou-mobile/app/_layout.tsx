// app/_layout.tsx (modified version)
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
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
          <StatusBar style="light" />
          <View style={{ flex: 1, backgroundColor: '#111827' }}>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#111827', // dark bg color
                },
                headerTintColor: '#ffffff', // white text
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                contentStyle: {
                  backgroundColor: '#111827', // dark bg color
                },
              }}
            />
            <BottomTabBar />
          </View>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}