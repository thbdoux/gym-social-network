// components/navigation/SidebarButton.tsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  interpolate,
  Extrapolate 
} from 'react-native-reanimated';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

const SidebarButton = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const animation = useSharedValue(0);
  const { palette } = useTheme();
  
  useEffect(() => {
    animation.value = withTiming(showSidebar ? 1 : 0, { duration: 300 });
  }, [showSidebar]);

  const firstLineStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      animation.value,
      [0, 1],
      [0, 45],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      animation.value,
      [0, 1],
      [0, 8],
      Extrapolate.CLAMP
    );
    
    return {
      width: interpolate(animation.value, [0, 1], [16, 20]),
      height: 2,
      backgroundColor: palette.text,
      marginBottom: 4,
      borderRadius: 4,
      transform: [
        { rotate: `${rotate}deg` },
        { translateY },
      ],
    };
  });
  
  const secondLineStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(animation.value, [0, 1], [20, 0]),
      height: 2,
      backgroundColor: palette.text,
      marginBottom: 4,
      borderRadius: 4,
      opacity: interpolate(animation.value, [0, 1], [1, 0]),
    };
  });
  
  const thirdLineStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      animation.value,
      [0, 1],
      [0, -45],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      animation.value,
      [0, 1],
      [0, -8],
      Extrapolate.CLAMP
    );
    
    return {
      width: interpolate(animation.value, [0, 1], [12, 20]),
      height: 2,
      backgroundColor: palette.text,
      borderRadius: 4,
      transform: [
        { rotate: `${rotate}deg` },
        { translateY },
      ],
    };
  });
  
  const handlePress = () => {
    setShowSidebar(true);
  };
  
  const handleCloseSidebar = () => {
    setShowSidebar(false);
  };
  
  return (
    <>
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: palette.layout }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Animated.View style={firstLineStyle} />
          <Animated.View style={secondLineStyle} />
          <Animated.View style={thirdLineStyle} />
        </View>
      </TouchableOpacity>
      
      <Sidebar 
        isVisible={showSidebar} 
        onClose={handleCloseSidebar} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
    marginRight: 6,
    borderRadius: 12,
  },
  iconContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
});

export default SidebarButton;