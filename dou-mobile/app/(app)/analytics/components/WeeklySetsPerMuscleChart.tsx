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

// Weekly Sets Per Muscle Group Chart with weighted contributions
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

  // Define muscle groups with better organization and color mapping
  const muscleGroupConfig = {
    // Major muscle groups with their subcategories
    'pectorals': { category: 'chest', color: '#f87171', displayName: 'Chest' },
    'upper_pectorals': { category: 'chest', color: '#f87171', displayName: 'Upper Chest' },
    'lower_pectorals': { category: 'chest', color: '#f87171', displayName: 'Lower Chest' },
    
    'latissimus_dorsi': { category: 'back', color: '#60a5fa', displayName: 'Lats' },
    'upper_back': { category: 'back', color: '#60a5fa', displayName: 'Upper Back' },
    'middle_back': { category: 'back', color: '#60a5fa', displayName: 'Mid Back' },
    'lower_back': { category: 'back', color: '#60a5fa', displayName: 'Lower Back' },
    'rhomboids': { category: 'back', color: '#60a5fa', displayName: 'Rhomboids' },
    
    'deltoids': { category: 'shoulders', color: '#a78bfa', displayName: 'Shoulders' },
    'anterior_deltoids': { category: 'shoulders', color: '#a78bfa', displayName: 'Front Delts' },
    'lateral_deltoids': { category: 'shoulders', color: '#a78bfa', displayName: 'Side Delts' },
    'posterior_deltoids': { category: 'shoulders', color: '#a78bfa', displayName: 'Rear Delts' },
    'trapezius': { category: 'shoulders', color: '#a78bfa', displayName: 'Traps' },
    
    'biceps': { category: 'arms', color: '#fbbf24', displayName: 'Biceps' },
    'triceps': { category: 'arms', color: '#fbbf24', displayName: 'Triceps' },
    'brachialis_biceps': { category: 'arms', color: '#fbbf24', displayName: 'Brachialis' },
    'forearms': { category: 'arms', color: '#fbbf24', displayName: 'Forearms' },
    
    'quadriceps': { category: 'legs', color: '#4ade80', displayName: 'Quads' },
    'quadriceps_glutes': { category: 'legs', color: '#4ade80', displayName: 'Quads & Glutes' },
    'hamstrings': { category: 'legs', color: '#4ade80', displayName: 'Hamstrings' },
    'hamstrings_glutes': { category: 'legs', color: '#4ade80', displayName: 'Hamstrings & Glutes' },
    'hamstrings_lower_back': { category: 'legs', color: '#4ade80', displayName: 'Hamstrings & Lower Back' },
    'glutes': { category: 'legs', color: '#4ade80', displayName: 'Glutes' },
    'calves': { category: 'legs', color: '#4ade80', displayName: 'Calves' },
    
    'core': { category: 'core', color: '#f97316', displayName: 'Core' },
    'rectus_abdominis': { category: 'core', color: '#f97316', displayName: 'Abs' },
    'obliques': { category: 'core', color: '#f97316', displayName: 'Obliques' },
    'lower_abs': { category: 'core', color: '#f97316', displayName: 'Lower Abs' },
    'deep_core_stabilizers': { category: 'core', color: '#f97316', displayName: 'Deep Core' },
    'full_core': { category: 'core', color: '#f97316', displayName: 'Full Core' },
    'core_hip_flexors': { category: 'core', color: '#f97316', displayName: 'Core & Hip Flexors' },
    'rectus_abdominis_obliques': { category: 'core', color: '#f97316', displayName: 'Abs & Obliques' },
    
    'cardiovascular_system': { category: 'cardio', color: '#ec4899', displayName: 'Cardio' },
    'cardiovascular_system_full_body': { category: 'cardio', color: '#ec4899', displayName: 'Full Body Cardio' },
    'cardiovascular_system_legs': { category: 'cardio', color: '#ec4899', displayName: 'Lower Body Cardio' },
    'cardiovascular_system_upper_body': { category: 'cardio', color: '#ec4899', displayName: 'Upper Body Cardio' },
    
    'full_body': { category: 'functional', color: '#64748b', displayName: 'Full Body' },
    'shoulders_core': { category: 'functional', color: '#64748b', displayName: 'Shoulders & Core' },
    'grip_core_legs': { category: 'functional', color: '#64748b', displayName: 'Grip, Core & Legs' },
    
    'other': { category: 'other', color: '#94a3b8', displayName: 'Other' }
  };

  // Get muscle group color
  const getMuscleGroupColor = (muscleGroup: string): string => {
    return muscleGroupConfig[muscleGroup as keyof typeof muscleGroupConfig]?.color || '#94a3b8';
  };

  // Get muscle group display name
  const getMuscleGroupDisplayName = (muscleGroup: string): string => {
    return muscleGroupConfig[muscleGroup as keyof typeof muscleGroupConfig]?.displayName || 
           muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1).replace(/_/g, ' ');
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
  
  // Get breakdown by muscle group for selected week with weighted contributions
  const muscleGroupBreakdown = useMemo(() => {
    if (!selectedWeek) return null;
    
    const result = Object.entries(selectedWeek.setsPerMuscleGroup)
      .filter(([_, setCount]) => setCount > 0)
      .map(([group, setCount]) => ({
        muscleGroup: group,
        displayName: getMuscleGroupDisplayName(group),
        setCount: Math.round(setCount * 10) / 10, // Round to 1 decimal place for weighted sets
        percentage: selectedWeek.totalSets > 0 
          ? Math.round((setCount / selectedWeek.totalSets) * 100) 
          : 0,
        color: getMuscleGroupColor(group)
      }))
      .sort((a, b) => b.setCount - a.setCount);
    
    return result;
  }, [selectedWeek]);
  
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
          <View style={styles.selectedWeekInfo}>
            <Text style={[styles.subtitle, { color: palette.highlight }]}>
              {selectedWeek.label}
            </Text>
            <Text style={[styles.totalSetsText, { color: palette.text + '80' }]}>
              {Math.round(selectedWeek.totalSets * 10) / 10} {t('total_sets')}
            </Text>
          </View>
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
                    {Math.round(totalSets * 10) / 10}
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
                        const color = getMuscleGroupColor(muscleGroup);
                        
                        return (
                          <View 
                            key={`segment-${muscleGroup}`} 
                            style={[
                              styles.barSegment,
                              { 
                                backgroundColor: color,
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
          
          <ScrollView style={styles.legendScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.legendContainer}>
              {muscleGroupBreakdown.map(item => (
                <View key={item.muscleGroup} style={styles.legendItem}>
                  <View 
                    style={[
                      styles.legendColor, 
                      { backgroundColor: item.color }
                    ]} 
                  />
                  <View style={styles.legendTextContainer}>
                    <Text style={[styles.legendText, { color: palette.text }]}>
                      {item.displayName}
                    </Text>
                    <Text style={[styles.legendStats, { color: palette.text + '80' }]}>
                      {item.setCount}{' '}{t('sets')}{' '}({item.percentage}%)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          
          {/* Note about weighted contributions */}
          <View style={styles.noteContainer}>
            <Text style={[styles.noteText, { color: palette.text + '60' }]}>
              * {t('secondary_muscles_half_credit', 'Secondary muscles count as 0.5 sets each')}
            </Text>
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
    flex: 1,
  },
  selectedWeekInfo: {
    alignItems: 'flex-end',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalSetsText: {
    fontSize: 12,
    marginTop: 2,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  legendScroll: {
    maxHeight: 120, // Limit height to prevent overflow
  },
  legendContainer: {
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  legendStats: {
    fontSize: 11,
    marginTop: 1,
  },
  noteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  noteText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default WeeklySetsPerMuscleChart;