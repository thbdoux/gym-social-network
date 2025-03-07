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

const WorkoutLogPreview = ({ workoutLogId, workoutLog: initialWorkoutLog, canEdit, onWorkoutLogSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const [workoutLog, setWorkoutLog] = useState(initialWorkoutLog);
  const [loading, setLoading] = useState(!initialWorkoutLog);
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    // If onWorkoutLogSelect is provided, use it instead of showing the modal directly
    if (onWorkoutLogSelect) {
      onWorkoutLogSelect(workoutLog);
    } else {
      setShowModal(true);
    }
  };

  const getMoodEmoji = (rating) => {
    if (!rating) return null;
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'No date';
      // Check if date is in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString();
      }
      // Otherwise try standard parsing
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString; // If parsing fails, return the original string
    }
  };

  return (
    <>
      <div 
        className={`mt-4 bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer transform ${isHovered ? 'shadow-md scale-[1.01]' : ''}`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Status Indicator Line - Green gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-green-400 to-emerald-500" />
        
        <div className="p-4">
          {/* Card Header with Basic Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Workout Icon */}
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              
              {/* Workout Title and Completion Status */}
              <div>
                <div className="flex items-center">
                  <h4 className={`text-lg font-medium text-white transition-colors ${isHovered ? 'text-green-300' : ''}`}>
                    {workoutLog.name || "Workout"}
                  </h4>
                  {workoutLog.completed && (
                    <span className="ml-2 flex items-center text-xs text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Completed</span>
                    </span>
                  )}
                </div>
                
                {/* Essential Metadata - Date and Location */}
                <div className="flex items-center flex-wrap mt-1 text-sm text-gray-400">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    {formatDate(workoutLog.date)}
                  </span>
                  
                  {workoutLog.gym && (
                    <span className="flex items-center ml-3">
                      <MapPin className="w-3.5 h-3.5 mr-1.5" />
                      <span className="truncate max-w-[120px]">{workoutLog.gym_name || workoutLog.gym.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Stats Grid - With gradient backgrounds */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 hover:from-blue-900/30 hover:to-blue-800/30 p-3 rounded-lg border border-blue-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-sm text-gray-400 mb-1">
                <Dumbbell className="w-3.5 h-3.5 mr-1 text-blue-400" />
                <span>Exercises</span>
              </div>
              <p className="font-semibold text-white">
                {workoutLog.exercises?.length || 0}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 hover:from-purple-900/30 hover:to-purple-800/30 p-3 rounded-lg border border-purple-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-sm text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5 mr-1 text-purple-400" />
                <span>Duration</span>
              </div>
              <p className="font-semibold text-white">
                {workoutLog.duration || '—'} <span className="text-xs font-normal">min</span>
              </p>
            </div>
            
            {workoutLog.mood_rating ? (
              <div className="bg-gradient-to-br from-pink-900/20 to-pink-800/20 hover:from-pink-900/30 hover:to-pink-800/30 p-3 rounded-lg border border-pink-700/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center text-sm text-gray-400 mb-1">
                  <Heart className="w-3.5 h-3.5 mr-1 text-pink-400" />
                  <span>Mood</span>
                </div>
                <p className="font-semibold text-white flex items-center">
                  <span className="mr-2">{workoutLog.mood_rating}/10</span>
                  <span className="text-xl">{getMoodEmoji(workoutLog.mood_rating)}</span>
                </p>
              </div>
            ) : workoutLog.perceived_difficulty ? (
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 hover:from-red-900/30 hover:to-red-800/30 p-3 rounded-lg border border-red-700/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center text-sm text-gray-400 mb-1">
                  <Flame className="w-3.5 h-3.5 mr-1 text-red-400" />
                  <span>Difficulty</span>
                </div>
                <p className="font-semibold text-white">
                  {workoutLog.perceived_difficulty}/10
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-teal-900/20 to-teal-800/20 hover:from-teal-900/30 hover:to-teal-800/30 p-3 rounded-lg border border-teal-700/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center text-sm text-gray-400 mb-1">
                  <Target className="w-3.5 h-3.5 mr-1 text-teal-400" />
                  <span>Program</span>
                </div>
                <p className="font-semibold text-white truncate">
                  {workoutLog.program_name || "—"}
                </p>
              </div>
            )}
          </div>

          {/* Expandable Exercise List - Only show if expanded */}
          {expanded && workoutLog.exercises?.length > 0 && (
            <div className="mt-5 space-y-3 border-t border-gray-700/50 pt-4 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-white text-sm flex items-center">
                  <Dumbbell className="w-4 h-4 mr-2 text-green-400" />
                  Exercises
                </h5>
                <span className="px-1.5 py-0.5 bg-gray-800/80 text-gray-400 rounded text-xs">
                  {workoutLog.exercises.length} total
                </span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {workoutLog.exercises.slice(0, 4).map((exercise, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-800/70 rounded-lg p-2.5 border border-gray-700/50 hover:border-green-700/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-900/30 text-green-400 text-xs mr-2">
                          {index + 1}
                        </div>
                        <div>
                          <h6 className="font-medium text-white text-sm">{exercise.name}</h6>
                          {exercise.equipment && (
                            <span className="text-xs text-gray-400">{exercise.equipment}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center">
                        <span className="bg-gray-700/50 px-1.5 py-0.5 rounded">
                          {exercise.sets?.length || 0} sets
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {workoutLog.exercises.length > 4 && (
                  <div className="text-center py-1 text-sm text-green-400">
                    +{workoutLog.exercises.length - 4} more exercises
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* View Details Button */}
          <button 
            onClick={handleCardClick}
            className="w-full flex items-center justify-center gap-2 py-2 mt-4 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-300 text-sm font-medium border border-green-500/30"
          >
            <Eye className="w-4 h-4" />
            View Full Workout Log
          </button>
          
          {/* Animated highlight line on hover */}
          <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 w-0 ${isHovered ? 'w-full' : ''} transition-all duration-700`}></div>
        </div>
      </div>

      {/* Workout Log Modal - Only show if onWorkoutLogSelect is not provided */}
      {!onWorkoutLogSelect && (
        <ExpandableWorkoutLogModal
          logId={workoutLogId}
          initialLogData={workoutLog}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default WorkoutLogPreview;