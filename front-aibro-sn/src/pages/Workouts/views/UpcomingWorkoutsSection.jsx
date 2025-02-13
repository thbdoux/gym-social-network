import React from 'react';
import { Calendar, Clock, Dumbbell } from 'lucide-react';

const UpcomingWorkoutsSection = ({ 
  workoutInstances, 
  onLogWorkout,
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="bg-gray-800/40 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Upcoming Workouts
        </h2>
        <div className="h-32 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!workoutInstances?.length) {
    return (
      <div className="bg-gray-800/40 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Upcoming Workouts
        </h2>
        <div className="text-center py-8">
          <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No upcoming workouts</p>
          <p className="text-gray-500 text-sm mt-1">
            Select a program to see your upcoming workouts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/40 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        Upcoming Workouts
      </h2>
      <div className="space-y-4">
        {workoutInstances.map((instance) => (
          <div 
            key={instance.instance_id} 
            className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-white">{instance.name}</h3>
              <div className="flex items-center space-x-4 mt-1 text-gray-400 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {instance.weekday_name}
                </div>
                {instance.estimated_duration && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {instance.estimated_duration} min
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onLogWorkout(instance)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                       transition-colors text-sm font-medium"
            >
              Log Workout
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingWorkoutsSection;