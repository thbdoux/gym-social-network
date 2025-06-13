// components/friends/EmptyState.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function EmptyState({ icon, message, action }: EmptyStateProps) {
  const { palette } = useTheme();

  return (
    <View style={styles.container}>
      {icon}
      <Text style={[styles.message, { color: `${palette.text}80` }]}>{message}</Text>
      {action && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: palette.highlight }]}
          onPress={action.onPress}
        >
          <Text style={[styles.actionText, { color: palette.text }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  message: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionText: {
    fontWeight: '500',
  },
});