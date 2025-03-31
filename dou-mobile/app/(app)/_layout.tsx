// app/(app)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import BottomTabBar from '../../components/navigation/BottomTabBar';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#111827',
          },
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      />
      <BottomTabBar />
    </View>
  );
}