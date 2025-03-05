import React, { useState } from 'react';
import { 
  Calendar, Clock, Dumbbell, Edit2, Trash2, 
  CheckCircle, MapPin, Heart, Flame,
  Share2, MessageCircle, ThumbsUp
} from 'lucide-react';
import { useGyms } from '../hooks/useGyms';
import { POST_TYPE_COLORS } from '../../../utils/postTypeUtils';
import ExpandableWorkoutLogModal from './../../MainFeed/components/ExpandableWorkoutLogModal';

const WorkoutLogCard = ({ log, onEdit, onDelete, onShare, inFeedMode = false }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { gyms, loading: gymsLoading } = useGyms();
  
  const gymName = React.useMemo(() => {
    if (!log.gym) return 'Not specified';
    const gym = gyms.find(g => g.id === log.gym);
    return gym ? `${gym.name}` : 'Loading...';
  }, [log.gym, gyms]);
  
  // Format date for better display
  const formattedDate = log.date || 'No date';
  
  const getMoodEmoji = (rating) => {
    if (!rating) return null;
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };

  // Social stats
  const likes = log.likes || Math.floor(Math.random() * 15);
  const comments = log.comments?.length || Math.floor(Math.random() * 5);

  // Get colors from postTypeUtils
  const colors = POST_TYPE_COLORS.workout_log;

  const handleCardClick = () => {
    setShowDetailModal(true);
  };

  // Determine if key stats should be shown based on their existence
  const showMood = !!log.mood_rating;
  const showDifficulty = !!log.perceived_difficulty;
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
            <div className="flex items-center gap-2">
              {/* Workout Icon */}
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Dumbbell className="w-5 h-5 text-green-400" />
              </div>
              
              {/* Workout Title and Completion Status */}
              <div>
                <div className="flex items-center">
                  <h4 className={`text-lg font-medium text-white group-hover:text-green-400 transition-colors ${isHovered ? 'text-green-300' : ''}`}>
                    {log.name || log.workout_name}
                  </h4>
                  {log.completed && (
                    <span className="ml-2 flex items-center text-xs text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Completed</span>
                    </span>
                  )}
                </div>
                
                {/* Essential Metadata - Date */}
                <div className="flex items-center mt-1 text-sm text-gray-400">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons - Only show on hover for cleaner look */}
            {!inFeedMode && (
              <div className={`flex items-center space-x-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(log);
                  }}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
                  aria-label="Edit workout"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(log);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                  aria-label="Delete workout"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Stats Grid - With gradient backgrounds */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 hover:from-blue-900/30 hover:to-blue-800/30 p-3 rounded-lg border border-blue-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-sm text-gray-400 mb-1">
                <Dumbbell className="w-3.5 h-3.5 mr-1 text-blue-400" />
                <span>Exercises</span>
              </div>
              <p className="font-semibold text-white">
                {exerciseCount}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 hover:from-purple-900/30 hover:to-purple-800/30 p-3 rounded-lg border border-purple-700/30 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center text-sm text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5 mr-1 text-purple-400" />
                <span>Duration</span>
              </div>
              <p className="font-semibold text-white">
                {log.duration} <span className="text-xs font-normal">min</span>
              </p>
            </div>
            
            {showMood ? (
              <div className="bg-gradient-to-br from-pink-900/20 to-pink-800/20 hover:from-pink-900/30 hover:to-pink-800/30 p-3 rounded-lg border border-pink-700/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center text-sm text-gray-400 mb-1">
                  <Heart className="w-3.5 h-3.5 mr-1 text-pink-400" />
                  <span>Mood</span>
                </div>
                <p className="font-semibold text-white flex items-center">
                  {getMoodEmoji(log.mood_rating)}
                </p>
              </div>
            ) : showDifficulty ? (
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 hover:from-red-900/30 hover:to-red-800/30 p-3 rounded-lg border border-red-700/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center text-sm text-gray-400 mb-1">
                  <Flame className="w-3.5 h-3.5 mr-1 text-red-400" />
                  <span>Difficulty</span>
                </div>
                <p className="font-semibold text-white">
                  {log.perceived_difficulty}/10
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-teal-900/20 to-teal-800/20 hover:from-teal-900/30 hover:to-teal-800/30 p-3 rounded-lg border border-teal-700/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center text-sm text-gray-400 mb-1">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-teal-400" />
                  <span>Gym</span>
                </div>
                <p className="font-semibold text-white truncate">
                  {gymName}
                </p>
              </div>
            )}
          </div>

          {/* Social interaction section - Only for feed mode, with subtle glow on hover */}
          {inFeedMode && (
            <div className="mt-4 pt-3 border-t border-gray-700/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button className="flex items-center text-gray-400 hover:text-green-400 transition-colors">
                    <ThumbsUp className="w-4 h-4 mr-1.5" />
                    <span>{likes}</span>
                  </button>
                  <button className="flex items-center text-gray-400 hover:text-green-400 transition-colors">
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    <span>{comments}</span>
                  </button>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.(log);
                  }}
                  className="text-gray-400 hover:text-green-400 transition-colors group"
                >
                  <Share2 className="w-4 h-4 mr-1 inline-block group-hover:rotate-12 transition-transform duration-300" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Bottom highlight line - animated on hover */}
          <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 w-0 ${isHovered ? 'w-full' : ''} transition-all duration-700`}></div>
        </div>
      </div>

      {/* Modal remains the same */}
      {showDetailModal && (
        <ExpandableWorkoutLogModal
          workoutLogId={log.id}
          initialWorkoutLogData={log}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
};

export default WorkoutLogCard;