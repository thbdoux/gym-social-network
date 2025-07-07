// app/(auth)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#080f19',
        },
        // Remove problematic animations
        animation: 'none', // or remove this line entirely
        // animationDuration: 200, // Remove this line
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen
        name="personality-wizard"
        options={{
          title: 'Create Account',
          // Remove animation here too
          // animation: 'slide_from_right',
        }}
      />
      {/* <Stack.Screen
        name="verify-email"
        options={{
          title: 'Verify Email',
        }}
      />
      <Stack.Screen
        name="verify-email-reminder"
        options={{
          title: 'Verify Email Reminder',
          gestureEnabled: false,
        }}
      /> */}
    </Stack>
  );
}