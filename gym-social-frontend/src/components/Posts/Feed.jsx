import React, { useState, useEffect } from 'react';
import * as api from '../../api/api';
import CreatePost from './CreatePost';
import PostCard from './PostCard';

export default function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await api.getPosts();
      setPosts(data.results);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <CreatePost onPostCreated={loadPosts} />
      <div className="mt-8 space-y-6">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
