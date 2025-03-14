import React, { useState, useEffect, useRef } from 'react';
import { userService, profilePreviewService } from '../../../api/services';
import { X, MessageCircle } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import OverviewTab from './tabs/OverviewTab';
import StatsTab from './tabs/StatsTab';
import ActivityTab from './tabs/ActivityTab';

/**
 * Universal Profile Preview Modal - works for any user profile
 * Uses dedicated service methods for accessing other users' data
 */
const ProfilePreviewModal = ({ isOpen, onClose, userId, initialUserData = null }) => {
  // Core state
  const [userData, setUserData] = useState(initialUserData);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Additional data
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [fullProgramData, setFullProgramData] = useState(null);
  
  // Expanded content modals
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedWorkoutLog, setSelectedWorkoutLog] = useState(null);
  
  // Refs for controlling fetch behavior
  const isMounted = useRef(true);
  const isClosingChildModal = useRef(false);
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  const programFetchAttempted = useRef(false);

  // Reset state when modal opens or userId changes
  useEffect(() => {
    if (isOpen && userId) {
      // Reset state for new modal instance
      setFriends([]);
      setPosts([]);
      setWorkoutLogs([]);
      setFullProgramData(null);
      initialFetchDone.current = false;
      programFetchAttempted.current = false;
      
      // Set initial user data if provided
      if (initialUserData && initialUserData.id === userId) {
        setUserData(initialUserData);
      } else {
        setUserData(null);
      }
    }
  }, [isOpen, userId, initialUserData]);

  useEffect(() => {
    // Set the mounted ref to true
    isMounted.current = true;
    
    // Only fetch data if the modal is open and we have a userId
    if (isOpen && userId) {
      fetchUserData();
    }
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [isOpen, userId]);

  // Effect to fetch program data when userData is available
  useEffect(() => {
    // If we have userData with a current program and haven't already tried fetching
    if (userData?.current_program?.id && !fullProgramData && !programFetchAttempted.current && isOpen) {
      programFetchAttempted.current = true;
      fetchProgramData(userData.current_program.id);
    }
  }, [userData, fullProgramData, isOpen]);

  // Dedicated function for fetching program data
  const fetchProgramData = async (programId) => {
    try {
      console.log(`Fetching program details for ID ${programId}`);
      const programData = await profilePreviewService.getProgramDetails(programId);
      
      if (isMounted.current && programData) {
        console.log('Program data fetched successfully:', programData.name);
        setFullProgramData(programData);
      }
    } catch (error) {
      console.error('Error fetching program details:', error);
    }
  };

  // Main data fetching function
  const fetchUserData = async () => {
    // Don't fetch if we're in the process of closing a modal
    // or if a fetch is already in progress
    if (isClosingChildModal.current || fetchInProgress.current) {
      isClosingChildModal.current = false;
      return;
    }
    
    try {
      setLoading(true);
      fetchInProgress.current = true;
      
      // If we already have initialUserData and it matches userId, use it
      if (userData && userData.id === userId) {
        // We already have the user data
      } else {
        // Fetch user data
        const user = await userService.getUserById(userId);
        if (!isMounted.current) return;
        setUserData(user);
      }
      
      // Fetch additional data for the initial active tab
      if (!initialFetchDone.current) {
        await fetchTabData(activeTab);
        initialFetchDone.current = true;
      }
      
      if (isMounted.current) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user preview data:', error);
      if (isMounted.current) {
        setLoading(false);
      }
    } finally {
      fetchInProgress.current = false;
    }
  };

  // Fetch data specific to the active tab
  const fetchTabData = async (tab) => {
    if (!isMounted.current || !userId) return;
    
    try {
      // Only fetch data that's needed for the current tab
      switch(tab) {
        case 'overview':
          // Fetch friends data if not already loaded
          if (friends.length === 0) {
            try {
              // Use our service method to get friends
              const friendsData = await profilePreviewService.getUserFriends(userId);
              if (isMounted.current) {
                setFriends(Array.isArray(friendsData) ? friendsData : []);
              }
            } catch (error) {
              console.error('Error fetching friends data:', error);
            }
          }
          break;
          
        case 'activity':
          // Fetch posts if not already loaded
          if (posts.length === 0) {
            try {
              // Use our service method to get posts
              const postsData = await profilePreviewService.getUserPosts(userId);
              if (isMounted.current) {
                setPosts(Array.isArray(postsData) ? postsData : []);
              }
            } catch (error) {
              console.error('Error fetching posts data:', error);
            }
          }
          break;
          
        case 'stats':
          // Fetch workout logs if not already loaded
          if (workoutLogs.length === 0) {
            try {
              // Use the profile preview endpoint as it has filtering built in
              const profileData = await profilePreviewService.getUserProfilePreview(userId);
              if (isMounted.current && profileData && profileData.workout_logs) {
                setWorkoutLogs(profileData.workout_logs);
              }
            } catch (error) {
              console.error('Error fetching workout logs:', error);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching tab data:', error);
    }
  };

  // Handle tab change - load data for the new tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  const handleWorkoutLogSelect = (log) => {
    setSelectedWorkoutLog(log);
  };

  const handleCloseProgram = () => {
    // Set the flag to prevent refetching when closing the modal
    isClosingChildModal.current = true;
    setSelectedProgram(null);
  };

  const handleCloseWorkoutLog = () => {
    // Set the flag to prevent refetching when closing the modal
    isClosingChildModal.current = true;
    setSelectedWorkoutLog(null);
  };

  // Format text utilities
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get gym display text
  const getGymDisplay = (user) => {
    if (!user?.preferred_gym_details || !user?.preferred_gym_details?.name) {
      return 'No gym set';
    }
    const gym = user.preferred_gym_details;
    return `${gym.name} - ${gym.location}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-3xl shadow-2xl border border-gray-700/50 relative my-4 max-h-[90vh] flex flex-col"
      >
        {/* Close button in top right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700 transition-all z-10"
        >
          <X className="h-5 w-5" />
        </button>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Header - Fixed */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-6 py-5 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                {/* Avatar */}
                <div className="mx-auto sm:mx-0">
                  <div className="p-1.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-xl">
                    <img
                      src={getAvatarUrl(userData?.avatar)}
                      alt="Profile"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-gray-800"
                    />
                  </div>
                </div>
                
                {/* User Info */}
                <div className="text-center sm:text-left sm:flex-1">
                  <h1 className="text-2xl font-bold">{userData?.username}</h1>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center mt-2 gap-2">
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-400 hover:text-gray-300">
                      <span className="truncate">{getGymDisplay(userData)}</span>
                    </div>
                    
                    <div className="hidden sm:block text-gray-500">•</div>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-400 hover:text-gray-300">
                      <span>Joined {new Date(userData?.date_joined).toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:scale-105">
                      {formatText(userData?.training_level) || 'Beginner'}
                    </span>
                    {userData?.personality_type && (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 hover:scale-105">
                        {formatText(userData?.personality_type)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-center sm:justify-end gap-2 mt-3 sm:mt-0">
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>
              </div>
              
              {/* Bio (if available) */}
              {userData?.bio && (
                <div className="mt-5 text-gray-300 text-sm max-w-3xl">
                  {userData.bio}
                </div>
              )}
              
              {/* Tab Navigation */}
              <div className="border-b border-gray-700/50 mt-6">
                <div className="flex">
                  <TabButton 
                    label="Overview" 
                    active={activeTab === 'overview'} 
                    onClick={() => handleTabChange('overview')} 
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
            
            {/* Tab Content - Scrollable */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
              {activeTab === 'overview' && (
                <OverviewTab 
                  userData={userData}
                  friends={friends}
                  fullProgramData={fullProgramData}
                  handleProgramSelect={handleProgramSelect}
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

// Tab button component
const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 relative ${
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