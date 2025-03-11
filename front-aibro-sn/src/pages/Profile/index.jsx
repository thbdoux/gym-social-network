import React, { useState, useEffect } from 'react';
import { 
  User, Edit, Calendar, MapPin, Dumbbell, Heart, Trophy, 
  Activity, Users, TrendingUp, ChevronDown, ChevronUp,
  ArrowRight, Loader2, MessageCircle
} from 'lucide-react';
import api from '../../api';

// Import components
import { ProgramCard } from '../Workouts/components/ProgramCard';
import EditProfileModal from './components/EditProfileModal';
import ExpandableProgramModal from '../Workouts/components/ExpandableProgramModal';
import ExpandableWorkoutModal from '../Workouts/components/ExpandableWorkoutModal';
import EditPostModal from '../MainFeed/components/EditPostModal';
import FriendsModal from './components/FriendsModal';
import { getAvatarUrl } from '../../utils/imageUtils';
import ProfileHeader from './components/ProfileHeader';
import WorkoutTimeline from '../Workouts/components/WorkoutTimeline'; // Import the unified component
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
  
  // Program/Workout modals
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  
  // Post edit modal
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Parallel requests for better performance
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
        
        // Fetch gym details if necessary
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

  const handleWorkoutSelect = (workout) => {
    setSelectedWorkout(workout);
  };

  const handleEditPost = (post) => {
    setPostToEdit(post);
    setIsEditPostModalOpen(true);
  };

  const handleSaveEditedPost = async (editedPost) => {
    try {
      const response = await api.put(`/posts/${editedPost.id}/`, editedPost);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === editedPost.id ? response.data : post
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
      await api.delete(`/posts/${postId}/`);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Get next workout from user's current program if available
  const getNextWorkout = () => {
    if (!user?.current_program?.workouts) {
      return null;
    }
    
    // Get current day index (0 = Sunday, 1 = Monday, etc.)
    const today = new Date().getDay();
    
    // Find next workout based on preferred weekday
    // First try to find a workout scheduled for today or upcoming days
    const upcomingWorkouts = user.current_program.workouts
      .filter(w => w.preferred_weekday !== undefined)
      .sort((a, b) => {
        // Calculate days until workout (0-6 for same day to 6 days away)
        const daysUntilA = (a.preferred_weekday - today + 7) % 7;
        const daysUntilB = (b.preferred_weekday - today + 7) % 7;
        // Prioritize today (0) and upcoming days (1-6)
        return daysUntilA - daysUntilB;
      });
      
    // Return the next upcoming workout if found
    if (upcomingWorkouts.length > 0) {
      return upcomingWorkouts[0];
    }
    
    // If no scheduled workouts found, return the first workout from the program
    return user.current_program.workouts[0] || null;
  };

  if (loading) {
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
        
        {/* Workout Timeline Section - Using the unified component */}
        <div className="mt-8">
          <WorkoutTimeline 
            logs={workoutLogs.slice(0, 3)}
            nextWorkout={getNextWorkout()}
            logsLoading={loading}
            plansLoading={loading}
            activeProgram={user?.current_program}
            setSelectedWorkout={handleWorkoutSelect}
            setShowWorkoutModal={() => {}}
            setSelectedLog={() => {}}
            setShowLogForm={() => {}}
            handleViewNextWorkout={() => {
              if(getNextWorkout()) {
                handleWorkoutSelect(getNextWorkout());
              }
            }}
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
                  {user?.current_program ? (
                    <ProgramCard
                      program={user.current_program}
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
            
            {/* Stats Card */}
            <StatsCard user={user} workoutLogs={workoutLogs} friends={friends} posts={posts} />
            
            {/* Friends Preview */}
            <FriendsPreview 
              friends={friends} 
              onViewAllClick={() => setIsFriendsModalOpen(true)} 
            />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Recent Posts (replacing Activity Timeline) */}
            <RecentPosts 
              posts={posts}
              username={user.username}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onWorkoutLogSelect={handleWorkoutSelect}
              onProgramSelect={handleProgramSelect}
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
      
      {selectedWorkout && (
        <ExpandableWorkoutModal
          workoutId={selectedWorkout.id}
          initialWorkoutData={selectedWorkout}
          isOpen={!!selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
          isTemplate={false}
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
    </div>
  );
};

export default ProfilePage;