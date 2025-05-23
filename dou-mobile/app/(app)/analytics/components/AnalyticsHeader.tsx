// components/AnalyticsHeader.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { AnalyticsViewMode } from './ViewSelectionDropdown';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnalyticsHeaderProps {
  scrollY?: Animated.Value;
  analyticsView: AnalyticsViewMode;
  onViewChange: (view: AnalyticsViewMode) => void;
  headerHeight: number;
  viewMode: string;
  onToggleFilter: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ 
  scrollY, 
  analyticsView, 
  onViewChange,
  headerHeight,
  viewMode,
  onToggleFilter,
  onResetFilters,
  hasActiveFilters
}) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  
  // Default animation values for header
  const defaultTranslateY = useRef(new Animated.Value(0)).current;
  const defaultOpacity = useRef(new Animated.Value(1)).current;
  
  // Animation values for tab transitions
  const tabAnimations = useRef({
    comparison: new Animated.Value(analyticsView === 'comparison' ? 1 : 0),
    'total-weight': new Animated.Value(analyticsView === 'total-weight' ? 1 : 0),
    'average-weight': new Animated.Value(analyticsView === 'average-weight' ? 1 : 0),
    'sets-analysis': new Animated.Value(analyticsView === 'sets-analysis' ? 1 : 0),
  }).current;
  
  // Animation value for the sliding indicator
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  
  // Header animation values - with fallback if scrollY is undefined
  const headerTranslateY = scrollY ? 
    scrollY.interpolate({
      inputRange: [0, headerHeight],
      outputRange: [0, -headerHeight],
      extrapolate: 'clamp'
    }) : defaultTranslateY;
  
  const headerOpacity = scrollY ? 
    scrollY.interpolate({
      inputRange: [0, headerHeight / 2, headerHeight],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp'
    }) : defaultOpacity;
  
  // Handle back button
  const handleBack = () => {
    router.back();
  };
  
  // View options for tabs with appropriate Ionicons icons
  const viewOptions = [
    { id: 'comparison', label: t('comparison_view'), icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
    { id: 'total-weight', label: t('total_weight_analysis'), icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
    { id: 'average-weight', label: t('average_weight_analysis'), icon: 'pulse-outline', activeIcon: 'pulse' },
    { id: 'sets-analysis', label: t('sets_analysis'), icon: 'layers-outline', activeIcon: 'layers' },
  ];
  
  // Trigger animations when view changes
  useEffect(() => {
    // Update all tab animations
    viewOptions.forEach(option => {
      Animated.spring(tabAnimations[option.id], {
        toValue: analyticsView === option.id ? 1 : 0,
        useNativeDriver: false,
        friction: 8,
        tension: 50
      }).start();
    });
    
    // Calculate indicator position based on active tab index
    const activeIndex = viewOptions.findIndex(option => option.id === analyticsView);
    const tabWidth = SCREEN_WIDTH / viewOptions.length;
    const position = (tabWidth * activeIndex) + (tabWidth * 0.1);
    const width = tabWidth * 0.8;
    
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
  }, [analyticsView]);
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: palette.layout,
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
        }
      ]}
    >
      {/* Main Header */}
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        {/* Center: Title */}
        <Text style={[styles.screenTitle, { color: palette.text }]}>
          {t('workout_analytics')}
        </Text>
        
        {/* Right: Filter Buttons */}
        <View style={styles.actionButtons}>
          {/* Filter Button */}
          <TouchableOpacity 
            style={[
              styles.iconButton, 
              { borderColor: palette.text},
              hasActiveFilters && { borderColor: palette.text }
            ]}
            onPress={onToggleFilter}
          >
            <Feather 
              name="filter" 
              size={18} 
              color={hasActiveFilters ? palette.text : palette.text} 
            />
            {hasActiveFilters && (
              <View style={[styles.badge, { backgroundColor: palette.text }]} />
            )}
          </TouchableOpacity>
          
          {/* Reset Button */}
          <TouchableOpacity 
            style={[styles.iconButton, { borderColor: palette.text }]} 
            onPress={onResetFilters}
            disabled={!hasActiveFilters}
          >
            <Feather 
              name="refresh-cw" 
              size={18} 
              color={hasActiveFilters ? palette.text : palette.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tabs Container - styled like WorkoutTabs */}
      <View style={[styles.tabContainer, { backgroundColor: palette.page_background }]}>
        <View style={styles.tabsContainer}>
          {viewOptions.map((viewType) => {
            const isActive = analyticsView === viewType.id;
            
            // Calculate animated styles for this tab
            const scale = tabAnimations[viewType.id].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.05, 1]
            });
            
            const flex = tabAnimations[viewType.id].interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 2.5]
            });
            
            const backgroundColor = tabAnimations[viewType.id].interpolate({
              inputRange: [0, 1],
              outputRange: ['transparent', palette.highlight]
            });
            
            return (
              <Animated.View
                key={viewType.id}
                style={[
                  styles.tab,
                  {
                    flex,
                    transform: [{ scale }],
                    backgroundColor,
                    // Removed opacity from here to keep inactive tabs fully visible
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.tabTouchable}
                  onPress={() => onViewChange(viewType.id as AnalyticsViewMode)}
                  activeOpacity={0.7}
                >
                  <Animated.View style={styles.tabContent}>
                    {/* Always show the icon, active or inactive */}
                    <Ionicons 
                      name={isActive ? viewType.activeIcon : viewType.icon} 
                      size={22} 
                      color={isActive ? "#FFFFFF" : palette.accent} 
                      style={isActive ? styles.activeTabIcon : styles.inactiveTabIcon}
                    />
                    
                    {/* The text only shows when tab is active, with animated opacity */}
                    {isActive && (
                      <Animated.Text 
                        style={[
                          styles.tabText,
                          {
                            opacity: tabAnimations[viewType.id],
                            color: '#FFFFFF'
                          }
                        ]} 
                        numberOfLines={1}
                      >
                        {viewType.label}
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
              backgroundColor: palette.highlight 
            }
          ]} 
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
  },

  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 36,
    height: 36,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Tab styles - enhanced with animation support
  tabContainer: {
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    position: 'relative',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  tab: {
    borderRadius: 10,
    marginHorizontal: 4,
    overflow: 'hidden',
    minWidth: 40, // Ensure inactive tabs have minimum width
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
    paddingHorizontal: 8,
    width: '100%',
  },
  activeTabIcon: {
    marginRight: 6,
  },
  inactiveTabIcon: {
    // No marginRight needed when no text is displayed
    opacity: 0.9, // Slightly higher opacity for better visibility
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
  },
});

export default AnalyticsHeader;