// components/modals/WorkoutDetailModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import EnhancedWorkoutForm from './EnhancedWorkoutForm';

const WorkoutDetailModal = ({
  workout = null,
  onClose,
  onSave,
  isNew = false
}) => {
  const handleSubmit = async (formData) => {
    try {
      const processedData = {
        ...formData,
        exercises: formData.exercises.map((exercise, exIndex) => {
          return {
            id: exercise.id, // Preserve exercise ID if it exists
            name: exercise.name,
            equipment: exercise.equipment || '',
            notes: exercise.notes || '',
            order: exIndex,
            sets: exercise.sets.map((set, setIndex) => {
              return {
                id: set.id, // Preserve set ID if it exists
                reps: Number(set.reps) || 0,
                weight: Number(set.weight) || 0,
                rest_time: Number(set.rest_time) || 60,
                order: setIndex
              };
            })
          };
        })
      };
      await onSave(processedData);
      onClose();
    } catch (err) {
      console.error('Error saving workout:', err);
      // You might want to show an error message to the user here
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