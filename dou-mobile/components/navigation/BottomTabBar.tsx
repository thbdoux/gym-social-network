// components/navigation/BottomTabBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
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

interface TabIconProps {
  name: string;
  active: boolean;
  onPress: () => void;
}

const TabIcon: React.FC<TabIconProps> = ({ name, active, onPress }) => {
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
  
  const colorStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        color.value,
        [0, 1],
        ['#9CA3AF', '#FFFFFF']
      ),
      opacity: active ? 1 : 0.7
    };
  });
  
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
        <Animated.View style={[active && styles.activeIndicator]} />
        <Animated.Text style={[styles.iconStyle, colorStyle]}>
          <Ionicons name={iconName} size={22} />
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const FabButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
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
      <Animated.View style={[styles.fabButton, fabStyle]}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </Animated.View>
    </TouchableOpacity>
  );
};

const BottomTabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  // FAB Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Post Creation Modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string>('regular');
  
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const menuTranslateY = useSharedValue(100);
  
  // Menu items data
  const menuItems = [
    {
      id: 'regular',
      icon: 'create-outline',
      color: '#60A5FA'
    },
    {
      id: 'workout_log',
      icon: 'fitness-outline',
      color: '#34D399'
    },
    {
      id: 'program',
      icon: 'barbell-outline',
      color: '#A78BFA'
    },
    {
      id: 'workout_invite',
      icon: 'people-outline',
      color: '#FB923C'
    }
  ];
  
  useEffect(() => {
    if (isMenuOpen) {
      // Animate menu opening
      backdropOpacity.value = withTiming(1, { duration: 300 });
      menuTranslateY.value = withSpring(0, {
        damping: 15,
        stiffness: 120
      });
    } else {
      // Animate menu closing
      backdropOpacity.value = withTiming(0, { duration: 200 });
      menuTranslateY.value = withTiming(100, { duration: 200 });
    }
  }, [isMenuOpen]);
  
  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
      display: backdropOpacity.value === 0 ? 'none' : 'flex'
    };
  });
  
  const menuStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: menuTranslateY.value }],
      opacity: backdropOpacity.value
    };
  });
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const navigateTo = (route: string): void => {
    router.push(route);
  };
  
  const handleItemPress = (itemId: string) => {
    setIsMenuOpen(false);
    // Set the post type and open the modal
    setSelectedPostType(itemId);
    setShowPostModal(true);
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
  
  // Helper function to get initials for the avatar placeholder
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <>
      {/* Backdrop for menu */}
      <Animated.View 
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={isMenuOpen ? 'auto' : 'none'}
        onTouchStart={() => setIsMenuOpen(false)}
      />
      
      {/* Horizontal FAB Menu
      <Animated.View 
        style={[styles.fabMenuContainer, menuStyle]}
        pointerEvents={isMenuOpen ? 'auto' : 'none'}
      >
        <View style={styles.fabMenuInner}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.fabMenuItem}
              onPress={() => handleItemPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.fabItemButton, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={22} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View> */}
      
      {/* Bottom Tab Bar */}
      <View style={styles.container}>
        {/* Left side */}
        <View style={styles.tabSide}>
          <TabIcon
            name="home"
            active={pathname === '/feed'}
            onPress={() => navigateTo('/feed')}
          />
          
          <TabIcon
            name="sparkles"
            active={pathname === '/ai-coach'}
            onPress={() => navigateTo('/ai-coach')}
          />
        </View>
        
        {/* Right side */}
        <View style={styles.tabSide}>
          <TabIcon
            name="barbell-sharp"
            active={pathname === '/workouts'}
            onPress={() => navigateTo('/workouts')}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    position: 'relative'
  },
  tabSide: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-around'
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
    backgroundColor: '#FFFFFF',
  },
  iconStyle: {
    fontSize: 22,
  },

  fabButtonContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
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
    backgroundColor: '#3B82F6', // Solid blue color
  },

  // FAB Menu styles
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
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
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
});

export default BottomTabBar;