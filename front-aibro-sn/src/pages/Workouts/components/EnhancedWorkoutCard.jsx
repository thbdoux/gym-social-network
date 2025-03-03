// EnhancedWorkoutCard.jsx - Replacement for UnifiedWorkoutCard
import React, { useState } from 'react';
import { 
  Edit2, Trash2, ChevronDown, ChevronUp, 
  Dumbbell, Calendar, GripVertical, Copy,
  Clock, Tag, Activity, Award, User
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

  const handleDayChange = (e) => {
    const newDay = parseInt(e.target.value);
    if (!isNaN(newDay)) {
      onDayChange(newDay);
      setIsChangingDay(false);
    }
  };

  const handleDelete = () => {
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

  return (
    <div 
      className={`w-full bg-gray-800/50 border border-blue-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Status Indicator Line */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {inProgram && dragHandleProps && (
              <div 
                {...dragHandleProps}
                onClick={e => e.stopPropagation()}
                className="p-2 hover:bg-gray-700 rounded-lg cursor-move"
              >
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Dumbbell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                {workout.name}
              </h3>
              <div className="flex items-center mt-1 text-sm text-gray-400 space-x-3">
                <span className="capitalize">{workout.split_method?.replace(/_/g, ' ') || 'General'}</span>
                {workout.exercises && (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-1" />
                    <span>{workout.exercises.length} exercises</span>
                  </div>
                )}
                {workout.estimated_duration && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{workout.estimated_duration} min</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {inProgram && onDayChange && (
              <div className="mr-4" onClick={e => e.stopPropagation()}>
                {isChangingDay ? (
                  <select
                    value={workout.preferred_weekday}
                    onChange={handleDayChange}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
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
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{WEEKDAYS[workout.preferred_weekday]}</span>
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
              {onDuplicate && (
                <button 
                  onClick={() => onDuplicate(workout.id || workout.instance_id)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              )}
              {onEdit && (
                <button 
                  onClick={() => onEdit(workout)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={handleDelete}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {!isExpanded && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Activity className="w-4 h-4 mr-1 text-blue-400" />
                <span>Exercises</span>
              </div>
              <p className="text-white font-bold text-lg">
                {workout.exercises?.length || 0}
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Clock className="w-4 h-4 mr-1 text-purple-400" />
                <span>Duration</span>
              </div>
              <p className="text-white font-bold text-lg">
                {workout.estimated_duration || 45} <span className="text-sm font-normal">min</span>
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Award className="w-4 h-4 mr-1 text-indigo-400" />
                <span>Difficulty</span>
              </div>
              <p className="text-white font-bold text-lg capitalize">
                {workout.difficulty_level || 'Intermediate'}
              </p>
            </div>
          </div>
        )}

        {/* Description & Creator */}
        {isExpanded && (
          <div className="mt-4">
            {workout.description && (
              <p className="text-gray-400">{workout.description}</p>
            )}
            {workout.creator_username && (
              <p className="mt-2 text-sm text-gray-500 flex items-center">
                <User className="w-4 h-4 mr-1" />
                Created by {workout.creator_username}
              </p>
            )}
            
            {/* Tags if available */}
            {workout.tags && workout.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {workout.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expanded Content - Exercises List */}
        {isExpanded && workout.exercises && (
          <div className="mt-6 space-y-4 border-t border-gray-700/50 pt-4">
            <h4 className="font-medium text-white flex items-center">
              <Dumbbell className="w-5 h-5 mr-2 text-blue-400" />
              Exercises
            </h4>
            
            {workout.exercises.map((exercise, idx) => (
              <div key={idx} className="bg-gray-800/80 rounded-lg p-4 border border-gray-700/50">
                <h5 className="font-semibold text-white mb-2">
                  {exercise.name}
                </h5>
                
                <div className="flex items-center text-sm text-gray-400 mb-3 flex-wrap gap-x-4 gap-y-1">
                  {exercise.equipment && (
                    <span>Equipment: {exercise.equipment}</span>
                  )}
                  <span>{exercise.sets?.length || 0} sets</span>
                  {exercise.notes && (
                    <span>Notes: {exercise.notes}</span>
                  )}
                </div>

                {/* Sets Table */}
                {exercise.sets && exercise.sets.length > 0 && (
                  <div className="overflow-x-auto bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-700/50 bg-gray-800/50">
                          <th className="py-2 pl-3 pr-1 text-left text-xs font-medium text-gray-400">#</th>
                          <th className="py-2 px-1 text-left text-xs font-medium text-gray-400">Reps</th>
                          <th className="py-2 px-1 text-left text-xs font-medium text-gray-400">Weight</th>
                          <th className="py-2 px-1 text-left text-xs font-medium text-gray-400">Rest</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, setIdx) => (
                          <tr key={setIdx} className="border-b border-gray-700/20 last:border-0 hover:bg-gray-800/30">
                            <td className="py-2 pl-3 pr-1 font-medium text-gray-400">{setIdx + 1}</td>
                            <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                            <td className="py-2 px-4 text-gray-300">{set.weight}</td>
                            <td className="py-2 px-4 text-gray-300">{set.rest_time}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedWorkoutCard;