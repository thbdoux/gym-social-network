import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const WeeklyCalendar = ({ workouts, onWorkoutClick, onDayChange }) => {
  const { t } = useLanguage();
  
  // Using translations from translations.js for weekdays
  const WEEKDAYS = [
    t('monday'),
    t('tuesday'), 
    t('wednesday'), 
    t('thursday'), 
    t('friday'), 
    t('saturday'), 
    t('sunday')
  ];
  
  const SHORT_DAYS = [
    t('mon'), 
    t('tue'), 
    t('wed'), 
    t('thu'), 
    t('fri'), 
    t('sat'), 
    t('sun')
  ];
  
  // Group workouts by day
  const workoutsByDay = WEEKDAYS.map((day, index) => ({
    day,
    shortDay: SHORT_DAYS[index],
    workouts: workouts.filter(w => w.preferred_weekday === index)
  }));

  // Determine if a day has workouts
  const hasWorkout = (day) => workoutsByDay[day].workouts.length > 0;

  // Handle drag start
  const handleDragStart = (e, workout) => {
    e.dataTransfer.setData('workoutId', workout.id);
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e, dayIndex) => {
    e.preventDefault();
    const workoutId = e.dataTransfer.getData('workoutId');
    if (workoutId && onDayChange) {
      onDayChange(workoutId, dayIndex);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex space-x-2">
        {workoutsByDay.map((dayData, index) => (
          <div 
            key={`day-${index}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex-1 rounded-lg transition-all ${
              hasWorkout(index) 
                ? 'bg-gradient-to-b from-blue-900/40 to-blue-800/20 border border-blue-500/30' 
                : 'bg-gray-800/40 border border-gray-700/30'
            }`}
          >
            <div className={`text-center py-2 border-b ${
              hasWorkout(index) 
                ? 'border-blue-500/30 text-blue-300' 
                : 'border-gray-700/30 text-gray-400'
            } font-medium text-sm`}>
              {dayData.shortDay}
            </div>
            
            <div className="p-2 h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
              {dayData.workouts.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-gray-500">{t('rest_day')}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {dayData.workouts.map((workout, idx) => (
                    <div
                      key={`workout-${idx}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, workout)}
                      className="px-2 py-1.5 bg-blue-500/10 rounded hover:bg-blue-500/20 
                               cursor-move transition-colors group"
                    >
                      <p className="text-xs font-medium text-blue-400 group-hover:text-blue-300 truncate">
                        {workout.name}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{workout.exercises?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-end text-xs text-gray-400 mt-1 px-2">
        <div className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
          <span>{t('workout_day')}</span>
        </div>
        <div className="flex items-center ml-4">
          <span className="w-2 h-2 rounded-full bg-gray-600 mr-1"></span>
          <span>{t('rest_day')}</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;