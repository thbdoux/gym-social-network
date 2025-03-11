import React, { useState } from 'react';
import { 
  Activity, Dumbbell, Bookmark, Heart, 
  MessageCircle, ChevronUp, ChevronDown, 
  Edit, Trash2, Calendar
} from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';

const ActivityTimeline = ({ 
  posts, 
  user, 
  onEditPost, 
  onDeletePost, 
  onWorkoutSelect, 
  onProgramSelect 
}) => {
  const [expandedPost, setExpandedPost] = useState(null);

  // Format text utilities
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Group posts by month for timeline view
  const groupPostsByMonth = () => {
    const grouped = {};
    
    posts.forEach(post => {
      const date = new Date(post.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(post);
    });
    
    return grouped;
  };

  const postsByMonth = groupPostsByMonth();

  // Format date in a clean way
  const formatPostDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl overflow-hidden shadow-lg">
      <div className="p-5">
        <h2 className="text-xl font-bold flex items-center gap-2 group">
          <Activity className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:rotate-12" />
          <span className="group-hover:text-purple-300 transition-colors duration-300">Activity Timeline</span>
        </h2>
        
        <div className="mt-6">
          {posts.length > 0 ? (
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute top-0 bottom-0 left-16 w-0.5 bg-gray-700"></div>
              
              {/* Timeline Items */}
              <div className="space-y-8">
                {Object.entries(postsByMonth).map(([month, monthPosts], monthIndex) => (
                  <div key={month} className="relative">
                    {/* Month Label */}
                    <div className="flex items-center mb-4">
                      <div className="w-16 flex justify-center">
                        <div className="w-4 h-4 bg-purple-600 rounded-full z-10"></div>
                      </div>
                      <h3 className="text-lg font-medium text-purple-300 ml-4">{month}</h3>
                    </div>
                    
                    {/* Month's Posts */}
                    <div className="space-y-6 pl-20">
                      {monthPosts.map((post) => (
                        <div 
                          key={post.id} 
                          className={`bg-gray-800/40 rounded-lg p-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:bg-gray-800/60 ${expandedPost === post.id ? 'bg-gray-800/70' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-400">
                                {formatPostDate(post.created_at)}
                              </span>
                              {post.post_type !== 'regular' && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-400">
                                  {post.post_type === 'workout_log' ? 'Workout' : 
                                   post.post_type === 'program_share' ? 'Program' : 
                                   post.post_type}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditPost(post);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 rounded transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to delete this post?')) {
                                    onDeletePost(post.id);
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="mt-2 text-gray-200">{post.content}</p>
                          
                          {/* Post Image */}
                          {post.image && (
                            <div className="mt-3 overflow-hidden rounded-lg">
                              <img
                                src={getAvatarUrl(post.image)}
                                alt=""
                                className="w-full object-cover max-h-60 transform transition-all duration-500 hover:scale-[1.03]"
                              />
                            </div>
                          )}
                          
                          {/* Workout Log Reference */}
                          {post.post_type === 'workout_log' && post.workout_log && (
                            <div 
                              className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg transition-all duration-300 hover:bg-blue-900/30 hover:border-blue-700/50 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onWorkoutSelect(post.workout_log_details);
                              }}
                            >
                              <div className="flex items-center">
                                <Dumbbell className="w-4 h-4 text-blue-400 mr-2" />
                                <div>
                                  <div className="font-medium text-white">
                                    {post.workout_log_details.workout_name || "Workout"}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {post.workout_log_details.exercises?.length || 0} exercises • {
                                      new Date(post.workout_log_details.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Program Share Reference */}
                          {post.post_type === 'program' && post.program && (
                            <div 
                              className="mt-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg transition-all duration-300 hover:bg-purple-900/30 hover:border-purple-700/50 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onProgramSelect(post.program_details);
                              }}
                            >
                              <div className="flex items-center">
                                <Bookmark className="w-4 h-4 text-purple-400 mr-2" />
                                <div>
                                  <div className="font-medium text-white">{post.program_details.name}</div>
                                  <div className="text-xs text-gray-400">
                                    {post.program_details.sessions_per_week} workouts/week • {formatText(post.program_details.difficulty_level)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Post Stats - Likes & Comments */}
                          <div className="flex items-center gap-4 mt-3 text-gray-400">
                            <div className="flex items-center gap-1 text-sm">
                              <Heart className="w-4 h-4" />
                              <span>{post.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments?.length || 0}</span>
                            </div>
                            
                            {/* Expand/Collapse Comments Button */}
                            {post.comments?.length > 0 && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedPost(expandedPost === post.id ? null : post.id);
                                }}
                                className="text-sm text-blue-400 hover:text-blue-300 ml-auto flex items-center gap-1"
                              >
                                {expandedPost === post.id ? 'Hide' : 'Show'} comments
                                {expandedPost === post.id ? 
                                  <ChevronUp className="w-3 h-3" /> : 
                                  <ChevronDown className="w-3 h-3" />
                                }
                              </button>
                            )}
                          </div>
                          
                          {/* Expanded Comments */}
                          {expandedPost === post.id && post.comments && (
                            <div className="mt-4 pt-3 border-t border-gray-700/30 space-y-3 animate-fadeIn">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="flex items-start gap-2">
                                  <img
                                    src={getAvatarUrl(comment.user_avatar)}
                                    alt={comment.user_username}
                                    className="w-7 h-7 rounded-full object-cover"
                                  />
                                  <div className="flex-1 bg-gray-800/50 p-2 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-1">{comment.user_username}</div>
                                    <p className="text-sm">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800/30 rounded-xl">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-600 opacity-70" />
              <p className="text-gray-400">No posts yet</p>
              <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-all duration-300 hover:scale-105">
                Create Your First Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityTimeline;