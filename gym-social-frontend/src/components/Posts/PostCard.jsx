import React from 'react';

export default function PostCard({ post }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow mb-4">
      <div className="flex items-center mb-2">
        <img
          src={post.author.profile_picture || '/default-avatar.png'}
          alt={post.author.username}
          className="w-10 h-10 rounded-full"
        />
        <div className="ml-2">
          <h3 className="font-bold">{post.author.username}</h3>
          <p className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <p className="mt-2">{post.content}</p>
      <div className="mt-4 flex items-center space-x-4">
        <button className="text-gray-500 hover:text-blue-600">
          Like ({post.likes_count})
        </button>
        <button className="text-gray-500 hover:text-blue-600">
          Comment ({post.comments?.length || 0})
        </button>
      </div>
    </div>
  );
}