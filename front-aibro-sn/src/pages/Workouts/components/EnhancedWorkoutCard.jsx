import React, { useState } from 'react';
import { 
  Edit2, Trash2, ChevronDown, ChevronUp, 
  Dumbbell, Calendar, GripVertical, Copy,
  Clock, Activity, Award, User, Flame, Eye,
  BarChart, Info, Target
} from 'lucide-react';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';
import { useLanguage } from '../../../context/LanguageContext';

const EnhancedWorkoutCard = ({ 
  workout, 
  onEdit, 
  onDelete, 
  onDuplicate,
  inProgram = false,
  onDayChange,
  dragHandleProps,
  isDragging = false,
  onClick
}) => {
  const { t } = useLanguage(); // Add language context
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChangingDay, setIsChangingDay] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);
  
  // Use translated weekdays
  const WEEKDAYS = [
    t('monday'), t('tuesday'), t('wednesday'), 
    t('thursday'), t('friday'), t('saturday'), t('sunday')
  ];
  
  // Get colors from postTypeUtils
  const workoutColors = getPostTypeDetails('workout').colors || {};

  const handleDayChange = (e) => {
    const newDay = parseInt(e.target.value);
    if (!isNaN(newDay)) {
      onDayChange(newDay);
      setIsChangingDay(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!window.confirm(inProgram ? t('confirm_remove_workout') : t('confirm_delete_workout_template'))) {
      return;
    }
    onDelete(workout.id); 
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(workout);
    } else if (!isExpanded) {
      setIsExpanded(true);
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

  // For a cleaner UI, dynamically determine which metadata to show
  const hasDuration = !!workout.estimated_duration;
  const hasExercises = workout.exercises && workout.exercises.length > 0;
  const hasDifficulty = !!workout.difficulty_level;
  const hasCreator = !!workout.creator_username;
  
  // Format split method to be more readable
  const formatSplitMethod = (splitMethod) => {
    if (!splitMethod) return t('general');
    return t(splitMethod) || splitMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get difficulty visual effects
  const getDifficultyEffect = (level) => {
    switch(level?.toLowerCase()) {
      case 'beginner': 
        return { label: '🔥', color: 'text-green-400 bg-green-900/30' };
      case 'intermediate': 
        return { label: '🔥🔥', color: 'text-yellow-400 bg-yellow-900/30' };
      case 'advanced': 
        return { label: '🔥🔥🔥', color: 'text-orange-400 bg-orange-900/30' };
      case 'expert': 
        return { label: '🔥🔥🔥🔥', color: 'text-red-400 bg-red-900/30' };
      default: 
        return { label: '🔥', color: 'text-blue-400 bg-blue-900/30' };
    }
  };
  
  const getFocusDetails = () => {
    const focusMap = {
      'strength': { 
        label: t('strength'), 
        description: t('strength_description'), 
        icon: <Award className="w-5 h-5" /> 
      },
      'hypertrophy': { 
        label: t('hypertrophy'), 
        description: t('hypertrophy_description'), 
        icon: <Activity className="w-5 h-5" /> 
      },
      'endurance': { 
        label: t('endurance'), 
        description: t('endurance_description'), 
        icon: <Activity className="w-5 h-5" /> 
      },
      'general': { 
        label: t('general_fitness'), 
        description: t('general_fitness_description'), 
        icon: <Target className="w-5 h-5" /> 
      }
    };

    return focusMap[workout.focus] || { 
      label: workout.focus ? workout.focus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : t('general'), 
      description: t('custom_workout_focus'),
      icon: <Target className="w-5 h-5" />
    };
  };

  return (
    <div 
      className={`mt-4 bg-gradient-to-br from-blue-900/30 via-gray-800/95 to-gray-900/95 border border-blue-500/50 rounded-xl overflow-hidden transition-all duration-300 
        ${isExpanded ? 'shadow-lg' : ''} 
        ${isHovered && !isExpanded ? 'shadow-md scale-[1.01]' : ''} 
        ${isDragging ? 'opacity-60' : ''}
        cursor-pointer relative`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Indicator Line - Blue gradient */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
      
      <div className="p-4">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 flex items-start">
            {/* Drag handle for reordering within programs */}
            {inProgram && dragHandleProps && (
              <div 
                {...dragHandleProps}
                onClick={e => e.stopPropagation()}
                className="p-1.5 hover:bg-gray-700/50 rounded-md cursor-move mr-2 text-gray-400 hover:text-gray-300 flex-shrink-0"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            
            {/* Workout Icon */}
            <div className="p-2 bg-blue-500/30 rounded-lg mr-3 flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-blue-400" />
            </div>
            
            <div className="min-w-0 overflow-hidden flex-grow">
              <div className="flex items-center">
                <h4 className={`text-lg font-medium text-white transition-colors ${isHovered ? 'text-blue-300' : ''} truncate`}>
                  {workout.name}
                </h4>
              </div>
              
              <div className="flex items-center mt-1 text-sm text-gray-400 truncate">
                <span className="truncate">{formatSplitMethod(workout.split_method)}</span>
                {hasExercises && (
                  <span className="ml-2 flex items-center flex-shrink-0">
                    <Dumbbell className="w-3.5 h-3.5 mx-1 text-blue-400" />
                    <span className="text-blue-400">{t('with')}</span>
                    <span className="ml-1 text-blue-300 font-medium truncate">
                      {workout.exercises.length} {t('exercises')}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Weekday selector for program workouts */}
          {inProgram && onDayChange && (
            <div className="flex-shrink-0 mr-2" onClick={e => e.stopPropagation()}>
              {isChangingDay ? (
                <select
                  value={workout.preferred_weekday}
                  onChange={handleDayChange}
                  className="bg-gray-700 border border-gray-600 text-white rounded-md px-2 py-1 text-sm"
                  autoFocus
                  onBlur={() => setIsChangingDay(false)}
                >
                  {WEEKDAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setIsChangingDay(true)}
                  className="flex items-center space-x-1 px-2 py-1 rounded-md text-sm text-gray-400 bg-transparent hover:bg-gray-700/50 hover:text-blue-400 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{WEEKDAYS[workout.preferred_weekday]}</span>
                  <span className="sm:hidden">{WEEKDAYS[workout.preferred_weekday].substring(0, 3)}</span>
                </button>
              )}
            </div>
          )}
          
          {/* Action buttons - Only visible on hover */}
          <div className="flex items-center flex-shrink-0">
            {/* Management actions */}
            <div className={`flex items-center space-x-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 mr-2`}>
              {onDuplicate && (
                <button
                  onClick={(e) => handleButtonClick(e, () => onDuplicate(workout.id || workout.instance_id))}
                  className="p-1.5 text-gray-400 hover:text-blue-400 bg-transparent hover:bg-blue-900/20 rounded-md transition-colors"
                  aria-label={t('duplicate_workout')}
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={(e) => handleButtonClick(e, () => onEdit(workout))}
                  className="p-1.5 text-gray-400 hover:text-blue-400 bg-transparent hover:bg-blue-900/20 rounded-md transition-colors"
                  aria-label={t('edit_workout')}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-gray-400 hover:text-red-400 bg-transparent hover:bg-red-900/20 rounded-md transition-colors"
                  aria-label={t('delete_workout')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <button
              onClick={handleExpandClick}
              className={`p-1.5 bg-transparent rounded-md transition-colors 
                ${isHovered || isExpanded ? 'opacity-100' : 'opacity-0'} 
                ${isExpanded ? 'text-blue-400 bg-blue-900/20' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Description - Show only if it exists */}
        {workout.description && (
          <p className="mt-2 text-sm text-gray-300 line-clamp-2 hidden sm:block">{workout.description}</p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 hover:from-blue-900/30 hover:to-blue-800/30 p-3 rounded-lg border border-blue-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Dumbbell className="w-3.5 h-3.5 mr-1 text-blue-400" />
              <span>{t('exercises')}</span>
            </div>
            <p className="font-semibold text-white">
              {workout.exercises?.length || 0}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 hover:from-red-900/30 hover:to-red-800/30 p-3 rounded-lg border border-red-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Flame className="w-3.5 h-3.5 mr-1 text-red-400" />
              <span>{t('difficulty')}</span>
            </div>
            <p className="font-semibold text-white flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyEffect(workout.difficulty_level).color}`}>
                {getDifficultyEffect(workout.difficulty_level).label}
              </span>
              <span className="text-xs truncate capitalize">{t(workout.difficulty_level?.toLowerCase()) || t('intermediate')}</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 hover:from-cyan-900/30 hover:to-cyan-800/30 p-3 rounded-lg border border-cyan-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Clock className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>{t('duration')}</span>
            </div>
            <p className="font-semibold text-white">
              {workout.estimated_duration || 45} <span className="text-xs font-normal">{t('mins')}</span>
            </p>
          </div>
        </div>

        {/* Expanded View - Workout Details */}
        {isExpanded && (
          <div className="mt-6 space-y-6 animate-fadeIn">
            {/* Focus Highlight */}
            {workout.focus && (
              <div className={`p-4 rounded-xl ${workoutColors.lightBg || 'bg-blue-900/20'} shadow-md border ${workoutColors.border || 'border-blue-700/30'} flex items-center gap-4`}>
                <div className={`h-12 w-12 rounded-full ${workoutColors.bg || 'bg-blue-900/40'} flex items-center justify-center flex-shrink-0`}>
                  {getFocusDetails().icon}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="text-lg font-bold text-white truncate">{getFocusDetails().label}</h3>
                  <p className="text-gray-300 text-sm mt-0.5 truncate">{getFocusDetails().description}</p>
                </div>
              </div>
            )}
            
            {/* Workout Details */}
            <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
              <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
                <BarChart className="w-4 h-4 mr-2 text-blue-400" />
                {t('workout_details')}
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('duration')}</span>
                  <span className="text-white font-medium">{workout.estimated_duration || 45} {t('mins')}</span>
                </div>
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('type')}</span>
                  <span className="text-white font-medium capitalize">{formatSplitMethod(workout.split_method)}</span>
                </div>
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('difficulty')}</span>
                  <span className="text-white font-medium capitalize">{t(workout.difficulty_level?.toLowerCase()) || t('intermediate')}</span>
                </div>
                <div className="p-3 bg-gray-800/80 rounded-lg border border-gray-700/30">
                  <span className="text-xs text-gray-400 block mb-1">{t('created')}</span>
                  <span className="text-white font-medium">{new Date(workout.created_at).toLocaleDateString() || t('not_available')}</span>
                </div>
                
                {/* Creator info if available */}
                {hasCreator && (
                  <div className="col-span-2 bg-blue-900/20 p-3 rounded-lg border border-blue-700/30">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1.5 text-blue-400" />
                      <span className="text-blue-300">
                        {t('created_by')}{" "}
                        <span className="font-medium">{workout.creator_username}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exercise List */}
            {hasExercises && (
              <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
                <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
                  <Dumbbell className="w-4 h-4 mr-2 text-blue-400" />
                  {t('exercises')}
                </h5>
                
                <div className="space-y-3">
                  {workout.exercises.map((exercise, index) => (
                    <div 
                      key={exercise.id || index} 
                      className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-700/40 transition-all duration-300"
                    >
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-750 transition-colors"
                        onClick={() => handleExerciseExpand(exercise.id || index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 overflow-hidden flex-1">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center border border-blue-700/30 flex-shrink-0">
                              <Dumbbell className="w-4 h-4 text-blue-400" />
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
                              <ChevronUp className="w-4 h-4 text-blue-400" /> : 
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
                            
                            {/* Set Template Info */}
                            <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400">
                              <span>{t('recommended_rest')}: <span className="text-blue-400 font-medium">
                                {exercise.rest_time || 60} {t('seconds')}
                              </span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* View Full Details Button */}
                {onClick && (
                  <button 
                    onClick={(e) => handleButtonClick(e, () => onClick(workout))}
                    className="w-full flex items-center justify-center gap-2 py-2 mt-4 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-300 text-sm font-medium border border-blue-500/30"
                  >
                    <Eye className="w-4 h-4" />
                    {t('view_full_workout_details')}
                  </button>
                )}
              </div>
            )}

            {/* Workout Notes/Description */}
            {workout.description && (
              <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
                <h5 className="font-medium text-gray-200 text-sm mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-400" />
                  {t('about_this_workout')}
                </h5>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{workout.description}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Animated highlight line on hover */}
        <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 w-0 ${isHovered ? 'w-full' : ''} transition-all duration-700`}></div>
      </div>
    </div>
  );
};

export default EnhancedWorkoutCard;