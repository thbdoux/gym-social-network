// components/MuscleGroupPieChart.tsx
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { getPrimaryMuscleGroup } from '../utils/muscleMapping';

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

  // Define the muscle group colors
  const muscleGroupColors = {
    'chest': '#f87171', // red
    'back': '#60a5fa', // blue
    'legs': '#4ade80', // green
    'shoulders': '#a78bfa', // purple
    'arms': '#fbbf24', // yellow
    'core': '#f97316', // orange
    'full_body': '#64748b', // slate
    'cardio': '#ec4899', // pink
    'other': '#94a3b8', // gray
  };

  // Calculate distribution of the selected metric by muscle group
  const distributionData = useMemo(() => {
    if (!weeklyMetrics || weeklyMetrics.length === 0) return [];

    // For sets, we can directly use setsPerMuscleGroup
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
          color: muscleGroupColors[muscle as keyof typeof muscleGroupColors] || '#94a3b8',
          legendFontColor: palette.text,
          legendFontSize: 12
        }))
        .sort((a, b) => b.value - a.value);
    }

    // For totalWeightLifted, calculate weight per muscle group
    if (metricType === 'totalWeightLifted' && logs && logs.length > 0) {
      const weightPerMuscle: Record<string, number> = {};
      let totalWeight = 0;

      // Analyze logs to extract weight per muscle group
      logs.forEach(log => {
        if (!log.exercises || !Array.isArray(log.exercises)) return;
        
        log.exercises.forEach(exercise => {
          if (!exercise || !exercise.sets || !Array.isArray(exercise.sets)) return;
          
          const muscleGroup = exercise.muscle_group || 'other';
          
          exercise.sets.forEach(set => {
            const weight = typeof set.weight === 'string' ? parseFloat(set.weight) : set.weight;
            const reps = typeof set.reps === 'string' ? parseInt(set.reps) : set.reps;
            
            if (!isNaN(weight) && !isNaN(reps)) {
              const setWeight = weight * reps;
              weightPerMuscle[muscleGroup] = (weightPerMuscle[muscleGroup] || 0) + setWeight;
              totalWeight += setWeight;
            }
          });
        });
      });

      // Convert to pie chart data - only include non-zero values
      return Object.entries(weightPerMuscle)
        .filter(([_, value]) => value > 0)
        .map(([muscle, value]) => ({
          name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
          value,
          percentage: totalWeight > 0 ? (value / totalWeight) * 100 : 0,
          color: muscleGroupColors[muscle as keyof typeof muscleGroupColors] || '#94a3b8',
          legendFontColor: palette.text,
          legendFontSize: 12
        }))
        .sort((a, b) => b.value - a.value);
    }

    // For averageWeightPerRep, calculate average weight per muscle group
    if (metricType === 'averageWeightPerRep' && logs && logs.length > 0) {
      const muscleData: Record<string, { totalWeight: number; totalReps: number }> = {};
      
      // Analyze logs to extract average weight per muscle group
      logs.forEach(log => {
        if (!log.exercises || !Array.isArray(log.exercises)) return;
        
        log.exercises.forEach(exercise => {
          if (!exercise || !exercise.sets || !Array.isArray(exercise.sets)) return;
          
          const muscleGroup = exercise.muscle_group || 'other';
          
          if (!muscleData[muscleGroup]) {
            muscleData[muscleGroup] = { totalWeight: 0, totalReps: 0 };
          }
          
          exercise.sets.forEach(set => {
            const weight = typeof set.weight === 'string' ? parseFloat(set.weight) : set.weight;
            const reps = typeof set.reps === 'string' ? parseInt(set.reps) : set.reps;
            
            if (!isNaN(weight) && !isNaN(reps)) {
              muscleData[muscleGroup].totalWeight += weight * reps;
              muscleData[muscleGroup].totalReps += reps;
            }
          });
        });
      });

      // Calculate average weight per rep for each muscle group
      const muscleAvgWeight: Record<string, number> = {};
      
      Object.entries(muscleData).forEach(([muscle, data]) => {
        if (data.totalReps > 0) {
          const avgWeight = data.totalWeight / data.totalReps;
          muscleAvgWeight[muscle] = avgWeight;
        }
      });

      // Convert to pie chart data - only include non-zero values
      return Object.entries(muscleAvgWeight)
        .filter(([_, value]) => value > 0)
        .map(([muscle, value]) => ({
          name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
          value,
          percentage: Object.values(muscleAvgWeight).reduce((sum, val) => sum + val, 0) > 0 
            ? (value / Object.values(muscleAvgWeight).reduce((sum, val) => sum + val, 0)) * 100 
            : 0,
          color: muscleGroupColors[muscle as keyof typeof muscleGroupColors] || '#94a3b8',
          legendFontColor: palette.text,
          legendFontSize: 12
        }))
        .sort((a, b) => b.value - a.value);
    }

    return [];
  }, [weeklyMetrics, logs, metricType, palette.text]);

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

  return (
    <View style={styles.container}>
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
        {distributionData.slice(0, 6).map((item, index) => (
          <View key={item.name} style={styles.percentageItem}>
            <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
            <Text style={[styles.muscleName, { color: palette.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.percentageValue, { color: palette.text + 'CC' }]}>
              {item.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
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
    marginTop: 10,
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
  }
});

export default MuscleGroupPieChart;