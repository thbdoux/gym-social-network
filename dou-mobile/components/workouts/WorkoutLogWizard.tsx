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
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

// Import Steps
import Step1WorkoutInfo from './workout-log-steps/Step1WorkoutInfo';
import Step2DateLocation from './workout-log-steps/Step2DateLocation';
import Step3Exercises from './workout-steps/Step2Exercises'; // Reuse exercise step
import Step4Feedback from './workout-log-steps/Step4Feedback';

// Import types
import { Exercise, ExerciseSet } from './WorkoutTemplateWizard';

// Define workout log form data type
export type WorkoutLogFormData = {
  name: string;
  description?: string;
  date: Date;
  gym_id?: number | null;
  gym_name?: string;
  location?: string;
  duration_minutes: number;
  difficulty_level: string;
  mood_rating: number;
  notes?: string;
  exercises: Exercise[];
  program_id?: number | null;
  program_workout_id?: number | null;
  template_id?: number | null;
  tags?: string[];
  source_type: 'none' | 'program' | 'template';
};

type WorkoutLogWizardProps = {
  logFromProgram: boolean;
  logFromTemplate: boolean;
  programWorkout?: any | null;
  template?: any | null;
  onSubmit: (formData: WorkoutLogFormData) => void;
  onClose: () => void;
  visible: boolean;
  onProgramSelected?: (programId: number) => void;
  onTemplateSelected?: (templateId: number) => void;
};

const { width } = Dimensions.get('window');

