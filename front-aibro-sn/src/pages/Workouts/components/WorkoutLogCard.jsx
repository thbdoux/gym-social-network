import React from 'react';
import { Calendar, Clock, Dumbbell, ChevronRight, Edit2, Trash2 } from 'lucide-react';

const WorkoutLogCard = ({ log, onClick, onEdit, onDelete }) => {
  const statusColors = {
    pending: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-400',
      icon: 'from-yellow-500 to-orange-500'
    },
    validated: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      text: 'text-green-400',
      icon: 'from-green-500 to-emerald-500'
    }
  };

  const colors = statusColors[log.status];

  return (
    <div 
      className={`${colors.bg} border ${colors.border} rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10`}
    >
      {/* Status Indicator Line */}
      <div className={`h-1 w-full bg-gradient-to-r ${colors.icon}`} />
      
      <div className="p-4">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
              {log.workout_name}
            </h3>
            <div className="flex items-center mt-1 text-sm text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{log.date}</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.text} ${colors.bg} border ${colors.border}`}>
            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-800/50 rounded-lg mb-4">
          <div className="text-sm">
            <div className="flex items-center text-gray-400 mb-1">
              <Dumbbell className="w-4 h-4 mr-1" />
              <span>Exercises</span>
            </div>
            <p className="text-white font-medium">{log.exercise_count}</p>
          </div>
          
          <div className="text-sm">
            <div className="flex items-center text-gray-400 mb-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>Duration</span>
            </div>
            <p className="text-white font-medium">{log.duration} min</p>
          </div>
          
          <div className="text-sm">
            <div className="flex items-center text-gray-400 mb-1">
              <Calendar className="w-4 h-4 mr-1" />
              <span>Location</span>
            </div>
            <p className="text-white font-medium">{log.gym}</p>
          </div>
        </div>

        {/* Performance Rating (for validated logs) */}
        {log.status === 'validated' && (
          <div className="text-sm">
            <span className="text-gray-400">Performance</span>
            <div className="flex items-center mt-2">
              <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${colors.icon}`}
                  style={{ width: `${log.performance_rating}%` }}
                />
              </div>
              <span className="ml-2 text-white font-medium">{log.performance_rating}%</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
          <div className="flex space-x-2">
            {/* Only show edit/delete for validated logs */}
            {log.status === 'validated' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(log);
                  }}
                  className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(log);
                  }}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={onClick}
            className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
          >
            <span>{log.status === 'pending' ? 'Log Workout' : 'View Details'}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLogCard;