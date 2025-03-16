import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import OverviewTab from './tabs/OverviewTab';
import StatsTab from './tabs/StatsTab';
import ActivityTab from './tabs/ActivityTab';
import WorkoutsTab from './tabs/WorkoutsTab';

// Import React Query hooks
import {
  useUser,
  useUserFriends,
  useUserPosts,
  useProgramPreviewDetails,
  useUserProfilePreview,
  useGymDisplay
} from '../../../hooks/query';

const ProfilePreviewModal = ({ isOpen, onClose, userId, initialUserData = null }) => {

  const [activeTab, setActiveTab] = useState('overview');
  const isClosingChildModal = useRef(false);
  
  const { 
    data: userData, 
    isLoading: userLoading 
  } = useUser(userId, {
    enabled: isOpen && !!userId,
    initialData: initialUserData?.id === userId ? initialUserData : undefined
  });

  const { 
    data: friends = [], 
    isLoading: friendsLoading 
  } = useUserFriends(userId, {
    enabled: isOpen && !!userId && activeTab === 'overview'
  });
  
  const { 
    data: posts = [], 
    isLoading: postsLoading 
  } = useUserPosts(userId, {
    enabled: isOpen && !!userId && (activeTab === 'activity' || activeTab === 'stats')
  });
  
  const {
    data: profilePreview,
    isLoading: profilePreviewLoading
  } = useUserProfilePreview(userId, {
    enabled: isOpen && !!userId && activeTab === 'workouts'
  });
  
  const workoutLogs = profilePreview?.workout_logs || [];
  
  const {
    data: fullProgramData,
    isLoading: programLoading
  } = useProgramPreviewDetails(userData?.current_program?.id, {
    enabled: isOpen && !!userData?.current_program?.id
  });

  // Use the new hook for gym display
  // Note: This component seems to already have gym details in userData.preferred_gym_details
  // So we can add this as a fallback in case the data isn't preloaded
  const { displayText: gymDisplayText } = useGymDisplay(
    userData?.id,
    userData?.preferred_gym
  );

  const loading = 
    userLoading || 
    (activeTab === 'overview' && friendsLoading) ||
    (activeTab === 'activity' && postsLoading) || 
    (activeTab === 'workouts' && profilePreviewLoading) ||
    (activeTab === 'stats' && postsLoading);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  const handleWorkoutLogSelect = (log) => {
    setSelectedWorkoutLog(log);
  };

  const handleCloseProgram = () => {
    isClosingChildModal.current = true;
    setSelectedProgram(null);
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Modified to prefer pre-loaded gym details when available
  const getGymDisplay = (user) => {
    // If preloaded gym details are available, use them
    if (user?.preferred_gym_details && user?.preferred_gym_details?.name) {
      const gym = user.preferred_gym_details;
      return `${gym.name} - ${gym.location}`;
    }
    
    // Otherwise fall back to our hook's result
    return gymDisplayText;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl w-full max-w-3xl shadow-2xl border border-gray-800/40 relative my-4 max-h-[90vh] flex flex-col"
      >
        {/* Close button in top right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700 transition-all z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading profile...</p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="mx-auto sm:mx-0">
                  <div className="p-1 bg-gradient-to-br from-blue-700/20 to-purple-700/20 rounded-full shadow-lg">
                    <img
                      src={getAvatarUrl(userData?.avatar)}
                      alt="Profile"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                    />
                  </div>
                </div>

                <div className="text-center sm:text-left sm:flex-1">
                  <h1 className="text-2xl font-bold text-white">{userData?.username}</h1>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center mt-2 gap-2">
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-400">
                      <span className="truncate">{getGymDisplay(userData)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400">
                      {formatText(userData?.training_level) || 'Beginner'}
                    </span>
                    {userData?.personality_type && (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400">
                        {formatText(userData?.personality_type)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {userData?.bio && (
                <div className="mt-5 text-gray-300 text-sm max-w-3xl">
                  {userData.bio}
                </div>
              )}
              
              <div className="border-b border-gray-800/40 mt-6">
                <div className="flex overflow-x-auto hide-scrollbar">
                  <TabButton 
                    label="Overview" 
                    active={activeTab === 'overview'} 
                    onClick={() => handleTabChange('overview')} 
                  />
                  <TabButton 
                    label="Workouts" 
                    active={activeTab === 'workouts'} 
                    onClick={() => handleTabChange('workouts')} 
                  />
                  <TabButton 
                    label="Stats" 
                    active={activeTab === 'stats'} 
                    onClick={() => handleTabChange('stats')} 
                  />
                  <TabButton 
                    label="Activity" 
                    active={activeTab === 'activity'} 
                    onClick={() => handleTabChange('activity')} 
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
              {activeTab === 'overview' && (
                <OverviewTab 
                  userData={userData}
                  friends={friends}
                  fullProgramData={fullProgramData}
                  handleProgramSelect={handleProgramSelect}
                />
              )}
              
              {activeTab === 'workouts' && (
                <WorkoutsTab
                  userData={userData}
                  workoutLogs={workoutLogs}
                  handleWorkoutLogSelect={handleWorkoutLogSelect}
                />
              )}
              
              {activeTab === 'stats' && (
                <StatsTab 
                  userData={userData}
                  workoutLogs={workoutLogs}
                  posts={posts}
                  friends={friends}
                />
              )}
              
              {activeTab === 'activity' && (
                <ActivityTab 
                  userData={userData}
                  posts={posts}
                  handleWorkoutLogSelect={handleWorkoutLogSelect}
                  handleProgramSelect={handleProgramSelect}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 relative whitespace-nowrap ${
      active ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'
    }`}
  >
    <div className="flex items-center gap-2">
      {label}
    </div>
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
    )}
  </button>
);

export default ProfilePreviewModal;