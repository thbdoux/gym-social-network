import React, { useState, useEffect } from 'react';

import { 
  userService, 
  logService, 
  postService, 
  programService,
  gymService 
} from '../../api/services';

import EditProfileModal from './components/EditProfileModal';
import EditPostModal from '../MainFeed/components/EditPostModal';
import FriendsModal from './components/FriendsModal';
import ProfileHeader from './components/ProfileHeader';
import ProfilePreviewModal from './components/ProfilePreviewModal';
import StatsCard from './components/StatsCard';
import FriendsPreview from './components/FriendsPreview';
import RecentPosts from './components/RecentPosts';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('stats');
  const [nextWorkout, setNextWorkout] = useState(null);
  const [selectedFriendPreview, setSelectedFriendPreview] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Post edit modal
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Sequential requests to better debug and handle errors
        let userData, friendsData, logsData, postsData;
        
        try {
          userData = await userService.getCurrentUser();
        } catch (error) {
          console.error('Error fetching user data:', error);
          userData = null;
        }
        
        try {
          friendsData = await userService.getFriends();
          // Ensure friendsData is an array
          friendsData = Array.isArray(friendsData) ? friendsData : [];
        } catch (error) {
          console.error('Error fetching friends data:', error);
          friendsData = [];
        }
        
        try {
          logsData = await logService.getLogs();
          // Ensure logsData is an array
          logsData = Array.isArray(logsData) ? logsData : [];
        } catch (error) {
          console.error('Error fetching logs data:', error);
          logsData = [];
        }
        
        try {
          postsData = await postService.getPosts();
          postsData = Array.isArray(postsData) ? postsData : 
                     (postsData && postsData.results ? postsData.results : []);
        } catch (error) {
          console.error('Error fetching posts data:', error);
          postsData = [];
        }
        
        // Filter posts by the current user's username
        const userPosts = userData && userData.username && Array.isArray(postsData) 
          ? postsData.filter(post => post.user_username === userData.username)
          : [];
        
        // Add posts to user data for accurate post count
        let enhancedUserData = userData ? {
          ...userData,
          posts: userPosts
        } : null;
        
        // Fetch gym details if necessary
        if (enhancedUserData && enhancedUserData.preferred_gym && !enhancedUserData.preferred_gym_details) {
          try {
            const gymData = await gymService.getGymById(enhancedUserData.preferred_gym);
            if (gymData) {
              enhancedUserData = {
                ...enhancedUserData,
                preferred_gym_details: gymData
              };
            }
          } catch (error) {
            console.error('Error fetching gym details:', error);
          }
        }
        
        // If user has a current program, fetch the full program data
        if (enhancedUserData && enhancedUserData.current_program && enhancedUserData.current_program.id) {
          try {
            const programData = await programService.getProgramById(enhancedUserData.current_program.id);
            setFullProgramData(programData);
            
            if (programData) {
              // Get next workout using programService
              const nextWorkoutData = programService.getNextWorkout(programData);
              setNextWorkout(nextWorkoutData);
            }
          } catch (error) {
            console.error('Error fetching full program data:', error);
          }
        }
        
        setUser(enhancedUserData);
        setFriends(friendsData);
        setWorkoutLogs(logsData);
        setPosts(userPosts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Modal handlers
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  // Handler for next workout
  const handleViewNextWorkout = () => {
    if (nextWorkout) {
      setSelectedWorkout(nextWorkout);
      setShowWorkoutModal(true);
    }
  };

  // Handler for past workout logs
  const handleViewWorkoutLog = (log) => {
    setSelectedLog(log);
    setShowWorkoutLogModal(true);
  };

  const handleEditPost = (post) => {
    setPostToEdit(post);
    setIsEditPostModalOpen(true);
  };

  const handleSaveEditedPost = async (editedPost) => {
    try {
      const updatedPost = await postService.updatePost(editedPost.id, editedPost);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === editedPost.id ? updatedPost : post
        )
      );
      setIsEditPostModalOpen(false);
      setPostToEdit(null);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleViewFriendProfile = (friend) => {
    setSelectedFriendPreview(friend);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    // Wait for animation to complete before clearing the user data
    setTimeout(() => setSelectedFriendPreview(null), 300);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-32 w-32 bg-gray-700 rounded-full"></div>
          <div className="h-8 w-64 bg-gray-700 rounded-lg"></div>
          <div className="h-4 w-48 bg-gray-700 rounded-lg"></div>
          <div className="h-64 w-full max-w-2xl bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileHeader 
          user={user}
          workoutCount={workoutLogs.length}
          postCount={posts.length}
          friendCount={friends.length}
          onEditClick={() => setIsEditModalOpen(true)}
          onFriendsClick={() => setIsFriendsModalOpen(true)}
          setActiveSection={setActiveSection}
          activeSection={activeSection}
        />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">

          <FriendsPreview 
            friends={friends} 
            onViewAllClick={() => setIsFriendsModalOpen(true)}
            maxDisplay={5}
            showPersonalityType={true}
          />
            
            <StatsCard user={user} workoutLogs={workoutLogs} friends={friends} posts={posts} />
          </div>

          <div className="lg:col-span-7">
            <RecentPosts 
              posts={posts}
              username={user.username}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onWorkoutLogSelect={handleViewWorkoutLog}
              onProgramSelect={handleProgramSelect}
              onUserClick={handleViewFriendProfile}
            />
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {isEditModalOpen && (
        <EditProfileModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          setUser={setUser}
        />
      )}
      
      {isFriendsModalOpen && (
        <FriendsModal
          isOpen={isFriendsModalOpen}
          onClose={() => setIsFriendsModalOpen(false)}
          currentUser={user}
          onFriendClick={handleViewFriendProfile}
        />
      )}
      
      {isEditPostModalOpen && postToEdit && (
        <EditPostModal
          post={postToEdit}
          isOpen={isEditPostModalOpen}
          onClose={() => {
            setIsEditPostModalOpen(false);
            setPostToEdit(null);
          }}
          onSave={handleSaveEditedPost}
        />
      )}
      
      <ProfilePreviewModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        userId={selectedFriendPreview?.id}
        initialUserData={selectedFriendPreview}
      />
    </div>
  );
};

export default ProfilePage;