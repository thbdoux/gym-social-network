import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Users, Calendar, User, LogOut } from 'lucide-react';

const Post = ({ post }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="font-bold text-lg text-slate-900">{post.user_username}</h3>
            <time className="text-sm text-slate-500">
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        </div>
        <p className="text-slate-700 text-lg mb-4">{post.content}</p>
        {post.image && (
          <img
            src={post.image}
            alt="Post content"
            className="w-full rounded-lg mb-4 object-cover"
          />
        )}
        <div className="flex items-center space-x-6 text-slate-600">
          <button className="flex items-center space-x-2 hover:text-red-500 transition-colors">
            <span>❤️</span>
            <span>{post.likes_count} likes</span>
          </button>
          <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
            <span>💬</span>
            <span>{post.comments.length} comments</span>
          </button>
        </div>
      </div>
    );
  };

  export default Post;