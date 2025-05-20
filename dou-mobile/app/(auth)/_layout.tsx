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
        animation: 'slide_from_right',
        animationDuration: 200,
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
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
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
      />
    </Stack>
  );
}