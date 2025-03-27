// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ModalProvider } from '../context/ModalContext'; // Import ModalProvider
import BottomTabBar from '../components/navigation/BottomTabBar';
import HeaderLogoWithSVG from '../components/navigation/HeaderLogoWithSVG';
import CustomBackButton from '../components/navigation/CustomBackButton';
import HeaderSettingsButton from '../components/navigation/HeaderSettingsButton';
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
          <ModalProvider> {/* Add ModalProvider here */}
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
                    // Hide back button on main routes and login routes
                    const isMainRoute = 
                      route.name === 'index' || 
                      route.name === '(app)/feed' || 
                      route.name === 'feed';
                    
                    // Explicitly check for login routes
                    const isLoginRoute = 
                      route.name === '(auth)/login' || 
                      route.name.includes('login');
                    
                    // No back button for main routes or login routes
                    // The friends button will be rendered directly in the FeedScreen component
                    if (isMainRoute || isLoginRoute) return null;
                    
                    return <CustomBackButton />;
                  },
                  // Add settings button to header right
                  headerRight: () => {
                    // Only show on authenticated app routes, not login or settings screens
                    const showSettings = 
                      !route.name.includes('login') && 
                      !route.name.includes('settings');
                    
                    return showSettings ? <HeaderSettingsButton /> : null;
                  },
                  // Hide the default back button
                  headerBackVisible: false,
                })}
              />
              <BottomTabBar />
            </View>
          </ModalProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}