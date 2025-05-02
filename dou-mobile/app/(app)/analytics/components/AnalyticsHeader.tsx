// components/AnalyticsHeader.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { AnalyticsViewMode } from './ViewSelectionDropdown';
import { useAnalytics } from '../context/AnalyticsContext';

interface AnalyticsHeaderProps {
  scrollY?: Animated.Value;
  analyticsView: AnalyticsViewMode;
  onViewChange: (view: AnalyticsViewMode) => void;
  headerHeight: number;
  // Add filter props
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
  const [showViewOptions, setShowViewOptions] = useState(false);
  
  // Default animation values
  const defaultTranslateY = new Animated.Value(0);
  const defaultOpacity = new Animated.Value(1);
  
  // Animation values - with fallback if scrollY is undefined
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
  
  // Handle back button based on current view
  const handleBack = () => {
    if (analyticsView !== 'comparison') {
      // If in a deep dive view, go back to comparison view
      onViewChange('comparison');
    } else {
      // If already in comparison view, go back to previous screen
      router.back();
    }
  };
  
  // Get title based on current view
  const getViewTitle = () => {
    switch (analyticsView) {
      case 'comparison':
        return t('workout_analytics');
      case 'total-weight':
        return t('total_weight_analysis');
      case 'average-weight':
        return t('average_weight_analysis');
      case 'sets-analysis':
        return t('sets_analysis');
      default:
        return t('workout_analytics');
    }
  };
  
  // View options for dropdown
  const viewOptions = [
    { id: 'comparison', label: t('comparison_view'), icon: 'bar-chart-2' },
    { id: 'total-weight', label: t('total_weight_analysis'), icon: 'trending-up' },
    { id: 'average-weight', label: t('average_weight_analysis'), icon: 'activity' },
    { id: 'sets-analysis', label: t('sets_analysis'), icon: 'layers' },
  ];
  
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
      <View style={styles.header}>
        {/* Left: Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color={palette.text} />
        </TouchableOpacity>
        
        {/* Center: Title with dropdown */}
        <TouchableOpacity 
          style={styles.titleContainer}
          onPress={() => setShowViewOptions(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.title, { color: palette.text }]}>
            {getViewTitle()}
          </Text>
          <Feather name="chevron-down" size={18} color={palette.text} style={styles.titleIcon} />
        </TouchableOpacity>
        
        {/* Right: Filter Buttons */}
        <View style={styles.actionButtons}>
          {/* Filter Button */}
          <TouchableOpacity 
            style={[
              styles.iconButton, 
              { borderColor: palette.border },
              hasActiveFilters && { borderColor: palette.highlight }
            ]}
            onPress={onToggleFilter}
          >
            <Feather 
              name="filter" 
              size={18} 
              color={hasActiveFilters ? palette.highlight : palette.text + '80'} 
            />
            {hasActiveFilters && (
              <View style={[styles.badge, { backgroundColor: palette.highlight }]} />
            )}
          </TouchableOpacity>
          
          {/* Reset Button */}
          <TouchableOpacity 
            style={[styles.iconButton, { borderColor: palette.border }]} 
            onPress={onResetFilters}
            disabled={!hasActiveFilters}
          >
            <Feather 
              name="refresh-cw" 
              size={18} 
              color={hasActiveFilters ? palette.highlight : palette.text + '40'} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* View Selection Modal */}
      <Modal
        visible={showViewOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowViewOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowViewOptions(false)}
        >
          <View 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: palette.page_background,
                borderColor: palette.border,
              }
            ]}
          >
            {viewOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  analyticsView === option.id && { backgroundColor: palette.highlight + '15' }
                ]}
                onPress={() => {
                  onViewChange(option.id as AnalyticsViewMode);
                  setShowViewOptions(false);
                }}
              >
                <Feather 
                  name={option.icon as any} 
                  size={18} 
                  color={analyticsView === option.id ? palette.highlight : palette.text} 
                  style={styles.optionIcon}
                />
                <Text 
                  style={[
                    styles.optionText, 
                    { color: analyticsView === option.id ? palette.highlight : palette.text }
                  ]}
                >
                  {option.label}
                </Text>
                {analyticsView === option.id && (
                  <Feather name="check" size={18} color={palette.highlight} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0, // Account for status bar
    paddingBottom: 8,
    paddingHorizontal: 16,
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
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  titleIcon: {
    marginLeft: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },
  modalContent: {
    marginHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});

export default AnalyticsHeader;