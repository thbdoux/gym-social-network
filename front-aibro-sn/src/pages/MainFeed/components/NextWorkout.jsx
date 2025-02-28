import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

const NextWorkout = ({ workout }) => (
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
            {workout ? 'Scheduled for today' : 'No upcoming workouts'}
          </p>
        </div>
        {workout && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400">
            Today
          </span>
        )}
      </div>

      {workout ? (
        <>
          {/* Workout Info */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2">{workout.name}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm">
                <p className="text-gray-400">Time</p>
                <p className="text-white font-medium">
                  {new Date(workout.scheduled_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-gray-400">Duration</p>
                <p className="text-white font-medium">{workout.duration} min</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-400">Type</p>
                <p className="text-white font-medium capitalize">
                  {workout.split_method?.replace(/_/g, ' ') || 'Custom'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-gray-400">Exercises</p>
                <p className="text-white font-medium">{workout.exercises?.length || 0} total</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No workouts scheduled</p>
          <p className="text-sm">Add one from your workout plan</p>
        </div>
      )}
    </div>
  </div>
);
export default NextWorkout;