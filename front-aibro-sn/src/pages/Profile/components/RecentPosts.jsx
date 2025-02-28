import React, { useState, useEffect } from 'react';
import { 
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Dumbbell,
  Calendar,
  Clock,
  Trash2,
  Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAvatarUrl } from '../../../utils/imageUtils';
import api from '../../../api';
import ProgramCardPost from '../../MainFeed/components/ProgramCardPost';
import ExpandableProgramModal from '../../MainFeed/components/ExpandableProgramModal';

const RecentPosts = ({ posts, username }) => {
  const [userData, setUserData] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const userPosts = Array.isArray(posts) 
    ? posts.filter(post => post.user_username === username)
    : [];

  // Handler for program card selection - using React component modal instead
  const handleProgramSelect = (program) => {
    // Set the selected program to open the modal
    setSelectedProgram(program);
  };
  
  // Close the program modal
  const handleCloseModal = () => {
    setSelectedProgram(null);
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
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:from-gray-800/60 hover:to-gray-900/80">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Recent Posts</h2>
        <Link 
          to={`/users/${username}/posts`} 
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-all duration-200 transform hover:translate-x-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {userPosts.length > 0 ? (
        <div className="space-y-4">
          {userPosts.map((post) => (
            <div 
              key={post.id} 
              className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <img
                  src={getAvatarUrl(userData?.avatar, 40)}
                  alt={`${post.user_username}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-800"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-medium">{post.user_username}</span>
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatTimestamp(post.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {post.post_type !== 'regular' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          post.post_type === 'workout_log' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : post.post_type === 'program_share' 
                              ? 'bg-purple-500/20 text-purple-400' 
                              : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {post.post_type === 'workout_log' ? 'Workout' : 
                          post.post_type === 'program_share' ? 'Program' : 
                          post.post_type}
                        </span>
                      )}
                      
                      <div className="relative">
                        <button 
                          onClick={(e) => toggleMenu(post.id, e)} 
                          className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        {menuOpen === post.id && (
                          <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-xl py-1 w-36 z-10 animate-fadeIn">
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-700 transition-colors">
                              <Edit2 className="w-4 h-4 text-blue-400" />
                              <span>Edit Post</span>
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-700 transition-colors">
                              <Trash2 className="w-4 h-4 text-red-400" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Post Content */}
                  <div className="mt-3">
                    <p className="text-gray-200">{post.content}</p>
                  </div>
                  
                  {/* Post Image */}
                  {post.image && (
                    <div className="mt-3">
                      <img
                        src={getAvatarUrl(post.image)}
                        alt=""
                        className="rounded-lg w-full object-cover max-h-96 transform transition-transform duration-300 hover:scale-[1.01]"
                      />
                    </div>
                  )}
                  
                  {/* Workout Log */}
                  {post.post_type === 'workout_log' && post.workout_log && (
                    <div className="mt-3 bg-gray-800/50 rounded-lg p-4 transition-all duration-300 hover:bg-gray-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-blue-400" />
                          <div className="text-lg font-medium">{post.workout_log.workout_name}</div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Calendar className="w-3 h-3" />
                          <span>{post.workout_log.date}</span>
                        </div>
                      </div>
                      
                      {post.workout_log.exercises && post.workout_log.exercises.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-sm font-medium text-gray-300">Exercises:</div>
                          {post.workout_log.exercises.map((exercise, index) => (
                            <div key={index} className="bg-gray-700/30 p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{exercise.name}</span>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                  {exercise.sets} sets
                                </span>
                              </div>
                              {exercise.sets_data && exercise.sets_data.length > 0 && (
                                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-400">
                                  <div className="font-medium text-gray-300">Set</div>
                                  <div className="font-medium text-gray-300">Weight</div>
                                  <div className="font-medium text-gray-300">Reps</div>
                                  {exercise.sets_data.map((set, setIndex) => (
                                    <React.Fragment key={setIndex}>
                                      <div>{setIndex + 1}</div>
                                      <div>{set.weight} {set.weight_unit}</div>
                                      <div>{set.reps}</div>
                                    </React.Fragment>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Program Share */}
                  {post.post_type === 'program' && post.program && (
                    <div className="mt-3 relative">
                      <div 
                        onClick={() => handleProgramSelect(post.program_details)}
                        className="cursor-pointer transition-all duration-300 transform hover:scale-[1.02]"
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
                    <button className="flex items-center gap-1 hover:text-red-400 text-sm transition-colors duration-300 group">
                      <Heart className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span>{post.likes_count || 0}</span>
                    </button>
                    <button 
                      className="flex items-center gap-1 hover:text-blue-400 text-sm transition-colors duration-300 group"
                      onClick={() => togglePostExpansion(post.id)}
                    >
                      <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span>{post.comments?.length || 0}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-green-400 text-sm transition-colors duration-300 group">
                      <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span>Share</span>
                    </button>
                  </div>
                  
                  {/* Comments Section - Expandable */}
                  {expandedPost === post.id && post.comments && post.comments.length > 0 && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-gray-700/50 animate-fadeIn">
                      <div className="text-sm font-medium text-gray-300">Comments</div>
                      {post.comments.map((comment, index) => (
                        <div key={index} className="flex items-start gap-2 group">
                          <img
                            src={getAvatarUrl(comment.user_avatar, 24)}
                            alt={`${comment.user_username}'s avatar`}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div className="flex-1 bg-gray-800/40 p-2 rounded-lg group-hover:bg-gray-800/60 transition-colors duration-200">
                            <div className="flex items-baseline justify-between">
                              <span className="font-medium text-sm">{comment.user_username}</span>
                              <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Comment input */}
                      <div className="flex items-start gap-2 mt-2">
                        <img
                          src={getAvatarUrl(userData?.avatar, 24)}
                          alt="Your avatar"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="flex-1 bg-gray-800/40 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-blue-500/50 transition-all duration-200">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            className="w-full bg-transparent border-none p-2 text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-lg">No posts yet</p>
          <p className="text-sm mt-2">Share your fitness journey by creating your first post</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Create Post
          </button>
        </div>
      )}
      
      {/* Program Modal - Using the existing expandable program modal */}
      {selectedProgram && (
        <ExpandableProgramModal 
          programId={selectedProgram.id}
          initialProgramData={selectedProgram}
          isOpen={!!selectedProgram}
          onClose={handleCloseModal}
          onProgramSelect={(program) => {
            window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
          }}
        />
      )}
    </div>
  );
};

export default RecentPosts;