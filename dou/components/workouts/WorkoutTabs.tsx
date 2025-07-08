// components/workouts/WorkoutTabs.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { VIEW_TYPES, VIEW_ORDER } from './ViewSelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WorkoutTabsProps {
  currentView: string;
  onChangeView: (viewType: string) => void;
}

const WorkoutTabs: React.FC<WorkoutTabsProps> = ({
  currentView,
  onChangeView,
}) => {
  const { t } = useLanguage();
  const { 
    workoutPalette, 
    programPalette, 
    workoutLogPalette, 
    groupWorkoutPalette,
    palette
  } = useTheme();
  
  // Animation values for tab transitions
  const tabAnimations = useRef({
    [VIEW_TYPES.PROGRAMS]: new Animated.Value(currentView === VIEW_TYPES.PROGRAMS ? 1 : 0),
    [VIEW_TYPES.WORKOUT_HISTORY]: new Animated.Value(currentView === VIEW_TYPES.WORKOUT_HISTORY ? 1 : 0),
    [VIEW_TYPES.TEMPLATES]: new Animated.Value(currentView === VIEW_TYPES.TEMPLATES ? 1 : 0),
    [VIEW_TYPES.GROUP_WORKOUTS]: new Animated.Value(currentView === VIEW_TYPES.GROUP_WORKOUTS ? 1 : 0),
  }).current;
  
  // Store text measurements for each tab label
  const textWidths = useRef({
    [VIEW_TYPES.PROGRAMS]: 0,
    [VIEW_TYPES.WORKOUT_HISTORY]: 0,
    [VIEW_TYPES.TEMPLATES]: 0,
    [VIEW_TYPES.GROUP_WORKOUTS]: 0,
  }).current;
  
  // Animation value for the sliding indicator
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  
  // Get view specific colors and details
  const getViewDetails = (viewType: string) => {
    switch (viewType) {
      case VIEW_TYPES.PROGRAMS:
        return {
          icon: 'calendar-outline',
          activeIcon: 'calendar',
          label: t('programs'),
          palette: programPalette
        };
      case VIEW_TYPES.WORKOUT_HISTORY:
        return {
          icon: 'bar-chart-outline',
          activeIcon: 'bar-chart',
          label: t('workout_history'),
          palette: workoutLogPalette
        };
      case VIEW_TYPES.TEMPLATES:
        return {
          icon: 'copy-outline',
          activeIcon: 'copy',
          label: t('templates'),
          palette: workoutPalette
        };
      case VIEW_TYPES.GROUP_WORKOUTS:
        return {
          icon: 'people-outline',
          activeIcon: 'people',
          label: t('group_workouts'),
          palette: groupWorkoutPalette
        };
      default:
        return {
          icon: 'fitness-outline',
          activeIcon: 'fitness',
          label: '',
          palette: workoutPalette
        };
    }
  };

  // Calculate estimated text width for all tabs
  useEffect(() => {
    VIEW_ORDER.forEach(viewType => {
      const { label } = getViewDetails(viewType);
      // Rough estimate of text width: ~8px per character + 24px for padding/icon
      textWidths[viewType] = (label.length * 1000) + 50; 
    });
  }, [t]); // Recalculate when language changes

  // Trigger animations when view changes
  useEffect(() => {
    // Calculate total available width and sum of inactive tab widths
    const availableWidth = SCREEN_WIDTH - 24; // Accounting for container padding
    const activeTabWidth = textWidths[currentView]; 
    const totalInactiveTabsCount = VIEW_ORDER.length - 1;
    
    // Calculate proportions
    const totalFlex = 10; // Total flex to distribute
    const activeTabFlex = Math.max(4, Math.min(7, activeTabWidth / 30)); // Scale with text width, but keep within bounds
    const inactiveTabFlex = (totalFlex - activeTabFlex) / totalInactiveTabsCount;
    
    // Update all tab animations
    VIEW_ORDER.forEach(viewType => {
      const targetValue = currentView === viewType ? 1 : 0;
      Animated.spring(tabAnimations[viewType], {
        toValue: targetValue,
        useNativeDriver: false,
        friction: 8,
        tension: 50
      }).start();
    });
    
    // Calculate indicator position based on active tab index and widths
    const activeIndex = VIEW_ORDER.indexOf(currentView);
    const totalWidth = availableWidth;
    
    let position = 0;
    for (let i = 0; i < activeIndex; i++) {
      const isInactive = true;
      const tabWidth = (inactiveTabFlex / totalFlex) * totalWidth;
      position += tabWidth;
    }
    
    const width = (activeTabFlex / totalFlex) * totalWidth * 0.8;
    position += ((activeTabFlex / totalFlex) * totalWidth) * 0.1;
    
    // Animate the indicator
    Animated.parallel([
      Animated.spring(indicatorPosition, {
        toValue: position,
        useNativeDriver: false,
        friction: 8,
        tension: 50
      }),
      Animated.spring(indicatorWidth, {
        toValue: width,
        useNativeDriver: false,
        friction: 8,
        tension: 50
      })
    ]).start();
  }, [currentView]);

  return (
    <View style={[styles.container, { backgroundColor: palette.card_background }]}>
      {/* This outer container gives us more control over tab positioning */}
      <View style={styles.tabsContainer}>
        {VIEW_ORDER.map((viewType) => {
          const { icon, activeIcon, label, palette: viewPalette } = getViewDetails(viewType);
          const isActive = currentView === viewType;
          
          // Calculate animated styles for this tab
          const scale = tabAnimations[viewType].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.05, 1]
          });
          
          // Dynamic flex based on text width
          const activeTabFlex = Math.max(4, Math.min(7, textWidths[viewType] / 30));
          const inactiveTabFlex = (10 - activeTabFlex) / (VIEW_ORDER.length - 1);
          
          const flex = tabAnimations[viewType].interpolate({
            inputRange: [0, 1],
            outputRange: [inactiveTabFlex, activeTabFlex]
          });
          
          const backgroundColor = tabAnimations[viewType].interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', viewPalette.highlight + '20'] // Adding transparency
          });
          
          return (
            <Animated.View
              key={viewType}
              style={[
                styles.tab,
                {
                  flex,
                  transform: [{ scale }],
                  backgroundColor,
                  borderRadius: 20,
                }
              ]}
            >
              <TouchableOpacity
                style={styles.tabTouchable}
                onPress={() => onChangeView(viewType)}
                activeOpacity={0.7}
              >
                <Animated.View style={styles.tabContent}>
                  {/* Always show the icon, active or inactive */}
                  <Ionicons 
                    name={isActive ? activeIcon : icon} 
                    size={22} 
                    color={isActive ? viewPalette.highlight : palette.text_tertiary} 
                    style={isActive ? styles.activeTabIcon : styles.inactiveTabIcon}
                  />
                  
                  {/* The text only shows when tab is active, with animated opacity */}
                  {isActive && (
                    <Animated.Text 
                      style={[
                        styles.tabText,
                        {
                          opacity: tabAnimations[viewType],
                          color: viewPalette.highlight
                        }
                      ]} 
                      numberOfLines={1}
                    >
                      {label}
                    </Animated.Text>
                  )}
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
      
      {/* Animated Underline Indicator */}
      <Animated.View 
        style={[
          styles.tabIndicator, 
          {
            width: indicatorWidth,
            left: indicatorPosition,
            backgroundColor: getViewDetails(currentView).palette.highlight 
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'relative',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    height: 40,
  },
  tab: {
    marginHorizontal: 3,
    overflow: 'hidden',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  activeTabIcon: {
    marginRight: 6,
  },
  inactiveTabIcon: {
    opacity: 0.9,
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14,
    flexShrink: 1,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
  },
});

export default WorkoutTabs;