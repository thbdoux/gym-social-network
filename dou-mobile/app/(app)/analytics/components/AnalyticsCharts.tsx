// components/AnalyticsCharts.tsx
import React, { memo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { NoDataView } from './NoDataView';
import { ViewToggle, ViewMode } from './ViewToggle';
import { AnalyticsTable } from './AnalyticsTable';
import { AnalyticsViewMode } from './ViewSelectionDropdown';
import { ComparisonView } from './ComparisonView';
import { MetricDeepDiveView } from './MetricDeepDiveView';
import { AnalyticsHeader } from './AnalyticsHeader';
import { AnalyticsFilter } from './AnalyticsFilter';

export const AnalyticsCharts: React.FC = memo(() => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { 
    weeklyMetrics, 
    isLoading, 
    dataError,
    selectedMuscleGroup,
    selectedExercise,
    resetFilters
  } = useAnalytics();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [analyticsView, setAnalyticsView] = useState<AnalyticsViewMode>('comparison');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Scroll animation state - ensure it's properly initialized
  const scrollY = useRef<Animated.Value>(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Heights for animations
  const headerHeight = 50; // Main header height
  const toggleHeight = 60; // View toggle height
  const totalHeaderHeight = headerHeight + toggleHeight;
  
  // Check if there are active filters
  const hasActiveFilters = !!selectedMuscleGroup || !!selectedExercise;
  
  // Toggle filter modal
  const toggleFilterModal = () => {
    setShowFilterModal(!showFilterModal);
  };
  
  // Navigation function for switching between views with animation
  const navigateToView = (view: AnalyticsViewMode) => {
    // Skip animation if going to the same view
    if (view === analyticsView) return;
    
    // Animate scroll to top first
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
      
      // Wait for scroll animation to complete before changing view
      setTimeout(() => {
        setAnalyticsView(view);
      }, 300);
    } else {
      // If scrollView ref not available, just change view
      setAnalyticsView(view);
    }
  };

  if (dataError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: palette.text }]}> {dataError} </Text>
        <Text style={[styles.errorSubtext, { color: palette.text + '80' }]}> {t('try_refreshing')} </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.highlight} />
        <Text style={[styles.loadingText, { color: palette.text }]}> {t('loading_analytics')} </Text>
      </View>
    );
  }

  if (!weeklyMetrics || weeklyMetrics.length === 0) {
    return (
      <NoDataView 
        message={t('no_workout_data')}
      />
    );
  }

  const renderChartView = () => {
    switch (analyticsView) {
      case 'comparison':
        return <ComparisonView onMetricPress={navigateToView} />;
      case 'total-weight':
        return <MetricDeepDiveView metricType="totalWeightLifted" />;
      case 'average-weight':
        return <MetricDeepDiveView metricType="averageWeightPerRep" />;
      case 'sets-analysis':
        return <MetricDeepDiveView metricType="totalSets" />;
      default:
        return <ComparisonView onMetricPress={navigateToView} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Header at the top with filter buttons */}
      <AnalyticsHeader 
        scrollY={scrollY} 
        analyticsView={analyticsView} 
        onViewChange={navigateToView}
        headerHeight={headerHeight}
        viewMode={viewMode}
        onToggleFilter={toggleFilterModal}
        onResetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />
      
      {/* Full-width View Toggle - also animates on scroll */}
      <Animated.View style={[
        styles.toggleContainer,
        { 
          transform: [{ 
            translateY: scrollY.interpolate({
              inputRange: [0, toggleHeight],
              outputRange: [headerHeight, headerHeight - toggleHeight],
              extrapolate: 'clamp'
            }) 
          }],
          opacity: scrollY.interpolate({
            inputRange: [0, toggleHeight / 2, toggleHeight],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp'
          }),
        }
      ]}>
        <ViewToggle 
          currentView={viewMode} 
          onToggle={setViewMode}
        />
      </Animated.View>

      {/* Content Area - Scrollable */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false } // Set to false to avoid the error
        )}
      >
        {/* Add padding to account for the header and toggle heights */}
        <View style={{ height: totalHeaderHeight }} />
        
        {/* Display active filters indicator when filters are applied */}
        {hasActiveFilters && (
          <View style={[styles.filtersIndicator, { backgroundColor: palette.highlight + '10' }]}>
            <Text style={[styles.filterLabel, { color: palette.text }]} numberOfLines={1}>
              {t('filtering_by')}: {selectedMuscleGroup || ''} 
              {selectedMuscleGroup && selectedExercise ? ' / ' : ''}
              {selectedExercise || ''}
            </Text>
          </View>
        )}
        
        {viewMode === 'chart' ? (
          renderChartView()
        ) : (
          <AnalyticsTable />
        )}
        
        {/* Add padding to bottom for better scrolling */}
        <View style={{ height: 20 }} />
      </ScrollView>
      
      {/* Filter Modal - Show only when toggled */}
      {showFilterModal && (
        <AnalyticsFilter
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isModalVisible={showFilterModal}
          closeModal={() => setShowFilterModal(false)}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  toggleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0, // Position below header
    zIndex: 90,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  filtersIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginHorizontal: 8,
    borderRadius: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  }
});

export default AnalyticsCharts;