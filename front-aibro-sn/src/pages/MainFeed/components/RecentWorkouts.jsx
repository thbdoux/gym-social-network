import React from 'react';
import { Award, Activity, ChevronRight,  } from 'lucide-react';

// RecentWorkouts Component
const RecentWorkouts = ({ workouts }) => (
  <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1">
    {/* Progress Bar Background */}
    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-red-500 to-orange-500 opacity-75" />
    
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors">
            Recent Workouts
          </h3>
          <p className="text-gray-400 mt-1">Your last training sessions</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400">
          Last 7 Days
        </span>
      </div>

      {workouts && workouts.length > 0 ? (
        <div className="space-y-4 mb-6">
          {workouts.map((workout) => (
            <div 
              key={workout.id} 
              className="bg-gray-900/50 rounded-lg p-4 transition-colors hover:bg-gray-900/70"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-white">{workout.workout_name}</h4>
                <span className="text-sm text-gray-400">
                  {new Date(workout.date).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="text-sm">
                  <p className="text-gray-400">Duration</p>
                  <p className="text-white font-medium">{workout.duration} min</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-400">Location</p>
                  <p className="text-white font-medium">{workout.gym_name || 'Home'}</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-400">Exercises</p>
                  <p className="text-white font-medium">{workout.exercises?.length || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No recent workouts</p>
          <p className="text-sm">Time to start training!</p>
        </div>
      )}

      {/* View All Button */}
      <button className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group">
        <span>View All History</span>
        <ChevronRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

export default RecentWorkouts;