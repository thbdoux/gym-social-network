// app/(app)/friends.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import {
  useFriends,
  useFriendRequests,
  useUsers,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useRemoveFriend,
  useCurrentUser,
} from '../../hooks/query/useUserQuery';

// Import components
import FriendsList from '../../components/friends/FriendsList';
import RequestsList from '../../components/friends/RequestsList';
import DiscoverList from '../../components/friends/DiscoverList';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 80;
const SEARCH_HEIGHT = 60;
const TABS_HEIGHT = 60;

export default function FriendsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { palette } = useTheme();
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  
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

  // Scroll animation setup
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const threshold = 50;
      const opacity = Math.max(0, 1 - value / threshold);
      const translateY = Math.min(value * 0.5, threshold);
      
      headerOpacity.setValue(opacity);
      headerTranslateY.setValue(-translateY);
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, headerOpacity, headerTranslateY]);

  // Combined loading state
  const loading =
    friendsLoading ||
    requestsLoading ||
    (activeTab === 'discover' && usersLoading);

  // Process users for the discover tab
  const getRecommendedUsers = () => {
    if (!currentUser?.id || !Array.isArray(allUsers) || !Array.isArray(friends) || !Array.isArray(requests)) {
      return [];
    }

    const currentUserId = currentUser.id;
    const friendIds = new Set(friends.map((f: any) => f.friend?.id));
    const pendingRequestUserIds = new Set();

    requests.forEach((req: any) => {
      if (req.status === 'pending') {
        if (req.from_user.id === currentUserId) {
          pendingRequestUserIds.add(req.to_user.id);
        } else if (req.to_user.id === currentUserId) {
          pendingRequestUserIds.add(req.from_user.id);
        }
      }
    });

    return allUsers.filter(
      (user: any) =>
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
  const navigateToProfile = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  // Filter data based on search query
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();

    const filteredFriends = friends.filter((f: any) =>
      f.friend?.username.toLowerCase().includes(query)
    );

    const receivedRequests = requests.filter((req: any) =>
      req.to_user.id === currentUser?.id &&
      req.status === 'pending' &&
      req.from_user.username.toLowerCase().includes(query)
    );

    const sentRequests = requests.filter((req: any) =>
      req.from_user.id === currentUser?.id &&
      req.status === 'pending' &&
      req.to_user.username.toLowerCase().includes(query)
    );

    const filteredRecommendations = recommendedUsers.filter((user: any) =>
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

  // Tab change handler with animation
  const handleTabChange = (tab: 'friends' | 'requests' | 'discover') => {
    setActiveTab(tab);
    // Reset scroll position when changing tabs
    scrollY.setValue(0);
    headerOpacity.setValue(1);
    headerTranslateY.setValue(0);
  };

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'friends':
        return t('friends');
      case 'requests':
        return t('friend_requests');
      case 'discover':
        return t('discover_friends');
      default:
        return t('friends');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.headerContainer,
          { 
            backgroundColor: palette.page_background,
            borderColor: `${palette.border}66`,
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: `${palette.accent}B3` }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {getActiveTabTitle()}
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
            onPress={() => handleTabChange('friends')}
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
            onPress={() => handleTabChange('requests')}
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
            onPress={() => handleTabChange('discover')}
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
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'friends' && (
          <FriendsList
            friends={filteredData.friends}
            loading={loading}
            searchQuery={searchQuery}
            onNavigateToProfile={navigateToProfile}
            onFriendAction={handleFriendAction}
            onDiscoverPress={() => handleTabChange('discover')}
            removeFriendMutation={removeFriendMutation}
            scrollY={scrollY}
          />
        )}
        
        {activeTab === 'requests' && (
          <RequestsList
            receivedRequests={filteredData.received}
            sentRequests={filteredData.sent}
            loading={loading}
            searchQuery={searchQuery}
            onNavigateToProfile={navigateToProfile}
            onFriendAction={handleFriendAction}
            onDiscoverPress={() => handleTabChange('discover')}
            respondToFriendRequestMutation={respondToFriendRequestMutation}
            scrollY={scrollY}
          />
        )}
        
        {activeTab === 'discover' && (
          <DiscoverList
            users={filteredData.recommended}
            loading={loading}
            searchQuery={searchQuery}
            onNavigateToProfile={navigateToProfile}
            onFriendAction={handleFriendAction}
            sendFriendRequestMutation={sendFriendRequestMutation}
            scrollY={scrollY}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    paddingTop: 44, // Status bar height
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: HEADER_HEIGHT,
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
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: SEARCH_HEIGHT,
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
    height: TABS_HEIGHT,
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
    marginTop: HEADER_HEIGHT + SEARCH_HEIGHT + TABS_HEIGHT + 44, // Header + search + tabs + status bar
  },
});

// Export types for use in components
export interface User {
  id: number;
  username: string;
  avatar?: string;
  training_level?: string;
  personality_type?: string;
}

export interface FriendData {
  id: number;
  friend: User;
}

export interface FriendRequest {
  id: number;
  from_user: User;
  to_user: User;
  status: string;
}