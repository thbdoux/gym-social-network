// components/MetricDeepDiveView.tsx
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { MetricChart } from './MetricChart';
import { getMaxMetrics, WeeklyMetrics, formatWeight } from '../utils/analyticsUtils';
import { MuscleGroupPieChart } from './MuscleGroupPieChart';
import { MetricInsights } from './MetricInsights';
import { TopExercisesChart } from './TopExercisesChart';
import { differenceInMonths } from 'date-fns';

type MetricType = 'totalWeightLifted' | 'averageWeightPerRep' | 'totalSets';

interface MetricDeepDiveViewProps {
  metricType: MetricType;
}

export const MetricDeepDiveView: React.FC<MetricDeepDiveViewProps> = memo(({ metricType }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { weeklyMetrics } = useAnalytics();

  // Determine chart color based on metric type
  const getMetricColor = () => {
    switch (metricType) {
      case 'totalWeightLifted': return palette.highlight;
      case 'averageWeightPerRep': return '#f59e0b';
      case 'totalSets': return '#10b981';
    }
  };

  // Get metric title based on type
  const getMetricTitle = () => {
    switch (metricType) {
      case 'totalWeightLifted': return t('total_weight_lifted');
      case 'averageWeightPerRep': return t('avg_weight_per_rep');
      case 'totalSets': return t('total_sets');
    }
  };

  // Calculate max value for chart scaling
  const maxValue = useMemo(() => {
    const { maxWeight, maxAvgWeight, maxSets } = getMaxMetrics(weeklyMetrics);
    
    switch (metricType) {
      case 'totalWeightLifted': return maxWeight * 1.1;
      case 'averageWeightPerRep': return maxAvgWeight * 1.1;
      case 'totalSets': return maxSets * 1.1;
    }
  }, [weeklyMetrics, metricType]);

  // Calculate AVERAGE value (instead of current)
  const averageValue = useMemo(() => {
    if (!weeklyMetrics || weeklyMetrics.length === 0) return 0;
    
    const sum = weeklyMetrics.reduce((acc, week) => {
      const value = week[metricType] as number;
      return acc + value;
    }, 0);
    
    return sum / weeklyMetrics.length;
  }, [weeklyMetrics, metricType]);

  // Calculate monthly growth percentage
  const monthlyGrowthPercentage = useMemo(() => {
    if (!weeklyMetrics || weeklyMetrics.length < 2) return 0;
    
    const firstData = weeklyMetrics[0];
    const lastData = weeklyMetrics[weeklyMetrics.length - 1];
    
    const firstValue = firstData[metricType] as number;
    const lastValue = lastData[metricType] as number;
    
    if (firstValue <= 0) return 0;
    
    // Calculate total percentage growth
    const totalGrowth = ((lastValue - firstValue) / firstValue) * 100;
    
    // Calculate number of months spanned
    const monthsSpanned = differenceInMonths(lastData.endDate, firstData.startDate) || 1;
    
    // Calculate average monthly growth
    return totalGrowth / monthsSpanned;
  }, [weeklyMetrics, metricType]);

  // Format current value based on metric type
  const getFormattedValue = (value: number) => {
    switch (metricType) {
      case 'totalWeightLifted': 
      case 'averageWeightPerRep': 
        return formatWeight(value);
      case 'totalSets':
        return value.toFixed(1);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Average Value Card (Previously Current Value) */}
      <View style={[styles.currentValueCard, { backgroundColor: palette.highlight + '10', borderColor: palette.border }]}>
        <Text style={[styles.metricLabel, { color: palette.text + '90' }]}>
          {getMetricTitle()} • {t('average')}
        </Text>
        <View style={styles.valueRow}>
          <Text style={[styles.currentValue, { color: palette.text }]}>
            {getFormattedValue(averageValue)}
          </Text>
          <View style={styles.growthContainer}>
            <Text style={[styles.growthLabel, { color: palette.text + '70' }]}>
              {t('monthly_growth')}
            </Text>
            <View style={[
              styles.changeBadge, 
              { backgroundColor: monthlyGrowthPercentage >= 0 ? '#10b981' : '#ef4444' }
            ]}>
              <Text style={styles.changeText}>
                {monthlyGrowthPercentage >= 0 ? '+' : ''}{monthlyGrowthPercentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Chart */}
      <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('trend_over_time')}
        </Text>
        <View style={styles.chartContainer}>
          <MetricChart
            title=""
            data={weeklyMetrics}
            metricKey={metricType}
            metricColor={getMetricColor()}
            maxValue={maxValue}
            showMonthlyXAxis={true}
          />
        </View>
      </View>

      {/* Key Insights */}
      <MetricInsights metricType={metricType} />

      {/* Muscle Group Distribution */}
      <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('muscle_group_distribution')}
        </Text>
        <MuscleGroupPieChart metricType={metricType} />
      </View>

      {/* Top Exercises */}
      <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('top_exercises')}
        </Text>
        <TopExercisesChart metricType={metricType} />
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  currentValueCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  growthContainer: {
    alignItems: 'flex-end',
  },
  growthLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    marginHorizontal: -8, // Expand the chart to use the full card width
  }
});