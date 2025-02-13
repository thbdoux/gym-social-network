import React from 'react';
import { X, Dumbbell, Calendar, ClipboardList } from 'lucide-react';

const WorkoutDetailModal = ({ workout, onClose }) => {
  if (!workout) return null;

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-start justify-between border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Dumbbell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{workout.name}</h3>
              <p className="text-gray-400 capitalize">{workout.split_method?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          {workout.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
              <p className="text-white">{workout.description}</p>
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-400 flex items-center">
              <ClipboardList className="w-4 h-4 mr-2" />
              Exercises
            </h4>
            
            {workout.exercises?.map((exercise, idx) => (
              <div key={idx} className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div>
                  <h5 className="text-lg font-medium text-white">{exercise.name}</h5>
                  {exercise.equipment && (
                    <p className="text-sm text-gray-400">Equipment: {exercise.equipment}</p>
                  )}
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="py-2 pr-4 text-sm font-medium text-gray-400">Set</th>
                        <th className="py-2 px-4 text-sm font-medium text-gray-400">Reps</th>
                        <th className="py-2 px-4 text-sm font-medium text-gray-400">Weight (kg)</th>
                        <th className="py-2 pl-4 text-sm font-medium text-gray-400">Rest (sec)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set, setIdx) => (
                        <tr key={setIdx} className="border-b border-gray-600/50 last:border-0">
                          <td className="py-2 pr-4 text-gray-300">{setIdx + 1}</td>
                          <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                          <td className="py-2 px-4 text-gray-300">{set.weight}</td>
                          <td className="py-2 pl-4 text-gray-300">{set.rest_time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {exercise.notes && (
                  <p className="text-sm text-gray-400 mt-2">
                    Notes: {exercise.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-800/80">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Scheduled for {WEEKDAYS[workout.preferred_weekday]}</span>
            </div>
            {workout.creator_username && (
              <span>Created by {workout.creator_username}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetailModal;