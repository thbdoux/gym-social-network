// components/navigation/CustomBackButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface CustomBackButtonProps {
  defaultRoute?: string;
}

const CustomBackButton: React.FC<CustomBackButtonProps> = ({
  defaultRoute = '/feed',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const pressed = useSharedValue(0);
  
  const handleGoBack = () => {
    pressed.value = withTiming(1, { duration: 150 }, () => {
      pressed.value = withTiming(0, { duration: 150 });
    });
    
    // Implement smarter back navigation logic
    if (pathname.includes('/settings/language')) {
      router.push('/settings');
    } else if (pathname.includes('/settings')) {
      router.push('/profile');
    } else if (pathname.includes('/workouts') || pathname.includes('/profile')) {
      router.push('/feed');
    } else if (defaultRoute) {
      router.push(defaultRoute);
    } else {
      router.back();
    }
  };
  
  const backAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.9],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ scale }],
    };
  });
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleGoBack}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.backIcon, backAnimatedStyle]}>
        <View style={styles.arrowLine1} />
        <View style={styles.arrowLine2} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginLeft: 4,
  },
  backIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  arrowLine1: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }, { translateY: -4 }]
  },
  arrowLine2: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }, { translateY: 4 }]
  }
});

export default CustomBackButton;