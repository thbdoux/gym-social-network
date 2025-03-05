import React, { useState, useEffect } from 'react';
import api from '../../api';

// Import the updated ProfileHeader
import ProfileHeader from './components/ProfileHeader';
import ProgressCharts from './components/ProgressCharts';
import RecentPosts from './components/RecentPosts';
import EditProfileModal from './components/EditProfileModal';
import ExpandableProgramModal from '../MainFeed/components/ExpandableProgramModal';
import ExpandableWorkoutLogModal from '../MainFeed/components/ExpandableWorkoutLogModal';
import EditPostModal from '../MainFeed/components/EditPostModal';
// Import UserProfilePreviewModal - we don't need to import here as it's used in ProfileHeader

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedWorkoutLog, setSelectedWorkoutLog] = useState(null);
  
  // Add state for edit post modal
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [userResponse, friendsResponse, logsResponse, postsResponse] = await Promise.all([
          api.get('/users/me/'),
          api.get('/users/friends/'),
          api.get('/workouts/logs/'),
          api.get('/posts/')
        ]);
        
        let userData = userResponse.data;
        
        // Filter posts by the current user's username
        const userPosts = postsResponse.data.results.filter(
          post => post.user_username === userData.username
        );
        
        // Add posts to user data for accurate post count
        userData = {
          ...userData,
          posts: userPosts
        };
        
        if (userData.preferred_gym && !userData.preferred_gym_details) {
          try {
            const gymResponse = await api.get(`/gyms/${userData.preferred_gym}/`);
            userData = {
              ...userData,
              preferred_gym_details: gymResponse.data
            };
          } catch (error) {
            console.error('Error fetching gym details:', error);
          }
        }
        
        setUser(userData);
        setFriends(friendsResponse.data || []);
        setWorkoutLogs(logsResponse.data.results || []);
        setPosts(postsResponse.data.results || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Handler for program selection
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  // Handler for workout log selection
  const handleWorkoutLogSelect = (workoutLog) => {
    setSelectedWorkoutLog(workoutLog);
  };

  // Handler to close program modal
  const handleCloseProgramModal = () => {
    setSelectedProgram(null);
  };

  // Handler to close workout log modal
  const handleCloseWorkoutLogModal = () => {
    setSelectedWorkoutLog(null);
  };

  // Handler to open edit post modal
  const handleEditPost = (post) => {
    setPostToEdit(post);
    setIsEditPostModalOpen(true);
  };

  // Handler to save edited post
  const handleSaveEditedPost = async (editedPost) => {
    try {
      const response = await api.put(`/posts/${editedPost.id}/`, editedPost);
      
      // Update the post in state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === editedPost.id ? response.data : post
        )
      );
      
      setIsEditPostModalOpen(false);
      setPostToEdit(null);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };
  
  // Ensure we're using the updated EditPostModal component
  useEffect(() => {
    if (postToEdit) {
      setIsEditPostModalOpen(true);
    }
  }, [postToEdit]);

  // Handler to delete post
  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}/`);
      
      // Remove the deleted post from state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-32 w-32 bg-gray-700 rounded-full"></div>
          <div className="h-8 w-64 bg-gray-700 rounded-lg"></div>
          <div className="h-4 w-48 bg-gray-700 rounded-lg"></div>
          <div className="h-64 w-full max-w-2xl bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Calculate the number of user posts
  const userPosts = posts.filter(post => post.user_username === user?.username);
  console.log("USER : ", user)
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ProfileHeader 
        user={user}
        workoutCount={workoutLogs.length}
        friendCount={friends.length}
        onEditClick={() => setIsEditModalOpen(true)}
        friends={friends.slice(0, 3)}
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <ProgressCharts workoutData={workoutLogs} />
        </div>
        
        <div className="lg:col-span-3">
          <RecentPosts 
            posts={userPosts} 
            username={user?.username}
            onProgramSelect={handleProgramSelect}
            onWorkoutLogSelect={handleWorkoutLogSelect}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
          />
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        setUser={setUser}
      />

      {/* Edit Post Modal */}
      {isEditPostModalOpen && postToEdit && (
        <EditPostModal
          isOpen={isEditPostModalOpen}
          onClose={() => {
            setIsEditPostModalOpen(false);
            setPostToEdit(null);
          }}
          post={postToEdit}
          onSave={handleSaveEditedPost}
        />
      )}

      {/* Program Modal */}
      {selectedProgram && (
        <ExpandableProgramModal 
          programId={selectedProgram.id}
          initialProgramData={selectedProgram}
          isOpen={!!selectedProgram}
          onClose={handleCloseProgramModal}
          onProgramSelect={(program) => {
            window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
          }}
        />
      )}
      
      {/* Workout Log Modal */}
      {selectedWorkoutLog && (
        <ExpandableWorkoutLogModal
          workoutLogId={selectedWorkoutLog.id}
          initialWorkoutData={selectedWorkoutLog}
          isOpen={!!selectedWorkoutLog}
          onClose={handleCloseWorkoutLogModal}
        />
      )}
    </div>
  );
};

export default ProfilePage;