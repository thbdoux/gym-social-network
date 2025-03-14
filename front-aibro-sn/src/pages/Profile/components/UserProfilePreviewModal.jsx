// Update for UserProfilePreviewModal.jsx to fix the infinite loop
// Add a check to prevent re-fetching when closing the modal

import React, { useState, useEffect, useRef } from 'react';
import { userService, programService } from '../../../api/services';
import ProfilePreviewHeader from './ProfilePreviewHeader';
import ProfilePreviewTabs from './ProfilePreviewTabs';
import ExpandableProgramModal from '../../Workouts/components/ExpandableProgramModal';
import ExpandableWorkoutLogModal from '../../Workouts/components/ExpandableWorkoutLogModal';

const UserProfilePreviewModal = ({ isOpen, onClose, userId, username }) => {
  const [userData, setUserData] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [fullProgramData, setFullProgramData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Program and workout log modals
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedWorkoutLog, setSelectedWorkoutLog] = useState(null);
  
  // Add a ref to track if the component is mounted
  const isMounted = useRef(true);
  
  // Add a ref to prevent refetching when closing modals
  const isClosingModal = useRef(false);

  useEffect(() => {
    // Set the mounted ref to true
    isMounted.current = true;
    
    // Only fetch data if the modal is open
    if (isOpen && userId) {
      fetchUserData();
    }
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    // Don't fetch if we're in the process of closing a modal
    if (isClosingModal.current) {
      isClosingModal.current = false;
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch user data
      const user = await userService.getUserById(userId);
      
      if (!isMounted.current) return;
      
      // Fetch additional data if needed
      let userFriends = [];
      let userPosts = [];
      let userWorkoutLogs = [];
      
      try {
        // These could be implemented later to fetch user-specific data
        // For now, we'll just use empty arrays or mock data
      } catch (error) {
        console.error('Error fetching additional user data:', error);
      }
      
      // If user has a current program, fetch the full program data
      if (user && user.current_program && user.current_program.id) {
        try {
          const programData = await programService.getProgramById(user.current_program.id);
          if (isMounted.current) {
            setFullProgramData(programData);
          }
        } catch (error) {
          console.error('Error fetching program data:', error);
        }
      }
      
      if (isMounted.current) {
        setUserData(user);
        setFriends(userFriends);
        setPosts(userPosts);
        setWorkoutLogs(userWorkoutLogs);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user preview data:', error);
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  const handleWorkoutLogSelect = (log) => {
    setSelectedWorkoutLog(log);
  };

  const handleCloseProgram = () => {
    // Set the flag to prevent refetching when closing the modal
    isClosingModal.current = true;
    setSelectedProgram(null);
  };

  const handleCloseWorkoutLog = () => {
    // Set the flag to prevent refetching when closing the modal
    isClosingModal.current = true;
    setSelectedWorkoutLog(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-700/50 relative">
        {/* Close button in top right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700 transition-all z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <ProfilePreviewHeader userData={userData} />
            
            {/* Tabs and Content */}
            <ProfilePreviewTabs 
              userData={userData}
              workoutLogs={workoutLogs}
              posts={posts}
              friends={friends}
              fullProgramData={fullProgramData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              handleProgramSelect={handleProgramSelect}
              handleWorkoutLogSelect={handleWorkoutLogSelect}
            />
          </>
        )}
      </div>
      
      {/* Program Modal */}
      {selectedProgram && (
        <ExpandableProgramModal 
          programId={selectedProgram.id}
          initialProgramData={selectedProgram}
          isOpen={!!selectedProgram}
          onClose={handleCloseProgram}
          currentUser={userData}
        />
      )}
      
      {/* Workout Log Modal */}
      {selectedWorkoutLog && (
        <ExpandableWorkoutLogModal
          logId={selectedWorkoutLog.id}
          initialLogData={selectedWorkoutLog}
          isOpen={!!selectedWorkoutLog}
          onClose={handleCloseWorkoutLog}
        />
      )}
    </div>
  );
};

export default UserProfilePreviewModal;