import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  LineChart,
  ChevronRight,
  ChevronLeft,
  Edit,
  Check,
  Save
} from 'lucide-react';
import api from '../../api';

import ProfileHeader from './components/ProfileHeader';
import FriendsList from './components/FriendsList';
import ProgressCharts from './components/ProgressCharts';
import RecentPosts from './components/RecentPosts';
import WorkoutLog from './components/WorkoutLog';
import EditProfileModal from './components/EditProfileModal';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [recommendedFriends, setRecommendedFriends] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [userResponse, friendsResponse, logsResponse, postsResponse] = await Promise.all([
          api.get('/users/me/'),
          api.get('/users/friends/'),
          api.get('/workouts/logs/'),
          api.get('/posts/')
        ]);
        
        // Ensure we're handling the data property correctly
        setUser(userResponse.data);
        setFriends(Array.isArray(friendsResponse.data.results) ? friendsResponse.data.results : []);
        setWorkoutLogs(Array.isArray(logsResponse.data.results) ? logsResponse.data.results : []);
        setPosts(Array.isArray(postsResponse.data.results) ? postsResponse.data.results : []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ProfileHeader 
        user={user}
        workoutCount={workoutLogs.length}
        friendCount={Array.isArray(friends) ? friends.length : 0}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <WorkoutLog logs={workoutLogs} />
          <ProgressCharts />
          <RecentPosts posts={posts} username={user?.username}/>
        </div>

        <FriendsList 
          friends={friends}
          recommendedFriends={recommendedFriends}
        />
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        setUser={setUser}
      />
    </div>
  );
};

export default ProfilePage;