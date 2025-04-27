// components/ComparisonView.tsx
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { getMaxMetrics } from '../utils/analyticsUtils';
import { MetricChart } from './MetricChart';
import { AnalyticsViewMode } from './ViewSelectionDropdown';

interface ComparisonViewProps {
  onMetricPress: (view: AnalyticsViewMode) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = memo(({ onMetricPress }) => {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { weeklyMetrics } = useAnalytics();

  const { maxWeight, maxAvgWeight, maxSets } = useMemo(() => 
    getMaxMetrics(weeklyMetrics), 
    [weeklyMetrics]
  );

  const maxSetsPerWeek = useMemo(() => {
    if (!weeklyMetrics || weeklyMetrics.length === 0) return 10;
    return Math.max(...weeklyMetrics.map(week => week.totalSets), 10);
  }, [weeklyMetrics]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Summary Cards Row */}
      <View style={styles.summaryRow}>
        {/* Total Weight Card */}
        <View style={[styles.summaryCard, { backgroundColor: palette.highlight + '15', borderColor: palette.border }]}>
          <Text style={[styles.cardLabel, { color: palette.text + '80' }]}>
            {t('total_weight')}
          </Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>
            {`${weeklyMetrics.length > 0 ? weeklyMetrics[weeklyMetrics.length - 1].totalWeightLifted.toLocaleString() : 0} kg`}
          </Text>
        </View>

        {/* Average Weight Card */}
        <View style={[styles.summaryCard, { backgroundColor: '#f59e0b' + '15', borderColor: palette.border }]}>
          <Text style={[styles.cardLabel, { color: palette.text + '80' }]}>
            {t('avg_weight')}
          </Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>
          {`${weeklyMetrics.length > 0 ? Math.round(weeklyMetrics[weeklyMetrics.length - 1].averageWeightPerRep) : 0} kg`}
          </Text>
        </View>

        {/* Total Sets Card */}
        <View style={[styles.summaryCard, { backgroundColor: '#10b981' + '15', borderColor: palette.border }]}>
          <Text style={[styles.cardLabel, { color: palette.text + '80' }]}>
            {t('total_sets')}
          </Text>
          <Text style={[styles.cardValue, { color: palette.text }]}>
            {weeklyMetrics.length > 0 ? weeklyMetrics[weeklyMetrics.length - 1].totalSets : 0}
          </Text>
        </View>
      </View>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        {/* Total Weight Chart */}
        <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <View style={styles.chartHeaderRow}>
            {/* Make only the title and view more text clickable */}
            <TouchableOpacity 
              style={styles.chartTitleTouchable}
              activeOpacity={0.7}
              onPress={() => onMetricPress('total-weight')}
            >
              <Text style={[styles.chartTitle, { color: palette.text }]}>{t('total_weight_lifted')}</Text>
              <Text style={[styles.viewMoreText, { color: palette.highlight }]}>➔ {t('view_more')}</Text>
            </TouchableOpacity>
          </View>
          <MetricChart
            title=""
            data={weeklyMetrics}
            metricKey="totalWeightLifted"
            metricColor={palette.highlight}
            maxValue={maxWeight * 1.1}
            showMonthlyXAxis={true}
          />
        </View>

        {/* Average Weight Chart */}
        <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <View style={styles.chartHeaderRow}>
            {/* Make only the title and view more text clickable */}
            <TouchableOpacity 
              style={styles.chartTitleTouchable}
              activeOpacity={0.7}
              onPress={() => onMetricPress('average-weight')}
            >
              <Text style={[styles.chartTitle, { color: palette.text }]}>{t('avg_weight_per_rep')}</Text>
              <Text style={[styles.viewMoreText, { color: palette.highlight }]}>➔ {t('view_more')}</Text>
            </TouchableOpacity>
          </View>
          <MetricChart
            title=""
            data={weeklyMetrics}
            metricKey="averageWeightPerRep"
            metricColor="#f59e0b"
            maxValue={maxAvgWeight * 1.1}
            showMonthlyXAxis={true}
          />
        </View>

        {/* Total Sets Chart */}
        <View style={[styles.chartCard, { backgroundColor: palette.page_background, borderColor: palette.border }]}>
          <View style={styles.chartHeaderRow}>
            {/* Make only the title and view more text clickable */}
            <TouchableOpacity 
              style={styles.chartTitleTouchable}
              activeOpacity={0.7}
              onPress={() => onMetricPress('sets-analysis')}
            >
              <Text style={[styles.chartTitle, { color: palette.text }]}>{t('sets_per_week')}</Text>
              <Text style={[styles.viewMoreText, { color: palette.highlight }]}>➔ {t('view_more')}</Text>
            </TouchableOpacity>
          </View>
          <MetricChart
            title=""
            data={weeklyMetrics}
            metricKey="totalSets"
            metricColor="#10b981"
            maxValue={maxSetsPerWeek * 1.1}
            showMonthlyXAxis={true}
          />
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  chartsContainer: {
    marginTop: 6,
  },
  chartCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
  },
  chartHeaderRow: {
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  chartTitleTouchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '500',
  }
});