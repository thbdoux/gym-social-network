// app/(app)/log/components/ErrorState.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorStateProps {
  colors: any;
  t: (key: string) => string;
  onBack: () => void;
  error?: any; // Add error prop to handle different error types
}

export const ErrorState: React.FC<ErrorStateProps> = ({ colors, t, onBack, error }) => {
  const getErrorContent = () => {
    if (error?.name === 'UNAUTHORIZED') {
      return {
        icon: 'lock-closed-outline' as const,
        title: t('access_denied'),
        message: t('no_permission_to_view_log'),
        color: colors.secondary
      };
    } else if (error?.name === 'NOT_FOUND') {
      return {
        icon: 'document-outline' as const,
        title: t('log_not_found'),
        message: t('log_does_not_exist'),
        color: colors.danger
      };
    } else {
      return {
        icon: 'alert-circle-outline' as const,
        title: t('something_went_wrong'),
        message: t('unable_to_load_log'),
        color: colors.danger
      };
    }
  };

  const errorContent = getErrorContent();

  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <Ionicons name={errorContent.icon} size={60} color={errorContent.color} />
      <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
        {errorContent.title}
      </Text>
      <Text style={[styles.errorMessage, { color: colors.text.secondary }]}>
        {errorContent.message}
      </Text>
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: errorContent.color }]} 
        onPress={onBack}
      >
        <Text style={[styles.backButtonText, { color: 'white' }]}>
          {t('back_to_logs')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});