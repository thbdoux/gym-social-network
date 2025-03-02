import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Calendar, Clock, Target, MapPin, 
  User, ClipboardList, ChevronDown, ChevronUp, 
  Dumbbell, Scale, User2, CircleDot, Book, 
  Heart, Droplets, Timer, Zap, Bookmark,
  CheckCircle, BarChart, Download, Share2, Flame,
  Edit, Camera
} from 'lucide-react';
import api from '../../../api';
import { getAvatarUrl } from '../../../utils/imageUtils';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';

const workoutColors = getPostTypeDetails('workout_log').colors;

// Helper function to correctly format dates
const formatDate = (dateString) => {
  // Check if date is in DD/MM/YYYY format
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`).toLocaleDateString();
  }
  // Otherwise try standard parsing
  return new Date(dateString).toLocaleDateString();
};

const ExpandableWorkoutLogModal = ({ workoutLogId, initialWorkoutLogData, isOpen, onClose, onEdit }) => {
  const [workoutLog, setWorkoutLog] = useState(initialWorkoutLogData);
  const [loading, setLoading] = useState(!initialWorkoutLogData);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    if (workoutLog?.exercises?.length > 0) {
      // Initialize only the first exercise as expanded
      const initialExpanded = {};
      const firstExerciseId = workoutLog.exercises[0].id || 0;
      initialExpanded[firstExerciseId] = true;
      setExpandedExercises(initialExpanded);
    }
  }, [workoutLog]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-xl animate-pulse">
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl w-full max-w-5xl overflow-hidden shadow-xl">
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

  // Track expanded exercises independently
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-4 backdrop-blur-md">
      <div className="bg-gray-900 rounded-xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-xl mx-4 flex flex-col border border-gray-700 transform transition-all duration-300">
        {/* Header with background gradient */}
        <div className={`px-6 py-5 bg-gradient-to-r ${workoutColors.gradient} flex justify-between items-center sticky top-0 z-10`}>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{workoutLog.name || "Workout"}</h2>
              <div className="flex items-center mt-1 text-sm text-white/80">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{workoutLog.date ? formatDate(workoutLog.date) : 'No date'}</span>
                {workoutLog.user_username && (
                  <div className="flex items-center ml-3">
                    <User className="w-4 h-4 mr-1" />
                    <span>by {workoutLog.user_username}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(workoutLog)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 text-white"
              >
                <Edit className="w-5 h-5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Two-column Content Layout */}
        <div className="flex-1 overflow-y-auto bg-gray-900 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Workout Details */}
            <div className="md:col-span-1">
              {/* Workout Details Card */}
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 mb-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2 text-blue-400" />
                  Workout Details
                </h3>
                
                <div className="space-y-4">
                  {/* Program */}
                  {workoutLog.program && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                        <Book className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Program</span>
                        <p className="text-white font-medium">{workoutLog.program_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Location */}
                  {workoutLog.gym && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-indigo-500/20 mr-3">
                        <MapPin className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Location</span>
                        <p className="text-white font-medium">{workoutLog.gym_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Duration */}
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-green-500/20 mr-3">
                      <Clock className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Duration</span>
                      <p className="text-white font-medium">{workoutLog.duration || '–'} min</p>
                    </div>
                  </div>
                  
                  {/* Mood */}
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-pink-500/20 mr-3">
                      <Heart className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Mood</span>
                      <p className="flex items-center text-white font-medium">
                        {workoutLog.mood_rating || '–'}/10
                        {workoutLog.mood_rating && (
                          <span className="ml-2">
                            {workoutLog.mood_rating >= 8 ? '😀' : 
                             workoutLog.mood_rating >= 6 ? '🙂' : 
                             workoutLog.mood_rating >= 4 ? '😐' : 
                             workoutLog.mood_rating >= 2 ? '☹️' : '😫'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Difficulty */}
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-amber-500/20 mr-3">
                      <Flame className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Difficulty</span>
                      <p className="text-white font-medium">{workoutLog.perceived_difficulty || '–'}/10</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Performance Notes Section */}
              {workoutLog.performance_notes && (
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 mb-6">
                  <div className="flex items-start mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                      <Book className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white">Performance Notes</h4>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-700/30">
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">{workoutLog.performance_notes}</p>
                  </div>
                </div>
              )}
              
              {/* Media Gallery */}
              {workoutLog.media && workoutLog.media.length > 0 && (
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                  <div className="flex items-start mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                      <Camera className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white">Workout Photos</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {workoutLog.media.map((media, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden aspect-square bg-gray-800 border border-gray-700 hover:border-gray-500 transition-colors group">
                        <img
                          src={typeof media === 'string' ? media : getAvatarUrl(media)}
                          alt={`Workout ${index + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Exercises */}
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Dumbbell className="w-6 h-6 mr-2 text-blue-400" />
                  Exercises
                </h3>
                <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700">
                  {workoutLog.exercises?.length || 0} total
                </span>
              </div>
              
              {workoutLog.exercises && workoutLog.exercises.length > 0 ? (
                <div className="space-y-4">
                  {workoutLog.exercises.map((exercise, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all hover:shadow-md"
                    >
                      <div 
                        className={`p-4 cursor-pointer transition-all ${expandedExercises[exercise.id || index] ? 'bg-gray-800/80' : ''}`}
                        onClick={() => toggleExerciseExpand(exercise.id || index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${workoutColors.bg} hover:scale-110 transition-transform`}>
                              <Dumbbell className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white text-lg">{exercise.name}</h4>
                              <div className="flex items-center space-x-3 text-sm text-gray-400 mt-1">
                                {exercise.equipment && (
                                  <span>{exercise.equipment}</span>
                                )}
                                {exercise.sets && (
                                  <>
                                    {exercise.equipment && <span>•</span>}
                                    <span>{exercise.sets.length} sets</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-right mr-4 hidden sm:block">
                              <div className="text-gray-400 text-sm">Total Volume</div>
                              <div className="text-white font-medium">
                                {exercise.sets ? 
                                  exercise.sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0) : 0} kg
                              </div>
                            </div>
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-700 transition-colors">
                              {expandedExercises[exercise.id || index] ? 
                                <ChevronUp className="w-5 h-5 text-gray-300" /> : 
                                <ChevronDown className="w-5 h-5 text-gray-300" />
                              }
                            </div>
                          </div>
                        </div>
                      </div>

                      {expandedExercises[exercise.id || index] && exercise.sets && (
                        <div className="border-t border-gray-700 p-5 bg-gray-800/80">
                          {/* Sets Table */}
                          <div className="overflow-x-auto rounded-lg border border-gray-600/30 mb-4">
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
                                  <tr 
                                    key={setIdx} 
                                    className="border-b border-gray-700/20 last:border-0 hover:bg-gray-700/40 transition-colors"
                                  >
                                    <td className="py-2 px-4 text-gray-300 font-medium">{setIdx + 1}</td>
                                    <td className="py-2 px-4 text-gray-300 font-semibold">{set.weight}</td>
                                    <td className="py-2 px-4 text-gray-300">{set.reps}</td>
                                    <td className="py-2 px-4 text-gray-300">{set.rest_time}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Exercise Stats & Notes */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                            <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30 text-center">
                              <div className="text-sm text-gray-400">Total Volume</div>
                              <div className="text-xl font-bold text-white">
                                {exercise.sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0)} kg
                              </div>
                            </div>
                            <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30 text-center">
                              <div className="text-sm text-gray-400">Max Weight</div>
                              <div className="text-xl font-bold text-white">
                                {Math.max(...exercise.sets.map(s => s.weight || 0))} kg
                              </div>
                            </div>
                            <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30 text-center">
                              <div className="text-sm text-gray-400">Total Reps</div>
                              <div className="text-xl font-bold text-white">
                                {exercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0)}
                              </div>
                            </div>
                          </div>
                          
                          {exercise.notes && (
                            <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-700/30">
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
                <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-gray-400">No exercises recorded for this workout.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg border border-gray-700 animate-fadeIn">
            {toastMessage}
          </div>
        )}

        {/* Add custom CSS for animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ExpandableWorkoutLogModal;