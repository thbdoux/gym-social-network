// hooks/usePreventRemove.ts
import { useEffect } from 'react';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';

/**
 * A hook to prevent navigation removing the screen from the stack
 * when it shouldn't be removed.
 * 
 * This helps resolve issues where screens are removed natively
 * but don't get removed from JS state.
 */
export function usePreventRemove(prevent = true, dependencies: any[] = []) {
  const navigation = useNavigation();

  useEffect(() => {
    if (prevent) {
      // Prevent going back with hardware back button on Android
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return true; // Returning true prevents the default behavior
      });

      // Prevent going back with gesture or back button
      navigation.setOptions({
        headerBackButtonMenuEnabled: false,
        freezeOnBlur: true,
        gestureEnabled: false,
      });

      return () => {
        backHandler.remove();
      };
    } else {
      // Allow going back with hardware back button on Android
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return false; // Returning false allows the default behavior
      });

      // Allow going back with gesture or back button
      navigation.setOptions({
        headerBackButtonMenuEnabled: true,
        freezeOnBlur: false,
        gestureEnabled: true,
      });

      return () => {
        backHandler.remove();
      };
    }
  }, [navigation, prevent, ...dependencies]);
}