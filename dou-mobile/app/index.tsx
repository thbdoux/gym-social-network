// app/index.tsx - Version ultra-simple pour éviter les boucles iOS
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [forceState, setForceState] = useState<'login' | 'app' | null>(null);

  console.log('📍 Index render - Auth:', isAuthenticated, 'Loading:', isLoading, 'User:', !!user, 'Error:', !!error);

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

  // Show loading state with manual controls
  if (isLoading || !showContent) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#080f19',
        padding: 20,
      }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: '#9CA3AF', marginTop: 20, fontSize: 16, textAlign: 'center' }}>
          {isLoading ? 'Checking authentication...' : 'Preparing app...'}
        </Text>
        
        {error && (
          <Text style={{ 
            color: '#EF4444', 
            marginTop: 10, 
            fontSize: 14, 
            textAlign: 'center',
            paddingHorizontal: 20,
          }}>
            {error}
          </Text>
        )}

        {/* Manual navigation buttons for debugging */}
        <View style={{ marginTop: 30, gap: 10 }}>
          <TouchableOpacity
            onPress={handleForceLogin}
            style={{
              backgroundColor: '#3B82F6',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Go to Login
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleForceApp}
            style={{
              backgroundColor: '#10B981',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Go to App (Test)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{ 
          color: '#6B7280', 
          marginTop: 20, 
          fontSize: 12, 
          textAlign: 'center' 
        }}>
          Debug: Auth={isAuthenticated ? 'Yes' : 'No'} | User={user ? 'Yes' : 'No'}
        </Text>
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