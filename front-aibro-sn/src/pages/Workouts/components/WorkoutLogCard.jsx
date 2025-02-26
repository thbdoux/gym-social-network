import React, { useState } from 'react';
import { Calendar, Clock, Dumbbell, Edit2, Trash2, ChevronDown, ChevronUp, Book, ClipboardList, Loader2 } from 'lucide-react';
import { useGyms } from '../hooks/useGyms';

const WorkoutLogCard = ({ log, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { gyms, loading: gymsLoading, error: gymsError } = useGyms();
  
  const gymName = React.useMemo(() => {
    if (!log.gym) return 'Not specified';
    const gym = gyms.find(g => g.id === log.gym);
    return gym ? `${gym.name} - ${gym.location}` : 'Loading...';
  }, [log.gym, gyms]);
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      {/* Blue indicator line instead of status-based colors */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
      
      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Dumbbell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                {log.workout_name}
              </h3>
              <div className="flex items-center mt-1 space-x-3 text-sm text-gray-400">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{log.date}</span>
                </div>
                {log.program && (
                  <div className="flex items-center">
                    <Book className="w-4 h-4 mr-1" />
                    <span>{log.program_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 p-3 bg-gray-800/50 rounded-lg">
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
            <div className="text-white font-medium">
              {gymsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading gym...</span>
                </div>
              ) : gymsError ? (
                <span className="text-red-400">Error loading gym</span>
              ) : (
                gymName
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6 space-y-6 border-t border-gray-700 pt-6">
            {/* Exercise List */}
            <div className="space-y-4">
              {log.exercises?.map((exercise, index) => (
                <div key={index} className="bg-gray-800/50 rounded-xl overflow-hidden">
                  <div className="p-4">
                    {/* Exercise Header */}
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white">
                          {exercise.name}
                        </h4>
                        {exercise.equipment && (
                          <p className="text-sm text-gray-400 mt-1">
                            Equipment: {exercise.equipment}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Sets Table */}
                    <div className="mt-4 overflow-x-auto">
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

                    {exercise.notes && (
                      <p className="mt-4 text-sm text-gray-400">
                        Notes: {exercise.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Mood Rating</h4>
                <div className="flex items-center">
                  <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(log.mood_rating / 10) * 100}%` }}
                    />
                  </div>
                  <span className="ml-2 text-white font-medium">{log.mood_rating}/10</span>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Perceived Difficulty</h4>
                <div className="flex items-center">
                  <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${(log.perceived_difficulty / 10) * 100}%` }}
                    />
                  </div>
                  <span className="ml-2 text-white font-medium">{log.perceived_difficulty}/10</span>
                </div>
              </div>
            </div>

            {/* Performance Notes */}
            {log.performance_notes && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Performance Notes</h4>
                <p className="text-gray-400">{log.performance_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-700">
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
        </div>
      </div>
    </div>
  );
};

export default WorkoutLogCard;