import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, Check, X, UserCheck } from 'lucide-react';
import api from '../../../api';
import { getAvatarUrl } from '../../../utils/imageUtils';

// Friend Request Component
const FriendRequest = ({ request, onRespond }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
    <img
      src={getAvatarUrl(request.from_user.avatar)}
      alt={request.from_user.username}
      className="w-10 h-10 rounded-full object-cover"
    />
    <div className="flex-1">
      <div className="font-medium text-white">{request.from_user.username}</div>
      <div className="text-sm text-gray-400">{request.from_user.training_level}</div>
    </div>
    <div className="flex gap-2">
      <button 
        onClick={() => onRespond(request.from_user.id, 'accept')}
        className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-full transition-colors"
      >
        <Check className="w-4 h-4 text-green-400" />
      </button>
      <button 
        onClick={() => onRespond(request.from_user.id, 'reject')}
        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-red-400" />
      </button>
    </div>
  </div>
);

// Enhanced FriendsList Component
const EnhancedFriendsList = ({ currentUser }) => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendData = async () => {
    try {
      const [friendsRes, requestsRes, usersRes] = await Promise.all([
        api.get('/users/friends/'),
        api.get('/users/friend_requests/'),
        api.get('/users/')
      ]);

      const friendsList = Array.isArray(friendsRes.data) ? friendsRes.data : 
                    Array.isArray(friendsRes.data.results) ? friendsRes.data.results : [];
      const requestsList = Array.isArray(requestsRes.data) ? requestsRes.data.filter(req => req.status === 'pending') :
                          Array.isArray(requestsRes.data.results) ? requestsRes.data.results.filter(req => req.status === 'pending') : [];
      const usersList = Array.isArray(usersRes.data) ? usersRes.data :
                       Array.isArray(usersRes.data.results) ? usersRes.data.results : [];

      setFriends(friendsList);
      setRequests(requestsList);
      setAllUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching friend data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFriendData();
    }
  }, [currentUser]);

  const handleSendRequest = async (userId) => {
    try {
      await api.post(`/users/${userId}/send_friend_request/`);
      fetchFriendData();
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleRespondToRequest = async (userId, response) => {
    try {
      await api.post(`/users/${userId}/respond_to_request/`, { response });
      fetchFriendData();
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  // Get sets of user IDs for each category
  const getUserSets = () => {
    // Debug log to check the friends data structure
    console.log("Friends data:", friends);
    
    const friendIds = new Set(friends.map(friendData => {
      console.log("Processing friend:", friendData);
      return friendData.friend.id;
    }));
    
    const pendingSentIds = new Set(
      requests
        .filter(req => req.from_user.id === currentUser.id)
        .map(req => req.to_user.id)
    );
    const pendingReceivedIds = new Set(
      requests
        .filter(req => req.to_user.id === currentUser.id)
        .map(req => req.from_user.id)
    );
    
    return {
      friendIds,
      pendingSentIds,
      pendingReceivedIds
    };
  };

  // Filter out users who are already friends, have pending requests, or is the current user
  const getRecommendedUsers = () => {
    if (!currentUser?.id) return [];
    
    const { friendIds, pendingSentIds, pendingReceivedIds } = getUserSets();
    
    return allUsers.filter(user => 
      user.id !== currentUser.id && // Filter out current user
      !friendIds.has(user.id) && // Filter out friends
      !pendingSentIds.has(user.id) && // Filter out sent requests
      !pendingReceivedIds.has(user.id) // Filter out received requests
    );
  };

  if (!currentUser) {
    return (
      <div className="bg-gray-800/40 rounded-xl p-6">
        <div className="text-center text-gray-400">Loading user data...</div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Loading friend data...</div>;
  }

  const recommendedUsers = getRecommendedUsers();

  return (
    <div className="space-y-6">
      {/* Pending Requests Section */}
      {requests
        .filter(request => request.from_user.id === currentUser.id)
        .length > 0 && (
        <div className="bg-gray-800/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-white">Pending Requests</h2>
          <div className="space-y-3">
            {requests
              .filter(request => request.from_user.id === currentUser.id)
              .map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                  <img
                    src={getAvatarUrl(request.to_user.avatar)}
                    alt={request.to_user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">{request.to_user.username}</div>
                    <div className="text-sm text-gray-400">{request.to_user.training_level}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-yellow-400">Pending</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Friend Requests Section */}
      {requests.length > 0 && (
        <div className="bg-gray-800/40 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-white">Friend Requests</h2>
          <div className="space-y-3">
            {requests
              .filter(request => request.to_user.id === currentUser.id)
              .map((request) => (
                <FriendRequest
                  key={request.id}
                  request={request}
                  onRespond={handleRespondToRequest}
                />
              ))}
          </div>
        </div>
      )}

      {/* Current Friends Section */}
      <div className="bg-gray-800/40 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Friends ({friends.length})</h2>
        <div className="space-y-3">
          {friends.map((friendData) => {
            // Log the friend data to verify structure
            console.log('Friend data:', friendData);
            
            // The friend object contains the actual user data
            const friendUser = friendData.friend;
            
            return (
              <div key={friendData.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                <img
                  src={getAvatarUrl(friendData.friend.avatar)}
                  alt={friendData.friend.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium text-white">{friendData.friend.username}</div>
                  <div className="text-sm text-gray-400">{friendData.friend.training_level}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-400">{friendData.friend.personality_type?.replace('_', ' ')}</div>
                  {friendData.preferred_gym && (
                    <div className="text-sm text-gray-400">• {friendData.friend.preferred_gym}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Friends Section */}
      <div className="bg-gray-800/40 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Recommended</h2>
        <div className="space-y-3">
          {recommendedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
              <img
                src={getAvatarUrl(user.avatar)}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="font-medium text-white">{user.username}</div>
                <div className="text-sm text-gray-400">{user.training_level}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-400">{user.personality_type?.replace('_', ' ')}</div>
                {user.preferred_gym && (
                  <div className="text-sm text-gray-400">• {user.preferred_gym}</div>
                )}
                <button 
                  onClick={() => handleSendRequest(user.id)}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedFriendsList;