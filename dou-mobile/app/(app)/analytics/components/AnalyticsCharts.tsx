import React, { memo, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { getMaxMetrics } from '../utils/analyticsUtils';
import { MetricChart } from './MetricChart';
import { WeeklySetsPerMuscleChart } from './WeeklySetsPerMuscleChart';
import { NoDataView } from './NoDataView';
import { ViewToggle, ViewMode } from './ViewToggle';
import { AnalyticsTable } from './AnalyticsTable';

export const AnalyticsCharts: React.FC = memo(() => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { 
    weeklyMetrics, 
    isLoading, 
    selectedMuscleGroup,
    selectedExercise,
    dataError,
  } = useAnalytics();

  const [viewMode, setViewMode] = useState<ViewMode>('chart');

  const { maxWeight, maxAvgWeight, maxSets } = useMemo(() => 
    getMaxMetrics(weeklyMetrics), 
    [weeklyMetrics]
  );

  const maxSetsPerWeek = useMemo(() => {
    if (!weeklyMetrics || weeklyMetrics.length === 0) return 10;
    return Math.max(...weeklyMetrics.map(week => week.totalSets), 10);
  }, [weeklyMetrics]);

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
        message={
          selectedMuscleGroup || selectedExercise
            ? t('no_data_for_filters')
            : t('no_workout_data')
        }
      />
    );
  }

  const getFilterMessage = () => {
    if (selectedMuscleGroup && selectedExercise) {
      return `${t('filtered_by')}: ${selectedMuscleGroup} / ${selectedExercise}`;
    } else if (selectedMuscleGroup) {
      return `${t('filtered_by')}: ${selectedMuscleGroup}`;
    } else if (selectedExercise) {
      return `${t('filtered_by')}: ${selectedExercise}`;
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <ViewToggle currentView={viewMode} onToggle={setViewMode} />

      {(selectedMuscleGroup || selectedExercise) && (
        <View style={[styles.filterIndicator, { backgroundColor: palette.highlight + '20' }]}>
          <Text style={[styles.filterText, { color: palette.text }]}> {getFilterMessage()} </Text>
        </View>
      )}

      {viewMode === 'chart' ? (
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <MetricChart
            title={t('total_weight_lifted')}
            data={weeklyMetrics}
            metricKey="totalWeightLifted"
            metricColor={palette.highlight}
            maxValue={maxWeight * 1.1}
          />

          <MetricChart
            title={t('avg_weight_per_rep')}
            data={weeklyMetrics}
            metricKey="averageWeightPerRep"
            metricColor="#f59e0b"
            maxValue={maxAvgWeight * 1.1}
          />

          <WeeklySetsPerMuscleChart
            title={t('sets_per_muscle_group')}
            data={weeklyMetrics}
            maxValue={maxSetsPerWeek * 1.1}
          />
        </ScrollView>
      ) : (
        <AnalyticsTable />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  },
  filterIndicator: {
    borderRadius: 8,
    padding: 8,
    margin: 8,
    marginBottom: 0,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
