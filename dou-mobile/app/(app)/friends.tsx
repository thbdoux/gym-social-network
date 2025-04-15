// app/(app)/friends.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'expo-router';
import {
  useFriends,
  useFriendRequests,
  useUsers,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useRemoveFriend,
  useCurrentUser,
} from '../../hooks/query/useUserQuery';
import { getAvatarUrl } from '../../utils/imageUtils';
// Import ThemeContext
import { useTheme } from '../../context/ThemeContext';

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

export default function FriendsPage() {
  // Get translation function
  const { t } = useLanguage();
  const router = useRouter();
  
  // Use the theme context
  const { palette } = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'discover'>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  // Get current user
  const { data: currentUser } = useCurrentUser();

  // Fetch data using React Query hooks
  const {
    data: friends = [],
    isLoading: friendsLoading,
    refetch: refetchFriends,
  } = useFriends({
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const {
    data: requests = [],
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useFriendRequests({
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const {
    data: allUsers = [],
    isLoading: usersLoading,
  } = useUsers({
    enabled: activeTab === 'discover',
    refetchOnMount: true,
  });

  // Mutations for friend actions
  const sendFriendRequestMutation = useSendFriendRequest();
  const respondToFriendRequestMutation = useRespondToFriendRequest();
  const removeFriendMutation = useRemoveFriend();

  // Effect to refresh data when component mounts
  useEffect(() => {
    refetchFriends();
    refetchRequests();
  }, [refetchFriends, refetchRequests]);

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

  // Profile viewing - navigate to dedicated profile page
  const navigateToProfile = (userId: number) => {
    router.push(`/user/${userId}`);
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
      <View style={[styles.itemContainer, { backgroundColor: `${palette.accent}B3` }]}>
        {friend.avatar ? (
          <Image source={{ uri: getAvatarUrl(friend.avatar, 80) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: palette.highlight }]}>
            <Text style={styles.avatarText}>{getInitials(friend.username)}</Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: palette.text }]}>{friend.username}</Text>
          <Text style={[styles.userDetail, { color: `${palette.text}80` }]}>
            {formatText(friend.training_level || '')}
            {friend.training_level && friend.personality_type && " • "}
            {formatText(friend.personality_type || '')}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: palette.highlight }]}
            onPress={onViewProfile}
          >
            <Ionicons name="eye" size={18} color={palette.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemoveFriend}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={palette.text} />
            ) : (
              <Ionicons name="person-remove" size={18} color={palette.text} />
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
      <View style={[styles.itemContainer, { backgroundColor: `${palette.accent}B3` }]}>
        {user.avatar ? (
          <Image source={{ uri: getAvatarUrl(user.avatar, 80) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: palette.highlight }]}>
            <Text style={styles.avatarText}>{getInitials(user.username)}</Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: palette.text }]}>{user.username}</Text>
          <Text style={[styles.userDetail, { color: `${palette.text}80` }]}>
            {formatText(user.training_level || '')}
            {user.training_level && user.personality_type && " • "}
            {formatText(user.personality_type || '')}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: palette.highlight }]}
            onPress={() => navigateToProfile(user.id)}
          >
            <Ionicons name="eye" size={18} color={palette.text} />
          </TouchableOpacity>
          
          {type === 'received' ? (
            <View style={styles.requestButtonsContainer}>
              <TouchableOpacity
                style={[styles.acceptButton, { backgroundColor: '#10B981' }]}
                onPress={() => handleFriendAction('accept', user.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={palette.text} />
                ) : (
                  <Ionicons name="checkmark" size={18} color={palette.text} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.rejectButton, { backgroundColor: '#EF4444' }]}
                onPress={() => handleFriendAction('reject', user.id)}
                disabled={isLoading}
              >
                <Ionicons name="close" size={18} color={palette.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pendingContainer}>
              <Text style={[styles.pendingText, { color: palette.highlight }]}>{t('pending')}</Text>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: '#EF4444' }]}
                onPress={() => handleFriendAction('cancel', user.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={palette.text} />
                ) : (
                  <Ionicons name="close" size={18} color={palette.text} />
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
      <View style={[styles.itemContainer, { backgroundColor: `${palette.accent}B3` }]}>
        {user.avatar ? (
          <Image source={{ uri: getAvatarUrl(user.avatar, 80) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: palette.highlight }]}>
            <Text style={styles.avatarText}>{getInitials(user.username)}</Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: palette.text }]}>{user.username}</Text>
          <Text style={[styles.userDetail, { color: `${palette.text}80` }]}>
            {formatText(user.training_level || '')}
            {user.training_level && user.personality_type && " • "}
            {formatText(user.personality_type || '')}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: palette.highlight }]}
            onPress={() => navigateToProfile(user.id)}
          >
            <Ionicons name="eye" size={18} color={palette.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#10B981' }]}
            onPress={() => handleFriendAction('send', user.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={palette.text} />
            ) : (
              <>
                <Ionicons name="person-add" size={16} color={palette.text} />
                <Text style={[styles.addButtonText, { color: palette.text }]}>{t('add_friend')}</Text>
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
      <Text style={[styles.emptyMessage, { color: `${palette.text}80` }]}>{message}</Text>
      {action && (
        <TouchableOpacity 
          style={[styles.emptyActionButton, { backgroundColor: palette.highlight }]} 
          onPress={action.onPress}
        >
          <Text style={[styles.emptyActionText, { color: palette.text }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.highlight} />
          <Text style={[styles.loadingText, { color: `${palette.text}80` }]}>{t('loading')}</Text>
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
                onViewProfile={() => navigateToProfile(item.friend.id)}
                onRemoveFriend={() => handleFriendAction('remove', item.friend.id)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon={<Ionicons name="people" size={48} color={`${palette.text}4D`} />}
                message={searchQuery ? t('no_friends_match_search') : t('no_friends')}
                action={
                  !searchQuery
                    ? {
                        label: t('find_friends'),
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
                    <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('received_requests')}</Text>
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
                    <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('sent_requests')}</Text>
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
                icon={<Ionicons name="time" size={48} color={`${palette.text}4D`} />}
                message={searchQuery ? t('no_requests_match_search') : t('no_friend_requests')}
                action={
                  !searchQuery
                    ? {
                        label: t('find_friends'),
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
                icon={<Ionicons name="search" size={48} color={`${palette.text}4D`} />}
                message={searchQuery ? t('no_users_match_search') : t('no_recommendations')}
              />
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { borderColor: `${palette.border}66` }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: `${palette.accent}B3` }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          {activeTab === 'friends'
            ? t('friends')
            : activeTab === 'requests'
            ? t('friend_requests')
            : t('discover_friends')}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: `${palette.accent}B3` }]}>
        <Ionicons name="search" size={20} color={`${palette.text}80`} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: palette.text }]}
          placeholder={
            activeTab === 'friends'
              ? t('search_friends')
              : activeTab === 'requests'
              ? t('search_requests')
              : t('search_people')
          }
          placeholderTextColor={`${palette.text}80`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderColor: `${palette.border}66` }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && [styles.activeTab, { borderColor: palette.highlight }]]}
          onPress={() => setActiveTab('friends')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'friends' ? palette.highlight : `${palette.text}80`}
          />
          <Text
            style={[
              styles.tabText,
              { color: `${palette.text}80` },
              activeTab === 'friends' && [styles.activeTabText, { color: palette.highlight }],
            ]}
          >
            {t('friends')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && [styles.activeTab, { borderColor: palette.highlight }]]}
          onPress={() => setActiveTab('requests')}
        >
          <Ionicons
            name="time"
            size={18}
            color={activeTab === 'requests' ? palette.highlight : `${palette.text}80`}
          />
          <Text
            style={[
              styles.tabText,
              { color: `${palette.text}80` },
              activeTab === 'requests' && [styles.activeTabText, { color: palette.highlight }],
            ]}
          >
            {t('friend_requests')}
            {(filteredData.received.length + filteredData.sent.length) > 0 && (
              <View style={[styles.badgeContainer, { backgroundColor: palette.highlight }]}>
                <Text style={styles.badgeText}>
                  {filteredData.received.length + filteredData.sent.length}
                </Text>
              </View>
            )}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && [styles.activeTab, { borderColor: palette.highlight }]]}
          onPress={() => setActiveTab('discover')}
        >
          <Ionicons
            name="person-add"
            size={18}
            color={activeTab === 'discover' ? palette.highlight : `${palette.text}80`}
          />
          <Text
            style={[
              styles.tabText,
              { color: `${palette.text}80` },
              activeTab === 'discover' && [styles.activeTabText, { color: palette.highlight }],
            ]}
          >
            {t('discover_friends')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
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
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: '500',
  },
  badgeContainer: {
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
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMessage: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionText: {
    fontWeight: '500',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 14,
    marginRight: 8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  requestsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
});