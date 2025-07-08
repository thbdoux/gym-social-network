import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

// Import Steps
import Step1GroupInfo from './group-workout-steps/Step1GroupInfo';
import Step2Participants from './group-workout-steps/Step2Participants';
import Step3Schedule from './group-workout-steps/Step3Schedule';

// Define group workout form data type to match API expectations
export type GroupWorkoutFormData = {
  title: string;
  description?: string;
  creator?: number;
  creator_username?: string;
  scheduled_time?: string;
  // UI helper fields that will be combined into scheduled_time
  scheduled_date: Date;
  time_string: string;
  duration_minutes: number;
  location?: string;
  gym?: number | null;
  gym_name?: string;
  privacy: 'public' | 'upon-request' | 'private';
  max_participants: number;
  participants: number[]; // Changed from string[] to number[] to match API expectations
  participants_details?: any[]; // Added to store full user details
  invited_users: number[]; // Changed from string[] to number[]
  workout_template?: number | null;
  tags?: string[];
};

type GroupWorkoutWizardProps = {
  groupWorkout?: any | null;
  fromTemplate?: boolean;
  template?: any | null;
  onSubmit: (formData: GroupWorkoutFormData, invitedUsers?: number[]) => void;
  onClose: () => void;
  visible: boolean;
  onTemplateSelected?: (templateId: number) => void;
  user: any;
};

const { width } = Dimensions.get('window');

