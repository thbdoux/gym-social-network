import React, { useState, useEffect } from 'react';
import { 
  X, Dumbbell, Calendar, Clock, Target, MapPin, 
  User, ChevronDown, ChevronUp, 
  Scale, CircleDot, Book, Award 
} from 'lucide-react';
import { logService, workoutService } from '../../../api/services';

/**
 * Modal component for displaying detailed workout information
 * 
 * @param {Object} props Component props
 * @param {string|number} props.workoutId ID of the workout to display
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {Function} props.onClose Callback when modal is closed
 * @param {boolean} props.isTemplate Whether this is a template workout (vs. an instance)
 * @param {Object} props.initialWorkoutData Initial workout data (optional)
 * @returns {JSX.Element} Expandable workout modal component
 */
const ExpandableWorkoutModal = ({ 
  workoutId, 
  isOpen, 
  onClose, 
  isTemplate = false,
  initialWorkoutData = null
}) => {
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedExercises, setExpandedExercises] = useState({});

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      if (!workoutId) return;
      
      try {
        setLoading(true);
        
        // Always fetch complete data from the API to ensure we have all details
        let workoutData;
        
        if (isTemplate) {
          workoutData = await workoutService.getTemplateById(workoutId);
        } else {
          // For workout logs, use proper service
          workoutData = await logService.getWorkoutInstanceById(workoutId);
        }
        
        setWorkout(workoutData);
        
        // Initialize exercise expansion state
        if (workoutData?.exercises?.length > 0) {
          const initialExpanded = {};
          initialExpanded[workoutData.exercises[0].id || 0] = true;
          setExpandedExercises(initialExpanded);
        }
      } catch (err) {
        console.error('Error fetching workout details:', err);
        setError(`Failed to load ${isTemplate ? 'workout template' : 'workout'} details`);
      } finally {
        setLoading(false);
      }
    };

    // If we're open and either don't have initialWorkoutData or it's incomplete, fetch the data
    if (isOpen) {
      if (!initialWorkoutData || !initialWorkoutData.exercises) {
        fetchWorkoutDetails();
      } else {
        // Use the provided initialWorkoutData if it seems complete
        setWorkout(initialWorkoutData);
        setLoading(false);
        
        // Initialize exercise expansion state
        if (initialWorkoutData.exercises?.length > 0) {
          const initialExpanded = {};
          initialExpanded[initialWorkoutData.exercises[0].id || 0] = true;
          setExpandedExercises(initialExpanded);
        }
      }
    }
  }, [workoutId, isOpen, isTemplate, initialWorkoutData]);

  // Toggle exercise expansion
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
        <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-xl animate-pulse">
          <div className="h-16 bg-gray-800"></div>
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

  if (error || !workout) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl w-full max-w-4xl overflow-hidden shadow-xl">
          <div className="p-6 text-center">
            <div className="text-red-400 text-lg mb-4">
              {error || `Unable to load ${isTemplate ? 'workout template' : 'workout'}`}
            </div>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format function for weekday display
  const getWeekdayName = (index) => {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index];
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-xl mx-4 flex flex-col border border-gray-700">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 relative flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <h2 className="text-2xl font-bold text-white tracking-tight truncate">{workout.name}</h2>
              <div className="flex items-center mt-1 text-sm text-white/80">
                {workout.preferred_weekday !== undefined && (
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {getWeekdayName(workout.preferred_weekday)}
                  </span>
                )}
                {workout.split_method && (
                  <span className="flex items-center ml-3">
                    <Target className="w-4 h-4 mr-1" />
                    {workout.split_method.replace(/_/g, ' ')}
                  </span>
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

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto bg-gray-900 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Workout Metadata */}
            <div className="md:col-span-1 space-y-6">
              {/* Workout Stats */}
              <div className="bg-gray-800/80 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-medium text-white mb-4">Workout Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-750 rounded-lg border border-gray-700 text-center">
                    <div className="text-sm text-gray-400">Exercises</div>
                    <div className="text-xl font-bold text-white">{workout.exercises?.length || 0}</div>
                  </div>
                  
                  <div className="p-3 bg-gray-750 rounded-lg border border-gray-700 text-center">
                    <div className="text-sm text-gray-400">Duration</div>
                    <div className="text-xl font-bold text-white">
                      {workout.estimated_duration || workout.duration || '45'} <span className="text-sm font-normal">min</span>
                    </div>
                  </div>
                </div>
                
                {/* Additional metadata */}
                <div className="mt-4 space-y-3">
                  {workout.difficulty_level && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-blue-500/10 mr-3">
                        <Award className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Difficulty</span>
                        <p className="text-white font-medium capitalize">{workout.difficulty_level}</p>
                      </div>
                    </div>
                  )}
                  
                  {workout.creator_username && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-indigo-500/10 mr-3">
                        <User className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Created by</span>
                        <p className="text-white font-medium">{workout.creator_username}</p>
                      </div>
                    </div>
                  )}
                  
                  {workout.is_template && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-purple-500/10 mr-3">
                        <Book className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Type</span>
                        <p className="text-white font-medium">Template</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Description */}
              {workout.description && (
                <div className="bg-gray-800/80 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-3">Description</h3>
                  <p className="text-gray-300 whitespace-pre-line">{workout.description}</p>
                </div>
              )}
            </div>
            
            {/* Right Column - Exercises */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-medium text-white mb-4">Exercises</h3>
              
              {workout.exercises && workout.exercises.length > 0 ? (
                <div className="space-y-4">
                  {workout.exercises.map((exercise, index) => (
                    <div 
                      key={exercise.id || index} 
                      className="bg-gray-800/80 rounded-xl overflow-hidden border border-gray-700"
                    >
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                        onClick={() => toggleExerciseExpand(exercise.id || index)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{exercise.name}</h4>
                              <div className="text-sm text-gray-400 mt-0.5">
                                {exercise.equipment && <span>{exercise.equipment}</span>}
                                {exercise.sets?.length > 0 && (
                                  <span className="ml-2">{exercise.sets.length} sets</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            {expandedExercises[exercise.id || index] ? 
                              <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            }
                          </div>
                        </div>
                      </div>
                      
                      {expandedExercises[exercise.id || index] && exercise.sets && (
                        <div className="border-t border-gray-700 p-4 bg-gray-750">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-left">
                                  <th className="px-3 py-2 text-sm font-medium text-gray-400">Set</th>
                                  <th className="px-3 py-2 text-sm font-medium text-gray-400">
                                    <div className="flex items-center">
                                      <Scale className="w-3.5 h-3.5 mr-1 text-blue-400" />
                                      Weight
                                    </div>
                                  </th>
                                  <th className="px-3 py-2 text-sm font-medium text-gray-400">
                                    <div className="flex items-center">
                                      <CircleDot className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                                      Reps
                                    </div>
                                  </th>
                                  {exercise.sets.some(s => s.rest_time) && (
                                    <th className="px-3 py-2 text-sm font-medium text-gray-400">
                                      <div className="flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1 text-purple-400" />
                                        Rest
                                      </div>
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {exercise.sets.map((set, setIdx) => (
                                  <tr key={setIdx} className="border-t border-gray-700/40">
                                    <td className="px-3 py-2 text-gray-300">{setIdx + 1}</td>
                                    <td className="px-3 py-2 text-gray-300">{set.weight || '-'} {set.weight ? 'kg' : ''}</td>
                                    <td className="px-3 py-2 text-gray-300">{set.reps || '-'}</td>
                                    {exercise.sets.some(s => s.rest_time) && (
                                      <td className="px-3 py-2 text-gray-300">{set.rest_time || '-'} {set.rest_time ? 'sec' : ''}</td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {exercise.notes && (
                            <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                              <p className="text-sm text-gray-300">
                                <span className="font-medium text-white">Notes: </span>
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
                <div className="bg-gray-800/80 rounded-xl p-8 border border-gray-700 text-center">
                  <Dumbbell className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No exercises found in this workout.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableWorkoutModal;