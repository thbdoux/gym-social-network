// components/AnalyticsCharts.tsx
import React, { memo, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { AnalyticsHeader } from './AnalyticsHeader';
import { AnalyticsFilter, ViewMode } from './AnalyticsFilter';
import { ViewSelectionDropdown, AnalyticsViewMode } from './ViewSelectionDropdown';
import { ComparisonView } from './ComparisonView';
import { MetricDeepDiveView } from './MetricDeepDiveView';
import { BodyweightAnalysisView } from './BodyweightAnalysisView';
import { EnduranceAnalysisView } from './EnduranceAnalysisView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 120;

export const AnalyticsCharts: React.FC = memo(() => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { 
    selectedMuscleGroup, 
    selectedExercise, 
    setSelectedMuscleGroup, 
    setSelectedExercise, 
    resetFilters 
  } = useAnalytics();

  // State management
  const [currentView, setCurrentView] = useState<AnalyticsViewMode>('comparison');
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isViewDropdownVisible, setIsViewDropdownVisible] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(selectedMuscleGroup || selectedExercise);
  }, [selectedMuscleGroup, selectedExercise]);

  // Handle view changes
  const handleViewChange = (view: AnalyticsViewMode) => {
    setCurrentView(view);
    setIsViewDropdownVisible(false);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleToggleFilter = () => {
    setIsFilterModalVisible(true);
  };

  const handleCloseFilter = () => {
    setIsFilterModalVisible(false);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const handleToggleViewDropdown = () => {
    setIsViewDropdownVisible(!isViewDropdownVisible);
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'comparison':
        return <ComparisonView onMetricPress={handleViewChange} />;
      
      case 'total-weight':
        return <MetricDeepDiveView metricType="totalWeightLifted" />;
      
      case 'average-weight':
        return <MetricDeepDiveView metricType="averageWeightPerRep" />;
      
      case 'sets-analysis':
        return <MetricDeepDiveView metricType="totalSets" />;
      
      case 'bodyweight-analysis':
        return <BodyweightAnalysisView />;
      
      case 'endurance-analysis':
        return <EnduranceAnalysisView />;
      
      default:
        return <ComparisonView onMetricPress={handleViewChange} />;
    }
  };

  // Get current view title
  const getCurrentViewTitle = () => {
    switch (currentView) {
      case 'comparison': return t('comparison_view');
      case 'total-weight': return t('strength_analysis');
      case 'average-weight': return t('intensity_analysis');
      case 'sets-analysis': return t('volume_analysis');
      case 'bodyweight-analysis': return t('bodyweight_analysis');
      case 'endurance-analysis': return t('endurance_analysis');
      default: return t('analytics');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.layout }]}>
      {/* Header with View Selection */}
      <AnalyticsHeader
        scrollY={scrollY}
        analyticsView={currentView}
        onViewChange={handleViewChange}
        headerHeight={HEADER_HEIGHT}
        viewMode={viewMode}
        onToggleFilter={handleToggleFilter}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Content */}
      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: palette.page_background }]}
        contentContainerStyle={[styles.scrollViewContent, { paddingTop: HEADER_HEIGHT + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderCurrentView()}
      </Animated.ScrollView>

      {/* Filter Modal */}
      <AnalyticsFilter
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isModalVisible={isFilterModalVisible}
        closeModal={handleCloseFilter}
      />

      {/* View Selection Dropdown */}
      <ViewSelectionDropdown
        currentView={currentView}
        onViewChange={handleViewChange}
        isVisible={isViewDropdownVisible}
        onClose={() => setIsViewDropdownVisible(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
});

export default AnalyticsCharts;