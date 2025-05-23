// components/workouts/ViewSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

// Define constants for view types
export const VIEW_TYPES = {
  PROGRAMS: 'programs',
  WORKOUT_HISTORY: 'workout_history',
  TEMPLATES: 'templates',
  GROUP_WORKOUTS: 'group_workouts'
};

// Define order of views for swiping
export const VIEW_ORDER = [
  VIEW_TYPES.GROUP_WORKOUTS,
  VIEW_TYPES.WORKOUT_HISTORY, 
  VIEW_TYPES.PROGRAMS,
  VIEW_TYPES.TEMPLATES,
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
  const { 
    workoutPalette, 
    programPalette, 
    workoutLogPalette, 
    groupWorkoutPalette, 
    palette 
  } = useTheme();

  // Get view title using language context
  const getViewTitle = () => {
    switch (currentView) {
      case VIEW_TYPES.PROGRAMS:
        return t('programs');
      case VIEW_TYPES.WORKOUT_HISTORY:
        return t('workout_history');
      case VIEW_TYPES.TEMPLATES:
        return t('templates');
      case VIEW_TYPES.GROUP_WORKOUTS:
        return t('group_workouts');
      default:
        return '';
    }
  };

  // Get the color for the view type
  const getViewColor = (viewType: string) => {
    switch (viewType) {
      case VIEW_TYPES.PROGRAMS:
        return programPalette.highlight;
      case VIEW_TYPES.WORKOUT_HISTORY:
        return workoutLogPalette.highlight;
      case VIEW_TYPES.TEMPLATES:
        return workoutPalette.highlight;
      case VIEW_TYPES.GROUP_WORKOUTS:
        return groupWorkoutPalette.highlight;
      default:
        return palette.text;
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.viewSelector}
        onPress={toggleViewSelector}
      >
        <Text style={[styles.viewTitle, { color: palette.text }]}>
          {getViewTitle()}
        </Text>
        <Ionicons 
          name={viewSelectorVisible ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={palette.text} 
        />
      </TouchableOpacity>
      
      {viewSelectorVisible && (
        <View style={[styles.dropdown, { backgroundColor: palette.card_background }]}>
          <TouchableOpacity 
            style={[
              styles.dropdownItem, 
              currentView === VIEW_TYPES.PROGRAMS && [
                styles.activeDropdownItem,
                { backgroundColor: palette.input_background }
              ]
            ]}
            onPress={() => changeView(VIEW_TYPES.PROGRAMS)}
          >
            <Text style={[
              styles.dropdownText, 
              { color: palette.text_secondary },
              currentView === VIEW_TYPES.PROGRAMS && [
                styles.activeDropdownText,
                { color: palette.text }
              ]
            ]}>
              {t('programs')}
            </Text>
            {currentView === VIEW_TYPES.PROGRAMS && (
              <Ionicons name="checkmark" size={20} color={programPalette.highlight} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.dropdownItem, 
              currentView === VIEW_TYPES.WORKOUT_HISTORY && [
                styles.activeDropdownItem,
                { backgroundColor: palette.input_background }
              ]
            ]}
            onPress={() => changeView(VIEW_TYPES.WORKOUT_HISTORY)}
          >
            <Text style={[
              styles.dropdownText, 
              { color: palette.text_secondary },
              currentView === VIEW_TYPES.WORKOUT_HISTORY && [
                styles.activeDropdownText,
                { color: palette.text }
              ]
            ]}>
              {t('workout_history')}
            </Text>
            {currentView === VIEW_TYPES.WORKOUT_HISTORY && (
              <Ionicons name="checkmark" size={20} color={workoutLogPalette.highlight} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.dropdownItem, 
              currentView === VIEW_TYPES.TEMPLATES && [
                styles.activeDropdownItem,
                { backgroundColor: palette.input_background }
              ]
            ]}
            onPress={() => changeView(VIEW_TYPES.TEMPLATES)}
          >
            <Text style={[
              styles.dropdownText, 
              { color: palette.text_secondary },
              currentView === VIEW_TYPES.TEMPLATES && [
                styles.activeDropdownText,
                { color: palette.text }
              ]
            ]}>
              {t('templates')}
            </Text>
            {currentView === VIEW_TYPES.TEMPLATES && (
              <Ionicons name="checkmark" size={20} color={workoutPalette.highlight} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.dropdownItem, 
              currentView === VIEW_TYPES.GROUP_WORKOUTS && [
                styles.activeDropdownItem,
                { backgroundColor: palette.input_background }
              ]
            ]}
            onPress={() => changeView(VIEW_TYPES.GROUP_WORKOUTS)}
          >
            <Text style={[
              styles.dropdownText, 
              { color: palette.text_secondary },
              currentView === VIEW_TYPES.GROUP_WORKOUTS && [
                styles.activeDropdownText,
                { color: palette.text }
              ]
            ]}>
              {t('group_workouts')}
            </Text>
            {currentView === VIEW_TYPES.GROUP_WORKOUTS && (
              <Ionicons name="checkmark" size={20} color={groupWorkoutPalette.highlight} />
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
    marginRight: 8,
    flexShrink: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
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
    // Background color will be set dynamically
  },
  dropdownText: {
    fontSize: 16,
    // Color will be set dynamically
  },
  activeDropdownText: {
    fontWeight: 'bold',
    // Color will be set dynamically
  },
});

export default ViewSelector;