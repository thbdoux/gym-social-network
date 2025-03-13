import React, { useState } from 'react';
import { 
  Edit2, Trash2, ChevronDown, ChevronUp, 
  Dumbbell, Calendar, GripVertical, Copy,
  Clock, Activity, Award, User, Flame, Eye
} from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChangingDay, setIsChangingDay] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDayChange = (e) => {
    const newDay = parseInt(e.target.value);
    if (!isNaN(newDay)) {
      onDayChange(newDay);
      setIsChangingDay(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!window.confirm(inProgram ? 'Remove this workout from the program?' : 'Delete this workout template?')) {
      return;
    }
    onDelete(workout.id); 
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(workout);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  // For a cleaner UI, dynamically determine which metadata to show
  const hasDuration = !!workout.estimated_duration;
  const hasExercises = workout.exercises && workout.exercises.length > 0;
  const hasDifficulty = !!workout.difficulty_level;
  const hasCreator = !!workout.creator_username;
  
  // Format split method to be more readable
  const formatSplitMethod = (splitMethod) => {
    if (!splitMethod) return 'General';
    return splitMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  return (
    <div 
      className={`w-full bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border border-gray-700/50 rounded-xl overflow-hidden shadow-sm transition-all duration-300 cursor-pointer ${
        isDragging ? 'opacity-60' : ''
      } ${isHovered ? 'shadow-md scale-[1.01]' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Indicator Line - Blue gradient for workout templates */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
      
      <div className="p-4">
        {/* Header with name and split type */}
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
            <div className="p-2 bg-blue-500/20 rounded-lg mr-3 flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-blue-400" />
            </div>
            
            <div className="min-w-0 overflow-hidden">
              {/* Workout Name */}
              <h3 className={`text-lg font-medium text-white transition-colors ${isHovered ? 'text-blue-300' : ''} truncate`}>
                {workout.name}
              </h3>
              
              {/* Split Method & Exercise Count - Essential metadata */}
              <div className="flex items-center mt-1 text-sm text-gray-400 space-x-3 truncate">
                <span className="truncate">{formatSplitMethod(workout.split_method)}</span>
                {hasExercises && (
                  <span className="flex items-center flex-shrink-0">
                    <Dumbbell className="w-3.5 h-3.5 mr-1" />
                    {workout.exercises.length} exercises
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
          
          {/* Action Buttons - Show on hover for cleaner UI */}
          <div className={`flex items-center space-x-1 flex-shrink-0 ml-2 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`} onClick={e => e.stopPropagation()}>
            {onDuplicate && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(workout.id || workout.instance_id);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-400 bg-transparent hover:bg-blue-900/20 rounded-md transition-colors"
                aria-label="Duplicate workout"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(workout);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-400 bg-transparent hover:bg-blue-900/20 rounded-md transition-colors"
                aria-label="Edit workout"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-400 bg-transparent hover:bg-red-900/20 rounded-md transition-colors"
                aria-label="Delete workout"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-400 bg-transparent hover:bg-blue-900/20 rounded-md transition-colors"
              aria-label={isExpanded ? "Show less" : "Show more"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stats Grid - Enhanced with gradients and hover effects */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 hover:from-blue-900/30 hover:to-blue-800/30 p-3 rounded-lg border border-blue-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Dumbbell className="w-3.5 h-3.5 mr-1 text-blue-400" />
              <span>Exercises</span>
            </div>
            <p className="font-semibold text-white">
              {workout.exercises?.length || 0}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 hover:from-red-900/30 hover:to-red-800/30 p-3 rounded-lg border border-red-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Flame className="w-3.5 h-3.5 mr-1 text-red-400" />
              <span>Difficulty</span>
            </div>
            <p className="font-semibold text-white flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyEffect(workout.difficulty_level).color}`}>
                {getDifficultyEffect(workout.difficulty_level).label}
              </span>
              <span className="text-xs truncate capitalize">{workout.difficulty_level || 'Intermediate'}</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 hover:from-cyan-900/30 hover:to-cyan-800/30 p-3 rounded-lg border border-cyan-700/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <Clock className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>Duration</span>
            </div>
            <p className="font-semibold text-white">
              {workout.estimated_duration || 45} <span className="text-xs font-normal">min</span>
            </p>
          </div>
        </div>

        {/* Expanded View - With better styling for exercise list */}
        {isExpanded && (
          <div className="mt-5 space-y-3 border-t border-gray-700/50 pt-4 animate-fadeIn">
            {/* Description & Creator */}
            {(workout.description || hasCreator) && (
              <div className="mb-4 p-3 bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-lg border border-gray-700/30">
                {workout.description && (
                  <p className="text-sm text-gray-300 mb-2">{workout.description}</p>
                )}
                {hasCreator && (
                  <p className="text-xs text-gray-400 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1" />
                    Created by {workout.creator_username}
                  </p>
                )}
              </div>
            )}

            {/* Exercises List - Enhanced with better visual hierarchy */}
            {hasExercises && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white text-sm flex items-center">
                    <Dumbbell className="w-4 h-4 mr-2 text-blue-400" />
                    Exercise Plan
                  </h4>
                  <span className="px-1.5 py-0.5 bg-gray-800/80 text-gray-400 rounded text-xs">
                    {workout.exercises.length} total
                  </span>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {workout.exercises.map((exercise, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gray-800/70 rounded-lg p-2.5 border border-gray-700/50 hover:border-blue-700/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-900/30 text-blue-400 text-xs mr-2">
                            {idx + 1}
                          </div>
                          <div>
                            <h6 className="font-medium text-white text-sm">{exercise.name}</h6>
                            {exercise.equipment && (
                              <span className="text-xs text-gray-400">{exercise.equipment}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center">
                          <span className="bg-gray-700/50 px-1.5 py-0.5 rounded">
                            {exercise.sets?.length || 0} sets
                          </span>
                        </div>
                      </div>
                      
                      {/* Sets mini-view - with improved styling */}
                      {exercise.sets && exercise.sets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-8">
                          {exercise.sets.map((set, setIdx) => (
                            <div key={setIdx} className="bg-blue-900/20 border border-blue-800/30 px-2 py-1 rounded text-xs text-blue-300">
                              <span className="font-medium">{set.reps} reps</span>
                              {set.weight && <span className="text-blue-400 opacity-80"> × {set.weight}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* View Full Details Button - Only in expanded mode */}
                {onClick && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick(workout);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 mt-4 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-300 text-sm font-medium border border-blue-500/30"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Workout Details
                  </button>
                )}
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