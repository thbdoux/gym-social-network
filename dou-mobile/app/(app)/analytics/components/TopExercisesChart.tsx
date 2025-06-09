// components/TopExercisesChart.tsx
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { formatWeight } from '../utils/analyticsUtils';
import { 
  getPrimaryMuscleGroup, 
  getMuscleGroupColor, 
  getExerciseByName 
} from '../utils/muscleMapping';

type MetricType = 'totalWeightLifted' | 'averageWeightPerRep' | 'totalSets';

interface TopExercisesChartProps {
  metricType: MetricType;
}

interface ExerciseData {
  name: string;
  value: number;
  change: number;
  muscleGroup: string;
  exerciseItem?: any; // Reference to exerciseData
}

export const TopExercisesChart: React.FC<TopExercisesChartProps> = memo(({ metricType }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { logs } = useAnalytics();
  const { width } = Dimensions.get('window');
  const chartWidth = width - 40;

  // Get color for change indicator - define this function before using it in useMemo
  const getChangeColor = (change: number, opacity = 1) => {
    if (change > 0) return `rgba(16, 185, 129, ${opacity})`; // green
    if (change < 0) return `rgba(239, 68, 68, ${opacity})`; // red
    return `rgba(148, 163, 184, ${opacity})`; // neutral gray
  };

  // Extract real exercise data from logs with enhanced muscle group detection
  const topExercisesData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    // Organize logs chronologically
    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
    
    // Split logs into recent and previous periods (last 4 weeks vs previous 4 weeks)
    const midpoint = Math.floor(sortedLogs.length / 2);
    const recentLogs = sortedLogs.slice(midpoint);
    const previousLogs = sortedLogs.slice(0, midpoint);
    
    // Calculate metrics for each exercise
    const exerciseMetrics: Record<string, { 
      recent: { 
        value: number, 
        reps: number, 
        sets: number 
      }, 
      previous: { 
        value: number, 
        reps: number, 
        sets: number 
      }, 
      muscleGroup: string,
      exerciseItem?: any
    }> = {};
    
    // Process logs to calculate metrics
    const processLogs = (logsList: typeof logs, period: 'recent' | 'previous') => {
      logsList.forEach(log => {
        if (!log.exercises || !Array.isArray(log.exercises)) return;
        
        log.exercises.forEach(exercise => {
          if (!exercise || !exercise.name || !exercise.sets || !Array.isArray(exercise.sets)) return;
          
          // Try to find the exercise in our database
          const exerciseItem = getExerciseByName(exercise.name, t);
          
          // Get muscle group using the enhanced system
          const muscleGroup = getPrimaryMuscleGroup(exercise.name, t);
          
          if (!exerciseMetrics[exercise.name]) {
            exerciseMetrics[exercise.name] = {
              recent: { value: 0, reps: 0, sets: 0 },
              previous: { value: 0, reps: 0, sets: 0 },
              muscleGroup,
              exerciseItem
            };
          }
          
          exercise.sets.forEach(set => {
            const weight = typeof set.weight === 'string' ? parseFloat(set.weight) : set.weight;
            const reps = typeof set.reps === 'string' ? parseInt(set.reps) : set.reps;
            
            if (!isNaN(weight) && !isNaN(reps)) {
              exerciseMetrics[exercise.name][period].value += weight * reps;
              exerciseMetrics[exercise.name][period].reps += reps;
              exerciseMetrics[exercise.name][period].sets += 1;
            }
          });
        });
      });
    };
    
    processLogs(recentLogs, 'recent');
    processLogs(previousLogs, 'previous');
    
    // Convert to array and calculate the appropriate metric and change
    const exerciseData: ExerciseData[] = Object.entries(exerciseMetrics).map(([name, data]) => {
      let current = 0;
      let previous = 0;
      
      switch (metricType) {
        case 'totalWeightLifted':
          current = data.recent.value;
          previous = data.previous.value;
          break;
        case 'averageWeightPerRep':
          current = data.recent.reps > 0 ? data.recent.value / data.recent.reps : 0;
          previous = data.previous.reps > 0 ? data.previous.value / data.previous.reps : 0;
          break;
        case 'totalSets':
          current = data.recent.sets;
          previous = data.previous.sets;
          break;
      }
      
      // Calculate percentage change
      const change = previous > 0 
        ? ((current - previous) / previous) * 100 
        : (current > 0 ? 100 : 0);
      
      return {
        name,
        value: current,
        change,
        muscleGroup: data.muscleGroup,
        exerciseItem: data.exerciseItem
      };
    });
    
    // Sort and return top exercises
    return exerciseData
      .filter(ex => ex.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [logs, metricType, t]);

  // Prepare data for bar chart
  const chartData = useMemo(() => {
    // For small data sets, ensure we have at least 2 items for chart display
    const chartItems = topExercisesData.length <= 1 
      ? [...topExercisesData, { name: '', value: 0, change: 0, muscleGroup: '', exerciseItem: null }] 
      : topExercisesData;
    
    return {
      labels: chartItems.map(ex => ex.name.length > 10 ? ex.name.substring(0, 10) + '...' : ex.name),
      datasets: [
        {
          data: chartItems.map(ex => ex.value),
          colors: chartItems.map(ex => getChangeColor(ex.change, 0.8))
        }
      ]
    };
  }, [topExercisesData]);

  // Get metric label based on type
  const getMetricLabel = () => {
    switch (metricType) {
      case 'totalWeightLifted': return t('total_weight');
      case 'averageWeightPerRep': return t('avg_weight');
      case 'totalSets': return t('sets');
    }
  };

  // Format value based on metric type
  const formatValue = (value: number) => {
    if (metricType === 'totalWeightLifted' || metricType === 'averageWeightPerRep') {
      return formatWeight(value);
    }
    return value.toString();
  };

  // Get exercise display name (check if we have translation available)
  const getExerciseDisplayName = (exercise: ExerciseData) => {
    if (exercise.exerciseItem && exercise.exerciseItem.nameKey) {
      // Try to get translated name
      const translatedName = t(exercise.exerciseItem.nameKey);
      // If translation exists and is different from the key, use it
      if (translatedName && translatedName !== exercise.exerciseItem.nameKey) {
        return translatedName;
      }
    }
    // Fallback to the logged name
    return exercise.name;
  };

  // Get equipment name if available
  const getEquipmentName = (exercise: ExerciseData) => {
    if (exercise.exerciseItem && exercise.exerciseItem.equipmentKey) {
      const translatedEquipment = t(exercise.exerciseItem.equipmentKey);
      if (translatedEquipment && translatedEquipment !== exercise.exerciseItem.equipmentKey) {
        return translatedEquipment;
      }
    }
    return null;
  };

  // Get difficulty level if available
  const getDifficultyLevel = (exercise: ExerciseData) => {
    if (exercise.exerciseItem && exercise.exerciseItem.difficulty) {
      return exercise.exerciseItem.difficulty;
    }
    return null;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50'; // green
      case 'intermediate': return '#FFC107'; // yellow
      case 'advanced': return '#F44336'; // red
      default: return 'transparent';
    }
  };

  // If no data available
  if (topExercisesData.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={[styles.noDataText, { color: palette.text + '80' }]}>
          {t('no_exercise_data')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chart Title */}
      <Text style={[styles.chartTitle, { color: palette.text }]}>
        {t('top_exercises')} - {getMetricLabel()}
      </Text>

      {/* Table for Exercise Details */}
      <View style={styles.tableContainer}>
        {/* Table Headers */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.exerciseCell, { color: palette.text + '80' }]}>
            {t('exercise')}
          </Text>
          <Text style={[styles.headerCell, styles.valueCell, { color: palette.text + '80' }]}>
            {getMetricLabel()}
          </Text>
          <Text style={[styles.headerCell, styles.changeCell, { color: palette.text + '80' }]}>
            {t('change')}
          </Text>
        </View>

        {/* Exercise Rows */}
        <ScrollView style={styles.tableScrollContainer}>
          {topExercisesData.map((exercise, index) => {
            const displayName = getExerciseDisplayName(exercise);
            const equipmentName = getEquipmentName(exercise);
            const difficulty = getDifficultyLevel(exercise);
            
            return (
              <View 
                key={exercise.name} 
                style={[
                  styles.exerciseRow, 
                  index % 2 === 0 && { backgroundColor: palette.border + '10' }
                ]}
              >
                {/* Exercise name and rank */}
                <View style={styles.exerciseCell}>
                  <View style={[styles.rankBadge, { backgroundColor: getMuscleGroupColor(exercise.muscleGroup as any) }]}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: palette.text }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <View style={styles.exerciseMetaRow}>
                      <Text style={[styles.muscleGroup, { color: palette.text + '60' }]}>
                        {exercise.muscleGroup.charAt(0).toUpperCase() + exercise.muscleGroup.slice(1)}
                      </Text>
                      {equipmentName && (
                        <Text style={[styles.equipment, { color: palette.text + '40' }]}>
                          • {equipmentName}
                        </Text>
                      )}
                      {difficulty && (
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(difficulty) }]}>
                          <Text style={styles.difficultyText}>
                            {difficulty.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Value */}
                <Text style={[styles.valueCell, { color: palette.text }]}>
                  {formatValue(exercise.value)}
                </Text>

                {/* Change indicator */}
                <View style={styles.changeCell}>
                  <Text style={[styles.changeValue, { color: getChangeColor(exercise.change) }]}>
                    {exercise.change > 0 ? '+' : ''}{Math.round(exercise.change)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryTitle, { color: palette.text + '80' }]}>
          {t('summary')}
        </Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.text + '80' }]}>
              {t('total_exercises')}
            </Text>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {topExercisesData.length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.text + '80' }]}>
              {t('best_performer')}
            </Text>
            <Text style={[styles.statValue, { color: palette.text }]} numberOfLines={1}>
              {getExerciseDisplayName(topExercisesData[0]) || t('none')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.text + '80' }]}>
              {t('avg_improvement')}
            </Text>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {topExercisesData.length > 0 
                ? `${Math.round(topExercisesData.reduce((sum, ex) => sum + ex.change, 0) / topExercisesData.length)}%`
                : '0%'
              }
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginTop: 10,
  },
  tableScrollContainer: {
    maxHeight: 300,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '600',
  },
  exerciseCell: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueCell: {
    flex: 2,
    textAlign: 'center',
  },
  changeCell: {
    flex: 2,
    textAlign: 'right',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  exerciseRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  muscleGroup: {
    fontSize: 12,
  },
  equipment: {
    fontSize: 11,
    marginLeft: 4,
  },
  difficultyBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
  },
  summaryContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    marginHorizontal: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  }
});

export default TopExercisesChart;