import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../../context/LanguageContext';

const screenWidth = Dimensions.get('window').width;

type SessionData = {
  month: string;
  date: Date;
  sessions: number;
};

interface TrainingConsistencyChartProps {
  sessionData: SessionData[];
  palette: {
    page_background: string;
    text: string;
    highlight: string;
    accent: string;
    border: string;
    layout: string;
  };
}

const TrainingConsistencyChart = ({ sessionData, palette }: TrainingConsistencyChartProps) => {
  const { t } = useLanguage();

  return (
    <View style={styles.chartCard}>
      <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
      
      <Text style={[styles.cardTitle, { color: palette.text }]}>{t('training_consistency')}</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: sessionData.map(item => item.month),
            datasets: [
              {
                data: sessionData.map(item => item.sessions),
                color: (opacity = 1) => `${palette.highlight}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                strokeWidth: 3
              }
            ]
          }}
          width={screenWidth - 32} // Full width minus padding
          height={180}
          fromZero={true}
          yAxisInterval={1}
          yAxisSuffix=""
          yAxisLabel=""
          withInnerLines={false}
          withOuterLines={true}
          withHorizontalLines={true}
          withVerticalLines={false}
          withDots={true}
          withShadow={false}
          segments={7}
          chartConfig={{
            backgroundColor: palette.page_background,
            backgroundGradientFrom: palette.page_background,
            backgroundGradientTo: palette.page_background,
            decimalPlaces: 0,
            color: (opacity = 1) => `${palette.text}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
            labelColor: (opacity = 1) => `${palette.text}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: palette.highlight
            },
            propsForHorizontalLabels: {
              fontSize: 12,
              fontWeight: 'bold'
            },
            propsForVerticalLabels: {
              fontSize: 10
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    position: 'relative',
    borderRadius: 0, // Remove border radius for full width
    padding: 16,
    marginVertical: 0, // Remove margins
    borderWidth: 0, // Remove border
    overflow: 'hidden',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0, // Remove border radius for full width
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 0, // Remove border radius for chart
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TrainingConsistencyChart;