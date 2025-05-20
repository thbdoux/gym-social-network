// components/WeeklySetsPerMuscleChart.tsx
import React, { memo, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { WeeklyMetrics } from '../utils/analyticsUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 16; // Using full width with minimal margin
const CHART_HEIGHT = 140; // Consistent with other charts

interface WeeklySetsPerMuscleChartProps {
  title: string;
  data: WeeklyMetrics[];
  maxValue: number;
}

// Weekly Sets Per Muscle Group Chart
export const WeeklySetsPerMuscleChart: React.FC<WeeklySetsPerMuscleChartProps> = memo(({
  title,
  data,
  maxValue
}) => {
  const { palette, workoutLogPalette } = useTheme();
  const { t } = useLanguage();
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  
  // Only use the most recent weeks for display (show at most 8 weeks)
  const displayData = data.length > 8 ? data.slice(-8) : data;

  // Define standard muscle groups for consistent order
  const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  
  // Generate muscle group color mapping
  const muscleGroupColors: Record<string, string> = {
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

  // Calculate average growth in total sets
  let avgGrowth = 0;
  let growthPoints = 0;
  if (data.length >= 3) {
    for (let i = 1; i < data.length; i++) {
      const current = data[i].totalSets;
      const previous = data[i-1].totalSets;
      if (previous > 0) {
        avgGrowth += ((current - previous) / previous) * 100;
        growthPoints++;
      }
    }
    if (growthPoints > 0) {
      avgGrowth = avgGrowth / growthPoints;
    }
  }

  // Get selected week data
  const selectedWeek = selectedWeekIndex !== null ? displayData[selectedWeekIndex] : null;
  
  // Get breakdown by muscle group for selected week
  const muscleGroupBreakdown = useMemo(() => {
    if (!selectedWeek) return null;
    
    const result = muscleGroups.map(group => {
      const setCount = selectedWeek.setsPerMuscleGroup[group] || 0;
      return {
        muscleGroup: group,
        setCount,
        percentage: selectedWeek.totalSets > 0 
          ? Math.round((setCount / selectedWeek.totalSets) * 100) 
          : 0
      };
    }).filter(item => item.setCount > 0)
      .sort((a, b) => b.setCount - a.setCount);
    
    return result;
  }, [selectedWeek, muscleGroups]);
  
  // Handle week selection
  const handleWeekPress = (index: number) => {
    if (selectedWeekIndex === index) {
      setSelectedWeekIndex(null);
      setSelectedMuscleGroup(null);
    } else {
      setSelectedWeekIndex(index);
      setSelectedMuscleGroup(null);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: palette.page_background }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        
        {selectedWeek ? (
          <Text style={[styles.subtitle, { color: palette.highlight }]}>
            {selectedWeek.label}
          </Text>
        ) : (
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
        )}
      </View>
      
      {/* Chart Container */}
      <View style={styles.chartContainer}>
        {/* Weekly Stacked Bar Chart */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayData.map((week, weekIndex) => {
            const isSelected = selectedWeekIndex === weekIndex;
            const totalSets = week.totalSets;
            const barHeight = Math.max(4, (totalSets / maxValue) * CHART_HEIGHT);
            
            // Get muscle groups with sets for this week, sorted by count
            const weekMuscleGroups = Object.entries(week.setsPerMuscleGroup || {})
              .filter(([_, sets]) => sets > 0)
              .sort((a, b) => b[1] - a[1]);
            
            return (
              <View key={`week-${weekIndex}`} style={styles.barColumn}>
                {/* Always show total value above bar */}
                <View style={styles.barValueContainer}>
                  <Text style={[styles.barValueText, { color: palette.text + 'A0' }]}>
                    {totalSets}
                  </Text>
                </View>
                
                {/* Week Bar with stacked muscle groups */}
                <TouchableOpacity
                  onPress={() => handleWeekPress(weekIndex)}
                  activeOpacity={0.7}
                  style={[
                    styles.barTouchable,
                    { height: CHART_HEIGHT, width: 40 }
                  ]}
                >
                  {/* Always show stacked bars instead of only when selected */}
                  {weekMuscleGroups.length > 0 ? (
                    <View style={styles.stackedBarsContainer}>
                      {weekMuscleGroups.map(([muscleGroup, sets], idx) => {
                        const percentage = totalSets > 0 ? (sets / totalSets) : 0;
                        const segmentHeight = barHeight * percentage;
                        
                        return (
                          <View 
                            key={`segment-${muscleGroup}`} 
                            style={[
                              styles.barSegment,
                              { 
                                backgroundColor: muscleGroupColors[muscleGroup] || '#94a3b8', // Default color if not found
                                height: segmentHeight,
                                width: 40,
                                // Position segments bottom-up
                                bottom: weekMuscleGroups
                                  .slice(idx + 1)
                                  .reduce((sum, [_, s]) => sum + (barHeight * (s / totalSets)), 0)
                              }
                            ]}
                          />
                        );
                      })}
                    </View>
                  ) : (
                    // Show tiny bar for zero values
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: 4, // Minimum height for visibility
                          width: 40,
                          backgroundColor: workoutLogPalette.background
                        }
                      ]} 
                    />
                  )}
                </TouchableOpacity>
                
                {/* X-axis Label */}
                <Text 
                  style={[
                    styles.xAxisLabel, 
                    { color: isSelected ? palette.text : palette.text + '80' }
                  ]}
                >
                  {week.label}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
      
      {/* Muscle Group Breakdown for Selected Week */}
      {selectedWeek && muscleGroupBreakdown && (
        <View style={styles.breakdownContainer}>
          <Text style={[styles.breakdownTitle, { color: palette.text }]}>
            {t('muscle_group_breakdown')}
          </Text>
          
          <View style={styles.legendContainer}>
            {muscleGroupBreakdown.map(item => (
              <View key={item.muscleGroup} style={styles.legendItem}>
                <View 
                  style={[
                    styles.legendColor, 
                    { backgroundColor: muscleGroupColors[item.muscleGroup] }
                  ]} 
                />
                <Text style={[styles.legendText, { color: palette.text }]}>
                  {item.muscleGroup.charAt(0).toUpperCase() + item.muscleGroup.slice(1)}
                  {' : '}{item.setCount}{' '}{t('sets')}{' '}({item.percentage}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
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
    paddingBottom: 4,
  },
  scrollContent: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_HEIGHT,
    marginHorizontal: 4,
    position: 'relative',
  },
  barValueContainer: {
    marginBottom: 4,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '500',
  },
  barTouchable: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    position: 'absolute',
  },
  stackedBarsContainer: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    height: '100%',
  },
  barSegment: {
    position: 'absolute',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  breakdownContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

export default WeeklySetsPerMuscleChart;