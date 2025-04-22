// app/(app)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import BottomTabBar from '../../components/navigation/BottomTabBar';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../utils/createThemedStyles';

export default function AppLayout() {
  const { palette } = useTheme();
  const styles = themedStyles(palette);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: palette.page_background,
          },
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      />
      <BottomTabBar />
    </View>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
}));