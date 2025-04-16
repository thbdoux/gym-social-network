// components/MetricChart.tsx
import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { WeeklyMetrics, formatWeight } from '../utils/analyticsUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 16; // Using full width with minimal margin
const CHART_HEIGHT = 140; // Optimized height

interface MetricChartProps {
  title: string;
  data: WeeklyMetrics[];
  metricKey: keyof WeeklyMetrics;
  metricColor: string;
  maxValue: number;
  formatValue?: (value: number) => string;
}

// Improved MetricChart with better tooltips and axis
export const MetricChart: React.FC<MetricChartProps> = memo(({
  title,
  data,
  metricKey,
  metricColor,
  maxValue,
  formatValue = (value) => formatWeight(value),
}) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  // Only use the most recent weeks for display (show at most 8 weeks)
  const displayData = data.length > 8 ? data.slice(-8) : data;
  const barWidth = Math.min(38, (CHART_WIDTH) / displayData.length - 8); 
  
  // Calculate value for most recent week
  const currentValue = data.length > 0 ? data[data.length - 1][metricKey] as number : 0;
  
  // Calculate change from previous week
  let change = 0;
  if (data.length >= 2) {
    const previousValue = data[data.length - 2][metricKey] as number;
    if (previousValue > 0) {
      change = ((currentValue - previousValue) / previousValue) * 100;
    }
  }

  // Calculate average growth over time
  let avgGrowth = 0;
  let growthPoints = 0;
  if (data.length >= 3) {
    for (let i = 1; i < data.length; i++) {
      const current = data[i][metricKey] as number;
      const previous = data[i-1][metricKey] as number;
      if (previous > 0) {
        avgGrowth += ((current - previous) / previous) * 100;
        growthPoints++;
      }
    }
    if (growthPoints > 0) {
      avgGrowth = avgGrowth / growthPoints;
    }
  }
  
  // Handle bar click
  const handleBarPress = (index: number) => {
    if (selectedBarIndex === index) {
      setSelectedBarIndex(null);
    } else {
      setSelectedBarIndex(index);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: palette.page_background }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        <View style={styles.currentValueContainer}>
          {/* Trending insight with icon instead of static value */}
          <View style={styles.trendContainer}>
            <Text style={[
              styles.trendValue, 
              { color: avgGrowth >= 0 ? '#4ade80' : '#f87171' }
            ]}>
              {avgGrowth >= 0 ? '↑' : '↓'} {Math.abs(avgGrowth).toFixed(1)}%
            </Text>
            <Text style={[styles.trendLabel, { color: palette.text + '80' }]}>
              {avgGrowth >= 0 ? t('growing') : t('declining')}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Chart Container */}
      <View style={styles.chartContainer}>
        {/* Bars Container */}
        <View style={styles.graphContainer}>
          {displayData.map((week, index) => {
            const value = week[metricKey] as number;
            // Ensure minimum visible height and scale properly
            const barHeight = Math.max(4, (value / maxValue) * CHART_HEIGHT);
            const isSelected = selectedBarIndex === index;
            
            return (
              <View key={`bar-${index}`} style={styles.barColumn}>
                {/* Always show value above bar */}
                <View style={[
                  styles.barValue, 
                  { 
                    backgroundColor: 'transparent',
                  }
                ]}>
                  <Text style={[styles.barValueText, { color: palette.text + 'A0' }]}>
                    {formatValue(value)}
                  </Text>
                </View>
                
                {/* Bar */}
                <TouchableOpacity
                  onPress={() => handleBarPress(index)}
                  activeOpacity={0.7}
                  style={[
                    styles.barTouchable,
                    { height: CHART_HEIGHT }
                  ]}
                >
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        backgroundColor: isSelected ? metricColor : metricColor + '90',
                        height: barHeight,
                        width: barWidth,
                        bottom: 0
                      }
                    ]} 
                  />
                </TouchableOpacity>
                
                {/* X-axis Label */}
                <Text 
                  style={[styles.xAxisLabel, { color: isSelected ? palette.text : palette.text + '80' }]}
                  numberOfLines={1}
                >
                  {week.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 6,
    marginBottom: 0,
    marginHorizontal: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendLabel: {
    fontSize: 10,
    fontWeight: '400',
  },
  chartContainer: {
    height: CHART_HEIGHT + 40, // Extra space for values above bars and x-axis labels
    flexDirection: 'row',
    top:30,
    paddingBottom: 4,
  },
  graphContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    position: 'relative',
  },
  barTouchable: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    position: 'absolute',
  },
  barValue: {
    marginBottom: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '500',
  },
  xAxisLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: -36,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});