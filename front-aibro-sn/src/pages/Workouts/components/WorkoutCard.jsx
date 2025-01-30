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
              {workout.split_method?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(workout)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
            title="Edit workout"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(workout.id)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
            title="Delete workout"
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

      {/* Description */}
      {workout.description && (
        <p className="mt-2 text-gray-400">{workout.description}</p>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Exercises */}
          <div className="space-y-6">
            {workout.exercises?.map((exercise, index) => (
              <div key={index} className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-lg">{exercise.name}</h4>
                    {exercise.equipment && (
                      <p className="text-gray-400 text-sm mt-1">
                        Equipment: {exercise.equipment}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Sets Table */}
                {exercise.sets && exercise.sets.length > 0 && (
                  <div className="mt-4 bg-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-600">
                          <th className="py-2 px-4 text-left text-gray-300 font-medium">Set</th>
                          <th className="py-2 px-4 text-left text-gray-300 font-medium">Reps</th>
                          <th className="py-2 px-4 text-left text-gray-300 font-medium">Weight (kg)</th>
                          <th className="py-2 px-4 text-left text-gray-300 font-medium">Rest (sec)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, setIndex) => (
                          <tr key={setIndex} className="border-t border-gray-600">
                            <td className="py-2 px-4 text-gray-300">{setIndex + 1}</td>
                            <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                            <td className="py-2 px-4 text-gray-300">{set.weight}</td>
                            <td className="py-2 px-4 text-gray-300">{set.rest_time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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