// components/navigation/CustomBackButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface CustomBackButtonProps {
  defaultRoute?: string;
}

const CustomBackButton: React.FC<CustomBackButtonProps> = ({
  defaultRoute = '/feed',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleGoBack = () => {
    // Implement smarter back navigation logic
    if (pathname.includes('/settings/language')) {
      router.push('/settings');
    } else if (pathname.includes('/settings')) {
      router.push('/profile');
    } else if (pathname.includes('/workouts') || pathname.includes('/profile')) {
      router.push('/feed');
    } else if (defaultRoute) {
      router.push(defaultRoute);
    } else {
      router.back();
    }
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={handleGoBack}>
      <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  }
});

export default CustomBackButton;