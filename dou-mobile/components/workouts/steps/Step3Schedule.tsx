import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { ProgramFormData } from '../ProgramWizard';
import { Calendar } from 'react-native-feather';

type Step3ScheduleProps = {
  formData: ProgramFormData;
  updateFormData: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
};

const Step3Schedule = ({ formData, updateFormData }: Step3ScheduleProps) => {
  const { t } = useLanguage();

  // Days options (0-7)
  const daysOptions = [0, 1, 2, 3, 4, 5, 6, 7];

  // Handle day selection
  const handleDaySelection = (days: number) => {
    updateFormData({ sessions_per_week: days });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        {t('training_days_question')}
      </Text>
      
      {/* Days gauge selector */}
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeTrack}>
          <View 
            style={[
              styles.gaugeFill, 
              { width: `${(formData.sessions_per_week / 7) * 100}%` }
            ]} 
          />
        </View>
        
        <View style={styles.markersContainer}>
          {daysOptions.map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => handleDaySelection(day)}
              style={[
                styles.marker,
                formData.sessions_per_week === day && styles.markerActive
              ]}
            >
              <Text style={[
                styles.markerValue,
                formData.sessions_per_week === day && styles.markerValueActive
              ]}>
                {day}
              </Text>
              <Text style={styles.markerLabel}>
                {day === 0 ? t('days_none') : 
                 day === 1 ? t('days_singular') : 
                 t('days_plural')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Show selected value */}
      <View style={styles.selectionDisplay}>
        <Text style={styles.selectionLabel}>
          {t('selected_training_days')}:
        </Text>
        <Text style={styles.selectionValue}>
          {formData.sessions_per_week} {formData.sessions_per_week === 1 ? 
            t('day_per_week') : t('days_per_week')}
        </Text>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoIcon}>
          <Calendar width={24} height={24} color="#9333ea" />
        </View>
        <Text style={styles.infoText}>
          {t('training_frequency_info')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
  },
  gaugeContainer: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  gaugeTrack: {
    width: '100%',
    height: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: '#9333ea',
    borderRadius: 6,
  },
  markersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerActive: {
    transform: [{ scale: 1.1 }],
  },
  markerValue: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#374151',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  markerValueActive: {
    backgroundColor: '#9333ea',
  },
  markerLabel: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  selectionDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  selectionLabel: {
    color: '#D1D5DB',
    fontSize: 16,
    marginRight: 8,
  },
  selectionValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(126, 34, 206, 0.1)', // purple-700 with opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#D1D5DB',
  }
});

export default Step3Schedule;