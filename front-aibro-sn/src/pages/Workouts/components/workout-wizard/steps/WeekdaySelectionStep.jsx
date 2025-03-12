import React from 'react';
import { Calendar, CheckCircle } from 'lucide-react';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WeekdaySelectionStep = ({ formData, updateFormData, colors, selectedPlan }) => {
  // Find occupied days in the program
  const getOccupiedDays = () => {
    if (!selectedPlan || !selectedPlan.workouts) return [];
    
    // If we're editing an existing workout, exclude its current day
    const currentWorkoutId = formData.id;
    return selectedPlan.workouts
      .filter(w => !currentWorkoutId || w.id !== currentWorkoutId)
      .map(w => w.preferred_weekday);
  };
  
  const occupiedDays = getOccupiedDays();

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h2 className="text-2xl font-bold text-white">
          Select Day
        </h2>
      </div>
      
      {/* Day selection grid */}
      <div className="grid grid-cols-7 gap-3">
        {WEEKDAYS.map((day, i) => {
          const isOccupied = occupiedDays.includes(i);
          const isSelected = formData.preferred_weekday === i;
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => updateFormData({ preferred_weekday: i })}
              disabled={isOccupied && !isSelected}
              className={`
                p-3 rounded-lg flex flex-col items-center justify-center transition-all h-24
                ${isSelected
                  ? `${colors.bg} text-white`
                  : isOccupied
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
              `}
            >
              <Calendar className="w-6 h-6 mb-2" />
              <span className="text-base font-medium">{day}</span>
              
              {/* Status indicator */}
              {isSelected && (
                <div className="mt-2 text-white flex items-center text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>Selected</span>
                </div>
              )}
              
              {isOccupied && !isSelected && (
                <div className="mt-2 text-gray-500 text-xs">
                  Occupied
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekdaySelectionStep;