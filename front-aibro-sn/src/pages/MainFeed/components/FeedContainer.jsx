import React, { useState, useRef, useEffect } from 'react';
import { User, MoreVertical, Heart, MessageCircle, Share2, Send, Pencil, Trash2, X } from 'lucide-react';
import { FileEdit } from "lucide-react";

const Post = ({ 
  post, 
  currentUser, 
  onLike, 
  onComment, 
  onShare, 
  onEdit, 
  onDelete 
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showShareInput, setShowShareInput] = useState(false);
  const [shareText, setShareText] = useState('');
  const menuRef = useRef(null);
  const shareInputRef = useRef(null);

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
          {originalPost.user_profile_picture ? (
            <img 
              src={getAvatarUrl(originalPost.user_profile_picture)}
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
            {post.user_profile_picture ? (
              <img 
                src={getAvatarUrl(post.user_profile_picture)}
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{post.user_username}</h3>
                {post.is_share && (
                  <span className="text-gray-400 text-sm">shared a post</span>
                )}
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
          {post.is_share && post.original_post_details && (
            <SharedPostContent originalPost={post.original_post_details} />
          )}
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
                {currentUser ? "You" : "?"}
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
}

const FeedContainer = ({ posts, currentUser, onLike, onComment, onShare, onEdit, onDelete }) => {
  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20">
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-blue-500 opacity-75" />
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              Feed
            </h3>
            <p className="text-gray-400 mt-1">Latest updates from your gym community</p>
          </div>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedContainer;