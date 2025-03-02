import React, { useState } from 'react';
import { 
  Calendar, Clock, Dumbbell, Edit2, Trash2, 
  ChevronDown, ChevronUp, Book, 
  MapPin, Activity, Heart, Flame, CheckCircle,
  Share2, MessageCircle, ThumbsUp
} from 'lucide-react';
import { useGyms } from '../hooks/useGyms';
import { POST_TYPE_COLORS } from '../../../utils/postTypeUtils';
import ExpandableWorkoutLogModal from './../../MainFeed/components/ExpandableWorkoutLogModal';

const WorkoutLogCard = ({ log, onEdit, onDelete, onShare, inFeedMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { gyms, loading: gymsLoading } = useGyms();
  
  const gymName = React.useMemo(() => {
    if (!log.gym) return 'Not specified';
    const gym = gyms.find(g => g.id === log.gym);
    return gym ? `${gym.name}` : 'Loading...';
  }, [log.gym, gyms]);
  
  // Format date for better display
  const formattedDate = log.date || 'No date';
  
  const getMoodEmoji = (rating) => {
    if (!rating) return '😐';
    if (rating >= 8) return '😀';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '☹️';
    return '😫';
  };

  // Social stats - would be real data in a full implementation
  const likes = log.likes || Math.floor(Math.random() * 15);
  const comments = log.comments?.length || Math.floor(Math.random() * 5);

  // Get colors from postTypeUtils
  const colors = POST_TYPE_COLORS.workout_log;

  const handleCardClick = () => {
    setShowDetailModal(true);
  };

  return (
    <>
      <div 
        className={`w-full bg-gray-800/50 border ${colors.border} rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer`}
        onClick={handleCardClick}
      >
        {/* Status Indicator Line */}
        <div className={`h-1 w-full bg-gradient-to-r ${colors.gradient}`} />
        
        <div className="p-4">
          {/* Header with basic info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className={`${colors.bg} p-2 rounded-lg`}>
                  <Activity className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <h4 className="text-lg font-semibold text-white">
                  {log.name || log.workout_name}
                </h4>
                {log.completed && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </span>
                )}
              </div>
              <div className="flex items-center mt-1 text-sm text-gray-400 space-x-3">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{formattedDate}</span>
                </div>
                {log.program && (
                  <div className="flex items-center">
                    <Book className="w-4 h-4 mr-1" />
                    <span>{log.program_name}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {!inFeedMode && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(log);
                    }}
                    className="p-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all"
                    aria-label="Edit workout"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(log);
                    }}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all"
                    aria-label="Delete workout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Dumbbell className="w-4 h-4 mr-1 text-blue-400" />
                <span>Exercises</span>
              </div>
              <p className="text-white font-bold text-lg">
                {log.exercise_count || log.exercises?.length || 0}
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Clock className="w-4 h-4 mr-1 text-purple-400" />
                <span>Duration</span>
              </div>
              <p className="text-white font-bold text-lg">
                {log.duration} <span className="text-sm font-normal">min</span>
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Heart className="w-4 h-4 mr-1 text-pink-400" />
                <span>Mood</span>
              </div>
              <p className="text-white font-bold text-lg flex items-center">
                {log.mood_rating ? (
                  <>
                    <span className="mr-1">{log.mood_rating}/10</span>
                    <span className="text-xl">{getMoodEmoji(log.mood_rating)}</span>
                  </>
                ) : '-'}
              </p>
            </div>
            
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex items-center text-gray-400 mb-1 text-sm">
                <Flame className="w-4 h-4 mr-1 text-red-400" />
                <span>Difficulty</span>
              </div>
              <p className="text-white font-bold text-lg">
                {log.perceived_difficulty ? `${log.perceived_difficulty}/10` : '-'}
              </p>
            </div>
          </div>

          {/* Social interaction section for feed mode */}
          {inFeedMode && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button className="flex items-center text-gray-400 hover:text-blue-400 transition-colors">
                    <ThumbsUp className="w-5 h-5 mr-1.5" />
                    <span>{likes}</span>
                  </button>
                  <button className="flex items-center text-gray-400 hover:text-purple-400 transition-colors">
                    <MessageCircle className="w-5 h-5 mr-1.5" />
                    <span>{comments}</span>
                  </button>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.(log);
                  }}
                  className="flex items-center text-gray-400 hover:text-green-400 transition-colors"
                >
                  <Share2 className="w-5 h-5 mr-1.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Workout Log Modal */}
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