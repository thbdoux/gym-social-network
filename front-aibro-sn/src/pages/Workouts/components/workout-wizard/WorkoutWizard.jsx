import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import WorkoutTypeStep from './steps/WorkoutTypeStep';
import DateSelectionStep from './steps/DateSelectionStep';
import GymLocationStep from './steps/GymLocationStep';
import MoodDifficultyStep from './steps/MoodDifficultyStep';
import ExercisesStep from './steps/ExercisesStep';
import NotesStep from './steps/NotesStep';
import ReviewStep from './steps/ReviewStep';
import ProgramSelectionStep from './steps/ProgramSelectionStep';
import { POST_TYPE_COLORS } from '../../../../utils/postTypeUtils';

// Import React Query hooks
import { usePrograms } from '../../../../hooks/query/useProgramQuery';

// Initialize form data with defaults or existing data
const initializeFormData = (log) => {
  if (!log) {
    return {
      name: '',
      date: new Date().toISOString().split('T')[0],
      completed: true,
      exercises: [],
      mood_rating: 5,
      perceived_difficulty: 5,
      performance_notes: '',
      program: null,
      based_on_instance: null,
      gym: null,
      notes: '',
      duration: 45,
      media: []
    };
  }

  // Use existing log data if provided
  return {
    name: log.name || '',
    date: formatDate(log.date || new Date()),
    completed: log.completed ?? true,
    exercises: processExercises(log.exercises || []),
    mood_rating: log.mood_rating || 5,
    perceived_difficulty: log.perceived_difficulty || 5,
    performance_notes: log.performance_notes || '',
    program: processProgram(log.program),
    based_on_instance: processBasedOnInstance(log.based_on_instance),
    gym: log.gym ? (typeof log.gym === 'object' ? log.gym.id : log.gym) : null,
    notes: log.notes || '',
    duration: log.duration || 45,
    media: log.media || []
  };
};

// Helper functions for processing data
const formatDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Format DD/MM/YYYY to YYYY-MM-DD
  const parts = String(dateStr).split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  
  // Try to parse and standardize date format
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

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

const processProgram = (program) => {
  if (!program) return null;
  if (typeof program === 'object' && program !== null) return program.id;
  if (typeof program === 'string') return parseInt(program, 10);
  return program;
};

const processBasedOnInstance = (instance) => {
  if (!instance) return null;
  if (typeof instance === 'object') return instance.id;
  return typeof instance === 'string' ? parseInt(instance, 10) : instance;
};

const WorkoutWizard = ({ log = null, onSubmit, onClose, programs = [] }) => {
  const [formData, setFormData] = useState(() => initializeFormData(log));
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const colors = POST_TYPE_COLORS.workout_log;
  const contentRef = useRef(null);
  
  // Use React Query hook for programs
  const { 
    data: workoutPlans = [], 
    isLoading: programsLoading, 
    error: programsError 
  } = usePrograms();

  // Define steps in the wizard
  const steps = [
    { name: "Type", component: WorkoutTypeStep },
    { name: "Program", component: ProgramSelectionStep }, // New program selection step
    { name: "Date", component: DateSelectionStep },
    { name: "Location", component: GymLocationStep },
    { name: "Mood", component: MoodDifficultyStep },
    { name: "Exercises", component: ExercisesStep },
    { name: "Notes", component: NotesStep },
    { name: "Review", component: ReviewStep }
  ];

  // Update form data when props change
  useEffect(() => {
    setFormData(initializeFormData(log));
  }, [log]);
  
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
          newErrors.name = "Please choose or enter a workout name";
        }
        break;
      case 5: // Exercises
        if (formData.exercises.length === 0) {
          newErrors.exercises = "Add at least one exercise";
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
      onSubmit(formData);
    }
  };

  // Get current step component
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl border border-gray-800">
        {/* Header with integrated progress bar */}
        <div className="border-b border-gray-800">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-white mr-4">
                {log ? 'Edit Workout' : 'Log Your Workout'}
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
          
          {/* Current step title */}
          <div className="px-6 py-2 bg-gray-800/40">
            <p className="text-sm text-gray-400">
              Step {currentStep + 1}: <span className="text-white font-medium">{steps[currentStep].name}</span>
            </p>
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
            colors={colors}
            programs={workoutPlans.length > 0 ? workoutPlans : programs}
            programsLoading={programsLoading}
            programsError={programsError}
          />
        </div>
        
        {/* Footer with navigation buttons */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center bg-gray-900">
          <button
            type="button"
            onClick={currentStep === 0 ? onClose : goToPrevStep}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className={`px-6 py-2 ${colors.bg} ${colors.hoverBg} rounded-lg transition-colors font-medium text-sm`}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className={`px-6 py-2 ${colors.bg} ${colors.hoverBg} rounded-lg transition-colors font-medium text-sm`}
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutWizard;