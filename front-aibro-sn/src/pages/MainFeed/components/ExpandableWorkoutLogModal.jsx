import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Calendar, Clock, Target, MapPin, 
  User, ClipboardList, ChevronDown, ChevronUp, 
  Dumbbell, Scale, User2, CircleDot, Book
} from 'lucide-react';
import api from '../../../api';
import { getAvatarUrl } from '../../../utils/imageUtils';

const ExpandableWorkoutLogModal = ({ workoutLogId, initialWorkoutLogData, isOpen, onClose }) => {
  const [workoutLog, setWorkoutLog] = useState(initialWorkoutLogData);
  const [loading, setLoading] = useState(!initialWorkoutLogData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedExercises, setExpandedExercises] = useState({});
  console.log("LOG:", workoutLog);

  useEffect(() => {
    const fetchWorkoutLogDetails = async () => {
      if (workoutLogId && !workoutLog) {
        try {
          setLoading(true);
          const response = await api.get(`/workouts/logs/${workoutLogId}/`);
          setWorkoutLog(response.data);
        } catch (err) {
          console.error('Error fetching workout log details:', err);
          setError('Failed to load workout log details');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchWorkoutLogDetails();
    }
  }, [workoutLogId, workoutLog, isOpen]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl animate-pulse">
          <div className="h-16 bg-gray-700 mb-4"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workoutLog) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-xl">
          <div className="p-6 text-center">
            <div className="text-red-400 text-lg">{error || "Unable to load workout log"}</div>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const toggleExerciseExpand = (exerciseId) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl mx-4 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-5 border-b border-gray-700 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{workoutLog.name || "Workout"}</h2>
              <div className="flex items-center mt-1 text-sm text-gray-400">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{new Date(workoutLog.date).toLocaleDateString()}</span>
                {workoutLog.user_username && (
                  <div className="flex items-center ml-3">
                    <User className="w-4 h-4 mr-1" />
                    <span>by {workoutLog.user_username}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'exercises'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Exercises
          </button>
          {workoutLog.performance_notes && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Notes
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-4 rounded-xl">
                    <div className="flex items-center text-gray-400 mb-2">
                      <ClipboardList className="w-5 h-5 mr-2" />
                      <span>Exercises</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{workoutLog.exercises?.length || 0}</p>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-xl">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>Duration</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{workoutLog.duration || '–'} min</p>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-xl">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Target className="w-5 h-5 mr-2" />
                      <span>Performance</span>
                    </div>
                    <p className="text-xl font-semibold text-white">
                      {workoutLog.mood_rating ? `${workoutLog.mood_rating}/10` : '-'}
                    </p>
                  </div>
                </div>

                {/* Location and Program Info */}
                <div className="bg-gray-800 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-3">Workout Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {workoutLog.gym && (
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Location</span>
                        <span className="text-white">{workoutLog.gym_name}</span>
                      </div>
                    )}
                    
                    {workoutLog.program && (
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Program</span>
                        <span className="text-white flex items-center">
                          <Book className="w-4 h-4 mr-1" />
                          {workoutLog.program_name || "Program"}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Status</span>
                      <span className={`text-white ${workoutLog.completed ? 'text-green-400' : 'text-yellow-400'}`}>
                        {workoutLog.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    
                    {workoutLog.perceived_difficulty && (
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">Difficulty</span>
                        <span className="text-white">{workoutLog.perceived_difficulty}/10</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                {(workoutLog.mood_rating || workoutLog.perceived_difficulty) && (
                  <div className="grid grid-cols-2 gap-4">
                    {workoutLog.mood_rating && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">Mood Rating</h4>
                        <div className="flex items-center">
                          <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${(workoutLog.mood_rating / 10) * 100}%` }}
                            />
                          </div>
                          <span className="ml-2 text-white font-medium">{workoutLog.mood_rating}/10</span>
                        </div>
                      </div>
                    )}

                    {workoutLog.perceived_difficulty && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">Perceived Difficulty</h4>
                        <div className="flex items-center">
                          <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500"
                              style={{ width: `${(workoutLog.perceived_difficulty / 10) * 100}%` }}
                            />
                          </div>
                          <span className="ml-2 text-white font-medium">{workoutLog.perceived_difficulty}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Media Gallery */}
                {workoutLog.media && workoutLog.media.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Photos</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {workoutLog.media.map((media, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden aspect-square">
                          <img
                            src={typeof media === 'string' ? media : getAvatarUrl(media)}
                            alt={`Workout ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exercises' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">Exercises</h3>
                {workoutLog.exercises && workoutLog.exercises.length > 0 ? (
                  <div className="space-y-4">
                    {workoutLog.exercises.map((exercise, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => toggleExerciseExpand(exercise.id || index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-500/20 p-2 rounded-lg">
                                <Dumbbell className="w-5 h-5 text-green-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{exercise.name}</h4>
                                {exercise.equipment && (
                                  <p className="text-sm text-gray-400 mt-1">
                                    Equipment: {exercise.equipment}
                                  </p>
                                )}
                              </div>
                            </div>
                            {expandedExercises[exercise.id || index] ? 
                              <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            }
                          </div>
                        </div>

                        {expandedExercises[exercise.id || index] && exercise.sets && (
                          <div className="border-t border-gray-700 p-4 bg-gray-800/50">
                            {/* Sets Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="border-b border-gray-700/50">
                                    <th className="pb-2 pr-4 text-sm font-medium text-gray-400">Set</th>
                                    <th className="pb-2 px-4 text-sm font-medium text-gray-400">
                                      <div className="flex items-center">
                                        <Scale className="w-4 h-4 mr-1" />
                                        <span>Weight (kg)</span>
                                      </div>
                                    </th>
                                    <th className="pb-2 px-4 text-sm font-medium text-gray-400">
                                      <div className="flex items-center">
                                        <CircleDot className="w-4 h-4 mr-1" />
                                        <span>Reps</span>
                                      </div>
                                    </th>
                                    <th className="pb-2 pl-4 text-sm font-medium text-gray-400">
                                      <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span>Rest (sec)</span>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {exercise.sets.map((set, setIdx) => (
                                    <tr key={setIdx} className="border-b border-gray-700/20 last:border-0">
                                      <td className="py-2 pr-4 text-gray-300">{setIdx + 1}</td>
                                      <td className="py-2 px-4 text-gray-300">{set.weight}</td>
                                      <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                                      <td className="py-2 pl-4 text-gray-300">{set.rest_time}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            {exercise.notes && (
                              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                                <p className="text-sm text-gray-400">
                                  <span className="font-medium text-gray-300">Notes: </span>
                                  {exercise.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-800 rounded-xl">
                    <p className="text-gray-400">No exercises recorded for this workout.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && workoutLog.performance_notes && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">Performance Notes</h3>
                <div className="bg-gray-800 p-6 rounded-xl">
                  <p className="text-gray-300 whitespace-pre-line">{workoutLog.performance_notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpandableWorkoutLogModal;