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

  // Calculate AVERAGE value (instead of current) with weighted support
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

  // Format current value based on metric type with weighted support
  const getFormattedValue = (value: number) => {
    switch (metricType) {
      case 'totalWeightLifted': 
      case 'averageWeightPerRep': 
        return formatWeight(value);
      case 'totalSets':
        // Show decimal places for weighted sets
        return value.toFixed(1);
    }
  };

  // Calculate muscle group diversity for totalSets
  const muscleGroupDiversity = useMemo(() => {
    if (metricType !== 'totalSets' || !weeklyMetrics || weeklyMetrics.length === 0) {
      return { totalGroups: 0, mostEngaged: '', distribution: [] };
    }

    const muscleGroupTotals: Record<string, number> = {};
    let totalSets = 0;

    // Aggregate muscle group sets across all weeks
    weeklyMetrics.forEach(week => {
      if (week.setsPerMuscleGroup) {
        Object.entries(week.setsPerMuscleGroup).forEach(([muscle, sets]) => {
          if (sets > 0) {
            muscleGroupTotals[muscle] = (muscleGroupTotals[muscle] || 0) + sets;
            totalSets += sets;
          }
        });
      }
    });

    // Calculate distribution
    const distribution = Object.entries(muscleGroupTotals)
      .map(([muscle, sets]) => ({
        muscle: muscle.charAt(0).toUpperCase() + muscle.slice(1).replace(/_/g, ' '),
        sets: Math.round(sets * 10) / 10, // Round to 1 decimal place
        percentage: totalSets > 0 ? Math.round((sets / totalSets) * 100) : 0
      }))
      .sort((a, b) => b.sets - a.sets);

    const mostEngaged = distribution.length > 0 ? distribution[0].muscle : '';
    
    return {
      totalGroups: Object.keys(muscleGroupTotals).length,
      mostEngaged,
      distribution: distribution.slice(0, 5) // Top 5 muscle groups
    };
  }, [weeklyMetrics, metricType]);

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
          {metricType === 'totalSets' && (
            <Text style={[styles.weightedNote, { color: palette.text + '60' }]}>
              {' '}({t('weighted')})
            </Text>
          )}
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
            formatValue={metricType === 'totalSets' ? (value) => value.toFixed(1) : undefined}
          />
        </View>
      </View>

      {/* Key Insights */}
      <MetricInsights metricType={metricType} />

      {/* Muscle Group Diversity (only for totalSets) */}
      {metricType === 'totalSets' && muscleGroupDiversity.totalGroups > 0 && (
        <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            {t('muscle_group_distribution')}
          </Text>
          
          <View style={styles.diversityStats}>
            <View style={styles.diversityStat}>
              <Text style={[styles.diversityStatValue, { color: palette.text }]}>
                {muscleGroupDiversity.totalGroups}
              </Text>
              <Text style={[styles.diversityStatLabel, { color: palette.text + '80' }]}>
                {t('muscle_groups')}
              </Text>
            </View>
            
            <View style={styles.diversityStat}>
              <Text style={[styles.diversityStatValue, { color: palette.text }]}>
                {muscleGroupDiversity.mostEngaged}
              </Text>
              <Text style={[styles.diversityStatLabel, { color: palette.text + '80' }]}>
                {t('most_trained')}
              </Text>
            </View>
          </View>

          <View style={styles.distributionList}>
            <Text style={[styles.distributionTitle, { color: palette.text }]}>
              {t('top_muscle_groups')}
            </Text>
            {muscleGroupDiversity.distribution.map((item, index) => (
              <View key={index} style={styles.distributionItem}>
                <View style={styles.distributionMuscle}>
                  <View style={[
                    styles.distributionRank,
                    { backgroundColor: index === 0 ? '#10b981' : palette.text + '20' }
                  ]}>
                    <Text style={[
                      styles.distributionRankText,
                      { color: index === 0 ? '#FFFFFF' : palette.text }
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.distributionMuscleText, { color: palette.text }]}>
                    {item.muscle}
                  </Text>
                </View>
                <View style={styles.distributionStats}>
                  <Text style={[styles.distributionSets, { color: palette.text }]}>
                    {item.sets} {t('sets')}
                  </Text>
                  <Text style={[styles.distributionPercentage, { color: palette.text + '80' }]}>
                    {item.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Weighted explanation */}
          <View style={styles.weightedExplanation}>
            <Text style={[styles.weightedExplanationTitle, { color: palette.text + '80' }]}>
              {t('about_weighted_sets')}:
            </Text>
            <Text style={[styles.weightedExplanationText, { color: palette.text + '70' }]}>
              {t('weighted_sets_explanation')}
            </Text>
          </View>
        </View>
      )}
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
  weightedNote: {
    fontSize: 12,
    fontStyle: 'italic',
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
  },
  // Muscle group diversity styles
  diversityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 8,
  },
  diversityStat: {
    alignItems: 'center',
  },
  diversityStatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  diversityStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  distributionList: {
    marginBottom: 16,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  distributionMuscle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  distributionRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  distributionRankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distributionMuscleText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  distributionStats: {
    alignItems: 'flex-end',
  },
  distributionSets: {
    fontSize: 14,
    fontWeight: '600',
  },
  distributionPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  weightedExplanation: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  weightedExplanationTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  weightedExplanationText: {
    fontSize: 11,
    lineHeight: 16,
  },
});

export default MetricDeepDiveView;