import React, { useState, useEffect } from 'react';
import WelcomeHeader from './components/WelcomeHeader';
import CreatePost from './components/CreatePost';
import ProgressCard from './components/ProgressCard';
import NextWorkout from './components/NextWorkout';
import RecentWorkouts from './components/RecentWorkouts';
import FeedContainer from './components/FeedContainer';
import EditPostModal from './components/EditPostModal';
import SharePostModal from './components/SharePostModal';
import api from '../../api';

const MainFeed = () => {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [user, setUser] = useState(null);
  const [nextWorkout, setNextWorkout] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingPost, setSharingPost] = useState(null);

  const [view, setView] = useState('feed'); // Add this state
  const [selectedProgram, setSelectedProgram] = useState(null); // Add this state

  const handleProgramSelect = async (program) => {
    try {
      // Get fresh program data
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
          statsResponse, 
          workoutLogsResponse
        ] = await Promise.all([
          api.get('/users/me/'),
          api.get('/posts/feed/'),
          api.get('/workouts/logs/stats/'),
          api.get('/workouts/logs/', {
            params: {
              limit: 5,
              sort: '-date'
            }
          })
        ]);
        
        setUser(userResponse.data);
        setPosts(postsResponse.data);
        setStats(statsResponse.data);
        setRecentWorkouts(workoutLogsResponse.data);
  
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
  
  const handleShareClick = (post) => {
    setSharingPost(post);
    setIsShareModalOpen(true);
  };
  
  const handleShare = async (postId, content) => {
    try {
      const response = await api.post(`/posts/${postId}/share/`, {
        content: content || undefined
      });
      setPosts([response.data, ...posts]);
      setIsShareModalOpen(false);
      setSharingPost(null);
    } catch (error) {
      console.error('Error sharing post:', error);
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
              onShare={handleShareClick}
              onEdit={handleEditClick}
              onDelete={handleDeletePost}
              onProgramSelect={handleProgramSelect}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-8">
            <ProgressCard stats={stats} />
            <NextWorkout workout={nextWorkout} />
            {/* Update RecentWorkouts to include the handler */}
            <RecentWorkouts 
              workouts={recentWorkouts} 
              onProgramSelect={handleProgramSelect}
            />
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
      
      {sharingPost && (
        <SharePostModal
          post={sharingPost}
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSharingPost(null);
          }}
          onShare={handleShare}
        />
      )}
    </div>
  );
};

export default MainFeed;