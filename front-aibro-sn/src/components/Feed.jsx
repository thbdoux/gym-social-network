// src/components/Feed.jsx
import React, { useState } from 'react';
import { User, Heart, MessageCircle, Send } from 'lucide-react';
import api from '../api';

const CommentSection = ({ comments, postId, onNewComment }) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/posts/${postId}/comment/`, {
        content: newComment
      });
      onNewComment(response.data);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{comment.user_username}</span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

const Post = ({ post, onUpdatePost }) => {
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    try {
      if (post.is_liked) {
        await api.delete(`/posts/${post.id}/like/`);
      } else {
        await api.post(`/posts/${post.id}/like/`);
      }
      onUpdatePost({
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
      });
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleNewComment = (comment) => {
    onUpdatePost({
      ...post,
      comments: [...post.comments, comment]
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
          <User className="w-6 h-6 text-gray-400" />
        </div>
        <div className="ml-4">
          <h3 className="font-bold text-lg">{post.user_username}</h3>
          <time className="text-sm text-gray-400">
            {new Date(post.created_at).toLocaleDateString()}
          </time>
        </div>
      </div>
      
      <p className="text-lg mb-4">{post.content}</p>
      
      {post.image && (
        <img
          src={post.image}
          alt="Post content"
          className="w-full rounded-lg mb-4"
        />
      )}
      
      <div className="flex items-center space-x-6 text-gray-400">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors ${
            post.is_liked ? 'text-red-500 hover:text-red-400' : 'hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
          <span>{post.likes_count} likes</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments.length} comments</span>
        </button>
      </div>

      {showComments && (
        <CommentSection
          comments={post.comments}
          postId={post.id}
          onNewComment={handleNewComment}
        />
      )}
    </div>
  );
};

const Feed = ({ posts, loading, error, onUpdatePost }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Feed</h1>
      <div className="space-y-6 max-w-3xl">
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onUpdatePost={(updatedPost) => 
              onUpdatePost?.(posts.map(p => 
                p.id === updatedPost.id ? updatedPost : p
              ))
            }
          />
        ))}
      </div>
    </div>
  );
};

export default Feed;