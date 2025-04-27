// components/AnalyticsTable.tsx
import React, { memo, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { NoDataView } from './NoDataView';
import { formatWeight, formatPercentChange } from '../utils/analyticsUtils';

// Define table column types
type SortColumn = 'date' | 'totalWeightLifted' | 'totalSets' | 'averageWeightPerRep';
type SortDirection = 'asc' | 'desc';

export const AnalyticsTable = memo(() => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { 
    weeklyMetrics, 
    selectedMuscleGroup, 
    selectedExercise,
  } = useAnalytics();
  
  // Sort state
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Animation values for row highlights
  const [highlightedRowIndex, setHighlightedRowIndex] = useState<number | null>(null);
  const highlightAnim = useMemo(() => new Animated.Value(0), []);
  
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
  
  // Handle row press - highlight the row briefly
  const handleRowPress = (index: number) => {
    setHighlightedRowIndex(index);
    highlightAnim.setValue(1);
    
    Animated.timing(highlightAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      setHighlightedRowIndex(null);
    });
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
        case 'averageWeightPerRep':
          comparison = a.averageWeightPerRep - b.averageWeightPerRep;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [weeklyMetrics, sortColumn, sortDirection]);

  // Table header component
  const TableHeader = () => (
    <View style={[styles.tableHeader, { backgroundColor: palette.highlight + '10' }]}>
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
        onPress={() => handleSort('averageWeightPerRep')}
      >
        <Text style={[styles.headerText, { color: palette.text }]}>{t('avg_weight')}</Text>
        {sortColumn === 'averageWeightPerRep' && (
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
    </View>
  );
  
  // Table row component
  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isEven = index % 2 === 0;
    const isHighlighted = highlightedRowIndex === index;
    
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
    
    // Interpolate highlight color
    const backgroundColor = isHighlighted
      ? highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [isEven ? palette.border + '10' : 'transparent', palette.highlight + '20']
        })
      : isEven ? palette.border + '10' : 'transparent';
    
    return (
      <Animated.View style={[
        styles.tableRow, 
        { backgroundColor }
      ]}>
        <TouchableOpacity 
          style={styles.rowTouchable}
          onPress={() => handleRowPress(index)}
          activeOpacity={0.7}
        >
          <View style={[styles.cell, styles.dateCell]}>
            <Text style={[styles.cellText, { color: palette.text, fontWeight: '500' }]}>{item.label}</Text>
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
              {formatWeight(item.averageWeightPerRep)}
            </Text>
          </View>
          
          <View style={[styles.cell, styles.metricCell]}>
            <Text style={[styles.cellText, { color: palette.text }]}>
              {item.totalSets}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
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
      <View style={styles.tableContainer}>
        <TableHeader />
        
        <FlatList
          data={sortedData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.label + index}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 20 }} />}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: palette.border + '20' }]} />
          )}
        />
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
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginTop: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rowTouchable: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
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
  }
});