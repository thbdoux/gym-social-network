import React from 'react';
import { Calendar, X, Plus } from 'lucide-react';

const LogWorkoutDialog = ({ 
  nextWorkout, 
  onLogProgramWorkout,
  isOpen,
  setIsOpen
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                 transition-colors flex items-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Log Workout</span>
      </button>
    );
  }

  if (!nextWorkout) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
          <div className="text-center">
            <p className="text-gray-400 mb-4">No active program found.</p>
            <p className="text-gray-400">Start a program to log workouts.</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full px-4 py-2 bg-gray-700 text-gray-300 
                     rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    w-full max-w-md bg-gray-800 rounded-xl p-6 z-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Log Today's Workout</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <button
          onClick={() => {
            onLogProgramWorkout(nextWorkout);
            setIsOpen(false);
          }}
          className="w-full p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 
                   transition-all text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-blue-400 
                           transition-colors">
                {nextWorkout.name}
              </h3>
              <p className="text-sm text-gray-400">
                {nextWorkout.program_name} • {nextWorkout.weekday_name}
              </p>
            </div>
          </div>
        </button>
      </div>
    </>
  );
};

export default LogWorkoutDialog;