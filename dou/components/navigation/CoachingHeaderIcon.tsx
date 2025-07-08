// components/navigation/CoachingHeaderIcon.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface CoachingHeaderIconProps {
  size?: number;
  style?: any;
}

const CoachingHeaderIcon: React.FC<CoachingHeaderIconProps> = ({ 
  size = 24, 
  style 
}) => {
  const { palette } = useTheme();

  const handlePress = () => {
    router.push('/(app)/realtime-coaching');
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="sparkles" 
        size={size} 
        color={palette.text || '#00F5FF'} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CoachingHeaderIcon;