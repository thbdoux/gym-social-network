import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, User, Mail, Lock } from 'lucide-react';
import { useUpdateUser, useCurrentUser, useRegisterUser, useLogin } from '../hooks/query/useUserQuery';
import { useLanguage } from '../context/LanguageContext';

// Import steps
import Step1GenderSelection from './steps/Step1GenderSelection';
import Step2FitnessType from './steps/Step2FitnessType';
import Step3MotivationCheck from './steps/Step3MotivationCheck';
import Step4ScenarioResponse from './steps/Step4ScenarioResponse';
import Step5ChatMiniGame from './steps/Step5ChatMiniGame';
import Step6IdentityReveal from './steps/Step6IdentityReveal';

// New registration form step
const Step7Registration = ({ onComplete, personalityType }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }
    
    if (!formData.email) {
      setError(t('email_required'));
      return;
    }
    
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
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-center text-white mb-4">
        {t('create_your_account')}
      </h3>
      
      <p className="text-gray-300 text-center mb-4">
        {t('complete_registration')}
      </p>
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              name="username"
              placeholder={t('username')}
              value={formData.username}
              onChange={handleInputChange}
              className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-800/40 text-white border border-gray-700/30 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors placeholder-gray-500"
              required
            />
          </div>
        </div>
        
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={16} className="text-gray-500" />
            </div>
            <input
              type="email"
              name="email"
              placeholder={t('email')}
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-800/40 text-white border border-gray-700/30 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors placeholder-gray-500"
              required
            />
          </div>
        </div>
        
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={16} className="text-gray-500" />
            </div>
            <input
              type="password"
              name="password"
              placeholder={t('password')}
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-800/40 text-white border border-gray-700/30 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors placeholder-gray-500"
              required
            />
          </div>
        </div>
        
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={16} className="text-gray-500" />
            </div>
            <input
              type="password"
              name="confirmPassword"
              placeholder={t('confirm_password')}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-800/40 text-white border border-gray-700/30 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors placeholder-gray-500"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full mt-6 py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-700/90 hover:to-indigo-700/90 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 shadow-sm"
        >
          {t('create_account_button')}
        </button>
      </form>
    </div>
  );
};

const PersonalityPathWizard = ({ isRegistrationFlow = false }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const updateUserMutation = useUpdateUser();
  const registerUserMutation = useRegisterUser();
  const loginMutation = useLogin();
  const { refetch: refetchUser } = useCurrentUser();
  
  // Score tracking for personality determination
  const [scores, setScores] = useState({
    optimizer: 0,
    diplomate: 0, 
    mentor: 0,
    versatile: 0
  });
  
  // Store scores for each individual step to allow going back
  const [stepScores, setStepScores] = useState({
    1: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    2: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    3: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    4: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 },
    5: { optimizer: 0, diplomate: 0, mentor: 0, versatile: 0 }
  });
  
  // User profile data
  const [userProfile, setUserProfile] = useState({
    gender: null,
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [personalityResult, setPersonalityResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [error, setError] = useState('');

  // Enhanced animation states
  const [fadeOut, setFadeOut] = useState(false);
  const [transitioningStep, setTransitioningStep] = useState(false);
  
  // Handle navigation to next step and update scores
  const handleStepComplete = useCallback((newScores, stepNumber = currentStep) => {
    // Start transition animation
    setFadeOut(true);
    
    // After fade out animation completes
    setTimeout(() => {
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
      const updatedTotalScores = {
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
      setTransitioningStep(true);
      
      // After a short delay, fade in the new step
      setTimeout(() => {
        setFadeOut(false);
        setTransitioningStep(false);
      }, 300);
    }, 300);
  }, [currentStep, stepScores]);
  
  // Handle going back to previous step
  const handleGoBack = useCallback(() => {
    if (currentStep <= 1) {
      // If at first step in registration flow, go back to login
      if (isRegistrationFlow) {
        navigate('/login');
      }
      return;
    }
    
    // Start transition animation
    setFadeOut(true);
    
    setTimeout(() => {
      // Recalculate total scores by excluding the current step
      const updatedTotalScores = {
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
      setTransitioningStep(true);
      
      // After a short delay, fade in the previous step
      setTimeout(() => {
        setFadeOut(false);
        setTransitioningStep(false);
      }, 300);
    }, 300);
  }, [currentStep, isRegistrationFlow, navigate, stepScores]);
  
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
  const handleRegistration = async () => {
    if (!registrationData) {
      setError(t('registration_error'));
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Register user with personality type
      await registerUserMutation.mutateAsync({
        username: registrationData.username,
        email: registrationData.email,
        password: registrationData.password,
        training_level: 'beginner',
        personality_type: personalityResult || 'versatile'
      });
      
      // Login the user
      await loginMutation.mutateAsync({
        username: registrationData.username,
        password: registrationData.password
      });
      
      // Navigate to feed
      navigate('/feed');
    } catch (err) {
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
    if (isRegistrationFlow && registrationData && personalityResult && currentStep > 7) {
      handleRegistration();
    }
  }, [isRegistrationFlow, registrationData, personalityResult, currentStep]);
  
  // For existing users (not in registration flow), update personality type
  const updatePersonalityType = async (personalityType) => {
    if (isRegistrationFlow) return; // Skip for registration flow
    
    console.log("Updating personality type to:", personalityType);
    setIsSubmitting(true);
    
    // Ensure we have a valid personality type to save
    if (!personalityType || personalityType === '') {
      console.error('Invalid personality type:', personalityType);
      // Use a default if we somehow ended up with an invalid value
      personalityType = 'versatile';
    }
    
    try {
      console.log("Calling updateUserMutation with:", { personality_type: personalityType });
      await updateUserMutation.mutateAsync({
        personality_type: personalityType
      });
      
      // Refetch user data to ensure we have the updated personality type
      await refetchUser();
      
      console.log("Successfully updated personality type");
      setIsSubmitting(false);
      
      // Navigate to feed
      navigate('/feed');
    } catch (error) {
      console.error('Failed to update personality type:', error);
      setIsSubmitting(false);
      
      // Even if update fails, we'll still allow the user to continue
      setTimeout(() => {
        navigate('/feed');
      }, 1000);
    }
  };
  
  // For existing users, update personality type when determined
  useEffect(() => {
    if (!isRegistrationFlow && personalityResult && currentStep > 6) {
      // If not a registration flow, update existing user
      updatePersonalityType(personalityResult);
    }
  }, [isRegistrationFlow, personalityResult, currentStep]);
  
  // Render the appropriate step with transition animations
  const renderStep = () => {
    if (transitioningStep) return null;
    
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
  
  // Progress bar calculation - adjust for registration flow with 7 steps instead of 6
  const totalSteps = isRegistrationFlow ? 7 : 6;
  const progressPercentage = ((currentStep - 1) / totalSteps) * 100;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 relative overflow-hidden">
      {/* Enhanced background elements with animation */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-600/4 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-pink-600/3 rounded-full blur-3xl animate-pulse-slow animation-delay-3000"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white/10 animate-float-slow"
            style={{
              width: `${Math.random() * 8 + 2}px`,
              height: `${Math.random() * 8 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 20}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      {/* Main content with enhanced transitions */}
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* App title */}
          <h1 className="text-2xl font-bold text-center text-white mb-6">
            {isRegistrationFlow ? t('create_account') : t('fitness_profile_setup')}
          </h1>
          
          {/* Enhanced progress bar */}
          <div className="mb-6">
            <div className="h-1.5 w-full bg-gray-800/60 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              {[...Array(totalSteps)].map((_, index) => {
                const step = index + 1;
                return (
                  <div 
                    key={step}
                    className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300
                      ${currentStep > step 
                        ? 'bg-green-500 text-white' 
                        : currentStep === step
                          ? 'bg-blue-500 text-white ring-2 ring-blue-400/30'
                          : 'bg-gray-800/60 text-gray-500'
                      }`}
                  >
                    {currentStep > step ? <Check size={14} /> : step}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Step container with enhanced animations */}
          <div className="backdrop-blur-sm p-6 rounded-2xl border border-gray-800/30 relative overflow-hidden min-h-[500px] transition-all duration-300">
            {/* Back button */}
            {currentStep > 1 && (
              <button 
                onClick={handleGoBack}
                className="absolute top-4 left-4 p-2 rounded-full bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/70 transition-all z-10"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            
            {/* Error message for registration errors */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4 text-sm absolute top-4 right-4 left-12 z-10">
                {error}
              </div>
            )}
            
            <div className={`transition-all duration-300 ${fadeOut ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalityPathWizard;