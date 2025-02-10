import React, { useState, useRef, useEffect } from 'react';
import { User, MoreVertical, Heart, MessageCircle, Share2, Send, Pencil, Trash2 } from 'lucide-react';
import { FileEdit } from "lucide-react";

const PostMenu = ({ isOwner, onEdit, onDelete, onClose, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-10 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700/50 overflow-hidden z-10">
      {isOwner && (
        <>
          <button
            onClick={onEdit}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Post
          </button>
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Post
          </button>
        </>
      )}
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};
const Post = ({ post, currentUserId, onLike, onComment, onShare, onEdit, onDelete }) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEdit(post);
    setShowMenu(false);
  };

  return (
    <div className="bg-gray-900/50 rounded-lg overflow-hidden">
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
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors group"
            >
              <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
            <PostMenu
              isOpen={showMenu}
              isOwner={post.user_id === currentUserId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClose={() => setShowMenu(false)}
            />
          </div>
        </div>

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
        )}
      </div>
    </div>
  );
};

// Main FeedContainer Component
const FeedContainer = ({ posts, currentUserId, onLike, onComment, onShare, onEdit, onDelete }) => {
  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20">
      {/* Progress Bar Background */}
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
              currentUserId={currentUserId}
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