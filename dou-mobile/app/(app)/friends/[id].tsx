// app/(app)/friends/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import {
  useUser,
  useCurrentUser,
  useFriends,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useRemoveFriend,
} from '../../../hooks/query/useUserQuery';
import {
  useUserFriends,
} from '../../../hooks/query/useProfilePreviewQuery';

// Import components
import FriendsList from '../../../components/friends/FriendsList';

// Types
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

const HEADER_HEIGHT = 80;

export default function UserFriendsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { palette } = useTheme();
  const { id } = useLocalSearchParams();
  const userId = typeof id === 'string' ? parseInt(id) : 0;
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Get current user
  const { data: currentUser } = useCurrentUser();

  // Get current user's friends for friend action logic
  const {
    data: currentUserFriends = [],
    refetch: refetchCurrentUserFriends,
  } = useFriends({
    refetchOnMount: true,
  });

  // Get the user data whose friends we're viewing
  const {
    data: userData,
    isLoading: userLoading,
  } = useUser(userId, {
    enabled: !!userId,
  });

  // Fetch friends data using React Query hooks
  const {
    data: userFriends = [],
    isLoading: friendsLoading,
    refetch: refetchFriends,
  } = useUserFriends(userId, {
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Mutations for friend actions
  const sendFriendRequestMutation = useSendFriendRequest();
  const respondToFriendRequestMutation = useRespondToFriendRequest();
  const removeFriendMutation = useRemoveFriend();

  // Effect to refresh data when component mounts
  useEffect(() => {
    refetchFriends();
    refetchCurrentUserFriends();
  }, [refetchFriends, refetchCurrentUserFriends]);

  // Combined loading state
  const loading = userLoading || friendsLoading;

  // Convert user friends to the format expected by FriendsList
  const formattedFriends: FriendData[] = userFriends.map((friend: User) => ({
    id: friend.id,
    friend: friend,
  }));

  // Check if current user is friends with this friend
  const isCurrentUserFriend = (friendId: number): boolean => {
    return currentUserFriends.some((f: any) => f.friend?.id === friendId);
  };

  // Friend request actions - only allow removing if it's current user's own friend
  const handleFriendAction = async (actionType: string, friendId: number) => {
    try {
      // Only allow remove action if viewing own friends or if current user is friends with this person
      if (actionType === 'remove') {
        if (userId === currentUser?.id || isCurrentUserFriend(friendId)) {
          await removeFriendMutation.mutateAsync(friendId, {
            onSuccess: () => {
              refetchFriends();
              refetchCurrentUserFriends();
            },
          });
        }
      }
      // Add other friend actions as needed for mutual friends
    } catch (error) {
      console.error(`Error with friend action ${actionType}:`, error);
    }
  };

  // Profile viewing
  const navigateToProfile = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  // Filter friends based on search query
  const filteredFriends = formattedFriends.filter((friendData: FriendData) =>
    friendData.friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery(''); // Clear search when hiding
    }
  };

  // Determine if we should show friend actions (only for own friends or mutual friends)
  const shouldShowFriendActions = userId === currentUser?.id;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Fixed Header */}
      <View 
        style={[
          styles.headerContainer,
          { 
            backgroundColor: palette.page_background,
            borderColor: `${palette.border}66`,
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
            {userData?.username ? `${userData.username} - ${t('friends').toLowerCase()}` : t('friends')}
          </Text>
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: `${palette.accent}B3` }]} 
            onPress={toggleSearch}
          >
            <Ionicons name="search" size={20} color={palette.text} />
          </TouchableOpacity>
        </View>

        {/* Conditional Search Bar */}
        {showSearch && (
          <View style={[styles.searchContainer, { backgroundColor: `${palette.accent}B3` }]}>
            <Ionicons name="search" size={20} color={`${palette.text}80`} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: palette.text }]}
              placeholder={t('search_friends')}
              placeholderTextColor={`${palette.text}80`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={`${palette.text}80`} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[styles.content, { marginTop: showSearch ? HEADER_HEIGHT + 60 + 44 : HEADER_HEIGHT + 44 }]}>
        <FriendsList
          friends={filteredFriends}
          loading={loading}
          searchQuery={searchQuery}
          onNavigateToProfile={navigateToProfile}
          onFriendAction={shouldShowFriendActions ? handleFriendAction : () => {}}
          onDiscoverPress={() => router.push('/friends')}
          removeFriendMutation={shouldShowFriendActions ? removeFriendMutation : { isLoading: false, variables: null }}
        />
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
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 60,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
});