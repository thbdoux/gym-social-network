import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfilePreviewModal from './ProfilePreviewModal';
import {
  useFriends,
  useFriendRequests,
  useUsers,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useRemoveFriend,
} from '../../hooks/query/useUserQuery';

// Types
interface User {
  id: number;
  username: string;
  avatar?: string;
  training_level?: string;
  personality_type?: string;
}

interface FriendData {
  id: number;
  friend: User;
}

interface FriendRequest {
  id: number;
  from_user: User;
  to_user: User;
  status: string;
}

interface FriendsModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentUser?: User;
}

const FriendsModal: React.FC<FriendsModalProps> = ({
  isVisible,
  onClose,
  currentUser,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'discover'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  // Fetch data using React Query hooks
  const {
    data: friends = [],
    isLoading: friendsLoading,
    refetch: refetchFriends,
  } = useFriends({
    enabled: isVisible,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const {
    data: requests = [],
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useFriendRequests({
    enabled: isVisible,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const {
    data: allUsers = [],
    isLoading: usersLoading,
  } = useUsers({
    enabled: isVisible && activeTab === 'discover',
    refetchOnMount: true,
  });

  // Mutations for friend actions
  const sendFriendRequestMutation = useSendFriendRequest();
  const respondToFriendRequestMutation = useRespondToFriendRequest();
  const removeFriendMutation = useRemoveFriend();

  // Effect to refresh data when modal opens
  useEffect(() => {
    if (isVisible) {
      refetchFriends();
      refetchRequests();
    }
  }, [isVisible, refetchFriends, refetchRequests]);

  // Combined loading state
  const loading =
    friendsLoading ||
    requestsLoading ||
    (activeTab === 'discover' && usersLoading);

  // Format text utility
  const formatText = (text?: string): string => {
    if (!text) return '';
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get avatar source with fallback
  const getAvatarSource = (avatar?: string) => {
    if (avatar) {
      return { uri: avatar };
    }
    return require('../../assets/images/dou.svg'); // Make sure this default image exists
  };

  // Get initials for avatar fallback
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Process users for the discover tab
  const getRecommendedUsers = () => {
    if (!currentUser?.id || !Array.isArray(allUsers) || !Array.isArray(friends) || !Array.isArray(requests)) {
      return [];
    }

    const currentUserId = currentUser.id;

    // Create sets for faster lookup
    const friendIds = new Set(friends.map((f: FriendData) => f.friend?.id));

    // Create a set of all user IDs that have pending requests in either direction
    const pendingRequestUserIds = new Set();

    // Add all users involved in requests with the current user
    requests.forEach((req: FriendRequest) => {
      if (req.status === 'pending') {
        if (req.from_user.id === currentUserId) {
          pendingRequestUserIds.add(req.to_user.id);
        } else if (req.to_user.id === currentUserId) {
          pendingRequestUserIds.add(req.from_user.id);
        }
      }
    });

    // Filter users
    return allUsers.filter(
      (user: User) =>
        user.id !== currentUserId &&
        !friendIds.has(user.id) &&
        !pendingRequestUserIds.has(user.id)
    );
  };

  const recommendedUsers = getRecommendedUsers();

  // Friend request actions
  const handleFriendAction = async (actionType: string, userId: number) => {
    try {
      switch (actionType) {
        case 'send':
          await sendFriendRequestMutation.mutateAsync(userId, {
            onSuccess: () => {
              refetchFriends();
              refetchRequests();
            },
          });
          break;
        case 'accept':
        case 'reject':
        case 'cancel':
          await respondToFriendRequestMutation.mutateAsync({
            userId,
            response: actionType,
          }, {
            onSuccess: () => {
              refetchFriends();
              refetchRequests();
            },
          });
          break;
        case 'remove':
          await removeFriendMutation.mutateAsync(userId, {
            onSuccess: () => {
              refetchFriends();
            },
          });
          break;
        default:
          console.warn(`Unknown action type: ${actionType}`);
          return;
      }

      // Switch to appropriate tab after action
      if (actionType === 'accept') {
        setActiveTab('friends');
      } else if (actionType === 'send') {
        setActiveTab('requests');
      }
    } catch (error) {
      console.error(`Error with friend action ${actionType}:`, error);
    }
  };

  // Profile viewing
  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileModalVisible(true);
  };

  const handleCloseProfile = () => {
    setIsProfileModalVisible(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  // Filter data based on search query
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();

    const filteredFriends = friends.filter((f: FriendData) =>
      f.friend?.username.toLowerCase().includes(query)
    );

    const receivedRequests = requests.filter((req: FriendRequest) =>
      req.to_user.id === currentUser?.id &&
      req.status === 'pending' &&
      req.from_user.username.toLowerCase().includes(query)
    );

    const sentRequests = requests.filter((req: FriendRequest) =>
      req.from_user.id === currentUser?.id &&
      req.status === 'pending' &&
      req.to_user.username.toLowerCase().includes(query)
    );

    const filteredRecommendations = recommendedUsers.filter((user: User) =>
      user.username.toLowerCase().includes(query)
    );

    return {
      friends: filteredFriends,
      received: receivedRequests,
      sent: sentRequests,
      recommended: filteredRecommendations,
    };
  };

  const filteredData = getFilteredData();

  // Components for rendering list items
  const FriendItem = ({ friend, onViewProfile, onRemoveFriend }: { 
    friend: User, 
    onViewProfile: () => void, 
    onRemoveFriend: () => void 
  }) => {
    const isLoading = 
      removeFriendMutation.isLoading && 
      removeFriendMutation.variables === friend.id;

    return (
      <View style={styles.itemContainer}>
        {friend.avatar ? (
          <Image source={getAvatarSource(friend.avatar)} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(friend.username)}</Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>{friend.username}</Text>
          <Text style={styles.userDetail}>
            {formatText(friend.training_level || '')}
            {friend.training_level && friend.personality_type && " • "}
            {formatText(friend.personality_type || '')}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={onViewProfile}
          >
            <Ionicons name="eye" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemoveFriend}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="person-remove" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const RequestItem = ({ request, type }: { request: FriendRequest, type: 'received' | 'sent' }) => {
    const user = type === 'received' ? request.from_user : request.to_user;
    const isLoading = 
      respondToFriendRequestMutation.isLoading && 
      respondToFriendRequestMutation.variables?.userId === user.id;

    return (
      <View style={styles.itemContainer}>
        {user.avatar ? (
          <Image source={getAvatarSource(user.avatar)} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(user.username)}</Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.userDetail}>
            {formatText(user.training_level || '')}
            {user.training_level && user.personality_type && " • "}
            {formatText(user.personality_type || '')}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewProfile(user)}
          >
            <Ionicons name="eye" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          
          {type === 'received' ? (
            <View style={styles.requestButtonsContainer}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleFriendAction('accept', user.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleFriendAction('reject', user.id)}
                disabled={isLoading}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pendingContainer}>
              <Text style={styles.pendingText}>Pending</Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleFriendAction('cancel', user.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const DiscoverItem = ({ user }: { user: User }) => {
    const isLoading = 
      sendFriendRequestMutation.isLoading && 
      sendFriendRequestMutation.variables === user.id;

    return (
      <View style={styles.itemContainer}>
        {user.avatar ? (
          <Image source={getAvatarSource(user.avatar)} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(user.username)}</Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.userDetail}>
            {formatText(user.training_level || '')}
            {user.training_level && user.personality_type && " • "}
            {formatText(user.personality_type || '')}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewProfile(user)}
          >
            <Ionicons name="eye" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleFriendAction('send', user.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="person-add" size={16} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const EmptyState = ({ 
    icon, 
    message, 
    action 
  }: { 
    icon: React.ReactNode, 
    message: string, 
    action?: { label: string; onPress: () => void } 
  }) => (
    <View style={styles.emptyContainer}>
      {icon}
      <Text style={styles.emptyMessage}>{message}</Text>
      {action && (
        <TouchableOpacity style={styles.emptyActionButton} onPress={action.onPress}>
          <Text style={styles.emptyActionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'friends':
        return (
          <FlatList
            data={filteredData.friends}
            keyExtractor={(item) => `friend-${item.id}`}
            renderItem={({ item }) => (
              <FriendItem
                friend={item.friend}
                onViewProfile={() => handleViewProfile(item.friend)}
                onRemoveFriend={() => handleFriendAction('remove', item.friend.id)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon={<Ionicons name="people" size={48} color="#6B7280" />}
                message={searchQuery ? "No friends match your search" : "You don't have any friends yet"}
                action={
                  !searchQuery
                    ? {
                        label: "Find Friends",
                        onPress: () => setActiveTab('discover'),
                      }
                    : undefined
                }
              />
            }
          />
        );

      case 'requests':
        const hasRequests = filteredData.received.length > 0 || filteredData.sent.length > 0;
        
        return (
          <>
            {hasRequests ? (
              <>
                {filteredData.received.length > 0 && (
                  <View style={styles.requestsSection}>
                    <Text style={styles.sectionTitle}>Received Requests</Text>
                    <FlatList
                      data={filteredData.received}
                      keyExtractor={(item) => `received-${item.id}`}
                      renderItem={({ item }) => (
                        <RequestItem request={item} type="received" />
                      )}
                      scrollEnabled={false}
                    />
                  </View>
                )}
                
                {filteredData.sent.length > 0 && (
                  <View style={styles.requestsSection}>
                    <Text style={styles.sectionTitle}>Sent Requests</Text>
                    <FlatList
                      data={filteredData.sent}
                      keyExtractor={(item) => `sent-${item.id}`}
                      renderItem={({ item }) => (
                        <RequestItem request={item} type="sent" />
                      )}
                      scrollEnabled={false}
                    />
                  </View>
                )}
              </>
            ) : (
              <EmptyState
                icon={<Ionicons name="time" size={48} color="#6B7280" />}
                message={searchQuery ? "No requests match your search" : "No pending friend requests"}
                action={
                  !searchQuery
                    ? {
                        label: "Find Friends",
                        onPress: () => setActiveTab('discover'),
                      }
                    : undefined
                }
              />
            )}
          </>
        );

      case 'discover':
        return (
          <FlatList
            data={filteredData.recommended}
            keyExtractor={(item) => `discover-${item.id}`}
            renderItem={({ item }) => <DiscoverItem user={item} />}
            ListEmptyComponent={
              <EmptyState
                icon={<Ionicons name="search" size={48} color="#6B7280" />}
                message={searchQuery ? "No users match your search" : "No recommendations available"}
              />
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'friends'
              ? 'Friends'
              : activeTab === 'requests'
              ? 'Friend Requests'
              : 'Discover Friends'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'friends'
                ? 'Search friends...'
                : activeTab === 'requests'
                ? 'Search requests...'
                : 'Search people...'
            }
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Ionicons
              name="people"
              size={18}
              color={activeTab === 'friends' ? '#3B82F6' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'friends' && styles.activeTabText,
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Ionicons
              name="time"
              size={18}
              color={activeTab === 'requests' ? '#3B82F6' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'requests' && styles.activeTabText,
              ]}
            >
              Requests
              {(filteredData.received.length + filteredData.sent.length) > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {filteredData.received.length + filteredData.sent.length}
                  </Text>
                </View>
              )}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
            onPress={() => setActiveTab('discover')}
          >
            <Ionicons
              name="person-add"
              size={18}
              color={activeTab === 'discover' ? '#3B82F6' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'discover' && styles.activeTabText,
              ]}
            >
              Discover
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>

        {/* Profile Preview Modal */}
        {selectedUser && (
          <ProfilePreviewModal
            isVisible={isProfileModalVisible}
            onClose={handleCloseProfile}
            userId={selectedUser.id}
            initialUserData={selectedUser}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#1F2937',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 12,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#1F2937',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#3B82F6',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  badgeContainer: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMessage: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  emptyActionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 14,
    color: '#F59E0B',
    marginRight: 8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  requestsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 12,
  },
});

export default FriendsModal;