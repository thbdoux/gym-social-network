// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ModalProvider } from '../context/ModalContext';
import { HeaderAnimationProvider, useHeaderAnimation } from '../context/HeaderAnimationContext';
import BottomTabBar from '../components/navigation/BottomTabBar';
import HeaderLogoWithSVG from '../components/navigation/HeaderLogoWithSVG';
import CustomBackButton from '../components/navigation/CustomBackButton';
import SidebarButton from '../components/navigation/SidebarButton';
import { View, Animated } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

// Create a wrapper component for animated header
const AnimatedHeader = ({ route }) => {
  const { scrollY } = useHeaderAnimation();
  
  // Calculate header height based on scroll position
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [80, 0],
    extrapolate: 'clamp'
  });
  
  // Calculate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  // Don't animate these screens
  const noAnimationRoutes = ['(app)/feed', 'feed', 'index', '(auth)/login'];
  const shouldAnimate = !noAnimationRoutes.includes(route.name);
  
  // If this is a route we don't want to animate, just return normal header
  if (!shouldAnimate) {
    return (
      <>
        <HeaderLogoWithSVG />
      </>
    );
  }
  
  return (
    <Animated.View style={{ opacity: headerOpacity, height: headerHeight, overflow: 'hidden' }}>
      <HeaderLogoWithSVG />
    </Animated.View>
  );
};

// Create a wrapper component for animated back button
const AnimatedBackButton = ({ route }) => {
  const { scrollY } = useHeaderAnimation();
  
  // Calculate opacity based on scroll position
  const buttonOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  // For the feed route, don't show any button
  if (route.name === '(app)/feed' || route.name === 'feed') {
    return null;
  }
  
  // Hide back button on main routes
  const isMainRoute = route.name === 'index';
  
  // Explicitly check for login routes
  const isLoginRoute = route.name === '(auth)/login' || route.name.includes('login');
  
  // No back button for main routes or login routes
  if (isMainRoute || isLoginRoute) return null;
  
  return (
    <Animated.View style={{ opacity: buttonOpacity }}>
      <CustomBackButton />
    </Animated.View>
  );
};

// Create a wrapper component for animated sidebar button
const AnimatedSidebarButton = () => {
  const { scrollY } = useHeaderAnimation();
  
  // Calculate opacity based on scroll position
  const buttonOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  return (
    <Animated.View style={{ opacity: buttonOpacity }}>
      <SidebarButton />
    </Animated.View>
  );
};

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
              <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
                <Stack
                  screenOptions={({ route }) => ({
                    headerStyle: {
                      backgroundColor: '#0F172A',
                    },
                    headerTintColor: '#ffffff',
                    headerTitleStyle: {
                      fontWeight: 'bold',
                    },
                    contentStyle: {
                      backgroundColor: '#0F172A',
                    },
                    // Use custom logo component for header title with animation
                    headerTitle: () => <AnimatedHeader route={route} />,
                    // Custom back button for routes that need it with animation
                    headerLeft: () => <AnimatedBackButton route={route} />,
                    // Add sidebar button to header right with animation
                    headerRight: () => <AnimatedSidebarButton />,
                    // Hide the default back button
                    headerBackVisible: false,
                    // Add a subtle bottom border to header
                    headerShadowVisible: false,
                    headerStyle: {
                      backgroundColor: '#0F172A',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
                      height: 80,
                    },
                    // Add some animation to screen transitions
                    animation: 'slide_from_right',
                    animationDuration: 200,
                  })}
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