// app/index.tsx - Updated to work with fixed AuthContext
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  const [redirectReady, setRedirectReady] = useState(false);

  // Add a small delay before redirecting to ensure auth state is stable
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setRedirectReady(true);
        console.log('📍 Redirect ready - Auth:', isAuthenticated, 'User:', !!user);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, user]);

  // Show loading state
  if (isLoading || !redirectReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#080f19' 
      }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: '#9CA3AF', marginTop: 10, fontSize: 16 }}>
          {isLoading ? 'Loading...' : 'Preparing...'}
        </Text>
        {error && (
          <Text style={{ color: '#EF4444', marginTop: 8, fontSize: 14, textAlign: 'center' }}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated && user) {
    console.log('✅ Redirecting to app/feed');
    return <Redirect href="/(app)/feed" />;
  } else {
    console.log('❌ Redirecting to auth/login');  
    return <Redirect href="/(auth)/login" />;
  }
}