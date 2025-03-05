import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Calendar, Clock, Target, MapPin, 
  User, ClipboardList, ChevronDown, ChevronUp, 
  Dumbbell, Scale, CircleDot, Book, 
  Heart, Droplets, Timer, Zap, Bookmark,
  CheckCircle, BarChart, Download, Share2, Flame,
  Edit, Camera, Info
} from 'lucide-react';
import api from '../../../api';
import { getAvatarUrl } from '../../../utils/imageUtils';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';

const workoutColors = getPostTypeDetails('workout_log').colors;

// Helper function to correctly format dates
const formatDate = (dateString) => {
  try {
    // Check if date is in DD/MM/YYYY format
    if (typeof dateString === 'string' && dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return new Date(`${year}-${month}-${day}`).toLocaleDateString();
    }
    // Otherwise try standard parsing
    return new Date(dateString).toLocaleDateString();
  } catch(e) {
    return dateString; // Return as is if parsing fails
  }
};

const ExpandableWorkoutLogModal = ({ workoutLogId, initialWorkoutLogData, isOpen, onClose, onEdit }) => {
  const [workoutLog, setWorkoutLog] = useState(initialWorkoutLogData);
  const [loading, setLoading] = useState(!initialWorkoutLogData);
  const [error, setError] = useState(null);
  const [expandedExercises, setExpandedExercises] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'exercises', 'details'

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
        <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-xl animate-pulse">
          <div className="h-16 bg-gradient-to-r from-green-600/50 to-emerald-600/50 mb-4"></div>
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

  const getMoodEmoji = (rating) => {
    if (!rating) return null;
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };

  // Calculate total volume, heaviest weight, and total reps
  const calculateStats = () => {
    let totalVolume = 0;
    let heaviestWeight = 0;
    let totalReps = 0;
    let totalSets = 0;

    if (workoutLog.exercises) {
      workoutLog.exercises.forEach(exercise => {
        if (exercise.sets) {
          totalSets += exercise.sets.length;
          
          exercise.sets.forEach(set => {
            const weight = Number(set.weight) || 0;
            const reps = Number(set.reps) || 0;
            
            totalVolume += weight * reps;
            totalReps += reps;
            
            if (weight > heaviestWeight) {
              heaviestWeight = weight;
            }
          });
        }
      });
    }

    return { totalVolume, heaviestWeight, totalReps, totalSets };
  };

  const stats = calculateStats();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-4 backdrop-blur-md">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl mx-4 flex flex-col border border-gray-700/50 animate-fadeIn">
        {/* Header with background gradient */}
        <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-emerald-600 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{workoutLog.name || "Workout"}</h2>
              <div className="flex items-center flex-wrap mt-1 text-sm text-white/80">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{workoutLog.date ? formatDate(workoutLog.date) : 'No date'}</span>
                </div>
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
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors group"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="border-b border-gray-800 bg-gray-900/80 sticky top-[73px] z-10 backdrop-blur-sm">
          <div className="flex px-6">
            <button
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview' 
                  ? 'border-green-500 text-green-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'exercises' 
                  ? 'border-green-500 text-green-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
              onClick={() => setActiveTab('exercises')}
            >
              Exercises
            </button>
            <button
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details' 
                  ? 'border-green-500 text-green-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-900 p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="animate-fadeIn">
              {/* Workout Summary Card */}
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl overflow-hidden border border-green-700/30 mb-6">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Workout Summary</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full border border-green-600/30 flex items-center text-sm">
                          <Dumbbell className="w-4 h-4 mr-1.5" />
                          {workoutLog.exercises?.length || 0} exercises
                        </span>
                        {workoutLog.completed && (
                          <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full border border-green-600/30 flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Completed
                          </span>
                        )}
                        {workoutLog.program && (
                          <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full border border-indigo-600/30 flex items-center text-sm">
                            <Book className="w-4 h-4 mr-1.5" />
                            {workoutLog.program_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Mood and Difficulty */}
                    <div className="flex flex-wrap gap-4 items-center">
                      {workoutLog.mood_rating && (
                        <div className="bg-pink-900/30 rounded-lg p-3 border border-pink-700/30 text-center min-w-[90px]">
                          <div className="text-3xl mb-1">{getMoodEmoji(workoutLog.mood_rating)}</div>
                          <div className="text-xs text-gray-400">Mood: {workoutLog.mood_rating}/10</div>
                        </div>
                      )}
                      
                      {workoutLog.perceived_difficulty && (
                        <div className="bg-amber-900/30 rounded-lg p-3 border border-amber-700/30 text-center min-w-[90px]">
                          <div className="text-xl font-bold text-white mb-1">{workoutLog.perceived_difficulty}/10</div>
                          <div className="text-xs text-gray-400">Difficulty</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Performance Notes */}
                  {workoutLog.performance_notes && (
                    <div className="mt-4 bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                      <p className="text-gray-300 text-sm">{workoutLog.performance_notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-900/20 to-green-800/30 p-4 rounded-lg border border-green-700/30 text-center">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-white">{workoutLog.duration || '—'}</p>
                  <p className="text-xs text-gray-400 mt-1">Minutes</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/30 p-4 rounded-lg border border-blue-700/30 text-center">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-white">{stats.totalSets}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Sets</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/30 p-4 rounded-lg border border-purple-700/30 text-center">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-xl font-bold text-white">{stats.totalReps}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Reps</p>
                </div>
                
                <div className="bg-gradient-to-br from-pink-900/20 to-pink-800/30 p-4 rounded-lg border border-pink-700/30 text-center">
                  <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Scale className="w-5 h-5 text-pink-400" />
                  </div>
                  <p className="text-xl font-bold text-white">{stats.totalVolume}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Volume (kg)</p>
                </div>
              </div>
              
              {/* Location */}
              {workoutLog.gym && (
                <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-5 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                    Workout Location
                  </h3>
                  
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-blue-900/30 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-white font-medium">{workoutLog.gym_name || workoutLog.gym.name}</h4>
                      {workoutLog.gym.location && (
                        <p className="text-sm text-gray-400">{workoutLog.gym.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Exercises Summary */}
              {workoutLog.exercises && workoutLog.exercises.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Dumbbell className="w-5 h-5 mr-2 text-green-400" />
                      Exercise Summary
                    </h3>
                    <button
                      onClick={() => setActiveTab('exercises')}
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center"
                    >
                      <span>View All</span>
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {workoutLog.exercises.slice(0, 3).map((exercise, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-800/80 rounded-lg p-3 border border-gray-700/50 flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-green-900/30 flex items-center justify-center mr-2 text-green-400 text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-sm">{exercise.name}</h4>
                            <p className="text-xs text-gray-400">{exercise.sets?.length || 0} sets</p>
                          </div>
                        </div>
                        <div className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded">
                          {exercise.sets?.reduce((total, set) => total + (Number(set.weight) * Number(set.reps)), 0) || 0} kg
                        </div>
                      </div>
                    ))}
                    
                    {workoutLog.exercises.length > 3 && (
                      <div className="text-center py-2 text-sm text-green-400">
                        +{workoutLog.exercises.length - 3} more exercises
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Exercises Tab */}
          {activeTab === 'exercises' && (
            <div className="animate-fadeIn">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Dumbbell className="w-6 h-6 mr-2 text-green-400" />
                Exercises
              </h3>
              
              {workoutLog.exercises && workoutLog.exercises.length > 0 ? (
                <div className="space-y-4">
                  {workoutLog.exercises.map((exercise, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-green-700/30 transition-all"
                    >
                      <div 
                        className={`p-4 cursor-pointer transition-all ${expandedExercises[exercise.id || index] ? 'bg-gray-800/80' : ''}`}
                        onClick={() => toggleExerciseExpand(exercise.id || index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 mr-3">
                              <Dumbbell className="w-5 h-5 text-green-400" />
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
                              <div className="text-gray-400 text-sm">Volume</div>
                              <div className="text-white font-medium">
                                {exercise.sets ? 
                                  exercise.sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0) : 0} kg
                              </div>
                            </div>
                            <div className="p-1.5 rounded-full bg-gray-700/50 hover:bg-gray-700 transition-colors">
                              {expandedExercises[exercise.id || index] ? 
                                <ChevronUp className="w-4 h-4 text-gray-300" /> : 
                                <ChevronDown className="w-4 h-4 text-gray-300" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {expandedExercises[exercise.id || index] && exercise.sets && (
                        <div className="border-t border-gray-700 p-5 bg-gray-800/50">
                          {/* Sets Table */}
                          <div className="overflow-x-auto rounded-lg border border-gray-700/30 mb-4">
                            <table className="w-full text-left bg-gray-800/30">
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
                          
                          {/* Exercise Stats */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                            <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30 text-center">
                              <div className="text-sm text-gray-400">Total Volume</div>
                              <div className="text-xl font-bold text-white">
                                {exercise.sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0)} kg
                              </div>
                            </div>
                            <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30 text-center">
                              <div className="text-sm text-gray-400">Max Weight</div>
                              <div className="text-xl font-bold text-white">
                                {Math.max(...exercise.sets.map(s => Number(s.weight) || 0))} kg
                              </div>
                            </div>
                            <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30 text-center">
                              <div className="text-sm text-gray-400">Total Reps</div>
                              <div className="text-xl font-bold text-white">
                                {exercise.sets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Notes */}
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
                <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
                  <p className="text-gray-400">No exercises recorded for this workout.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="animate-fadeIn">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Info className="w-6 h-6 mr-2 text-green-400" />
                Workout Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Workout Details Card */}
                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700/50">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-blue-400" />
                    Basic Information
                  </h4>
                  
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center py-2 border-b border-gray-700/30">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-green-400" />
                        <span className="text-gray-300">Date</span>
                      </div>
                      <span className="text-white font-medium">{workoutLog.date ? formatDate(workoutLog.date) : 'No date'}</span>
                    </li>
                    
                    <li className="flex justify-between items-center py-2 border-b border-gray-700/30">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-amber-400" />
                        <span className="text-gray-300">Duration</span>
                      </div>
                      <span className="text-white font-medium">{workoutLog.duration || '—'} min</span>
                    </li>
                    
                    {workoutLog.program && (
                      <li className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <div className="flex items-center">
                          <Book className="w-4 h-4 mr-2 text-purple-400" />
                          <span className="text-gray-300">Program</span>
                        </div>
                        <span className="text-white font-medium">{workoutLog.program_name}</span>
                      </li>
                    )}
                    
                    {workoutLog.gym && (
                      <li className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-indigo-400" />
                          <span className="text-gray-300">Location</span>
                        </div>
                        <span className="text-white font-medium">{workoutLog.gym_name || workoutLog.gym.name}</span>
                      </li>
                    )}
                    
                    {workoutLog.mood_rating && (
                      <li className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-2 text-pink-400" />
                          <span className="text-gray-300">Mood</span>
                        </div>
                        <span className="text-white font-medium flex items-center">
                          {workoutLog.mood_rating}/10 {getMoodEmoji(workoutLog.mood_rating)}
                        </span>
                      </li>
                    )}
                    
                    {workoutLog.perceived_difficulty && (
                      <li className="flex justify-between items-center py-2">
                        <div className="flex items-center">
                          <Flame className="w-4 h-4 mr-2 text-red-400" />
                          <span className="text-gray-300">Difficulty</span>
                        </div>
                        <span className="text-white font-medium">{workoutLog.perceived_difficulty}/10</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                {/* Media Gallery Card - Only show if media exists */}
                {workoutLog.media && workoutLog.media.length > 0 ? (
                  <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700/50">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-green-400" />
                      Workout Photos
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {workoutLog.media.map((media, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-green-600/50 transition-all group">
                          <img
                            src={typeof media === 'string' ? media : getAvatarUrl(media)}
                            alt={`Workout ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700/50">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                      <BarChart className="w-5 h-5 mr-2 text-green-400" />
                      Workout Statistics
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30">
                        <div className="text-sm text-gray-400">Total Volume</div>
                        <div className="text-xl font-bold text-white">{stats.totalVolume} kg</div>
                      </div>
                      
                      <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30">
                        <div className="text-sm text-gray-400">Heaviest Weight</div>
                        <div className="text-xl font-bold text-white">{stats.heaviestWeight} kg</div>
                      </div>
                      
                      <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30">
                        <div className="text-sm text-gray-400">Total Sets</div>
                        <div className="text-xl font-bold text-white">{stats.totalSets}</div>
                      </div>
                      
                      <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/30">
                        <div className="text-sm text-gray-400">Total Reps</div>
                        <div className="text-xl font-bold text-white">{stats.totalReps}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Performance Notes Card - Only show if notes exist */}
              {workoutLog.performance_notes && (
                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700/50 mt-6">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                    <Book className="w-5 h-5 mr-2 text-blue-400" />
                    Performance Notes
                  </h4>
                  
                  <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-700/30">
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">{workoutLog.performance_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Simple Footer */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end items-center sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-all bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
          >
            Close
          </button>
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