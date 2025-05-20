import React from 'react';
import { Plus, Calendar, X } from 'lucide-react';
import { POST_TYPE_COLORS } from '../../../utils/postTypeUtils';
import { useLanguage } from '../../../context/LanguageContext';

const LogWorkoutModal = ({ onClose, onNewLog, onLogFromInstance, activeProgram }) => {
  const { t } = useLanguage();
  const hasScheduledWorkouts = activeProgram?.workouts?.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">{t('log_workout')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={onNewLog}
            className="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-xl transition-colors flex items-center space-x-4 group"
          >
            <div className={`${POST_TYPE_COLORS.workout_log.bg} p-3 rounded-xl group-hover:${POST_TYPE_COLORS.workout_log.hoverBg} transition-colors`}>
              <Plus className={`w-6 h-6 ${POST_TYPE_COLORS.workout_log.icon}`} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white">{t('regular_post')}</h3>
              <p className="text-sm text-gray-400">{t('create_post')}</p>
            </div>
          </button>

          <button
            onClick={onLogFromInstance}
            disabled={!hasScheduledWorkouts}
            className={`w-full p-4 rounded-xl transition-colors flex items-center space-x-4 group
              ${hasScheduledWorkouts 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-gray-800/50 cursor-not-allowed'}`}
          >
            <div className={`p-3 rounded-xl transition-colors
              ${hasScheduledWorkouts 
                ? 'bg-green-500/20 group-hover:bg-green-500/30' 
                : 'bg-gray-700'}`}
            >
              <Calendar className={`w-6 h-6 ${hasScheduledWorkouts ? 'text-green-400' : 'text-gray-500'}`} />
            </div>
            <div className="text-left">
              <h3 className={`text-lg font-semibold ${hasScheduledWorkouts ? 'text-white' : 'text-gray-500'}`}>
                {t('log_from_program')}
              </h3>
              <p className="text-sm text-gray-400">
                {hasScheduledWorkouts 
                  ? t('log_from_program_desc') 
                  : t('no_active_program')}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this component after the LogWorkoutModal component

const WorkoutInstanceSelector = ({ onClose, onSelect, activeProgram }) => {
  const { t } = useLanguage();
  
  const sortedWorkouts = React.useMemo(() => {
    if (!activeProgram?.workouts) return [];
    
    // Sort workouts by weekday
    return [...activeProgram.workouts].sort((a, b) => a.preferred_weekday - b.preferred_weekday);
  }, [activeProgram]);

  // Using translation keys for weekday names
  const weekdayNames = [
    t('sunday'), 
    t('monday'), 
    t('tuesday'), 
    t('wednesday'), 
    t('thursday'), 
    t('friday'), 
    t('saturday')
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">{t('select_workout')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-400">{t('select_workout_to_share')}:</p>
          
          <div className="space-y-3">
            {sortedWorkouts.map((workout) => (
              <button
                key={workout.id}
                onClick={() => onSelect(workout)}
                className="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-xl transition-colors text-left group"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {workout.name || t('unnamed_workout')}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {weekdayNames[workout.preferred_weekday]}
                  </span>
                </div>
                {workout.description && (
                  <p className="text-sm text-gray-400 mt-1">{workout.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                  <span>{workout.exercises?.length || 0} {t('exercises')}</span>
                  <span>{workout.estimated_duration || 60} {t('mins')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { LogWorkoutModal, WorkoutInstanceSelector };