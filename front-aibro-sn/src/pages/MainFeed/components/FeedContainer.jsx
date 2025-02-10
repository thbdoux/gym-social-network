
import React, { useState } from 'react';
import { Heart, MessageSquare, MoreHorizontal } from 'lucide-react';
import { FileEdit } from "lucide-react";
import Post from './Post';

const FeedContainer = ({ posts, onLike, onComment }) => (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1">
    {/* Progress Bar Background */}
    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-violet-500 opacity-75" />
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              Feed
            </h3>
            <p className="text-gray-400 mt-1">Latest updates from your gym community</p>
          </div>
        </div>
  
        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onLike={onLike}
              onComment={onComment}
            />
          ))}
        </div>
      </div>
    </div>
  );

export default FeedContainer;