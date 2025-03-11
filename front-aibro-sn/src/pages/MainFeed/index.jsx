import React, { useState, useEffect } from 'react';
import WelcomeHeader from './components/WelcomeHeader';
import CreatePost from './components/CreatePost';
import FeedContainer from './components/FeedContainer';
import EditPostModal from './components/EditPostModal';
import api from '../../api';

const MainFeed = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  
  const handleProgramSelect = async (program) => {
    try {
      const response = await api.get(`/workouts/programs/${program.id}/`);
      // Change view to program detail
      window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
    } catch (err) {
      console.error('Error navigating to program:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch only necessary data in parallel
        const [userResponse, postsResponse] = await Promise.all([
          api.get('/users/me/'),
          api.get('/posts/feed/')
        ]);
        
        setUser(userResponse.data);
        setPosts(postsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
  
    fetchData();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like/`);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_liked: !post.is_liked, likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 }
          : post
      ));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handlePostComment = async (postId, content) => {
    try {
      const response = await api.post(`/posts/${postId}/comment/`, { content });
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), response.data]
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Error commenting on post:', err);
    }
  };

  const handleSharePost = async (postId, newSharedPostOrContent) => {
    try {
      let response;
      
      if (typeof newSharedPostOrContent === 'object' && newSharedPostOrContent !== null) {
        // If we already have the full shared post data, use it directly
        setPosts(prevPosts => [newSharedPostOrContent, ...prevPosts]);
        return newSharedPostOrContent;
      } else {
        // If we just have the content text, make the API call
        const content = typeof newSharedPostOrContent === 'string' 
          ? newSharedPostOrContent 
          : '';
          
        response = await api.post(`/posts/${postId}/share/`, {
          content: content
        });
        
        // Update the posts state with the new shared post
        setPosts(prevPosts => [response.data, ...prevPosts]);
        return response.data;
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      alert('Failed to share post. Please try again.');
    }
  };
  
  const handleEditClick = (post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleEditPost = async (updatedPost) => {
    try {
      const editableData = {
        content: updatedPost.content,
        post_type: updatedPost.post_type,
        image: updatedPost.image
      };

      const response = await api.put(`/posts/${updatedPost.id}/`, editableData);
      setPosts(posts.map(p => p.id === updatedPost.id ? response.data : p));
      setIsEditModalOpen(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error.response?.data || error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}/`);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <WelcomeHeader username={user?.username} />
        <CreatePost onPostCreated={handlePostCreated} />
      </div>
      
      <FeedContainer
        posts={posts}
        currentUser={user?.username}
        onLike={handlePostLike}
        onComment={handlePostComment}
        onShare={handleSharePost} 
        onEdit={handleEditClick}
        onDelete={handleDeletePost}
        onProgramSelect={handleProgramSelect}
      />
      
      {editingPost && (
        <EditPostModal
          post={editingPost}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPost(null);
          }}
          onSave={handleEditPost}
        />
      )}
    </div>
  );
};

export default MainFeed;