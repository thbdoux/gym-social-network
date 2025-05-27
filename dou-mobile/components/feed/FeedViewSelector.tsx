// components/feed/FeedViewSelector.tsx
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';

// Define constants for view types
export const FEED_VIEW_TYPES = {
  DISCOVER: 'discover',
  FRIENDS: 'friends'
};

// Define order of views for swiping
export const FEED_VIEW_ORDER = [
  FEED_VIEW_TYPES.DISCOVER,
  FEED_VIEW_TYPES.FRIENDS
];

interface FeedViewSelectorProps {
  currentView: string;
  changeView: (viewType: string) => void;
}

const FeedViewSelector: React.FC<FeedViewSelectorProps> = ({
  currentView,
  changeView,
}) => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  
  // Animation values for swipe feedback
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isSwipingRight, setIsSwipingRight] = useState(false);
  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  
  // Swipe configuration
  const SWIPE_THRESHOLD = 50; // Minimum distance to trigger swipe
  const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger swipe
  
  // Get current view index
  const getCurrentViewIndex = () => {
    return FEED_VIEW_ORDER.findIndex(view => view === currentView);
  };
  
  // Handle view change with animation
  const handleViewChange = (newView: string) => {
    if (newView !== currentView) {
      // Reset animation
      slideAnim.setValue(0);
      changeView(newView);
    }
  };
  
  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        setIsSwipingRight(false);
        setIsSwipingLeft(false);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update animation based on swipe direction
        const progress = Math.min(Math.abs(gestureState.dx) / 100, 1);
        slideAnim.setValue(gestureState.dx > 0 ? progress : -progress);
        
        // Update swipe indicators
        if (gestureState.dx > 20) {
          setIsSwipingRight(true);
          setIsSwipingLeft(false);
        } else if (gestureState.dx < -20) {
          setIsSwipingLeft(true);
          setIsSwipingRight(false);
        } else {
          setIsSwipingRight(false);
          setIsSwipingLeft(false);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        const currentIndex = getCurrentViewIndex();
        
        // Reset swipe indicators
        setIsSwipingRight(false);
        setIsSwipingLeft(false);
        
        // Animate back to original position
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }).start();
        
        // Determine if swipe was strong enough
        const shouldSwipe = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD;
        
        if (!shouldSwipe) return;
        
        // Handle swipe right (go to previous view)
        if (dx > 0 && currentIndex > 0) {
          const newView = FEED_VIEW_ORDER[currentIndex - 1];
          handleViewChange(newView);
        }
        // Handle swipe left (go to next view)
        else if (dx < 0 && currentIndex < FEED_VIEW_ORDER.length - 1) {
          const newView = FEED_VIEW_ORDER[currentIndex + 1];
          handleViewChange(newView);
        }
      },
    })
  ).current;
  
  // Animation styles
  const animatedContainerStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-10, 0, 10],
          extrapolate: 'clamp',
        }),
      },
    ],
  };
  
  const getSwipeIndicatorOpacity = (direction: 'left' | 'right') => {
    if (direction === 'left' && isSwipingLeft) return 0.3;
    if (direction === 'right' && isSwipingRight) return 0.3;
    return 0;
  };
  
  return (
    <View style={styles.wrapper}>
      {/* Swipe indicators */}
      <View style={[styles.swipeIndicator, styles.leftIndicator, { opacity: getSwipeIndicatorOpacity('right') }]}>
        <Text style={styles.swipeIndicatorText}>←</Text>
      </View>
      <View style={[styles.swipeIndicator, styles.rightIndicator, { opacity: getSwipeIndicatorOpacity('left') }]}>
        <Text style={styles.swipeIndicatorText}>→</Text>
      </View>
      
      <Animated.View
        style={[styles.container, animatedContainerStyle]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={[
            styles.tab, 
            currentView === FEED_VIEW_TYPES.DISCOVER && styles.activeTab,
            { borderBottomColor: currentView === FEED_VIEW_TYPES.DISCOVER ? palette.text : 'transparent' }
          ]}
          onPress={() => changeView(FEED_VIEW_TYPES.DISCOVER)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText, 
            currentView === FEED_VIEW_TYPES.DISCOVER && styles.activeTabText,
            { color: currentView === FEED_VIEW_TYPES.DISCOVER ? palette.text : palette.border }
          ]}>
            {t('discover') || 'Discover'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            currentView === FEED_VIEW_TYPES.FRIENDS && styles.activeTab,
            { borderBottomColor: currentView === FEED_VIEW_TYPES.FRIENDS ? palette.text : 'transparent' }
          ]}
          onPress={() => changeView(FEED_VIEW_TYPES.FRIENDS)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText, 
            currentView === FEED_VIEW_TYPES.FRIENDS && styles.activeTabText,
            { color: currentView === FEED_VIEW_TYPES.FRIENDS ? palette.text : palette.border }
          ]}>
            {t('friends') || 'Friends'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const themedStyles = createThemedStyles((palette) => ({
  wrapper: {
    position: 'relative',
    backgroundColor: palette.page_background,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: palette.page_background,
    paddingBottom: 0,
    borderWidth:1,
    borderBottomColor: palette.layout,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: withAlpha(palette.text, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -15 }],
  },
  leftIndicator: {
    left: 10,
  },
  rightIndicator: {
    right: 10,
  },
  swipeIndicatorText: {
    fontSize: 18,
    color: palette.text,
    fontWeight: 'bold',
  },
}));

export default FeedViewSelector;