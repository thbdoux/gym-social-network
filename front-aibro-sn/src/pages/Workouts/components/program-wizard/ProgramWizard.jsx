import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import BasicInfoStep from './steps/BasicInfoStep';
import FocusStep from './steps/FocusStep';
import ScheduleStep from './steps/ScheduleStep';
import AdvancedOptionsStep from './steps/AdvancedOptionsStep';
import ReviewStep from './steps/ReviewStep';
import { useLanguage } from '../../../../context/LanguageContext';

// Initialize form data with defaults or existing data
const initializeFormData = (program) => {
  if (!program) {
    return {
      name: '',
      focus: 'strength',
      sessions_per_week: 3,
      difficulty_level: 'intermediate',
      estimated_completion_weeks: 8,
      is_active: true,
      is_public: true
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

const ProgramWizard = ({ program = null, onSubmit, onClose }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(() => initializeFormData(program));
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const contentRef = useRef(null);
  
  // Define steps in the wizard
  const steps = [
    { name: t('wizard_step_name'), component: BasicInfoStep },
    { name: t('wizard_step_focus'), component: FocusStep },
    { name: t('wizard_step_schedule'), component: ScheduleStep },
    { name: t('wizard_step_options'), component: AdvancedOptionsStep },
    { name: t('wizard_step_complete'), component: ReviewStep }
  ];

  // Update form data when props change
  useEffect(() => {
    setFormData(initializeFormData(program));
  }, [program]);
  
  // Reset scroll position when changing steps
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  // Update formData with new values
  const updateFormData = (newData) => {
    setFormData(prevData => ({ ...prevData, ...newData }));
  };

  // Validate current step before proceeding
  const validateStep = () => {
    const newErrors = {};
    
    switch(currentStep) {
      case 0: // Basic Info
        if (!formData.name.trim()) {
          newErrors.name = t('wizard_error_name_required');
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
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

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl border border-gray-800">
        {/* Header with integrated progress bar */}
        <div className="border-b border-gray-800">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-white mr-4">
                {program ? t('wizard_title_edit') : t('wizard_title_new')}
              </h2>
              <div className="flex items-center h-8">
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    {/* Step indicator */}
                    <div 
                      className={`
                        group relative
                        ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}
                      `}
                      onClick={() => index <= currentStep && setCurrentStep(index)}
                    >
                      {/* Circle indicator */}
                      <div className={`
                        w-7 h-7 rounded-full flex items-center justify-center font-medium text-sm transition-all
                        ${index < currentStep 
                          ? 'bg-green-500 text-white' 
                          : index === currentStep 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                            : 'bg-gray-800 text-gray-500'}
                      `}>
                        {index + 1}
                      </div>
                      
                      {/* Step name tooltip */}
                      <div className={`
                        absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        bg-gray-800 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap
                        ${index === currentStep ? 'text-white' : 'text-gray-400'}
                      `}>
                        {step.name}
                      </div>
                    </div>
                    
                    {/* Connector line between steps */}
                    {index < steps.length - 1 && (
                      <div 
                        className={`
                          w-6 h-1 mx-0.5
                          ${index < currentStep 
                            ? 'bg-green-500' 
                            : 'bg-gray-800'}
                        `}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Scrollable content area */}
        <div 
          ref={contentRef}
          className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        >
          {/* Current step component */}
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        </div>
        
        {/* Footer with navigation buttons */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center bg-gray-900">
          <button
            type="button"
            onClick={currentStep === 0 ? onClose : goToPrevStep}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
          >
            {currentStep === 0 ? t('wizard_nav_cancel') : t('wizard_nav_back')}
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm"
            >
              {t('wizard_nav_next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm flex items-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {program ? t('wizard_nav_update') : t('wizard_nav_create')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramWizard;