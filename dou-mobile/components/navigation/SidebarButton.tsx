// components/navigation/SidebarButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const SidebarButton = () => {
  const lineWidth = useSharedValue(1);
  
  const firstLineStyle = useAnimatedStyle(() => {
    return {
      width: 16,
      height: 2,
      backgroundColor: '#FFFFFF',
      marginBottom: 4,
      borderRadius: 4,
    };
  });
  
  const secondLineStyle = useAnimatedStyle(() => {
    return {
      width: 20,
      height: 2,
      backgroundColor: '#FFFFFF',
      marginBottom: 4,
      borderRadius: 4,
    };
  });
  
  const thirdLineStyle = useAnimatedStyle(() => {
    return {
      width: 12,
      height: 2,
      backgroundColor: '#FFFFFF',
      borderRadius: 4,
    };
  });
  
  const handlePress = () => {
    lineWidth.value = withTiming(lineWidth.value === 1 ? 0.5 : 1, { duration: 300 });
    router.push('/settings');
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Animated.View style={firstLineStyle} />
        <Animated.View style={secondLineStyle} />
        <Animated.View style={thirdLineStyle} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    marginRight: 16,
  },
  iconContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
});

export default SidebarButton;