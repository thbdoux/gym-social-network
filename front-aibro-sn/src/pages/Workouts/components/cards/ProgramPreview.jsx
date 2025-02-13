// components/cards/ProgramPreview.jsx
import React from 'react';
import { Calendar, Target, ChevronRight } from 'lucide-react';

const ProgramPreview = ({ programs, onViewAll, onSelectProgram }) => {

  // Get only active programs and sort by most recent
  const activePrograms = programs
    .filter(program => program.is_active)
    .slice(0, 2);

  return (
    <div className="bg-gray-800/40 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Active Programs</h2>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activePrograms.map(program => (
          <div 
            key={program.id}
            onClick={() => {
              console.log("Clicking program:", program);
              onSelectProgram(program);
            }}
            className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 
                     transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-white group-hover:text-blue-400 
                           transition-colors">
                {program.name}
              </h3>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 
                                    transform group-hover:translate-x-1 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-gray-400 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                {program.sessions_per_week}x weekly
              </div>
              <div className="flex items-center text-gray-400 text-sm">
                <Target className="w-4 h-4 mr-2" />
                <span className="capitalize">
                  {program.focus?.replace(/_/g, ' ') || 'General'}
                </span>
              </div>
            </div>

            {program.workouts?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-600/50">
                <p className="text-sm text-gray-400">
                  Next: {getNextWorkout(program.workouts)}
                </p>
              </div>
            )}
          </div>
        ))}

        {activePrograms.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-4">No active programs</p>
            <button
              onClick={onViewAll}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 
                       transition-colors text-sm"
            >
              Browse Programs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get the next scheduled workout
const getNextWorkout = (workouts) => {
  if (!workouts || workouts.length === 0) return 'No workouts scheduled';
  
  const today = new Date().getDay();
  // Convert Sunday from 0 to 7 for easier comparison
  const todayAdjusted = today === 0 ? 7 : today;
  
  // Find the next workout after today
  const nextWorkout = workouts
    .sort((a, b) => a.preferred_weekday - b.preferred_weekday)
    .find(w => w.preferred_weekday >= todayAdjusted);
  
  // If no workout found after today, get the first workout of the week
  const workout = nextWorkout || workouts[0];
  
  // Convert the day number back to day name
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = workout.preferred_weekday % 7; // Handle case where preferred_weekday is 7
  
  return `${workout.name} on ${days[dayIndex]}`;
};

export default ProgramPreview;