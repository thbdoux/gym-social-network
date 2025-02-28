import React from 'react';
import { Calendar, Activity, Info, Clock, Dumbbell } from 'lucide-react';

const NextWorkout = ({ workout }) => {
  if (!workout) {
    return (
      <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1">
        {/* Progress Bar Background */}
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-green-500 opacity-75" />
        
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                Next Workout
              </h3>
              <p className="text-gray-400 mt-1">No upcoming workouts scheduled</p>
            </div>
          </div>

          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active program found</p>
            <p className="text-sm mt-2">Create or activate a program to see your next workout</p>
          </div>
        </div>
      </div>
    );
  }

  // Extract weekday name from date string
  const weekdayMatch = workout.date.match(/Next (.+)/);
  const weekdayName = weekdayMatch ? weekdayMatch[1] : 'Today';

  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1">
      {/* Progress Bar Background */}
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-green-500 opacity-75" />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
              Next Workout
            </h3>
            <p className="text-gray-400 mt-1">
              Coming up on {weekdayName}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400">
            Scheduled
          </span>
        </div>

        {/* Workout Info */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">{workout.workout_name}</h4>
          
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="flex items-start">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p className="text-white font-medium">{workout.duration} min</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Dumbbell className="w-4 h-4 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-gray-400">Exercises</p>
                <p className="text-white font-medium">{workout.exercise_count} total</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Activity className="w-4 h-4 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-gray-400">Split Type</p>
                <p className="text-white font-medium capitalize">
                  {workout.split_method?.replace(/_/g, ' ') || 'Custom'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-gray-400">Difficulty</p>
                <p className="text-white font-medium capitalize">
                  {workout.difficulty_level || 'Intermediate'}
                </p>
              </div>
            </div>
          </div>

          {workout.description && (
            <div className="mt-4 pt-4 border-t border-gray-700/30">
              <p className="text-sm text-gray-400">{workout.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NextWorkout;