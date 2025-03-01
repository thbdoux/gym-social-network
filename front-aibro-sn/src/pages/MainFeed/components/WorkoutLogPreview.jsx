import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Calendar, Clock, Target, ChevronDown, ChevronUp, 
  ClipboardList, MapPin, Heart, BarChart2, Scale, Flame, Activity,
  CheckCircle, X, Eye
} from 'lucide-react';
import api from '../../../api';
import ExpandableWorkoutLogModal from './ExpandableWorkoutLogModal';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';

const workoutColors = getPostTypeDetails('workout_log').colors;

const WorkoutLogPreview = ({ workoutLogId, workoutLog: initialWorkoutLog, canEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [workoutLog, setWorkoutLog] = useState(initialWorkoutLog);
  const [loading, setLoading] = useState(!initialWorkoutLog);
  const [showModal, setShowModal] = useState(false);

  // Fetch workout log details if not provided
  useEffect(() => {
    const fetchWorkoutLog = async () => {
      if (!workoutLogId || workoutLog) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/workouts/logs/${workoutLogId}/`);
        setWorkoutLog(response.data);
      } catch (err) {
        console.error('Error fetching workout log:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutLog();
  }, [workoutLogId]);

  if (!workoutLog) return null;

  const handleCardClick = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const getMoodEmoji = (rating) => {
    if (!rating) return '😐';
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };

  return (
    <>
      <div 
        className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Status Indicator Line */}
        <div className={`h-1 w-full bg-gradient-to-r ${workoutColors.gradient}`} />
        <div className="p-4">
          {/* Header with basic info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
              <div className={`${workoutColors.bg} p-2 rounded-lg`}>
                <Activity className={`w-5 h-5 ${workoutColors.text}`} />
              </div>
                <h4 className="text-lg font-semibold text-white">
                  {workoutLog.name || "Workout"}
                </h4>
                {workoutLog.completed && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </span>
                )}
              </div>
              <div className="flex items-center mt-1 text-sm text-gray-400 space-x-3">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{new Date(workoutLog.date).toLocaleDateString()}</span>
                </div>
                {workoutLog.gym && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{workoutLog.gym_name || workoutLog.gym.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors group"
              aria-label={expanded ? "Collapse workout details" : "Expand workout details"}
            >
              {expanded ? 
                <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-white" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white" />
              }
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mt-4">
          <div className={`bg-gray-800/80 p-3 rounded-lg border ${workoutColors.border} hover:border-gray-600/50 transition-colors`}>
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Dumbbell className="w-4 h-4 mr-1 text-blue-400" />
                <span>Exercises</span>
              </div>
              <p className="text-white font-bold text-lg">
                {workoutLog.exercises?.length || 0}
              </p>
            </div>
            
            <div className={`bg-gray-800/80 p-3 rounded-lg border ${workoutColors.border} hover:border-gray-600/50 transition-colors`}>
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Clock className="w-4 h-4 mr-1 text-purple-400" />
                <span>Duration</span>
              </div>
              <p className="text-white font-bold text-lg">
                {workoutLog.duration || '-'} <span className="text-sm font-normal">min</span>
              </p>
            </div>
            
            <div className={`bg-gray-800/80 p-3 rounded-lg border ${workoutColors.border} hover:border-gray-600/50 transition-colors`}>
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Target className="w-4 h-4 mr-1 text-indigo-400" />
                <span>Mood</span>
              </div>
              <p className="text-white font-bold text-lg flex items-center">
                {workoutLog.mood_rating ? (
                  <>
                    <span className="mr-1">{workoutLog.mood_rating}/10</span>
                    <span className="text-xl">{getMoodEmoji(workoutLog.mood_rating)}</span>
                  </>
                ) : '-'}
              </p>
            </div>
            
            <div className={`bg-gray-800/80 p-3 rounded-lg border ${workoutColors.border} hover:border-gray-600/50 transition-colors`}>
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Flame className="w-4 h-4 mr-1 text-red-400" />
                <span>Difficulty</span>
              </div>
              <p className="text-white font-bold text-lg">
                {workoutLog.perceived_difficulty ? `${workoutLog.perceived_difficulty}/10` : '-'}
              </p>
            </div>
          </div>

          {/* Expandable Exercise List */}
          {workoutLog.exercises?.length > 0 && expanded && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-semibold text-white">Exercises</h5>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                  {workoutLog.exercises.length} total
                </span>
              </div>
              
              {workoutLog.exercises.map((exercise, index) => (
                <div key={index} className="bg-gray-800/80 rounded-lg p-3 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${workoutColors.bg}`}>
                        <Dumbbell className={`w-4 h-4 ${workoutColors.text}`} />
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
              ))}
            </div>
          )}

          {/* View Details Button */}
          <div className="mt-4 flex justify-center">
            <button 
              onClick={handleCardClick}
              className={`flex items-center gap-2 px-4 py-2 ${workoutColors.darkBg} ${workoutColors.hoverBg} ${workoutColors.text} rounded-lg transition-colors text-sm font-medium`}
            >
              <Eye className="w-4 h-4" />
              View Full Workout
            </button>
          </div>
        </div>
      </div>

      {/* Workout Log Modal */}
      <ExpandableWorkoutLogModal
        workoutLogId={workoutLogId}
        initialWorkoutLogData={workoutLog}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default WorkoutLogPreview;