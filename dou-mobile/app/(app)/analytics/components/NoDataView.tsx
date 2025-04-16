// components/NoDataView.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';

interface NoDataViewProps {
  message: string;
}

export const NoDataView: React.FC<NoDataViewProps> = ({ message }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: palette.border + '30' }]}>
        <Feather name="bar-chart-2" size={40} color={palette.border} />
      </View>
      
      <Text style={[styles.message, { color: palette.text }]}>
        {message}
      </Text>
      
      <Text style={[styles.subMessage, { color: palette.text + '80' }]}>
        {t('complete_workouts_to_see_analytics')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
});