// app/(app)/group-workout/InfoSection.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

interface InfoSectionProps {
  groupWorkout: any;
  colors: any;
}

const InfoSection: React.FC<InfoSectionProps> = ({ groupWorkout, colors }) => {
  const { t } = useLanguage();
  
  // Format date
  const formatDate = (date: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  return (
    <View style={[styles.infoSection, { backgroundColor: 'rgba(31, 41, 55, 0.7)' }]}>
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={20} color={colors.text.primary} />
        <Text style={[styles.infoText, { color: colors.text.primary }]}>
          {formatDate(groupWorkout.scheduled_time)}
        </Text>
      </View>
      
      {groupWorkout.gym_details && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color={colors.text.primary} />
          <Text style={[styles.infoText, { color: colors.text.primary }]}>
            {groupWorkout.gym_details.name} - {groupWorkout.gym_details.location}
          </Text>
        </View>
      )}
      
      <View style={styles.infoRow}>
        <Ionicons name="people-outline" size={20} color={colors.text.primary} />
        <Text style={[styles.infoText, { color: colors.text.primary }]}>
          {t('participants')}: {groupWorkout.participants_count}
          {groupWorkout.max_participants > 0 ? '/' + groupWorkout.max_participants : ''}
        </Text>
      </View>
      
      {groupWorkout.description && (
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionLabel, { color: colors.text.secondary }]}>
            {t('description')}
          </Text>
          <Text style={[styles.descriptionText, { color: colors.text.primary }]}>
            {groupWorkout.description}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    margin: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 10,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  }
});

export default InfoSection;