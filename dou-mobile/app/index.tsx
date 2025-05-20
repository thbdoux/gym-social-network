// app/index.tsx
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Redirect based on authentication status - use full path with group prefix
  if (isAuthenticated) {
    return <Redirect href="/(app)/feed" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}