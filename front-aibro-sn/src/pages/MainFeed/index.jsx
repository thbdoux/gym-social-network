import React, { useState, useEffect } from 'react';
import WelcomeHeader from './components/WelcomeHeader';
import CreatePost from './components/CreatePost';
import ProgressCard from './components/ProgressCard';
import NextWorkout from './components/NextWorkout';
import FeedContainer from './components/FeedContainer';
import EditPostModal from './components/EditPostModal';
import api from '../../api';

const MainFeed = () => {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [user, setUser] = useState(null);
  const [nextWorkout, setNextWorkout] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const handleProgramSelect = async (program) => {
    try {
      const response = await api.get(`/workouts/programs/${program.id}/`);
      setSelectedProgram(response.data);
      // Change view to program detail
      window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
    } catch (err) {
      console.error('Error navigating to program:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel for better performance
        const [
          userResponse, 
          postsResponse, 
          statsResponse
        ] = await Promise.all([
          api.get('/users/me/'),
          api.get('/posts/feed/'),
          api.get('/workouts/logs/stats/')
        ]);
        
        setUser(userResponse.data);
        setPosts(postsResponse.data);
        setStats(statsResponse.data);
  
        // Fixed: Get the correct program ID
        const currentProgramId = userResponse.data.current_program?.id || userResponse.data.current_program;
        
        if (currentProgramId) {
          const programResponse = await api.get(
            `/workouts/programs/${currentProgramId}/`
          );
          if (programResponse.data.workouts?.length > 0) {
            setNextWorkout(programResponse.data.workouts[0]);
          }
        }
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
      
      // Update the posts state to include the new comment
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

  // In MainFeed.jsx
const handleSharePost = async (postId, newSharedPostOrContent) => {
  try {
    let response;
    
    // Check if we received a full post object or just content text
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
        content: content  // Pass only the text content
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <WelcomeHeader username={user?.username} />
          <div className="space-y-6">
            <CreatePost onPostCreated={handlePostCreated} />
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
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-8">
            <NextWorkout workout={nextWorkout} />
            <ProgressCard stats={stats} />
          </div>
        </div>
      </div>
      
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