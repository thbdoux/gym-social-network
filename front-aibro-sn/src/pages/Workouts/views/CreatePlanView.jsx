import React from 'react';
import { ArrowLeft } from 'lucide-react';
import WorkoutPlanForm from '../components/forms/WorkoutPlanForm';
import { useWorkout } from '../contexts/WorkoutContext';

const CreatePlanView = ({
  setView,
  createPlan,
  setError
}) => {
  const { clearSelectedWorkouts } = useWorkout();

  const handleCreatePlan = async (planData) => {
    try {
      await createPlan({
        ...planData,
        is_public: true, // Default to public for now
      });
      clearSelectedWorkouts(); // Clear any selected workouts from context
      setView('plans'); // Navigate back to plans list
    } catch (err) {
      console.error('Error creating plan:', err);
      setError(err.response?.data?.detail || 'Failed to create workout plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => {
            clearSelectedWorkouts();
            setView('plans');
          }}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Go back to plans"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Workout Plan</h1>
          <p className="text-gray-400 mt-1">
            Design a new workout plan and add exercises
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-gray-800/40 rounded-xl p-6">
        <WorkoutPlanForm
          onSubmit={handleCreatePlan}
          onCancel={() => {
            clearSelectedWorkouts();
            setView('plans');
          }}
        />
      </div>

      {/* Helper Text */}
      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h3 className="text-sm font-medium text-blue-400 mb-2">
          Tips for creating an effective plan:
        </h3>
        <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
          <li>Define clear goals and target areas</li>
          <li>Consider your available time and equipment</li>
          <li>Balance workout intensity across the week</li>
          <li>Include rest and recovery days</li>
        </ul>
      </div>
    </div>
  );
};

export default CreatePlanView;