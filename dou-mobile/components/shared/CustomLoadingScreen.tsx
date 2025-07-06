// components/common/CustomLoadingScreen.tsx - Enhanced with logo fill animation
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, StyleSheet, ImageSourcePropType, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { imageManager, useImagePreloading } from '../../utils/imageManager';

const { width: screenWidth } = Dimensions.get('window');

interface CustomLoadingScreenProps {
  text?: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  animationType?: 'rotate' | 'pulse' | 'bounce' | 'fade' | 'breathe' | 'float' | 'fill';
  imageSource?: ImageSourcePropType;
  backgroundColor?: string;
  textColor?: string;
  tintColor?: string;
  preloadImages?: boolean;
  phase?: 'initializing' | 'checking' | 'finalizing' | 'loading';
  showProgress?: boolean;
  subtitle?: string;
  // Development props
  developmentMode?: boolean;
  onSkip?: () => void;
}

export default function CustomLoadingScreen({ 
  text, 
  showText = true, 
  size = 'large',
  style,
  animationType = 'fill',
  imageSource,
  backgroundColor,
  textColor,
  tintColor,
  preloadImages = true,
  phase = 'loading',
  showProgress = false,
  subtitle,
  developmentMode = false,
  onSkip
}: CustomLoadingScreenProps) {
  const { palette } = useTheme();
  const { t } = useLanguage();
  
  // Animation values
  const fillAnimValue = useRef(new Animated.Value(0)).current;
  const fadeInAnimValue = useRef(new Animated.Value(0)).current;
  const textAnimValue = useRef(new Animated.Value(0)).current;
  const glowAnimValue = useRef(new Animated.Value(0)).current;
  
  const [imageLoaded, setImageLoaded] = useState(true);
  const [fallbackActive, setFallbackActive] = useState(false);
  
  // Preload loading screen images
  const { isLoaded: imagesPreloaded } = useImagePreloading(preloadImages ? ['icons'] : []);

  // Register images
  useEffect(() => {
    imageManager.registerLocalImage('icons', 'loading-default', require('../../assets/images/dou-white.png'));
    imageManager.registerLocalImage('icons', 'loading-fallback', require('../../assets/images/dou.png'));
  }, []);

  // Get localized text based on phase
  const getPhaseText = () => {
    if (text) return text;
    
    switch (phase) {
      case 'initializing':
        return t?.('loading.initializing') || 'Initializing...';
      case 'checking':
        return t?.('loading.authenticating') || 'Authenticating...';
      case 'finalizing':
        return t?.('loading.preparing') || 'Preparing your experience...';
      default:
        return t?.('loading.default') || 'Loading...';
    }
  };

  const getImageSource = () => {
    if (imageSource) return imageSource;
    return require('../../assets/images/dou-white.png');
  };

  const getFallbackImageSource = () => {
    return require('../../assets/images/dou.png');
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { width: 80, height: 30 };
      case 'medium':
        return { width: 120, height: 45 };
      case 'large':
      default:
        return { width: 160, height: 60 };
    }
  };

  const sizeConfig = getSizeConfig();

  const handleImageLoad = () => {
    setImageLoaded(true);
    setFallbackActive(false);
  };

  const handleImageError = () => {
    console.warn('Loading screen image failed to load, using fallback');
    setFallbackActive(true);
    setImageLoaded(true);
  };

  // Setup animations
  useEffect(() => {
    // Fade in the entire component
    Animated.timing(fadeInAnimValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Elegant breathing animation for logo
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fillAnimValue, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(fillAnimValue, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );

    // Soft glow effect
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    // Gentle text animation
    const textAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(textAnimValue, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(textAnimValue, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    breatheAnimation.start();
    glowAnimation.start();
    textAnimation.start();

    return () => {
      breatheAnimation.stop();
      glowAnimation.stop();
      textAnimation.stop();
    };
  }, []);

  const getLogoAnimatedStyle = () => {
    return {
      opacity: fadeInAnimValue,
      transform: [{
        scale: fillAnimValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1.08],
        })
      }]
    };
  };

  const getGlowStyle = () => {
    return {
      opacity: glowAnimValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.9],
      }),
      transform: [{
        scale: glowAnimValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        })
      }]
    };
  };

  const getTextAnimatedStyle = () => {
    return {
      opacity: Animated.multiply(
        fadeInAnimValue,
        textAnimValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1],
        })
      ),
      transform: [{
        scale: textAnimValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.02, 1],
        })
      }]
    };
  };

  return (
    <Animated.View style={[
      styles.container, 
      { backgroundColor: backgroundColor || palette.page_background }, 
      style,
      { opacity: fadeInAnimValue }
    ]}>
      {/* Logo container with breathing and glow effect */}
      <View style={styles.logoContainer}>
        {/* Soft glow background */}
        <Animated.View style={[
          styles.logoGlow,
          {
            width: sizeConfig.width + 60,
            height: sizeConfig.height + 60,
            backgroundColor: tintColor || palette.highlight,
          },
          getGlowStyle()
        ]} />

        {/* Main logo with breathing animation */}
        <Animated.View style={[styles.logoWrapper, getLogoAnimatedStyle()]}>
          <Image
            source={fallbackActive ? getFallbackImageSource() : getImageSource()}
            style={[
              styles.logo,
              sizeConfig,
              { tintColor: '#FFFFFF' }
            ]}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </Animated.View>
      </View>

      {/* Text content */}
      {showText && (
        <Animated.View style={[
          styles.textContainer,
          getTextAnimatedStyle()
        ]}>
          <Text style={[
            styles.loadingText,
            { color: textColor || palette.text },
            size === 'small' && styles.smallText
          ]}>
            {getPhaseText()}
          </Text>
          
          {subtitle && (
            <Text style={[
              styles.subtitleText,
              { color: `${textColor || palette.text}80` }
            ]}>
              {subtitle}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Development Skip Button */}
      {developmentMode && onSkip && (
        <Animated.View style={[
          styles.skipButtonContainer,
          {
            opacity: fadeInAnimValue.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0, 0, 1],
            }),
            transform: [{
              translateY: fadeInAnimValue.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }
        ]}>
          <TouchableOpacity
            onPress={onSkip}
            style={[
              styles.skipButton,
              {
                backgroundColor: `${tintColor || palette.highlight}20`,
                borderColor: `${tintColor || palette.highlight}40`,
              }
            ]}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.skipButtonText,
              { color: tintColor || palette.highlight }
            ]}>
              {t?.('development.skip') || 'Skip Loading (Dev)'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[
            styles.devModeLabel,
            { color: `${textColor || palette.text}50` }
          ]}>
            {t?.('development.mode') || 'Development Mode'}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    // Size applied dynamically
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: screenWidth * 0.8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  smallText: {
    fontSize: 16,
  },
  skipButtonContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 8,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  devModeLabel: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});