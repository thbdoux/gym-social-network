// components/MetricInsights.tsx
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { formatWeight } from '../utils/analyticsUtils';

type MetricType = 'totalWeightLifted' | 'averageWeightPerRep' | 'totalSets';

interface MetricInsightsProps {
  metricType: MetricType;
}

export const MetricInsights: React.FC<MetricInsightsProps> = memo(({ metricType }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { weeklyMetrics } = useAnalytics();

  // Calculate insights with support for weighted muscle groups
  const insights = useMemo(() => {
    if (!weeklyMetrics || weeklyMetrics.length < 2) {
      return {
        average: 0,
        max: { value: 0, week: '' },
        min: { value: 0, week: '' },
        trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
        averageGrowth: 0,
        consistency: 0,
        totalMuscleGroups: 0,
        mostTargetedMuscle: ''
      };
    }

    // Calculate values
    let sum = 0;
    let count = 0;
    let max = { value: Number.MIN_SAFE_INTEGER, week: '' };
    let min = { value: Number.MAX_SAFE_INTEGER, week: '' };
    let growthPoints = 0;
    let totalGrowth = 0;
    let nonZeroWeeks = 0;
    let streakWeeks = 0;
    let currentStreak = 0;
    
    // Track muscle group engagement across all weeks
    const muscleGroupTotals: Record<string, number> = {};
    let totalMuscleGroupsEngaged = new Set<string>();

    for (let i = 0; i < weeklyMetrics.length; i++) {
      const week = weeklyMetrics[i];
      const value = week[metricType] as number;

      // Skip if no value
      if (value === 0) continue;

      // Count for average
      sum += value;
      count++;
      nonZeroWeeks++;

      // Track max/min
      if (value > max.value) {
        max = { value, week: week.label };
      }
      if (value < min.value) {
        min = { value, week: week.label };
      }

      // Calculate growth
      if (i > 0) {
        const prevValue = weeklyMetrics[i - 1][metricType] as number;
        if (prevValue > 0) {
          const growth = ((value - prevValue) / prevValue) * 100;
          totalGrowth += growth;
          growthPoints++;
        }
      }

      // Calculate streaks
      if (i > 0) {
        const prevValue = weeklyMetrics[i - 1][metricType] as number;
        if (prevValue > 0 && value > 0) {
          currentStreak++;
          if (currentStreak > streakWeeks) {
            streakWeeks = currentStreak;
          }
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      // Track muscle group engagement (for totalSets metric specifically)
      if (metricType === 'totalSets' && week.setsPerMuscleGroup) {
        Object.entries(week.setsPerMuscleGroup).forEach(([muscleGroup, sets]) => {
          if (sets > 0) {
            totalMuscleGroupsEngaged.add(muscleGroup);
            muscleGroupTotals[muscleGroup] = (muscleGroupTotals[muscleGroup] || 0) + sets;
          }
        });
      }
    }

    // Find most targeted muscle group
    let mostTargetedMuscle = '';
    let maxSets = 0;
    Object.entries(muscleGroupTotals).forEach(([muscle, totalSets]) => {
      if (totalSets > maxSets) {
        maxSets = totalSets;
        mostTargetedMuscle = muscle.charAt(0).toUpperCase() + muscle.slice(1).replace(/_/g, ' ');
      }
    });

    // Calculate results
    const average = count > 0 ? sum / count : 0;
    const averageGrowth = growthPoints > 0 ? totalGrowth / growthPoints : 0;
    const trend = averageGrowth > 3 ? 'increasing' : averageGrowth < -3 ? 'decreasing' : 'stable';
    const consistency = weeklyMetrics.length > 0 ? (nonZeroWeeks / weeklyMetrics.length) * 100 : 0;

    return {
      average,
      max,
      min,
      trend,
      averageGrowth,
      consistency,
      streakWeeks,
      totalMuscleGroups: totalMuscleGroupsEngaged.size,
      mostTargetedMuscle
    };
  }, [weeklyMetrics, metricType]);

  // Format insight value based on metric type with support for decimal places
  const formatInsightValue = (value: number) => {
    if (metricType === 'totalWeightLifted' || metricType === 'averageWeightPerRep') {
      return formatWeight(value);
    }
    // For totalSets, show decimal places since we now have weighted contributions
    return value.toFixed(1);
  };

  // Get color for trend
  const getTrendColor = () => {
    switch (insights.trend) {
      case 'increasing': return '#10b981'; // green
      case 'decreasing': return '#ef4444'; // red
      default: return '#f59e0b'; // amber
    }
  };

  // Get icon for trend
  const getTrendIcon = () => {
    switch (insights.trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      default: return 'minus';
    }
  };

  // Get specific insight card for muscle diversity (only for totalSets)
  const renderMuscleGroupInsight = () => {
    if (metricType !== 'totalSets' || insights.totalMuscleGroups === 0) return null;
    
    return (
      <View style={[styles.insightCard, { backgroundColor: '#8b5cf6' + '10' }]}>
        <Text style={[styles.insightLabel, { color: palette.text + '90' }]}>
          {t('muscle_diversity')}
        </Text>
        <Text style={[styles.insightValue, { color: palette.text }]}>
          {insights.totalMuscleGroups}
        </Text>
        <Text style={[styles.insightSubtext, { color: palette.text + '70' }]}>
          {t('muscle_groups_targeted')}
        </Text>
        {insights.mostTargetedMuscle && (
          <Text style={[styles.insightSubtext, { color: '#8b5cf6', marginTop: 2 }]}>
            {t('top')}: {insights.mostTargetedMuscle}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
      <Text style={[styles.title, { color: palette.text }]}>
        {t('key_insights')}
        {metricType === 'totalSets' && (
          <Text style={[styles.subtitle, { color: palette.text + '70' }]}>
            {' '}• {t('weighted_by_muscle_involvement')}
          </Text>
        )}
      </Text>
      
      <View style={styles.insightsGrid}>
        {/* Average Value */}
        <View style={[styles.insightCard, { backgroundColor: palette.highlight + '08' }]}>
          <Text style={[styles.insightLabel, { color: palette.text + '90' }]}>
            {t('average')}
          </Text>
          <Text style={[styles.insightValue, { color: palette.text }]}>
            {formatInsightValue(insights.average)}
          </Text>
        </View>

        {/* Best Week */}
        <View style={[styles.insightCard, { backgroundColor: '#10b981' + '10' }]}>
          <Text style={[styles.insightLabel, { color: palette.text + '90' }]}>
            {t('best_week')}
          </Text>
          <Text style={[styles.insightValue, { color: palette.text }]}>
            {formatInsightValue(insights.max.value)}
          </Text>
          <Text style={[styles.insightSubtext, { color: palette.text + '70' }]}>
            {insights.max.week}
          </Text>
        </View>

        {/* Trend */}
        <View style={[styles.insightCard, { backgroundColor: getTrendColor() + '10' }]}>
          <Text style={[styles.insightLabel, { color: palette.text + '90' }]}>
            {t('trend')}
          </Text>
          <View style={styles.trendRow}>
            <Feather name={getTrendIcon()} size={18} color={getTrendColor()} style={styles.trendIcon} />
            <Text style={[styles.trendValue, { color: getTrendColor() }]}>
              {insights.averageGrowth > 0 ? '+' : ''}{insights.averageGrowth.toFixed(1)}%
            </Text>
          </View>
          <Text style={[styles.insightSubtext, { color: palette.text + '70' }]}>
            {t('weekly_avg')}
          </Text>
        </View>

        {/* Consistency */}
        <View style={[styles.insightCard, { backgroundColor: '#a78bfa' + '10' }]}>
          <Text style={[styles.insightLabel, { color: palette.text + '90' }]}>
            {t('consistency')}
          </Text>
          <Text style={[styles.insightValue, { color: palette.text }]}>
            {Math.round(insights.consistency)}%
          </Text>
          <Text style={[styles.insightSubtext, { color: palette.text + '70' }]}>
            {insights.streakWeeks > 0 && `${insights.streakWeeks} ${t('week_streak')}`}
          </Text>
        </View>

        {/* Muscle Group Diversity (only for totalSets) */}
        {renderMuscleGroupInsight()}
      </View>

      {/* Enhanced explanation for weighted sets */}
      {metricType === 'totalSets' && (
        <View style={styles.explanationContainer}>
          <View style={styles.explanationRow}>
            <View style={styles.explanationDot} />
            <Text style={[styles.explanationText, { color: palette.text + '80' }]}>
              {t('primary_muscles_full_credit')}
            </Text>
          </View>
          <View style={styles.explanationRow}>
            <View style={[styles.explanationDot, { backgroundColor: palette.warning }]} />
            <Text style={[styles.explanationText, { color: palette.text + '80' }]}>
              {t('secondary_muscles_half_credit')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    flexDirection: 'row',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  insightCard: {
    width: '50%',
    paddingHorizontal: 6,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  insightLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  insightSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    marginRight: 4,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  explanationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  explanationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  explanationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  explanationText: {
    fontSize: 11,
    flex: 1,
  },
});

export default MetricInsights;