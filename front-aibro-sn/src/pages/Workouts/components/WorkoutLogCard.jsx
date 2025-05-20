import React, { useState } from 'react';
import { 
  Calendar, Dumbbell, Edit2, Trash2, 
  CheckCircle, MapPin, Heart, Flame, Target,
  Activity, ChevronDown, ChevronUp, Eye,
  Info, BarChart, Users, Clock, Award,
  GitFork, Loader2, Check, Download
} from 'lucide-react';
import { useGyms } from '../../../hooks/query/useGymQuery';
import { useLog } from '../../../hooks/query/useLogQuery';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';
import { useWorkoutTemplates } from '../../../hooks/query/useWorkoutQuery';
import { useWorkoutFork } from '../../../hooks/query/useWorkoutFork';
import { useLanguage } from '../../../context/LanguageContext';

const WorkoutLogCard = ({ 
  user,
  logId, 
  log: initialLog, 
  onEdit, 
  onDelete, 
  onShare, 
  onSelect,
  inFeedMode = false,
  expandable = true,
}) => {
  const { t } = useLanguage(); // Add language context
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);
  
  // Use React Query hooks
  const { data: gyms, isLoading: gymsLoading } = useGyms();
  
  // Only fetch the log if logId is provided and no initialLog
  const { data: fetchedLog, isLoading } = useLog(logId && !initialLog ? logId : null);
  
  // Use either the fetched log or the initial log passed as prop
  const log = initialLog || fetchedLog;
  
  // Workout templates for forking check
  const { data: workoutTemplates = [] } = useWorkoutTemplates();
  
  // Add workout forking logic
  const {
    isForking,
    forkSuccess,
    hasForked,
    showForkWarning,
    forkWorkout,
    cancelFork
  } = useWorkoutFork();
  
  const canEdit = log?.username === user;
  const canFork = log?.username !== user; // Can fork logs that aren't your own
  
  // Get colors from postTypeUtils
  const logColors = getPostTypeDetails('workout_log').colors || {};
  
  // Loading state
  if (isLoading) {
    return (
      <div className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded-lg w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded-lg w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="h-20 bg-gray-700 rounded-lg"></div>
          <div className="h-20 bg-gray-700 rounded-lg"></div>
          <div className="h-20 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (!log) {
    return (
      <div className="mt-4 bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl">
        {t('unable_to_load_workout_log')}
      </div>
    );
  }
  
  const gymInfo = React.useMemo(() => {
    if (!log.gym) return { name: t('not_specified'), location: '' };
    if (log.gym_name) {
      return { 
        name: log.gym_name, 
        location: log.gym_location || '' 
      };
    }
    
    const gym = gyms?.find(g => g.id === log.gym);
    return gym ? { 
      name: gym.name, 
      location: gym.location || '' 
    } : { name: t('loading'), location: '' };
  }, [log.gym, log.gym_name, log.gym_location, gyms, t]);
  
  // Format date for better display
  const formatDate = (dateString) => {
    try {
      if (!dateString) return t('no_date');
      // Check if date is in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString();
      }
      // Otherwise try standard parsing
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString; // If parsing fails, return the original string
    }
  };
  
  const formattedDate = formatDate(log.date);
  
  const getMoodEmoji = (rating) => {
    if (!rating) return null;
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };

  const getDifficultyEffect = (rating) => {
    if (!rating) return { label: '🔥', color: 'text-gray-400 bg-gray-800/50' };
    if (rating >= 8) return { label: '🔥🔥🔥', color: 'text-red-400 bg-red-900/30' };
    if (rating >= 6) return { label: '🔥🔥', color: 'text-orange-400 bg-orange-900/30' };
    if (rating >= 4) return { label: '🔥', color: 'text-yellow-400 bg-yellow-900/30' };
    return { label: '✓', color: 'text-green-400 bg-green-900/30' };
  };

  // Modified to always expand the card when clicked (unless in feed mode)
  const handleCardClick = (e) => {
    e.stopPropagation();
    if (!inFeedMode && !isExpanded) {
      setIsExpanded(true);
    }
    
    if (onSelect) {
      onSelect(log);
    }
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleExerciseExpand = (exerciseId) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  const handleButtonClick = (e, action) => {
    e.stopPropagation();
    action();
  };
  
  // Add fork handler
  const handleFork = (e) => {
    e.stopPropagation();
    forkWorkout(log, workoutTemplates);
  };

  // Determine if key stats should be shown based on their existence
  const showMood = !!log.mood_rating;
  const exerciseCount = log.exercise_count || log.exercises?.length || 0;

  return (
    <div 
      className={`mt-4 bg-gradient-to-br ${log.completed ? 'from-green-900/30 via-gray-800/95 to-gray-900/95 border-green-500/50' : 'from-gray-800/95 via-gray-800/90 to-gray-900/95 border-gray-700/50'} border rounded-xl overflow-hidden transition-all duration-300 
        ${isExpanded ? 'shadow-lg' : ''} 
        ${isHovered && !isExpanded ? 'shadow-md scale-[1.01]' : ''} 
        ${inFeedMode ? '' : 'cursor-pointer'} relative`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Indicator Line */}
      <div className={`h-1 w-full ${log.completed ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-gray-600 to-gray-700'}`} />
      
      <div className="p-4">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 flex items-start">
            {/* Workout Icon */}
            <div className={`p-2 ${log.completed ? 'bg-green-500/30' : 'bg-gray-700/30'} rounded-lg mr-3 flex-shrink-0`}>
              <Activity className={`w-5 h-5 ${log.completed ? 'text-green-400' : 'text-gray-400'}`} />
            </div>
            
            <div className="min-w-0 overflow-hidden flex-grow">
              <div className="flex items-center">
                <h4 className={`text-lg font-medium text-white transition-colors ${isHovered ? 'text-green-300' : ''} truncate`}>
                  {log.name || log.workout_name || t('workout')}
                </h4>
                
                {log.completed && (
                  <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">{t('completed')}</span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center mt-1 text-sm text-gray-400 truncate">
                <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">{formattedDate}</span>
                
                {log.program_name && (
                  <span className="ml-2 flex items-center flex-shrink-0">
                    <Dumbbell className="w-3.5 h-3.5 mx-1 text-purple-400" />
                    <span className="text-purple-300 font-medium truncate">
                      {log.program_name}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action buttons - Only visible on hover */}
          <div className="flex items-center flex-shrink-0">
            {/* Management actions */}
            {canEdit && (
              <div className={`flex items-center space-x-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 mr-2`}>
                <button
                  onClick={(e) => handleButtonClick(e, () => onEdit?.(log))}
                  className="p-1.5 text-gray-400 hover:text-white bg-transparent hover:bg-gray-700/50 rounded-md transition-colors"
                  aria-label={t('edit_log')}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={(e) => handleButtonClick(e, () => {
                    if (window.confirm(t('confirm_delete_workout_log'))) {
                      onDelete?.(log);
                    }
                  })}
                  className="p-1.5 text-gray-400 hover:text-red-400 bg-transparent hover:bg-red-900/20 rounded-md transition-colors"
                  aria-label={t('delete_log')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Add Fork button */}
            {canFork && (
              <button
                onClick={handleFork}
                disabled={isForking}
                className={`p-1.5 mr-2 rounded-md transition-colors flex items-center 
                  ${isHovered ? 'opacity-100' : 'opacity-0'} 
                  ${isForking ? 'opacity-50 cursor-not-allowed' : ''}
                  ${hasForked 
                    ? 'text-orange-400 bg-transparent hover:text-orange-300 hover:bg-orange-900/20' 
                    : 'text-blue-400 bg-transparent hover:text-blue-300 hover:bg-blue-900/20'}`}
                aria-label={hasForked ? t('fork_again') : t('fork_workout')}
                title={hasForked ? t('already_forked_workout') : t('fork_workout')}
              >
                {isForking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            )}
            
            {expandable && (
              <button
                onClick={handleExpandClick}
                className={`p-1.5 bg-transparent rounded-md transition-colors 
                  ${isHovered || isExpanded ? 'opacity-100' : 'opacity-0'} 
                  ${isExpanded ? 'text-green-400 bg-green-900/20' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
        
        {/* Description - Show only if it exists */}
        {log.notes && (
          <p className="mt-2 text-sm text-gray-300 line-clamp-2 hidden sm:block">{log.notes}</p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 hover:from-blue-900/30 hover:to-blue-800/30 p-3 rounded-lg border border-blue-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <MapPin className="w-3.5 h-3.5 mr-1 text-blue-400" />
              <span>{t('location')}</span>
            </div>
            <p className="font-semibold text-white text-sm truncate">
              {gymInfo.name}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 hover:from-red-900/30 hover:to-red-800/30 p-3 rounded-lg border border-red-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Flame className="w-3.5 h-3.5 mr-1 text-red-400" />
              <span>{t('difficulty')}</span>
            </div>
            <p className="font-semibold text-white flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyEffect(log.perceived_difficulty).color}`}>
                {getDifficultyEffect(log.perceived_difficulty).label}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-red-900/40 rounded-full">{log.perceived_difficulty || '—'}/10</span>
            </p>
          </div>
          
          {showMood ? (
            <div className="bg-gradient-to-br from-pink-900/20 to-pink-800/20 hover:from-pink-900/30 hover:to-pink-800/30 p-3 rounded-lg border border-pink-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Heart className="w-3.5 h-3.5 mr-1 text-pink-400" />
                <span>{t('mood')}</span>
              </div>
              <p className="font-semibold text-white flex items-center justify-between">
                <span className="text-xl">{getMoodEmoji(log.mood_rating)}</span>
                <span className="text-xs px-1.5 py-0.5 bg-pink-900/40 rounded-full">{log.mood_rating}/10</span>
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-teal-900/20 to-teal-800/20 hover:from-teal-900/30 hover:to-teal-800/30 p-3 rounded-lg border border-teal-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Target className="w-3.5 h-3.5 mr-1 text-teal-400" />
                <span className="truncate">{log.program_name ? t('program') : t('gym')}</span>
              </div>
              <p className="font-semibold text-white text-sm truncate">
                {log.program_name || gymInfo.name}
              </p>
            </div>
          )}
        </div>

        {/* Expanded View - Workout Log Details */}
        {isExpanded && (
          <div className="mt-6 space-y-6 animate-fadeIn">
            {/* Workout Summary Box */}
            {log.summary && (
              <div className={`p-4 rounded-xl ${logColors.lightBg || 'bg-green-900/20'} shadow-md border ${logColors.border || 'border-green-700/30'} flex items-center gap-4`}>
                <div className={`h-12 w-12 rounded-full ${logColors.bg || 'bg-green-900/40'} flex items-center justify-center flex-shrink-0`}>
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="text-lg font-bold text-white truncate">{t('workout_summary')}</h3>
                  <p className="text-gray-300 text-sm mt-0.5 truncate">{log.summary}</p>
                </div>
              </div>
            )}
            
            {/* Workout Details */}
            <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
              <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
                <BarChart className="w-4 h-4 mr-2 text-green-400" />
                {t('workout_details')}
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('duration')}</span>
                  <span className="text-white font-medium">{log.duration || '—'} {t('mins')}</span>
                </div>
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('exercises')}</span>
                  <span className="text-white font-medium">{exerciseCount}</span>
                </div>
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('location')}</span>
                  <span className="text-white font-medium truncate">{gymInfo.name}</span>
                </div>
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('difficulty')}</span>
                  <span className="text-white font-medium">{log.perceived_difficulty || '—'}/10</span>
                </div>
                
                {/* Program info if available */}
                {log.program_name && (
                  <div className="col-span-2 bg-green-900/20 p-3 rounded-lg border border-green-700/30">
                    <div className="flex items-center">
                      <Dumbbell className="w-4 h-4 mr-1.5 text-green-400" />
                      <span className="text-green-300">
                        {t('part_of_program')}{" "}
                        <span className="font-medium">{log.program_name}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exercise List */}
            {log.exercises && log.exercises.length > 0 && (
              <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
                <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
                  <Dumbbell className="w-4 h-4 mr-2 text-green-400" />
                  {t('exercises')}
                </h5>
                
                <div className="space-y-3">
                  {log.exercises.map((exercise, index) => (
                    <div 
                      key={exercise.id || index} 
                      className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-green-700/40 transition-all duration-300"
                    >
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-750 transition-colors"
                        onClick={() => handleExerciseExpand(exercise.id || index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 overflow-hidden flex-1">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-600/20 to-teal-600/20 flex items-center justify-center border border-green-700/30 flex-shrink-0">
                              <Dumbbell className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="min-w-0 overflow-hidden">
                              <h4 className="font-medium text-white text-sm truncate">{exercise.name}</h4>
                              <div className="flex items-center text-xs text-gray-400 mt-0.5">
                                <span className="flex-shrink-0">{exercise.sets?.length || 0} {t('sets')}</span>
                                {exercise.equipment && (
                                  <>
                                    <span className="mx-1.5 flex-shrink-0">•</span>
                                    <span className="flex-shrink-0">{exercise.equipment}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {expandedExercise === (exercise.id || index) ? 
                              <ChevronUp className="w-4 h-4 text-green-400" /> : 
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            }
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Exercise Sets Detail */}
                      {expandedExercise === (exercise.id || index) && exercise.sets && (
                        <div className="border-t border-gray-700 p-4 bg-gray-800/80">
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            <div className="grid grid-cols-5 gap-1 text-xs text-gray-400 mb-2">
                              <div className="col-span-1">{t('set')}</div>
                              <div className="col-span-1">{t('weight')}</div>
                              <div className="col-span-1">{t('reps')}</div>
                              <div className="col-span-2">{t('notes')}</div>
                            </div>
                            
                            {exercise.sets.map((set, setIdx) => (
                              <div key={setIdx} className="grid grid-cols-5 gap-1 p-2 bg-gray-700/40 rounded-lg text-sm">
                                <div className="col-span-1 text-white font-medium">{setIdx + 1}</div>
                                <div className="col-span-1 text-white">{set.weight || 0} kg</div>
                                <div className="col-span-1 text-white">{set.reps || 0}</div>
                                <div className="col-span-2 text-gray-300 text-xs">{set.notes || '—'}</div>
                              </div>
                            ))}
                            
                            {/* Set Summary */}
                            <div className="mt-3 pt-2 border-t border-gray-700 flex justify-between text-xs">
                              <span className="text-gray-400">{t('total_volume')}: <span className="text-green-400 font-medium">
                                {exercise.sets.reduce((total, set) => total + (set.weight || 0) * (set.reps || 0), 0)} kg
                              </span></span>
                              <span className="text-gray-400">{t('best_set')}: <span className="text-green-400 font-medium">
                                {exercise.sets.reduce((best, set) => Math.max(best, (set.weight || 0)), 0)} kg
                              </span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workout Notes */}
            {log.notes && (
              <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
                <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-green-400" />
                  {t('workout_notes')}
                </h5>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{log.notes}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Success message for forking */}
        {forkSuccess && (
          <div className="absolute bottom-4 right-4 bg-green-900/80 text-green-300 p-2 rounded-lg flex items-center animate-fadeIn shadow-lg border border-green-700/50">
            <Check className="w-4 h-4 mr-2" />
            <span className="text-sm">{t('workout_forked_success')}</span>
          </div>
        )}
        
        {/* Fork warning modal */}
        {showForkWarning && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-4 rounded-lg shadow-lg border border-orange-500/50 z-10 w-80 animate-fadeIn">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white mb-2">{t('fork_again_question')}</h3>
                <p className="text-gray-300 text-sm mb-4">{t('already_forked_workout_message')}</p>
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelFork();
                    }} 
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-white transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={handleFork}
                    className="px-3 py-1.5 bg-orange-600/70 hover:bg-orange-600 rounded-md text-sm text-white transition-colors"
                  >
                    {t('fork_again')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Animated highlight line on hover */}
        <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 w-0 ${isHovered ? 'w-full' : ''} transition-all duration-700`}></div>
      </div>
    </div>
  );
};

export default WorkoutLogCard;