// app/(auth)/login.tsx - Minimal enhanced version with full biometric functionality
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
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import HeaderLogoWithSVG from '../../components/navigation/HeaderLogoWithSVG';
import { cleanupAuthState } from '../../utils/authUtils';
import { BiometricAuthService, BiometricCapabilities } from '../../services/biometricAuth';

export default function LoginScreen() {
  const { t, language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [languageToggleScale] = useState(new Animated.Value(1));
  
  // Prevent multiple operations
  const operationInProgress = useRef(false);
  const mountedRef = useRef(true);
  
  // Get auth but don't depend on its loading state for UI interactions
  const { login, isAuthenticated } = useAuth();

  // Initialize biometric capabilities and settings
  useEffect(() => {
    const initializeBiometrics = async () => {
      try {
        const capabilities = await BiometricAuthService.getBiometricCapabilities();
        setBiometricCapabilities(capabilities);
        
        if (capabilities.isAvailable) {
          const isBiometricEnabled = await BiometricAuthService.isBiometricEnabled();
          setBiometricEnabled(isBiometricEnabled);
          
          const isRememberEnabled = await BiometricAuthService.isRememberMeEnabled();
          setRememberMe(isRememberEnabled);
          
          // Auto-fill credentials if remember me is enabled
          if (isRememberEnabled) {
            const savedCredentials = await BiometricAuthService.getSavedCredentials();
            if (savedCredentials) {
              setFormData({
                username: savedCredentials.username,
                password: savedCredentials.password,
              });
            }
          }
          
          // Auto-authenticate with biometrics if enabled and we have credentials
          if (isBiometricEnabled && isRememberEnabled) {
            setTimeout(() => handleBiometricLogin(), 500); // Small delay for better UX
          }
        }
      } catch (error) {
        console.error('Error initializing biometrics:', error);
      }
    };

    initializeBiometrics();
  }, []);

  // Cleanup on mount
  useEffect(() => {
    cleanupAuthState();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle authenticated state
  useEffect(() => {
    if (isAuthenticated && !localLoading && !operationInProgress.current) {
      setTimeout(() => {
        if (mountedRef.current && !operationInProgress.current) {
          router.replace('/(app)/feed');
        }
      }, 100);
    }
  }, [isAuthenticated, localLoading]);

  const handleInputChange = (field: string, value: string) => {
    if (!mountedRef.current || operationInProgress.current) return;
    
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    if (localError) {
      setLocalError(null);
    }
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    if (!biometricCapabilities?.isAvailable || operationInProgress.current || !mountedRef.current) {
      return;
    }

    operationInProgress.current = true;
    setLocalLoading(true);
    setLocalError(null);

    try {
      const result = await BiometricAuthService.authenticateAndGetCredentials();
      
      if (!mountedRef.current) return;

      if (result.success && result.credentials) {
        const loginSuccess = await login(result.credentials.username, result.credentials.password);
        
        if (!loginSuccess) {
          const errorMsg = t('biometric_login_failed') || 'Biometric login failed. Please try manual login.';
          setLocalError(errorMsg);
        }
      } else if (result.error && !result.error.includes('cancel')) {
        setLocalError(result.error);
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      if (mountedRef.current) {
        const errorMsg = t('biometric_error') || 'Biometric authentication error';
        setLocalError(errorMsg);
      }
    } finally {
      setTimeout(() => {
        if (mountedRef.current) {
          setLocalLoading(false);
          operationInProgress.current = false;
        }
      }, 300);
    }
  };

  const handleSubmit = async () => {
    if (localLoading || operationInProgress.current || !mountedRef.current) {
      return;
    }

    if (!formData.username.trim() || !formData.password.trim()) {
      const errorMsg = t('login_validation_error') || 'Please enter both username and password';
      setLocalError(errorMsg);
      return;
    }

    operationInProgress.current = true;
    setLocalLoading(true);
    setLocalError(null);

    try {
      const success = await login(formData.username.trim(), formData.password);
      
      if (!mountedRef.current) return;
      
      if (success) {
        if (rememberMe) {
          await BiometricAuthService.saveCredentials(formData.username.trim(), formData.password);
          await BiometricAuthService.setRememberMeEnabled(true);
        }
      } else {
        const errorMsg = t('invalid_credentials') || 'Invalid username or password';
        setLocalError(errorMsg);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      
      const errorMsg = t('login_failed') || 'Login failed. Please try again.';
      setLocalError(errorMsg);
    } finally {
      setTimeout(() => {
        if (mountedRef.current) {
          setLocalLoading(false);
          operationInProgress.current = false;
        }
      }, 300);
    }
  };

  const handleRememberMeToggle = async () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);
    await BiometricAuthService.setRememberMeEnabled(newValue);
    
    if (!newValue) {
      await BiometricAuthService.deleteSavedCredentials();
      setBiometricEnabled(false);
      await BiometricAuthService.setBiometricEnabled(false);
    }
  };

  const handleBiometricToggle = async () => {
    if (!biometricEnabled && !rememberMe) {
      Alert.alert(
        t('enable_remember_me') || 'Enable Remember Me',
        t('biometric_requires_remember') || 'Biometric authentication requires "Remember Me" to be enabled first.',
        [{ text: t('ok') || 'OK' }]
      );
      return;
    }
    
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);
    await BiometricAuthService.setBiometricEnabled(newValue);
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isFormValid = formData.username.trim() && formData.password.trim();
  const isOperationBlocked = localLoading || operationInProgress.current;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.content}>
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
            <HeaderLogoWithSVG width={120} height={45} />
          </View>
        
        {/* Biometric Login - Prominent if available */}
        {biometricCapabilities?.isAvailable && biometricEnabled && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={isOperationBlocked}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={biometricCapabilities.supportedTypes.includes(1) ? "finger-print" : "scan"} 
              size={32} 
              color="#FFFFFF" 
            />
            <Text style={styles.biometricText}>
              {BiometricAuthService.getAuthenticationTypeName(biometricCapabilities.supportedTypes)}
            </Text>
          </TouchableOpacity>
        )}

        {/* Error Message */}
        {localError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{localError}</Text>
          </View>
        )}

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Username Field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('username') || 'Username'}
              placeholderTextColor="#6B7280"
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              autoCapitalize="none"
              editable={!isOperationBlocked}
              returnKeyType="next"
              textContentType="username"
              autoComplete="username"
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { paddingRight: 50 }]}
              placeholder={t('password') || 'Password'}
              placeholderTextColor="#6B7280"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry={!showPassword}
              editable={!isOperationBlocked}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              textContentType="password"
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isOperationBlocked}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>

          {/* Settings Row */}
          <View style={styles.settingsRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleRememberMeToggle}
              disabled={isOperationBlocked}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={rememberMe ? "checkbox" : "square-outline"} 
                size={20} 
                color={rememberMe ? "#3B82F6" : "#6B7280"} 
              />
              <Text style={styles.checkboxText}>
                {t('remember_me') || 'Remember me'}
              </Text>
            </TouchableOpacity>

            {biometricCapabilities?.isAvailable && (
              <TouchableOpacity
                style={styles.biometricToggle}
                onPress={handleBiometricToggle}
                disabled={isOperationBlocked || !rememberMe}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={biometricEnabled ? "finger-print" : "finger-print-outline"} 
                  size={20} 
                  color={biometricEnabled ? "#3B82F6" : "#6B7280"} 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              (!isFormValid || isOperationBlocked) && styles.loginButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isOperationBlocked}
            activeOpacity={0.8}
          >
            {localLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>
                {t('continue') || 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/personality-wizard')}
            disabled={isOperationBlocked}
            activeOpacity={0.7}
          >
            <Text style={styles.footerText}>
              {t('no_account') || "Don't have an account?"}{' '}
              <Text style={styles.footerLink}>
                {t('register') || 'Sign up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
        
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f19',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  languageToggleContainer: {
    position: 'absolute',
    top: 60,
    right: 32,
    zIndex: 10,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  },
  languageSliderRight: {
    left: 35,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 32,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  biometricText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  biometricToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});