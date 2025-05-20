import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';

const WeekdaySelectionStep = ({ formData, updateFormData, colors, selectedPlan }) => {
  const { t } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);
  
  // Get full weekday names for each language
  const weekdaysFull = [
    t("monday"), t("tuesday"), t("wednesday"), 
    t("thursday"), t("friday"), t("saturday"), t("sunday")
  ];
  
  // Get abbreviated weekday names
  const weekdaysShort = [
    t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")
  ];
  
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
  
  // Show recommended day based on program balance
  const getRecommendedDay = () => {
    if (!selectedPlan || !selectedPlan.workouts) return null;
    
    // Count workouts per day
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    selectedPlan.workouts.forEach(workout => {
      if (workout.preferred_weekday >= 0 && workout.preferred_weekday < 7) {
        dayCounts[workout.preferred_weekday]++;
      }
    });
    
    // Find the day with the fewest workouts
    let minCount = Infinity;
    let recommendedDay = null;
    
    dayCounts.forEach((count, day) => {
      if (count < minCount) {
        minCount = count;
        recommendedDay = day;
      }
    });
    
    return recommendedDay;
  };
  
  const recommendedDay = getRecommendedDay();
  
  // If no day is selected yet and there's a recommended day, select it
  useEffect(() => {
    if (formData.preferred_weekday === undefined && recommendedDay !== null && 
        !occupiedDays.includes(recommendedDay)) {
      updateFormData({ preferred_weekday: recommendedDay });
    }
  }, [recommendedDay, formData.preferred_weekday, occupiedDays]);
  
  // Get day status class
  const getDayStatusClass = (dayIndex) => {
    if (formData.preferred_weekday === dayIndex) {
      return `${colors.bg} text-white`;
    }
    if (occupiedDays.includes(dayIndex)) {
      return 'bg-gray-800/50 text-gray-500 cursor-not-allowed';
    }
    if (recommendedDay === dayIndex) {
      return 'bg-green-600/20 text-green-300 hover:bg-green-600/30';
    }
    return 'bg-gray-800 text-gray-300 hover:bg-gray-700';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {t("select_day")}
        </h2>
        
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className={`
            p-2 rounded-full transition-colors
            ${showInfo ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-gray-300'}
          `}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
      
      {/* Information panel */}
      {showInfo && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 animate-fadeIn">
          <div className="flex">
            <Info className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-medium mb-1">{t("workout_day_info_title")}</h3>
              <p className="text-blue-300/90 text-sm">
                {t("workout_day_info_description")}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Program info */}
      {selectedPlan && (
        <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center mb-2">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-white font-medium">{t("weekly_schedule")}</span>
          </div>
          
          <p className="text-gray-400 text-sm">
            {t("program_frequency", { count: selectedPlan.sessions_per_week })}
          </p>
        </div>
      )}
      
      {/* Day selection grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekdaysShort.map((day, i) => {
          const isOccupied = occupiedDays.includes(i);
          const isSelected = formData.preferred_weekday === i;
          const isRecommended = recommendedDay === i && !isOccupied && !isSelected;
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => !isOccupied && updateFormData({ preferred_weekday: i })}
              disabled={isOccupied && !isSelected}
              className={`
                p-3 rounded-lg flex flex-col items-center justify-center transition-all h-28
                ${getDayStatusClass(i)}
                ${isRecommended ? 'ring-2 ring-green-500/50' : ''}
                ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-500' : ''}
              `}
            >
              <Calendar className="w-6 h-6 mb-2" />
              <span className="text-base font-medium">{day}</span>
              <span className="text-xs opacity-60 mt-1">{weekdaysFull[i].substring(0, 3)}</span>
              
              {/* Status indicator */}
              {isSelected && (
                <div className="mt-2 text-white flex items-center text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>{t("selected")}</span>
                </div>
              )}
              
              {isOccupied && !isSelected && (
                <div className="mt-2 text-gray-500 flex items-center text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  <span>{t("occupied")}</span>
                </div>
              )}
              
              {isRecommended && (
                <div className="mt-1 text-green-400 flex items-center text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>{t("recommended")}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 pt-4">
        <div className="flex items-center text-sm text-gray-400">
          <div className="w-3 h-3 bg-gray-800 rounded-full mr-2"></div>
          <span>{t("available")}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-3 h-3 bg-gray-800/50 rounded-full mr-2"></div>
          <span>{t("occupied")}</span>
        </div>
        
        <div className="flex items-center text-sm text-green-400">
          <div className="w-3 h-3 bg-green-600/20 rounded-full mr-2"></div>
          <span>{t("recommended")}</span>
        </div>
        
        <div className="flex items-center text-sm text-blue-400">
          <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
          <span>{t("selected")}</span>
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WeekdaySelectionStep;