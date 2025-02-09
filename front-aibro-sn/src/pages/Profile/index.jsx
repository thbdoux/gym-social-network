import React, { useState, useEffect } from 'react';
import { Dumbbell, Users, Calendar, Settings, Medal, Edit } from 'lucide-react';
import api from '../../api';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [userResponse, friendsResponse] = await Promise.all([
          api.get("/users/me/"),
          api.get("/users/friends/")
        ]);
        setUser(userResponse);
        setFriends(friendsResponse);
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="relative">
          <img
            src={user?.avatar || "/api/placeholder/150/150"}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-800"
          />
          <button className="absolute bottom-0 right-0 p-2 bg-gray-800 rounded-full hover:bg-gray-700">
            <Edit className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{user?.username}</h1>
              <p className="text-gray-400 mt-1">{user?.bio}</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
              Edit Profile
            </button>
          </div>
          
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span>{Array.isArray(friends) ? friends.length : 0} Friends</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-gray-400" />
              <span>{user?.training_level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-gray-400" />
              <span>{user?.personality_type?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/40 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Dumbbell className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Current Program</div>
              <div className="font-semibold mt-1">
                {user?.current_program ? "Active" : "No active program"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/40 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Gym</div>
              <div className="font-semibold mt-1">
                {user?.preferred_gym ? "Fitness Park" : "Not set"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/40 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Goals</div>
              <div className="font-semibold mt-1">{user?.fitness_goals}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Friends Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Friends</h2>
          <button className="text-blue-500 hover:text-blue-400">View All</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.isArray(friends) && friends.slice(0, 4).map((friend) => (
            <div key={friend.id} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg">
              <img
                src={friend.avatar || "/api/placeholder/40/40"}
                alt={friend.username}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-medium">{friend.username}</div>
                <div className="text-sm text-gray-400">{friend.training_level}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="p-4 bg-gray-800/40 rounded-lg hover:bg-gray-700/40 transition-colors">
          <Dumbbell className="w-6 h-6 mb-2" />
          <div className="text-sm">Start Workout</div>
        </button>
        <button className="p-4 bg-gray-800/40 rounded-lg hover:bg-gray-700/40 transition-colors">
          <Users className="w-6 h-6 mb-2" />
          <div className="text-sm">Find Gym Buddy</div>
        </button>
        <button className="p-4 bg-gray-800/40 rounded-lg hover:bg-gray-700/40 transition-colors">
          <Calendar className="w-6 h-6 mb-2" />
          <div className="text-sm">Schedule Workout</div>
        </button>
        <button className="p-4 bg-gray-800/40 rounded-lg hover:bg-gray-700/40 transition-colors">
          <Settings className="w-6 h-6 mb-2" />
          <div className="text-sm">Settings</div>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;