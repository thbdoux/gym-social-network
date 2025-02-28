import React, { useState, useEffect } from 'react';
import { Users, LineChart, Clock, Dumbbell, Trophy, Activity, Heart, ChevronDown } from 'lucide-react';
import api from '../../api';

import ProfileHeader from './components/ProfileHeader';
import EnhancedFriendsList from './components/EnhancedFriendsList';
import ProgressCharts from './components/ProgressCharts';
import RecentPosts from './components/RecentPosts';
import EditProfileModal from './components/EditProfileModal';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMoreStats, setShowMoreStats] = useState(false);

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
        setFriends(friendsResponse.data.results || []);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <ProgressCharts />
                <RecentPosts posts={posts} username={user?.username} />
              </div>
              <div className="space-y-6">
                <StatsCard 
                  user={user} 
                  workoutLogs={workoutLogs} 
                  friends={friends} 
                  posts={posts} 
                  showMore={showMoreStats}
                  toggleShowMore={() => setShowMoreStats(!showMoreStats)}
                />
                <WorkoutSchedule workouts={workoutLogs.slice(0, 3)} />
              </div>
            </div>
          </>
        );
      case 'posts':
        return (
          <div className="space-y-6">
            <RecentPosts posts={posts.filter(post => post.user_username === user?.username)} username={user?.username} />
          </div>
        );
      case 'friends':
        return <EnhancedFriendsList currentUser={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ProfileHeader 
        user={user}
        workoutCount={workoutLogs.length}
        friendCount={friends.length}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      <div className="mb-8 border-b border-gray-700/50">
        <nav className="flex gap-2">
          <TabButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<Activity className="w-4 h-4" />}
            label="Overview"
          />
          <TabButton 
            active={activeTab === 'posts'} 
            onClick={() => setActiveTab('posts')}
            icon={<LineChart className="w-4 h-4" />}
            label="Posts"
            count={posts.filter(post => post.user_username === user?.username).length}
          />
          <TabButton 
            active={activeTab === 'friends'} 
            onClick={() => setActiveTab('friends')}
            icon={<Users className="w-4 h-4" />}
            label="Friends"
            count={friends.length}
          />
        </nav>
      </div>

      {renderTabContent()}

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        setUser={setUser}
      />
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 transition-all duration-300 relative group ${
      active 
        ? 'text-white font-medium' 
        : 'text-gray-400 hover:text-gray-200'
    }`}
  >
    <span className={`${active ? 'text-blue-400' : 'group-hover:text-blue-400 transition-colors duration-200'}`}>
      {icon}
    </span>
    {label}
    {count !== undefined && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full transition-colors duration-200 ${
        active ? 'bg-blue-500/30 text-blue-300' : 'bg-gray-700 group-hover:bg-gray-600'
      }`}>
        {count}
      </span>
    )}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>
    )}
    {!active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500/0 rounded-full transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100 group-hover:bg-blue-500/30"></div>
    )}
  </button>
);

const StatsCard = ({ user, workoutLogs, friends, posts, showMore, toggleShowMore }) => {
  const userPosts = posts.filter(post => post.user_username === user?.username);
  const totalLikes = userPosts.reduce((total, post) => total + (post.likes_count || 0), 0);
  
  // Calculate streaks and other advanced metrics
  const currentStreak = 5; // Placeholder - would calculate from workout logs
  const longestStreak = 14; // Placeholder - would calculate from workout logs
  const avgWorkoutsPerWeek = Math.round((workoutLogs.length / 12) * 10) / 10; // Rough estimate

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:from-gray-800/90 hover:to-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Stats
        </h2>
        <button 
          onClick={toggleShowMore}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showMore ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <StatItem count={workoutLogs.length} label="Workouts" className="bg-blue-900/20 hover:bg-blue-900/30" />
        <StatItem count={friends.length} label="Friends" className="bg-green-900/20 hover:bg-green-900/30" />
        <StatItem count={userPosts.length} label="Posts" className="bg-purple-900/20 hover:bg-purple-900/30" />
        <StatItem count={totalLikes} label="Total Likes" className="bg-pink-900/20 hover:bg-pink-900/30" />
      </div>
      
      {showMore && (
        <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div className="text-gray-400">Current Streak</div>
            <div className="flex items-center gap-1 text-blue-400">
              <Dumbbell className="w-4 h-4" />
              <span className="font-bold">{currentStreak} days</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-gray-400">Longest Streak</div>
            <div className="flex items-center gap-1 text-green-400">
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{longestStreak} days</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-gray-400">Avg. Workouts/Week</div>
            <div className="flex items-center gap-1 text-purple-400">
              <Activity className="w-4 h-4" />
              <span className="font-bold">{avgWorkoutsPerWeek}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-gray-400">Top Exercise</div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Heart className="w-4 h-4" />
              <span className="font-bold">Bench Press</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ count, label, className = "" }) => (
  <div className={`rounded-lg p-4 text-center transition-all duration-200 transform hover:scale-105 ${className}`}>
    <div className="text-2xl font-bold">{count}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

const WorkoutSchedule = ({ workouts }) => (
  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:from-gray-800/90 hover:to-gray-900">
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
      <Clock className="w-5 h-5 text-blue-400" />
      Upcoming Workouts
    </h2>
    {workouts.length > 0 ? (
      <div className="space-y-3">
        {workouts.map((workout, index) => (
          <div 
            key={index} 
            className="bg-gray-800/60 hover:bg-gray-800/90 rounded-lg p-3 flex items-center gap-3 transition-all duration-200 transform hover:translate-x-1"
          >
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Dumbbell className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{workout.workout_name || 'Untitled Workout'}</div>
              <div className="text-sm text-gray-400">{workout.date || 'No date set'}</div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-6 text-gray-400">
        No upcoming workouts
      </div>
    )}
    <button className="w-full mt-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg py-2 text-sm transition-colors">
      View All Workouts
    </button>
  </div>
);

export default ProfilePage;