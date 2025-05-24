// app/(auth)/login.tsx - Updated to work with fixed AuthContext
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import HeaderLogoWithSVG from '../../components/navigation/HeaderLogoWithSVG';

export default function LoginScreen() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const { login, isLoading, error } = useAuth();
  
  // Prevent multiple login attempts
  const loginAttemptRef = useRef(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Prevent multiple simultaneous login attempts
    if (isLoading || loginAttemptRef.current) {
      console.log('🔒 Login already in progress, ignoring...');
      return;
    }

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      Alert.alert(t('error') || 'Error', 'Please enter both username and password');
      return;
    }

    loginAttemptRef.current = true;
    console.log('🔐 Starting login process...');

    try {
      const success = await login(formData.username.trim(), formData.password);
      console.log('📱 Login result:', success);
      
      if (success) {
        console.log('✅ Login successful, navigating to feed...');
        // Navigate after a small delay to ensure state is updated
        setTimeout(() => {
          router.replace('/(app)/feed');
        }, 200);
      } else {
        console.log('❌ Login failed');
        Alert.alert(
          t('error') || 'Error', 
          error || t('invalid_credentials') || 'Invalid username or password'
        );
      }
    } catch (err: any) {
      console.log('🚨 Unexpected login error:', err);
      Alert.alert(
        t('error') || 'Error', 
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      // Reset with delay to prevent rapid state changes
      setTimeout(() => {
        loginAttemptRef.current = false;
      }, 500);
    }
  };

  const handleNavigateToRegister = () => {
    if (isLoading) {
      console.log('🔒 Navigation blocked - login in progress');
      return;
    }
    
    console.log('📍 Navigating to personality wizard...');
    router.push('/(auth)/personality-wizard');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <HeaderLogoWithSVG width={160} height={60} />
        </View>
        
        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Input Fields */}
          <View style={[
            styles.inputContainer, 
            focusedInput === 'username' && styles.inputContainerFocused
          ]}>
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={focusedInput === 'username' ? '#3B82F6' : '#9CA3AF'} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder={t('username') || 'Username'}
              placeholderTextColor="#9CA3AF"
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput(null)}
              editable={!isLoading}
            />
          </View>

          <View style={[
            styles.inputContainer,
            focusedInput === 'password' && styles.inputContainerFocused
          ]}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={focusedInput === 'password' ? '#3B82F6' : '#9CA3AF'} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder={t('password') || 'Password'}
              placeholderTextColor="#9CA3AF"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>{t('forgot_password') || 'Forgot Password?'}</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (isLoading || !formData.username.trim() || !formData.password.trim()) && {
                opacity: 0.6
              }
            ]}
            onPress={handleSubmit}
            disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  Signing in...
                </Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  {t('continue') || 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Social Login Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t('or_continue_with') || 'or continue with'}</Text>
            <View style={styles.divider} />
          </View>

          {/* Toggle Login/Register */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={handleNavigateToRegister}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Text style={styles.toggleText}>
              {t('dont_have_account') || "Don't have an account?"}
              <Text style={styles.toggleActionText}>
                {' ' + (t('register') || 'Register')}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 dou</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Updated styles with error container
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f19',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  formContainer: {
    marginHorizontal: 10,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    marginBottom: 16,
    height: 54,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderWidth: 1.5,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    paddingHorizontal: 6,
    height: '100%',
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
  },
  dividerText: {
    color: '#9CA3AF',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  toggleActionText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    marginTop: 8,
  },
  footerLink: {
    color: '#6B7280',
    fontSize: 12,
    marginHorizontal: 8,
  },
});