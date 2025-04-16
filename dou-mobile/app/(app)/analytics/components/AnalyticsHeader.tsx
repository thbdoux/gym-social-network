// components/AnalyticsHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';

export const AnalyticsHeader: React.FC = () => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <View style={[styles.container, { backgroundColor: palette.layout }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color={palette.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: palette.text }]}>
          {t('workout_analytics')}
        </Text>
        
        <View style={{ width: 24 }} /> {/* Empty view for balanced spacing */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0, // Account for status bar
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});