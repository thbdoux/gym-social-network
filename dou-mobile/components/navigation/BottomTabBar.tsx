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
}

const TabIcon: React.FC<TabIconProps> = ({ 
  name, 
  active, 
  onPress, 
  showBadge = false, 
  badgeCount = 0 
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
      <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
        <View style={[active && [styles.activeIndicator, { backgroundColor: palette.text }]]} />
        <Ionicons name={iconName} size={22} color={iconColor} />
        
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

const FabButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const handlePress = () => {
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });
    rotation.value = withTiming(rotation.value + 45, { duration: 300 });
    onPress();
  };
  
  const fabStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ]
    };
  });
  
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={styles.fabButtonContainer}
    >
      <Animated.View 
        style={[
          styles.fabButton, 
          fabStyle, 
          { backgroundColor: palette.text }
        ]}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </Animated.View>
    </TouchableOpacity>
  );
};

// Updated BottomTabBar component with notification counter
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
          
          {/* Add FabButton in the middle */}
          <FabButton onPress={() => navigateTo('/realtime-workout')} />
          
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
    height: Platform.OS === 'ios' ? 70 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
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
  
  // FAB Button styles
  fabButtonContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
    position: 'relative',
    marginBottom: Platform.OS === 'ios' ? 12 : 0, // Raise the button slightly
    transform: [{ translateY: -20 }], // Move the button up for better visibility
  },
  fabButton: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1,
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    left: 0,
    right: 0,
    zIndex: 5,
    paddingHorizontal: 16,
  },
  fabMenuInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8,15,25,255)',
    borderRadius: 28,
    padding: 12,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  fabMenuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    marginHorizontal: 8,
  },
  fabItemButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
}));

export default BottomTabBar;