// components/wizard/steps/Step7Registration.tsx - Enhanced with keyboard avoidance and error preservation
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

type RegistrationDataType = {
  username: string;
  email: string;
  password: string;
};

interface Step7RegistrationProps {
  onComplete: (data: { userData: RegistrationDataType, responses: any }) => void;
  personalityType: string;
  // Enhanced: Accept initial form data and error for preservation
  initialFormData?: Partial<RegistrationDataType>;
  initialError?: string;
}

const { height: screenHeight } = Dimensions.get('window');

const Step7Registration: React.FC<Step7RegistrationProps> = ({ 
  onComplete, 
  personalityType,
  initialFormData = {},
  initialError = ''
}) => {
  const { t } = useLanguage();
  
  // Preserve form data from props (important for error recovery)
  const [formData, setFormData] = useState({
    username: initialFormData.username || '',
    email: initialFormData.email || '',
    password: initialFormData.password || '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState(initialError);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [fieldAnimations] = useState(() => ({
    username: new Animated.Value(1),
    email: new Animated.Value(1),
    password: new Animated.Value(1),
    confirmPassword: new Animated.Value(1)
  }));
  
  // Refs for inputs and scroll view
  const scrollViewRef = useRef<ScrollView>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  
  // Animation when component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  }, []);
  
  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to focused input after keyboard appears
        setTimeout(() => {
          scrollToFocusedInput();
        }, 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [focusedInput]);
  
  // Scroll to focused input to ensure it's visible above keyboard
  const scrollToFocusedInput = () => {
    if (!scrollViewRef.current || !focusedInput) return;
    
    let inputRef: React.RefObject<TextInput>;
    let inputIndex = 0;
    
    switch (focusedInput) {
      case 'username':
        inputRef = usernameRef;
        inputIndex = 0;
        break;
      case 'email':
        inputRef = emailRef;
        inputIndex = 1;
        break;
      case 'password':
        inputRef = passwordRef;
        inputIndex = 2;
        break;
      case 'confirmPassword':
        inputRef = confirmPasswordRef;
        inputIndex = 3;
        break;
      default:
        return;
    }
    
    // Calculate scroll position to show input above keyboard
    const inputHeight = 60; // Approximate height of each input group
    const headerHeight = 120; // Title and subtitle height
    const scrollOffset = headerHeight + (inputIndex * inputHeight) + 40; // Extra padding
    
    scrollViewRef.current.scrollTo({
      y: Math.max(0, scrollOffset - (screenHeight - keyboardHeight - 200)),
      animated: true
    });
  };
  
  // Animate field on error
  const animateFieldError = (fieldName: keyof typeof fieldAnimations) => {
    Animated.sequence([
      Animated.timing(fieldAnimations[fieldName], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(fieldAnimations[fieldName], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };
  
  const handleInputFocus = (fieldName: string) => {
    setFocusedInput(fieldName);
    // Scroll to input after a brief delay to ensure keyboard is showing
    setTimeout(() => {
      scrollToFocusedInput();
    }, 300);
  };
  
  const handleInputBlur = () => {
    setFocusedInput(null);
  };
  
  // Navigate to next input
  const focusNextInput = (currentField: string) => {
    switch (currentField) {
      case 'username':
        emailRef.current?.focus();
        break;
      case 'email':
        passwordRef.current?.focus();
        break;
      case 'password':
        confirmPasswordRef.current?.focus();
        break;
      case 'confirmPassword':
        handleSubmit();
        break;
    }
  };
  
  const validateForm = (): string | null => {
    // Username validation
    if (!formData.username.trim()) {
      animateFieldError('username');
      return t('username_required') || 'Username is required';
    }
    
    if (formData.username.length < 3) {
      animateFieldError('username');
      return t('username_too_short') || 'Username must be at least 3 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      animateFieldError('email');
      return t('email_required') || 'Email is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      animateFieldError('email');
      return t('email_invalid') || 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      animateFieldError('password');
      return t('password_required') || 'Password is required';
    }
    
    if (formData.password.length < 6) {
      animateFieldError('password');
      return t('password_too_short') || 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      animateFieldError('confirmPassword');
      return t('passwords_do_not_match') || 'Passwords do not match';
    }
    
    return null;
  };
  
  const handleSubmit = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    // Store user responses for this step
    const responses = {
      form_data: {
        username: formData.username,
        email: formData.email,
        password_length: formData.password.length,
        has_special_chars: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
        has_numbers: /\d/.test(formData.password),
        has_uppercase: /[A-Z]/.test(formData.password)
      },
      personality_type: personalityType,
      validation_attempts: error ? 1 : 0,
      completion_timestamp: new Date().toISOString()
    };
    
    try {
      // Simulate a brief delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Pass data to parent component with enhanced error handling
      onComplete({
        userData: {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password
        },
        responses
      });
      
    } catch (err: any) {
      console.error('Registration submission error:', err);
      setError(t('registration_failed') || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  // Show success feedback for personality type
  const getPersonalityColor = () => {
    switch (personalityType) {
      case 'optimizer': return '#3B82F6';
      case 'diplomate': return '#EC4899';
      case 'mentor': return '#10B981';
      case 'versatile': return '#F59E0B';
      default: return '#3B82F6';
    }
  };
  
  const getPersonalityIcon = () => {
    switch (personalityType) {
      case 'optimizer': return 'trending-up';
      case 'diplomate': return 'heart';
      case 'mentor': return 'people';
      case 'versatile': return 'sparkles';
      default: return 'person';
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Animated.View 
            style={[
              styles.content,
              { opacity: fadeAnim }
            ]}
          >
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>{t('create_your_account')}</Text>
              <Text style={styles.subtitle}>{t('complete_registration')}</Text>
              
              {/* Enhanced error display */}
              {error ? (
                <Animated.View 
                  style={[
                    styles.errorContainer,
                    {
                      transform: [
                        {
                          scale: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}
              
              <View style={styles.form}>
                {/* Username Input */}
                <Animated.View 
                  style={[
                    styles.inputGroup,
                    { transform: [{ scale: fieldAnimations.username }] }
                  ]}
                >
                  <View style={[
                    styles.inputContainer,
                    focusedInput === 'username' && styles.focusedInput,
                    error && error.toLowerCase().includes('username') && styles.errorInput
                  ]}>
                    <View style={styles.inputIcon}>
                      <Ionicons 
                        name="person-outline" 
                        size={18} 
                        color={focusedInput === 'username' ? '#3B82F6' : '#6B7280'} 
                      />
                    </View>
                    <TextInput
                      ref={usernameRef}
                      style={styles.input}
                      placeholder={t('username')}
                      placeholderTextColor="#6B7280"
                      value={formData.username}
                      onChangeText={(text) => handleInputChange('username', text)}
                      onFocus={() => handleInputFocus('username')}
                      onBlur={handleInputBlur}
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => focusNextInput('username')}
                      editable={!isSubmitting}
                      blurOnSubmit={false}
                    />
                    {formData.username.length > 0 && (
                      <View style={styles.validationIcon}>
                        <Ionicons 
                          name={formData.username.length >= 3 ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={formData.username.length >= 3 ? "#10B981" : "#EF4444"} 
                        />
                      </View>
                    )}
                  </View>
                </Animated.View>
                
                {/* Email Input */}
                <Animated.View 
                  style={[
                    styles.inputGroup,
                    { transform: [{ scale: fieldAnimations.email }] }
                  ]}
                >
                  <View style={[
                    styles.inputContainer,
                    focusedInput === 'email' && styles.focusedInput,
                    error && error.toLowerCase().includes('email') && styles.errorInput
                  ]}>
                    <View style={styles.inputIcon}>
                      <Ionicons 
                        name="mail-outline" 
                        size={18} 
                        color={focusedInput === 'email' ? '#3B82F6' : '#6B7280'} 
                      />
                    </View>
                    <TextInput
                      ref={emailRef}
                      style={styles.input}
                      placeholder={t('email')}
                      placeholderTextColor="#6B7280"
                      value={formData.email}
                      onChangeText={(text) => handleInputChange('email', text)}
                      onFocus={() => handleInputFocus('email')}
                      onBlur={handleInputBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => focusNextInput('email')}
                      editable={!isSubmitting}
                      blurOnSubmit={false}
                    />
                    {formData.email.length > 0 && (
                      <View style={styles.validationIcon}>
                        <Ionicons 
                          name={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? "#10B981" : "#EF4444"} 
                        />
                      </View>
                    )}
                  </View>
                </Animated.View>
                
                {/* Password Input */}
                <Animated.View 
                  style={[
                    styles.inputGroup,
                    { transform: [{ scale: fieldAnimations.password }] }
                  ]}
                >
                  <View style={[
                    styles.inputContainer,
                    focusedInput === 'password' && styles.focusedInput,
                    error && error.toLowerCase().includes('password') && !error.toLowerCase().includes('match') && styles.errorInput
                  ]}>
                    <View style={styles.inputIcon}>
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={18} 
                        color={focusedInput === 'password' ? '#3B82F6' : '#6B7280'} 
                      />
                    </View>
                    <TextInput
                      ref={passwordRef}
                      style={styles.input}
                      placeholder={t('password')}
                      placeholderTextColor="#6B7280"
                      value={formData.password}
                      onChangeText={(text) => handleInputChange('password', text)}
                      onFocus={() => handleInputFocus('password')}
                      onBlur={handleInputBlur}
                      secureTextEntry
                      returnKeyType="next"
                      onSubmitEditing={() => focusNextInput('password')}
                      editable={!isSubmitting}
                      blurOnSubmit={false}
                    />
                    {formData.password.length > 0 && (
                      <View style={styles.validationIcon}>
                        <Ionicons 
                          name={formData.password.length >= 6 ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={formData.password.length >= 6 ? "#10B981" : "#EF4444"} 
                        />
                      </View>
                    )}
                  </View>
                  
                  {/* Password strength indicator */}
                  {formData.password.length > 0 && (
                    <View style={styles.passwordStrength}>
                      <View style={styles.strengthIndicators}>
                        <View style={[
                          styles.strengthDot,
                          formData.password.length >= 6 && styles.strengthDotActive
                        ]} />
                        <View style={[
                          styles.strengthDot,
                          /[A-Z]/.test(formData.password) && styles.strengthDotActive
                        ]} />
                        <View style={[
                          styles.strengthDot,
                          /\d/.test(formData.password) && styles.strengthDotActive
                        ]} />
                        <View style={[
                          styles.strengthDot,
                          /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) && styles.strengthDotActive
                        ]} />
                      </View>
                      <Text style={styles.strengthText}>
                        {t('password_strength_hint') || '6+ chars, uppercase, number, special char'}
                      </Text>
                    </View>
                  )}
                </Animated.View>
                
                {/* Confirm Password Input */}
                <Animated.View 
                  style={[
                    styles.inputGroup,
                    { transform: [{ scale: fieldAnimations.confirmPassword }] }
                  ]}
                >
                  <View style={[
                    styles.inputContainer,
                    focusedInput === 'confirmPassword' && styles.focusedInput,
                    error && error.toLowerCase().includes('match') && styles.errorInput
                  ]}>
                    <View style={styles.inputIcon}>
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={18} 
                        color={focusedInput === 'confirmPassword' ? '#3B82F6' : '#6B7280'} 
                      />
                    </View>
                    <TextInput
                      ref={confirmPasswordRef}
                      style={styles.input}
                      placeholder={t('confirm_password')}
                      placeholderTextColor="#6B7280"
                      value={formData.confirmPassword}
                      onChangeText={(text) => handleInputChange('confirmPassword', text)}
                      onFocus={() => handleInputFocus('confirmPassword')}
                      onBlur={handleInputBlur}
                      secureTextEntry
                      returnKeyType="done"
                      onSubmitEditing={() => focusNextInput('confirmPassword')}
                      editable={!isSubmitting}
                    />
                    {formData.confirmPassword.length > 0 && (
                      <View style={styles.validationIcon}>
                        <Ionicons 
                          name={formData.password === formData.confirmPassword ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={formData.password === formData.confirmPassword ? "#10B981" : "#EF4444"} 
                        />
                      </View>
                    )}
                  </View>
                </Animated.View>
                
                {/* Enhanced personality type info */}
                <View style={[
                  styles.personalityInfoContainer,
                  { borderColor: getPersonalityColor() + '40' }
                ]}>
                  <View style={[
                    styles.personalityIcon,
                    { backgroundColor: getPersonalityColor() + '20' }
                  ]}>
                    <Ionicons 
                      name={getPersonalityIcon() as any} 
                      size={16} 
                      color={getPersonalityColor()} 
                    />
                  </View>
                  <Text style={styles.personalityInfoText}>
                    {t('personality_will_be_saved', { type: t(`the_${personalityType}`) })}
                  </Text>
                </View>
              </View>
              
              {/* Extra spacing for keyboard */}
              <View style={{ height: keyboardHeight > 0 ? 100 : 20 }} />
            </ScrollView>
            
            {/* Register button - fixed at bottom */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  { backgroundColor: getPersonalityColor() },
                  isSubmitting && styles.registerButtonDisabled
                ]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <Animated.View 
                      style={[
                        styles.loadingSpinner,
                        {
                          transform: [{
                            rotate: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg']
                            })
                          }]
                        }
                      ]}
                    />
                    <Text style={styles.registerButtonText}>
                      {t('creating_account') || 'Creating Account...'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.registerButtonText}>
                      {t('create_account_button')}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingHorizontal: 0,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 8,
    flex: 1,
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
  errorInput: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  validationIcon: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordStrength: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  strengthIndicators: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  strengthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    marginRight: 4,
  },
  strengthDotActive: {
    backgroundColor: '#10B981',
  },
  strengthText: {
    fontSize: 12,
    color: '#6B7280',
  },
  personalityInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  personalityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personalityInfoText: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 0,
    paddingBottom: 20,
    paddingTop: 10,
  },
  registerButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
    marginRight: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  }
});

export default Step7Registration;