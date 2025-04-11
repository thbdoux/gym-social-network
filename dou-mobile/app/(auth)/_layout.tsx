// app/(app)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* This Stack manages all screens within the authenticated app group */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#080f19',
          },
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      />
    </View>
  );
}