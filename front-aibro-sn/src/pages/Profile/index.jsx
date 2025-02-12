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

const EditProfileModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    gym: user?.preferred_gym || '',
    training_level: user?.training_level || 'beginner',
    personality_type: user?.personality_type || 'casual'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
        
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }}>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 h-24"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Gym</label>
            <input
              type="text"
              value={formData.gym}
              onChange={(e) => setFormData({...formData, gym: e.target.value})}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Training Level</label>
            <select
              value={formData.training_level}
              onChange={(e) => setFormData({...formData, training_level: e.target.value})}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Personality Type</label>
            <select
              value={formData.personality_type}
              onChange={(e) => setFormData({...formData, personality_type: e.target.value})}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            >
              <option value="casual">Casual</option>
              <option value="lone_wolf">Lone Wolf</option>
              <option value="extrovert_bro">Extrovert Bro</option>
              <option value="competitor">Competitor</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-2 mt-6 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

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


  const handleSaveProfile = async (formData) => {
    try {
      const response = await api.put('/users/me/', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

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
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default ProfilePage;