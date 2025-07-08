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
import Step1WorkoutName from './workout-steps/Step1WorkoutName';
import StepExercises from './workout-steps/StepExercises';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

// Updated types to match the new structure
export type ExerciseSet = {
  id?: number;
  reps?: number | null;
  weight?: number | null;
  weight_unit?: 'kg' | 'lbs';
  weight_unit_display?: string;
  weight_display?: string;
  duration?: number | null;
  distance?: number | null;
  rest_time: number;
  order?: number;
};

export type Exercise = {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order?: number;
  effort_type?: 'reps' | 'time' | 'distance';
  effort_type_display?: string;
  superset_with?: number | null;
  is_superset?: boolean; 
  superset_rest_time?: number;
  sets: ExerciseSet[];
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
      split_method : 'custom',
      tags: []
    };
  }

  // Use existing template data if provided, ensuring proper structure for updated types
  return {
    name: template.name || '',
    description: template.description || '',
    estimated_duration: template.estimated_duration || 45,
    difficulty_level: template.difficulty_level || 'intermediate',
    focus: template.focus || 'strength',
    is_active: template.is_active ?? true,
    exercises: template.exercises ? template.exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment || '',
      notes: exercise.notes || '',
      order: exercise.order || 0,
      effort_type: exercise.effort_type || 'reps',
      effort_type_display: exercise.effort_type_display,
      superset_with: exercise.superset_with || null,
      is_superset: exercise.is_superset || false,
      superset_rest_time: exercise.superset_rest_time || 60,
      sets: exercise.sets ? exercise.sets.map(set => ({
        id: set.id,
        reps: set.reps,
        weight: set.weight,
        weight_unit: set.weight_unit || 'kg',
        weight_unit_display: set.weight_unit_display,
        weight_display: set.weight_display,
        duration: set.duration,
        distance: set.distance,
        rest_time: set.rest_time || 60,
        order: set.order || 0
      })) : []
    })) : [],
    equipment_required: template.equipment_required || [],
    split_method: template.split_method || 'custom',
    tags: template.tags || []
  };
};

const { width } = Dimensions.get('window');

const WorkoutTemplateWizard = ({ template = null, onSubmit, onClose, visible }: WorkoutTemplateWizardProps) => {
  const { t } = useLanguage();
  const { workoutPalette, palette } = useTheme();
  
  const [formData, setFormData] = useState<WorkoutTemplateFormData>(() => initializeFormData(template));
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Define steps in the wizard
  const steps = [
    { name: t('name'), component: Step1WorkoutName },
    { name: t('exercises'), component: StepExercises }
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
        
        // For supersets, we need to consider the superset rest time instead of individual exercise rest times
        const averageRestTime = formData.exercises.reduce((total, exercise, index) => {
          if (exercise.is_superset && exercise.superset_with !== null) {
            // For exercises in a superset, we only count the superset rest time once
            // and we only add it if this is the first exercise in the superset
            const pairedIndex = formData.exercises.findIndex(ex => ex.order === exercise.superset_with);
            if (index < pairedIndex && exercise.superset_rest_time) {
              return total + exercise.superset_rest_time;
            }
            return total;
          } else {
            // For regular exercises, add the average rest time per set
            const exerciseRestTime = exercise.sets.reduce((sum, set) => sum + (set.rest_time || 60), 0);
            return total + (exerciseRestTime / exercise.sets.length);
          }
        }, 0) / (formData.exercises.length || 1);
        
        // Rough estimation: 45 seconds per set + average rest time between sets
        const estimatedDuration = Math.round((totalSets * 45 + (totalSets - formData.exercises.length) * averageRestTime) / 60);
        updatedFormData.estimated_duration = Math.max(estimatedDuration, 15); // Minimum 15 minutes
      }
      
      // Ensure exercises have proper structure for backend
      const finalData = {
        ...updatedFormData,
        exercises: updatedFormData.exercises.map(exercise => ({
          ...exercise,
          effort_type: exercise.effort_type || 'reps',
          sets: exercise.sets.map(set => ({
            ...set,
            weight_unit: set.weight_unit || 'kg'
          }))
        }))
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
      <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
        <StatusBar barStyle="light-content" backgroundColor={palette.page_background} />
        
        {/* Smaller Header with integrated progress bar */}
        <View style={[styles.header, { borderBottomColor: palette.border, backgroundColor: palette.page_background }]}>
          <LinearGradient
            colors={[workoutPalette.background, workoutPalette.highlight]} // Blue gradient for workout theme
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: workoutPalette.text }]}>
                  {template ? t('edit_workout_template') : t('create_new_workout')}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={workoutPalette.text} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          {/* Smaller Progress bar */}
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
                    index < currentStep ? 
                      { backgroundColor: workoutPalette.background } : 
                      index === currentStep ? 
                        { backgroundColor: workoutPalette.highlight } : 
                        { backgroundColor: palette.input_background }
                  ]}>
                    <Text style={[
                      styles.stepNumber,
                      index < currentStep || index === currentStep ? 
                        { color: '#FFFFFF' } : 
                        { color: palette.text_tertiary }
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  
                  <Text style={[
                    styles.stepName,
                    index < currentStep ? 
                      { color: workoutPalette.text } : 
                      index === currentStep ? 
                        { color: workoutPalette.text } : 
                        { color: palette.text_tertiary }
                  ]}>
                    {step.name}
                  </Text>
                </TouchableOpacity>
                
                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <View style={[
                    styles.stepConnector,
                    index < currentStep ? 
                      { backgroundColor: workoutPalette.background } : 
                      { backgroundColor: palette.input_background }
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
        
        {/* Smaller Footer with navigation buttons */}
        <View style={[
          styles.footer, 
          { 
            borderTopColor: palette.border,
            backgroundColor: palette.page_background
          }
        ]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: palette.input_background }]}
            onPress={currentStep === 0 ? onClose : goToPrevStep}
          >
            <Text style={[styles.backButtonText, { color: palette.text }]}>
              {currentStep === 0 ? t('cancel') : t('back')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: workoutPalette.background }]}
            onPress={goToNextStep}
          >
            {currentStep === steps.length - 1 ? (
              <View style={styles.buttonContent}>
                <Ionicons name="save-outline" size={16} color="#FFFFFF" />
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
  },
  header: {
    borderBottomWidth: 1,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced from 12
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
    fontSize: 18, // Reduced from 20
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 6, // Reduced from 8
    borderRadius: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8, // Reduced from 12
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
    width: 28, // Reduced from 32
    height: 28, // Reduced from 32
    borderRadius: 14, // Reduced from 16
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3, // Reduced from 4
  },
  stepName: {
    fontSize: 10, // Reduced from 12
    fontWeight: '500',
  },
  stepNumber: {
    fontSize: 12, // Reduced from 14
    fontWeight: '600',
  },
  stepConnector: {
    width: (width - 180) / 1, // Dynamic width based on screen size (adjusted for 2 steps)
    height: 2,
    marginTop: -17, // Adjusted for smaller circles
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12, // Reduced from 16
    borderTopWidth: 1,
  },
  backButton: {
    paddingVertical: 8, // Reduced from 10
    paddingHorizontal: 14, // Reduced from 16
    borderRadius: 6, // Reduced from 8
  },
  backButtonText: {
    fontWeight: '500',
    fontSize: 13, // Reduced from 14
  },
  nextButton: {
    paddingVertical: 8, // Reduced from 10
    paddingHorizontal: 18, // Reduced from 20
    borderRadius: 6, // Reduced from 8
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 13, // Reduced from 14
    marginLeft: 6, // Reduced from 8
  },
});

export default WorkoutTemplateWizard;