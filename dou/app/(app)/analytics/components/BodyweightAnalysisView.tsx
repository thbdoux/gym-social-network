// components/BodyweightAnalysisView.tsx
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { MetricChart } from './MetricChart';
import { 
  calculateBodyweightAnalytics,
  formatPercentChange,
  WeeklyMetrics
} from '../utils/analyticsUtils';

export const BodyweightAnalysisView: React.FC = memo(() => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { weeklyMetrics, logs } = useAnalytics();

  // Calculate bodyweight analytics
  const bodyweightAnalytics = useMemo(() => {
    return calculateBodyweightAnalytics(logs, weeklyMetrics);
  }, [logs, weeklyMetrics]);

  // Prepare bodyweight sets data for chart
  const bodyweightWeeklyData = useMemo(() => {
    return weeklyMetrics.map(week => ({
      ...week,
      bodyweightSets: week.bodyweightSets || 0
    }));
  }, [weeklyMetrics]);

  // Calculate progression insights
  const progressionInsights = useMemo(() => {
    if (!bodyweightAnalytics.bodyweightExercises.length) return null;

    const totalReps = bodyweightAnalytics.bodyweightExercises.reduce((sum, ex) => sum + ex.totalReps, 0);
    const avgRepsPerSet = bodyweightAnalytics.totalBodyweightSets > 0 ? 
      totalReps / bodyweightAnalytics.totalBodyweightSets : 0;

    // Find best performing exercise
    const bestExercise = bodyweightAnalytics.bodyweightExercises.reduce((best, current) => {
      if (current.repProgression.length < 2) return best;
      
      const currentProgression = current.repProgression;
      const firstReps = currentProgression[0].averageReps;
      const lastReps = currentProgression[currentProgression.length - 1].averageReps;
      const improvement = firstReps > 0 ? ((lastReps - firstReps) / firstReps) * 100 : 0;
      
      if (best.improvement === undefined || improvement > best.improvement) {
        return { exercise: current, improvement };
      }
      return best;
    }, { exercise: null, improvement: undefined });

    // Calculate consistency score
    const exercisesWithProgression = bodyweightAnalytics.bodyweightExercises.filter(
      ex => ex.repProgression.length >= 2
    );
    const consistencyScore = bodyweightAnalytics.bodyweightExercises.length > 0 ?
      (exercisesWithProgression.length / bodyweightAnalytics.bodyweightExercises.length) * 100 : 0;

    return {
      totalReps,
      avgRepsPerSet,
      bestExercise: bestExercise.exercise,
      bestImprovement: bestExercise.improvement,
      consistencyScore
    };
  }, [bodyweightAnalytics]);

  // Get trend color and icon
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return '#10b981';
      case 'decreasing': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      default: return 'minus';
    }
  };

  if (!bodyweightAnalytics.bodyweightExercises.length) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.emptyContainer}>
        <View style={[styles.emptyCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <Ionicons name="body-outline" size={48} color={palette.text + '40'} />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>
            {t('no_bodyweight_exercises')}
          </Text>
          <Text style={[styles.emptyDescription, { color: palette.text + '70' }]}>
            {t('start_tracking_bodyweight_exercises_description')}
          </Text>
          
          <View style={styles.suggestionsList}>
            <Text style={[styles.suggestionsTitle, { color: palette.text + '90' }]}>
              {t('popular_bodyweight_exercises')}:
            </Text>
            {[
              t('push_ups'),
              t('pull_ups'),
              t('squats'),
              t('lunges'),
              t('planks'),
              t('burpees')
            ].map((exercise, index) => (
              <Text key={index} style={[styles.suggestionItem, { color: palette.text + '60' }]}>
                • {exercise}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Overview Card */}
      <View style={[styles.overviewCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('bodyweight_overview')}
        </Text>
        
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewItem, { backgroundColor: '#10b981' + '10' }]}>
            <Ionicons name="fitness" size={24} color="#10b981" />
            <Text style={[styles.overviewValue, { color: palette.text }]}>
              {bodyweightAnalytics.totalBodyweightSets}
            </Text>
            <Text style={[styles.overviewLabel, { color: palette.text + '80' }]}>
              {t('total_sets')}
            </Text>
          </View>

          <View style={[styles.overviewItem, { backgroundColor: '#f59e0b' + '10' }]}>
            <Ionicons name="repeat" size={24} color="#f59e0b" />
            <Text style={[styles.overviewValue, { color: palette.text }]}>
              {progressionInsights?.totalReps || 0}
            </Text>
            <Text style={[styles.overviewLabel, { color: palette.text + '80' }]}>
              {t('total_reps')}
            </Text>
          </View>

          <View style={[styles.overviewItem, { backgroundColor: '#8b5cf6' + '10' }]}>
            <Ionicons name="library" size={24} color="#8b5cf6" />
            <Text style={[styles.overviewValue, { color: palette.text }]}>
              {bodyweightAnalytics.bodyweightExercises.length}
            </Text>
            <Text style={[styles.overviewLabel, { color: palette.text + '80' }]}>
              {t('exercises')}
            </Text>
          </View>

          <View style={[styles.overviewItem, { backgroundColor: palette.highlight + '10' }]}>
            <Ionicons name="trending-up" size={24} color={palette.highlight} />
            <Text style={[styles.overviewValue, { color: palette.text }]}>
              {progressionInsights?.avgRepsPerSet.toFixed(1) || '0.0'}
            </Text>
            <Text style={[styles.overviewLabel, { color: palette.text + '80' }]}>
              {t('avg_reps_per_set')}
            </Text>
          </View>
        </View>
      </View>

      {/* Bodyweight Sets Trend Chart */}
      <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('bodyweight_sets_trend')}
        </Text>
        <MetricChart
          title=""
          data={bodyweightWeeklyData}
          metricKey="bodyweightSets"
          metricColor="#10b981"
          maxValue={Math.max(...bodyweightWeeklyData.map(d => d.bodyweightSets), 10) * 1.1}
          showMonthlyXAxis={true}
          formatValue={(value) => value.toFixed(0)}
        />
      </View>

      {/* Progress Insights */}
      <View style={[styles.insightsCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('progression_insights')}
        </Text>
        
        <View style={styles.insightRow}>
          <View style={[styles.insightItem, { backgroundColor: getTrendColor(bodyweightAnalytics.repProgressionTrend) + '10' }]}>
            <View style={styles.insightHeader}>
              <Feather 
                name={getTrendIcon(bodyweightAnalytics.repProgressionTrend)} 
                size={18} 
                color={getTrendColor(bodyweightAnalytics.repProgressionTrend)} 
              />
              <Text style={[styles.insightTitle, { color: palette.text }]}>
                {t('overall_trend')}
              </Text>
            </View>
            <Text style={[styles.insightValue, { color: palette.text }]}>
              {bodyweightAnalytics.repProgressionTrend}
            </Text>
            <Text style={[styles.insightDescription, { color: palette.text + '70' }]}>
              {bodyweightAnalytics.repProgressionTrend === 'increasing' 
                ? t('your_reps_are_improving') 
                : bodyweightAnalytics.repProgressionTrend === 'decreasing'
                ? t('focus_on_consistency')
                : t('maintaining_steady_performance')
              }
            </Text>
          </View>

          <View style={[styles.insightItem, { backgroundColor: '#8b5cf6' + '10' }]}>
            <View style={styles.insightHeader}>
              <Feather name="target" size={18} color="#8b5cf6" />
              <Text style={[styles.insightTitle, { color: palette.text }]}>
                {t('consistency')}
              </Text>
            </View>
            <Text style={[styles.insightValue, { color: palette.text }]}>
              {progressionInsights?.consistencyScore.toFixed(0) || 0}%
            </Text>
            <Text style={[styles.insightDescription, { color: palette.text + '70' }]}>
              {t('exercises_with_progression')}
            </Text>
          </View>
        </View>

        {/* Best Performing Exercise */}
        {progressionInsights?.bestExercise && progressionInsights.bestImprovement !== undefined && (
          <View style={[styles.bestExerciseCard, { backgroundColor: '#10b981' + '08', borderColor: '#10b981' + '30' }]}>
            <View style={styles.bestExerciseHeader}>
              <Ionicons name="trophy" size={20} color="#10b981" />
              <Text style={[styles.bestExerciseTitle, { color: palette.text }]}>
                {t('most_improved_exercise')}
              </Text>
            </View>
            <Text style={[styles.bestExerciseName, { color: palette.text }]}>
              {progressionInsights.bestExercise.name}
            </Text>
            <Text style={[styles.bestExerciseImprovement, { color: '#10b981' }]}>
              {formatPercentChange(progressionInsights.bestImprovement)} {t('improvement')}
            </Text>
            <Text style={[styles.bestExerciseDetail, { color: palette.text + '70' }]}>
              {progressionInsights.bestExercise.averageReps.toFixed(1)} {t('avg_reps_per_set')}
            </Text>
          </View>
        )}
      </View>

      {/* Exercise Breakdown */}
      <View style={[styles.exercisesCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('exercise_breakdown')}
        </Text>
        
        {bodyweightAnalytics.bodyweightExercises.slice(0, 10).map((exercise, index) => {
          const hasProgression = exercise.repProgression.length >= 2;
          let progressionPercent = 0;
          
          if (hasProgression) {
            const firstReps = exercise.repProgression[0].averageReps;
            const lastReps = exercise.repProgression[exercise.repProgression.length - 1].averageReps;
            progressionPercent = firstReps > 0 ? ((lastReps - firstReps) / firstReps) * 100 : 0;
          }
          
          return (
            <View key={index} style={[styles.exerciseItem, { borderBottomColor: palette.border + '30' }]}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseRank}>
                  <Text style={[styles.exerciseRankText, { color: palette.text }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: palette.text }]}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exerciseStats, { color: palette.text + '70' }]}>
                    {exercise.sets} {t('sets')} • {exercise.totalReps} {t('total_reps')}
                  </Text>
                </View>
                <View style={styles.exerciseMetrics}>
                  <Text style={[styles.exerciseAvgReps, { color: palette.text }]}>
                    {exercise.averageReps.toFixed(1)}
                  </Text>
                  <Text style={[styles.exerciseAvgLabel, { color: palette.text + '60' }]}>
                    {t('avg_reps')}
                  </Text>
                </View>
              </View>
              
              {hasProgression && (
                <View style={styles.progressionRow}>
                  <View style={styles.progressionIndicator}>
                    <Feather 
                      name={progressionPercent > 0 ? 'trending-up' : progressionPercent < 0 ? 'trending-down' : 'minus'} 
                      size={12} 
                      color={progressionPercent > 0 ? '#10b981' : progressionPercent < 0 ? '#ef4444' : '#f59e0b'} 
                    />
                    <Text style={[
                      styles.progressionText, 
                      { color: progressionPercent > 0 ? '#10b981' : progressionPercent < 0 ? '#ef4444' : '#f59e0b' }
                    ]}>
                      {formatPercentChange(progressionPercent)}
                    </Text>
                  </View>
                  <Text style={[styles.progressionDetail, { color: palette.text + '60' }]}>
                    {exercise.repProgression[0].averageReps.toFixed(1)} → {exercise.repProgression[exercise.repProgression.length - 1].averageReps.toFixed(1)} {t('reps')}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Training Recommendations */}
      <View style={[styles.recommendationsCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('training_recommendations')}
        </Text>
        
        <View style={styles.recommendationsList}>
          {bodyweightAnalytics.repProgressionTrend === 'increasing' ? (
            <>
              <View style={styles.recommendationItem}>
                <Feather name="check-circle" size={16} color="#10b981" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('great_progress_keep_challenging_yourself')}
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Feather name="arrow-up" size={16} color="#f59e0b" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('consider_advanced_variations')}
                </Text>
              </View>
            </>
          ) : bodyweightAnalytics.repProgressionTrend === 'decreasing' ? (
            <>
              <View style={styles.recommendationItem}>
                <Feather name="alert-circle" size={16} color="#ef4444" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('focus_on_consistent_training')}
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Feather name="refresh-cw" size={16} color="#f59e0b" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('review_form_and_technique')}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.recommendationItem}>
                <Feather name="target" size={16} color="#f59e0b" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('increase_intensity_or_reps')}
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Feather name="plus" size={16} color="#8b5cf6" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('add_new_exercise_variations')}
                </Text>
              </View>
            </>
          )}
          
          <View style={styles.recommendationItem}>
            <Feather name="calendar" size={16} color="#10b981" />
            <Text style={[styles.recommendationText, { color: palette.text }]}>
              {t('aim_for_consistent_weekly_sessions')}
            </Text>
          </View>
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
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  suggestionsList: {
    alignSelf: 'stretch',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 13,
    marginBottom: 4,
  },
  overviewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  insightsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  insightItem: {
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
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  insightDescription: {
    fontSize: 10,
    lineHeight: 14,
  },
  bestExerciseCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  bestExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bestExerciseTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  bestExerciseName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bestExerciseImprovement: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bestExerciseDetail: {
    fontSize: 11,
  },
  exercisesCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  exerciseItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseRankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseStats: {
    fontSize: 11,
  },
  exerciseMetrics: {
    alignItems: 'flex-end',
  },
  exerciseAvgReps: {
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseAvgLabel: {
    fontSize: 10,
  },
  progressionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 36,
  },
  progressionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressionDetail: {
    fontSize: 11,
  },
  recommendationsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  recommendationsList: {
    
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  recommendationText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});

export default BodyweightAnalysisView;