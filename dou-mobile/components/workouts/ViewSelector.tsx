// components/workouts/ViewSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

// Define constants for view types
export const VIEW_TYPES = {
  PROGRAMS: 'programs',
  WORKOUT_HISTORY: 'workout_history',
  TEMPLATES: 'templates'
};

// Define order of views for swiping
export const VIEW_ORDER = [
  VIEW_TYPES.PROGRAMS,
  VIEW_TYPES.WORKOUT_HISTORY, 
  VIEW_TYPES.TEMPLATES
];

interface ViewSelectorProps {
  currentView: string;
  viewSelectorVisible: boolean;
  toggleViewSelector: () => void;
  changeView: (viewType: string) => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({
  currentView,
  viewSelectorVisible,
  toggleViewSelector,
  changeView
}) => {
  const { t } = useLanguage();

  // Get view title using language context
  const getViewTitle = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return t('programs');
      case VIEW_TYPES.WORKOUT_HISTORY:
        return t('workout_history');
      case VIEW_TYPES.TEMPLATES:
        return t('templates');
      default:
        return '';
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.viewSelector}
        onPress={toggleViewSelector}
      >
        <Text style={styles.viewTitle}>{getViewTitle()}</Text>
        <Ionicons 
          name={viewSelectorVisible ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      
      {viewSelectorVisible && (
        <View style={styles.dropdown}>
          <TouchableOpacity 
            style={[
              styles.dropdownItem, 
              currentView === VIEW_TYPES.PROGRAMS && styles.activeDropdownItem
            ]}
            onPress={() => changeView(VIEW_TYPES.PROGRAMS)}
          >
            <Text style={[
              styles.dropdownText, 
              currentView === VIEW_TYPES.PROGRAMS && styles.activeDropdownText
            ]}>
              {t('programs')}
            </Text>
            {currentView === VIEW_TYPES.PROGRAMS && (
              <Ionicons name="checkmark" size={20} color="#7e22ce" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.dropdownItem, 
              currentView === VIEW_TYPES.WORKOUT_HISTORY && styles.activeDropdownItem
            ]}
            onPress={() => changeView(VIEW_TYPES.WORKOUT_HISTORY)}
          >
            <Text style={[
              styles.dropdownText, 
              currentView === VIEW_TYPES.WORKOUT_HISTORY && styles.activeDropdownText
            ]}>
              {t('workout_history')}
            </Text>
            {currentView === VIEW_TYPES.WORKOUT_HISTORY && (
              <Ionicons name="checkmark" size={20} color="#16a34a" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.dropdownItem, 
              currentView === VIEW_TYPES.TEMPLATES && styles.activeDropdownItem
            ]}
            onPress={() => changeView(VIEW_TYPES.TEMPLATES)}
          >
            <Text style={[
              styles.dropdownText, 
              currentView === VIEW_TYPES.TEMPLATES && styles.activeDropdownText
            ]}>
              {t('templates')}
            </Text>
            {currentView === VIEW_TYPES.TEMPLATES && (
              <Ionicons name="checkmark" size={20} color="#2563eb" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  viewSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    flexShrink: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 8,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeDropdownItem: {
    backgroundColor: '#374151',
  },
  dropdownText: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  activeDropdownText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ViewSelector;