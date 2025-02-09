// UnifiedWorkoutCard.jsx
import React, { useState } from 'react';
import { 
  Edit2, Trash2, ChevronDown, ChevronUp, 
  Dumbbell, Calendar, GripVertical, Copy
} from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const UnifiedWorkoutCard = ({ 
  workout, 
  onEdit, 
  onDelete, 
  onDuplicate,
  inProgram = false,
  onDayChange,
  dragHandleProps,
  isDragging = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChangingDay, setIsChangingDay] = useState(false);

  const handleDayChange = (e) => {
    const newDay = parseInt(e.target.value);
    if (!isNaN(newDay)) {
      onDayChange(workout.instance_id, newDay);
      setIsChangingDay(false);
    }
  };

  const handleDelete = () => {
    if (!window.confirm(inProgram ? 'Remove this workout from the program?' : 'Delete this workout template?')) {
      return;
    }
    onDelete(inProgram ? workout.instance_id : workout.id);
  };

  return (
    <div className={`bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 hover:bg-gray-800/60 group ${
      isDragging ? 'opacity-50' : ''
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {inProgram && dragHandleProps && (
              <div 
                {...dragHandleProps}
                className="p-2 hover:bg-gray-700 rounded-lg cursor-move"
              >
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Dumbbell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                {workout.name}
              </h3>
              <p className="text-gray-400 mt-1 capitalize">
                {workout.split_method?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {inProgram && onDayChange && (
              <div className="mr-4">
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
            <div className="flex items-center space-x-2">
              {inProgram && onDuplicate && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(workout.instance_id);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              )}
              {/* Existing edit and delete buttons */}
            </div>
            <button 
                onClick={(e) => {
                    e.stopPropagation(); // Stop event from bubbling up
                    onEdit(workout);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                <Edit2 className="w-5 h-5" />
                </button>
            <button 
              onClick={handleDelete}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Description & Creator */}
        <div className="mt-4">
          {workout.description && (
            <p className="text-gray-400">{workout.description}</p>
          )}
          {workout.creator_username && (
            <p className="mt-2 text-sm text-gray-500">
              Created by {workout.creator_username}
            </p>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && workout.exercises && (
          <div className="mt-6 space-y-6 border-t border-gray-700/50 pt-6">
            {workout.exercises.map((exercise, idx) => (
              <div key={idx} className="bg-gray-800/40 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">
                  {exercise.name}
                </h4>
                
                {exercise.equipment && (
                  <p className="text-gray-400 text-sm mb-2">
                    Equipment: {exercise.equipment}
                  </p>
                )}
                
                {exercise.notes && (
                  <p className="text-gray-400 text-sm mb-4">
                    {exercise.notes}
                  </p>
                )}

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="pb-2 pr-4 text-sm font-medium text-gray-400">Set</th>
                        <th className="pb-2 px-4 text-sm font-medium text-gray-400">Reps</th>
                        <th className="pb-2 px-4 text-sm font-medium text-gray-400">Weight (kg)</th>
                        <th className="pb-2 pl-4 text-sm font-medium text-gray-400">Rest (sec)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set, setIdx) => (
                        <tr key={setIdx} className="border-b border-gray-700/20 last:border-0">
                          <td className="py-2 pr-4 text-gray-300">{setIdx + 1}</td>
                          <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                          <td className="py-2 px-4 text-gray-300">{set.weight}</td>
                          <td className="py-2 pl-4 text-gray-300">{set.rest_time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedWorkoutCard;