// app/(auth)/verify-email.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import userService from '../../api/services/userService';

export default function VerifyEmailScreen() {
  const { t } = useLanguage();
  const { token, email } = useLocalSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setStatus('error');
        setMessage(t('invalid_verification_link'));
        return;
      }

      try {
        const response = await userService.verifyEmail(token as string, email as string);
        setStatus('success');
        setMessage(response.detail || t('email_verified_success'));
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.detail || t('email_verification_failed'));
      }
    };

    verifyEmail();
  }, [token, email, t]);

  const handleNavigateToLogin = () => {
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>{t('verifying_email')}</Text>
        </View>
      )}

      {status === 'success' && (
        <View style={styles.resultContainer}>
          <View style={[styles.iconContainer, styles.successContainer]}>
            <Ionicons name="checkmark" size={60} color="#34D399" />
          </View>
          <Text style={styles.resultTitle}>{t('email_verified')}</Text>
          <Text style={styles.resultMessage}>{message}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleNavigateToLogin}
          >
            <Text style={styles.buttonText}>{t('continue_to_login')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.resultContainer}>
          <View style={[styles.iconContainer, styles.errorContainer]}>
            <Ionicons name="close" size={60} color="#EF4444" />
          </View>
          <Text style={styles.resultTitle}>{t('verification_failed')}</Text>
          <Text style={styles.resultMessage}>{message}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleNavigateToLogin}
          >
            <Text style={styles.buttonText}>{t('back_to_login')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f19',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 20,
  },
  resultContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successContainer: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});