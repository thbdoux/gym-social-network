// components/ViewToggle.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
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
    <View style={[styles.container, { backgroundColor: palette.page_background }]}>
      <View style={[
        styles.toggleContainer, 
        { backgroundColor: palette.border + '15', borderColor: palette.border + '30' }
      ]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === 'chart' && { backgroundColor: palette.highlight + '15' }
          ]}
          onPress={() => onToggle('chart')}
        >
          <Feather 
            name="bar-chart-2" 
            size={16} 
            color={currentView === 'chart' ? palette.highlight : palette.text + '80'} 
          />
          <Text style={[
            styles.toggleText,
            { color: currentView === 'chart' ? palette.highlight : palette.text + '80' }
          ]}>
            {t('charts')}
          </Text>
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: palette.border + '30' }]} />
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === 'table' && { backgroundColor: palette.highlight + '15' }
          ]}
          onPress={() => onToggle('table')}
        >
          <Feather 
            name="grid" 
            size={16} 
            color={currentView === 'table' ? palette.highlight : palette.text + '80'} 
          />
          <Text style={[
            styles.toggleText,
            { color: currentView === 'table' ? palette.highlight : palette.text + '80' }
          ]}>
            {t('table')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 16,
    zIndex: 90,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '80%',
    maxWidth: 280,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  toggleText: {
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
  }
});