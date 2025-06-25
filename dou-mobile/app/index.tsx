// app/index.tsx - Enhanced with CustomLoadingScreen
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, Text, TouchableOpacity } from 'react-native';
import CustomLoadingScreen from '../components/shared/CustomLoadingScreen';
import { useLoadingScreenImages } from '../utils/imageManager';

export default function Index() {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [forceState, setForceState] = useState<'login' | 'app' | null>(null);
  const [authCheckPhase, setAuthCheckPhase] = useState<'initializing' | 'checking' | 'finalizing'>('initializing');
  
  // Ensure loading screen images are ready
  const { isReady: loadingImagesReady } = useLoadingScreenImages();

  console.log('📍 Index render - Auth:', isAuthenticated, 'Loading:', isLoading, 'User:', !!user, 'Error:', !!error);

  // Update auth check phase based on loading state
  useEffect(() => {
    if (isLoading) {
      setAuthCheckPhase('checking');
    } else if (!showContent) {
      setAuthCheckPhase('finalizing');
    }
  }, [isLoading, showContent]);

  // CRITICAL: Wait longer before showing any redirects
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        console.log('✅ Index ready to show content');
        setShowContent(true);
      }, 1000); // Wait 1 full second after loading stops

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Force navigation buttons for debugging
  const handleForceLogin = () => {
    console.log('🔧 Forcing login navigation');
    setForceState('login');
  };

  const handleForceApp = () => {
    console.log('🔧 Forcing app navigation');
    setForceState('app');
  };

  // Handle forced navigation
  if (forceState === 'login') {
    return <Redirect href="/(auth)/login" />;
  }
  if (forceState === 'app') {
    return <Redirect href="/(app)/feed" />;
  }

  // Get loading text based on phase
  const getLoadingText = () => {
    switch (authCheckPhase) {
      case 'initializing':
        return 'Starting up...';
      case 'checking':
        return 'Checking authentication...';
      case 'finalizing':
        return 'Preparing your experience...';
      default:
        return 'Loading...';
    }
  };

  // Get animation type based on phase
  const getAnimationType = () => {
    switch (authCheckPhase) {
      case 'initializing':
        return 'fade' as const;
      case 'checking':
        return 'rotate' as const;
      case 'finalizing':
        return 'pulse' as const;
      default:
        return 'rotate' as const;
    }
  };

  // Show custom loading screen with manual controls for debugging
  if (isLoading || !showContent) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080f19' }}>
        <CustomLoadingScreen
          text={getLoadingText()}
          animationType={getAnimationType()}
          size="large"
          backgroundColor="#080f19"
          textColor="#9CA3AF"
          tintColor="#3B82F6"
          preloadImages={loadingImagesReady}
        />
        
        {/* Error message overlay */}
        {error && (
          <View style={{
            position: 'absolute',
            bottom: 200,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
            padding: 16,
            borderWidth: 1,
            borderColor: '#EF4444',
          }}>
            <Text style={{ 
              color: '#EF4444', 
              fontSize: 14, 
              textAlign: 'center',
              fontWeight: '500',
            }}>
              Authentication Error
            </Text>
            <Text style={{ 
              color: '#EF4444', 
              fontSize: 12, 
              textAlign: 'center',
              marginTop: 4,
              opacity: 0.8,
            }}>
              {error}
            </Text>
          </View>
        )}

        {/* Debug controls - only show if not loading or if there's an error */}
        {(!isLoading || error) && (
          <View style={{
            position: 'absolute',
            bottom: 100,
            left: 20,
            right: 20,
            alignItems: 'center',
          }}>
            {/* Manual navigation buttons for debugging */}
            <View style={{ 
              flexDirection: 'row', 
              gap: 15,
              marginBottom: 20,
            }}>
              <TouchableOpacity
                onPress={handleForceLogin}
                style={{
                  backgroundColor: '#3B82F6',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                  minWidth: 120,
                }}
              >
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontWeight: '600',
                  textAlign: 'center',
                  fontSize: 14,
                }}>
                  Go to Login
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleForceApp}
                style={{
                  backgroundColor: '#10B981',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                  minWidth: 120,
                }}
              >
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontWeight: '600',
                  textAlign: 'center',
                  fontSize: 14,
                }}>
                  Go to App
                </Text>
              </TouchableOpacity>
            </View>

            {/* Debug info */}
            <View style={{
              backgroundColor: 'rgba(107, 114, 128, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: 'rgba(107, 114, 128, 0.2)',
            }}>
              <Text style={{ 
                color: '#6B7280', 
                fontSize: 11, 
                textAlign: 'center',
                fontFamily: 'monospace',
              }}>
                Auth: {isAuthenticated ? 'Yes' : 'No'} | User: {user ? 'Yes' : 'No'} | Phase: {authCheckPhase}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Only redirect after everything is stable
  console.log('🚀 Index redirecting - Auth:', isAuthenticated, 'User:', !!user);
  
  if (isAuthenticated && user) {
    return <Redirect href="/(app)/feed" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}