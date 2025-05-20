// components/wizard/steps/Step7Registration.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

type RegistrationDataType = {
  username: string;
  email: string;
  password: string;
};

interface Step7RegistrationProps {
  onComplete: (data: { userData: RegistrationDataType }) => void;
  personalityType: string;
}

const Step7Registration: React.FC<Step7RegistrationProps> = ({ onComplete, personalityType }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Animation when component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  }, []);
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = () => {
    // Form validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }
    
    if (!formData.email) {
      setError(t('email_required'));
      return;
    }
    
    if (!formData.username) {
      setError(t('username_required'));
      return;
    }
    
    if (formData.password.length < 6) {
      setError(t('password_too_short'));
      return;
    }
    
    // Clear previous errors
    setError('');
    
    // Pass data to parent component
    onComplete({
      userData: {
        username: formData.username,
        email: formData.email,
        password: formData.password
      }
    });
  };
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Animated.View 
        style={[
          styles.container,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.title}>{t('create_your_account')}</Text>
        <Text style={styles.subtitle}>{t('complete_registration')}</Text>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        <View style={styles.form}>
          {/* Username Input */}
          <View style={styles.inputGroup}>
            <View style={[
              styles.inputContainer,
              focusedInput === 'username' && styles.focusedInput
            ]}>
              <View style={styles.inputIcon}>
                <Ionicons 
                  name="person-outline" 
                  size={18} 
                  color={focusedInput === 'username' ? '#3B82F6' : '#6B7280'} 
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('username')}
                placeholderTextColor="#6B7280"
                value={formData.username}
                onChangeText={(text) => handleInputChange('username', text)}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
              />
            </View>
          </View>
          
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={[
              styles.inputContainer,
              focusedInput === 'email' && styles.focusedInput
            ]}>
              <View style={styles.inputIcon}>
                <Ionicons 
                  name="mail-outline" 
                  size={18} 
                  color={focusedInput === 'email' ? '#3B82F6' : '#6B7280'} 
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('email')}
                placeholderTextColor="#6B7280"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={[
              styles.inputContainer,
              focusedInput === 'password' && styles.focusedInput
            ]}>
              <View style={styles.inputIcon}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={18} 
                  color={focusedInput === 'password' ? '#3B82F6' : '#6B7280'} 
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('password')}
                placeholderTextColor="#6B7280"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry
              />
            </View>
          </View>
          
          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <View style={[
              styles.inputContainer,
              focusedInput === 'confirmPassword' && styles.focusedInput
            ]}>
              <View style={styles.inputIcon}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={18} 
                  color={focusedInput === 'confirmPassword' ? '#3B82F6' : '#6B7280'} 
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('confirm_password')}
                placeholderTextColor="#6B7280"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                onFocus={() => setFocusedInput('confirmPassword')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry
              />
            </View>
          </View>
          
          {/* Personality type info */}
          <View style={styles.personalityInfoContainer}>
            <Ionicons name="sparkles" size={16} color="#3B82F6" />
            <Text style={styles.personalityInfoText}>
              {t('personality_will_be_saved', { type: t(`the_${personalityType}`) })}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>{t('create_account_button')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    height: 50,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  focusedInput: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderWidth: 1.5,
    transform: [{scale: 1.02}],
  },
  inputIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: 'white',
    paddingVertical: 10,
    paddingHorizontal: 8,
    height: '100%',
    fontSize: 16,
  },
  personalityInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  personalityInfoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  registerButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  }
});

export default Step7Registration;