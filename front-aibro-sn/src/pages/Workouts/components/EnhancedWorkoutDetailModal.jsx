// EnhancedWorkoutDetailModal.jsx - Replacement for WorkoutDetailModal
import React from 'react';
import { X } from 'lucide-react';
import EnhancedWorkoutForm from './EnhancedWorkoutForm';

const EnhancedWorkoutDetailModal = ({
  workout = null,
  onClose,
  onSave,
  isNew = false
}) => {
  const handleSubmit = async (formData) => {
    try {
      const processedData = {
        ...formData,
        id: workout?.id, // Preserve workout ID if it exists
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
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {isNew ? 'Create Workout Template' : 'Edit Workout Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 68px)' }}>
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
  );
};

export default EnhancedWorkoutDetailModal;