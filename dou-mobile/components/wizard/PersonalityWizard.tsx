// components/wizard/PersonalityWizard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { userService } from '../../api/services';
import { useAuth } from '../../hooks/useAuth';

// Import steps
import Step1GenderSelection from './steps/Step1GenderSelection';
import Step2FitnessType from './steps/Step2FitnessType';
import Step3MotivationCheck from './steps/Step3MotivationCheck';
import Step4ScenarioResponse from './steps/Step4ScenarioResponse';
import Step5ChatMiniGame from './steps/Step5ChatMiniGame';
import Step6IdentityReveal from './steps/Step6IdentityReveal';
import Step7Registration from './steps/Step7Registration';

// Get the window dimensions
const { width } = Dimensions.get('window');

type ScoreType = {
  optimizer: number;
  diplomate: number;
  mentor: number;
  versatile: number;
  [key: string]: number;
};

type UserProfileType = {
  gender: string | null;
  [key: string]: any;
};

type RegistrationDataType = {
  username: string;
  email: string;
  password: string;
};

interface PersonalityWizardProps {
  onComplete?: () => void;
}

const PersonalityWizard: React.FC<PersonalityWizardProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const { login } = useAuth();
  
  // Score tracking for personality determination
  const [scores, setScores] = useState<ScoreType>({
    optimizer: 0,
    diplomate: 0, 
    mentor: 0,
    versatile: 0
  });
  
  // Store scores for each individual step to allow going back
  const [stepScores, setStepScores] = useState<{[key: number]: ScoreType}>({
    1: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    2: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    3: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    4: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    5: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 }
  });
  
  // User profile data
  const [userProfile, setUserProfile] = useState<UserProfileType>({
    gender: null,
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [personalityResult, setPersonalityResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationDataType | null>(null);
  const [error, setError] = useState('');

  // Animation values
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  
  // Handle navigation to next step and update scores
  const handleStepComplete = useCallback((newScores: ScoreType & { gender?: string, userData?: RegistrationDataType }, stepNumber = currentStep) => {
    // Start transition animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      // Save scores for this step
      setStepScores(prev => ({
        ...prev,
        [stepNumber]: {
          optimizer: newScores.optimizer || 0,
          diplomate: newScores.diplomate || 0,
          mentor: newScores.mentor || 0,
          versatile: newScores.versatile || 0
        }
      }));
      
      // Update total scores by recalculating from all steps up to the current one
      const updatedTotalScores: ScoreType = {
        optimizer: 0,
        diplomate: 0,
        mentor: 0,
        versatile: 0
      };
      
      // Only include scores up to the next step
      for (let i = 1; i <= stepNumber; i++) {
        if (stepScores[i]) {
          updatedTotalScores.optimizer += stepScores[i].optimizer;
          updatedTotalScores.diplomate += stepScores[i].diplomate;
          updatedTotalScores.mentor += stepScores[i].mentor;
          updatedTotalScores.versatile += stepScores[i].versatile;
        }
      }
      
      // Add the new scores for the current step
      updatedTotalScores.optimizer += newScores.optimizer || 0;
      updatedTotalScores.diplomate += newScores.diplomate || 0;
      updatedTotalScores.mentor += newScores.mentor || 0;
      updatedTotalScores.versatile += newScores.versatile || 0;
      
      setScores(updatedTotalScores);
      
      // Update user profile if gender is provided
      if (newScores.gender) {
        setUserProfile(prev => ({
          ...prev,
          gender: newScores.gender
        }));
      }
      
      // For registration step, save user data
      if (newScores.userData) {
        setRegistrationData(newScores.userData);
      }
      
      // Move to next step
      setCurrentStep(prev => prev + 1);
      
      // Reset animation values and fade in the new content
      slideAnim.setValue(50);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    });
  }, [currentStep, stepScores, fadeAnim, slideAnim]);
  
  // Handle going back to previous step
  const handleGoBack = useCallback(() => {
    if (currentStep <= 1) {
      // If at first step, go back to login
      router.push('/login');
      return;
    }
    
    // Start transition animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      // Recalculate total scores by excluding the current step
      const updatedTotalScores: ScoreType = {
        optimizer: 0,
        diplomate: 0,
        mentor: 0,
        versatile: 0
      };
      
      // Only include scores up to the previous step
      for (let i = 1; i < currentStep - 1; i++) {
        if (stepScores[i]) {
          updatedTotalScores.optimizer += stepScores[i].optimizer;
          updatedTotalScores.diplomate += stepScores[i].diplomate;
          updatedTotalScores.mentor += stepScores[i].mentor;
          updatedTotalScores.versatile += stepScores[i].versatile;
        }
      }
      
      setScores(updatedTotalScores);
      
      // Move to previous step
      setCurrentStep(prev => prev - 1);
      
      // Reset animation values and fade in the new content
      slideAnim.setValue(-50);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    });
  }, [currentStep, stepScores, fadeAnim, slideAnim]);
  
  // Determine personality result when all personality assessment steps are completed
  useEffect(() => {
    if (currentStep === 6 && !personalityResult) {
      // Find the personality with the highest score
      // Add a bit of randomness to avoid always getting 'versatile'
      const randomFactor = 0.15; // 15% randomness factor
      
      const adjustedScores = {
        optimizer: scores.optimizer * (1 + (Math.random() * randomFactor - randomFactor/2)),
        diplomate: scores.diplomate * (1 + (Math.random() * randomFactor - randomFactor/2)),
        mentor: scores.mentor * (1 + (Math.random() * randomFactor - randomFactor/2)),
        versatile: scores.versatile * (0.95 + (Math.random() * randomFactor - randomFactor/2)) // Slightly reduce versatile's advantage
      };
      
      const result = Object.entries(adjustedScores).reduce((max, [type, score]) => 
        score > max.score ? { type, score } : max, 
        { type: '', score: -1 }
      );
      
      // Make sure we have a valid result
      const finalType = result.type || 'versatile';
      
      console.log("Final personality scores:", scores);
      console.log("Adjusted scores with randomness:", adjustedScores);
      console.log("Determined personality type:", finalType);
      
      setPersonalityResult(finalType);
    }
  }, [currentStep, scores, personalityResult]);

  // Handle registration completion
  // Update the handleRegistration function in PersonalityWizard.tsx

