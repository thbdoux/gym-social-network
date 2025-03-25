// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import BottomTabBar from '../components/navigation/BottomTabBar';
import HeaderLogoWithSVG from '../components/navigation/HeaderLogoWithSVG';
import CustomBackButton from '../components/navigation/CustomBackButton';
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
              screenOptions={({ route }) => ({
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
                // Use custom logo component for header title
                headerTitle: () => <HeaderLogoWithSVG />,
                // Custom back button for routes that need it
                headerLeft: () => {
                  // Hide back button on main routes
                  const isMainRoute = 
                    route.name === 'index' || 
                    route.name === '(app)/feed' || 
                    route.name === 'feed' || 
                    route.name.includes('login');
                  
                  return isMainRoute ? null : <CustomBackButton />;
                },
                // Hide the default back button
                headerBackVisible: false,
              })}
            />
            <BottomTabBar />
          </View>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}