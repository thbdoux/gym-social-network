import React, { useState, useEffect } from 'react';
import { 
  ChevronDown,
  Dumbbell,
  Clock,
  Trash2,
  Edit2,
  Send,
  Sparkles,
  ThumbsUp,
  MoreHorizontal
} from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import api from '../../../api';
import { ProgramCard } from '../../Workouts/components/ProgramCard';
import WorkoutLogCard from '../../Workouts/components/WorkoutLogCard';

const RecentPosts = ({ 
  posts: initialPosts, 
  username, 
  onViewAll, 
  onProgramSelect, 
  onWorkoutLogSelect,
  onEditPost,
  onDeletePost
}) => {
  const [userData, setUserData] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const [hoveredPost, setHoveredPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [hoveredButton, setHoveredButton] = useState(null);
  
  // State for managing posts locally
  const [posts, setPosts] = useState(Array.isArray(initialPosts) ? [...initialPosts] : []);
  
  const userPosts = posts.filter(post => post.user_username === username) || [];
    
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

  // Function to handle edit post request
  const handleEditPost = (post) => {
    if (onEditPost) {
      onEditPost(post);
    }
    setMenuOpen(null);
  };

  // Function to handle delete post request
  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        if (onDeletePost) {
          await onDeletePost(postId);
          // Update local state
          setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        }
        setMenuOpen(null);
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      }
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

  // Use effect to update posts when initialPosts changes
  useEffect(() => {
    setPosts(Array.isArray(initialPosts) ? [...initialPosts] : []);
  }, [initialPosts]);

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
                      
                      {/* Only show menu button if the current user is the post author */}
                      {userData && userData.username === post.user_username && (
                        <div className="relative">
                          <button 
                            onClick={(e) => toggleMenu(post.id, e)} 
                            className="p-1 hover:bg-gray-800 rounded-full transition-all duration-300"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                          
                          {menuOpen === post.id && (
                            <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-xl py-1 w-36 z-10 animate-fadeIn">
                              <button 
                                onClick={() => handleEditPost(post)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-700 transition-all duration-200 group"
                              >
                                <Edit2 className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform duration-200" />
                                <span className="group-hover:translate-x-1 transition-transform duration-200">Edit Post</span>
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-700 transition-all duration-200 group"
                              >
                                <Trash2 className="w-4 h-4 text-red-400 group-hover:rotate-12 transition-transform duration-200" />
                                <span className="group-hover:translate-x-1 transition-transform duration-200">Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                        <WorkoutLogCard
                          user = {currentUser}
                          logId={post.workout_log_details.id}
                          log={post.workout_log_details}
                          onSelect={handleWorkoutLogSelect}
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
                        <ProgramCard
                          programId={post.program_details.id} 
                          program={post.program_details}
                          onProgramSelect={(e) => {
                            e.stopPropagation(); // Prevent double firing
                            handleProgramSelect(post.program_details);
                          }}
                        />
                        {/* Overlay to catch all clicks */}
                        <div className="absolute inset-0 bg-transparent"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Like/Comment/Share buttons are removed */}
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
      
      {/* No Edit Post Modal here - it's now in the parent component */}
    </div>
  );
};

export default RecentPosts;