import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { ProgramFormData } from '../ProgramWizard';
import { Calendar } from 'react-native-feather';

type Step3ScheduleProps = {
  formData: ProgramFormData;
  updateFormData: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
};

const Step3Schedule = ({ formData, updateFormData }: Step3ScheduleProps) => {
  const { t } = useLanguage();
  const { programPalette, palette } = useTheme();

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
      <Text style={[styles.title, { color: programPalette.text }]}>
        {t('training_days_question')}
      </Text>
      
      {/* Days gauge selector */}
      <View style={styles.gaugeContainer}>
        <View style={[styles.gaugeTrack, { backgroundColor: palette.input_background }]}>
          <View 
            style={[
              styles.gaugeFill, 
              { 
                width: `${(formData.sessions_per_week / 7) * 100}%`,
                backgroundColor: programPalette.highlight
              }
            ]} 
          />
        </View>
        
        <View style={styles.markersContainer}>
          {daysOptions.map((day) => {
            const isActive = formData.sessions_per_week === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => handleDaySelection(day)}
                style={[
                  styles.marker,
                  isActive && styles.markerActive
                ]}
              >
                <Text style={[
                  styles.markerValue,
                  { 
                    backgroundColor: isActive ? programPalette.highlight : palette.input_background,
                    color: isActive ? '#FFFFFF' : palette.text_secondary
                  }
                ]}>
                  {day}
                </Text>
                <Text style={[styles.markerLabel, { color: palette.text_tertiary }]}>
                  {day === 0 ? t('days_none') : 
                   day === 1 ? t('days_singular') : 
                   t('days_plural')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Show selected value */}
      <View style={styles.selectionDisplay}>
        <Text style={[styles.selectionLabel, { color: palette.text_secondary }]}>
          {t('selected_training_days')}:
        </Text>
        <Text style={[styles.selectionValue, { color: programPalette.text }]}>
          {formData.sessions_per_week} {formData.sessions_per_week === 1 ? 
            t('day_per_week') : t('days_per_week')}
        </Text>
      </View>
      
      <View style={[
        styles.infoContainer, 
        { 
          backgroundColor: palette.card_background,
          borderColor: palette.border
        }
      ]}>
        <View style={[
          styles.infoIcon,
          { backgroundColor: 'rgba(126, 34, 206, 0.1)' }
        ]}>
          <Calendar width={24} height={24} color={programPalette.highlight} />
        </View>
        <Text style={[styles.infoText, { color: palette.text_secondary }]}>
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
    borderRadius: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
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
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    lineHeight: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  markerLabel: {
    fontSize: 10,
  },
  selectionDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  selectionLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  selectionValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  }
});

export default Step3Schedule;