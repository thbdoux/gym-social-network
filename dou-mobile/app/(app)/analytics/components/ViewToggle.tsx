// components/ViewToggle.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';

export type ViewMode = 'chart' | 'table';

interface ViewToggleProps {
  currentView: ViewMode;
  onToggle: (view: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onToggle }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  
  return (
    <View style={[styles.container, { backgroundColor: palette.border + '30', borderColor: palette.border + '50' }]}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          currentView === 'chart' && { backgroundColor: palette.highlight }
        ]}
        onPress={() => onToggle('chart')}
      >
        <Feather 
          name="bar-chart-2" 
          size={16} 
          color={currentView === 'chart' ? '#FFFFFF' : palette.text} 
        />
        <Text 
          style={[
            styles.toggleText, 
            { color: currentView === 'chart' ? '#FFFFFF' : palette.text }
          ]}
        >
          {t('charts')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.toggleButton,
          currentView === 'table' && { backgroundColor: palette.highlight }
        ]}
        onPress={() => onToggle('table')}
      >
        <Feather 
          name="grid" 
          size={16} 
          color={currentView === 'table' ? '#FFFFFF' : palette.text} 
        />
        <Text 
          style={[
            styles.toggleText, 
            { color: currentView === 'table' ? '#FFFFFF' : palette.text }
          ]}
        >
          {t('table')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});