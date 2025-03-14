import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Users, UserPlus, Search, Eye, 
  Check, CheckCircle, Clock, UserX, AlertCircle,
  Filter, ArrowRight
} from 'lucide-react';
import { userService } from '../../../api/services';
import { getAvatarUrl } from '../../../utils/imageUtils';
import ProfilePreviewModal from './ProfilePreviewModal';

const FriendsModal = ({ isOpen, onClose, currentUser }) => {
  // Core data states
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  
  // Profile preview modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Format text utility
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Fetch friend data
  const fetchFriendData = useCallback(async () => {
    if (!isOpen || !currentUser) return;
    
    try {
      setLoading(true);
      
      // Fetch data in parallel
      const [friendsResponse, requestsResponse, usersResponse] = await Promise.all([
        userService.getFriends(),
        userService.getFriendRequests(),
        userService.getAllUsers()
      ]);

      // Process friends
      const friendsList = Array.isArray(friendsResponse) ? friendsResponse : [];
      setFriends(friendsList);
      
      // Process requests
      const requestsList = Array.isArray(requestsResponse) 
        ? requestsResponse.filter(req => req.status === 'pending') 
        : [];
      setRequests(requestsList);
      
      // Process recommended users
      const allUsers = Array.isArray(usersResponse) ? usersResponse : [];
      const currentUserId = currentUser?.id;
      
      if (currentUserId) {
        // Create sets for faster lookup
        const friendIds = new Set(friendsList.map(f => f.friend?.id));
        
        const pendingSentIds = new Set(
          requestsList
            .filter(req => req.from_user.id === currentUserId)
            .map(req => req.to_user.id)
        );
        
        const pendingReceivedIds = new Set(
          requestsList
            .filter(req => req.to_user.id === currentUserId)
            .map(req => req.from_user.id)
        );
        
        // Filter recommended users
        const recommended = allUsers.filter(user => 
          user.id !== currentUserId && 
          !friendIds.has(user.id) && 
          !pendingSentIds.has(user.id) && 
          !pendingReceivedIds.has(user.id)
        );
        
        setRecommendedUsers(recommended);
      }
    } catch (error) {
      console.error('Error fetching friend data:', error);
    } finally {
      setLoading(false);
    }
  }, [isOpen, currentUser]);

  // Load data when modal opens
  useEffect(() => {
    fetchFriendData();
  }, [fetchFriendData]);

  // Friend request actions
  const handleFriendAction = async (actionType, userId) => {
    if (actionInProgress) return;
    
    try {
      setActionInProgress(userId);
      
      switch (actionType) {
        case 'send':
          await userService.sendFriendRequest(userId);
          break;
        case 'accept':
        case 'reject':
        case 'cancel':
          await userService.respondToFriendRequest(userId, actionType);
          break;
        case 'remove':
          await userService.removeFriend(userId);
          break;
        default:
          console.warn(`Unknown action type: ${actionType}`);
          return;
      }
      
      // Refresh data after action completes
      await fetchFriendData();
    } catch (error) {
      console.error(`Error with friend action ${actionType}:`, error);
    } finally {
      setActionInProgress(null);
    }
  };
  
  // Profile viewing
  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };
  
  const handleCloseProfile = () => {
    setIsProfileModalOpen(false);
    // Delay clearing data until animation completes
    setTimeout(() => setSelectedUser(null), 300);
  };

  // Filter data based on search query
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();
    
    // Friends tab data
    const filteredFriends = friends.filter(f => 
      f.friend?.username.toLowerCase().includes(query)
    );
    
    // Requests tab data
    const receivedRequests = requests.filter(req => 
      req.to_user.id === currentUser?.id &&
      req.from_user.username.toLowerCase().includes(query)
    );
    
    const sentRequests = requests.filter(req => 
      req.from_user.id === currentUser?.id &&
      req.to_user.username.toLowerCase().includes(query)
    );
    
    // Discover tab data
    const filteredRecommendations = recommendedUsers.filter(user => 
      user.username.toLowerCase().includes(query)
    );
    
    return {
      friends: filteredFriends,
      received: receivedRequests,
      sent: sentRequests,
      recommended: filteredRecommendations
    };
  };
  
  // Get filtered data
  const filteredData = getFilteredData();
  
  // Handle tab change
  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery(''); // Clear search when changing tabs
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-700/50 my-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-800/60 border-b border-gray-700/50 flex-shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {activeTab === 'friends' && (
                <>
                  <Users className="w-5 h-5 text-blue-400" />
                  Friends
                </>
              )}
              {activeTab === 'requests' && (
                <>
                  <Clock className="w-5 h-5 text-yellow-400" />
                  Friend Requests
                </>
              )}
              {activeTab === 'discover' && (
                <>
                  <UserPlus className="w-5 h-5 text-green-400" />
                  Discover Friends
                </>
              )}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Tabs */}
          <div className="p-5 border-b border-gray-700/30 bg-gray-800/20 flex-shrink-0">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder={
                  activeTab === 'friends' ? 'Search friends...' : 
                  activeTab === 'requests' ? 'Search requests...' : 
                  'Search people...'
                }
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
                onClick={() => changeTab('friends')} 
              />
              <TabButton 
                icon={<Clock className="w-4 h-4" />}
                label="Requests" 
                count={filteredData.received.length}
                active={activeTab === 'requests'} 
                onClick={() => changeTab('requests')} 
              />
              <TabButton 
                icon={<UserPlus className="w-4 h-4" />}
                label="Discover" 
                active={activeTab === 'discover'} 
                onClick={() => changeTab('discover')} 
              />
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto custom-scrollbar px-5 flex-grow">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">Loading...</span>
              </div>
            ) : (
              <div className="py-4">
                {/* Friends Tab */}
                {activeTab === 'friends' && (
                  <>
                    {filteredData.friends.length > 0 ? (
                      <div className="space-y-2">
                        {filteredData.friends.map((friendData) => (
                          <FriendCard
                            key={friendData.id}
                            friend={friendData.friend}
                            onViewProfile={() => handleViewProfile(friendData.friend)}
                            onRemoveFriend={() => handleFriendAction('remove', friendData.friend.id)}
                            isLoading={actionInProgress === friendData.friend.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<Users className="w-14 h-14 text-gray-600" />}
                        message={searchQuery ? "No friends match your search" : "You don't have any friends yet"}
                        subtext={searchQuery ? "Try a different search term" : "Discover new friends or respond to friend requests"}
                        action={searchQuery ? undefined : { 
                          label: "Find Friends", 
                          onClick: () => changeTab('discover') 
                        }}
                      />
                    )}
                  </>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    {/* Received Requests */}
                    {filteredData.received.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                          Received Requests
                        </h3>
                        <div className="space-y-2">
                          {filteredData.received.map((request) => (
                            <RequestCard
                              key={request.id}
                              user={request.from_user}
                              type="received"
                              onViewProfile={() => handleViewProfile(request.from_user)}
                              onAccept={() => handleFriendAction('accept', request.from_user.id)}
                              onReject={() => handleFriendAction('reject', request.from_user.id)}
                              isLoading={actionInProgress === request.from_user.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sent Requests */}
                    {filteredData.sent.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          Sent Requests
                        </h3>
                        <div className="space-y-2">
                          {filteredData.sent.map((request) => (
                            <RequestCard
                              key={request.id}
                              user={request.to_user}
                              type="sent"
                              onViewProfile={() => handleViewProfile(request.to_user)}
                              onCancel={() => handleFriendAction('cancel', request.to_user.id)}
                              isLoading={actionInProgress === request.to_user.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredData.received.length === 0 && filteredData.sent.length === 0 && (
                      <EmptyState
                        icon={<Clock className="w-14 h-14 text-gray-600" />}
                        message={searchQuery ? "No requests match your search" : "No pending requests"}
                        subtext={searchQuery ? "Try a different search term" : "Friend requests you send or receive will appear here"}
                        action={searchQuery ? undefined : { 
                          label: "Discover Friends", 
                          onClick: () => changeTab('discover') 
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Discover Tab */}
                {activeTab === 'discover' && (
                  <>
                    {filteredData.recommended.length > 0 ? (
                      <div className="space-y-2">
                        {filteredData.recommended.map((user) => (
                          <DiscoverCard
                            key={user.id}
                            user={user}
                            onViewProfile={() => handleViewProfile(user)}
                            onAddFriend={() => handleFriendAction('send', user.id)}
                            isLoading={actionInProgress === user.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<UserPlus className="w-14 h-14 text-gray-600" />}
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
          <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700/30 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {activeTab === 'friends' && (
                  <>{friends.length} {friends.length === 1 ? 'friend' : 'friends'}</>
                )}
                {activeTab === 'requests' && (
                  <>{filteredData.received.length} received, {filteredData.sent.length} sent</>
                )}
                {activeTab === 'discover' && (
                  <>{filteredData.recommended.length} suggestions</>
                )}
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

      {/* Profile Preview Modal */}
      <ProfilePreviewModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfile}
        userId={selectedUser?.id}
        initialUserData={selectedUser}
      />
    </>
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
    aria-selected={active}
    role="tab"
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
        aria-label="View Profile"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button 
        onClick={onRemoveFriend}
        disabled={isLoading}
        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all text-red-400 disabled:opacity-50"
        title="Remove Friend"
        aria-label="Remove Friend"
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
        aria-label="View Profile"
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
            aria-label="Accept Request"
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
            aria-label="Reject Request"
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
              aria-label="Cancel Request"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-t-transparent border-red-400 rounded-full animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
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
        aria-label="View Profile"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button 
        onClick={onAddFriend}
        disabled={isLoading}
        className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all text-green-400 flex items-center gap-1.5 disabled:opacity-50"
        aria-label="Add Friend"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-t-transparent border-green-400 rounded-full animate-spin" />
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
    <p className="text-lg text-gray-300 mt-3">{message}</p>
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