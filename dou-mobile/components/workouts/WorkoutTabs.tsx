// components/workouts/WorkoutTabs.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { VIEW_TYPES, VIEW_ORDER } from './ViewSelector';
import { useTheme } from '../../context/ThemeContext';

interface WorkoutTabsProps {
  currentView: string;
  onChangeView: (viewType: string) => void;
}

const WorkoutTabs: React.FC<WorkoutTabsProps> = ({
  currentView,
  onChangeView,
}) => {
  const { t } = useLanguage();
  const { workoutPalette, programPalette, workoutLogPalette, groupWorkoutPalette } = useTheme();
  
  // Get view specific colors and details
  const getViewDetails = (viewType: string) => {
    switch (viewType) {
      case VIEW_TYPES.PROGRAMS:
        return {
          color: '#7e22ce', // Purple
          icon: 'calendar-outline',
          activeIcon: 'calendar',
          label: t('programs'),
          palette: programPalette
        };
      case VIEW_TYPES.WORKOUT_HISTORY:
        return {
          color: '#16a34a', // Green
          icon: 'bar-chart-outline',
          activeIcon: 'bar-chart',
          label: t('workout_history'),
          palette: workoutLogPalette
        };
      case VIEW_TYPES.TEMPLATES:
        return {
          color: '#2563eb', // Blue
          icon: 'copy-outline',
          activeIcon: 'copy',
          label: t('templates'),
          palette: workoutPalette
        };
      case VIEW_TYPES.GROUP_WORKOUTS:
        return {
          color: '#f97316', // Orange
          icon: 'people-outline',
          activeIcon: 'people',
          label: t('group_workouts'),
          palette: groupWorkoutPalette
        };
      default:
        return {
          color: '#6B7280', // Gray
          icon: 'fitness-outline',
          activeIcon: 'fitness',
          label: '',
          palette: workoutPalette
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* This outer container gives us more control over tab positioning */}
      <View style={styles.tabsContainer}>
        {VIEW_ORDER.map((viewType) => {
          const { color, icon, activeIcon, label, palette } = getViewDetails(viewType);
          const isActive = currentView === viewType;
          
          return (
            <TouchableOpacity
              key={viewType}
              style={[
                styles.tab,
                isActive ? styles.activeTab : styles.inactiveTab,
                isActive && { backgroundColor: palette.highlight }
              ]}
              onPress={() => onChangeView(viewType)}
              activeOpacity={0.7}
            >
              {isActive ? (
                // Active tab - show icon and text in a pill
                <View style={styles.activeTabContent}>
                  <Ionicons 
                    name={activeIcon} 
                    size={20} 
                    color="#FFFFFF" 
                    style={styles.activeTabIcon}
                  />
                  <Text style={styles.activeTabText} numberOfLines={1}>
                    {label}
                  </Text>
                </View>
              ) : (
                // Inactive tab - show just the icon
                <Ionicons 
                  name={icon} 
                  size={22} 
                  color="#9CA3AF" 
                  style={styles.inactiveTabIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 8,
  },
  activeTab: {
    flex: 2.5, // Active tab takes more space (2.5x more than inactive tabs)
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    marginHorizontal: 6, // Additional margin around the active tab
  },
  inactiveTab: {
    flex: 0.6, // Inactive tabs take up minimal space
    paddingHorizontal: 0,
    marginHorizontal: 1,
  },
  activeTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activeTabIcon: {
    marginRight: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inactiveTabIcon: {
    opacity: 0.9,
  },
});

export default WorkoutTabs;