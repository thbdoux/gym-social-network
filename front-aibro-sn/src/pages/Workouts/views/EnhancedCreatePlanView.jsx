import React, { useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import EnhancedProgramForm from './../components/EnhancedProgramForm';

const EnhancedCreatePlanView = ({
  onCreatePlan,
  onCancel,
  onError,
  workoutTemplates
}) => {
  const [error, setError] = useState(null);

  const handleCreatePlan = async (planData) => {
    try {
      await onCreatePlan({
        ...planData,
        is_public: planData.is_public !== false,  // Default to true if not specified
      });
      onCancel(); // Navigate back to plans list on success
    } catch (err) {
      console.error('Error creating plan:', err);
      setError(err.response?.data?.detail || 'Failed to create workout plan');
      onError?.(err.response?.data?.detail || 'Failed to create workout plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Go back to plans"
        >
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Workout Plan</h1>
          <p className="text-gray-400 mt-1">
            Design a new workout plan and add exercises
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-gray-800/40 rounded-xl p-6">
        <EnhancedProgramForm
          onSubmit={handleCreatePlan}
          onCancel={onCancel}
        />
      </div>

      {/* Helper Tips */}
      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center">
          <Info className="w-4 h-4 mr-2" />
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

export default EnhancedCreatePlanView;