import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Calendar, Clock, Target, MapPin, 
  User, ClipboardList, ChevronDown, ChevronUp, 
  Dumbbell, Scale, User2, CircleDot, Book, 
  Heart, Droplets, Timer, Zap, Bookmark,
  CheckCircle, BarChart, Download, Share2, Flame
} from 'lucide-react';
import api from '../../../api';
import { getAvatarUrl } from '../../../utils/imageUtils';

const ExpandableWorkoutLogModal = ({ workoutLogId, initialWorkoutLogData, isOpen, onClose }) => {
  const [workoutLog, setWorkoutLog] = useState(initialWorkoutLogData);
  const [loading, setLoading] = useState(!initialWorkoutLogData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedExercises, setExpandedExercises] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl animate-pulse">
          <div className="h-16 bg-gray-800 mb-4"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-800 rounded w-1/3"></div>
            <div className="h-24 bg-gray-800 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-gray-800 rounded"></div>
              <div className="h-20 bg-gray-800 rounded"></div>
              <div className="h-20 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workoutLog) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl w-full max-w-4xl overflow-hidden shadow-xl">
          <div className="p-6 text-center">
            <div className="text-red-400 text-lg">{error || "Unable to load workout log"}</div>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
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

  const handleShareWorkout = () => {
    setToastMessage('Workout link copied to clipboard!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDownloadWorkout = () => {
    setToastMessage('Workout data downloaded!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl mx-4 flex flex-col border border-gray-700">
        {/* Header with background gradient */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-800 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{workoutLog.name || "Workout"}</h2>
              <div className="flex items-center mt-1 text-sm text-white/80">
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
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800 border-b border-gray-700 px-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-4 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'overview'
                ? 'text-white bg-gray-900 border-t-2 border-l border-r border-gray-700 border-t-blue-400'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-5 py-4 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'exercises'
                ? 'text-white bg-gray-900 border-t-2 border-l border-r border-gray-700 border-t-blue-400'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Exercises
          </button>
          {workoutLog.performance_notes && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-5 py-4 text-sm font-medium transition-colors rounded-t-lg ${
                activeTab === 'notes'
                  ? 'text-white bg-gray-900 border-t-2 border-l border-r border-gray-700 border-t-blue-400'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Notes
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors hover:bg-gray-800">
                    <div className="flex items-center text-gray-400 mb-3">
                      <ClipboardList className="w-5 h-5 mr-2 text-blue-400" />
                      <span className="text-gray-300">Exercises</span>
                    </div>
                    <p className="text-xl font-bold text-white">{workoutLog.exercises?.length || 0}</p>
                  </div>
                  
                  <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors hover:bg-gray-800">
                    <div className="flex items-center text-gray-400 mb-3">
                      <Clock className="w-5 h-5 mr-2 text-purple-400" />
                      <span className="text-gray-300">Duration</span>
                    </div>
                    <p className="text-xl font-bold text-white">{workoutLog.duration || '–'} min</p>
                  </div>
                  
                  <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors hover:bg-gray-800">
                    <div className="flex items-center text-gray-400 mb-3">
                      <Target className="w-5 h-5 mr-2 text-indigo-400" />
                      <span className="text-gray-300">Performance</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {workoutLog.mood_rating ? `${workoutLog.mood_rating}/10` : '-'}
                    </p>
                  </div>
                </div>

                {/* Location and Program Info */}
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Workout Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {workoutLog.gym && (
                      <div className="flex justify-between py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Location</span>
                        <span className="text-white">{workoutLog.gym_name}</span>
                      </div>
                    )}
                    
                    {workoutLog.program && (
                      <div className="flex justify-between py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Program</span>
                        <span className="text-white flex items-center">
                          <Book className="w-4 h-4 mr-1" />
                          {workoutLog.program_name || "Program"}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-2 border-b border-gray-700/50">
                      <span className="text-gray-400">Status</span>
                      <span className={`flex items-center ${workoutLog.completed ? 'text-green-400' : 'text-blue-400'}`}>
                        {workoutLog.completed ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-1" />
                            In Progress
                          </>
                        )}
                      </span>
                    </div>
                    
                    {workoutLog.perceived_difficulty && (
                      <div className="flex justify-between py-2 border-b border-gray-700/50">
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
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/80 transition-colors">
                        <h4 className="text-white font-medium mb-2 flex items-center">
                          <Heart className="w-4 h-4 mr-2 text-pink-400" />
                          Mood Rating
                        </h4>
                        <div className="flex items-center">
                          <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${(workoutLog.mood_rating / 10) * 100}%` }}
                            />
                          </div>
                          <span className="ml-3 text-white font-medium">{workoutLog.mood_rating}/10</span>
                        </div>
                      </div>
                    )}

                    {workoutLog.perceived_difficulty && (
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/80 transition-colors">
                        <h4 className="text-white font-medium mb-2 flex items-center">
                          <Flame className="w-4 h-4 mr-2 text-purple-400" />
                          Perceived Difficulty
                        </h4>
                        <div className="flex items-center">
                          <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500"
                              style={{ width: `${(workoutLog.perceived_difficulty / 10) * 100}%` }}
                            />
                          </div>
                          <span className="ml-3 text-white font-medium">{workoutLog.perceived_difficulty}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Media Gallery */}
                {workoutLog.media && workoutLog.media.length > 0 && (
                  <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-3">Photos</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {workoutLog.media.map((media, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden aspect-square bg-gray-800 border border-gray-700 hover:border-gray-500 transition-colors group">
                          <img
                            src={typeof media === 'string' ? media : getAvatarUrl(media)}
                            alt={`Workout ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="p-2 w-full">
                              <span className="text-white text-sm">Photo {index + 1}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exercises' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Exercises</h3>
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700">
                    {workoutLog.exercises?.length || 0} total
                  </span>
                </div>
                
                {workoutLog.exercises && workoutLog.exercises.length > 0 ? (
                  <div className="space-y-4">
                    {workoutLog.exercises.map((exercise, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all hover:shadow-md group"
                      >
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => toggleExerciseExpand(exercise.id || index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 group-hover:scale-110 transition-transform">
                                <Dumbbell className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white text-lg">{exercise.name}</h4>
                                {exercise.equipment && (
                                  <p className="text-sm text-gray-400 mt-1">
                                    Equipment: {exercise.equipment}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 group-hover:bg-gray-700 transition-colors">
                              {expandedExercises[exercise.id || index] ? 
                                <ChevronUp className="w-5 h-5 text-gray-300" /> : 
                                <ChevronDown className="w-5 h-5 text-gray-300" />
                              }
                            </div>
                          </div>
                        </div>

                        {expandedExercises[exercise.id || index] && exercise.sets && (
                          <div className="border-t border-gray-700 p-5 bg-gray-800/80">
                            {/* Sets Table */}
                            <div className="overflow-x-auto rounded-lg border border-gray-600/30">
                              <table className="w-full text-left bg-gray-800/50">
                                <thead>
                                  <tr className="border-b border-gray-700/50 bg-gray-700/30">
                                    <th className="py-2 px-4 font-medium text-gray-300">
                                      <span>Set</span>
                                    </th>
                                    <th className="py-2 px-4 font-medium text-gray-300">
                                      <div className="flex items-center">
                                        <Scale className="w-4 h-4 mr-1 text-blue-400" />
                                        <span>Weight (kg)</span>
                                      </div>
                                    </th>
                                    <th className="py-2 px-4 font-medium text-gray-300">
                                      <div className="flex items-center">
                                        <CircleDot className="w-4 h-4 mr-1 text-purple-400" />
                                        <span>Reps</span>
                                      </div>
                                    </th>
                                    <th className="py-2 px-4 font-medium text-gray-300">
                                      <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1 text-indigo-400" />
                                        <span>Rest (sec)</span>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {exercise.sets.map((set, setIdx) => (
                                    <tr key={setIdx} className="border-b border-gray-700/20 last:border-0 hover:bg-gray-700/20 transition-colors">
                                      <td className="py-2 px-4 text-gray-300 font-medium">{setIdx + 1}</td>
                                      <td className="py-2 px-4 text-gray-300">{set.weight}</td>
                                      <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                                      <td className="py-2 px-4 text-gray-300">{set.rest_time}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            {exercise.notes && (
                              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-700/30">
                                <p className="text-sm text-gray-300">
                                  <span className="font-medium text-white mr-2">Notes:</span>
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
                  <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700 mt-4">
                    <p className="text-gray-400">No exercises recorded for this workout.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && workoutLog.performance_notes && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Performance Notes</h3>
                  <span className="text-gray-400 text-sm flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> 
                    {new Date(workoutLog.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                  <div className="flex items-start mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                      <Book className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-white mb-1">Workout Reflection</h4>
                      <p className="text-sm text-gray-400">Personal notes and observations from this session</p>
                    </div>
                  </div>
                  <div className="mt-3 p-4 bg-gray-700/30 rounded-lg border border-gray-700/30">
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">{workoutLog.performance_notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-between items-center sticky bottom-0">
          <div>
            {workoutLog.completed && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Completed
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShareWorkout}
              className="px-4 py-2 bg-gray-700/70 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            
            <button
              onClick={handleDownloadWorkout}
              className="px-4 py-2 bg-gray-700/70 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Toast notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-700 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableWorkoutLogModal;