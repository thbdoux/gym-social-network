// app/(app)/_layout.tsx - Updated with WorkoutBanner
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import BottomTabBar from '../../components/navigation/BottomTabBar';
import WorkoutBanner from './realtime-workout/WorkoutBanner';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../utils/createThemedStyles';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';
import { useAuth } from '../../hooks/useAuth';

export default function AppLayout() {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { isAuthenticated } = useAuth();
  
  // Initialize notification socket connection
  const { isConnected } = useNotificationSocket();
  
  // Log connection status for debugging
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Notification socket connection status:', isConnected ? 'Connected' : 'Disconnected');
    }
  }, [isConnected, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: palette.page_background,
          },
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      />
      
      {/* Workout Banner - positioned above BottomTabBar */}
      <WorkoutBanner bottomOffset={80} />
      
      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </View>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
}));