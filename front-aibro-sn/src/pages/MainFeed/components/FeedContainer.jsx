import React, { useState, useRef, useEffect } from 'react';
import { User, MoreVertical, Heart, MessageCircle, Share2, Send, Pencil, 
  Trash2, X, Edit, Activity, Users, Dumbbell, Calendar, Link, 
  Clock, Target, ChevronDown, ChevronUp, ClipboardList, MapPin} from 'lucide-react';
import { FileEdit } from "lucide-react";
import api from '../../../api';
import { getAvatarUrl } from '../../../utils/imageUtils';
import ProgramCardPost from './ProgramCardPost';
import WorkoutLogPreview from './WorkoutLogPreview';
import { ModalProvider } from './ModalController';
import SharePostModal from './SharePostModal';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';

// Make sure to import the ProgramCardPost component at the top of your file

const Post = ({ 
  post, 
  currentUser, 
  onLike, 
  onComment, 
  onShare, 
  onEdit, 
  onDelete,
  userData,
  onProgramClick 
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showShareInput, setShowShareInput] = useState(false);
  const [shareText, setShareText] = useState('');
  const [programData, setProgramData] = useState(null);
  const menuRef = useRef(null);
  const shareInputRef = useRef(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch program data if this is a program post
  useEffect(() => {
    const fetchProgramData = async () => {
      // If we have program_details but not program_id, extract from details
      if (post.post_type === 'program' && !post.program_id && post.program_details) {
        try {
          const details = typeof post.program_details === 'string'
            ? JSON.parse(post.program_details)
            : post.program_details;
            
          if (details && details.id) {
            // Add program_id to post object
            post.program_id = details.id;
            setProgramData(details);
            return;
          }
        } catch (err) {
          console.error('Error parsing program details:', err);
        }
      }
      
      if (post.post_type === 'program' && post.program_id && !programData) {
        try {
          const response = await api.get(`/workouts/programs/${post.program_id}/`);
          setProgramData(response.data);
        } catch (err) {
          console.error('Error fetching program data:', err);
        }
      }
    };
  
    fetchProgramData();
  }, [post.post_type, post.program_id]);


  const handleShareSuccess = (newSharedPost) => {
    // Pass the new shared post to the parent component's onShare handler
    if (onShare) {
      onShare(post.id, newSharedPost);
    }
    setIsShareModalOpen(false);
  };

  const handleProgramClick = (program) => {
    if (onProgramClick) {
      onProgramClick(program);
    } else {
      // Fallback navigation if the prop isn't provided
      window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
    }
  };

  const PostMenu = ({ isOpen }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute right-0 top-10 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700/50 overflow-hidden z-10">
        {post.user_username === currentUser && (
          <>
            <button
              onClick={() => {
                onEdit(post);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Post
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this post?')) {
                  onDelete(post.id);
                }
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Post
            </button>
          </>
        )}
        <button
          onClick={() => setShowMenu(false)}
          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  };

    // In FeedContainer.jsx - update the SharedPostContent component to properly render workout logs and programs
  // Updated SharedPostContent component for FeedContainer.jsx

const SharedPostContent = ({ originalPost }) => {
  const [loading, setLoading] = useState(true);
  const [workoutLog, setWorkoutLog] = useState(null);
  const [programData, setProgramData] = useState(null);
  const [userData, setUserData] = useState(null);
  

  // Fetch the full data for workout logs, programs, and user data
  useEffect(() => {
    const fetchFullData = async () => {
      setLoading(true);
      
      try {
        // For workout logs
        if (originalPost.post_type === 'workout_log' && originalPost.workout_log_details) {
          const workoutLogId = originalPost.workout_log_details.id;
          if (workoutLogId) {
            const response = await api.get(`/workouts/logs/${workoutLogId}/`);
            setWorkoutLog(response.data);
          } else if (typeof originalPost.workout_log_details === 'object') {
            // If we already have the details, use them directly
            setWorkoutLog(originalPost.workout_log_details);
          }
        }
        
        // For programs
        if (originalPost.post_type === 'program' && originalPost.program_details) {
          // Handle if program_details is a string (JSON) or already an object
          const programDetails = typeof originalPost.program_details === 'string'
            ? JSON.parse(originalPost.program_details)
            : originalPost.program_details;
            
          const programId = programDetails?.id;
          
          if (programId) {
            const response = await api.get(`/workouts/programs/${programId}/`);
            setProgramData(response.data);
          } else {
            // If no ID but we have details, use them directly
            setProgramData(programDetails);
          }
        }

        // Fetch user data to get the avatar
        try {
          const usersResponse = await api.get('/users/');
          const allUsers = usersResponse.data.results || usersResponse.data;
          const user = allUsers.find(u => u.username === originalPost.user_username);
          if (user) {
            setUserData(user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } catch (error) {
        console.error("Error fetching full data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFullData();
  }, [originalPost]);

  if (loading) {
    return (
      <div className="mt-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {originalPost.user_username[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-white">{originalPost.user_username}</p>
            <p className="text-xs text-gray-400">
              {new Date(originalPost.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <p className="text-gray-200 mb-3">{originalPost.content}</p>
        
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-gray-700 rounded-lg"></div>
          <div className="h-5 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Get post type details for the original post
  const postTypeDetails = originalPost.post_type 
    ? getPostTypeDetails(originalPost.post_type) 
    : getPostTypeDetails('regular');
  const postTypeGradient = postTypeDetails.colors.gradient;
  const postTypeBg = postTypeDetails.colors.bg;
  const postTypeText = postTypeDetails.colors.text;

  return (
    <div className={`mt-4 bg-gray-800/50 rounded-lg p-4 border ${postTypeDetails.colors.border}`}>
    
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${postTypeGradient} flex items-center justify-center overflow-hidden`}>
        {userData?.avatar ? (
          <img 
            src={getAvatarUrl(userData.avatar)}
            alt={originalPost.user_username}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white text-sm font-medium">
            {originalPost.user_username[0].toUpperCase()}
          </span>
        )}
      </div>
        <div>
          <p className="font-medium text-white">{originalPost.user_username}</p>
          <p className="text-xs text-gray-400">
            {new Date(originalPost.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <p className="text-gray-200 mb-3">{originalPost.content}</p>
      
      {/* Use WorkoutLogPreview component for workout logs */}
      {originalPost.post_type === 'workout_log' && originalPost.workout_log_details && workoutLog && (
        <WorkoutLogPreview 
          workoutLogId={originalPost.workout_log}
          workoutLog={workoutLog}
          canEdit={false}
        />
      )}
      
      {/* Use ProgramCardPost component for programs */}
      {originalPost.post_type === 'program' && (programData) && (
        <ProgramCardPost 
          programId={originalPost.program_id || originalPost.program}
          initialProgramData={programData}
        />
      )}
      
      {/* Regular Image */}
      {originalPost.image && (
        <img
          src={getAvatarUrl(originalPost.image)}
          alt="Original post content"
          className="mt-3 rounded-lg w-full object-cover"
        />
      )}
    </div>
  );
};

  const Comments = () => (
    <div className="mt-4 space-y-3">
      {post.comments?.map(comment => (
        <div key={comment.id} className="flex gap-3">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${post.post_type ? getPostTypeDetails(post.post_type).colors.gradient : 'from-blue-500 to-indigo-500'} flex items-center justify-center`}>
            <span className="text-white text-sm font-medium">
              {comment.user_username[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="bg-gray-800/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {comment.user_username}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">{comment.content}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // In FeedContainer.jsx - Post component
  // Add a check for shared posts before showing the share button

  const ActionButtons = () => {
    const postColorText = post.post_type ? getPostTypeDetails(post.post_type).colors.text : 'text-blue-400';
    
    return (
      <div className="grid grid-cols-3 gap-4">
        <button 
          onClick={() => onLike(post.id)}
          className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
        >
          <Heart 
            className={`w-5 h-5 ${
              post.is_liked 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-400 group-hover:text-red-500'
            }`}
          />
          <span className={`text-sm font-medium ${
            post.is_liked ? 'text-red-500' : 'text-gray-400 group-hover:text-red-500'
          }`}>{post.likes_count || 0}</span>
        </button>
    
        <button 
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
        >
          <MessageCircle className={`w-5 h-5 text-gray-400 group-hover:${postColorText}`} />
          <span className={`text-sm font-medium text-gray-400 group-hover:${postColorText}`}>
            {post.comments?.length || 0}
          </span>
        </button>
    
        {post.is_share ? (
          // For shared posts - show disabled button with tooltip
          <div className="relative group">
            <button 
              disabled
              className="flex items-center justify-center gap-2 py-2 rounded-lg opacity-50 cursor-not-allowed w-full"
            >
              <Share2 className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-500">
                {post.shares_count || 0}
              </span>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
              Shared posts cannot be shared again
            </div>
          </div>
        ) : (
          // For regular posts - show functional share button
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            <Share2 className={`w-5 h-5 text-gray-400 group-hover:${postColorText}`} />
            <span className={`text-sm font-medium text-gray-400 group-hover:${postColorText}`}>
              {post.shares_count || 0}
            </span>
          </button>
        )}
      </div>
    );
  };

  const effectivePostType = (post.is_share && post.original_post_details?.post_type) 
  ? post.original_post_details.post_type 
  : post.post_type || 'regular';

  const postTypeDetails = getPostTypeDetails(effectivePostType);
  const colorGradient = postTypeDetails.colors.gradient;
  const colorText = postTypeDetails.colors.text;
  const colorBg = postTypeDetails.colors.bg;
  const colorBorder = postTypeDetails.colors.border;
  const ringColor = colorText.split('-')[0] || 'blue';

  return (
    <div className="bg-gray-900/50 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center`}>
              {userData?.avatar ? (
                <img 
                  src={getAvatarUrl(userData.avatar)}
                  alt={post.user_username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-medium text-lg">
                  {post.user_username[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="ml-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white">{post.user_username}</h3>
                {post.is_share && (
                  <span className="text-gray-400 text-sm">shared a post</span>
                )}
                {post.post_type && (() => {
                  const { Icon: IconName, label, colors } = getPostTypeDetails(post.post_type);
                  // Find the actual Icon component from the imported icons
                  const Icon = 
                    IconName === 'Edit' ? Edit :
                    IconName === 'Activity' ? Activity :
                    IconName === 'Users' ? Users :
                    IconName === 'Dumbbell' ? Dumbbell : Edit;
                  
                  return (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium ${colors.bg} ${colors.text}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </div>
                  );
                })()}
              </div>
              <time className="text-sm text-gray-400">
                {new Date(post.created_at).toLocaleDateString()}
              </time>
            </div>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors group"
            >
              <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
            <PostMenu isOpen={showMenu} />
          </div>
        </div>

        <div className="mt-4">
          {post.content && <p className="text-gray-100 text-lg">{post.content}</p>}
          
          {/* Program Card */}
          {post.post_type === 'program' && (
            <div className="mt-2">
            <ProgramCardPost 
              programId={post.program_id || (post.program_details && post.program_details.id)}
              initialProgramData={
                typeof post.program_details === 'string' 
                  ? JSON.parse(post.program_details) 
                  : post.program_details
              }
              onClick={handleProgramClick}
              onProgramSelect={handleProgramClick}
            />
          </div>
          )}
          
          {/* Workout Log */}
          {post.post_type === 'workout_log' && post.workout_log_details && (
            <WorkoutLogPreview 
              workoutLogId={post.workout_log}
              workoutLog={post.workout_log_details}
              canEdit={post.user_username === currentUser}
            />
          )}
          
          {/* Shared Post */}
          {post.is_share && post.original_post_details && (
            <SharedPostContent originalPost={post.original_post_details} />
          )}
          
          {/* Regular Image */}
          {!post.is_share && post.image && (
            <img
              src={getAvatarUrl(post.image)}
              alt="Post content"
              className="mt-4 w-full rounded-lg object-cover"
            />
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800">
          <ActionButtons />
        </div>

        {/* Share Modal */}
        <SharePostModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          post={post}
          onShareSuccess={handleShareSuccess}
        />

        {showCommentInput && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center`}>
              <span className="text-white text-sm font-medium">
                {currentUser ? currentUser[0].toUpperCase() : "?"}
              </span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className={`flex-1 bg-gray-800 text-gray-100 rounded-full px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-${ringColor}-500`}
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    onComment(post.id, commentText);
                    setCommentText('');
                  }
                }}
                disabled={!commentText.trim()}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Send className={`w-5 h-5 ${colorText}`} />
              </button>
            </div>
          </div>
          
          <Comments />
        </div>
        )}
      </div>
    </div>
  );
};

const FeedContainer = ({ 
  posts, 
  currentUser, 
  onLike, 
  onComment, 
  onShare, 
  onEdit, 
  onDelete,
  onProgramSelect // Add this new prop
}) => {
  const [usersData, setUsersData] = useState({});
  const [friendUsernames, setFriendUsernames] = useState(null);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch friends list
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendsResponse = await api.get('/users/friends/');
        const friendsList = Array.isArray(friendsResponse.data) ? friendsResponse.data :
                          Array.isArray(friendsResponse.data.results) ? friendsResponse.data.results : [];
        
        // Get list of friend usernames
        const friendsSet = new Set(friendsList.map(f => f.friend.username));
        setFriendUsernames(friendsSet);
      } catch (error) {
        console.error('Error fetching friends:', error);
        setFriendUsernames(new Set()); // Set empty set on error
      }
    };

    fetchFriends();
  }, []);

  // Filter posts to only show friends' posts and current user's posts
  useEffect(() => {
    // Only proceed if friendUsernames is not null (indicating friends have been fetched)
    if (friendUsernames !== null) {
      const friendPosts = posts.filter(post => 
        friendUsernames.has(post.user_username) || post.user_username === currentUser
      );
      setFilteredPosts(friendPosts);
      setLoading(false);
    }
  }, [posts, friendUsernames, currentUser]);

  // Fetch user data for posts
  useEffect(() => {
    const usernames = [...new Set(filteredPosts.map(post => post.user_username))];
    
    const fetchUsersData = async () => {
      try {
        const usersResponse = await api.get('/users/');
        const allUsers = usersResponse.data.results || usersResponse.data;
        
        const newUsersData = {};
        usernames.forEach(username => {
          const user = allUsers.find(u => u.username === username);
          if (user) {
            newUsersData[username] = user;
          }
        });
        
        setUsersData(newUsersData);
      } catch (error) {
        console.error('Error fetching users data:', error);
      }
    };

    if (usernames.length > 0) {
      fetchUsersData();
    }
  }, [filteredPosts]);

  const handleProgramClick = (program) => {
    if (onProgramSelect) {
      onProgramSelect(program);
    } else {
      // Fallback - redirect to program detail page
      window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
    }
  };

  if (loading) {
    return (
      <div className="group relative bg-gray-800 rounded-xl overflow-hidden p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-4">
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                <div className="mt-4 h-24 bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20">
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-blue-500 opacity-75" />
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              Feed
            </h3>
            <p className="text-gray-400 mt-1">Latest updates from your friends</p>
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No posts to show. Add some friends to see their updates!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Post
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={onLike}
                onComment={onComment}
                onShare={onShare}
                onEdit={onEdit}
                onDelete={onDelete}
                userData={usersData[post.user_username]}
                onProgramClick={handleProgramClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedContainer;