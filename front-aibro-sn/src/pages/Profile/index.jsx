import React, { useState, useEffect } from 'react';
import { 
  User, Edit, Calendar, MapPin, Dumbbell, Heart, Trophy, 
  Activity, Users, TrendingUp, ChevronDown, ChevronUp,
  ArrowRight, Loader2, MessageCircle
} from 'lucide-react';

// Import services directly
import { 
  userService, 
  logService, 
  postService, 
  programService,
  gymService 
} from '../../api/services';

// Import components
import { ProgramCard } from '../Workouts/components/ProgramCard';
import EditProfileModal from './components/EditProfileModal';
import ExpandableProgramModal from '../Workouts/components/ExpandableProgramModal';
import ExpandableWorkoutModal from '../Workouts/components/ExpandableWorkoutModal';
import ExpandableWorkoutLogModal from '../Workouts/components/ExpandableWorkoutLogModal';
import EditPostModal from '../MainFeed/components/EditPostModal';
import FriendsModal from './components/FriendsModal';
import { getAvatarUrl } from '../../utils/imageUtils';
import ProfileHeader from './components/ProfileHeader';
import ProfilePreviewModal from './components/ProfilePreviewModal';
import WorkoutTimeline from '../Workouts/components/WorkoutTimeline';
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
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('stats');
  const [fullProgramData, setFullProgramData] = useState(null);
  const [nextWorkout, setNextWorkout] = useState(null);
  const [selectedFriendPreview, setSelectedFriendPreview] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Program modal
  const [selectedProgram, setSelectedProgram] = useState(null);
  
  // Separate state for workout and log modals
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showWorkoutLogModal, setShowWorkoutLogModal] = useState(false);
  
  // Post edit modal
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

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
        {/* Hero Section with Profile Overview */}
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
        {/* Workout Timeline Section - Using the unified component with full program data */}
        <div className="mt-8">
          <WorkoutTimeline 
            logs={workoutLogs.slice(0, 3)}
            nextWorkout={nextWorkout}
            logsLoading={loading}
            plansLoading={loading}
            activeProgram={fullProgramData || user?.current_program}
            setSelectedWorkout={handleViewWorkoutLog} // For past logs - use ExpandableWorkoutLogModal
            setShowWorkoutModal={setShowWorkoutLogModal} // For past logs - show log modal
            setSelectedLog={setSelectedLog}
            setShowLogForm={() => {}}
            handleViewNextWorkout={handleViewNextWorkout} // For next workout - use ExpandableWorkoutModal
          />
        </div>
        
        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Current Program & Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Program Card */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl overflow-hidden shadow-lg">
              <div className="p-5">
                <h2 className="text-xl font-bold flex items-center gap-2 group">
                  <Dumbbell className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:rotate-12" />
                  <span className="group-hover:text-purple-300 transition-colors duration-300">Current Program</span>
                </h2>
                
                <div className="mt-4">
                  {(fullProgramData || user?.current_program) ? (
                    <ProgramCard
                      program={fullProgramData || user.current_program}
                      singleColumn={true}
                      currentUser={user?.username}
                      onProgramSelect={handleProgramSelect}
                    />
                  ) : (
                    <div className="text-center py-8 bg-gray-800/30 rounded-xl">
                      <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-600 opacity-70" />
                      <p className="text-gray-400">No active program</p>
                      <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-all duration-300 transform hover:scale-105">
                        Choose a Program
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Friends Preview - Now placed above stats */}
            <FriendsPreview 
              friends={friends} 
              onViewAllClick={() => setIsFriendsModalOpen(true)} 
              onFriendClick={handleViewFriendProfile}
            />
            
            {/* Stats Card - Now below friends */}
            <StatsCard user={user} workoutLogs={workoutLogs} friends={friends} posts={posts} />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Recent Posts (replacing Activity Timeline) */}
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
      
      {selectedProgram && (
        <ExpandableProgramModal 
          programId={selectedProgram.id}
          initialProgramData={selectedProgram}
          isOpen={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          currentUser={user}
          onProgramSelect={(program) => {
            window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
          }}
        />
      )}
      
      {/* Use ExpandableWorkoutModal for upcoming workouts */}
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
      
      {/* Use ExpandableWorkoutLogModal for past workout logs */}
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
            // Handle edit workflow if needed
            setShowWorkoutLogModal(false);
          }}
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
      
      {/* Universal Profile Preview Modal - replaces the previous UserProfilePreviewModal */}
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