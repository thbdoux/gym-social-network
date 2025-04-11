// components/workouts/EmptyStateView.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

interface EmptyStateViewProps {
  currentView: string;
}

const EmptyStateView: React.FC<EmptyStateViewProps> = ({ currentView }) => {
  const { t } = useLanguage();

  // Get icon based on view type
  const getIcon = () => {
    switch (currentView) {
      case 'programs':
        return "barbell-outline";
      case 'workout_history':
        return "calendar-outline";
      case 'templates':
        return "document-text-outline";
      default:
        return "document-text-outline";
    }
  };

  // Get title based on view type
  const getTitle = () => {
    switch (currentView) {
      case 'programs':
        return t('no_programs');
      case 'workout_history':
        return t('no_workouts');
      case 'templates':
        return t('no_templates');
      default:
        return t('no_data');
    }
  };

  // Get message based on view type
  const getMessage = () => {
    switch (currentView) {
      case 'programs':
        return t('create_your_first_program');
      case 'workout_history':
        return t('log_your_first_workout');
      case 'templates':
        return t('create_your_first_template');
      default:
        return t('add_some_data');
    }
  };

  return (
    <View style={styles.emptyState}>
      <Ionicons name={getIcon()} size={60} color="#4B5563" />
      <Text style={styles.emptyStateTitle}>{getTitle()}</Text>
      <Text style={styles.emptyStateText}>{getMessage()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default EmptyStateView;