// components/navigation/HeaderSettingsButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const HeaderSettingsButton = () => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push('/settings')}
    >
      <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    padding: 4,
  },
});

export default HeaderSettingsButton;