const GroupWorkoutWizard = ({ 
  groupWorkout = null,
  fromTemplate = false,
  template = null,
  onSubmit, 
  onClose, 
  visible,
  onTemplateSelected,
  user
}: GroupWorkoutWizardProps) => {
  const { t } = useLanguage();
  const { groupWorkoutPalette, palette } = useTheme();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form data with default values
  const getInitialFormData = (): GroupWorkoutFormData => {
    const now = new Date();
    const oneHourLater = new Date(now);
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    
    // Format time for display
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    
    // Base form data
    const formData: GroupWorkoutFormData = {
      title: '',
      description: '',
      creator: user?.id,
      creator_username: user?.username || '',
      scheduled_date: oneHourLater,
      time_string: formatTime(oneHourLater),
      duration_minutes: 60,
      location: '',
      gym: null,
      gym_name: '',
      privacy: 'public',
      max_participants: 8,
      participants: [user?.id], // Changed to use ID instead of username
      participants_details: [user], // Initialize with creator details
      invited_users: [],
      workout_template: null
    };
    
    // Pre-fill data from existing group workout if available
    if (groupWorkout) {
      // Parse scheduled_time into date and time
      const scheduledDate = new Date(groupWorkout.scheduled_time);
      
      // Extract participants from the group workout
      const participantIds = groupWorkout.participants ? 
        groupWorkout.participants.map(p => p.user) : [user?.id];
      
      return {
        ...formData,
        title: groupWorkout.title || '',
        description: groupWorkout.description || '',
        scheduled_date: scheduledDate,
        time_string: formatTime(scheduledDate),
        privacy: groupWorkout.privacy || 'public',
        gym: groupWorkout.gym || null,
        workout_template: groupWorkout.workout_template || null,
        max_participants: groupWorkout.max_participants || 8,
        participants: participantIds,
        participants_details: groupWorkout.participants || [user]
      };
    }
    
    // Pre-fill data from template if available
    if (fromTemplate && template) {
      return {
        ...formData,
        title: template.name || '',
        description: template.description || '',
        duration_minutes: template.estimated_duration || 60,
        workout_template: template.id || null
      };
    }
    
    return formData;
  };
  
  // State setup
  const [formData, setFormData] = useState<GroupWorkoutFormData>(getInitialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Reset form data when modal becomes visible or source changes
  useEffect(() => {
    if (visible) {
      setFormData(getInitialFormData());
      setCurrentStep(0);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [visible, fromTemplate, template, groupWorkout]);
  
  // Update form data
  const updateFormData = (updates: Partial<GroupWorkoutFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Handle template selection
    if (updates.workout_template !== undefined && onTemplateSelected && updates.workout_template !== null) {
      onTemplateSelected(updates.workout_template);
    }
  };
  
  // Define steps in the wizard
  const steps = [
    { name: t('group_info'), component: Step1GroupInfo },
    { name: t('participants'), component: Step2Participants },
    { name: t('schedule'), component: Step3Schedule }
  ];
  
  // Validate current step before proceeding
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch(currentStep) {
      case 0: // Group Info step
        if (!formData.title.trim()) {
          newErrors.title = t('workout_name_required');
        }
        break;
      case 1: // Participants step
        if (formData.participants.length < 1) {
          newErrors.participants = t('at_least_one_participant');
        }
        break;
      case 2: // Schedule step
        if (!formData.scheduled_date) {
          newErrors.scheduled_date = t('date_required');
        }
        if (!formData.time_string) {
          newErrors.time_string = t('time_required');
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
  
  // Format the final data for submission to API
  const prepareDataForSubmission = () => {
    // Combine date and time into ISO format
    const dateObj = new Date(formData.scheduled_date);
    const [hours, minutes] = formData.time_string.split(':').map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
    
    const apiData = {
      ...formData,
      scheduled_time: dateObj.toISOString(),
    };
    
    // Remove UI-only fields
    delete apiData.scheduled_date;
    delete apiData.time_string;
    delete apiData.creator_username;
    delete apiData.participants_details;
    
    // Clean up null/undefined values
    return Object.fromEntries(
      Object.entries(apiData).filter(([_, v]) => v !== null && v !== undefined)
    );
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateStep()) {
      try {
        // Show loading state
        setIsSubmitting(true);
        
        // Prepare the data for API submission
        const finalData = prepareDataForSubmission();
        console.log('Submitting group workout form data:', finalData);
        // Store invited users before submission
        const invitedUsersToProcess = [...formData.invited_users];
        
        // Submit the form data
        onSubmit(finalData as GroupWorkoutFormData, invitedUsersToProcess);
        
        // Note: The loading state will be hidden when the modal is closed by the parent component
        // We don't hide the loading state here because we don't know when the API call will complete
        // The parent component should call onClose() after the API call completes
      } catch (error) {
        console.error('Error preparing data for submission:', error);
        // Hide loading state on error
        setIsSubmitting(false);
        Alert.alert(
          t('error'),
          t('failed_to_create_group_workout')
        );
      }
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
        
        {/* Header with integrated progress bar */}
        <View style={[styles.header, { borderBottomColor: palette.border, backgroundColor: palette.page_background }]}>
          <LinearGradient
            colors={[groupWorkoutPalette.background, groupWorkoutPalette.highlight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: groupWorkoutPalette.text }]}>
                  {t('create_group_workout')}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={22} color={groupWorkoutPalette.text} />
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
                    index < currentStep ? 
                      { backgroundColor: groupWorkoutPalette.background } : 
                      index === currentStep ? 
                        { backgroundColor: groupWorkoutPalette.highlight } : 
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
                      { color: groupWorkoutPalette.text } : 
                      index === currentStep ? 
                        { color: groupWorkoutPalette.text } : 
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
                      { backgroundColor: groupWorkoutPalette.background } : 
                      { backgroundColor: palette.input_background }
                  ]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
        
        {/* Content area - each step component wrapped in ScrollView */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            user={user}
          />
          
          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={groupWorkoutPalette.highlight} />
              <Text style={[styles.loadingText, { color: palette.text }]}>
                {t('saving_group_workout')}
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Footer with navigation buttons */}
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
            disabled={isSubmitting}
          >
            <Text style={[styles.backButtonText, { color: palette.text }]}>
              {currentStep === 0 ? t('cancel') : t('back')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.nextButton, 
              { backgroundColor: groupWorkoutPalette.background },
              isSubmitting && { opacity: 0.7 }
            ]}
            onPress={goToNextStep}
            disabled={isSubmitting}
          >
            {currentStep === steps.length - 1 ? (
              <View style={styles.buttonContent}>
                <Ionicons name="save-outline" size={18} height={18} color="#FFFFFF" />
                <Text style={styles.nextButtonText}>
                  {groupWorkout ? t('update_group_workout') : t('create_group_workout')}
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
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepConnector: {
    width: (width - 200) / 2, // Dynamic width based on screen size (adjusted for 3 steps)
    height: 2,
    marginTop: -20, // Position in the middle of circles
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32, // Added more padding at the bottom for better scrolling
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backButtonText: {
    fontWeight: '500',
    fontSize: 14,
  },
  nextButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default GroupWorkoutWizard;