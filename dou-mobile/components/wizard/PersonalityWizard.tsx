// components/wizard/PersonalityWizard.tsx - Enhanced with error preservation
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

// Import simplified steps
import Step1GenderSelection from './steps/Step1GenderSelection';
import Step2FitnessType from './steps/Step2FitnessType';
import Step3MotivationCheck from './steps/Step3MotivationCheck';
import Step4ScenarioResponse from './steps/Step4ScenarioResponse';
import Step5ChatMiniGame from './steps/Step5ChatMiniGame';
import Step6IdentityReveal from './steps/Step6IdentityReveal';
import Step7Registration from './steps/Step7Registration';
import Step8FutureVision from './steps/Step8FutureVision';

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

// Enhanced response storage - storing the key data points requested
type UserResponsesType = {
  gender: string | null;
  top_activities: string[]; // Top 4 activities list
  future_vision: string | null; // 2 years wish
};

interface PersonalityWizardProps {
  onComplete?: () => void;
}

const PersonalityWizard: React.FC<PersonalityWizardProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const { login } = useAuth();
  
  // Simplified score tracking
  const [scores, setScores] = useState<ScoreType>({
    optimizer: 0,
    diplomate: 0, 
    mentor: 0,
    versatile: 0
  });
  
  // Enhanced response storage - only the essentials as requested
  const [userResponses, setUserResponses] = useState<UserResponsesType>({
    gender: null,
    top_activities: [],
    future_vision: null,
  });
  
  // Store scores for each step for back navigation
  const [stepScores, setStepScores] = useState<{[key: number]: ScoreType}>({
    1: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    2: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    3: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    4: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    5: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    8: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
  });
  
  const [userProfile, setUserProfile] = useState<UserProfileType>({
    gender: null,
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [personalityResult, setPersonalityResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationDataType | null>(null);
  
  // Enhanced error handling
  const [error, setError] = useState('');
  const [preservedFormData, setPreservedFormData] = useState<Partial<RegistrationDataType>>({});

  // Animation values
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  
  // Simplified personality calculation with better balancing
  const calculatePersonalityType = useCallback((currentScores: ScoreType): string => {
    console.log('🧮 Calculating personality with scores:', currentScores);
    
    // Apply diminishing returns to prevent single-step dominance
    const balancedScores = Object.keys(currentScores).reduce((acc, type) => {
      const rawScore = currentScores[type];
      // Diminishing returns formula: score = sqrt(rawScore + 1) * 10
      acc[type] = Math.sqrt(rawScore + 1) * 10;
      return acc;
    }, {} as ScoreType);
    
    console.log('📊 Balanced scores:', balancedScores);
    
    // Add randomness factor for close scores (within 10% of each other)
    const scores = Object.entries(balancedScores);
    const maxScore = Math.max(...scores.map(([_, score]) => score));
    const threshold = maxScore * 0.1;
    const closeScores = scores.filter(([_, score]) => maxScore - score <= threshold);
    
    if (closeScores.length > 1) {
      console.log('🎲 Close scores detected, adding randomness factor');
      closeScores.forEach(([type, score]) => {
        balancedScores[type] = score + (Math.random() * 2 - 1);
      });
    }
    
    // Find the highest score
    const result = Object.entries(balancedScores).reduce((max, [type, score]) => 
      score > max.score ? { type, score } : max, 
      { type: '', score: -1 }
    );
    
    const finalType = result.type || 'versatile';
    console.log('🎯 Final personality type:', finalType, 'with score:', result.score);
    
    return finalType;
  }, []);
  
  // Handle navigation to next step and update scores
  const handleStepComplete = useCallback((stepData: any, stepNumber = currentStep) => {
    console.log(`📝 Step ${stepNumber} completed with data:`, stepData);
    
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
      // Extract scores and responses from stepData
      const { responses, ...scoreData } = stepData;
      
      // Save step scores
      setStepScores(prev => ({
        ...prev,
        [stepNumber]: {
          optimizer: scoreData.optimizer || 0,
          diplomate: scoreData.diplomate || 0,
          mentor: scoreData.mentor || 0,
          versatile: scoreData.versatile || 0
        }
      }));
      
      // Save enhanced user responses based on step
      setUserResponses(prev => {
        const updated = { ...prev };
        
        if (stepNumber === 1 && stepData.gender) {
          updated.gender = stepData.gender;
        } else if (stepNumber === 2 && responses?.selected_activities) {
          updated.top_activities = responses.selected_activities;
        } else if (stepNumber === 8 && responses?.selected_vision) {
          updated.future_vision = responses.selected_vision;
        }
        
        return updated;
      });
      
      // Update total scores
      const updatedTotalScores: ScoreType = {
        optimizer: 0,
        diplomate: 0,
        mentor: 0,
        versatile: 0
      };
      
      // Include scores up to the current step
      for (let i = 1; i <= stepNumber; i++) {
        if (stepScores[i]) {
          Object.keys(updatedTotalScores).forEach(key => {
            updatedTotalScores[key] += stepScores[i][key];
          });
        }
      }
      
      // Add the new scores for the current step
      Object.keys(updatedTotalScores).forEach(key => {
        updatedTotalScores[key] += scoreData[key] || 0;
      });
      
      setScores(updatedTotalScores);
      
      // Update user profile if gender is provided
      if (stepData.gender) {
        setUserProfile(prev => ({
          ...prev,
          gender: stepData.gender
        }));
      }
      
      // For registration step, save user data and preserve it
      if (stepData.userData) {
        setRegistrationData(stepData.userData);
        setPreservedFormData(stepData.userData); // Preserve form data
      }
      
      // Move to next step (skip step 6 temporarily if going from step 5 to add step 8)
      let nextStep = stepNumber + 1;
      if (stepNumber === 5) {
        nextStep = 8; // Go to future vision before identity reveal
      } else if (stepNumber === 8) {
        nextStep = 6; // Go to identity reveal after future vision
      }
      
      setCurrentStep(nextStep);
      
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
      // Determine previous step (handle step 8 insertion)
      let prevStep = currentStep - 1;
      if (currentStep === 6) {
        prevStep = 8; // Come from future vision
      } else if (currentStep === 8) {
        prevStep = 5; // Come from chat mini game
      }
      
      // Recalculate total scores by excluding the current step
      const updatedTotalScores: ScoreType = {
        optimizer: 0,
        diplomate: 0,
        mentor: 0,
        versatile: 0
      };
      
      // Only include scores up to the previous step
      for (let i = 1; i < prevStep; i++) {
        if (stepScores[i]) {
          Object.keys(updatedTotalScores).forEach(key => {
            updatedTotalScores[key] += stepScores[i][key];
          });
        }
      }
      
      setScores(updatedTotalScores);
      setCurrentStep(prevStep);
      
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
  
  // Determine personality result when reaching step 6
  useEffect(() => {
    if (currentStep === 6 && !personalityResult) {
      const finalType = calculatePersonalityType(scores);
      setPersonalityResult(finalType);
      
      console.log("✅ Final personality determination complete");
      console.log("📊 Final scores:", scores);
      console.log("🎯 Personality type:", finalType);
      console.log("💾 User responses:", userResponses);
    }
  }, [currentStep, scores, personalityResult, calculatePersonalityType, userResponses]);

  // Enhanced registration with better error handling and form preservation
  const handleRegistration = async () => {
    if (!registrationData) {
      setError(t('registration_error'));
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Register user with personality type and enhanced responses
      await userService.register({
        username: registrationData.username,
        email: registrationData.email,
        password: registrationData.password,
        training_level: 'beginner',
        personality_type: personalityResult || 'versatile',
        language_preference: 'en',
        fitness_goals: '',
        bio: '',
        // Enhanced: Store the key personality assessment responses as requested
        personality_assessment_responses: {
          gender: userResponses.gender,
          top_activities: userResponses.top_activities,
          future_vision: userResponses.future_vision,
          algorithm_version: '2.0',
          completion_timestamp: new Date().toISOString(),
          final_scores: scores,
          final_personality_type: personalityResult || 'versatile'
        }
      });
      
      console.log('💾 Registration completed with enhanced responses:', userResponses);
      
      // Try to log in immediately
      const success = await login(registrationData.username, registrationData.password);
      
      if (success) {
        router.replace('/(app)/feed');
      } else {
        throw new Error('Login failed after registration');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Enhanced error handling with form preservation
      let errorMessage = '';
      if (err.response?.data?.username) {
        errorMessage = t('username_taken') || 'Username is already taken';
      } else if (err.response?.data?.email) {
        errorMessage = t('email_registered') || 'Email is already registered';
      } else {
        errorMessage = Object.values(err.response?.data || {}).flat().join('\n') || 
                     t('registration_failed') || 'Registration failed';
      }
      
      setError(errorMessage);
      
      // Preserve current form data for when user returns to registration
      setPreservedFormData(registrationData);
      
      // Go back to registration form with preserved data
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
        personalityType: personalityResult || 'versatile',
        // Enhanced: Pass preserved form data and error
        initialFormData: preservedFormData,
        initialError: error
      },
      8: {
        onComplete: handleStepComplete,
        initialScores: stepScores[8]
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
      case 8:
        return <Step8FutureVision {...stepProps[8]} />;
      default:
        return null;
    }
  };
  
  // Progress bar calculation (including step 8)
  const totalSteps = 8;
  const progressPercentage = ((getProgressStep() - 1) / totalSteps) * 100;
  
  // Helper function to get progress step (handle step 8 insertion)
  function getProgressStep() {
    if (currentStep <= 5) return currentStep;
    if (currentStep === 8) return 6; // Step 8 comes after step 5
    if (currentStep === 6) return 7; // Step 6 comes after step 8
    if (currentStep === 7) return 8; // Registration is last
    return currentStep;
  }
  
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
              const progressStep = getProgressStep();
              return (
                <View 
                  key={step}
                  style={[
                    styles.stepIndicator,
                    progressStep > step 
                      ? styles.stepCompleted 
                      : progressStep === step
                        ? styles.stepCurrent
                        : styles.stepFuture
                  ]}
                >
                  {progressStep > step ? (
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