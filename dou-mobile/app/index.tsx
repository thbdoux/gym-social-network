// app/index.tsx - Enhanced with polished loading experience and development mode
import { useEffect, useState, useRef } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, Text, Animated, StatusBar } from 'react-native';
import CustomLoadingScreen from '../components/shared/CustomLoadingScreen';
import { useLoadingScreenImages } from '../utils/imageManager';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

// Development configuration
const __DEV_MODE__ = __DEV__; // Set to false for production
const ENABLE_PERPETUAL_LOADING = __DEV_MODE__ && true; // Toggle perpetual loading in dev

type LoadingPhase = 'initializing' | 'checking' | 'finalizing' | 'ready';

export default function Index() {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  const { t } = useLanguage();
  const { palette } = useTheme();
  
  const [showContent, setShowContent] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('initializing');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [devModeSkipped, setDevModeSkipped] = useState(false);
  
  const fadeOutValue = useRef(new Animated.Value(1)).current;
  const { isReady: loadingImagesReady } = useLoadingScreenImages();

  // Development mode: Override loading states for testing
  const isActuallyLoading = ENABLE_PERPETUAL_LOADING && !devModeSkipped ? true : isLoading;

  console.log('📍 Index render - Auth:', isAuthenticated, 'Loading:', isLoading, 'User:', !!user, 'Error:', !!error);
  
  if (ENABLE_PERPETUAL_LOADING) {
    console.log('🔧 Development Mode Active - Perpetual Loading:', !devModeSkipped, 'Phase:', loadingPhase);
  }
  
  // Development skip handler
  const handleDevSkip = () => {
    console.log('🚀 Development mode: Skipping loading screen');
    setDevModeSkipped(true);
    
    // Start fade out immediately
    Animated.timing(fadeOutValue, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setShouldRedirect(true);
    });
  };

  // Manage loading phases with smooth transitions
  useEffect(() => {
    let phaseTimer: NodeJS.Timeout;

    if (isActuallyLoading) {
      // Start with checking phase when auth is loading
      setLoadingPhase('checking');
    } else if (!devModeSkipped) {
      // Move to finalizing phase when auth completes (unless dev skipped)
      setLoadingPhase('finalizing');
      
      // After a brief moment, prepare for redirect
      phaseTimer = setTimeout(() => {
        setLoadingPhase('ready');
        
        // Start fade out animation
        Animated.timing(fadeOutValue, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          // Enable redirect after fade out completes
          setShouldRedirect(true);
        });
      }, 1200); // Give users time to see the "preparing" message
    }

    return () => {
      if (phaseTimer) clearTimeout(phaseTimer);
    };
  }, [isActuallyLoading, devModeSkipped, fadeOutValue]);

  // Initial phase progression
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (loadingPhase === 'initializing') {
        setLoadingPhase('checking');
      }
    }, 800);

    return () => clearTimeout(initTimer);
  }, [loadingPhase]);

  // Get phase-specific content
  const getPhaseConfig = () => {
    switch (loadingPhase) {
      case 'initializing':
        return {
          animationType: 'fill' as const,
          text: t?.('loading.starting') || 'Starting up...',
          subtitle: t?.('loading.starting_subtitle') || 'Welcome back',
          showProgress: false,
        };
      case 'checking':
        return {
          animationType: 'fill' as const,
          text: t?.('loading.authenticating') || 'Authenticating...',
          subtitle: t?.('loading.auth_subtitle') || 'Verifying your credentials',
          showProgress: false,
        };
      case 'finalizing':
        return {
          animationType: 'fill' as const,
          text: t?.('loading.preparing') || 'Almost ready...',
          subtitle: t?.('loading.prep_subtitle') || 'Preparing your personalized experience',
          showProgress: false,
        };
      case 'ready':
        return {
          animationType: 'fill' as const,
          text: t?.('loading.ready') || 'Welcome!',
          subtitle: '',
          showProgress: false,
        };
      default:
        return {
          animationType: 'fill' as const,
          text: t?.('loading.default') || 'Loading...',
          subtitle: '',
          showProgress: false,
        };
    }
  };

  const phaseConfig = getPhaseConfig();

  // Handle redirects only after fade out
  if (shouldRedirect) {
    console.log('🚀 Index redirecting - Auth:', isAuthenticated, 'User:', !!user);
    
    if (error) {
      // If there's an auth error, go to login
      return <Redirect href="/(auth)/login" />;
    }
    
    // In development mode, use actual auth state for redirect decision
    const actualAuth = ENABLE_PERPETUAL_LOADING ? isAuthenticated : isAuthenticated;
    const actualUser = ENABLE_PERPETUAL_LOADING ? user : user;
    
    if (actualAuth && actualUser) {
      return <Redirect href="/(app)/feed" />;
    } else {
      return <Redirect href="/(auth)/login" />;
    }
  }

  // Show enhanced loading screen
  return (
    <View style={{ flex: 1 }}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={palette.page_background || '#080f19'} 
        translucent={false}
      />
      
      <Animated.View style={{ 
        flex: 1, 
        opacity: fadeOutValue 
      }}>
        <CustomLoadingScreen
          text={phaseConfig.text}
          subtitle={phaseConfig.subtitle}
          animationType={phaseConfig.animationType}
          size="large"
          backgroundColor={palette.page_background || '#080f19'}
          textColor={palette.text || '#F3F4F6'}
          tintColor={palette.highlight || '#3B82F6'}
          preloadImages={loadingImagesReady}
          phase={loadingPhase}
          showProgress={phaseConfig.showProgress}
          showText={true}
          developmentMode={ENABLE_PERPETUAL_LOADING}
          onSkip={handleDevSkip}
        />

        {/* Development Mode Indicator */}
        {ENABLE_PERPETUAL_LOADING && (
          <Animated.View style={{
            position: 'absolute',
            top: 60,
            left: 24,
            right: 24,
            opacity: fadeOutValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.8],
            }),
          }}>
            <View style={{
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: 'rgba(251, 191, 36, 0.3)',
              alignItems: 'center',
            }}>
              <Text style={{ 
                color: '#F59E0B', 
                fontSize: 12, 
                fontWeight: '600',
                marginBottom: 2,
              }}>
                🔧 {t?.('development.perpetual_mode') || 'PERPETUAL LOADING MODE'}
              </Text>
              <Text style={{ 
                color: '#F59E0B', 
                fontSize: 10, 
                opacity: 0.8,
                textAlign: 'center',
              }}>
                {t?.('development.perpetual_desc') || 'Testing loading animations - Use skip button to continue'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Elegant error display */}
        {error && (
          <Animated.View style={{
            position: 'absolute',
            bottom: 120,
            left: 24,
            right: 24,
            opacity: fadeOutValue,
          }}>
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.2)',
              alignItems: 'center',
            }}>
              <Text style={{ 
                color: '#EF4444', 
                fontSize: 16, 
                fontWeight: '600',
                marginBottom: 4,
              }}>
                {t?.('error.connection_title') || 'Connection Issue'}
              </Text>
              <Text style={{ 
                color: '#EF4444', 
                fontSize: 14, 
                textAlign: 'center',
                opacity: 0.9,
                lineHeight: 20,
              }}>
                {t?.('error.connection_message') || 'Please check your connection and try again'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Subtle version info */}
        <Animated.View style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          alignItems: 'center',
          opacity: Animated.multiply(fadeOutValue, 0.5),
        }}>
          <Text style={{ 
            color: palette.text || '#6B7280', 
            fontSize: 12, 
            opacity: 0.6,
            fontWeight: '400',
          }}>
            {t?.('app.version') || 'Version'} 1.0.0
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}