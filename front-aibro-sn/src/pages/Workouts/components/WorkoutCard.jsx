// src/pages/Workouts/components/WorkoutCard.jsx
import React, { useState } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';

const WorkoutCard = ({ workout, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Early return if workout is not provided
  if (!workout) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{workout.name}</h3>
            <p className="text-gray-400">
              {workout.split_method?.replace(/_/g, ' ')} • {workout.frequency}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(workout)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(workout.id)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 space-y-4">
          {workout.description && (
            <p className="text-gray-400">{workout.description}</p>
          )}
          
          {/* Exercises */}
          <div className="space-y-6">
            {workout.exercises?.map((exercise, index) => (
              <div key={index} className="border-t border-gray-700 pt-4">
                <h4 className="font-bold text-white mb-2">{exercise.name}</h4>
                <p className="text-gray-400 mb-4">Equipment: {exercise.equipment || 'None'}</p>
                
                {/* Sets Table */}
                {exercise.sets && exercise.sets.length > 0 && (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                      <div className="text-gray-400">Reps</div>
                      <div className="text-gray-400">Weight (kg)</div>
                      <div className="text-gray-400">Rest (sec)</div>
                    </div>
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-3 gap-4 text-sm py-2 border-t border-gray-800">
                        <div className="text-gray-300">{set.reps}</div>
                        <div className="text-gray-300">{set.weight}</div>
                        <div className="text-gray-300">{set.rest_time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutCard;