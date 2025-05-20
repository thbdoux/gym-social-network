// app/(auth)/verify-email-reminder.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

export default function VerifyEmailReminderScreen() {
  const { t } = useLanguage();
  const { user, logout, resendVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    try {
      const success = await resendVerification(user.email);
      if (success) {
        Alert.alert(
          t('email_sent'),
          t('verification_email_resent')
        );
      } else {
        Alert.alert(
          t('error'),
          t('verification_email_error')
        );
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      Alert.alert(
        t('error'),
        t('verification_email_error')
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-unread-outline" size={60} color="#3B82F6" />
      </View>
      
      <Text style={styles.title}>{t('verify_your_email')}</Text>
      
      <Text style={styles.description}>
        {t('verification_email_sent_to')} <Text style={styles.email}>{user?.email}</Text>
      </Text>
      
      <Text style={styles.instruction}>
        {t('verification_instructions')}
      </Text>
      
      <TouchableOpacity 
        style={styles.resendButton}
        onPress={handleResendVerification}
        disabled={isResending}
      >
        {isResending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.resendButtonText}>{t('resend_verification_email')}</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={18} color="#9CA3AF" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f19',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  email: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  instruction: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  resendButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});