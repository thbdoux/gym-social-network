import React, { useState } from 'react';
import { 
  Calendar, Clock, Dumbbell, Edit2, Trash2, 
  ChevronDown, ChevronUp, Book, ClipboardList, 
  Loader2, MapPin, Activity, BarChart2, Scale,
  Heart, Flame, CheckCircle, X
} from 'lucide-react';
import { useGyms } from '../hooks/useGyms';

const WorkoutLogCard = ({ log, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { gyms, loading: gymsLoading } = useGyms();
  
  const gymName = React.useMemo(() => {
    if (!log.gym) return 'Not specified';
    const gym = gyms.find(g => g.id === log.gym);
    return gym ? `${gym.name}` : 'Loading...';
  }, [log.gym, gyms]);
  
  // Format date for better display
  const formattedDate = log.date || 'No date';
  
  const getMoodEmoji = (rating) => {
    if (!rating) return '😐';
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      {/* Status Indicator Line */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-700" />
      
      <div className="p-4">
        {/* Header with basic info */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-white">
                {log.workout_name}
              </h4>
              {log.completed && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </span>
              )}
            </div>
            <div className="flex items-center mt-1 text-sm text-gray-400 space-x-3">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formattedDate}</span>
              </div>
              {log.program && (
                <div className="flex items-center">
                  <Book className="w-4 h-4 mr-1" />
                  <span>{log.program_name}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(log);
              }}
              className="p-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all"
              aria-label="Edit workout"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(log);
              }}
              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all"
              aria-label="Delete workout"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-colors group"
              aria-label={isExpanded ? "Collapse workout details" : "Expand workout details"}
            >
              {isExpanded ? 
                <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-white" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white" />
              }
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
            <div className="flex items-center text-gray-400 mb-1 text-sm">
              <Dumbbell className="w-4 h-4 mr-1 text-blue-400" />
              <span>Exercises</span>
            </div>
            <p className="text-white font-bold text-lg">
              {log.exercise_count}
            </p>
          </div>
          
          <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
            <div className="flex items-center text-gray-400 mb-1 text-sm">
              <Clock className="w-4 h-4 mr-1 text-purple-400" />
              <span>Duration</span>
            </div>
            <p className="text-white font-bold text-lg">
              {log.duration} <span className="text-sm font-normal">min</span>
            </p>
          </div>
          
          <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
            <div className="flex items-center text-gray-400 mb-1 text-sm">
              <Heart className="w-4 h-4 mr-1 text-pink-400" />
              <span>Mood</span>
            </div>
            <p className="text-white font-bold text-lg flex items-center">
              {log.mood_rating ? (
                <>
                  <span className="mr-1">{log.mood_rating}/10</span>
                  <span className="text-xl">{getMoodEmoji(log.mood_rating)}</span>
                </>
              ) : '-'}
            </p>
          </div>
          
          <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
            <div className="flex items-center text-gray-400 mb-1 text-sm">
              <Flame className="w-4 h-4 mr-1 text-red-400" />
              <span>Difficulty</span>
            </div>
            <p className="text-white font-bold text-lg">
              {log.perceived_difficulty ? `${log.perceived_difficulty}/10` : '-'}
            </p>
          </div>
        </div>

        {/* Expandable Exercise List */}
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {/* Gym Info */}
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <h5 className="font-medium text-white">Gym Location</h5>
              </div>
              <p className="mt-1 text-gray-300">
                {gymsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  gymName
                )}
              </p>
            </div>
            
            {/* Performance Metrics */}
            {(log.mood_rating || log.perceived_difficulty) && (
              <div className="grid grid-cols-2 gap-4">
                {log.mood_rating && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/80 transition-colors">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-pink-400" />
                      Mood Rating
                    </h4>
                    <div className="flex items-center">
                      <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(log.mood_rating / 10) * 100}%` }}
                        />
                      </div>
                      <span className="ml-3 text-white font-medium">{log.mood_rating}/10</span>
                    </div>
                  </div>
                )}

                {log.perceived_difficulty && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/80 transition-colors">
                    <h4 className="text-white font-medium mb-2 flex items-center">
                      <Flame className="w-4 h-4 mr-2 text-red-400" />
                      Perceived Difficulty
                    </h4>
                    <div className="flex items-center">
                      <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${(log.perceived_difficulty / 10) * 100}%` }}
                        />
                      </div>
                      <span className="ml-3 text-white font-medium">{log.perceived_difficulty}/10</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Notes (if any) */}
            {log.performance_notes && (
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <Book className="w-4 h-4 mr-2 text-blue-400" />
                  Performance Notes
                </h4>
                <p className="text-gray-300 text-sm whitespace-pre-line">{log.performance_notes}</p>
              </div>
            )}

            {/* Exercise List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">Exercises</h4>
                <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded-lg text-xs border border-gray-700">
                  {log.exercise_count} total
                </span>
              </div>
              
              {log.exercises?.map((exercise, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50 hover:border-gray-600/50 transition-all mb-3 last:mb-0"
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Dumbbell className="w-4 h-4 text-blue-400" />
                        </div>
                        <h5 className="font-medium text-white">{exercise.name}</h5>
                      </div>
                      {exercise.equipment && (
                        <span className="text-xs bg-gray-700/70 text-gray-300 px-2 py-1 rounded">
                          {exercise.equipment}
                        </span>
                      )}
                    </div>

                    {exercise.sets?.length > 0 && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-full text-sm">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-700/50">
                              <th className="text-left py-1 px-2">Set</th>
                              <th className="text-left py-1 px-2">
                                <div className="flex items-center">
                                  <Scale className="w-3 h-3 mr-1 text-blue-400" />
                                  <span>Weight</span>
                                </div>
                              </th>
                              <th className="text-left py-1 px-2">
                                <div className="flex items-center">
                                  <BarChart2 className="w-3 h-3 mr-1 text-purple-400" />
                                  <span>Reps</span>
                                </div>
                              </th>
                              <th className="text-left py-1 px-2">
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1 text-indigo-400" />
                                  <span>Rest</span>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {exercise.sets.map((set, setIdx) => (
                              <tr key={setIdx} className="border-b border-gray-700/20 last:border-0 text-gray-300">
                                <td className="py-1.5 px-2 font-medium">{setIdx + 1}</td>
                                <td className="py-1.5 px-2">{set.weight} kg</td>
                                <td className="py-1.5 px-2">{set.reps}</td>
                                <td className="py-1.5 px-2">{set.rest_time}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {exercise.notes && (
                      <div className="mt-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded">
                        <span className="font-medium text-gray-300 mr-1">Notes:</span>
                        {exercise.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutLogCard;