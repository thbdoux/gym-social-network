import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import OverviewTab from './tabs/OverviewTab';
import StatsTab from './tabs/StatsTab';
import ActivityTab from './tabs/ActivityTab';
import WorkoutsTab from './tabs/WorkoutsTab';
import { useLanguage } from '../../../context/LanguageContext';

// Import React Query hooks
import {
  useUser,
  useUserFriends,
  useUserPosts,
  useProgramPreviewDetails,
  useUserProfilePreview,
  useGymDisplay
} from '../../../hooks/query';
import { useQueryClient } from '@tanstack/react-query';

const ProfilePreviewModal = ({ isOpen, onClose, userId, initialUserData = null }) => {
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [programLoadError, setProgramLoadError] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedWorkoutLog, setSelectedWorkoutLog] = useState(null);
  const isClosingChildModal = useRef(false);
  
  // Get query client for manual operations
  const queryClient = useQueryClient();
  
  const { 
    data: userData, 
    isLoading: userLoading,
    refetch: refetchUser
  } = useUser(userId, {
    enabled: isOpen && !!userId,
    initialData: initialUserData?.id === userId ? initialUserData : undefined,
    // Always refetch when viewing a profile
    refetchOnMount: true,
    // Set staleTime to 0 to always fetch fresh data
    staleTime: 0
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
    isLoading: programLoading,
    error: programError,
    refetch: refetchProgram
  } = useProgramPreviewDetails(userData?.current_program?.id, {
    enabled: isOpen && !!userData?.current_program?.id,

    refetchOnMount: true,

    onError: (error) => {
      console.error('Error loading program data:', error);
      setProgramLoadError(true);
      if (error.response?.status === 404) {
        handleProgramNotFound();
      }
    }
  });

  useEffect(() => {
    if (isOpen && userData?.current_program?.id) {
      refetchProgram();
    }
  }, [isOpen, userData?.current_program?.id, refetchProgram]);

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

  const handleProgramNotFound = useCallback(async () => {
    try {
      if (!userData || !userData.id) return;
      
      console.log('Program not found, attempting to reset user current program');
      
      // Call an API endpoint to reset the current program for this user
      const response = await fetch(`/api/users/${userData.id}/reset-current-program/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        console.log('Successfully reset user current program');
        // Invalidate relevant cached data
        queryClient.invalidateQueries(['users', 'detail', userData.id]);
        
        // If this is the current user, also invalidate current user data
        const currentUser = queryClient.getQueryData(['users', 'current']);
        if (currentUser && currentUser.id === userData.id) {
          queryClient.invalidateQueries(['users', 'current']);
        }
        
        // Refetch user data
        refetchUser();
      } else {
        console.error('Failed to reset user current program:', await response.text());
      }
    } catch (error) {
      console.error('Error resetting user current program:', error);
    }
  }, [userData, queryClient, refetchUser]);

  // Effect to handle program errors and trigger fixes
  useEffect(() => {
    if (programError && userData?.current_program?.id) {
      // Set the error flag
      setProgramLoadError(true);
      
      // If it's a 404 error, handle program not found
      if (programError.response?.status === 404) {
        handleProgramNotFound();
      }
    } else {
      // Reset error flag when there's no error
      setProgramLoadError(false);
    }
  }, [programError, userData?.current_program?.id, handleProgramNotFound]);

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
          aria-label={t('close')}
        >
          <X className="h-5 w-5" />
        </button>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">{t('loading_profile')}...</p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="mx-auto sm:mx-0">
                  <div className="p-1 bg-gradient-to-br from-blue-700/20 to-purple-700/20 rounded-full shadow-lg">
                    <img
                      src={getAvatarUrl(userData?.avatar)}
                      alt={t('profile')}
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
                      {formatText(userData?.training_level) || t('beginner')}
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
              
              {/* Program Load Error Banner */}
              {programLoadError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{t('program_load_error')}</span>
                  </div>
                </div>
              )}
              
              <div className="border-b border-gray-800/40 mt-6">
                <div className="flex overflow-x-auto hide-scrollbar">
                  <TabButton 
                    label={t('overview')} 
                    active={activeTab === 'overview'} 
                    onClick={() => handleTabChange('overview')} 
                  />
                  <TabButton 
                    label={t('workouts')} 
                    active={activeTab === 'workouts'} 
                    onClick={() => handleTabChange('workouts')} 
                  />
                  <TabButton 
                    label={t('statistics')} 
                    active={activeTab === 'stats'} 
                    onClick={() => handleTabChange('stats')} 
                  />
                  <TabButton 
                    label={t('activity')} 
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