// src/components/Feed/contexts/PostsContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { postService } from '../../../api/services';

const PostsContext = createContext(null);

export const PostsProvider = ({ children }) => {
    const [posts, setPosts] = useLocalStorage('feed-posts', []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useLocalStorage('feed-error', null);
  
    const fetchPosts = async () => {
      console.log('Fetching posts...');
      
      setLoading(true);
      try {
        // Use postService instead of direct API call
        const postsData = await postService.getPosts();
        console.log('Posts response:', postsData);
        // Extract the results array from the paginated response if needed
        const postsArray = postsData.results || postsData || [];
        setPosts(postsArray);
        setError(null);
      } catch (err) {
        console.warn('Error fetching posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };
  
    const addPost = newPost => {
      setPosts(prevPosts => [newPost, ...(Array.isArray(prevPosts) ? prevPosts : [])]);
    };
  
    const updatePosts = updatedPosts => {
      setPosts(updatedPosts);
    };
  
    return (
      <PostsContext.Provider 
        value={{ 
          posts, 
          setPosts,
          loading, 
          setLoading,
          error, 
          setError,
          fetchPosts, 
          addPost, 
          updatePosts 
        }}
      >
        {children}
      </PostsContext.Provider>
    );
  };

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === null) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};