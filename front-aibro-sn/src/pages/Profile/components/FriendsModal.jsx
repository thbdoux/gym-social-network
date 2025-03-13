import React, { useState, useEffect } from 'react';
import { 
  X, Users, UserPlus, Search, Eye, 
  Check, CheckCircle, Clock, UserX, AlertCircle
} from 'lucide-react';
import { userService } from '../../../api/services';
import { getAvatarUrl } from '../../../utils/imageUtils';

const FriendsModal = ({ isOpen, onClose, currentUser, onFriendClick }) => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchFriendData();
    }
  }, [isOpen, currentUser]);

  const fetchFriendData = async () => {
    try {
      setLoading(true);
      const [friendsList, requestsList, usersList] = await Promise.all([
        userService.getFriends(),
        userService.getFriendRequests(),
        userService.getAllUsers()
      ]);

      setFriends(Array.isArray(friendsList) ? friendsList : []);
      setRequests(Array.isArray(requestsList) ? requestsList.filter(req => req.status === 'pending') : []);
      setAllUsers(Array.isArray(usersList) ? usersList : []);
    } catch (error) {
      console.error('Error fetching friend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      setActionLoading(userId);
      await userService.sendFriendRequest(userId);
      await fetchFriendData();
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespondToRequest = async (userId, response) => {
    try {
      setActionLoading(userId);
      await userService.respondToFriendRequest(userId, response);
      await fetchFriendData();
    } catch (error) {
      console.error('Error responding to friend request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      setActionLoading(friendId);
      await userService.removeFriend(friendId);
      await fetchFriendData();
    } catch (error) {
      console.error('Error removing friend:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Get recommended users (not friends or pending)
  const getRecommendedUsers = () => {
    if (!currentUser?.id) return [];
    
    const friendIds = new Set(friends.map(f => f.friend?.id));
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
    
    return allUsers.filter(user => 
      user.id !== currentUser.id && 
      !friendIds.has(user.id) && 
      !pendingSentIds.has(user.id) && 
      !pendingReceivedIds.has(user.id)
    );
  };

  // Format text utility
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Apply search filter to all lists
  const filteredFriends = friends.filter(f => 
    f.friend?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecommended = getRecommendedUsers().filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const receivedRequests = requests.filter(req => 
    req.to_user.id === currentUser.id &&
    req.from_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sentRequests = requests.filter(req => 
    req.from_user.id === currentUser.id &&
    req.to_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800/60 border-b border-gray-700/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            {activeTab === 'friends' ? 'Friends' : 
             activeTab === 'requests' ? 'Friend Requests' : 'Discover Friends'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Tabs */}
        <div className="p-5 border-b border-gray-700/30 bg-gray-800/20">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder={`Search ${activeTab === 'friends' ? 'friends' : 
                          activeTab === 'requests' ? 'requests' : 'users'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700/40 border border-gray-700/50 rounded-lg pl-10 pr-4 py-2.5 
                        text-gray-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          </div>

          <div className="flex">
            <TabButton 
              icon={<Users className="w-4 h-4" />}
              label="Friends" 
              count={friends.length}
              active={activeTab === 'friends'} 
              onClick={() => setActiveTab('friends')} 
            />
            <TabButton 
              icon={<Clock className="w-4 h-4" />}
              label="Requests" 
              count={receivedRequests.length}
              active={activeTab === 'requests'} 
              onClick={() => setActiveTab('requests')} 
            />
            <TabButton 
              icon={<UserPlus className="w-4 h-4" />}
              label="Discover" 
              active={activeTab === 'discover'} 
              onClick={() => setActiveTab('discover')} 
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[400px] custom-scrollbar px-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="py-4">
              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <>
                  {filteredFriends.length > 0 ? (
                    <div className="grid gap-2">
                      {filteredFriends.map((friendData) => (
                        <FriendCard
                          key={friendData.id}
                          friend={friendData.friend}
                          onViewProfile={() => onFriendClick(friendData.friend)}
                          onRemoveFriend={() => handleRemoveFriend(friendData.friend.id)}
                          isLoading={actionLoading === friendData.friend.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Users className="w-14 h-14 text-gray-600 mb-3" />}
                      message={searchQuery ? "No friends match your search" : "You don't have any friends yet"}
                      subtext={searchQuery ? "Try a different search term" : "Discover new friends or respond to friend requests"}
                      action={searchQuery ? undefined : { 
                        label: "Find Friends", 
                        onClick: () => setActiveTab('discover') 
                      }}
                    />
                  )}
                </>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  {/* Received Requests */}
                  {receivedRequests.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        Received Requests
                      </h3>
                      <div className="grid gap-2">
                        {receivedRequests.map((request) => (
                          <RequestCard
                            key={request.id}
                            user={request.from_user}
                            type="received"
                            onViewProfile={() => onFriendClick(request.from_user)}
                            onAccept={() => handleRespondToRequest(request.from_user.id, 'accept')}
                            onReject={() => handleRespondToRequest(request.from_user.id, 'reject')}
                            isLoading={actionLoading === request.from_user.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent Requests */}
                  {sentRequests.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        Sent Requests
                      </h3>
                      <div className="grid gap-2">
                        {sentRequests.map((request) => (
                          <RequestCard
                            key={request.id}
                            user={request.to_user}
                            type="sent"
                            onViewProfile={() => onFriendClick(request.to_user)}
                            onCancel={() => handleRespondToRequest(request.to_user.id, 'cancel')}
                            isLoading={actionLoading === request.to_user.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {receivedRequests.length === 0 && sentRequests.length === 0 && (
                    <EmptyState
                      icon={<Clock className="w-14 h-14 text-gray-600 mb-3" />}
                      message={searchQuery ? "No requests match your search" : "No pending requests"}
                      subtext={searchQuery ? "Try a different search term" : "Friend requests you send or receive will appear here"}
                    />
                  )}
                </div>
              )}

              {/* Discover Tab */}
              {activeTab === 'discover' && (
                <>
                  {filteredRecommended.length > 0 ? (
                    <div className="grid gap-2">
                      {filteredRecommended.map((user) => (
                        <DiscoverCard
                          key={user.id}
                          user={user}
                          onViewProfile={() => onFriendClick(user)}
                          onAddFriend={() => handleSendRequest(user.id)}
                          isLoading={actionLoading === user.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<UserPlus className="w-14 h-14 text-gray-600 mb-3" />}
                      message={searchQuery ? "No users match your search" : "No recommendations found"}
                      subtext={searchQuery ? "Try a different search term" : "We couldn't find any users to recommend right now"}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700/30">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {activeTab === 'friends' ? `${friends.length} friends` : 
               activeTab === 'requests' ? `${receivedRequests.length} received, ${sentRequests.length} sent` : 
               `${filteredRecommended.length} suggestions`}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab button component
const TabButton = ({ icon, label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 relative transition-colors ${
      active 
        ? 'text-blue-400 bg-blue-900/10 rounded-t-lg' 
        : 'text-gray-400 hover:text-gray-200'
    }`}
  >
    {icon}
    <span>{label}</span>
    {count > 0 && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
        active ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'
      }`}>
        {count}
      </span>
    )}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
    )}
  </button>
);

// Friend card component
const FriendCard = ({ friend, onViewProfile, onRemoveFriend, isLoading }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-800/40 hover:bg-gray-800/60 rounded-lg transition-all duration-200">
    <img
      src={getAvatarUrl(friend.avatar)}
      alt={friend.username}
      className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
    />
    <div className="flex-1 min-w-0">
      <div className="font-medium text-white truncate">{friend.username}</div>
      <div className="text-xs text-gray-400 truncate">
        {friend.training_level && formatText(friend.training_level)}
        {friend.training_level && friend.personality_type && " • "}
        {friend.personality_type && formatText(friend.personality_type)}
      </div>
    </div>
    <div className="flex gap-2">
      <button 
        onClick={onViewProfile}
        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-blue-400"
        title="View Profile"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button 
        onClick={onRemoveFriend}
        disabled={isLoading}
        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all text-red-400 disabled:opacity-50"
        title="Remove Friend"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-t-transparent border-red-400 rounded-full animate-spin" />
        ) : (
          <UserX className="w-4 h-4" />
        )}
      </button>
    </div>
  </div>
);

// Request card component
const RequestCard = ({ user, type, onViewProfile, onAccept, onReject, onCancel, isLoading }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-800/40 hover:bg-gray-800/60 rounded-lg transition-all duration-200">
    <img
      src={getAvatarUrl(user.avatar)}
      alt={user.username}
      className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
    />
    <div className="flex-1 min-w-0">
      <div className="font-medium text-white truncate">{user.username}</div>
      <div className="text-xs text-gray-400 truncate">
        {user.training_level && formatText(user.training_level)}
        {user.training_level && user.personality_type && " • "}
        {user.personality_type && formatText(user.personality_type)}
      </div>
    </div>
    <div className="flex gap-2">
      <button 
        onClick={onViewProfile}
        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-blue-400"
        title="View Profile"
      >
        <Eye className="w-4 h-4" />
      </button>
      
      {type === 'received' ? (
        <>
          <button 
            onClick={onAccept}
            disabled={isLoading}
            className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-all text-green-400 disabled:opacity-50"
            title="Accept Request"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-green-400 rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
          </button>
          <button 
            onClick={onReject}
            disabled={isLoading}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all text-red-400 disabled:opacity-50"
            title="Reject Request"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all text-red-400 disabled:opacity-50"
              title="Cancel Request"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

// Discover card component
const DiscoverCard = ({ user, onViewProfile, onAddFriend, isLoading }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-800/40 hover:bg-gray-800/60 rounded-lg transition-all duration-200">
    <img
      src={getAvatarUrl(user.avatar)}
      alt={user.username}
      className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
    />
    <div className="flex-1 min-w-0">
      <div className="font-medium text-white truncate">{user.username}</div>
      <div className="text-xs text-gray-400 truncate">
        {user.training_level && formatText(user.training_level)}
        {user.training_level && user.personality_type && " • "}
        {user.personality_type && formatText(user.personality_type)}
      </div>
    </div>
    <div className="flex gap-2">
      <button 
        onClick={onViewProfile}
        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-blue-400"
        title="View Profile"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button 
        onClick={onAddFriend}
        disabled={isLoading}
        className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-blue-400 flex items-center gap-1.5 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-t-transparent border-blue-400 rounded-full animate-spin" />
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            <span className="text-sm">Add</span>
          </>
        )}
      </button>
    </div>
  </div>
);

// Empty state component
const EmptyState = ({ icon, message, subtext, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon}
    <p className="text-lg text-gray-300">{message}</p>
    <p className="text-sm text-gray-500 mt-1">{subtext}</p>
    {action && (
      <button 
        onClick={action.onClick}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-all"
      >
        {action.label}
      </button>
    )}
  </div>
);

// Format text utility
const formatText = (text) => {
  if (!text) return '';
  return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default FriendsModal;