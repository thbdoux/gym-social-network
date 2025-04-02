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
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons instead of react-native-feather
import Step1WorkoutName from './workout-steps/Step1WorkoutName';
import Step2Exercises from './workout-steps/Step2Exercises';
import { useLanguage } from '../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

// Define exercise type
export type ExerciseSet = {
  reps: number;
  weight: number;
  rest_time: number;
  order?: number;
};

export type Exercise = {
  id?: number;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  order?: number;
};

// Define form data type
export type WorkoutTemplateFormData = {
  name: string;
  description?: string;
  estimated_duration: number;
  difficulty_level: string;
  focus: string;
  is_active: boolean;
  exercises: Exercise[];
  equipment_required?: string[];
  split_method: string;
  tags?: string[];
};

type WorkoutTemplateWizardProps = {
  template?: WorkoutTemplateFormData | null;
  onSubmit: (formData: WorkoutTemplateFormData) => void;
  onClose: () => void;
  visible: boolean;
};

// Initialize form data with defaults or existing data
const initializeFormData = (template: WorkoutTemplateFormData | null | undefined): WorkoutTemplateFormData => {
  if (!template) {
    return {
      name: '',
      description: '',
      estimated_duration: 45, // Default 45 minutes
      difficulty_level: 'intermediate',
      focus: 'strength',
      is_active: true,
      exercises: [],
      equipment_required: [],
      split_method : 'custom',
      tags: []
    };
  }

  // Use existing template data if provided
  return {
    name: template.name || '',
    description: template.description || '',
    estimated_duration: template.estimated_duration || 45,
    difficulty_level: template.difficulty_level || 'intermediate',
    focus: template.focus || 'strength',
    is_active: template.is_active ?? true,
    exercises: template.exercises || [],
    equipment_required: template.equipment_required || [],
    split_method: template.split_method || 'custom',
    tags: template.tags || []
  };
};

const { width } = Dimensions.get('window');

const WorkoutTemplateWizard = ({ template = null, onSubmit, onClose, visible }: WorkoutTemplateWizardProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<WorkoutTemplateFormData>(() => initializeFormData(template));
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Define steps in the wizard
  const steps = [
    { name: t('name'), component: Step1WorkoutName },
    { name: t('exercises'), component: Step2Exercises }
  ];

  // Update form data when props change
  useEffect(() => {
    if (visible) {
      setFormData(initializeFormData(template));
      setCurrentStep(0);
      setErrors({});
    }
  }, [template, visible]);

  // Update formData with new values
  const updateFormData = (newData: Partial<WorkoutTemplateFormData>) => {
    setFormData(prevData => ({ ...prevData, ...newData }));
  };

  // Validate current step before proceeding
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch(currentStep) {
      case 0: // Name step
        if (!formData.name.trim()) {
          newErrors.name = t('workout_name_required');
        }
        break;
      case 1: // Exercises step
        if (formData.exercises.length === 0) {
          newErrors.exercises = t('at_least_one_exercise');
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
      // Calculate estimated duration based on exercises if not set
      let updatedFormData = { ...formData };
      
      if (!formData.estimated_duration || formData.estimated_duration === 0) {
        const totalSets = formData.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
        const averageRestTime = formData.exercises.reduce((total, exercise) => {
          const exerciseRestTime = exercise.sets.reduce((sum, set) => sum + (set.rest_time || 60), 0);
          return total + (exerciseRestTime / exercise.sets.length);
        }, 0) / (formData.exercises.length || 1);
        
        // Rough estimation: 45 seconds per set + average rest time between sets
        const estimatedDuration = Math.round((totalSets * 45 + (totalSets - formData.exercises.length) * averageRestTime) / 60);
        updatedFormData.estimated_duration = Math.max(estimatedDuration, 15); // Minimum 15 minutes
      }
      
      // Submit the form data
      onSubmit(updatedFormData);
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
            colors={['#0ea5e9', '#0284c7']} // Blue gradient for workout theme
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  {template ? t('edit_workout_template') : t('create_new_workout')}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
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
                <Ionicons name="save-outline" width={18} height={18} color="#FFFFFF" />
                <Text style={styles.nextButtonText}>
                  {template ? t('update_template') : t('create_template')}
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
    backgroundColor: '#0ea5e9', // blue-500
  },
  stepCurrent: {
    backgroundColor: '#0284c7', // blue-600
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
    width: (width - 180) / 1, // Dynamic width based on screen size (adjusted for 2 steps)
    height: 2,
    marginTop: -20, // Position in the middle of circles
  },
  stepConnectorCompleted: {
    backgroundColor: '#0ea5e9', // blue-500
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
    backgroundColor: '#0284c7', // blue-600
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

export default WorkoutTemplateWizard;