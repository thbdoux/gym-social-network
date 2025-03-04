import React, { useState, useEffect } from 'react';
import { 
  ChevronDown,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Dumbbell,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Send,
  Sparkles,
  ThumbsUp
} from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import api from '../../../api';
import ProgramCardPost from '../../MainFeed/components/ProgramCardPost';
import WorkoutLogPreview from '../../MainFeed/components/WorkoutLogPreview';

const RecentPosts = ({ 
  posts, 
  username, 
  onViewAll, 
  onProgramSelect, 
  onWorkoutLogSelect 
}) => {
  const [userData, setUserData] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const [hoveredPost, setHoveredPost] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [commentText, setCommentText] = useState('');
  const [hoveredButton, setHoveredButton] = useState(null);
  
  const userPosts = Array.isArray(posts) 
    ? posts.filter(post => post.user_username === username)
    : [];
    
  // Display only first 3 posts, or up to 13 if expanded
  const displayPosts = expandedView 
    ? userPosts.slice(0, 13) 
    : userPosts.slice(0, 3);

  // Updated handlers to pass data up to parent
  const handleProgramSelect = (program) => {
    if (onProgramSelect) {
      onProgramSelect(program);
    }
  };
  
  const handleWorkoutLogSelect = (workoutLog) => {
    if (onWorkoutLogSelect) {
      onWorkoutLogSelect(workoutLog);
    }
  };

  // Handle liking a post
  const handleLikePost = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/users/me/`);
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (username) {
      fetchUserData();
    }
  }, [username]);

  // Format the timestamp to a more readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today, show time
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      // Longer than a week
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  // Function to toggle post expansion
  const togglePostExpansion = (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
    }
  };
  
  // Function to toggle post menu
  const toggleMenu = (postId, e) => {
    e.stopPropagation();
    if (menuOpen === postId) {
      setMenuOpen(null);
    } else {
      setMenuOpen(postId);
    }
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpen(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:from-gray-800/60 hover:to-gray-900/80 transform hover:scale-[1.005]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 group">
          <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
          <span className="group-hover:text-amber-300 transition-colors duration-300">Recent Posts</span>
        </h2>
      </div>
      
      {userPosts.length > 0 ? (
        <div className="space-y-4">
          {displayPosts.map((post) => (
            <div 
              key={post.id} 
              className={`bg-gray-900/50 rounded-lg p-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                hoveredPost === post.id ? 'bg-gray-900/70 shadow-md scale-[1.01]' : ''
              }`}
              onMouseEnter={() => setHoveredPost(post.id)}
              onMouseLeave={() => setHoveredPost(null)}
            >
              <div className="flex items-start gap-3">
                <img
                  src={getAvatarUrl(userData?.avatar, 40)}
                  alt={`${post.user_username}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-800 transition-all duration-300 hover:scale-110 hover:border-blue-600/40"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-medium">{post.user_username}</span>
                      <div className="flex items-center text-sm text-gray-400 group">
                        <Clock className="w-3 h-3 mr-1 group-hover:text-blue-400 transition-colors duration-300" />
                        <span className="group-hover:text-gray-300 transition-colors duration-300">{formatTimestamp(post.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {post.post_type !== 'regular' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full transition-all duration-300 hover:scale-105 ${
                          post.post_type === 'workout_log' 
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                            : post.post_type === 'program_share' 
                              ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}>
                          {post.post_type === 'workout_log' ? 'Workout' : 
                          post.post_type === 'program_share' ? 'Program' : 
                          post.post_type}
                        </span>
                      )}
                      
                      <div className="relative">
                        <button 
                          onClick={(e) => toggleMenu(post.id, e)} 
                          className="p-1 hover:bg-gray-800 rounded-full transition-all duration-300"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                        
                        {menuOpen === post.id && (
                          <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-xl py-1 w-36 z-10 animate-fadeIn">
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-700 transition-all duration-200 group">
                              <Edit2 className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform duration-200" />
                              <span className="group-hover:translate-x-1 transition-transform duration-200">Edit Post</span>
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-700 transition-all duration-200 group">
                              <Trash2 className="w-4 h-4 text-red-400 group-hover:rotate-12 transition-transform duration-200" />
                              <span className="group-hover:translate-x-1 transition-transform duration-200">Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Post Content */}
                  <div className="mt-3">
                    <p className="text-gray-200 transition-all duration-300 hover:text-white">{post.content}</p>
                  </div>
                  
                  {/* Post Image */}
                  {post.image && (
                    <div className="mt-3 overflow-hidden rounded-lg">
                      <img
                        src={getAvatarUrl(post.image)}
                        alt=""
                        className="w-full object-cover max-h-96 transform transition-all duration-500 hover:scale-[1.03] rounded-lg hover:shadow-lg"
                      />
                    </div>
                  )}
                  
                  {/* Workout Log Card - Clickable */}
                  {post.post_type === 'workout_log' && post.workout_log && (
                    <div className="mt-3 relative">
                      <div
                        onClick={() => handleWorkoutLogSelect(post.workout_log_details)}
                        className="cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md"
                      >
                        <WorkoutLogPreview
                          workoutLogId={post.workout_log_details.id}
                          workoutLog={post.workout_log_details}
                          onWorkoutLogSelect={handleWorkoutLogSelect}
                        />
                        {/* Overlay to catch all clicks */}
                        <div className="absolute inset-0 bg-transparent"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Program Share Card */}
                  {post.post_type === 'program' && post.program && (
                    <div className="mt-3 relative">
                      <div 
                        onClick={() => handleProgramSelect(post.program_details)}
                        className="cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md"
                      >
                        <ProgramCardPost 
                          programId={post.program_details.id} 
                          initialProgramData={post.program_details}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent double firing
                            handleProgramSelect(post.program_details);
                          }}
                        />
                        {/* Overlay to catch all clicks */}
                        <div className="absolute inset-0 bg-transparent"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Post Actions */}
                  <div className="flex items-center gap-4 mt-4 text-gray-400">
                    <button 
                      className={`flex items-center gap-1 text-sm transition-all duration-300 group ${
                        likedPosts[post.id] ? 'text-red-400' : 'hover:text-red-400'
                      }`}
                      onClick={() => handleLikePost(post.id)}
                      onMouseEnter={() => setHoveredButton(`like-${post.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <Heart 
                        className={`w-4 h-4 transition-all duration-300 ${
                          likedPosts[post.id] 
                            ? 'fill-red-400 scale-110' 
                            : 'group-hover:scale-110 group-hover:fill-red-400/20'
                        } ${hoveredButton === `like-${post.id}` ? 'animate-pulse' : ''}`} 
                      />
                      <span className="group-hover:font-medium">{(post.likes_count || 0) + (likedPosts[post.id] ? 1 : 0)}</span>
                    </button>
                    
                    <button 
                      className="flex items-center gap-1 hover:text-blue-400 text-sm transition-all duration-300 group"
                      onClick={() => togglePostExpansion(post.id)}
                      onMouseEnter={() => setHoveredButton(`comment-${post.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <MessageCircle 
                        className={`w-4 h-4 transition-transform duration-200 ${hoveredButton === `comment-${post.id}` ? 'rotate-12 scale-110' : 'group-hover:scale-110'}`} 
                      />
                      <span className="group-hover:font-medium">{post.comments?.length || 0}</span>
                    </button>
                    
                    <button 
                      className="flex items-center gap-1 hover:text-green-400 text-sm transition-all duration-300 group"
                      onMouseEnter={() => setHoveredButton(`share-${post.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <Share2 
                        className={`w-4 h-4 transition-all duration-200 ${hoveredButton === `share-${post.id}` ? 'rotate-12 scale-110' : 'group-hover:scale-110'}`} 
                      />
                      <span className="group-hover:font-medium">Share</span>
                    </button>
                  </div>
                  
                  {/* Comments Section - Expandable */}
                  {expandedPost === post.id && post.comments && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-gray-700/50 animate-fadeIn">
                      <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span>Comments</span>
                      </div>

                      {post.comments.length > 0 ? (
                        post.comments.map((comment, index) => (
                          <div key={index} className="flex items-start gap-2 group hover:bg-gray-800/30 p-2 rounded-lg transition-all duration-200">
                            <img
                              src={getAvatarUrl(comment.user_avatar, 24)}
                              alt={`${comment.user_username}'s avatar`}
                              className="w-6 h-6 rounded-full object-cover border border-transparent group-hover:border-blue-500/30 transition-all duration-300"
                            />
                            <div className="flex-1 bg-gray-800/40 p-2 rounded-lg group-hover:bg-gray-800/60 transition-colors duration-200">
                              <div className="flex items-baseline justify-between">
                                <span className="font-medium text-sm">{comment.user_username}</span>
                                <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                              </div>
                              <p className="text-sm mt-1 text-gray-300 group-hover:text-white transition-colors duration-300">{comment.content}</p>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-500 hover:text-blue-400 p-1">
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-3 text-gray-500 text-sm italic">
                          No comments yet. Be the first to comment!
                        </div>
                      )}
                      
                      {/* Comment input */}
                      <div className="flex items-start gap-2 mt-2">
                        <img
                          src={getAvatarUrl(userData?.avatar, 24)}
                          alt="Your avatar"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="flex-1 bg-gray-800/40 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-blue-500/50 transition-all duration-300 hover:bg-gray-800/60">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            className="w-full bg-transparent border-none p-2 text-sm focus:outline-none"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                          />
                        </div>
                        <button 
                          className={`p-2 rounded-full transition-all duration-300 ${
                            commentText 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          } hover:shadow-md`}
                          disabled={!commentText}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {userPosts.length > 3 && (
            <div className="text-center mt-6">
              <button 
                onClick={() => setExpandedView(!expandedView)}
                className="flex items-center justify-center gap-1 mx-auto px-4 py-2 bg-gray-800/70 hover:bg-gray-700 rounded-lg transition-all duration-300 hover:shadow-md group"
              >
                <span className="group-hover:text-white transition-colors duration-300">
                  {expandedView ? 'Show Less' : `Show More (${userPosts.length - 3} more)`}
                </span>
                <ChevronDown className={`w-4 h-4 transform transition-transform duration-500 ${expandedView ? 'rotate-180' : ''} group-hover:text-blue-400`} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 transition-all duration-300 hover:bg-gray-800/20 hover:shadow-inner rounded-xl group">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-600 opacity-50 transition-all duration-500 group-hover:rotate-12 group-hover:text-blue-400 group-hover:opacity-70" />
          <p className="text-lg group-hover:text-white transition-colors duration-300">No posts yet</p>
          <p className="text-sm mt-2 group-hover:text-gray-300 transition-colors duration-300">Share your fitness journey by creating your first post</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 hover:shadow-md transform hover:scale-105 hover:translate-y-[-2px]">
            Create Post
          </button>
        </div>
      )}
      
      {/* Removed the modals from here */}
    </div>
  );
};

export default RecentPosts;