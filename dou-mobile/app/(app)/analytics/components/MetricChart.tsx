// components/MetricChart.tsx
import React, { memo, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { WeeklyMetrics, formatWeight } from '../utils/analyticsUtils';
import { format, parse, isFirstDayOfMonth, parseISO, isSameMonth, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_CHART_HEIGHT = 180; // Reduced height for more compact display

interface MetricChartProps {
  title: string;
  data: WeeklyMetrics[];
  metricKey: keyof WeeklyMetrics;
  metricColor: string;
  maxValue: number;
  formatValue?: (value: number) => string;
  height?: number; // Optional custom height
  showFullLabels?: boolean; // Show full date labels
  showMonthlyXAxis?: boolean; // New prop for monthly x-axis display
}

// Enhanced MetricChart using react-native-chart-kit
export const MetricChart: React.FC<MetricChartProps> = memo(({
  title,
  data,
  metricKey,
  metricColor,
  maxValue,
  formatValue = (value) => formatWeight(value),
  height = DEFAULT_CHART_HEIGHT,
  showFullLabels = false,
  showMonthlyXAxis = false,
}) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate chart width based on data points - each point needs minimum 40px for readability
  const chartWidth = Math.max(SCREEN_WIDTH, data.length * 40);
  
  // Calculate value for most recent week
  const currentValue = data.length > 0 ? data[data.length - 1][metricKey] as number : 0;
  
  // Calculate y-axis values for better scale representation
  const yAxisValues = useMemo(() => {
    const values = data.map(item => item[metricKey] as number);
    const maxVal = Math.max(...values, 1); // Ensure at least 1 to avoid division by zero
    
    // Calculate step size based on max value (4-5 steps)
    const step = Math.ceil(maxVal / 4);
    
    // Generate y-axis values starting from 0 and going up
    const yValues = [];
    for (let i = 0; i <= 4; i++) {
      yValues.push(i * step);
    }
    
    return yValues;
  }, [data, metricKey]);

  // Enhanced X-axis labels for month display with labels in the middle of each month
  const { labels, weekDividers, monthMiddleIndices } = useMemo(() => {
    if (!showMonthlyXAxis || data.length === 0) {
      // Use the original label processing for non-monthly view
      return {
        labels: data.map(item => {
          if (showFullLabels) return item.label;
          const parts = item.label.split(' ');
          return parts.length >= 2 ? parts[0].charAt(0) + parts[1] : item.label;
        }),
        weekDividers: [],
        monthMiddleIndices: []
      };
    }

    // For monthly view with week dividers, we need more sophisticated processing
    const allLabels: string[] = [];
    const weekDividers: number[] = [];
    const monthMiddleIndices: number[] = [];
    
    // First pass: identify month boundaries and collect all dates
    const monthBoundaries: { month: string, startIndex: number, endIndex: number }[] = [];
    let currentMonth: string | null = null;
    let monthStartIndex = 0;
    
    data.forEach((item, index) => {
      const date = item.startDate;
      const monthKey = format(date, 'yyyy-MM');
      
      // Create a divider for each week (except the first)
      if (index > 0) {
        weekDividers.push(index);
      }
      
      // Track month boundaries
      if (currentMonth !== monthKey) {
        if (currentMonth !== null) {
          // End the previous month
          monthBoundaries.push({
            month: currentMonth,
            startIndex: monthStartIndex,
            endIndex: index - 1
          });
        }
        
        // Start a new month
        currentMonth = monthKey;
        monthStartIndex = index;
      }
      
      // For the last data point, close the final month
      if (index === data.length - 1 && currentMonth !== null) {
        monthBoundaries.push({
          month: currentMonth,
          startIndex: monthStartIndex,
          endIndex: index
        });
      }
    });
    
    // Second pass: Compute middle points of months and set up labels
    monthBoundaries.forEach(({ month, startIndex, endIndex }) => {
      const midIndex = Math.floor((startIndex + endIndex) / 2);
      monthMiddleIndices.push(midIndex);
    });
    
    // Create the final labels array
    data.forEach((_, index) => {
      // Check if this index is a month middle point
      const isMonthMiddle = monthMiddleIndices.includes(index);
      
      if (isMonthMiddle) {
        // Get the month name for this middle point
        const monthDate = data[index].startDate;
        allLabels.push(format(monthDate, 'MMM'));
      } else {
        // Empty string for non-month-middle entries
        allLabels.push('');
      }
    });
    
    return {
      labels: allLabels,
      weekDividers,
      monthMiddleIndices
    };
  }, [data, showFullLabels, showMonthlyXAxis]);

  // Prepare decorator function to draw week dividers
  const decoratorFunction = useMemo(() => {
    return () => {
      if (!showMonthlyXAxis || weekDividers.length === 0) {
        return null;
      }
      
      // Draw vertical divider lines at week boundaries
      return weekDividers.map((index) => {
        // Calculate x position
        const xPosition = (chartWidth / data.length) * index;
        
        return (
          <View 
            key={`divider-${index}`}
            style={{
              position: 'absolute',
              top: 0,
              left: xPosition,
              width: 1,
              height: height - 30, // Leave space for labels
              backgroundColor: palette.border + '40', // Lighter color for week dividers
              zIndex: 1
            }}
          />
        );
      });
    };
  }, [showMonthlyXAxis, weekDividers, chartWidth, data.length, height, palette.border]);

  // Prepare data for chart-kit format with corrected Y-axis orientation
  const chartData = {
    labels,
    datasets: [
      {
        data: data.map(item => item[metricKey] as number),
        color: () => metricColor,
        strokeWidth: 2
      }
    ]
  };

  // Get tooltip label based on selected point
  const getTooltipLabel = (index: number | null) => {
    if (index === null || index >= data.length) return '';
    const value = data[index][metricKey] as number;
    return formatValue(value);
  };

  // Handle data point selection for tooltip
  const handleDataPointClick = (data: any) => {
    setSelectedPointIndex(data.index);
  };
  
  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        </View>
      )}
      
      {/* Chart Container with Y-axis and legends */}
      <View style={styles.chartWithYAxis}>
        {/* Y-axis labels (custom) - Positioned in correct order (0 at bottom) */}
        <View style={styles.yAxisContainer}>
          {[...yAxisValues].reverse().map((value, index) => (
            <Text 
              key={`y-${index}`} 
              style={[styles.yAxisLabel, { color: palette.text + '80' }]}
            >
              {formatValue(value)}
            </Text>
          ))}
        </View>
        
        {/* Chart Container with horizontal scroll */}
        <ScrollView 
          horizontal 
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={[styles.chartContainer, { width: chartWidth }]}
          onContentSizeChange={() => {
            // Scroll to the right end if there's a lot of data
            if (data.length > 8 && scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({ animated: false });
            }
          }}
        >
          <LineChart
            data={chartData}
            width={chartWidth}
            height={height}
            yAxisLabel=""
            yAxisSuffix=""
            withInnerLines={!showMonthlyXAxis} // Hide default grid if using monthly view
            withVerticalLines={!showMonthlyXAxis} // We'll draw our own vertical lines
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={false} // We'll use our custom y-axis labels
            fromZero={true} // Force chart to start from zero
            chartConfig={{
              backgroundColor: palette.page_background,
              backgroundGradientFrom: palette.page_background,
              backgroundGradientTo: palette.page_background,
              decimalPlaces: 0,
              color: (opacity = 1) => metricColor + (opacity * 255).toString(16).padStart(2, '0'),
              labelColor: () => palette.text + '90',
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: metricColor
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: palette.border + '40'
              },
              propsForLabels: {
                fontSize: 10,
                fontWeight: 'bold', // Bold month names
              },
              formatYLabel: (value) => formatValue(parseFloat(value)),
            }}
            bezier
            style={styles.chart}
            onDataPointClick={handleDataPointClick}
            decorator={decoratorFunction}
          />
          
          {/* Add tooltip after chart */}
          {selectedPointIndex !== null && (
            <View
              style={[
                styles.tooltip,
                { 
                  left: (chartWidth / data.length) * (selectedPointIndex + 0.5),
                  backgroundColor: palette.highlight 
                }
              ]}
            >
              <Text style={styles.tooltipText}>
                {data[selectedPointIndex].label}: {getTooltipLabel(selectedPointIndex)}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      
      {/* Legend */}
      {selectedPointIndex !== null && (
        <View style={styles.legendContainer}>
          <Text style={[styles.legendText, { color: palette.text }]}>
            {data[selectedPointIndex].label}: {getTooltipLabel(selectedPointIndex)}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 2,
    marginBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartWithYAxis: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisContainer: {
    width: 30,
    height: DEFAULT_CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 8,
    textAlign: 'right',
  },
  chartContainer: {
    minHeight: DEFAULT_CHART_HEIGHT,
  },
  chart: {
    borderRadius: 12,
    paddingRight: 0,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 6,
    top: 50,
    transform: [{ translateX: -40 }],
    zIndex: 100,
  },
  tooltipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  legendContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  }
});