// app/(app)/log/components/LoadingState.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface LoadingStateProps {
  colors: any;
  t: (key: string) => string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ colors, t }) => {
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.text.primary }]}>{t('loading')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
    },
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
      marginBottom: 24,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });