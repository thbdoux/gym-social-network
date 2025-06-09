// components/EnduranceAnalysisView.tsx
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { MetricChart } from './MetricChart';
import { 
  calculateDurationDistanceAnalytics,
  formatDuration,
  formatDistance,
  formatPercentChange,
  WeeklyMetrics
} from '../utils/analyticsUtils';

export const EnduranceAnalysisView: React.FC = memo(() => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { weeklyMetrics, logs } = useAnalytics();

  // Calculate endurance analytics
  const enduranceAnalytics = useMemo(() => {
    return calculateDurationDistanceAnalytics(logs, weeklyMetrics);
  }, [logs, weeklyMetrics]);

  // Prepare endurance data for charts
  const enduranceWeeklyData = useMemo(() => {
    return weeklyMetrics.map(week => ({
      ...week,
      enduranceMinutes: week.durationMinutes || 0,
      enduranceDistance: week.totalDistance || 0
    }));
  }, [weeklyMetrics]);

  // Calculate endurance insights
  const enduranceInsights = useMemo(() => {
    if (!enduranceAnalytics.durationExercises.length && !enduranceAnalytics.distanceExercises.length) {
      return null;
    }

    const totalSessions = enduranceAnalytics.durationExercises.reduce((sum, ex) => sum + ex.sessions, 0) +
                         enduranceAnalytics.distanceExercises.reduce((sum, ex) => sum + ex.sessions, 0);
    
    const avgSessionDuration = enduranceAnalytics.durationExercises.length > 0 ?
      enduranceAnalytics.durationExercises.reduce((sum, ex) => sum + ex.averageDuration, 0) / enduranceAnalytics.durationExercises.length :
      0;

    const avgSessionDistance = enduranceAnalytics.distanceExercises.length > 0 ?
      enduranceAnalytics.distanceExercises.reduce((sum, ex) => sum + ex.averageDistance, 0) / enduranceAnalytics.distanceExercises.length :
      0;

    // Find best performing exercises
    const bestDurationExercise = enduranceAnalytics.durationExercises.reduce((best, current) => {
      if (current.durationProgression.length < 2) return best;
      
      const firstDuration = current.durationProgression[0].averageDuration;
      const lastDuration = current.durationProgression[current.durationProgression.length - 1].averageDuration;
      const improvement = firstDuration > 0 ? ((lastDuration - firstDuration) / firstDuration) * 100 : 0;
      
      if (!best.exercise || improvement > best.improvement) {
        return { exercise: current, improvement };
      }
      return best;
    }, { exercise: null, improvement: 0 });

    const bestDistanceExercise = enduranceAnalytics.distanceExercises.reduce((best, current) => {
      if (current.distanceProgression.length < 2) return best;
      
      const firstDistance = current.distanceProgression[0].averageDistance;
      const lastDistance = current.distanceProgression[current.distanceProgression.length - 1].averageDistance;
      const improvement = firstDistance > 0 ? ((lastDistance - firstDistance) / firstDistance) * 100 : 0;
      
      if (!best.exercise || improvement > best.improvement) {
        return { exercise: current, improvement };
      }
      return best;
    }, { exercise: null, improvement: 0 });

    // Calculate endurance variety
    const totalExercises = enduranceAnalytics.durationExercises.length + enduranceAnalytics.distanceExercises.length;
    
    // Calculate weekly consistency
    const weeksWithEndurance = weeklyMetrics.filter(week => 
      (week.durationMinutes && week.durationMinutes > 0) || 
      (week.totalDistance && week.totalDistance > 0)
    ).length;
    const enduranceConsistency = weeklyMetrics.length > 0 ? (weeksWithEndurance / weeklyMetrics.length) * 100 : 0;

    return {
      totalSessions,
      avgSessionDuration,
      avgSessionDistance,
      bestDurationExercise: bestDurationExercise.exercise,
      bestDurationImprovement: bestDurationExercise.improvement,
      bestDistanceExercise: bestDistanceExercise.exercise,
      bestDistanceImprovement: bestDistanceExercise.improvement,
      totalExercises,
      enduranceConsistency
    };
  }, [enduranceAnalytics, weeklyMetrics]);

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

  if (!enduranceAnalytics.durationExercises.length && !enduranceAnalytics.distanceExercises.length) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.emptyContainer}>
        <View style={[styles.emptyCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <Ionicons name="timer-outline" size={48} color={palette.text + '40'} />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>
            {t('no_endurance_exercises')}
          </Text>
          <Text style={[styles.emptyDescription, { color: palette.text + '70' }]}>
            {t('start_tracking_endurance_exercises_description')}
          </Text>
          
          <View style={styles.suggestionsList}>
            <Text style={[styles.suggestionsTitle, { color: palette.text + '90' }]}>
              {t('popular_endurance_exercises')}:
            </Text>
            {[
              t('running'),
              t('cycling'),
              t('rowing'),
              t('swimming'),
              t('walking'),
              t('elliptical')
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

  const maxDuration = Math.max(...enduranceWeeklyData.map(d => d.enduranceMinutes), 10);
  const maxDistance = Math.max(...enduranceWeeklyData.map(d => d.enduranceDistance), 1);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Overview Card */}
      <View style={[styles.overviewCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('endurance_overview')}
        </Text>
        
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewItem, { backgroundColor: '#f59e0b' + '10' }]}>
            <Ionicons name="timer" size={24} color="#f59e0b" />
            <Text style={[styles.overviewValue, { color: palette.text }]}>
              {formatDuration(enduranceAnalytics.totalDurationMinutes * 60)}
            </Text>
            <Text style={[styles.overviewLabel, { color: palette.text + '80' }]}>
              {t('total_duration')}
            </Text>
          </View>

          <View style={[styles.overviewItem, { backgroundColor: '#10b981' + '10' }]}>
            <Ionicons name="map" size={24} color="#10b981" />
            <Text style={[styles.overviewValue, { color: palette.text }]}>
              {enduranceAnalytics.totalDistanceKm.toFixed(1)} km
            </Text>
            <Text style={[styles.overviewLabel, { color: palette.text + '80' }]}>
              {t('total_distance')}
            </Text>
          </View>

          <View style={[styles.overviewItem, { backgroundColor: '#8b5cf6' + '10' }]}>
            <Ionicons name="fitness" size={24} color="#8b5cf6" />
            <Text style={[styles.overviewValue, { color: palette.text }]}>
              {enduranceInsights?.totalSessions || 0}
            </Text>
            <Text style={[styles.overviewLabel, { color: palette.text + '80' }]}>
              {t('total_sessions')}
            </Text>
          </View>

          <View style={[styles.overviewItem, { backgroundColor: palette.highlight + '10' }]}>
            <Ionicons name="library" size={24} color={palette.highlight} />
            <Text style={[styles.overviewValue, { color: palette.text }]}>
              {enduranceInsights?.totalExercises || 0}
            </Text>
            <Text style={[styles.overviewLabel, { color: palette.text + '80' }]}>
              {t('exercises')}
            </Text>
          </View>
        </View>
      </View>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        {/* Duration Chart */}
        {enduranceAnalytics.durationExercises.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {t('weekly_duration_trend')}
            </Text>
            <MetricChart
              title=""
              data={enduranceWeeklyData}
              metricKey="enduranceMinutes"
              metricColor="#f59e0b"
              maxValue={maxDuration * 1.1}
              showMonthlyXAxis={true}
              formatValue={(value) => `${value.toFixed(0)}m`}
            />
          </View>
        )}

        {/* Distance Chart */}
        {enduranceAnalytics.distanceExercises.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {t('weekly_distance_trend')}
            </Text>
            <MetricChart
              title=""
              data={enduranceWeeklyData}
              metricKey="enduranceDistance"
              metricColor="#10b981"
              maxValue={maxDistance * 1.1}
              showMonthlyXAxis={true}
              formatValue={(value) => `${value.toFixed(1)} km`}
            />
          </View>
        )}
      </View>

      {/* Progress Insights */}
      <View style={[styles.insightsCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('endurance_insights')}
        </Text>
        
        <View style={styles.insightRow}>
          <View style={[styles.insightItem, { backgroundColor: getTrendColor(enduranceAnalytics.enduranceProgression) + '10' }]}>
            <View style={styles.insightHeader}>
              <Feather 
                name={getTrendIcon(enduranceAnalytics.enduranceProgression)} 
                size={18} 
                color={getTrendColor(enduranceAnalytics.enduranceProgression)} 
              />
              <Text style={[styles.insightTitle, { color: palette.text }]}>
                {t('overall_trend')}
              </Text>
            </View>
            <Text style={[styles.insightValue, { color: palette.text }]}>
              {enduranceAnalytics.enduranceProgression}
            </Text>
            <Text style={[styles.insightDescription, { color: palette.text + '70' }]}>
              {enduranceAnalytics.enduranceProgression === 'increasing' 
                ? t('your_endurance_is_improving') 
                : enduranceAnalytics.enduranceProgression === 'decreasing'
                ? t('focus_on_consistent_training')
                : t('maintaining_steady_endurance')
              }
            </Text>
          </View>

          <View style={[styles.insightItem, { backgroundColor: '#8b5cf6' + '10' }]}>
            <View style={styles.insightHeader}>
              <Feather name="calendar" size={18} color="#8b5cf6" />
              <Text style={[styles.insightTitle, { color: palette.text }]}>
                {t('consistency')}
              </Text>
            </View>
            <Text style={[styles.insightValue, { color: palette.text }]}>
              {enduranceInsights?.enduranceConsistency.toFixed(0) || 0}%
            </Text>
            <Text style={[styles.insightDescription, { color: palette.text + '70' }]}>
              {t('weeks_with_endurance_training')}
            </Text>
          </View>
        </View>

        {/* Best Performing Exercises */}
        {(enduranceInsights?.bestDurationExercise || enduranceInsights?.bestDistanceExercise) && (
          <View style={styles.bestPerformersContainer}>
            <Text style={[styles.bestPerformersTitle, { color: palette.text }]}>
              {t('best_performers')}
            </Text>
            
            {enduranceInsights?.bestDurationExercise && (
              <View style={[styles.bestExerciseCard, { backgroundColor: '#f59e0b' + '08', borderColor: '#f59e0b' + '30' }]}>
                <View style={styles.bestExerciseHeader}>
                  <Ionicons name="timer" size={18} color="#f59e0b" />
                  <Text style={[styles.bestExerciseTitle, { color: palette.text }]}>
                    {t('best_duration_improvement')}
                  </Text>
                </View>
                <Text style={[styles.bestExerciseName, { color: palette.text }]}>
                  {enduranceInsights.bestDurationExercise.name}
                </Text>
                <Text style={[styles.bestExerciseImprovement, { color: '#f59e0b' }]}>
                  {formatPercentChange(enduranceInsights.bestDurationImprovement)} {t('improvement')}
                </Text>
                <Text style={[styles.bestExerciseDetail, { color: palette.text + '70' }]}>
                  {formatDuration(enduranceInsights.bestDurationExercise.averageDuration)} {t('avg_session')}
                </Text>
              </View>
            )}

            {enduranceInsights?.bestDistanceExercise && (
              <View style={[styles.bestExerciseCard, { backgroundColor: '#10b981' + '08', borderColor: '#10b981' + '30' }]}>
                <View style={styles.bestExerciseHeader}>
                  <Ionicons name="map" size={18} color="#10b981" />
                  <Text style={[styles.bestExerciseTitle, { color: palette.text }]}>
                    {t('best_distance_improvement')}
                  </Text>
                </View>
                <Text style={[styles.bestExerciseName, { color: palette.text }]}>
                  {enduranceInsights.bestDistanceExercise.name}
                </Text>
                <Text style={[styles.bestExerciseImprovement, { color: '#10b981' }]}>
                  {formatPercentChange(enduranceInsights.bestDistanceImprovement)} {t('improvement')}
                </Text>
                <Text style={[styles.bestExerciseDetail, { color: palette.text + '70' }]}>
                  {formatDistance(enduranceInsights.bestDistanceExercise.averageDistance)} {t('avg_session')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Duration Exercises Breakdown */}
      {enduranceAnalytics.durationExercises.length > 0 && (
        <View style={[styles.exercisesCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            {t('duration_exercises')}
          </Text>
          
          {enduranceAnalytics.durationExercises.slice(0, 8).map((exercise, index) => {
            const hasProgression = exercise.durationProgression.length >= 2;
            let progressionPercent = 0;
            
            if (hasProgression) {
              const firstDuration = exercise.durationProgression[0].averageDuration;
              const lastDuration = exercise.durationProgression[exercise.durationProgression.length - 1].averageDuration;
              progressionPercent = firstDuration > 0 ? ((lastDuration - firstDuration) / firstDuration) * 100 : 0;
            }
            
            return (
              <View key={index} style={[styles.exerciseItem, { borderBottomColor: palette.border + '30' }]}>
                <View style={styles.exerciseHeader}>
                  <View style={[styles.exerciseRank, { backgroundColor: '#f59e0b' + '20' }]}>
                    <Text style={[styles.exerciseRankText, { color: '#f59e0b' }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: palette.text }]}>
                      {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseStats, { color: palette.text + '70' }]}>
                      {exercise.sessions} {t('sessions')} • {formatDuration(exercise.totalDuration)}
                    </Text>
                  </View>
                  <View style={styles.exerciseMetrics}>
                    <Text style={[styles.exerciseAvgValue, { color: palette.text }]}>
                      {formatDuration(exercise.averageDuration)}
                    </Text>
                    <Text style={[styles.exerciseAvgLabel, { color: palette.text + '60' }]}>
                      {t('avg_duration')}
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
                      {formatDuration(exercise.durationProgression[0].averageDuration)} → {formatDuration(exercise.durationProgression[exercise.durationProgression.length - 1].averageDuration)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Distance Exercises Breakdown */}
      {enduranceAnalytics.distanceExercises.length > 0 && (
        <View style={[styles.exercisesCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            {t('distance_exercises')}
          </Text>
          
          {enduranceAnalytics.distanceExercises.slice(0, 8).map((exercise, index) => {
            const hasProgression = exercise.distanceProgression.length >= 2;
            let progressionPercent = 0;
            
            if (hasProgression) {
              const firstDistance = exercise.distanceProgression[0].averageDistance;
              const lastDistance = exercise.distanceProgression[exercise.distanceProgression.length - 1].averageDistance;
              progressionPercent = firstDistance > 0 ? ((lastDistance - firstDistance) / firstDistance) * 100 : 0;
            }
            
            return (
              <View key={index} style={[styles.exerciseItem, { borderBottomColor: palette.border + '30' }]}>
                <View style={styles.exerciseHeader}>
                  <View style={[styles.exerciseRank, { backgroundColor: '#10b981' + '20' }]}>
                    <Text style={[styles.exerciseRankText, { color: '#10b981' }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: palette.text }]}>
                      {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseStats, { color: palette.text + '70' }]}>
                      {exercise.sessions} {t('sessions')} • {formatDistance(exercise.totalDistance)}
                    </Text>
                  </View>
                  <View style={styles.exerciseMetrics}>
                    <Text style={[styles.exerciseAvgValue, { color: palette.text }]}>
                      {formatDistance(exercise.averageDistance)}
                    </Text>
                    <Text style={[styles.exerciseAvgLabel, { color: palette.text + '60' }]}>
                      {t('avg_distance')}
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
                      {formatDistance(exercise.distanceProgression[0].averageDistance)} → {formatDistance(exercise.distanceProgression[exercise.distanceProgression.length - 1].averageDistance)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Training Recommendations */}
      <View style={[styles.recommendationsCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('endurance_recommendations')}
        </Text>
        
        <View style={styles.recommendationsList}>
          {enduranceAnalytics.enduranceProgression === 'increasing' ? (
            <>
              <View style={styles.recommendationItem}>
                <Feather name="check-circle" size={16} color="#10b981" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('excellent_endurance_progress')}
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Feather name="target" size={16} color="#f59e0b" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('consider_increasing_intensity')}
                </Text>
              </View>
            </>
          ) : enduranceAnalytics.enduranceProgression === 'decreasing' ? (
            <>
              <View style={styles.recommendationItem}>
                <Feather name="alert-circle" size={16} color="#ef4444" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('focus_on_building_base_endurance')}
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Feather name="clock" size={16} color="#f59e0b" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('ensure_adequate_recovery')}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.recommendationItem}>
                <Feather name="arrow-up" size={16} color="#f59e0b" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('gradually_increase_duration_distance')}
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Feather name="shuffle" size={16} color="#8b5cf6" />
                <Text style={[styles.recommendationText, { color: palette.text }]}>
                  {t('vary_training_intensities')}
                </Text>
              </View>
            </>
          )}
          
          <View style={styles.recommendationItem}>
            <Feather name="heart" size={16} color="#ef4444" />
            <Text style={[styles.recommendationText, { color: palette.text }]}>
              {t('monitor_heart_rate_zones')}
            </Text>
          </View>
          
          <View style={styles.recommendationItem}>
            <Feather name="calendar" size={16} color="#10b981" />
            <Text style={[styles.recommendationText, { color: palette.text }]}>
              {t('aim_for_3_4_sessions_per_week')}
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
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  chartsContainer: {
    marginBottom: 16,
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
  bestPerformersContainer: {
    marginTop: 8,
  },
  bestPerformersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  bestExerciseCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  bestExerciseImprovement: {
    fontSize: 12,
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
  exerciseAvgValue: {
    fontSize: 12,
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

export default EnduranceAnalysisView;