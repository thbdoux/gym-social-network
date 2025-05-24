// app/(auth)/login.tsx
import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  // const { login, googleLogin } = useAuth();
  
  // TEMPORARILY COMMENTED OUT - TODO: Re-enable email verification
  // const { login, resendVerification } = useAuth();
  const { login } = useAuth();
  
  // Track focused input for animation
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const success = await login(formData.username, formData.password);
      if (success) {
        // Navigate to feed page with proper group path
        setTimeout(() => {
          router.replace('/(app)/feed');
        }, 100);
      } else {
        Alert.alert(t('error'), t('invalid_credentials'));
      }
    } catch (err) {
      Alert.alert(t('error'), `${t('error')} ${t('login')}`);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to personality wizard when register is clicked
  const handleNavigateToRegister = () => {
    router.push('/personality-wizard');
  };
  
  // Google login
  // const handleGoogleLogin = async () => {
  //   setSocialLoading('google');
  //   try {
  //     const success = await googleLogin();
  //     if (!success) {
  //       Alert.alert(t('error'), t('google_login_failed'));
  //     }
  //   } catch (err) {
  //     Alert.alert(t('error'), `${t('error')} ${t('google_login')}`);
  //   } finally {
  //     setSocialLoading('');
  //   }
  // };

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
              placeholder={t('username')}
              placeholderTextColor="#9CA3AF"
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput(null)}
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
              placeholder={t('password')}
              placeholderTextColor="#9CA3AF"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>{t('forgot_password')}</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  {t('continue')}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Social Login Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t('or_continue_with')}</Text>
            <View style={styles.divider} />
          </View>
          
          {/* Social Login Button */}
          {/* <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              disabled={!!socialLoading}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                  <Text style={styles.socialButtonText}>{t('google')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View> */}

          {/* Toggle Login/Register */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={handleNavigateToRegister}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {t('dont_have_account')}
              <Text style={styles.toggleActionText}>
                {' ' + t('register')}
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

// Add these to existing styles
const styles = StyleSheet.create({
  // Existing styles...
  
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
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB4437', // Google red
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
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
    // Add transition effect
    transform: [{scale: 1}],
  },
  inputContainerFocused: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderWidth: 1.5,
    transform: [{scale: 1.02}],
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