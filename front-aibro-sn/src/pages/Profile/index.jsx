import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

import {
  useCurrentUser,
  useFriends, 
  useLogs,
  useProgram,
  useGym,
  useUserPosts,
  useUpdatePost,
  useDeletePost
} from '../../hooks/query';

import EditProfileModal from './components/EditProfileModal';
import EditPostModal from '../MainFeed/components/EditPostModal';
import FriendsModal from './components/FriendsModal';
import ProfileHeader from './components/ProfileHeader';
import ProfilePreviewModal from './components/ProfilePreviewModal';
import StatsCard from './components/StatsCard';
import FriendsPreview from './components/FriendsPreview';
import RecentPosts from './components/RecentPosts';

const ProfilePage = () => {
  const { t } = useLanguage();
  
  // Get current user data
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  
  // Query hooks that depend on user data
  const { data: friends = [] } = useFriends();
  const { data: workoutLogs = [] } = useLogs();
  const { data: posts = [] } = useUserPosts(user?.id);
  
  // State for UI elements
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('stats');
  const [selectedFriendPreview, setSelectedFriendPreview] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

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
      await updatePostMutation.mutateAsync({
        id: editedPost.id,
        updates: editedPost
      });
      setIsEditPostModalOpen(false);
      setPostToEdit(null);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePostMutation.mutateAsync(postId);
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

  // Loading state handling - combining all relevant loading states
  const isLoading = isUserLoading;

  if (isLoading) {
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
          // No need to pass setUser as React Query will handle updates
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