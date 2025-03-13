import React, { useState, useEffect } from 'react';
import { 
  Calendar, Dumbbell, Edit2, Trash2, 
  CheckCircle, MapPin, Heart, Flame, Target,
  Activity, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { useGyms } from '../hooks/useGyms';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';
import ExpandableWorkoutLogModal from './ExpandableWorkoutLogModal';
import { logService } from '../../../api/services';

const WorkoutLogCard = ({ 
  user,
  logId, 
  log: initialLog, 
  onEdit, 
  onDelete, 
  onShare, 
  onSelect,
  inFeedMode = false,
  expandable = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [log, setLog] = useState(initialLog);
  const [loading, setLoading] = useState(!initialLog);
  
  const { gyms, loading: gymsLoading } = useGyms();
  const canEdit = log.username == user;
  
  useEffect(() => {
    const fetchWorkoutLog = async () => {
      if (!logId || initialLog) return;
      
      try {
        setLoading(true);
        // Use logService instead of direct API call
        const fetchedLog = await logService.getLogById(logId);
        setLog(fetchedLog);
      } catch (err) {
        console.error('Error fetching workout log:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutLog();
  }, [logId, initialLog]);
  
  if (!log || loading) return null;
  
  const gymInfo = React.useMemo(() => {
    if (!log.gym) return { name: 'Not specified', location: '' };
    if (log.gym_name) {
      return { 
        name: log.gym_name, 
        location: log.gym_location || '' 
      };
    }
    
    const gym = gyms?.find(g => g.id === log.gym);
    return gym ? { 
      name: gym.name, 
      location: gym.location || '' 
    } : { name: 'Loading...', location: '' };
  }, [log.gym, log.gym_name, log.gym_location, gyms]);
  
  // Format date for better display
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
  
  const formattedDate = formatDate(log.date);
  
  const getMoodEmoji = (rating) => {
    if (!rating) return null;
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };

  const getDifficultyEffect = (rating) => {
    if (!rating) return { label: '🔥', color: 'text-gray-400 bg-gray-800/50' };
    if (rating >= 8) return { label: '🔥🔥🔥', color: 'text-red-400 bg-red-900/30' };
    if (rating >= 6) return { label: '🔥🔥', color: 'text-orange-400 bg-orange-900/30' };
    if (rating >= 4) return { label: '🔥', color: 'text-yellow-400 bg-yellow-900/30' };
    return { label: '✓', color: 'text-green-400 bg-green-900/30' };
  };

  // Get colors from postTypeUtils
  const colors = getPostTypeDetails('workout_log').colors;

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(log);
    } else {
      setShowDetailModal(true);
    }
  };

  // Determine if key stats should be shown based on their existence
  const showMood = !!log.mood_rating;
  const exerciseCount = log.exercise_count || log.exercises?.length || 0;

  return (
    <>
      <div 
        className={`w-full bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border border-gray-700/50 rounded-xl overflow-hidden shadow-sm transition-all duration-300 cursor-pointer transform ${isHovered ? 'shadow-md scale-[1.01]' : ''}`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Status Indicator Line - Green gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-green-400 to-emerald-500" />
        
        <div className="p-4">
          {/* Card Header with Basic Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              {/* Workout Icon */}
              <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              
              {/* Workout Title and Completion Status - with proper overflow handling */}
              <div className="min-w-0 overflow-hidden">
                <div className="flex items-center">
                  <h4 className={`text-lg font-medium text-white group-hover:text-green-400 transition-colors ${isHovered ? 'text-green-300' : ''} truncate`}>
                    {log.name || log.workout_name || "Workout"}
                  </h4>
                  {log.completed && (
                    <span className="ml-2 flex items-center text-xs text-green-400 flex-shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Completed</span>
                    </span>
                  )}
                </div>
                
                {/* Essential Metadata - Date and Location */}
                <div className="flex items-center flex-wrap mt-1 text-sm text-gray-400">
                  <span className="flex items-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    {formattedDate}
                  </span>
                  
                  {log.gym && (
                    <span className="flex items-center ml-3 flex-shrink-0 max-w-[150px] md:max-w-full truncate">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{gymInfo.name} {gymInfo.location && `• ${gymInfo.location}`}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center flex-shrink-0 ml-2">
              {!inFeedMode && canEdit && (
                <div className={`flex items-center space-x-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(log);
                    }}
                    className="p-1.5 text-gray-400 hover:text-white bg-transparent hover:bg-gray-700/50 rounded-md transition-colors"
                    aria-label="Edit workout"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(log);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-400 bg-transparent hover:bg-red-900/20 rounded-md transition-colors"
                    aria-label="Delete workout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {expandable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className="p-1.5 text-gray-400 hover:text-white bg-transparent hover:bg-gray-700/50 rounded-md transition-colors"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid - With gradient backgrounds */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 hover:from-blue-900/30 hover:to-blue-800/30 p-3 rounded-lg border border-blue-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Dumbbell className="w-3.5 h-3.5 mr-1 text-blue-400" />
                <span>Exercises</span>
              </div>
              <p className="font-semibold text-white">
                {exerciseCount}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 hover:from-red-900/30 hover:to-red-800/30 p-3 rounded-lg border border-red-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <Flame className="w-3.5 h-3.5 mr-1 text-red-400" />
                <span>Difficulty</span>
              </div>
              <p className="font-semibold text-white flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyEffect(log.perceived_difficulty).color}`}>
                  {getDifficultyEffect(log.perceived_difficulty).label}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-red-900/40 rounded-full">{log.perceived_difficulty || '—'}/10</span>
              </p>
            </div>
            
            {showMood ? (
              <div className="bg-gradient-to-br from-pink-900/20 to-pink-800/20 hover:from-pink-900/30 hover:to-pink-800/30 p-3 rounded-lg border border-pink-700/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center text-xs text-gray-400 mb-1">
                  <Heart className="w-3.5 h-3.5 mr-1 text-pink-400" />
                  <span>Mood</span>
                </div>
                <p className="font-semibold text-white flex items-center justify-between">
                  <span className="text-xl">{getMoodEmoji(log.mood_rating)}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-pink-900/40 rounded-full">{log.mood_rating}/10</span>
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-teal-900/20 to-teal-800/20 hover:from-teal-900/30 hover:to-teal-800/30 p-3 rounded-lg border border-teal-700/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center text-xs text-gray-400 mb-1">
                  <Target className="w-3.5 h-3.5 mr-1 text-teal-400" />
                  <span className="truncate">{log.program_name ? 'Program' : 'Gym'}</span>
                </div>
                <p className="font-semibold text-white text-sm truncate">
                  {log.program_name || gymInfo.name}
                </p>
              </div>
            )}
          </div>

          {/* Expandable Exercise List - Only show if expanded and has exercises */}
          {expanded && (
            <div className="mt-5 space-y-3 border-t border-gray-700/50 pt-4 animate-fadeIn">
              {log.exercises?.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-white text-sm flex items-center">
                      <Dumbbell className="w-4 h-4 mr-2 text-green-400" />
                      Exercises
                    </h5>
                    <span className="px-1.5 py-0.5 bg-gray-800/80 text-gray-400 rounded text-xs">
                      {log.exercises.length} total
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {log.exercises.slice(0, 4).map((exercise, index) => (
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
                    
                    {log.exercises.length > 4 && (
                      <div className="text-center py-1 text-sm text-green-400">
                        +{log.exercises.length - 4} more exercises
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* View Details Button - Only show when expanded */}
              <button 
                onClick={handleCardClick}
                className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-300 text-sm font-medium border border-green-500/30"
              >
                <Eye className="w-4 h-4" />
                View Full Workout Log
              </button>
            </div>
          )}
          
          {/* Bottom highlight line - animated on hover */}
          <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 w-0 ${isHovered ? 'w-full' : ''} transition-all duration-700`}></div>
        </div>
      </div>

      {/* Modal for viewing details */}
      {showDetailModal && (
        <ExpandableWorkoutLogModal
          logId={logId || log.id}
          initialLogData={log}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
};

export default WorkoutLogCard;