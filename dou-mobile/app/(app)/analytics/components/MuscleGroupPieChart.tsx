// components/MuscleGroupPieChart.tsx
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { calculateMuscleGroupContribution, getMuscleGroupColor } from '../utils/muscleMapping';

type MetricType = 'totalWeightLifted' | 'averageWeightPerRep' | 'totalSets';

interface MuscleGroupPieChartProps {
  metricType: MetricType;
}

export const MuscleGroupPieChart: React.FC<MuscleGroupPieChartProps> = memo(({ metricType }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { weeklyMetrics, logs } = useAnalytics();
  const { width } = Dimensions.get('window');
  const chartWidth = Math.min(width - 32, 350);

  // Calculate distribution of the selected metric by muscle group
  const distributionData = useMemo(() => {
    if (!weeklyMetrics || weeklyMetrics.length === 0) return [];

    // For sets, we can directly use setsPerMuscleGroup from weeklyMetrics
    if (metricType === 'totalSets') {
      // Aggregate sets across all weeks
      const totalSetsPerMuscle: Record<string, number> = {};
      let totalSets = 0;

      weeklyMetrics.forEach(week => {
        Object.entries(week.setsPerMuscleGroup).forEach(([muscle, sets]) => {
          totalSetsPerMuscle[muscle] = (totalSetsPerMuscle[muscle] || 0) + sets;
          totalSets += sets;
        });
      });

      // Convert to pie chart data - only include non-zero values
      return Object.entries(totalSetsPerMuscle)
        .filter(([_, value]) => value > 0)
        .map(([muscle, value]) => ({
          name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
          value,
          percentage: totalSets > 0 ? (value / totalSets) * 100 : 0,
          color: getMuscleGroupColor(muscle as any),
          legendFontColor: palette.text,
          legendFontSize: 12
        }))
        .sort((a, b) => b.value - a.value);
    }

    // For weight-based metrics, we need to analyze the logs
    if ((metricType === 'totalWeightLifted' || metricType === 'averageWeightPerRep') && logs && logs.length > 0) {
      const muscleData: Record<string, { totalWeight: number; totalReps: number; totalSets: number }> = {};

      // Analyze logs to extract data per muscle group using the new system
      logs.forEach(log => {
        if (!log.exercises || !Array.isArray(log.exercises)) return;
        
        log.exercises.forEach(exercise => {
          if (!exercise || !exercise.sets || !Array.isArray(exercise.sets)) return;
          
          const setCount = exercise.sets.length;
          if (setCount === 0) return;
          
          // Get muscle group contributions using the new weighted system
          const muscleContributions = calculateMuscleGroupContribution(exercise.name, setCount, t);
          
          // Calculate total weight and reps for this exercise
          let exerciseWeight = 0;
          let exerciseReps = 0;
          
          exercise.sets.forEach(set => {
            const weight = typeof set.weight === 'string' ? parseFloat(set.weight) : set.weight;
            const reps = typeof set.reps === 'string' ? parseInt(set.reps) : set.reps;
            
            if (!isNaN(weight) && !isNaN(reps)) {
              exerciseWeight += weight * reps;
              exerciseReps += reps;
            }
          });
          
          // Distribute the exercise data across muscle groups based on contribution
          Object.entries(muscleContributions).forEach(([muscleGroup, contribution]) => {
            if (!muscleData[muscleGroup]) {
              muscleData[muscleGroup] = { totalWeight: 0, totalReps: 0, totalSets: 0 };
            }
            
            // Weight the contribution based on muscle involvement
            const weightContribution = exerciseWeight * (contribution / setCount);
            const repContribution = exerciseReps * (contribution / setCount);
            
            muscleData[muscleGroup].totalWeight += weightContribution;
            muscleData[muscleGroup].totalReps += repContribution;
            muscleData[muscleGroup].totalSets += contribution;
          });
        });
      });

      if (metricType === 'totalWeightLifted') {
        // Convert to pie chart data based on total weight lifted per muscle group
        const totalWeight = Object.values(muscleData).reduce((sum, data) => sum + data.totalWeight, 0);
        
        return Object.entries(muscleData)
          .filter(([_, data]) => data.totalWeight > 0)
          .map(([muscle, data]) => ({
            name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
            value: data.totalWeight,
            percentage: totalWeight > 0 ? (data.totalWeight / totalWeight) * 100 : 0,
            color: getMuscleGroupColor(muscle as any),
            legendFontColor: palette.text,
            legendFontSize: 12
          }))
          .sort((a, b) => b.value - a.value);
      }

      if (metricType === 'averageWeightPerRep') {
        // Calculate average weight per rep for each muscle group
        const muscleAvgWeight: Record<string, number> = {};
        
        Object.entries(muscleData).forEach(([muscle, data]) => {
          if (data.totalReps > 0) {
            muscleAvgWeight[muscle] = data.totalWeight / data.totalReps;
          }
        });

        // Convert to pie chart data based on relative average weights
        const totalAvgWeight = Object.values(muscleAvgWeight).reduce((sum, val) => sum + val, 0);
        
        return Object.entries(muscleAvgWeight)
          .filter(([_, value]) => value > 0)
          .map(([muscle, value]) => ({
            name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
            value,
            percentage: totalAvgWeight > 0 ? (value / totalAvgWeight) * 100 : 0,
            color: getMuscleGroupColor(muscle as any),
            legendFontColor: palette.text,
            legendFontSize: 12
          }))
          .sort((a, b) => b.value - a.value);
      }
    }

    return [];
  }, [weeklyMetrics, logs, metricType, palette.text, t]);

  // If no data, show a message
  if (distributionData.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={[styles.noDataText, { color: palette.text + '80' }]}>
          {t('no_data_available')}
        </Text>
      </View>
    );
  }

  // Get the metric title based on type
  const getMetricTitle = () => {
    switch (metricType) {
      case 'totalWeightLifted': return t('total_weight_distribution');
      case 'averageWeightPerRep': return t('avg_weight_distribution');
      case 'totalSets': return t('sets_distribution');
      default: return t('muscle_group_distribution');
    }
  };

  return (
    <View style={styles.container}>
      {/* Chart Title */}
      <Text style={[styles.chartTitle, { color: palette.text }]}>
        {getMetricTitle()}
      </Text>
      
      {/* Pie Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartContainer}>
          <PieChart
            data={distributionData}
            width={chartWidth}
            height={220}
            chartConfig={{
              backgroundColor: palette.page_background,
              backgroundGradientFrom: palette.page_background,
              backgroundGradientTo: palette.page_background,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: () => palette.text,
              style: {
                borderRadius: 16
              },
              propsForLabels: {
                fontSize: "10"
              }
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend={true}
            center={[chartWidth / 4, 0]}
          />
        </View>
      </ScrollView>

      {/* Display percentages in a grid for better readability */}
      <View style={styles.percentageGrid}>
        {distributionData.slice(0, 8).map((item, index) => (
          <View key={item.name} style={styles.percentageItem}>
            <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
            <Text style={[styles.muscleName, { color: palette.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.percentageValue, { color: palette.text + 'CC' }]}>
              {item.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>

      {/* Show summary statistics */}
      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryTitle, { color: palette.text + '80' }]}>
          {t('summary')}
        </Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.text + '80' }]}>
              {t('muscle_groups_trained')}
            </Text>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {distributionData.length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.text + '80' }]}>
              {t('top_muscle_group')}
            </Text>
            <Text style={[styles.statValue, { color: palette.text }]} numberOfLines={1}>
              {distributionData[0]?.name || t('none')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  noDataContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
  },
  percentageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    marginHorizontal: 10,
  },
  percentageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  muscleName: {
    fontSize: 12,
    flex: 1,
  },
  percentageValue: {
    fontSize: 12,
    fontWeight: '500',
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
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  }
});

export default MuscleGroupPieChart;