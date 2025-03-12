import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Calendar, Clock, Target, MapPin, 
  User, ClipboardList, ChevronDown, ChevronUp, 
  Dumbbell, Scale, CircleDot, Book, 
  Heart, Droplets, Timer, Zap, 
  CheckCircle, BarChart, Flame,
  Edit, Copy, Tag, Award
} from 'lucide-react';
import { logService } from '../../../api/services';
import gymService from '../../../api/services/gymService';

/**
 * Modal component for displaying detailed workout log information
 * 
 * @param {Object} props Component props
 * @param {string|number} props.logId ID of the workout log to display
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {Function} props.onClose Callback when modal is closed
 * @param {Function} props.onEdit Callback when edit is requested (optional)
 * @param {Object} props.initialLogData Initial log data (optional)
 * @returns {JSX.Element} Expandable workout log modal component
 */
const ExpandableWorkoutLogModal = ({ 
  logId, 
  isOpen, 
  onClose, 
  onEdit,
  initialLogData = null
}) => {
  const [log, setLog] = useState(null);
  const [gymData, setGymData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedExercises, setExpandedExercises] = useState({});

  useEffect(() => {
    const fetchLogDetails = async () => {
      if (!logId) return;
      
      try {
        setLoading(true);
        
        // Always fetch complete data from the API to ensure we have all details
        const logData = await logService.getLogById(logId);
        setLog(logData);
        
        // Fetch gym data if we have a gym ID
        if (logData.gym && typeof logData.gym === 'number') {
          try {
            const fetchedGymData = await gymService.getGymById(logData.gym);
            setGymData(fetchedGymData);
          } catch (gymErr) {
            console.error('Error fetching gym details:', gymErr);
            // Don't set global error, just log it - we still have the workout data
          }
        }
        
        // Initialize exercise expansion state
        if (logData?.exercises?.length > 0) {
          const initialExpanded = {};
          initialExpanded[logData.exercises[0].id || 0] = true;
          setExpandedExercises(initialExpanded);
        }
      } catch (err) {
        console.error('Error fetching workout log details:', err);
        setError('Failed to load workout log details');
      } finally {
        setLoading(false);
      }
    };

    // If we're open and either don't have initialLogData or it's incomplete, fetch the data
    if (isOpen) {
      if (!initialLogData || !initialLogData.exercises) {
        fetchLogDetails();
      } else {
        // Use the provided initialLogData if it seems complete
        setLog(initialLogData);
        
        // Fetch gym data if needed
        if (initialLogData.gym && typeof initialLogData.gym === 'number') {
          const fetchGymInfo = async () => {
            try {
              const fetchedGymData = await gymService.getGymById(initialLogData.gym);
              setGymData(fetchedGymData);
            } catch (gymErr) {
              console.error('Error fetching gym details:', gymErr);
            }
          };
          fetchGymInfo();
        }
        
        setLoading(false);
        
        // Initialize exercise expansion state
        if (initialLogData.exercises?.length > 0) {
          const initialExpanded = {};
          initialExpanded[initialLogData.exercises[0].id || 0] = true;
          setExpandedExercises(initialExpanded);
        }
      }
    }
  }, [logId, isOpen, initialLogData]);

  // Track expanded exercises
  const toggleExerciseExpand = (exerciseId) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

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

  if (error || !log) {
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

  // Calculate workout metrics
  const totalExercises = log.exercises?.length || 0;
  const totalSets = log.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0;
  const totalVolume = log.exercises?.reduce((sum, ex) => 
    sum + (ex.sets?.reduce((setSum, set) => 
      setSum + ((set.weight || 0) * (set.reps || 0)), 0) || 0), 0) || 0;
  const totalReps = log.exercises?.reduce((sum, ex) => 
    sum + (ex.sets?.reduce((setSum, set) => 
      setSum + (set.reps || 0), 0) || 0), 0) || 0;

  // Handle gym display - combine data from log and gymData
  const gymDisplayName = gymData ? gymData.name : (
    typeof log.gym === 'string' ? log.gym : 'Unknown Gym'
  );
  
  const gymDisplayLocation = gymData ? gymData.location : null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-4 backdrop-blur-md">
      <div className="bg-gray-900 rounded-xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-xl mx-4 flex flex-col border border-gray-700 transform transition-all duration-300">
        {/* Header with gradient */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 flex-shrink-0">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <h2 className="text-2xl font-bold text-white tracking-tight truncate">
                {log.name || log.workout_name || "Workout Log"}
              </h2>
              <div className="flex items-center mt-1 text-sm text-white/80">
                <span className="truncate">{log.date || new Date().toLocaleDateString()}</span>
                {log.gym && (
                  <div className="flex items-center ml-3 flex-shrink-0">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="truncate">{gymDisplayName}</span>
                  </div>
                )}
                {log.completed && (
                  <div className="flex items-center ml-3 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-2">
            {onEdit && (
              <button
                onClick={() => onEdit(log)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 text-white whitespace-nowrap"
              >
                <Edit className="w-5 h-5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto bg-gray-900 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Log Details */}
            <div className="md:col-span-1">
              {/* Workout Details Card */}
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 mb-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2 text-blue-400" />
                  Workout Details
                </h3>
                
                <div className="space-y-4">
                  {/* Date */}
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Date</span>
                      <p className="text-white font-medium">{log.date}</p>
                    </div>
                  </div>
                  
                  {/* Gym */}
                  {(log.gym || gymData) && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-green-500/20 mr-3">
                        <MapPin className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <span className="text-sm text-gray-400">Gym</span>
                        <p className="text-white font-medium truncate">{gymDisplayName}</p>
                        {gymDisplayLocation && (
                          <p className="text-gray-400 text-sm truncate">{gymDisplayLocation}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Duration */}
                  {log.duration && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-amber-500/20 mr-3">
                        <Clock className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Duration</span>
                        <p className="text-white font-medium">{log.duration} min</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Mood Rating */}
                  {log.mood_rating !== undefined && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                        <Heart className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Mood</span>
                        <p className="text-white font-medium">{log.mood_rating}/10</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Perceived Difficulty */}
                  {log.perceived_difficulty !== undefined && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-red-500/20 mr-3">
                        <Flame className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Difficulty</span>
                        <p className="text-white font-medium">{log.perceived_difficulty}/10</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Completed Status */}
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-indigo-500/20 mr-3">
                      <CheckCircle className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Status</span>
                      <p className="text-white font-medium">
                        {log.completed ? 'Completed' : 'In Progress'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Performance Notes */}
              {log.performance_notes && (
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
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                      {log.performance_notes}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Gym Details - Only show if we have extra details from gymData */}
              {gymData && (gymData.amenities || gymData.hours || gymData.description) && (
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 mb-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-green-400" />
                    Gym Details
                  </h3>
                  
                  <div className="space-y-3">
                    {gymData.description && (
                      <div className="p-3 bg-gray-700/30 rounded-lg">
                        <p className="text-sm text-gray-300">{gymData.description}</p>
                      </div>
                    )}
                    
                    {gymData.hours && (
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                          <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Hours</span>
                          <p className="text-white text-sm">{gymData.hours}</p>
                        </div>
                      </div>
                    )}
                    
                    {gymData.amenities && gymData.amenities.length > 0 && (
                      <div className="flex items-start">
                        <div className="p-2 rounded-lg bg-purple-500/20 mr-3 mt-1">
                          <Tag className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Amenities</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {gymData.amenities.map((amenity, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-700 rounded-md text-xs text-gray-300">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Workout Summary */}
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 mb-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <BarChart className="w-5 h-5 mr-2 text-blue-400" />
                  Workout Summary
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                    <div className="text-sm text-gray-400">Total Exercises</div>
                    <div className="text-xl font-bold text-white">{totalExercises}</div>
                  </div>
                  
                  <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                    <div className="text-sm text-gray-400">Total Sets</div>
                    <div className="text-xl font-bold text-white">{totalSets}</div>
                  </div>
                  
                  <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                    <div className="text-sm text-gray-400">Total Volume</div>
                    <div className="text-xl font-bold text-white">{totalVolume} kg</div>
                  </div>
                  
                  <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                    <div className="text-sm text-gray-400">Total Reps</div>
                    <div className="text-xl font-bold text-white">{totalReps}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Exercises */}
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Dumbbell className="w-6 h-6 mr-2 text-blue-400" />
                  Exercises
                </h3>
                <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700">
                  {log.exercises?.length || 0} total
                </span>
              </div>
              
              {log.exercises && log.exercises.length > 0 ? (
                <div className="space-y-4">
                  {log.exercises.map((exercise, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all hover:shadow-md"
                    >
                      <div 
                        className={`p-4 cursor-pointer transition-all ${expandedExercises[exercise.id || index] ? 'bg-gray-800/80' : ''}`}
                        onClick={() => toggleExerciseExpand(exercise.id || index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 min-w-0 overflow-hidden flex-1">
                            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-110 transition-transform flex-shrink-0">
                              <Dumbbell className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 overflow-hidden">
                              <h4 className="font-semibold text-white text-lg truncate">{exercise.name}</h4>
                              <div className="flex items-center space-x-3 text-sm text-gray-400 mt-1">
                                {exercise.equipment && (
                                  <span className="truncate">{exercise.equipment}</span>
                                )}
                                {exercise.sets && (
                                  <>
                                    {exercise.equipment && <span>•</span>}
                                    <span className="flex-shrink-0">{exercise.sets.length} sets</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center flex-shrink-0 ml-2">
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
                  <p className="text-gray-400">No exercises found in this workout log.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableWorkoutLogModal;