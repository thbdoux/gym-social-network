// components/modals/WorkoutDetailModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import EnhancedWorkoutForm from '../forms/EnhancedWorkoutForm';

const WorkoutDetailModal = ({
  workout = null,
  onClose,
  onSave,
  isNew = false
}) => {
  const handleSubmit = async (formData) => {
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving workout:', err);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">
                {isNew ? 'Create Workout Template' : 'Edit Workout Template'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <EnhancedWorkoutForm
                initialData={workout}
                onSubmit={handleSubmit}
                onCancel={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkoutDetailModal;