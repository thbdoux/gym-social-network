import React, { useState, useEffect } from 'react';
import { Users, LineChart } from 'lucide-react';
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

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // When fetching user data, the backend should include preferred_gym_details
        const [userResponse, friendsResponse, logsResponse, postsResponse] = await Promise.all([
          api.get('/users/me/'),
          api.get('/users/friends/'),
          api.get('/workouts/logs/'),
          api.get('/posts/')
        ]);
        
        // If preferred_gym_details isn't included in user data, fetch it separately
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ProfileHeader 
        user={user}
        workoutCount={workoutLogs.length}
        friendCount={friends.length}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ProgressCharts />
          <RecentPosts posts={posts} username={user?.username}/>
        </div>

        <EnhancedFriendsList currentUser={user} />
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