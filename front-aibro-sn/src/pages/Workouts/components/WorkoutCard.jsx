import React, { useState } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronUp, Dumbbell, Calendar, GripVertical } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WorkoutCard = ({ 
  workout, 
  onEdit, 
  onDelete, 
  inProgram = false,
  onUpdate,
  onOrderChange,
  index,
  isDragging,
  dragHandleProps 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChangingDay, setIsChangingDay] = useState(false);

  const handleDayChange = async (e) => {
    const newDay = parseInt(e.target.value);
    if (!isNaN(newDay)) {
      await onUpdate(workout.instance_id, {
        preferred_weekday: newDay
      });
      setIsChangingDay(false);
    }
  };

  const handleDelete = () => {
    if (!window.confirm(inProgram ? 'Remove this workout from the program?' : 'Delete this workout template?')) {
      return;
    }
    onDelete(inProgram ? workout.instance_id : workout.id);
  };

  if (!workout) return null;

  return (
    <div className={`bg-gray-800 rounded-lg p-6 shadow-lg ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          {inProgram && (
            <div 
              {...dragHandleProps}
              className="p-2 hover:bg-gray-700 rounded-lg cursor-move"
            >
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="p-2 bg-blue-600 rounded-lg">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{workout.name}</h3>
            <p className="text-gray-400">
              {workout.split_method?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {inProgram && (
            <div className="flex items-center">
              {isChangingDay ? (
                <select
                  value={workout.preferred_weekday}
                  onChange={handleDayChange}
                  className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
                >
                  {WEEKDAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setIsChangingDay(true)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{WEEKDAYS[workout.preferred_weekday]}</span>
                </button>
              )}
            </div>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(workout)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
              title="Edit workout"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
              title={inProgram ? "Remove from program" : "Delete workout"}
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>  
        </div>
      </div>

      {/* Description and Creator Info */}
      <div className="mt-2 space-y-1">
        {workout.description && (
          <p className="text-gray-400">{workout.description}</p>
        )}
        {workout.creator_username && (
          <p className="text-sm text-gray-500">
            Created by: {workout.creator_username}
          </p>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 space-y-6">
          {workout.exercises?.map((exercise, index) => (
            <div key={index} className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-lg">{exercise.name}</h4>
                  {exercise.equipment && (
                    <p className="text-gray-400 text-sm mt-1">
                      Equipment: {exercise.equipment}
                    </p>
                  )}
                  {exercise.notes && (
                    <p className="text-gray-400 text-sm mt-1">
                      Notes: {exercise.notes}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Sets Table */}
              {exercise.sets && exercise.sets.length > 0 && (
                <div className="mt-4 bg-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-600">
                        <th className="py-2 px-4 text-left text-gray-300 font-medium">Set</th>
                        <th className="py-2 px-4 text-left text-gray-300 font-medium">Reps</th>
                        <th className="py-2 px-4 text-left text-gray-300 font-medium">Weight (kg)</th>
                        <th className="py-2 px-4 text-left text-gray-300 font-medium">Rest (sec)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set, setIndex) => (
                        <tr key={setIndex} className="border-t border-gray-600">
                          <td className="py-2 px-4 text-gray-300">{setIndex + 1}</td>
                          <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                          <td className="py-2 px-4 text-gray-300">{set.weight}</td>
                          <td className="py-2 px-4 text-gray-300">{set.rest_time}</td>
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
  );
};

export default WorkoutCard;