import React, { useState } from 'react';
import { Heart, MessageSquare, MoreHorizontal, Activity, Users} from 'lucide-react';

const getTypeColor = (type) => {
  switch (type) {
    case 'workout_log':
      return 'from-green-500 to-emerald-500';
    case 'workout_invite':
      return 'from-orange-500 to-amber-500';
    default:
      return 'from-blue-500 to-indigo-500';
  }
};

// Post.jsx
const Post = ({ post, onLike, onComment }) => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');

  const PostTypeIndicator = () => {
    if (post.post_type === 'workout_log') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-lg">
          <Activity className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm font-medium text-white">{post.workout_log?.workout_name}</p>
            <p className="text-xs text-gray-400">Workout completed</p>
          </div>
        </div>
      );
    }
    if (post.post_type === 'workout_invite') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-lg">
          <Users className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-sm font-medium text-white">Group Workout</p>
            <p className="text-xs text-gray-400">
              {new Date(post.planned_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900/50 rounded-lg overflow-hidden">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
            {post.user_username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{post.user_username}</h3>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-400">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Post Type Indicator */}
        {post.post_type !== 'regular' && (
          <div className="mt-3">
            <PostTypeIndicator />
          </div>
        )}

        {/* Post Content */}
        <div className="mt-3">
          <p className="text-gray-100">{post.content}</p>
          {post.image && (
            <img 
              src={post.image} 
              alt="Post content" 
              className="mt-3 rounded-lg w-full object-cover" 
            />
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center gap-6 mt-4">
          <button 
            onClick={() => onLike(post.id)}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Heart 
              className={`w-5 h-5 ${post.is_liked ? 'fill-red-400 text-red-400' : ''}`}
            />
            <span className="text-sm font-medium">{post.likes_count || 0}</span>
          </button>
          <button 
            onClick={() => setIsCommenting(!isCommenting)}
            className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments?.length || 0}</span>
          </button>
        </div>

        {/* Comments Section */}
        {isCommenting && (
          <div className="mt-4 space-y-3">
            {/* Comment Input */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm">
                {post.user_username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-gray-800/50 rounded-full px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {/* Comments List */}
            {post.comments?.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm">
                  {comment.user_username[0].toUpperCase()}
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
        )}
      </div>
    </div>
  );
};

export default Post;