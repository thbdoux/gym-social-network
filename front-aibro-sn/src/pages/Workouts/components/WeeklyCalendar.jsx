import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

const WeeklyCalendar = ({ workouts }) => {
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Group workouts by day
  const workoutsByDay = WEEKDAYS.map((day, index) => ({
    day,
    workouts: workouts.filter(w => w.preferred_weekday === index)
  }));

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-gray-700">
        {WEEKDAYS.map(day => (
          <div key={day} className="bg-gray-800/80 px-4 py-3">
            <p className="text-sm font-medium text-gray-400">{day.slice(0, 3)}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-700 h-48">
        {workoutsByDay.map(({ day, workouts }) => (
          <div key={day} className="bg-gray-800 p-2 overflow-y-auto">
            {workouts.map(workout => (
              <div
                key={workout.instance_id}
                className="mb-2 p-2 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer group"
              >
                <p className="text-sm font-medium text-blue-400 group-hover:text-blue-300 truncate">
                  {workout.name}
                </p>
                <div className="flex items-center mt-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{workout.exercises?.length || 0} exercises</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyCalendar;