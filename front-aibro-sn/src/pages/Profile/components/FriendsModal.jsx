import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, UserMinus, Check, UserCheck, Search, User, Eye } from 'lucide-react';
import api from '../../../api';
import { getAvatarUrl } from '../../../utils/imageUtils';
import UserProfilePreviewModal from './UserProfilePreviewModal';

const FriendsModal = ({ isOpen, onClose, currentUser }) => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);

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
    if (isOpen && currentUser) {
      fetchFriendData();
    }
  }, [isOpen, currentUser]);

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

  const handleViewFriendProfile = (friend) => {
    setSelectedFriend(friend);
  };

  const handleCloseFriendProfile = () => {
    setSelectedFriend(null);
  };

  // Get sets of user IDs for each category
  const getUserSets = () => {
    const friendIds = new Set(friends.map(friendData => {
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

  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Filter based on search query
  const filteredFriends = friends.filter(friendData => 
    friendData.friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecommended = getRecommendedUsers().filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = requests.filter(request => 
    (request.to_user.id === currentUser.id && 
      request.from_user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (request.from_user.id === currentUser.id && 
      request.to_user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingRequestsCount = requests.filter(req => req.to_user.id === currentUser.id).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-gray-800/50 px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Friends
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700/50 mb-4">
            <TabButton 
              label="Friends" 
              count={friends.length}
              active={activeTab === 'friends'} 
              onClick={() => setActiveTab('friends')} 
            />
            <TabButton 
              label="Requests" 
              count={pendingRequestsCount}
              active={activeTab === 'requests'} 
              onClick={() => setActiveTab('requests')} 
            />
            <TabButton 
              label="Discover" 
              active={activeTab === 'discover'} 
              onClick={() => setActiveTab('discover')} 
            />
          </div>

          {/* Content */}
          <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Friends Tab */}
                {activeTab === 'friends' && (
                  <div className="space-y-3">
                    {filteredFriends.length > 0 ? (
                      filteredFriends.map((friendData) => (
                        <div key={friendData.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg transform hover:scale-[1.02] transition-all duration-200">
                          <img
                            src={getAvatarUrl(friendData.friend.avatar)}
                            alt={friendData.friend.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-800"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-white">{friendData.friend.username}</div>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                              <span>{formatText(friendData.friend.training_level)}</span>
                              {friendData.friend.personality_type && (
                                <>
                                  <span>•</span>
                                  <span>{formatText(friendData.friend.personality_type)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleViewFriendProfile(friendData.friend)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-sm text-blue-400"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all text-sm text-red-400">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        message={searchQuery ? "No friends match your search" : "You don't have any friends yet"}
                        subtext={searchQuery ? "Try a different search term" : "Connect with others to grow your network"}
                      />
                    )}
                  </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    {/* Received Requests */}
                    {requests.filter(request => request.to_user.id === currentUser.id).length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Received Requests</h3>
                        <div className="space-y-2">
                          {requests
                            .filter(request => request.to_user.id === currentUser.id)
                            .filter(request => request.from_user.username.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((request) => (
                              <div key={request.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                                <img
                                  src={getAvatarUrl(request.from_user.avatar)}
                                  alt={request.from_user.username}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-800"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-white">{request.from_user.username}</div>
                                  <div className="text-sm text-gray-400">{formatText(request.from_user.training_level)}</div>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleViewFriendProfile(request.from_user)}
                                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-blue-400"
                                    title="View Profile"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleRespondToRequest(request.from_user.id, 'accept')}
                                    className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all text-green-400"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleRespondToRequest(request.from_user.id, 'reject')}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all text-red-400"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Sent Requests */}
                    {requests.filter(request => request.from_user.id === currentUser.id).length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Sent Requests</h3>
                        <div className="space-y-2">
                          {requests
                            .filter(request => request.from_user.id === currentUser.id)
                            .filter(request => request.to_user.username.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((request) => (
                              <div key={request.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                                <img
                                  src={getAvatarUrl(request.to_user.avatar)}
                                  alt={request.to_user.username}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-800"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-white">{request.to_user.username}</div>
                                  <div className="text-sm text-gray-400">{formatText(request.to_user.training_level)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleViewFriendProfile(request.to_user)}
                                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-blue-400"
                                    title="View Profile"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <div className="text-sm text-yellow-400 flex items-center gap-1">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                    Pending
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {filteredRequests.length === 0 && (
                      <EmptyState
                        message={searchQuery ? "No requests match your search" : "No pending requests"}
                        subtext={searchQuery ? "Try a different search term" : "Requests you send or receive will appear here"}
                      />
                    )}
                  </div>
                )}

                {/* Discover Tab */}
                {activeTab === 'discover' && (
                  <div className="space-y-3">
                    {filteredRecommended.length > 0 ? (
                      filteredRecommended.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg transform hover:scale-[1.02] transition-all duration-200">
                          <img
                            src={getAvatarUrl(user.avatar)}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-800"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-white">{user.username}</div>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                              <span>{formatText(user.training_level)}</span>
                              {user.personality_type && (
                                <>
                                  <span>•</span>
                                  <span>{formatText(user.personality_type)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleViewFriendProfile(user)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-blue-400"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleSendRequest(user.id)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-sm text-blue-400 flex items-center gap-1"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        message={searchQuery ? "No users match your search" : "No recommendations found"}
                        subtext={searchQuery ? "Try a different search term" : "We couldn't find any users to recommend right now"}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Preview Modal */}
      {selectedFriend && (
        <UserProfilePreviewModal
          isOpen={!!selectedFriend}
          onClose={handleCloseFriendProfile}
          userId={selectedFriend.id}
          username={selectedFriend.username}
        />
      )}
    </div>
  );
};

const TabButton = ({ label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 relative ${
      active ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'
    }`}
  >
    <div className="flex items-center gap-2">
      {label}
      {count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          active ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'
        }`}>
          {count}
        </span>
      )}
    </div>
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
    )}
  </button>
);

const EmptyState = ({ message, subtext }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Users className="w-12 h-12 text-gray-600 mb-3" />
    <p className="text-lg text-gray-300">{message}</p>
    <p className="text-sm text-gray-500 mt-1">{subtext}</p>
  </div>
);

export default FriendsModal;