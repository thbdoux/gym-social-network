import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { userService, postService, gymService, logService, programService } from '../../../api/services';
import ProfileHeader from './ProfilePreviewHeader';
import ProfileTabs from './ProfilePreviewTabs';
import ExpandableProgramModal from '../../Workouts/components/ExpandableProgramModal';
import ExpandableWorkoutModal from '../../Workouts/components/ExpandableWorkoutModal';
import ExpandableWorkoutLogModal from '../../Workouts/components/ExpandableWorkoutLogModal';
import WorkoutTimeline from '../../Workouts/components/WorkoutTimeline';

const UserProfilePreviewModal = ({ isOpen, onClose, userId, username }) => {
  const [userData, setUserData] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [fullProgramData, setFullProgramData] = useState(null);
  const [nextWorkout, setNextWorkout] = useState(null);
  
  // Modals state
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showWorkoutLogModal, setShowWorkoutLogModal] = useState(false);

  useEffect(() => {
    if (isOpen && (userId || username)) {
      fetchUserProfile();
    }
  }, [isOpen, userId, username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine how to fetch the user
      let userData;
      try {
        if (userId) {
          userData = await userService.getUserById(userId);
        } else if (username) {
          const allUsers = await userService.getAllUsers();
          userData = allUsers.find(user => user.username === username);
          
          if (!userData) {
            throw new Error('User not found');
          }
        } else {
          throw new Error('No user identifier provided');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
      
      // Fetch posts, logs, and friends in parallel
      const [postsData, friendsData, logsData] = await Promise.all([
        postService.getPosts(),
        userService.getFriends(),
        logService.getLogs()
      ]);

      // Filter data for this user
      const userPosts = Array.isArray(postsData) 
        ? postsData.filter(post => post.user_username === userData.username)
        : [];
      
      const userLogs = Array.isArray(logsData)
        ? logsData.filter(log => log.user_username === userData.username)
        : [];
      
      const userFriends = Array.isArray(friendsData)
        ? friendsData.filter(friend => friend.user_username === userData.username || true)
        : [];
      
      // Fetch gym details if necessary
      if (userData.preferred_gym && !userData.preferred_gym_details) {
        try {
          const gymData = await gymService.getGymById(userData.preferred_gym);
          userData = {
            ...userData,
            preferred_gym_details: gymData
          };
        } catch (error) {
          console.error('Error fetching gym details:', error);
        }
      }

      // Fetch program details if the user has a current program
      if (userData.current_program && userData.current_program.id) {
        try {
          const programData = await programService.getProgramById(userData.current_program.id);
          setFullProgramData(programData);
          
          if (programData) {
            const nextWorkoutData = programService.getNextWorkout(programData);
            setNextWorkout(nextWorkoutData);
          }
        } catch (error) {
          console.error('Error fetching program details:', error);
        }
      }

      // Add metadata to user data
      userData = {
        ...userData,
        posts: userPosts,
        workout_count: userLogs.length,
        friend_count: userFriends.length
      };
      
      setUserData(userData);
      setPosts(userPosts);
      setWorkoutLogs(userLogs);
      setFriends(userFriends);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
      setLoading(false);
    }
  };

  // Handler functions
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  const handleViewNextWorkout = () => {
    if (nextWorkout) {
      setSelectedWorkout(nextWorkout);
      setShowWorkoutModal(true);
    }
  };

  const handleWorkoutLogSelect = (log) => {
    setSelectedLog(log);
    setShowWorkoutLogModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto backdrop-blur-sm p-4">
      <div 
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border border-gray-700 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-800/70 border-b border-gray-700 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            {loading ? 'Loading Profile...' : `${userData?.username}'s Profile`}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-28 w-28 bg-gray-700 rounded-full"></div>
              <div className="h-6 w-48 bg-gray-700 rounded-lg"></div>
              <div className="h-4 w-64 bg-gray-700 rounded-lg"></div>
              <div className="h-32 w-full max-w-md bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-red-400">
              <div className="text-lg font-medium mb-2">{error}</div>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors mt-4"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* User Profile Content */}
        {!loading && !error && userData && (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Profile Header */}
              <ProfileHeader userData={userData} />
              
              {/* Workout Timeline Section */}
              <div className="mt-5 mx-4">
                <WorkoutTimeline 
                  logs={workoutLogs.slice(0, 3)}
                  nextWorkout={nextWorkout}
                  logsLoading={false}
                  plansLoading={false}
                  activeProgram={fullProgramData || userData?.current_program}
                  setSelectedWorkout={handleWorkoutLogSelect}
                  setShowWorkoutModal={setShowWorkoutLogModal}
                  setSelectedLog={setSelectedLog}
                  setShowLogForm={() => {}}
                  handleViewNextWorkout={handleViewNextWorkout}
                />
              </div>
              
              {/* Tabs Content */}
              <ProfileTabs 
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
            </div>
            
            {/* Footer Actions */}
            <div className="bg-gray-800/70 border-t border-gray-700 p-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Member since {
                  userData.date_joined 
                    ? new Date(userData.date_joined).toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'long',
                      })
                    : 'N/A'
                }
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Modals */}
      {selectedProgram && (
        <ExpandableProgramModal 
          programId={selectedProgram.id}
          initialProgramData={selectedProgram}
          isOpen={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          currentUser={userData}
          onProgramSelect={(program) => {
            window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
          }}
        />
      )}
      
      {showWorkoutModal && selectedWorkout && (
        <ExpandableWorkoutModal
          workoutId={selectedWorkout.id}
          initialWorkoutData={selectedWorkout}
          isOpen={showWorkoutModal}
          onClose={() => {
            setShowWorkoutModal(false);
            setSelectedWorkout(null);
          }}
          isTemplate={false}
        />
      )}
      
      {showWorkoutLogModal && selectedLog && (
        <ExpandableWorkoutLogModal
          logId={selectedLog.id}
          initialLogData={selectedLog}
          isOpen={showWorkoutLogModal}
          onClose={() => {
            setShowWorkoutLogModal(false);
            setSelectedLog(null);
          }}
          onEdit={() => {
            setShowWorkoutLogModal(false);
          }}
        />
      )}
    </div>
  );
};

export default UserProfilePreviewModal;