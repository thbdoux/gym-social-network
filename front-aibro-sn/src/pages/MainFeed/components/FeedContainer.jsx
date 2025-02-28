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

  const getPostTypeDetails = (type) => {
    switch(type) {
      case 'regular':
        return { label: 'Regular Post', Icon: Edit, colors: 'bg-blue-500/20 text-blue-400' };
      case 'workout_log':
        return { label: 'Workout', Icon: Activity, colors: 'bg-green-500/20 text-green-400' };
      case 'workout_invite':
        return { label: 'Group Workout', Icon: Users, colors: 'bg-orange-500/20 text-orange-400' };
      case 'program':
        return { label: 'Program', Icon: Dumbbell, colors: 'bg-purple-500/20 text-purple-400' };
      default:
        return { label: 'Post', Icon: Edit, colors: 'bg-gray-500/20 text-gray-400' };
    }
  };

  const handleProgramClick = (program) => {
    if (onProgramClick) {
      onProgramClick(program);
    } else {
      // Fallback navigation if the prop isn't provided
      window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
    }
  };
  const handleWorkoutLogClick = (workoutLog) => {
    // The modal is now handled internally in the WorkoutLogPreview component
    console.log('Workout log clicked:', workoutLog);
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

  const SharedPostContent = ({ originalPost }) => (
    <div className="mt-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
          {userData?.avatar ? (
            <img 
              src={getAvatarUrl(userData.avatar)}
              alt={originalPost.user_username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-medium">
              {originalPost.user_username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-medium text-white">{originalPost.user_username}</p>
          <p className="text-sm text-gray-400">
            {new Date(originalPost.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <p className="text-gray-200">{originalPost.content}</p>
      {originalPost.image && (
        <img
          src={getAvatarUrl(originalPost.image)}
          alt="Original post content"
          className="mt-3 rounded-lg w-full object-cover"
        />
      )}
    </div>
  );

  const ShareDialog = () => {
    useEffect(() => {
      if (showShareInput && shareInputRef.current) {
        shareInputRef.current.focus();
      }
    }, [showShareInput]);

    const handleShare = () => {
      onShare(post.id, shareText);
      setShareText('');
      setShowShareInput(false);
    };

    if (!showShareInput) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg w-full max-w-lg mx-4 overflow-hidden shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Share Post</h3>
            <button
              onClick={() => {
                setShowShareInput(false);
                setShareText('');
              }}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="share-comment" className="block text-sm font-medium text-gray-400 mb-2">
                Add your thoughts
              </label>
              <textarea
                id="share-comment"
                ref={shareInputRef}
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                placeholder="What do you think about this post?"
                rows={4}
                className="w-full bg-gray-900 text-gray-100 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              />
            </div>

            {/* Original post preview */}
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-sm text-gray-300">{post.user_username[0]}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Original post by <span className="text-white">{post.user_username}</span>
                </div>
              </div>
              <p className="text-gray-300 line-clamp-2">{post.content}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-900 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowShareInput(false);
                setShareText('');
              }}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={!shareText.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Comments = () => (
    <div className="mt-4 space-y-3">
      {post.comments?.map(comment => (
        <div key={comment.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
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

  const ActionButtons = () => (
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
        <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
        <span className="text-sm font-medium text-gray-400 group-hover:text-blue-500">
          {post.comments?.length || 0}
        </span>
      </button>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          setShowShareInput(!showShareInput);
        }}
        className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
      >
        <Share2 className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
        <span className="text-sm font-medium text-gray-400 group-hover:text-green-500">
          {post.shares_count || 0}
        </span>
      </button>
    </div>
  );

  return (
    <div className="bg-gray-900/50 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
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
                  const { Icon, label, colors } = getPostTypeDetails(post.post_type);
                  return (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium ${colors}`}>
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

        {showShareInput && <ShareDialog />}

        {showCommentInput && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
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
                className="flex-1 bg-gray-800 text-gray-100 rounded-full px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <Send className="w-5 h-5 text-blue-500" />
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