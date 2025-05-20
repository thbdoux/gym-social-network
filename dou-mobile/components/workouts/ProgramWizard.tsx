import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Dimensions
} from 'react-native';
import { X, Save } from 'react-native-feather';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2Focus from './steps/Step2Focus';
import Step3Schedule from './steps/Step3Schedule';
import { useLanguage } from '../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

// Define form data type
export type ProgramFormData = {
  name: string;
  focus: string;
  sessions_per_week: number;
  difficulty_level: string;
  estimated_completion_weeks: number;
  is_active: boolean;
  is_public: boolean;
  description?: string;
  tags?: string[];
  required_equipment?: string[];
  recommended_level?: string;
};

type ProgramWizardProps = {
  program?: ProgramFormData | null;
  onSubmit: (formData: ProgramFormData) => void;
  onClose: () => void;
  visible: boolean;
};

// Initialize form data with defaults or existing data
const initializeFormData = (program: ProgramFormData | null | undefined): ProgramFormData => {
  if (!program) {
    return {
      name: '',
      focus: 'strength',
      sessions_per_week: 3,
      difficulty_level: 'intermediate',
      estimated_completion_weeks: 8, // Default value (not editable)
      is_active: false,               // Default to true
      is_public: true                // Default to true
    };
  }

  // Use existing program data if provided
  return {
    name: program.name || '',
    focus: program.focus || 'strength',
    sessions_per_week: program.sessions_per_week || 3,
    difficulty_level: program.difficulty_level || 'intermediate',
    estimated_completion_weeks: program.estimated_completion_weeks || 8,
    is_active: program.is_active ?? true,
    is_public: program.is_public ?? true
  };
};

const { width } = Dimensions.get('window');

const ProgramWizard = ({ program = null, onSubmit, onClose, visible }: ProgramWizardProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ProgramFormData>(() => initializeFormData(program));
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Define steps in the wizard - simplified to just 3 steps
  const steps = [
    { name: t('name'), component: Step1BasicInfo },
    { name: t('focus'), component: Step2Focus },
    { name: t('schedule'), component: Step3Schedule }
  ];

  // Update form data when props change
  useEffect(() => {
    if (visible) {
      setFormData(initializeFormData(program));
      setCurrentStep(0);
      setErrors({});
    }
  }, [program, visible]);

  // Update formData with new values
  const updateFormData = (newData: Partial<ProgramFormData>) => {
    setFormData(prevData => ({ ...prevData, ...newData }));
  };

  // Validate current step before proceeding
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch(currentStep) {
      case 0: // Basic Info
        if (!formData.name.trim()) {
          newErrors.name = t('program_name_required');
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next step or submit if on last step
  const goToNextStep = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  // Navigate to previous step
  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateStep()) {
      // Fill optional fields with default values
      const enrichedFormData = {
        ...formData,
        description: formData.description || '', // Default empty string
        tags: formData.tags || [], // Default empty array
        required_equipment: formData.required_equipment || [], // Default empty array
        recommended_level: formData.recommended_level || formData.difficulty_level // Default to difficulty level
      };
      
      // Submit the enriched form data
      onSubmit(enrichedFormData);
    }
  };

  // Get current step component
  const CurrentStepComponent = steps[currentStep].component;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111827" />
        
        {/* Header with integrated progress bar */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#7e22ce', '#9333ea']} // Purple gradient for program theme
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  {program ? t('edit_program') : t('create_new_program')}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X width={22} height={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                {/* Step indicator */}
                <TouchableOpacity 
                  style={[
                    styles.stepIndicator,
                    index <= currentStep && styles.stepInteractive
                  ]} 
                  onPress={() => index <= currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                >
                  {/* Circle indicator */}
                  <View style={[
                    styles.stepCircle,
                    index < currentStep ? styles.stepCompleted : 
                    index === currentStep ? styles.stepCurrent : 
                    styles.stepUpcoming
                  ]}>
                    <Text style={[
                      styles.stepNumber,
                      index < currentStep ? styles.stepCompletedText : 
                      index === currentStep ? styles.stepCurrentText : 
                      styles.stepUpcomingText
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  
                  <Text style={[
                    styles.stepName,
                    index < currentStep ? styles.stepCompletedText : 
                    index === currentStep ? styles.stepCurrentText : 
                    styles.stepUpcomingText
                  ]}>
                    {step.name}
                  </Text>
                </TouchableOpacity>
                
                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <View style={[
                    styles.stepConnector,
                    index < currentStep ? styles.stepConnectorCompleted : styles.stepConnectorUpcoming
                  ]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
        
        {/* Content area - each step component */}
        <View style={styles.content}>
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        </View>
        
        {/* Footer with navigation buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={currentStep === 0 ? onClose : goToPrevStep}
          >
            <Text style={styles.backButtonText}>
              {currentStep === 0 ? t('cancel') : t('back')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.nextButton}
            onPress={goToNextStep}
          >
            {currentStep === steps.length - 1 ? (
              <View style={styles.buttonContent}>
                <Save width={18} height={18} color="#FFFFFF" />
                <Text style={styles.nextButtonText}>
                  {program ? t('update_program') : t('create_program')}
                </Text>
              </View>
            ) : (
              <Text style={styles.nextButtonText}>
                {t('next')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    backgroundColor: '#111827',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepIndicator: {
    flexDirection: 'column',
    alignItems: 'center',
    opacity: 0.6,
  },
  stepInteractive: {
    opacity: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepName: {
    fontSize: 12,
    fontWeight: '500',
  },
  stepCompleted: {
    backgroundColor: '#9333ea', // purple-600
  },
  stepCurrent: {
    backgroundColor: '#7e22ce', // purple-700
  },
  stepUpcoming: {
    backgroundColor: '#1F2937', // gray-800
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepCompletedText: {
    color: '#FFFFFF',
  },
  stepCurrentText: {
    color: '#FFFFFF',
  },
  stepUpcomingText: {
    color: '#6B7280', // gray-500
  },
  stepConnector: {
    width: (width - 180) / 2, // Dynamic width based on screen size
    height: 2,
    marginTop: -20, // Position in the middle of circles
  },
  stepConnectorCompleted: {
    backgroundColor: '#9333ea', // purple-600
  },
  stepConnectorUpcoming: {
    backgroundColor: '#1F2937', // gray-800
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    backgroundColor: '#111827',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1F2937', // gray-800
    borderRadius: 8,
  },
  backButtonText: {
    color: '#E5E7EB', // gray-200
    fontWeight: '500',
    fontSize: 14,
  },
  nextButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#7e22ce', // purple-700
    borderRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default ProgramWizard;