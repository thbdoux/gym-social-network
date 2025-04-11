// app/(app)/analytics.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useLogs } from '../../hooks/query/useLogQuery';
import Svg, { Path, Circle, LinearGradient, Stop, Defs } from 'react-native-svg';

// Define metric types
const METRIC_TYPES = {
  TONNAGE: 'tonnage',
  AVG_WEIGHT: 'avgWeight',
  SETS: 'sets'
};

// Color schemes for different metrics
const colorSchemes = {
  tonnage: {
    gradient: ['#FF006E', '#FB5607'],
    stroke: '#FF006E',
    fill: 'rgba(255, 0, 110, 0.1)',
    card: '#FF006E', 
    text: '#FF006E'
  },
  avgWeight: {
    gradient: ['#3A86FF', '#8338EC'],
    stroke: '#3A86FF',
    fill: 'rgba(58, 134, 255, 0.1)',
    card: '#3A86FF',
    text: '#3A86FF'
  },
  sets: {
    gradient: ['#06D6A0', '#1B9AAA'],
    stroke: '#06D6A0',
    fill: 'rgba(6, 214, 160, 0.1)',
    card: '#06D6A0',
    text: '#06D6A0'
  }
};

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedMetric, setSelectedMetric] = useState(METRIC_TYPES.TONNAGE);
  const [selectedExercise, setSelectedExercise] = useState('all');
  
  // Fetch workout logs
  const { data: logs = [], isLoading } = useLogs();

  // Get unique exercise names from all logs
  const exercises = useMemo(() => {
    const exerciseSet = new Set();
    exerciseSet.add('all'); // Add 'all' as default option
    
    logs.forEach(log => {
      if (log.exercises) {
        log.exercises.forEach(exercise => {
          if (exercise.name) {
            exerciseSet.add(exercise.name);
          }
        });
      }
    });
    
    return Array.from(exerciseSet).map(name => ({
      id: name,
      name: name === 'all' ? t('all_exercises') : name
    }));
  }, [logs, t]);

  // Group logs by month
  const monthlyData = useMemo(() => {
    if (!logs || logs.length === 0) return {
      labels: [],
      tonnage: [],
      avgWeight: [],
      sets: []
    };

    // Create a map to store monthly aggregated data
    const monthMap = new Map();
    
    // Process each log
    // Find this section in monthlyData useMemo function
    logs.forEach(log => {
      if (!log.date || !log.exercises) return;
      
      // Parse the date string correctly
      let date;
      if (typeof log.date === 'string') {
        // Assuming the format is MM/DD/YYYY
        const [month, day, year] = log.date.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // If it's already a Date object or timestamp
        date = new Date(log.date);
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', log.date);
        return;
      }
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = new Date(date.getFullYear(), date.getMonth(), 1)
        .toLocaleString('default', { month: 'short' });
      
      // Rest of your existing code...
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          label: monthLabel,
          totalWeight: 0,
          totalReps: 0,
          totalSets: 0
        });
      }
      
      const monthData = monthMap.get(monthKey);
      
      // Filter exercises if a specific one is selected
      const relevantExercises = selectedExercise === 'all' 
        ? log.exercises 
        : log.exercises.filter(e => e.name === selectedExercise);
      
      // Calculate metrics from exercises
      relevantExercises.forEach(exercise => {
        if (exercise.sets) {
          exercise.sets.forEach(set => {
            if (set.weight && set.reps) {
              monthData.totalWeight += set.weight * set.reps;
              monthData.totalReps += set.reps;
              monthData.totalSets += 1;
            }
          });
        }
      });
    });
    
    // Convert map to arrays for chart data
    const sortedEntries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    
    const labels = sortedEntries.map(([_, data]) => data.label);
    const tonnage = sortedEntries.map(([_, data]) => data.totalWeight);
    const avgWeight = sortedEntries.map(([_, data]) => 
      data.totalReps > 0 ? data.totalWeight / data.totalReps : 0
    );
    const sets = sortedEntries.map(([_, data]) => data.totalSets);
    
    return { labels, tonnage, avgWeight, sets };
  }, [logs, selectedExercise]);

  // Get current metric data
  const getCurrentData = () => {
    return monthlyData[selectedMetric] || [];
  };
  
  // Calculate progress
  const calculateProgress = () => {
    const data = getCurrentData();
    
    if (data.length < 1) {
      return {
        current: 0,
        monthlyChange: 0,
        monthlyChangePercent: 0,
        totalChange: 0,
        totalChangePercent: 0
      };
    }
    
    const current = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : current;
    const first = data[0];
    
    const monthlyChange = current - previous;
    const monthlyChangePercent = previous !== 0 ? (monthlyChange / previous * 100) : 0;
    
    const totalChange = current - first;
    const totalChangePercent = first !== 0 ? (totalChange / first * 100) : 0;
    
    return {
      current,
      monthlyChange,
      monthlyChangePercent,
      totalChange,
      totalChangePercent
    };
  };

  // Get formatted label for metric
  const getMetricLabel = () => {
    switch (selectedMetric) {
      case METRIC_TYPES.TONNAGE:
        return t('total_weight_kg');
      case METRIC_TYPES.AVG_WEIGHT:
        return t('average_weight_rep_kg');
      case METRIC_TYPES.SETS:
        return t('total_sets');
      default:
        return '';
    }
  };

  // Render chart
  const renderChart = () => {
    const data = getCurrentData();
    const labels = monthlyData.labels;
    
    if (data.length === 0 || labels.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>{t('not_enough_data')}</Text>
        </View>
      );
    }
    
    // Create chart points for the SVG path
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1; // Prevent division by zero
    
    // Normalize values to fit in the chart (80% of height, 10% padding top and bottom)
    const normalizedValues = data.map(value => 
      10 + ((value - minValue) / range) * 80
    );
    
    // Create SVG path
    let path = `M0,${100 - normalizedValues[0]}`;
    normalizedValues.forEach((value, i) => {
      if (i > 0) {
        const x = (i / (normalizedValues.length - 1)) * 100;
        path += ` L${x},${100 - value}`;
      }
    });
    
    // Create fill path
    const fillPath = `${path} L100,100 L0,100 Z`;
    
    const colorScheme = colorSchemes[selectedMetric];
    
    return (
      <View style={styles.chartContainer}>
        {/* Y-axis values */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>{Math.round(maxValue)}</Text>
          <Text style={styles.axisLabel}>{Math.round(minValue)}</Text>
        </View>
        
        {/* Chart drawing area */}
        <View style={styles.chartInner}>
          {/* Background grid lines */}
          <View style={styles.gridLines}>
            {[0, 1, 2, 3, 4].map(i => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>
          
          {/* SVG chart */}
          <Svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id={`${selectedMetric}Fill`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colorScheme.stroke} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={colorScheme.stroke} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            
            {/* Area under curve */}
            <Path 
              d={fillPath} 
              fill={`url(#${selectedMetric}Fill)`}
            />
            
            {/* Line */}
            <Path 
              d={path} 
              fill="none" 
              stroke={colorScheme.stroke} 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {normalizedValues.map((value, i) => {
              const x = (i / (normalizedValues.length - 1)) * 100;
              return (
                <Circle
                  key={i}
                  cx={`${x}%`}
                  cy={`${100 - value}%`}
                  r="4"
                  fill="#080f19"
                  stroke={colorScheme.stroke}
                  strokeWidth="2"
                />
              );
            })}
          </Svg>
          
          {/* X-axis labels */}
          <View style={styles.xAxisLabels}>
            {labels.map((label, i) => (
              <Text key={i} style={styles.axisLabel}>{label}</Text>
            ))}
          </View>
        </View>
      </View>
    );
  };
  
  const progress = calculateProgress();
  const colorScheme = colorSchemes[selectedMetric];
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#080f19" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            <Text style={styles.headerTitle}>{t('analytics')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionsButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Metric Selector */}
        <View style={styles.metricSelectorContainer}>
          <View style={styles.metricSelector}>
            <TouchableOpacity 
              style={[
                styles.metricButton, 
                selectedMetric === METRIC_TYPES.TONNAGE && {
                  backgroundColor: 'rgba(255, 0, 110, 0.1)'
                }
              ]}
              onPress={() => setSelectedMetric(METRIC_TYPES.TONNAGE)}
            >
              <Text 
                style={[
                  styles.metricButtonText, 
                  selectedMetric === METRIC_TYPES.TONNAGE && {
                    color: colorSchemes.tonnage.text,
                    fontWeight: '600'
                  }
                ]}
              >
                {t('volume')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.metricButton, 
                selectedMetric === METRIC_TYPES.AVG_WEIGHT && {
                  backgroundColor: 'rgba(58, 134, 255, 0.1)'
                }
              ]}
              onPress={() => setSelectedMetric(METRIC_TYPES.AVG_WEIGHT)}
            >
              <Text 
                style={[
                  styles.metricButtonText, 
                  selectedMetric === METRIC_TYPES.AVG_WEIGHT && {
                    color: colorSchemes.avgWeight.text,
                    fontWeight: '600'
                  }
                ]}
              >
                {t('weight_rep')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.metricButton, 
                selectedMetric === METRIC_TYPES.SETS && {
                  backgroundColor: 'rgba(6, 214, 160, 0.1)'
                }
              ]}
              onPress={() => setSelectedMetric(METRIC_TYPES.SETS)}
            >
              <Text 
                style={[
                  styles.metricButtonText, 
                  selectedMetric === METRIC_TYPES.SETS && {
                    color: colorSchemes.sets.text,
                    fontWeight: '600'
                  }
                ]}
              >
                {t('sets')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Chart Title */}
        <View style={styles.chartTitleContainer}>
          <Text style={styles.chartTitle}>{getMetricLabel()}</Text>
          <Text style={styles.chartSubtitle}>
            {selectedExercise === 'all' ? t('all_exercises') : 
              exercises.find(e => e.id === selectedExercise)?.name}
          </Text>
        </View>
        
        {/* Main Chart */}
        <View style={styles.mainChartContainer}>
          {renderChart()}
        </View>
        
        {/* Exercise Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.exerciseSelectorContainer}
        >
          {exercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseButton,
                selectedExercise === exercise.id ? {
                  backgroundColor: colorScheme.fill
                } : styles.inactiveExerciseButton
              ]}
              onPress={() => setSelectedExercise(exercise.id)}
            >
              <Text 
                style={[
                  styles.exerciseButtonText,
                  selectedExercise === exercise.id && { color: colorScheme.text }
                ]}
              >
                {exercise.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colorScheme.fill }]}>
            <Text style={styles.summaryCardLabel}>{t('current')}</Text>
            <Text style={[styles.summaryCardValue, { color: colorScheme.text }]}>
              {selectedMetric === METRIC_TYPES.AVG_WEIGHT 
                ? progress.current.toFixed(1) 
                : Math.round(progress.current).toLocaleString()}
            </Text>
            <Text style={styles.summaryCardUnit}>
              {selectedMetric === METRIC_TYPES.SETS ? t('sets') : 'kg'}
            </Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>{t('monthly')}</Text>
            <Text style={[
              styles.summaryCardValue, 
              progress.monthlyChange >= 0 ? styles.positiveChange : styles.negativeChange
            ]}>
              {progress.monthlyChange >= 0 ? '+' : ''}
              {selectedMetric === METRIC_TYPES.AVG_WEIGHT 
                ? progress.monthlyChange.toFixed(1) 
                : Math.round(progress.monthlyChange).toLocaleString()}
            </Text>
            <Text style={styles.summaryCardUnit}>
              {progress.monthlyChangePercent >= 0 ? '+' : ''}
              {progress.monthlyChangePercent.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>{t('total')}</Text>
            <Text style={[
              styles.summaryCardValue, 
              progress.totalChange >= 0 ? styles.positiveChange : styles.negativeChange
            ]}>
              {progress.totalChange >= 0 ? '+' : ''}
              {selectedMetric === METRIC_TYPES.AVG_WEIGHT 
                ? progress.totalChange.toFixed(1) 
                : Math.round(progress.totalChange).toLocaleString()}
            </Text>
            <Text style={styles.summaryCardUnit}>
              {progress.totalChangePercent >= 0 ? '+' : ''}
              {progress.totalChangePercent.toFixed(1)}%
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080f19',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#080f19',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080f19',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricSelectorContainer: {
    marginBottom: 24,
  },
  metricSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  metricButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  chartTitleContainer: {
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  mainChartContainer: {
    marginBottom: 24,
  },
  chartContainer: {
    height: 250,
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 8,
    top: 16,
    bottom: 16,
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chartInner: {
    position: 'absolute',
    top: 16,
    left: 34,
    right: 16,
    bottom: 32,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
  },
  xAxisLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseSelectorContainer: {
    paddingBottom: 8,
    marginBottom: 24,
  },
  exerciseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 8,
  },
  inactiveExerciseButton: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
  },
  exerciseButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 48) / 3,
  },
  summaryCardLabel: {
    fontSize: 12,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryCardUnit: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  positiveChange: {
    color: '#10B981',
  },
  negativeChange: {
    color: '#EF4444',
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 12,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});