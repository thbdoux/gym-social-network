// components/common/DouLoadingScreen.tsx
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  Animated, 
  StyleSheet, 
  ImageSourcePropType, 
  Dimensions 
} from 'react-native';
import { useLoadingScreenImages } from '../../utils/imageManager';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

interface DouLoadingScreenProps {
  text?: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  imageSource?: ImageSourcePropType;
  animationType?: 'pulse' | 'bounce' | 'none';
  imageVariant?: 'default' | 'fallback';
}

export default function DouLoadingScreen({ 
  text = "Loading...", 
  showText = true, 
  size = 'large',
  style,
  imageSource,
  animationType = 'pulse',
  imageVariant = 'default'
}: DouLoadingScreenProps) {
  
  // Image preloading hook
  const { isReady: imagesReady, getImage } = useLoadingScreenImages();

  const { t } = useLanguage();
  const { palette } = useTheme();
  const backgroundColor = palette.page_background;
  // Animation values
  const logoAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { width: 120, height: 45, fontSize: 14 };
      case 'medium':
        return { width: 160, height: 60, fontSize: 16 };
      case 'large':
      default:
        return { width: 200, height: 75, fontSize: 18 };
    }
  };

  const sizeConfig = getSizeConfig();

  // Get the appropriate image source
  const getImageSource = (): ImageSourcePropType => {
    // If user provided a custom image source, use it
    if (imageSource) {
      return imageSource;
    }
    
    // Determine the best image variant if not explicitly set
    let selectedVariant = imageVariant;
    
    // Auto-select variant based on background color for better contrast
    if (imageVariant === 'default') {
      // Use fallback (darker logo) for light backgrounds
      const isLightBackground = backgroundColor === '#FFFFFF' || 
                               backgroundColor === '#F5F5F5' || 
                               backgroundColor === 'white' || 
                               backgroundColor === 'transparent';
      
      if (isLightBackground) {
        selectedVariant = 'fallback';
      }
    }
    
    // Use preloaded images from imageManager
    if (imagesReady) {
      return getImage(selectedVariant);
    }
    
    // Fallback to direct require if images aren't ready yet
    if (selectedVariant === 'fallback') {
      return require('../../assets/images/dou.png');
    }
    return require('../../assets/images/dou-white.png');
  };

  // Style animé du logo selon le type
  const getLogoAnimatedStyle = () => {
    if (animationType === 'pulse') {
      return {
        opacity: logoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 1],
        }),
        transform: [{
          scale: logoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1.05],
          })
        }]
      };
    } else if (animationType === 'bounce') {
      return {
        transform: [{
          translateY: logoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -15],
          })
        }, {
          scale: logoAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.1, 1],
          })
        }]
      };
    }
    return {}; // Pas d'animation si 'none'
  };

  useEffect(() => {
    // Fade in initial
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animation du logo selon le type
    let logoAnimation;
    
    if (animationType === 'pulse') {
      logoAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(logoAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(logoAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
    } else if (animationType === 'bounce') {
      logoAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(logoAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(logoAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.delay(400), // Pause entre les bounces
        ])
      );
    }

    // Animation des points de chargement
    const dotsAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    if (logoAnimation) logoAnimation.start();
    dotsAnimation.start();

    // Cleanup function
    return () => {
      if (logoAnimation) logoAnimation.stop();
      dotsAnimation.stop();
    };
  }, [animationType]);

  return (
    <Animated.View style={[
      styles.container, 
      { backgroundColor }, 
      style,
      { opacity: fadeInAnim }
    ]}>
      {/* Logo avec animation */}
      <Animated.View style={[
        styles.logoContainer, 
        { 
          width: sizeConfig.width, 
          height: sizeConfig.height 
        },
        getLogoAnimatedStyle()
      ]}>
        <Image
          source={getImageSource()}
          style={[
            styles.logo,
            {
              width: sizeConfig.width,
              height: sizeConfig.height,
              tintColor: palette.text,
            }
          ]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Points de chargement */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: palette.text,
                opacity: dotsAnim.interpolate({
                  inputRange: [0, 1, 2, 3],
                  outputRange: index === 0 
                    ? [0.3, 1, 0.3, 0.3]
                    : index === 1 
                    ? [0.3, 0.3, 1, 0.3]
                    : [0.3, 0.3, 0.3, 1],
                }),
              }
            ]}
          />
        ))}
      </View>

      {/* Texte de chargement */}
      {showText && (
        <Animated.View style={[
          styles.textContainer,
          {
            opacity: fadeInAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1],
            }),
          }
        ]}>
          <Text style={[
            styles.loadingText,
            { 
              color: palette.text,
              fontSize: sizeConfig.fontSize,
            }
          ]}>
            {t(text)}
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
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    // Taille appliquée dynamiquement
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: screenWidth * 0.8,
  },
  loadingText: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});