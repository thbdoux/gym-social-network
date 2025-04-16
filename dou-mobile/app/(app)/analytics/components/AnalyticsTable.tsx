// components/AnalyticsTable.tsx
import React, { memo, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { NoDataView } from './NoDataView';
import { formatWeight, formatPercentChange } from '../utils/analyticsUtils';

// Define table column types
type SortColumn = 'date' | 'totalWeightLifted' | 'totalSets' | 'workoutCount';
type SortDirection = 'asc' | 'desc';

export const AnalyticsTable = memo(() => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { 
    weeklyMetrics, 
    selectedMuscleGroup, 
    selectedExercise,
    timeRange,
  } = useAnalytics();
  
  // Sort state
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, set default direction
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  // Sort the data
  const sortedData = useMemo(() => {
    if (!weeklyMetrics || weeklyMetrics.length === 0) return [];
    
    return [...weeklyMetrics].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'date':
          comparison = a.startDate.getTime() - b.startDate.getTime();
          break;
        case 'totalWeightLifted':
          comparison = a.totalWeightLifted - b.totalWeightLifted;
          break;
        case 'totalSets':
          comparison = a.totalSets - b.totalSets;
          break;
        case 'workoutCount':
          comparison = a.workoutCount - b.workoutCount;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [weeklyMetrics, sortColumn, sortDirection]);

  // Table header component
  const TableHeader = () => (
    <View style={[styles.tableHeader, { backgroundColor: palette.border + '20' }]}>
      <TouchableOpacity 
        style={[styles.headerCell, styles.dateCell]} 
        onPress={() => handleSort('date')}
      >
        <Text style={[styles.headerText, { color: palette.text }]}>{t('week')}</Text>
        {sortColumn === 'date' && (
          <Feather 
            name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} 
            size={14} 
            color={palette.text} 
          />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.metricCell]} 
        onPress={() => handleSort('totalWeightLifted')}
      >
        <Text style={[styles.headerText, { color: palette.text }]}>{t('total_weight')}</Text>
        {sortColumn === 'totalWeightLifted' && (
          <Feather 
            name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} 
            size={14} 
            color={palette.text} 
          />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.metricCell]} 
        onPress={() => handleSort('totalSets')}
      >
        <Text style={[styles.headerText, { color: palette.text }]}>{t('sets')}</Text>
        {sortColumn === 'totalSets' && (
          <Feather 
            name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} 
            size={14} 
            color={palette.text} 
          />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.metricCell]} 
        onPress={() => handleSort('workoutCount')}
      >
        <Text style={[styles.headerText, { color: palette.text }]}>{t('workouts')}</Text>
        {sortColumn === 'workoutCount' && (
          <Feather 
            name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} 
            size={14} 
            color={palette.text} 
          />
        )}
      </TouchableOpacity>
    </View>
  );
  
  // Table row component
  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isEven = index % 2 === 0;
    
    // Get color for trend indicator
    const getTrendColor = (trend?: string) => {
      if (trend === 'increasing') return '#4CAF50';
      if (trend === 'decreasing') return '#F44336';
      return palette.text + '60';
    };
    
    // Get trend icon name
    const getTrendIcon = (trend?: string) => {
      if (trend === 'increasing') return 'trending-up';
      if (trend === 'decreasing') return 'trending-down';
      return 'minus';
    };
    
    return (
      <View style={[
        styles.tableRow, 
        isEven && { backgroundColor: palette.border + '10' }
      ]}>
        <View style={[styles.cell, styles.dateCell]}>
          <Text style={[styles.cellText, { color: palette.text }]}>{item.label}</Text>
        </View>
        
        <View style={[styles.cell, styles.metricCell]}>
          <Text style={[styles.cellText, { color: palette.text }]}>
            {formatWeight(item.totalWeightLifted)}
          </Text>
          {item.percentChangeFromPrevious !== undefined && (
            <View style={styles.trendContainer}>
              <Feather 
                name={getTrendIcon(item.trend)} 
                size={12} 
                color={getTrendColor(item.trend)} 
              />
              <Text style={[styles.trendText, { color: getTrendColor(item.trend) }]}>
                {formatPercentChange(item.percentChangeFromPrevious)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={[styles.cell, styles.metricCell]}>
          <Text style={[styles.cellText, { color: palette.text }]}>
            {item.totalSets}
          </Text>
        </View>
        
        <View style={[styles.cell, styles.metricCell]}>
          <Text style={[styles.cellText, { color: palette.text }]}>
            {item.workoutCount}
          </Text>
        </View>
      </View>
    );
  };

  // Filter info component
  const FilterInfo = () => {
    if (!selectedMuscleGroup && !selectedExercise) return null;
    
    return (
      <View style={styles.filterInfo}>
        <Text style={[styles.filterText, { color: palette.text + '80' }]}>
          {t('filtered_by')}: 
          {selectedMuscleGroup ? ` ${selectedMuscleGroup}` : ''} 
          {selectedExercise ? ` / ${selectedExercise}` : ''}
        </Text>
      </View>
    );
  };
  
  // Show no data view if no metrics available
  if (!weeklyMetrics || weeklyMetrics.length === 0) {
    return (
      <NoDataView message={t('no_analytics_data')} />
    );
  }
  
  return (
    <View style={styles.container}>
      <FilterInfo />
      
      <View style={styles.tableContainer}>
        <TableHeader />
        
        <FlatList
          data={sortedData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.label + index}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      </View>
      
      {/* Muscle Group Distribution Section */}
      <View style={[styles.sectionContainer, { marginTop: 20 }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t('muscle_group_distribution')}
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleGroupTable}>
          <View>
            {/* Muscle Group Table Header */}
            <View style={[styles.muscleGroupRow, { backgroundColor: palette.border + '20' }]}>
              <Text style={[styles.muscleGroupHeaderCell, { color: palette.text, width: 120 }]}>
                {t('muscle_group')}
              </Text>
              <Text style={[styles.muscleGroupHeaderCell, { color: palette.text, width: 80 }]}>
                {t('sets')}
              </Text>
            </View>
            
            {/* Muscle Group Table Rows */}
            {sortedData.length > 0 && 
              Object.entries(sortedData[0].setsPerMuscleGroup)
                .filter(([_, count]) => count > 0)
                .sort(([_, countA], [__, countB]) => countB - countA)
                .map(([muscleGroup, count], index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <View 
                      key={muscleGroup}
                      style={[
                        styles.muscleGroupRow, 
                        isEven && { backgroundColor: palette.border + '10' }
                      ]}
                    >
                      <Text style={[styles.muscleGroupCell, { color: palette.text, width: 120 }]}>
                        {muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}
                      </Text>
                      <Text style={[styles.muscleGroupCell, { color: palette.text, width: 80 }]}>
                        {count}
                      </Text>
                    </View>
                  );
                })
            }
          </View>
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  filterInfo: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  filterText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  dateCell: {
    width: '25%',
    paddingLeft: 4,
  },
  metricCell: {
    width: '25%',
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  cell: {
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendText: {
    fontSize: 10,
    marginLeft: 2,
  },
  sectionContainer: {
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  muscleGroupTable: {
    marginBottom: 16,
  },
  muscleGroupRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  muscleGroupHeaderCell: {
    fontSize: 14,
    fontWeight: '600',
  },
  muscleGroupCell: {
    fontSize: 14,
  },
});