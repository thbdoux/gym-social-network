// components/navigation/BottomTabBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text,
  TouchableOpacity, 
  StyleSheet, 
  Platform
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import PostCreationModal from '../feed/PostCreationModal';
import WorkoutNavigationGuard from './WorkoutNavigationGuard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
  Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
import { useNotificationCount } from '../../hooks/query/useNotificationQuery';

// Updated TabIcon component in BottomTabBar.tsx
interface TabIconProps {
  name: string;
  active: boolean;
  onPress: () => void;
  showBadge?: boolean;
  badgeCount?: number; // New prop for displaying the notification count
  isWorkoutButton?: boolean; // New prop to identify the workout button
}

const TabIcon: React.FC<TabIconProps> = ({ 
  name, 
  active, 
  onPress, 
  showBadge = false, 
  badgeCount = 0,
  isWorkoutButton = false
}) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const scale = useSharedValue(1);
  const color = useSharedValue(active ? 1 : 0);
  
  useEffect(() => {
    color.value = withTiming(active ? 1 : 0, { 
      duration: 200,
      easing: Easing.bezier(0.16, 1, 0.3, 1)
    });
  }, [active]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  // Simple color style that doesn't rely on interpolateColor
  const iconColor = active ? palette.text : palette.text;
  
  // Handle special case for barbell icon which doesn't have an outline variant
  const iconName = name === 'barbell-sharp' 
                   ? (active ? 'barbell-sharp' : 'barbell-outline')
                   : (active ? name : `${name}-outline`);
  
  const handlePress = () => {
    scale.value = withSpring(0.8, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.tabButton}
    >
      <Animated.View 
        style={[
          styles.tabIconContainer, 
          animatedStyle,
          isWorkoutButton && styles.workoutButton
        ]}
      >
        <View style={[active && [styles.activeIndicator, { backgroundColor: palette.text }]]} />
        <Ionicons 
          name={iconName} 
          size={isWorkoutButton ? 40 : 22} 
          color={iconColor} 
        />
        
        {/* Updated badge display with count */}
        {showBadge && (
          badgeCount > 0 ? (
            <View style={styles.badgeWithCount}>
              <Text style={styles.badgeText}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </View>
          ) : (
            <View style={styles.badge} />
          )
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Updated BottomTabBar component with notification counter and WorkoutNavigationGuard
const BottomTabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { data: notificationCount } = useNotificationCount();
  
  // Post Creation Modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string>('regular');
  
  const navigateTo = (route: string): void => {
    router.push(route);
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setShowPostModal(false);
    // Reset back to regular after modal closes
    setTimeout(() => setSelectedPostType('regular'), 300);
  };
  
  // Handle post created
  const handlePostCreated = (newPost: any) => {
    console.log('Post created:', newPost);
  };
  
  // Check if we have unread notifications and get the count
  const hasUnreadNotifications = notificationCount && notificationCount.unread > 0;
  const unreadCount = notificationCount ? notificationCount.unread : 0;
  
  return (
    <>
      {/* Bottom Tab Bar */}
      <View style={styles.container}>
        {/* All tabs in a single row for equal spacing */}
        <View style={styles.tabRow}>
          <TabIcon
            name="home"
            active={pathname === '/feed'}
            onPress={() => navigateTo('/feed')}
          />
          
          <TabIcon
            name="barbell-sharp"
            active={pathname === '/workouts'}
            onPress={() => navigateTo('/workouts')}
          />
          
          {/* Workout button wrapped with WorkoutNavigationGuard */}
          <WorkoutNavigationGuard targetRoute="/realtime-workout">
            <TabIcon
              name="add-circle"
              active={pathname === '/realtime-workout'}
              onPress={() => navigateTo('/realtime-workout')}
              isWorkoutButton={true}
            />
          </WorkoutNavigationGuard>
          
          {/* Analytics Tab */}
          <TabIcon
            name="stats-chart"
            active={pathname === '/analytics'}
            onPress={() => navigateTo('/analytics')}
          />
          
          {/* Profile Tab with Icon */}
          <TabIcon
            name="person"
            active={pathname === '/profile'}
            onPress={() => navigateTo('/profile')}
          />
        </View>
      </View>

      {/* Post Creation Modal */}
      <PostCreationModal
        visible={showPostModal}
        onClose={handleModalClose}
        onPostCreated={handlePostCreated}
        initialPostType={selectedPostType}
      />
    </>
  );
};

// Add these styles to themedStyles in BottomTabBar.tsx
const themedStyles = createThemedStyles((palette) => ({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 80 : 64,
    paddingBottom: Platform.OS === 'ios' ? 30 : 8,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: 20,
    position: 'relative',
    backgroundColor: palette.layout,
    borderTopColor: palette.layout,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: 48,
  },
  tabIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    position: 'relative',
  },
  workoutButton: {
    // backgroundColor: withAlpha(palette.text, 0.2),
  },
  activeTabIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  iconStyle: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.error,
    borderWidth: 1,
    borderColor: palette.layout,
  },
  // New style for badge with count
  badgeWithCount: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: palette.layout,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1,
  },
}));

export default BottomTabBar;