const WorkoutLogWizard = ({ 
  logFromProgram = false,
  logFromTemplate = false,
  programWorkout = null,
  template = null,
  onSubmit, 
  onClose, 
  visible,
  onProgramSelected,
  onTemplateSelected
}: WorkoutLogWizardProps) => {
  const { t } = useLanguage();
  
  // Initialize the form data with default values
  const getInitialFormData = (): WorkoutLogFormData => {
    const now = new Date();
    let sourceType: 'none' | 'program' | 'template' = 'none';
    
    // Set source type based on props
    if (logFromProgram) sourceType = 'program';
    else if (logFromTemplate) sourceType = 'template';
    
    // Base form data
    const formData: WorkoutLogFormData = {
      name: '',
      description: '',
      date: now,
      gym_id: null,
      gym_name: '',
      location: '',
      duration_minutes: 45,
      difficulty_level: 'moderate',
      mood_rating: 3,
      exercises: [],
      program_id: null,
      program_workout_id: null,
      template_id: null,
      source_type: sourceType
    };
    
    // Pre-fill data from program if available
    if (sourceType === 'program' && programWorkout) {
      formData.name = programWorkout.name || '';
      formData.description = programWorkout.description || '';
      formData.duration_minutes = programWorkout.estimated_duration || 45;
      formData.difficulty_level = programWorkout.difficulty_level || 'moderate';
      formData.exercises = programWorkout.exercises ? [...programWorkout.exercises] : [];
      formData.program_id = programWorkout.program_id || null;
      formData.program_workout_id = programWorkout.id || null;
    }
    
    // Pre-fill data from template if available
    if (sourceType === 'template' && template) {
      formData.name = template.name || '';
      formData.description = template.description || '';
      formData.duration_minutes = template.estimated_duration || 45;
      formData.difficulty_level = template.difficulty_level || 'moderate';
      formData.exercises = template.exercises ? [...template.exercises] : [];
      formData.template_id = template.id || null;
    }
    
    return formData;
  };
  
  // State setup
  const [formData, setFormData] = useState<WorkoutLogFormData>(getInitialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Reset form data when modal becomes visible or source changes
  useEffect(() => {
    if (visible) {
      setFormData(getInitialFormData());
      setCurrentStep(0);
      setErrors({});
    }
  }, [visible, logFromProgram, logFromTemplate, programWorkout, template]);
  
  // Update form data
  const updateFormData = (updates: Partial<WorkoutLogFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Handle source type changes
    if (updates.source_type) {
      // Reset relevant IDs when source type changes
      if (updates.source_type === 'none') {
        setFormData(prev => ({
          ...prev,
          ...updates,
          program_id: null,
          program_workout_id: null,
          template_id: null
        }));
      } else if (updates.source_type === 'program') {
        setFormData(prev => ({
          ...prev,
          ...updates,
          template_id: null
        }));
      } else if (updates.source_type === 'template') {
        setFormData(prev => ({
          ...prev,
          ...updates,
          program_id: null,
          program_workout_id: null
        }));
      }
    }
    
    // Handle program selection
    if (updates.program_id !== undefined && onProgramSelected && updates.program_id !== null) {
      onProgramSelected(updates.program_id);
    }
    
    // Handle template selection
    if (updates.template_id !== undefined && onTemplateSelected && updates.template_id !== null) {
      onTemplateSelected(updates.template_id);
    }
  };
  
  // Define steps in the wizard
  const steps = [
    { name: t('workout_info'), component: Step1WorkoutInfo },
    { name: t('date_location'), component: Step2DateLocation },
    { name: t('exercises'), component: Step3Exercises },
    { name: t('feedback'), component: Step4Feedback }
  ];
  
  // Validate current step before proceeding
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch(currentStep) {
      case 0: // Workout Info step
        if (!formData.name.trim()) {
          newErrors.name = t('workout_name_required');
        }
        if (formData.source_type === 'program' && !formData.program_id) {
          newErrors.program = t('program_selection_required');
        }
        if (formData.source_type === 'template' && !formData.template_id) {
          newErrors.template = t('template_selection_required');
        }
        break;
      case 1: // Date & Location step
        if (!formData.date) {
          newErrors.date = t('date_required');
        }
        break;
      case 2: // Exercises step
        if (formData.exercises.length === 0) {
          newErrors.exercises = t('at_least_one_exercise');
        }
        break;
      case 3: // Feedback step
        // No validation needed for mood and difficulty
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
      // Calculate duration based on exercises if not set
      let updatedFormData = { ...formData };
      
      if (!formData.duration_minutes || formData.duration_minutes === 0) {
        const totalSets = formData.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
        const averageRestTime = formData.exercises.reduce((total, exercise) => {
          const exerciseRestTime = exercise.sets.reduce((sum, set) => sum + (set.rest_time || 60), 0);
          return total + (exerciseRestTime / exercise.sets.length);
        }, 0) / (formData.exercises.length || 1);
        
        // Rough estimation: 45 seconds per set + average rest time between sets
        const estimatedDuration = Math.round((totalSets * 45 + (totalSets - formData.exercises.length) * averageRestTime) / 60);
        updatedFormData.duration_minutes = Math.max(estimatedDuration, 15); // Minimum 15 minutes
      }
      
      // Clean up form data before submission
      const finalData = {
        ...updatedFormData,
        // Convert null to undefined for optional fields to avoid backend issues
        program_id: updatedFormData.program_id || undefined,
        program_workout_id: updatedFormData.program_workout_id || undefined,
        template_id: updatedFormData.template_id || undefined,
        gym_id: updatedFormData.gym_id || undefined
      };
      
      // Submit the form data
      onSubmit(finalData);
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
            colors={['#16a34a', '#22c55e']} // Green gradient for workout log theme
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{t('log_workout')}</Text>
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
                <Ionicons name="save-outline" size={18} height={18} color="#FFFFFF" />
                <Text style={styles.nextButtonText}>
                  {t('save_workout')}
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
    fontSize: 10, // Smaller text for 4 steps
    fontWeight: '500',
  },
  stepCompleted: {
    backgroundColor: '#16a34a', // green-600
  },
  stepCurrent: {
    backgroundColor: '#22c55e', // green-500
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
    width: (width - 260) / 3, // Dynamic width based on screen size (adjusted for 4 steps)
    height: 2,
    marginTop: -20, // Position in the middle of circles
  },
  stepConnectorCompleted: {
    backgroundColor: '#16a34a', // green-600
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
    backgroundColor: '#16a34a', // green-600
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

export default WorkoutLogWizard;