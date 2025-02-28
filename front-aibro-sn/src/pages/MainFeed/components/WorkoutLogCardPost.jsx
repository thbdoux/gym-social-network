import React, { useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronUp, Calendar, Target, Clock, MapPin, User, ClipboardList } from 'lucide-react';
import api from '../../../api';

const WorkoutLogCardPost = ({ workoutLogId, initialWorkoutLogData, onClick }) => {
  const [workoutLog, setWorkoutLog] = useState(initialWorkoutLogData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(!initialWorkoutLogData);
  const [error, setError] = useState(null);

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

    fetchWorkoutLogDetails();
  }, [workoutLogId, workoutLog]);

  if (loading) {
    return (
      <div className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
      </div>
    );
  }

  if (error || !workoutLog) {
    return (
      <div className="mt-4 bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl">
        {error || "Unable to load workout log"}
      </div>
    );
  }

  const handleCardClick = (e) => {
    // Prevent propagation of the event to parent elements
    e.stopPropagation();
    // Call the onClick handler if provided
    {console.log("LOG : ", workoutLog)}
    if (onClick) onClick(workoutLog);
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Status Indicator Line */}
      <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-500" />
      
      <div className="p-4">
        {/* Header with basic info */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              <h4 className="text-lg font-semibold text-white">
                {workoutLog.name || "Workout"}
              </h4>
            </div>
            {workoutLog.user_username && (
              <div className="flex items-center mt-1 text-sm text-gray-400">
                <User className="w-4 h-4 mr-1" />
                <span>by {workoutLog.user_username}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(workoutLog.date).toLocaleDateString()}</span>
              </div>
              {workoutLog.gym && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{workoutLog.gym.name}</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleExpandClick}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            {isExpanded ? 
              <ChevronUp className="w-5 h-5 text-gray-400" /> : 
              <ChevronDown className="w-5 h-5 text-gray-400" />
            }
          </button>
        </div>

        {/* Stats Grid - Always visible */}
        <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-gray-800/30 rounded-lg">
          <div className="text-sm">
            <div className="flex items-center text-gray-400 mb-1">
              <ClipboardList className="w-4 h-4 mr-1" />
              <span>Exercises</span>
            </div>
            <p className="text-white font-medium">
              {workoutLog.exercises?.length || 0}
            </p>
          </div>
          
          <div className="text-sm">
            <div className="flex items-center text-gray-400 mb-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>Duration</span>
            </div>
            <p className="text-white font-medium">
              {workoutLog.duration || '-'} min
            </p>
          </div>
          
          <div className="text-sm">
            <div className="flex items-center text-gray-400 mb-1">
              <Target className="w-4 h-4 mr-1" />
              <span>Performance</span>
            </div>
            <p className="text-white font-medium">
              {workoutLog.mood_rating ? `${workoutLog.mood_rating}/10` : '-'}
            </p>
          </div>
        </div>

        {/* Expanded Content - Only visible when expanded */}
        {isExpanded && workoutLog.exercises?.length > 0 && (
          <div className="mt-4 space-y-3">
            <h5 className="font-medium text-white mb-2">Exercises</h5>
            {workoutLog.exercises.map((exercise, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400" />
                  <h5 className="font-medium text-white">{exercise.name}</h5>
                </div>
                {exercise.sets?.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                    {exercise.sets.map((set, setIdx) => (
                      <div 
                        key={setIdx}
                        className="bg-gray-800/50 rounded p-2 text-center"
                      >
                        <div className="text-gray-400">Set {setIdx + 1}</div>
                        <div className="text-white font-medium">
                          {set.reps} × {set.weight}kg
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <div className="text-center mt-4">
              <button 
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm font-medium"
                onClick={handleCardClick}
              >
                View Full Workout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutLogCardPost;