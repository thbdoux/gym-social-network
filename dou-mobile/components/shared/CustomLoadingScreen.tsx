// components/common/CustomLoadingScreen.tsx - Enhanced with image caching
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, StyleSheet, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { imageManager, useImagePreloading } from '../../utils/imageManager';

interface CustomLoadingScreenProps {
  text?: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  animationType?: 'rotate' | 'pulse' | 'bounce' | 'fade';
  imageSource?: ImageSourcePropType;
  backgroundColor?: string;
  textColor?: string;
  tintColor?: string;
  preloadImages?: boolean; // New prop to control preloading
}

export default function CustomLoadingScreen({ 
  text = 'Loading...', 
  showText = true, 
  size = 'large',
  style,
  animationType = 'rotate',
  imageSource,
  backgroundColor,
  textColor,
  tintColor,
  preloadImages = true
}: CustomLoadingScreenProps) {
  const { palette } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [imageLoaded, setImageLoaded] = useState(true); // Start as loaded to avoid placeholder
  const [fallbackActive, setFallbackActive] = useState(false);
  
  // Preload loading screen images
  const { isLoaded: imagesPreloaded } = useImagePreloading(preloadImages ? ['icons'] : []);

  // Register and get the default loading image
  useEffect(() => {
    // Register the loading screen image with the image manager
    imageManager.registerLocalImage('icons', 'loading-default', require('../../assets/images/dou-white.png'));
    imageManager.registerLocalImage('icons', 'loading-fallback', require('../../assets/images/dou.png')); // Fallback
  }, []);

  // Get the appropriate image source
  const getImageSource = () => {
    if (imageSource) {
      return imageSource;
    }
    
    // Always use direct require for loading screens to avoid delays
    // The imageManager preloading happens in background but we use direct requires for immediate display
    return require('../../assets/images/dou-white.png');
  };

  const getFallbackImageSource = () => {
    return require('../../assets/images/dou.png');
  };

  // Get size dimensions
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40 };
      case 'medium':
        return { width: 60, height: 60 };
      case 'large':
      default:
        return { width: 100, height: 100 };
    }
  };

  const sizeConfig = getSizeConfig();

  // Handle image load events
  const handleImageLoad = () => {
    setImageLoaded(true);
    setFallbackActive(false);
  };

  const handleImageError = () => {
    console.warn('Loading screen image failed to load, using fallback');
    setFallbackActive(true);
    setImageLoaded(true); // Consider loaded to continue with animation
  };

  // Setup animation
  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    switch (animationType) {
      case 'rotate':
        animation = Animated.loop(
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        );
        break;
      
      case 'pulse':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        break;
      
      case 'bounce':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        break;
      
      case 'fade':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0.3,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        );
        break;
    }

    // Start animation immediately - don't wait for image loading
    animation.start();

    return () => {
      animation.stop();
    };
  }, [animationType, imageLoaded, preloadImages]);

  const getAnimatedStyle = () => {
    switch (animationType) {
      case 'rotate':
        return {
          transform: [{
            rotate: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            })
          }]
        };
      
      case 'pulse':
        return {
          transform: [{
            scale: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.2],
            })
          }]
        };
      
      case 'bounce':
        return {
          transform: [{
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -20],
            })
          }]
        };
      
      case 'fade':
        return {
          opacity: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          })
        };
      
      default:
        return {};
    }
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: backgroundColor || palette.page_background }, 
      style
    ]}>
      <Animated.View style={[styles.imageContainer, getAnimatedStyle()]}>
        <Image
          source={fallbackActive ? getFallbackImageSource() : getImageSource()}
          style={[
            styles.loadingImage,
            sizeConfig,
            tintColor && { tintColor: tintColor || palette.highlight }
          ]}
          resizeMode="contain"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </Animated.View>

      {showText && (
        <Text
          style={[
            styles.loadingText,
            { color: textColor || palette.text },
            size === 'small' && styles.smallText
          ]}
        >
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingImage: {
    // Size will be applied dynamically
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
    marginTop: 8,
  },
});