const handleRegistration = async () => {
  if (!registrationData) {
    setError(t('registration_error'));
    return;
  }
  
  setIsSubmitting(true);
  setError('');
  
  try {
    // Register user with personality type - using the correct method name 'register'
    await userService.register({
      username: registrationData.username,
      email: registrationData.email,
      password: registrationData.password,
      training_level: 'beginner',
      personality_type: personalityResult || 'versatile',
      language_preference: 'en', // Default language
      fitness_goals: '', // Empty initially
      bio: '' // Empty initially
    });
    
    // After successful registration, we should check if email verification is required
    // For now, we'll try to log in immediately
    const success = await login(registrationData.username, registrationData.password);
    
    if (success) {
      // If email verification is required, user may need to be redirected to verification page
      if (!success.email_verified) {
        router.replace('/verify-email-reminder');
      } else {
        // Navigate to feed if verification not required or already verified
        router.replace('/(app)/feed');
      }
    } else {
      throw new Error('Login failed after registration');
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    if (err.response?.data?.username) {
      setError(t('username_taken'));
    } else if (err.response?.data?.email) {
      setError(t('email_registered'));
    } else {
      setError(Object.values(err.response?.data || {}).flat().join('\n') || t('registration_failed'));
    }
    
    // Go back to registration form
    setCurrentStep(7);
    setIsSubmitting(false);
  }
};
  
  // When registration data is available and personality is determined, register
  useEffect(() => {
    if (registrationData && personalityResult && currentStep > 7) {
      handleRegistration();
    }
  }, [registrationData, personalityResult, currentStep]);
  
  // Render the appropriate step
  const renderStep = () => {
    // Pass initial data from previous selections when available
    const stepProps = {
      1: { 
        onComplete: handleStepComplete,
        initialData: userProfile
      },
      2: { 
        onComplete: handleStepComplete,
        initialScores: stepScores[2]
      },
      3: { 
        onComplete: handleStepComplete,
        initialScores: stepScores[3]
      },
      4: { 
        onComplete: handleStepComplete,
        initialScores: stepScores[4]
      },
      5: { 
        onComplete: handleStepComplete,
        initialScores: stepScores[5]
      },
      6: {
        personalityType: personalityResult || 'versatile',
        userProfile: userProfile,
        onComplete: handleStepComplete,
        isSubmitting: isSubmitting 
      },
      7: {
        onComplete: handleStepComplete,
        personalityType: personalityResult || 'versatile'
      }
    };
    
    switch(currentStep) {
      case 1:
        return <Step1GenderSelection {...stepProps[1]} />;
      case 2:
        return <Step2FitnessType {...stepProps[2]} />;
      case 3:
        return <Step3MotivationCheck {...stepProps[3]} />;
      case 4:
        return <Step4ScenarioResponse {...stepProps[4]} />;
      case 5:
        return <Step5ChatMiniGame {...stepProps[5]} />;
      case 6:
        return <Step6IdentityReveal {...stepProps[6]} />;
      case 7:
        return <Step7Registration {...stepProps[7]} />;
      default:
        return null;
    }
  };
  
  // Progress bar calculation
  const totalSteps = 7;
  const progressPercentage = ((currentStep - 1) / totalSteps) * 100;
  
  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <View style={[styles.bgElement, styles.bgElement1]} />
      <View style={[styles.bgElement, styles.bgElement2]} />
      <View style={[styles.bgElement, styles.bgElement3]} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>
          {t('create_account')}
        </Text>
        
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                {width: `${progressPercentage}%`}
              ]} 
            />
          </View>
          <View style={styles.stepIndicatorsContainer}>
            {Array.from({length: totalSteps}).map((_, index) => {
              const step = index + 1;
              return (
                <View 
                  key={step}
                  style={[
                    styles.stepIndicator,
                    currentStep > step 
                      ? styles.stepCompleted 
                      : currentStep === step
                        ? styles.stepCurrent
                        : styles.stepFuture
                  ]}
                >
                  {currentStep > step ? (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumber}>{step}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Step container */}
        <View style={styles.stepContainer}>
          {/* Back button */}
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          
          {/* Error message for registration errors */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          {/* Animated step content */}
          <Animated.View 
            style={[
              styles.stepContent,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {renderStep()}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f19',
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  stepIndicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: '#10B981',
  },
  stepCurrent: {
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  stepFuture: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    minHeight: 500,
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginTop: 36,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  bgElement: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.1,
  },
  bgElement1: {
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    backgroundColor: '#3B82F6',
  },
  bgElement2: {
    bottom: -50,
    left: -80,
    width: 180,
    height: 180,
    backgroundColor: '#6366F1',
  },
  bgElement3: {
    top: '40%',
    left: '30%',
    width: 150,
    height: 150,
    backgroundColor: '#8B5CF6',
    transform: [{translateX: -75}, {translateY: -75}],
  },
});

export default PersonalityWizard;