import React, { useState } from 'react';
import { 
  User, 
  MoreVertical, 
  Heart, 
  MessageCircle, 
  Share2, 
  Send
} from 'lucide-react';

const Post = ({ post, onLike, onComment, onShare }) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              {post.user_avatar ? (
                <img 
                  src={post.user_avatar} 
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
              <h3 className="font-semibold text-white">{post.user_username}</h3>
              <time className="text-sm text-gray-400">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </div>
          
          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors group">
            <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          <p className="text-gray-100 text-lg">{post.content}</p>
          {post.image && (
            <img
              src={post.image}
              alt="Post content"
              className="mt-4 w-full rounded-lg object-cover"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-800">
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
              }`}>
                {post.likes_count || 0}
              </span>
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
              onClick={() => onShare(post.id)}
              className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
            >
              <Share2 className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
              <span className="text-sm font-medium text-gray-400 group-hover:text-green-500">
                Share
              </span>
            </button>
          </div>
        </div>

        {/* Comment Input */}
        {showCommentInput && (
          <div className="mt-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {post.user_username[0].toUpperCase()}
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
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-blue-500" />
              </button>
            </div>
          </div>
        )}

        {/* Comments Display */}
        {showCommentInput && post.comments && post.comments.length > 0 && (
          <div className="mt-4 space-y-3">
            {post.comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {comment.user_username[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {comment.user_username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
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