// app/(auth)/login.tsx - Version ultra-interactive pour iOS
import React, { useState } from 'react';
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
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Get auth but don't depend on its loading state for UI interactions
  const { login } = useAuth();

  console.log('🖥️ LoginScreen render - LocalLoading:', localLoading);

  const handleInputChange = (field: string, value: string) => {
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

    // Prevent multiple submissions with local state only
    if (localLoading) {
      console.log('🔒 Already logging in locally');
      return;
    }

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setLocalError('Please enter both username and password');
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    // Use ONLY local loading state - never depends on AuthContext
    setLocalLoading(true);
    setLocalError(null);
    console.log('🔐 Starting login process...');

    try {
      const success = await login(formData.username.trim(), formData.password);
      console.log('📱 Login result:', success);
      
      if (success) {
        console.log('✅ Login successful, navigating...');
        // Immediate navigation - don't wait for auth state
        router.replace('/(app)/feed');
      } else {
        console.log('❌ Login failed');
        setLocalError('Invalid username or password');
        Alert.alert('Error', 'Invalid username or password');
      }
    } catch (err: any) {
      console.log('🚨 Login error:', err);
      const errorMsg = 'Login failed. Please try again.';
      setLocalError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      // Always reset local loading after delay
      setTimeout(() => {
        setLocalLoading(false);
        console.log('✅ Local loading reset');
      }, 500);
    }
  };

  const handleNavigateToRegister = () => {
    console.log('📍 Navigate to register pressed');
    if (localLoading) {
      console.log('🔒 Navigation blocked - local loading');
      return;
    }
    
    router.push('/(auth)/personality-wizard');
  };

  const isFormValid = formData.username.trim() && formData.password.trim();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // CRITICAL for iOS button interaction
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <HeaderLogoWithSVG width={160} height={60} />
        </View>
        
        {/* Form Container */}
        <View style={styles.formContainer}>
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
              placeholder="Username"
              placeholderTextColor="#9CA3AF"
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput(null)}
              editable={!localLoading} // Only depends on local loading
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
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              editable={!localLoading} // Only depends on local loading
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword} 
            activeOpacity={0.7}
            disabled={localLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Submit Button - ALWAYS INTERACTIVE unless local loading */}
          <TouchableOpacity
            style={[
              styles.button,
              (!isFormValid || localLoading) && { opacity: 0.6 }
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || localLoading}
            activeOpacity={0.8}
          >
            {localLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  Signing in...
                </Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Social Login Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          {/* Toggle Login/Register - ALWAYS INTERACTIVE */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={handleNavigateToRegister}
            activeOpacity={0.7}
            disabled={localLoading}
          >
            <Text style={[
              styles.toggleText,
              localLoading && { opacity: 0.6 }
            ]}>
              Don't have an account?
              <Text style={styles.toggleActionText}> Register</Text>
            </Text>
          </TouchableOpacity>

          {/* Debug Info */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Form Valid: {isFormValid ? 'Yes' : 'No'} | 
              Local Loading: {localLoading ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 dou</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Privacy</Text>
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