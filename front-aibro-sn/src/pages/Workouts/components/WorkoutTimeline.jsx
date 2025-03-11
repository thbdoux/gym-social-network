import React from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import EmptyState from './EmptyState';

const WorkoutTimeline = ({
  logs,
  nextWorkout,
  logsLoading,
  plansLoading,
  activeProgram,
  setSelectedWorkout,
  setShowWorkoutModal,
  setSelectedLog,
  setShowLogForm,
  handleViewNextWorkout
}) => {
  return (
    <div className="relative p-6">
      {(logsLoading || plansLoading) ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : (nextWorkout || logs.length > 0) ? (
        <div className="relative">
          {/* Horizontal timeline line */}
          <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-700"></div>
          
          <div className="flex flex-col lg:flex-row items-start mt-16 lg:mt-0 space-y-8 lg:space-y-0 lg:space-x-6">
            {/* Past Workouts - Left side */}
            <div className={`${nextWorkout ? 'lg:w-8/12' : 'lg:w-5/6'} relative`}>
              {logs.length > 0 ? (
                <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
                  {logs.slice(0, 3).sort((a, b) => {
                    // Sort logs by date - oldest first (left) to newest (right)
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateA - dateB;
                  }).map((log, index) => {
                    // Calculate relative date label
                    let logDate;
                    try {
                      // Handle French date format (DD/MM/YYYY)
                      if (log.date.includes('/')) {
                        const parts = log.date.split('/');
                        if (parts.length === 3) {
                          // Day/Month/Year format
                          logDate = new Date(parts[2], parts[1] - 1, parts[0]);
                        } else {
                          logDate = new Date(log.date);
                        }
                      } else {
                        // Standard ISO format
                        logDate = new Date(log.date);
                      }
                    } catch (e) {
                      // Fallback if parsing fails
                      logDate = new Date();
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
                    
                    // Get mood emoji
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
                    
                    return (
                      <div key={log.id} className="relative">
                        {/* Timeline dot and date label */}
                        <div className="absolute left-1/2 lg:left-1/2 transform -translate-x-1/2 top-0 lg:-top-10 flex flex-col items-center z-20">
                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-md"></div>
                          <div className="mt-2 text-green-400 text-sm font-medium whitespace-nowrap">{dateLabel}</div>
                          {/* Vertical connector line */}
                          <div className="w-0.5 h-16 bg-green-700 mt-2"></div>
                        </div>
                        
                        {/* Simplified Workout Card */}
                        <div className="mt-20 lg:mt-16">
                          <div 
                            className="bg-gray-800 border border-green-700/30 rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-green-500/50"
                            onClick={() => {
                              setSelectedWorkout(log);
                              setShowWorkoutModal(true);
                            }}
                          >
                            {/* Status Indicator Line - Green for completed workout */}
                            <div className="h-1 w-full bg-gradient-to-r from-green-400 to-green-600"></div>
                            
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">{log.workout_name}</h3>
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
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-12">
                  <EmptyState
                    title="No workouts logged"
                    description="Log your first workout"
                    action={{
                      label: 'Log Workout',
                      onClick: () => {
                        setSelectedLog(null); 
                        setShowLogForm(true);
                      }
                    }}
                    compact={true}
                  />
                </div>
              )}
            </div>
            
            {/* Today marker - Center point of timeline */}
            <div className={`${nextWorkout ? 'lg:w-1/12' : 'lg:w-1/6'} hidden lg:block relative`}>
              <div className="absolute left-1/2 transform -translate-x-1/2 top-0 lg:-top-10 flex flex-col items-center z-20">
                <div className="w-4 h-4 rounded-full bg-gray-500 shadow-md"></div>
                <div className="mt-2 text-gray-400 text-sm font-medium">Today</div>
              </div>
            </div>
            
            {/* Next Workout - Right side with future indicator */}
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
                  <div className="w-0.5 h-16 bg-blue-700 mt-2"></div>
                </div>
                
                {/* Upcoming workout card */}
                <div className="mt-20 lg:mt-16" onClick={handleViewNextWorkout}>
                  <div className="bg-gray-800 border border-blue-700/30 rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-500/50">
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
                        
                        {activeProgram && (
                          <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded-full">
                            {activeProgram.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-8">
          <EmptyState
            title="No workout history"
            description="Start your fitness journey by logging a workout or setting up a program"
            action={{
              label: 'Get Started',
              onClick: () => {
                setSelectedLog(null); 
                setShowLogForm(true);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default WorkoutTimeline;