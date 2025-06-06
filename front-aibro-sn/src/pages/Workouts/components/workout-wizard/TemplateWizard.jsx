import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Save, Info } from 'lucide-react';
import WorkoutTypeStep from './steps/WorkoutTypeStep';
import ExercisesStep from './steps/ExercisesStep';
import WeekdaySelectionStep from './steps/WeekdaySelectionStep';
import ReviewTemplateStep from './steps/ReviewTemplateStep';
import { useLanguage } from '../../../../context/LanguageContext';

// Initialize form data with defaults or existing data
const initializeFormData = (template) => {
  if (!template) {
    return {
      name: '',
      description: '',
      split_method: 'full_body',
      preferred_weekday: 0,
      difficulty_level: 'intermediate',
      estimated_duration: 60,
      equipment_required: [],
      tags: [],
      exercises: [],
      is_public: true
    };
  }

  // Use existing template data if provided
  return {
    id: template.id,
    name: template.name || '',
    description: template.description || '',
    split_method: template.split_method || 'full_body',
    preferred_weekday: template.preferred_weekday || 0,
    difficulty_level: template.difficulty_level || 'intermediate',
    estimated_duration: template.estimated_duration || 60,
    equipment_required: template.equipment_required || [],
    tags: template.tags || [],
    exercises: processExercises(template.exercises || []),
    is_public: template.is_public !== false
  };
};

// Helper function for processing exercises
const processExercises = (exercises) => {
  return exercises.map(exercise => ({
    id: exercise.id || Math.floor(Date.now() + Math.random() * 1000),
    name: exercise.name || '',
    equipment: exercise.equipment || '',
    notes: exercise.notes || '',
    order: exercise.order || 0,
    sets: (exercise.sets || []).map(set => ({
      id: set.id || Math.floor(Date.now() + Math.random() * 1000),
      reps: set.reps || 0,
      weight: set.weight || 0,
      rest_time: set.rest_time || 60,
      order: set.order || 0
    }))
  }));
};

const TemplateWizard = ({ 
  template = null, 
  onSubmit, 
  onClose, 
  inProgram = false,
  selectedPlan = null 
}) => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState(() => initializeFormData(template));
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [showStepInfo, setShowStepInfo] = useState(false);
  const contentRef = useRef(null);
  
  // Define colors for steps
  const colors = {
    bg: 'bg-blue-600',
    hoverBg: 'hover:bg-blue-700',
    text: 'text-blue-400',
    borderLight: 'border-blue-500/50'
  };
  
  // Define steps in the wizard with translations
  const getSteps = () => {
    const steps = [
      { 
        name: t("wizard_step_type"), 
        component: WorkoutTypeStep,
        description: t("wizard_step_type_description") 
      },
      { 
        name: t("wizard_step_exercises"), 
        component: ExercisesStep,
        description: t("wizard_step_exercises_description")
      }
    ];
    
    // Add weekday selection step only for program workouts
    if (inProgram) {
      steps.push({ 
        name: t("wizard_step_day"), 
        component: WeekdaySelectionStep,
        description: t("wizard_step_day_description")
      });
    }
    
    // Add review step
    steps.push({ 
      name: t("wizard_step_review"), 
      component: ReviewTemplateStep,
      description: t("wizard_step_review_description")
    });
    
    return steps;
  };
  
  const steps = getSteps();

  // Get wizard title based on context and language
  const getWizardTitle = () => {
    if (template) {
      return t("edit_workout");
    } else if (inProgram) {
      return t("add_workout_to_program");
    } else {
      return t("create_template");
    }
  };

  // Update form data when props change
  useEffect(() => {
    setFormData(initializeFormData(template));
  }, [template]);
  
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
      case 0: // Workout Type
        if (!formData.name.trim()) {
          newErrors.name = t("error_workout_name_required");
        }
        break;
      case 1: // Exercises
        if (formData.exercises.length === 0) {
          newErrors.exercises = t("error_add_exercises");
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
      setShowStepInfo(false);
    }
  };

  // Navigate to previous step
  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setShowStepInfo(false);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateStep()) {
      onSubmit(formData);
    }
  };

  // Get current step component
  const CurrentStepComponent = steps[currentStep].component;

  // Progress calculation
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl border border-gray-800">
        {/* Header with integrated progress bar */}
        <div className="border-b border-gray-800">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-white mr-4">
                {getWizardTitle()}
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
                      aria-label={`${t("go_to_step")} ${index + 1}: ${step.name}`}
                    >
                      {/* Circle indicator */}
                      <div className={`
                        w-7 h-7 rounded-full flex items-center justify-center font-medium text-sm transition-all
                        ${index < currentStep 
                          ? 'bg-green-500 text-white' 
                          : index === currentStep 
                            ? `${colors.bg} text-white shadow-md shadow-blue-600/20` 
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
                        z-10
                      `}>
                        {step.name}
                      </div>
                    </div>
                    
                    {/* Connector line between steps */}
                    {index < steps.length - 1 && (
                      <div 
                        className={`
                          w-8 h-1 mx-0.5
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
              aria-label={t("close")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Current step title with info button */}
          <div className="px-6 py-2 bg-gray-800/40 flex justify-between items-center">
            <p className="text-sm text-gray-400">
              {t("step")} {currentStep + 1}: <span className="text-white font-medium">{steps[currentStep].name}</span>
            </p>
            <button
              className={`
                p-1 rounded-full text-xs transition-colors
                ${showStepInfo ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-400'}
              `}
              onClick={() => setShowStepInfo(!showStepInfo)}
              aria-label={showStepInfo ? t("hide_step_info") : t("show_step_info")}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          
          {/* Step info section - collapsible */}
          {showStepInfo && (
            <div className="px-6 py-3 bg-blue-500/10 border-y border-blue-500/20 animate-fadeIn">
              <p className="text-sm text-blue-300">
                {steps[currentStep].description}
              </p>
            </div>
          )}
          
          {/* Progress bar */}
          <div className="h-1 bg-gray-800">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Scrollable content area */}
        <div 
          ref={contentRef}
          className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        >
          {/* Current step component */}
          <div className="transition-opacity duration-300 ease-in-out">
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              colors={colors}
              inProgram={inProgram}
              selectedPlan={selectedPlan}
            />
          </div>
        </div>
        
        {/* Footer with navigation buttons */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center bg-gray-900">
          <button
            type="button"
            onClick={currentStep === 0 ? onClose : goToPrevStep}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
            aria-label={currentStep === 0 ? t("cancel") : t("back")}
          >
            {currentStep === 0 ? t("cancel") : t("back")}
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className={`px-6 py-2 ${colors.bg} ${colors.hoverBg} rounded-lg transition-colors font-medium text-sm`}
              aria-label={t("next")}
            >
              {t("next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className={`px-6 py-2 ${colors.bg} ${colors.hoverBg} rounded-lg transition-colors font-medium text-sm`}
              aria-label={t("save")}
            >
              {t("save")}
            </button>
          )}
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TemplateWizard;