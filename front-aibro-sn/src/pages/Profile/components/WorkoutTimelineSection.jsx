import React, { useState } from 'react';
import { 
  Dumbbell, Users, TrendingUp, Calendar, MapPin
} from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';

const WorkoutTimelineSection = ({ workoutLogs, onWorkoutSelect, user }) => {
  const [hoveredWorkout, setHoveredWorkout] = useState(null);

  // Helper function to format date relative to today
  const getRelativeDateLabel = (dateString) => {
    let logDate;
    try {
      // Handle different date formats
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Day/Month/Year format
          logDate = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          logDate = new Date(dateString);
        }
      } else {
        // Standard ISO format
        logDate = new Date(dateString);
      }
    } catch (e) {
      // Fallback if parsing fails
      return dateString;
    }
    
    const today = new Date();
    
    // Reset time parts to compare dates properly
    today.setHours(0, 0, 0, 0);
    logDate.setHours(0, 0, 0, 0);
    
    // Simple difference in days calculation
    const diffMs = today.getTime() - logDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    let dateLabel = "Today";
    if (diffDays === 1) dateLabel = "Yesterday";
    else if (diffDays > 1) dateLabel = `${diffDays} days ago`;
    else if (diffDays === -1) dateLabel = "Tomorrow";
    else if (diffDays < -1) dateLabel = `In ${Math.abs(diffDays)} days`;
    
    return dateLabel;
  };

  // Get mood emoji based on rating
  const getMoodEmoji = (rating) => {
    switch(rating) {
      case 1: return "😞";
      case 2: return "😕";
      case 3: return "😐";
      case 4: return "🙂";
      case 5: return "😄";
      default: return "🙂";
    }
  };
  
  // Get gym display for a workout
  const getGymDisplay = (workout) => {
    if (workout && workout.gym_name && workout.gym_location) {
      return `${workout.gym_name} - ${workout.gym_location}`;
    } else if (user?.preferred_gym_details) {
      const gym = user.preferred_gym_details;
      return `${gym.name} - ${gym.location}`;
    }
    return null;
  };
  
  // Get current user's next workout if available
  const nextWorkout = user?.current_program?.workouts?.find(w => 
    !workoutLogs.some(log => log.workout_name === w.name && getRelativeDateLabel(log.date) === "Today")
  );

  return (
    <div className="relative p-6 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl overflow-hidden shadow-lg">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-10 group">
        <Calendar className="w-5 h-5 text-blue-400 transition-transform duration-300 group-hover:rotate-12" />
        <span className="group-hover:text-blue-300 transition-colors duration-300">Workout Timeline</span>
      </h2>

      {(workoutLogs.length > 0 || nextWorkout) ? (
        <div className="relative">
          {/* Timeline Container */}
          <div className="relative pt-10 pb-6">
            {/* Horizontal timeline line - ensure it passes through all points */}
            <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-700 z-10"></div>
          
            <div className="flex flex-col lg:flex-row items-start mt-16 lg:mt-0 space-y-8 lg:space-y-0 lg:space-x-6">
              {/* Past Workouts - Now on the left (inverted) */}
              <div className={`${nextWorkout ? 'lg:w-8/12' : 'lg:w-5/6'} relative`}>
                {workoutLogs.length > 0 ? (
                  <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
                    {workoutLogs.slice(0, 3).map((log, index) => (
                      <div key={log.id} className="relative">
                        {/* Timeline dot and date label */}
                        <div className="absolute left-1/2 lg:left-1/2 transform -translate-x-1/2 top-0 lg:-top-10 flex flex-col items-center z-20">
                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-md"></div>
                          <div className="mt-2 text-green-400 text-sm font-medium whitespace-nowrap">
                            {getRelativeDateLabel(log.date)}
                          </div>
                          {/* Vertical connector line - connecting to horizontal line */}
                          <div className="w-0.5 h-10 bg-green-700 mt-2"></div>
                        </div>
                        
                        {/* Workout Card */}
                        <div className="mt-20 lg:mt-16">
                          <div 
                            className={`bg-gray-800 border ${hoveredWorkout === log.id ? 'border-green-500/50 shadow-lg' : 'border-green-700/30'} rounded-xl overflow-hidden transition-all duration-200 cursor-pointer`}
                            onClick={() => onWorkoutSelect(log)}
                            onMouseEnter={() => setHoveredWorkout(log.id)}
                            onMouseLeave={() => setHoveredWorkout(null)}
                          >
                            {/* Status Indicator Line */}
                            <div className="h-1 w-full bg-gradient-to-r from-green-400 to-green-600"></div>
                            
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">
                                  {log.workout_name || "Workout"}
                                </h3>
                                <div className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
                                  {getMoodEmoji(log.rating || 4)}
                                </div>
                              </div>
                              
                              <div className="mt-3 flex items-center justify-between">
                                <span className="flex items-center text-sm text-gray-400">
                                  <TrendingUp className="w-4 h-4 mr-1 text-green-400" />
                                  {log.exercises?.length || 0} exercises
                                </span>
                                
                                {log.program_name && (
                                  <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded-full">
                                    {log.program_name}
                                  </span>
                                )}
                              </div>
                              
                              {/* Gym Location */}
                              {getGymDisplay(log) && (
                                <div className="mt-2 flex items-center text-sm text-gray-400">
                                  <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                                  <span className="truncate text-xs">{getGymDisplay(log)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 mt-12">
                    <div className="text-center">
                      <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-1">No workout history</h3>
                      <p className="text-gray-400 mb-4">Start your fitness journey by logging a workout</p>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
                        Log Workout
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Today marker - Center point of timeline */}
              <div className={`${nextWorkout ? 'lg:w-1/12' : 'lg:w-1/6'} hidden lg:block relative`}>
                <div className="absolute left-1/2 transform -translate-x-1/2 top-0 lg:-top-10 flex flex-col items-center z-20">
                  <div className="w-4 h-4 rounded-full bg-gray-500 shadow-md"></div>
                  <div className="mt-2 text-gray-400 text-sm font-medium">Today</div>
                  {/* Vertical connector line */}
                  <div className="w-0.5 h-10 bg-gray-600 mt-2"></div>
                </div>
              </div>
              
              {/* Next Workout - Now on the right side (inverted) */}
              {nextWorkout && (
                <div className="lg:w-1/4 relative">
                  {/* Timeline dot and label */}
                  <div className="absolute left-1/2 lg:left-1/2 transform -translate-x-1/2 top-0 lg:-top-10 flex flex-col items-center z-20">
                    <div className="w-4 h-4 rounded-full bg-blue-500 shadow-md"></div>
                    <div className="mt-2 text-blue-400 text-sm font-medium whitespace-nowrap">
                      Coming up on {nextWorkout.preferred_weekday !== undefined ? 
                        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][nextWorkout.preferred_weekday] : 
                        'soon'}
                    </div>
                    {/* Vertical connector line */}
                    <div className="w-0.5 h-10 bg-blue-700 mt-2"></div>
                  </div>
                  
                  {/* Upcoming workout card */}
                  <div className="mt-20 lg:mt-16">
                    <div 
                      className="bg-gray-800 border border-blue-700/30 rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-500/50"
                      onClick={() => onWorkoutSelect(nextWorkout)}
                      onMouseEnter={() => setHoveredWorkout('next')}
                      onMouseLeave={() => setHoveredWorkout(null)}
                    >
                      {/* Status Indicator Line - Blue for upcoming workout */}
                      <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                      
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">{nextWorkout.name}</h3>
                          <div className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded-full">
                            Upcoming
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className="flex items-center text-sm text-gray-400">
                            <TrendingUp className="w-4 h-4 mr-1 text-blue-400" />
                            {nextWorkout.exercises?.length || 0} exercises
                          </span>
                          
                          {user?.current_program && (
                            <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded-full">
                              {user.current_program.name}
                            </span>
                          )}
                        </div>
                        
                        {/* Gym Location */}
                        {user?.preferred_gym_details && (
                          <div className="mt-2 flex items-center text-sm text-gray-400">
                            <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                            <span className="truncate text-xs">{user.preferred_gym_details.name} - {user.preferred_gym_details.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-1">No workout history</h3>
            <p className="text-gray-400 mb-4">Start your fitness journey by logging a workout</p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
              Log Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutTimelineSection;