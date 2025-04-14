// app/(app)/friends/[id].tsx
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useUser,
  useCurrentUser,
} from '../../../hooks/query/useUserQuery';
import {
  useUserFriends,
} from '../../../hooks/query/useProfilePreviewQuery';
import { getAvatarUrl } from '../../../utils/imageUtils';

// Types
interface Friend {
  id: number;
  username: string;
  avatar?: string;
  training_level?: string;
  personality_type?: string;
  [key: string]: any;
}

export default function UserFriendsPage() {
  // Get translation function
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const userId = typeof id === 'string' ? parseInt(id) : 0;
  // State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get current user
  const { data: currentUser } = useCurrentUser();

  // Get the user data whose friends we're viewing
  const {
    data: userData,
    isLoading: userLoading,
  } = useUser(userId, {
    enabled: !!userId,
  });

  // Fetch friends data using React Query hooks
  const {
    data: friends = [],
    isLoading: friendsLoading,
    refetch: refetchFriends,
  } = useUserFriends(userId, {
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Effect to refresh data when component mounts
  useEffect(() => {
    refetchFriends();
  }, [refetchFriends]);

  // Combined loading state
  const loading = userLoading || friendsLoading;

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

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend: Friend) =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigate to a user's profile
  const navigateToProfile = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  // Components for rendering list items
  const FriendItem = ({ friend, onViewProfile }: { 
    friend: Friend,
    onViewProfile: () => void, 
  }) => {
    return (
      <View style={styles.itemContainer}>
        {friend.avatar ? (
          <Image source={{ uri: getAvatarUrl(friend.avatar, 80) }} style={styles.avatar} />
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
        </View>
      </View>
    );
  };

  const EmptyState = ({ 
    icon, 
    message 
  }: { 
    icon: React.ReactNode, 
    message: string
  }) => (
    <View style={styles.emptyContainer}>
      {icon}
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {userData?.username ? `${userData.username} - ${t('friends').toLowerCase()}` : t('friends')}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_friends')}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => `friend-${item.id}`}
            renderItem={({ item }) => (
              <FriendItem
                friend={item}
                onViewProfile={() => navigateToProfile(item.id)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon={<Ionicons name="people" size={48} color="#6B7280" />}
                message={searchQuery ? t('no_friends_match_search') : t('no_friends')}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(31, 41, 55, 0.4)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
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
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
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
    backgroundColor: '#a855f7',
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
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});