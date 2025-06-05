// app/(auth)/login.tsx - Improved version with better error handling
import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import HeaderLogoWithSVG from '../../components/navigation/HeaderLogoWithSVG';
import { cleanupAuthState } from '../../utils/authUtils';

export default function LoginScreen() {
  const { t, language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [languageToggleScale] = useState(new Animated.Value(1));
  
  // Prevent multiple operations
  const operationInProgress = useRef(false);
  const mountedRef = useRef(true);
  
  // Get auth but don't depend on its loading state for UI interactions
  const { login, isAuthenticated } = useAuth();

  console.log('🖥️ LoginScreen render - LocalLoading:', localLoading, 'Auth:', isAuthenticated);

  // Cleanup on mount
  useEffect(() => {
    console.log('🚀 LoginScreen mounted - cleaning up auth state');
    cleanupAuthState();
    
    return () => {
      mountedRef.current = false;
      console.log('🔚 LoginScreen unmounting');
    };
  }, []);

  // Handle authenticated state - but with guard to prevent loops
  useEffect(() => {
    if (isAuthenticated && !localLoading && !operationInProgress.current) {
      console.log('✅ User is authenticated, redirecting to feed');
      // Small delay to ensure state is stable
      setTimeout(() => {
        if (mountedRef.current && !operationInProgress.current) {
          router.replace('/(app)/feed');
        }
      }, 100);
    }
  }, [isAuthenticated, localLoading]);

  const handleInputChange = (field: string, value: string) => {
    if (!mountedRef.current || operationInProgress.current) return;
    
    console.log('📝 Input change:', field, value.length);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user types
    if (localError) {
      setLocalError(null);
    }
  };

  const handleSubmit = async () => {
    console.log('🔐 Login button pressed');

    // Prevent multiple submissions
    if (localLoading || operationInProgress.current || !mountedRef.current) {
      console.log('🔒 Login blocked - operation in progress or component unmounted');
      return;
    }

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      const errorMsg = t('login_validation_error') || 'Please enter both username and password';
      setLocalError(errorMsg);
      Alert.alert(t('error') || 'Error', errorMsg);
      return;
    }

    // Set operation lock
    operationInProgress.current = true;
    setLocalLoading(true);
    setLocalError(null);
    console.log('🔐 Starting login process...');

    try {
      const success = await login(formData.username.trim(), formData.password);
      console.log('📱 Login result:', success);
      
      if (!mountedRef.current) {
        console.log('⚠️ Component unmounted during login');
        return;
      }
      
      if (success) {
        console.log('✅ Login successful, will redirect via useEffect');
        // Don't navigate here - let the useEffect handle it
      } else {
        console.log('❌ Login failed');
        const errorMsg = t('invalid_credentials') || 'Invalid username or password';
        setLocalError(errorMsg);
        Alert.alert(t('error') || 'Error', errorMsg);
      }
    } catch (err: any) {
      console.log('🚨 Login error:', err);
      
      if (!mountedRef.current) return;
      
      const errorMsg = t('login_failed') || 'Login failed. Please try again.';
      setLocalError(errorMsg);
      Alert.alert(t('error') || 'Error', errorMsg);
    } finally {
      // Reset states with delay to prevent rapid state changes
      setTimeout(() => {
        if (mountedRef.current) {
          setLocalLoading(false);
          operationInProgress.current = false;
          console.log('✅ Login operation completed');
        }
      }, 500);
    }
  };

  const handleNavigateToRegister = () => {
    console.log('📍 Navigate to register pressed');
    if (localLoading || operationInProgress.current || !mountedRef.current) {
      console.log('🔒 Navigation blocked - operation in progress');
      return;
    }
    
    router.push('/(auth)/personality-wizard');
  };

  const handleLanguageToggle = () => {
    if (localLoading || operationInProgress.current) return;
    
    // Animate the toggle
    Animated.sequence([
      Animated.timing(languageToggleScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(languageToggleScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle between English and French
    const newLanguage = language === 'en' ? 'fr' : 'en';
    setLanguage(newLanguage);
  };

  const isFormValid = formData.username.trim() && formData.password.trim();
  const isOperationBlocked = localLoading || operationInProgress.current;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Language Toggle */}
        <View style={styles.languageToggleContainer}>
          <Animated.View style={{ transform: [{ scale: languageToggleScale }] }}>
            <TouchableOpacity
              style={[
                styles.languageToggle,
                isOperationBlocked && { opacity: 0.6 }
              ]}
              onPress={handleLanguageToggle}
              activeOpacity={0.8}
              disabled={isOperationBlocked}
            >
              <View style={styles.languageOption}>
                <Text style={[
                  styles.languageText,
                  language === 'en' && styles.activeLanguageText
                ]}>EN</Text>
              </View>
              <View style={[
                styles.languageSlider,
                language === 'fr' && styles.languageSliderRight
              ]} />
              <View style={styles.languageOption}>
                <Text style={[
                  styles.languageText,
                  language === 'fr' && styles.activeLanguageText
                ]}>FR</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <HeaderLogoWithSVG width={160} height={60} />
        </View>
        
        {/* Form Container */}
        <View style={[
          styles.formContainer,
          isOperationBlocked && { opacity: 0.8 }
        ]}>
          {/* Local Error Message */}
          {localError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{localError}</Text>
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
              editable={!isOperationBlocked}
              returnKeyType="next"
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
              editable={!isOperationBlocked}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword} 
            activeOpacity={0.7}
            disabled={isOperationBlocked}
          >
            <Text style={[
              styles.forgotPasswordText,
              isOperationBlocked && { opacity: 0.6 }
            ]}>
              {t('forgot_password') || 'Forgot Password?'}
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (!isFormValid || isOperationBlocked) && { opacity: 0.6 }
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isOperationBlocked}
            activeOpacity={0.8}
          >
            {localLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  {t('signing_in') || 'Signing in...'}
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
            <Text style={styles.dividerText}>
              {t('or_continue_with') || 'or continue with'}
            </Text>
            <View style={styles.divider} />
          </View>

          {/* Toggle Login/Register */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={handleNavigateToRegister}
            activeOpacity={0.7}
            disabled={isOperationBlocked}
          >
            <Text style={[
              styles.toggleText,
              isOperationBlocked && { opacity: 0.6 }
            ]}>
              {t('no_account') || "Don't have an account?"}
              <Text style={styles.toggleActionText}>
                {' ' + (t('register') || 'Register')}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Debug Info */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Form Valid: {isFormValid ? 'Yes' : 'No'} | 
              Local Loading: {localLoading ? 'Yes' : 'No'} |
              Auth: {isAuthenticated ? 'Yes' : 'No'} |
              Operation: {operationInProgress.current ? 'Locked' : 'Free'} |
              Language: {language.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 dou</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity activeOpacity={0.7} disabled={isOperationBlocked}>
              <Text style={[
                styles.footerLink,
                isOperationBlocked && { opacity: 0.6 }
              ]}>
                {t('terms') || 'Terms'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} disabled={isOperationBlocked}>
              <Text style={[
                styles.footerLink,
                isOperationBlocked && { opacity: 0.6 }
              ]}>
                {t('privacy') || 'Privacy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  languageToggleContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    padding: 3,
    alignItems: 'center',
    position: 'relative',
    width: 70,
    height: 32,
  },
  languageOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeLanguageText: {
    color: '#FFFFFF',
  },
  languageSlider: {
    position: 'absolute',
    left: 3,
    top: 3,
    bottom: 3,
    width: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    zIndex: 1,
    transition: 'left 0.2s ease',
  },
  languageSliderRight: {
    left: 35,
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
  debugContainer: {
    marginTop: 20,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
  },
  debugText: {
    color: '#6B7280',
    fontSize: 10,
    textAlign: 'center',
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