// components/ComparisonView.tsx
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { 
  getMaxMetrics, 
  formatWeight, 
  formatPercentChange, 
  formatDuration,
  formatDistance,
  calculateWorkoutInsights,
  calculateBodyweightAnalytics,
  calculateDurationDistanceAnalytics
} from '../utils/analyticsUtils';
import { MetricChart } from './MetricChart';
import { AnalyticsViewMode } from './ViewSelectionDropdown';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ComparisonViewProps {
  onMetricPress: (view: AnalyticsViewMode) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = memo(({ onMetricPress }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { weeklyMetrics, logs } = useAnalytics();
  console.log(weeklyMetrics)
  const { maxWeight, maxAvgWeight, maxSets } = useMemo(() => 
    getMaxMetrics(weeklyMetrics), 
    [weeklyMetrics]
  );

  const maxSetsPerWeek = useMemo(() => {
    if (!weeklyMetrics || weeklyMetrics.length === 0) return 10;
    return Math.max(...weeklyMetrics.map(week => week.totalSets), 10);
  }, [weeklyMetrics]);

  // Calculate comprehensive insights
  const insights = useMemo(() => {
    if (!weeklyMetrics.length || !logs.length) return null;
    
    const workoutInsights = calculateWorkoutInsights(logs, weeklyMetrics);
    const bodyweightAnalytics = calculateBodyweightAnalytics(logs, weeklyMetrics);
    const durationDistanceAnalytics = calculateDurationDistanceAnalytics(logs, weeklyMetrics);
    
    return {
      workout: workoutInsights,
      bodyweight: bodyweightAnalytics,
      endurance: durationDistanceAnalytics
    };
  }, [weeklyMetrics, logs]);

  // Calculate current period summary
  const currentPeriodSummary = useMemo(() => {
    if (!weeklyMetrics.length) return null;
    
    const recentWeeks = weeklyMetrics.slice(-4); // Last 4 weeks
    const totalWorkouts = recentWeeks.reduce((sum, week) => sum + week.workoutCount, 0);
    const totalSets = recentWeeks.reduce((sum, week) => sum + week.totalSets, 0);
    const totalWeight = recentWeeks.reduce((sum, week) => sum + week.totalWeightLifted, 0);
    const totalReps = recentWeeks.reduce((sum, week) => sum + week.totalReps, 0);
    const uniqueExercises = new Set();
    
    recentWeeks.forEach(week => {
      Object.keys(week.exerciseVariety).forEach(exercise => uniqueExercises.add(exercise));
    });
    
    return {
      totalWorkouts,
      totalSets,
      totalWeight,
      totalReps,
      uniqueExercises: uniqueExercises.size,
      averageWorkoutsPerWeek: totalWorkouts / 4,
      averageSetsPerWorkout: totalWorkouts > 0 ? totalSets / totalWorkouts : 0
    };
  }, [weeklyMetrics]);

  // Get trend indicators
  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      default: return 'minus';
    }
  };

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return '#10b981';
      case 'decreasing': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Summary Cards Row */}
      <View style={styles.summaryRow}>
        {/* Total Weight Card */}
        <View style={[styles.summaryCard, { backgroundColor: palette.highlight + '15', borderColor: palette.border }]}>
          <Text style={[styles.cardLabel, { color: palette.text + '80' }]}>
            {t('total_weight')}
          </Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>
            {`${weeklyMetrics.length > 0 ? Math.round(weeklyMetrics[weeklyMetrics.length - 1].totalWeightLifted) : 0} kg`}
          </Text>
        </View>

        {/* Average Weight Card */}
        <View style={[styles.summaryCard, { backgroundColor: '#f59e0b' + '15', borderColor: palette.border }]}>
          <Text style={[styles.cardLabel, { color: palette.text + '80' }]}>
            {t('avg_weight')}
          </Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>
          {`${weeklyMetrics.length > 0 ? Math.round(weeklyMetrics[weeklyMetrics.length - 1].averageWeightPerRep) : 0} kg`}
          </Text>
        </View>

        {/* Total Sets Card */}
        <View style={[styles.summaryCard, { backgroundColor: '#10b981' + '15', borderColor: palette.border }]}>
          <Text style={[styles.cardLabel, { color: palette.text + '80' }]}>
            {t('total_sets')}
          </Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>
            {weeklyMetrics.length > 0 ? Math.round(weeklyMetrics[weeklyMetrics.length - 1].totalSets) : 0}
          </Text>
        </View>
      </View>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        {/* Total Weight Chart */}
        <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <View style={styles.chartHeaderRow}>
            <TouchableOpacity 
              style={styles.chartTitleTouchable}
              activeOpacity={0.7}
              onPress={() => onMetricPress('total-weight')}
            >
              <Text style={[styles.chartTitle, { color: palette.text }]}>{t('total_weight_lifted')}</Text>
              <Text style={[styles.viewMoreText, { color: palette.highlight }]}>➔ {t('view_more')}</Text>
            </TouchableOpacity>
          </View>
          <MetricChart
            title=""
            data={weeklyMetrics}
            metricKey="totalWeightLifted"
            metricColor={palette.highlight}
            maxValue={maxWeight * 1.1}
            showMonthlyXAxis={true}
          />
        </View>

        {/* Average Weight Chart */}
        <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <View style={styles.chartHeaderRow}>
            <TouchableOpacity 
              style={styles.chartTitleTouchable}
              activeOpacity={0.7}
              onPress={() => onMetricPress('average-weight')}
            >
              <Text style={[styles.chartTitle, { color: palette.text }]}>{t('avg_weight_per_rep')}</Text>
              <Text style={[styles.viewMoreText, { color: palette.highlight }]}>➔ {t('view_more')}</Text>
            </TouchableOpacity>
          </View>
          <MetricChart
            title=""
            data={weeklyMetrics}
            metricKey="averageWeightPerRep"
            metricColor="#f59e0b"
            maxValue={maxAvgWeight * 1.1}
            showMonthlyXAxis={true}
          />
        </View>

        {/* Total Sets Chart */}
        <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <View style={styles.chartHeaderRow}>
            <TouchableOpacity 
              style={styles.chartTitleTouchable}
              activeOpacity={0.7}
              onPress={() => onMetricPress('sets-analysis')}
            >
              <Text style={[styles.chartTitle, { color: palette.text }]}>{t('sets_per_week')}</Text>
              <Text style={[styles.viewMoreText, { color: palette.highlight }]}>➔ {t('view_more')}</Text>
            </TouchableOpacity>
          </View>
          <MetricChart
            title=""
            data={weeklyMetrics}
            metricKey="totalSets"
            metricColor="#10b981"
            maxValue={maxSetsPerWeek * 1.1}
            showMonthlyXAxis={true}
            formatValue={(value) => value.toFixed(1)}
          />
        </View>
      </View>

      {/* Period Summary */}
      {currentPeriodSummary && (
        <View style={[styles.sectionCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            {t('last_4_weeks_summary')}
          </Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="fitness" size={20} color={palette.highlight} />
              <Text style={[styles.summaryValue, { color: palette.text }]}>
                {currentPeriodSummary.totalWorkouts}
              </Text>
              <Text style={[styles.summaryLabel, { color: palette.text + '80' }]}>
                {t('workouts')}
              </Text>
              <Text style={[styles.summarySubtext, { color: palette.text + '60' }]}>
                {currentPeriodSummary.averageWorkoutsPerWeek.toFixed(1)}/{t('week')}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons name="barbell" size={20} color="#10b981" />
              <Text style={[styles.summaryValue, { color: palette.text }]}>
                {currentPeriodSummary.totalSets}
              </Text>
              <Text style={[styles.summaryLabel, { color: palette.text + '80' }]}>
                {t('sets')}
              </Text>
              <Text style={[styles.summarySubtext, { color: palette.text + '60' }]}>
                {currentPeriodSummary.averageSetsPerWorkout.toFixed(1)}/{t('workout')}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons name="trending-up" size={20} color="#f59e0b" />
              <Text style={[styles.summaryValue, { color: palette.text }]}>
                {formatWeight(currentPeriodSummary.totalWeight)}
              </Text>
              <Text style={[styles.summaryLabel, { color: palette.text + '80' }]}>
                {t('volume')}
              </Text>
              <Text style={[styles.summarySubtext, { color: palette.text + '60' }]}>
                {currentPeriodSummary.totalReps} {t('reps')}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons name="library" size={20} color="#8b5cf6" />
              <Text style={[styles.summaryValue, { color: palette.text }]}>
                {currentPeriodSummary.uniqueExercises}
              </Text>
              <Text style={[styles.summaryLabel, { color: palette.text + '80' }]}>
                {t('exercises')}
              </Text>
              <Text style={[styles.summarySubtext, { color: palette.text + '60' }]}>
                {t('variety')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Workout Performance Insights */}
      {insights && (
        <View style={[styles.sectionCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            {t('workout_performance')}
          </Text>
          
          <View style={styles.insightRow}>
            <View style={[styles.insightCard, { backgroundColor: '#10b981' + '10' }]}>
              <View style={styles.insightHeader}>
                <Feather name="calendar" size={16} color="#10b981" />
                <Text style={[styles.insightTitle, { color: palette.text }]}>
                  {t('consistency')}
                </Text>
              </View>
              <Text style={[styles.insightValue, { color: palette.text }]}>
                {insights.workout.consistency.streak} {t('weeks')}
              </Text>
              <Text style={[styles.insightSubtext, { color: palette.text + '70' }]}>
                {t('current_streak')}
              </Text>
              <Text style={[styles.insightDetail, { color: palette.text + '60' }]}>
                {insights.workout.consistency.averageWorkoutsPerWeek.toFixed(1)} {t('workouts_per_week')}
              </Text>
            </View>

            <View style={[styles.insightCard, { backgroundColor: '#f59e0b' + '10' }]}>
              <View style={styles.insightHeader}>
                <Feather name="zap" size={16} color="#f59e0b" />
                <Text style={[styles.insightTitle, { color: palette.text }]}>
                  {t('intensity')}
                </Text>
              </View>
              <Text style={[styles.insightValue, { color: palette.text }]}>
                {insights.workout.intensity.averageSetsPerWorkout.toFixed(1)}
              </Text>
              <Text style={[styles.insightSubtext, { color: palette.text + '70' }]}>
                {t('sets_per_workout')}
              </Text>
              <View style={styles.trendIndicator}>
                <Feather 
                  name={getTrendIcon(insights.workout.intensity.intensityTrend)} 
                  size={12} 
                  color={getTrendColor(insights.workout.intensity.intensityTrend)} 
                />
                <Text style={[
                  styles.trendText, 
                  { color: getTrendColor(insights.workout.intensity.intensityTrend) }
                ]}>
                  {insights.workout.intensity.intensityTrend}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.insightRow}>
            <View style={[styles.insightCard, { backgroundColor: '#8b5cf6' + '10' }]}>
              <View style={styles.insightHeader}>
                <Feather name="shuffle" size={16} color="#8b5cf6" />
                <Text style={[styles.insightTitle, { color: palette.text }]}>
                  {t('variety')}
                </Text>
              </View>
              <Text style={[styles.insightValue, { color: palette.text }]}>
                {insights.workout.variety.uniqueExercisesPerWeek.toFixed(1)}
              </Text>
              <Text style={[styles.insightSubtext, { color: palette.text + '70' }]}>
                {t('exercises_per_week')}
              </Text>
              <Text style={[styles.insightDetail, { color: palette.text + '60' }]}>
                {insights.workout.variety.exerciseRotation.toFixed(0)}% {t('rotation')}
              </Text>
            </View>

            <View style={[styles.insightCard, { backgroundColor: '#ef4444' + '10' }]}>
              <View style={styles.insightHeader}>
                <Feather name="trending-up" size={16} color="#ef4444" />
                <Text style={[styles.insightTitle, { color: palette.text }]}>
                  {t('progression')}
                </Text>
              </View>
              <Text style={[styles.insightValue, { color: palette.text }]}>
                {formatPercentChange(insights.workout.progression.strengthProgression)}
              </Text>
              <Text style={[styles.insightSubtext, { color: palette.text + '70' }]}>
                {t('strength_growth')}
              </Text>
              <Text style={[styles.insightDetail, { color: palette.text + '60' }]}>
                {formatPercentChange(insights.workout.progression.volumeProgression)} {t('volume')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Exercise Type Distribution */}
      {insights && (
        <View style={[styles.sectionCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            {t('exercise_types')}
          </Text>
          
          <View style={styles.exerciseTypeRow}>
            {/* Bodyweight Exercises */}
            <TouchableOpacity 
              style={[styles.exerciseTypeCard, { backgroundColor: '#10b981' + '10', borderColor: '#10b981' + '30' }]}
              onPress={() => onMetricPress('bodyweight-analysis')}
            >
              <View style={styles.exerciseTypeHeader}>
                <Ionicons name="body" size={24} color="#10b981" />
                <Feather name="arrow-right" size={16} color="#10b981" />
              </View>
              <Text style={[styles.exerciseTypeValue, { color: palette.text }]}>
                {insights.bodyweight.totalBodyweightSets}
              </Text>
              <Text style={[styles.exerciseTypeLabel, { color: palette.text + '80' }]}>
                {t('bodyweight_sets')}
              </Text>
              {insights.bodyweight.bodyweightExercises.length > 0 && (
                <>
                  <View style={styles.trendIndicator}>
                    <Feather 
                      name={getTrendIcon(insights.bodyweight.repProgressionTrend)} 
                      size={12} 
                      color={getTrendColor(insights.bodyweight.repProgressionTrend)} 
                    />
                    <Text style={[
                      styles.trendText, 
                      { color: getTrendColor(insights.bodyweight.repProgressionTrend) }
                    ]}>
                      {insights.bodyweight.repProgressionTrend}
                    </Text>
                  </View>
                  <Text style={[styles.exerciseTypeDetail, { color: palette.text + '60' }]}>
                    {insights.bodyweight.bodyweightExercises.length} {t('exercises')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Endurance Exercises */}
            <TouchableOpacity 
              style={[styles.exerciseTypeCard, { backgroundColor: '#f59e0b' + '10', borderColor: '#f59e0b' + '30' }]}
              onPress={() => onMetricPress('endurance-analysis')}
            >
              <View style={styles.exerciseTypeHeader}>
                <Ionicons name="timer" size={24} color="#f59e0b" />
                <Feather name="arrow-right" size={16} color="#f59e0b" />
              </View>
              <Text style={[styles.exerciseTypeValue, { color: palette.text }]}>
                {insights.endurance.totalDurationMinutes.toFixed(0)}m
              </Text>
              <Text style={[styles.exerciseTypeLabel, { color: palette.text + '80' }]}>
                {t('total_duration')}
              </Text>
              <View style={styles.trendIndicator}>
                <Feather 
                  name={getTrendIcon(insights.endurance.enduranceProgression)} 
                  size={12} 
                  color={getTrendColor(insights.endurance.enduranceProgression)} 
                />
                <Text style={[
                  styles.trendText, 
                  { color: getTrendColor(insights.endurance.enduranceProgression) }
                ]}>
                  {insights.endurance.enduranceProgression}
                </Text>
              </View>
              <Text style={[styles.exerciseTypeDetail, { color: palette.text + '60' }]}>
                {insights.endurance.totalDistanceKm.toFixed(1)} km {t('distance')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={[styles.sectionCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('detailed_analysis')}
        </Text>
        
        <View style={styles.actionButtonsGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: palette.highlight + '10', borderColor: palette.highlight + '30' }]}
            onPress={() => onMetricPress('total-weight')}
          >
            <Ionicons name="barbell" size={20} color={palette.highlight} />
            <Text style={[styles.actionButtonText, { color: palette.text }]}>
              {t('strength_analysis')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#10b981' + '10', borderColor: '#10b981' + '30' }]}
            onPress={() => onMetricPress('sets-analysis')}
          >
            <Ionicons name="layers" size={20} color="#10b981" />
            <Text style={[styles.actionButtonText, { color: palette.text }]}>
              {t('volume_analysis')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#8b5cf6' + '10', borderColor: '#8b5cf6' + '30' }]}
            onPress={() => onMetricPress('bodyweight-analysis')}
          >
            <Ionicons name="body" size={20} color="#8b5cf6" />
            <Text style={[styles.actionButtonText, { color: palette.text }]}>
              {t('bodyweight_analysis')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#f59e0b' + '10', borderColor: '#f59e0b' + '30' }]}
            onPress={() => onMetricPress('endurance-analysis')}
          >
            <Ionicons name="timer" size={20} color="#f59e0b" />
            <Text style={[styles.actionButtonText, { color: palette.text }]}>
              {t('endurance_analysis')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  chartsContainer: {
    marginTop: 6,
  },
  chartCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
  },
  chartHeaderRow: {
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  chartTitleTouchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  summarySubtext: {
    fontSize: 10,
    marginTop: 2,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  insightCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  insightSubtext: {
    fontSize: 10,
    marginBottom: 4,
  },
  insightDetail: {
    fontSize: 9,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendText: {
    fontSize: 9,
    marginLeft: 2,
    fontWeight: '500',
  },
  exerciseTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseTypeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  exerciseTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  exerciseTypeValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseTypeLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  exerciseTypeDetail: {
    fontSize: 9,
    textAlign: 'center',
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ComparisonView;