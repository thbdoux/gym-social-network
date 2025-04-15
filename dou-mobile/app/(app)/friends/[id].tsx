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
// Import ThemeContext
import { useTheme } from '../../../context/ThemeContext';

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
  
  // Use the theme context
  const { palette } = useTheme();
  
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
      <Text style={[styles.emptyMessage, { color: `${palette.text}80` }]}>{message}</Text>
    </View>
  );

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
          {userData?.username ? `${userData.username} - ${t('friends').toLowerCase()}` : t('friends')}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: `${palette.accent}B3` }]}>
        <Ionicons name="search" size={20} color={`${palette.text}80`} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: palette.text }]}
          placeholder={t('search_friends')}
          placeholderTextColor={`${palette.text}80`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.highlight} />
            <Text style={[styles.loadingText, { color: `${palette.text}80` }]}>{t('loading')}</Text>
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
                icon={<Ionicons name="people" size={48} color={`${palette.text}4D`} />}
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
    textAlign: 'center',
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
  },
});